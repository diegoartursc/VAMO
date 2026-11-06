/**
 * Taxas de câmbio usadas para converter gastos dos roteiros (ex.: CHF → USD).
 *
 * Formato em todo o sistema: 1 unidade da moeda = X moeda-base (BASE_CURRENCY).
 *
 * Onde ficam: tabela `currency_rates` (linha única "current"). Antes ficavam num
 * arquivo JSON no disco do servidor, que o Render apaga a cada deploy.
 *
 * Atualização automática: `refreshCurrencyRates()` busca a cotação do dia numa API
 * pública e gratuita, sem chave:
 *   1) open.er-api.com (ExchangeRate-API, atualiza 1x/dia, ~160 moedas)
 *   2) reserva: fawazahmed0/currency-api via jsDelivr (atualiza 1x/dia, ~200 moedas)
 * Só grava se a resposta for coerente (moedas suficientes, números positivos e sem
 * salto absurdo em relação à taxa anterior). Moeda que a API não trouxer mantém o
 * valor anterior. O admin pode corrigir à mão; a correção vale até a próxima busca diária (~24h).
 */
import prisma from './prisma';
import { BASE_CURRENCY, DEFAULT_RATES_TO_BASE } from '@vamo/shared/itinerary';

export type RatesMap = Record<string, number>;
export type RatesInfo = { base: string; rates: RatesMap; source: string; fetchedAt: string | null };

/** Moedas que o sistema usa (as mesmas da tabela do admin). */
export const SUPPORTED_CURRENCIES = Object.keys(DEFAULT_RATES_TO_BASE).sort();

const ROW_ID = 'current';
const CACHE_MS = 5 * 60 * 1000;
/** Variação máxima aceita num dia, por moeda (×20 para cima ou para baixo). Protege contra resposta quebrada. */
const MAX_JUMP = 20;
/** Mínimo de moedas suportadas que a API precisa trazer para a resposta valer. */
const MIN_COVERAGE = 0.8;

let cache: { at: number; info: RatesInfo } | null = null;

export function clearRatesCache() { cache = null; }

function defaults(): RatesInfo {
    return { base: BASE_CURRENCY, rates: { ...DEFAULT_RATES_TO_BASE, [BASE_CURRENCY]: 1 }, source: 'default', fetchedAt: null };
}

/** Taxas em uso: banco → padrão do código. Nunca lança erro. */
export async function getCurrentRates(): Promise<RatesInfo> {
    if (cache && Date.now() - cache.at < CACHE_MS) return cache.info;
    let info = defaults();
    try {
        const row = await prisma.currencyRates.findUnique({ where: { id: ROW_ID } });
        if (row && row.base === BASE_CURRENCY && row.rates && typeof row.rates === 'object') {
            info = {
                base: row.base,
                rates: { ...DEFAULT_RATES_TO_BASE, ...(row.rates as RatesMap), [BASE_CURRENCY]: 1 },
                source: row.source,
                fetchedAt: row.fetchedAt.toISOString(),
            };
        }
    } catch (err: any) {
        console.error('[rates] falha ao ler taxas do banco, usando padrão:', err?.message || err);
    }
    cache = { at: Date.now(), info };
    return info;
}

export async function saveRates(rates: RatesMap, source: string, fetchedAt: Date = new Date()): Promise<RatesInfo> {
    const clean: RatesMap = { ...rates, [BASE_CURRENCY]: 1 };
    await prisma.currencyRates.upsert({
        where: { id: ROW_ID },
        create: { id: ROW_ID, base: BASE_CURRENCY, rates: clean, source, fetchedAt },
        update: { base: BASE_CURRENCY, rates: clean, source, fetchedAt },
    });
    clearRatesCache();
    return { base: BASE_CURRENCY, rates: clean, source, fetchedAt: fetchedAt.toISOString() };
}

type Fetcher = (url: string) => Promise<{ ok: boolean; status: number; json: () => Promise<any> }>;

/**
 * Converte "1 BASE = X moeda" (formato das APIs) para "1 moeda = Y BASE" (formato do sistema),
 * só para as moedas suportadas, descartando valores inválidos.
 */
export function invertPerBase(perBase: Record<string, unknown>): RatesMap {
    const out: RatesMap = {};
    for (const code of SUPPORTED_CURRENCIES) {
        if (code === BASE_CURRENCY) continue;
        const v = Number(perBase[code] ?? perBase[code.toLowerCase()]);
        if (Number.isFinite(v) && v > 0) out[code] = Number((1 / v).toPrecision(6));
    }
    return out;
}

const PROVIDERS: Array<{ name: string; url: string; pick: (body: any) => Record<string, unknown> | null }> = [
    {
        name: 'open.er-api.com',
        url: `https://open.er-api.com/v6/latest/${BASE_CURRENCY}`,
        pick: (b) => (b?.result === 'success' && b?.base_code === BASE_CURRENCY ? b.rates : null),
    },
    {
        name: 'fawazahmed0/currency-api',
        url: `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${BASE_CURRENCY.toLowerCase()}.json`,
        pick: (b) => b?.[BASE_CURRENCY.toLowerCase()] ?? null,
    },
];

/**
 * Recusa resposta que não cobre moedas suficientes ou que muda alguma taxa de forma absurda.
 * O salto só é checado contra uma cotação real anterior (API ou admin): as taxas padrão do
 * código podem estar velhas e não servem de referência.
 */
export function validateFetched(next: RatesMap, previous: RatesMap, previousSource = 'api'): string | null {
    const needed = SUPPORTED_CURRENCIES.filter((c) => c !== BASE_CURRENCY);
    const covered = needed.filter((c) => next[c] != null).length;
    if (covered < Math.ceil(needed.length * MIN_COVERAGE)) return `only ${covered}/${needed.length} currencies`;
    if (previousSource === 'default') return null;
    for (const [code, v] of Object.entries(next)) {
        const old = previous[code];
        if (old && (v / old > MAX_JUMP || old / v > MAX_JUMP)) return `${code} jumped from ${old} to ${v}`;
    }
    return null;
}

/**
 * Busca a cotação do dia e grava. Tenta os provedores em ordem; o primeiro válido vence.
 * Moeda que a API não trouxer fica com o valor anterior.
 */
export async function refreshCurrencyRates(fetcher: Fetcher = fetch as any): Promise<{ ok: boolean; source?: string; updated?: number; error?: string }> {
    const current = await getCurrentRates();
    const errors: string[] = [];
    for (const p of PROVIDERS) {
        try {
            const res = await fetcher(p.url);
            if (!res.ok) { errors.push(`${p.name}: HTTP ${res.status}`); continue; }
            const perBase = p.pick(await res.json());
            if (!perBase) { errors.push(`${p.name}: unexpected response`); continue; }
            const fetched = invertPerBase(perBase);
            const problem = validateFetched(fetched, current.rates, current.source);
            if (problem) { errors.push(`${p.name}: ${problem}`); continue; }
            await saveRates({ ...current.rates, ...fetched }, `api:${p.name}`);
            return { ok: true, source: p.name, updated: Object.keys(fetched).length };
        } catch (err: any) {
            errors.push(`${p.name}: ${err?.message || err}`);
        }
    }
    const error = errors.join(' | ');
    console.error('[rates] não foi possível atualizar as cotações:', error);
    return { ok: false, error };
}

const REFRESH_EVERY_MS = 24 * 60 * 60 * 1000;
const CHECK_EVERY_MS = 60 * 60 * 1000;

/**
 * Busca se a última atualização (automática ou correção do admin) tem mais de ~24h,
 * ou se ainda não há nada no banco. A correção do admin vale até a próxima busca diária.
 */
export async function refreshIfStale(now: Date = new Date(), fetcher?: Fetcher) {
    const info = await getCurrentRates();
    const last = info.fetchedAt ? new Date(info.fetchedAt).getTime() : 0;
    if (now.getTime() - last < REFRESH_EVERY_MS - 5 * 60 * 1000) return { ok: true, skipped: true as const };
    return refreshCurrencyRates(fetcher);
}

/**
 * Agenda: confere de hora em hora e busca quando a última cotação automática passou de 24h.
 * Assim sobrevive a reinícios do servidor sem buscar várias vezes por dia.
 * Só em produção; CURRENCY_RATES_AUTO=false desliga.
 */
export function startCurrencyRatesScheduler(): void {
    if (process.env.NODE_ENV !== 'production' || process.env.CURRENCY_RATES_AUTO === 'false') {
        console.log('[rates] atualização automática desligada (só roda em produção)');
        return;
    }
    const tick = () => refreshIfStale()
        .then((r: any) => { if (!r.skipped) console.log(`[rates] cotações ${r.ok ? `atualizadas (${r.source}, ${r.updated} moedas)` : 'NÃO atualizadas'}`); })
        .catch((e) => console.error('[rates] falha no agendamento:', e?.message || e));
    setTimeout(tick, 60 * 1000);
    setInterval(tick, CHECK_EVERY_MS);
    console.log('[rates] atualização automática ligada (1x por dia)');
}

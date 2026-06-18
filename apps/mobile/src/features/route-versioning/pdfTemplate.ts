/**
 * VAMO — Roteiro Editável Pós-Compra (PDF template).
 *
 * Gera HTML *autônomo* (CSS inline) para `expo-print` converter em PDF.
 * Suporta duas variantes:
 *  - 'original'      → snapshot puro da venda, sem badges.
 *  - 'personalized'  → versão mesclada com a customização do viajante,
 *    com badges por item (Adicionado / Editado / Original) e
 *    `hiddenOriginalIds` excluídos.
 *
 * Princípios:
 *  - HTML self-contained: nenhum recurso externo (fontes/CSS/imagens
 *    remotas) — o PDF renderiza igual offline e em qualquer device.
 *  - Brand consistente: teal #28C9BF e navy #1A3263, mesmo da paleta
 *    mobile/site.
 *  - Sem mídia do viajante: apenas conteúdo textual entra no PDF
 *    (decisão explícita: arquivos pessoais ficam fora).
 *  - Escape sempre: todo texto vindo do snapshot/customização passa por
 *    `escapeHtml` antes de virar conteúdo.
 *  - Ordem fixa de seções (alinhada a MODULE_ORDER de @vamo/shared):
 *    Voos, Hospedagens, Passeios, Itinerário, Transporte, Restaurantes,
 *    Dicas, Gastos Extras, Checklist, [Meu checklist], [Arquivos], Custos.
 *  - Data formatada no caller: `generatedAtISO` é recebido como string
 *    ISO e formatado para `DD/MM/AAAA` no rodapé.
 */

import type { MergedItem, MergedItinerary } from './mergeEngine';
import { getCostReferences, formatMoney, formatTimeForAustraliaDisplay } from '@vamo/shared/itinerary';
import { convertToAud, summarizeInAud } from '../../utils/currencyConversion';

// ─── Tipos públicos ─────────────────────────────────────────────────

export type PdfVariant = 'original' | 'personalized';

export interface PdfBuildOpts {
    /** Roteiro vivo (ou snapshot enriquecido) — usado para metadados como
     * título, destino, duração e — quando variant='original' — para
     * popular as seções de conteúdo. */
    itinerary: any;
    /** Roteiro mesclado (snapshot + customization). Obrigatório quando
     * variant='personalized'; ignorado quando 'original'. */
    merged?: MergedItinerary | null;
    /** Versão do PDF a gerar. */
    variant: PdfVariant;
    /** Data/hora de geração em ISO; vem do caller para evitar drift de
     * timezone entre runs. Default: now no momento da chamada. */
    generatedAtISO?: string;
    travelerChecklist?: Array<{ item: string; category?: string; completed?: boolean }>;
    travelerFiles?: Array<{ title: string; category?: string; note?: string | null; originalFileName?: string | null }>;
    /** Taxas de câmbio (moeda → multiplicador p/ AUD) para a seção de custos
     * converter cada item à moeda de referência. Sem uma taxa, o PDF mantém
     * a moeda original e informa que o total AUD está indisponível. */
    rates?: Record<string, number>;
}

// ─── Helpers ────────────────────────────────────────────────────────

/**
 * Escapa caracteres especiais para HTML. Aplicar a TODO conteúdo
 * dinâmico — campos do snapshot vêm de input do criador e poderiam
 * conter '<', '>', '&', etc.
 */
function escapeHtml(value: unknown): string {
    if (value === null || value === undefined) return '';
    const s = typeof value === 'string' ? value : String(value);
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Trunca texto preservando palavras inteiras quando possível.
 * Usado no excerto de notas no header (variant=personalized).
 */
function truncate(value: string, max: number): string {
    if (!value) return '';
    if (value.length <= max) return value;
    const slice = value.slice(0, max);
    const lastSpace = slice.lastIndexOf(' ');
    return (lastSpace > max * 0.6 ? slice.slice(0, lastSpace) : slice) + '…';
}

/**
 * Formata ISO → `DD/MM/AAAA`. Tolerante: se a data for inválida, devolve
 * string vazia (o rodapé degrade graciosamente sem "Invalid Date").
 */
function formatDateBR(iso: string | undefined): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
}

/** Resolve o título/destino/duração a partir do itinerary. Tolerante a
 * shapes — tanto live quanto snapshot têm essas chaves no topo. */
function getMeta(itinerary: any): { title: string; destination: string; duration: string } {
    const title = itinerary?.title ?? itinerary?.name ?? 'Meu Roteiro';
    const destination = itinerary?.destination ?? itinerary?.location ?? '';
    const days = itinerary?.days ?? itinerary?.duration ?? itinerary?.tripDays;
    let duration = '';
    if (typeof days === 'number' && days > 0) {
        duration = `${days} ${days === 1 ? 'dia' : 'dias'}`;
    } else if (typeof days === 'string' && days.trim()) {
        duration = days;
    }
    return {
        title: escapeHtml(title),
        destination: escapeHtml(destination),
        duration: escapeHtml(duration),
    };
}

/**
 * Mapeia kind → rótulo do badge por origem (só usado em 'personalized').
 * 'original' não recebe badge (é o caso comum, evita poluição visual).
 */
function badgeForSource(source: MergedItem['source']): string {
    if (source === 'added') {
        return `<span class="badge badge-added">Adicionado</span>`;
    }
    if (source === 'edited') {
        return `<span class="badge badge-edited">Editado</span>`;
    }
    return '';
}

// ─── Renderers de item ──────────────────────────────────────────────
//
// Cada renderer recebe `data` (objeto do item, já mesclado) e devolve
// HTML de UM card. Quando variant='personalized', também recebe `source`
// para anexar o badge.
//
// Convenção: title em primeira linha, meta-info em segunda, descrição
// em parágrafo. Campos vazios são pulados (não rendem `<p></p>`).

function renderField(label: string, value: unknown): string {
    if (value === null || value === undefined) return '';
    const s = typeof value === 'string' ? value : String(value);
    if (!s.trim()) return '';
    return `<div class="field"><span class="field-label">${escapeHtml(label)}:</span> ${escapeHtml(s)}</div>`;
}

function renderParagraph(value: unknown): string {
    if (!value) return '';
    const s = typeof value === 'string' ? value : String(value);
    if (!s.trim()) return '';
    return `<p class="desc">${escapeHtml(s)}</p>`;
}

function renderAccommodation(data: any, source?: MergedItem['source']): string {
    const title = data?.name ?? 'Hospedagem';
    return `
        <div class="card">
            <div class="card-header">
                <h3>${escapeHtml(title)}</h3>
                ${source ? badgeForSource(source) : ''}
            </div>
            ${renderField('Endereço', data?.address)}
            ${renderField('Bairro', data?.neighborhood)}
            ${renderField('Faixa de preço', data?.priceRange)}
            ${renderField('Avaliação', data?.rating)}
            ${renderParagraph(data?.description)}
            ${data?.tips ? `<p class="tip"><strong>Dica:</strong> ${escapeHtml(data.tips)}</p>` : ''}
        </div>`;
}

function renderTransport(data: any, source?: MergedItem['source']): string {
    const title = data?.description ?? data?.title ?? 'Transporte';
    return `
        <div class="card">
            <div class="card-header">
                <h3>${escapeHtml(title)}</h3>
                ${source ? badgeForSource(source) : ''}
            </div>
            ${renderField('Tipos de passe', data?.passTypes)}
            ${renderField('Valor', data?.priceValue ? `${data?.priceCurrency ?? 'A$'} ${data.priceValue}` : '')}
            ${renderParagraph(data?.notes)}
        </div>`;
}

function renderAttraction(data: any, source?: MergedItem['source']): string {
    const title = data?.name ?? 'Passeio';
    return `
        <div class="card">
            <div class="card-header">
                <h3>${escapeHtml(title)}</h3>
                ${source ? badgeForSource(source) : ''}
            </div>
            ${renderField('Tipo', data?.type)}
            ${renderField('Localização', data?.location)}
            ${renderField('Ingresso', data?.ticketPrice)}
            ${renderField('Horário', formatTimeForAustraliaDisplay(data?.hours))}
            ${renderField('Duração', data?.duration)}
            ${renderParagraph(data?.description)}
            ${data?.tips ? `<p class="tip"><strong>Dica:</strong> ${escapeHtml(data.tips)}</p>` : ''}
        </div>`;
}

function renderRestaurant(data: any, source?: MergedItem['source']): string {
    const title = data?.name ?? 'Restaurante';
    return `
        <div class="card">
            <div class="card-header">
                <h3>${escapeHtml(title)}</h3>
                ${source ? badgeForSource(source) : ''}
            </div>
            ${renderField('Cozinha', data?.cuisine)}
            ${renderField('Localização', data?.location)}
            ${renderField('Faixa de preço', data?.priceRange)}
            ${renderField('Horário', formatTimeForAustraliaDisplay(data?.hours))}
            ${renderParagraph(data?.description)}
            ${data?.tips ? `<p class="tip"><strong>Dica:</strong> ${escapeHtml(data.tips)}</p>` : ''}
        </div>`;
}

function renderGeneralTip(data: any, source?: MergedItem['source']): string {
    const text = data?.text ?? data?.title ?? '';
    return `
        <div class="card tip-card">
            <div class="card-header">
                <p class="tip-text">${escapeHtml(text)}</p>
                ${source ? badgeForSource(source) : ''}
            </div>
        </div>`;
}

function renderChecklistItem(data: any, source?: MergedItem['source']): string {
    const item = data?.item ?? data?.text ?? '';
    const category = data?.category ?? '';
    return `
        <li class="checklist-item">
            <span class="check-box">☐</span>
            <span class="check-text">${escapeHtml(item)}</span>
            ${category ? `<span class="check-cat">${escapeHtml(category)}</span>` : ''}
            ${source ? badgeForSource(source) : ''}
        </li>`;
}

function renderExtraSpending(data: any, source?: MergedItem['source']): string {
    const title = data?.title ?? 'Gasto extra';
    // Normaliza ambos os shapes: o canônico `data.cost = { amount/value, currency }`
    // (criador + formulário do viajante) e o legado plano `data.value/currency`.
    // Sem isso, gastos salvos em `cost` saíam sem valor no card individual.
    const cost = data?.cost ?? null;
    const rawValue = cost?.amount ?? cost?.value ?? data?.value ?? null;
    const currency = cost?.currency ?? data?.currency ?? 'A$';
    const value = rawValue ? `${currency} ${rawValue}` : '';
    return `
        <div class="card">
            <div class="card-header">
                <h3>${escapeHtml(title)}</h3>
                ${source ? badgeForSource(source) : ''}
            </div>
            ${value ? renderField('Valor', value) : ''}
            ${renderParagraph(data?.description)}
        </div>`;
}

function renderFlight(data: any, label: string, source?: MergedItem['source']): string {
    return `
        <div class="card">
            <div class="card-header">
                <h3>${escapeHtml(label)}</h3>
                ${source ? badgeForSource(source) : ''}
            </div>
            ${renderField('Companhia', data?.airline)}
            ${renderField('Voo', data?.flightNumber)}
            ${renderField('Origem', data?.originAirport)}
            ${renderField('Destino', data?.destinationAirport)}
            ${renderField('Saída', [data?.departureDate, formatTimeForAustraliaDisplay(data?.departureTime)].filter(Boolean).join(' '))}
            ${renderField('Chegada', [data?.arrivalDate, formatTimeForAustraliaDisplay(data?.arrivalTime)].filter(Boolean).join(' '))}
            ${typeof data?.stops === 'number' ? renderField('Paradas', data.stops === 0 ? 'Direto' : String(data.stops)) : ''}
        </div>`;
}

function renderDayActivity(data: any, source?: MergedItem['source']): string {
    const title = data?.title ?? data?.name ?? 'Atividade';
    const icon = data?.icon ? `${escapeHtml(data.icon)} ` : '';
    return `
        <div class="activity">
            <div class="activity-header">
                <span class="activity-title">${icon}${escapeHtml(title)}</span>
                ${data?.time ? `<span class="activity-time">${escapeHtml(formatTimeForAustraliaDisplay(data.time))}</span>` : ''}
                ${source ? badgeForSource(source) : ''}
            </div>
            ${renderField('Local', data?.location)}
            ${renderField('Duração', data?.duration)}
            ${renderParagraph(data?.description)}
        </div>`;
}

// ─── Renderers de seção ────────────────────────────────────────────
//
// Recebem array de itens (ou MergedItem[]) e devolvem HTML completo de
// uma seção. Vazio → string vazia (não renderiza header inútil).

interface SectionContext {
    variant: PdfVariant;
    rates?: Record<string, number>;
}

function sectionWrapper(title: string, body: string): string {
    if (!body.trim()) return '';
    return `
        <section class="section">
            <h2 class="section-title">${escapeHtml(title)}</h2>
            ${body}
        </section>`;
}

function renderItineraryDays(itinerary: any, merged: MergedItinerary | null | undefined, ctx: SectionContext): string {
    // 'personalized' usa merged.days; 'original' usa itinerary.days direto.
    const days = ctx.variant === 'personalized'
        ? (merged?.days ?? [])
        : (Array.isArray(itinerary?.days) ? itinerary.days : []);
    if (!days.length) return '';

    const html = days.map((d: any) => {
        const num = typeof d?.dayNumber === 'number' ? d.dayNumber : '';
        const title = d?.title ? ` — ${escapeHtml(d.title)}` : '';
        const summary = d?.summary ? `<p class="day-summary">${escapeHtml(d.summary)}</p>` : '';
        const description = d?.description ? `<p class="day-desc">${escapeHtml(d.description)}</p>` : '';
        const activities = Array.isArray(d?.activities) ? d.activities : [];
        const activitiesHtml = activities.map((a: any) => {
            if (ctx.variant === 'personalized') {
                // MergedItem
                return renderDayActivity(a.data, a.source);
            }
            // Original cru — sem source
            return renderDayActivity(a);
        }).join('');
        return `
            <div class="day">
                <h3 class="day-title">Dia ${escapeHtml(num)}${title}</h3>
                ${summary}
                ${description}
                <div class="day-activities">${activitiesHtml}</div>
            </div>`;
    }).join('');

    return sectionWrapper('Itinerário', html);
}

function renderAccommodationsSection(itinerary: any, merged: MergedItinerary | null | undefined, ctx: SectionContext): string {
    if (ctx.variant === 'personalized') {
        const items = merged?.accommodations ?? [];
        if (!items.length) return '';
        return sectionWrapper('Hospedagens', items.map(m => renderAccommodation(m.data, m.source)).join(''));
    }
    const items = Array.isArray(itinerary?.accommodations) ? itinerary.accommodations : [];
    if (!items.length) return '';
    return sectionWrapper('Hospedagens', items.map((a: any) => renderAccommodation(a)).join(''));
}

function renderFlightsSection(itinerary: any, merged: MergedItinerary | null | undefined, ctx: SectionContext): string {
    if (ctx.variant === 'personalized') {
        const outbound = merged?.flightOutbound;
        const back = merged?.flightReturn;
        if (!outbound && !back) return '';
        const html = [
            outbound ? renderFlight(outbound.data, 'Voo de ida', outbound.source) : '',
            back ? renderFlight(back.data, 'Voo de volta', back.source) : '',
        ].join('');
        return sectionWrapper('Voos', html);
    }
    const flightInfo = itinerary?.flightInfo ?? {};
    const outbound = flightInfo?.outbound;
    const back = flightInfo?.return;
    if (!outbound && !back) return '';
    const html = [
        outbound ? renderFlight(outbound, 'Voo de ida') : '',
        back ? renderFlight(back, 'Voo de volta') : '',
    ].join('');
    return sectionWrapper('Voos', html);
}

function renderAttractionsSection(itinerary: any, merged: MergedItinerary | null | undefined, ctx: SectionContext): string {
    if (ctx.variant === 'personalized') {
        const items = merged?.attractions ?? [];
        if (!items.length) return '';
        return sectionWrapper('Passeios', items.map(m => renderAttraction(m.data, m.source)).join(''));
    }
    const items = Array.isArray(itinerary?.attractions) ? itinerary.attractions : [];
    if (!items.length) return '';
    return sectionWrapper('Passeios', items.map((a: any) => renderAttraction(a)).join(''));
}

function renderTransportsSection(itinerary: any, merged: MergedItinerary | null | undefined, ctx: SectionContext): string {
    if (ctx.variant === 'personalized') {
        const items = merged?.transports ?? [];
        if (!items.length) return '';
        return sectionWrapper('Transporte', items.map(m => renderTransport(m.data, m.source)).join(''));
    }
    const items = Array.isArray(itinerary?.transports) ? itinerary.transports : [];
    if (!items.length) return '';
    return sectionWrapper('Transporte', items.map((t: any) => renderTransport(t)).join(''));
}

function renderRestaurantsSection(itinerary: any, merged: MergedItinerary | null | undefined, ctx: SectionContext): string {
    if (ctx.variant === 'personalized') {
        const items = merged?.restaurants ?? [];
        if (!items.length) return '';
        return sectionWrapper('Restaurantes', items.map(m => renderRestaurant(m.data, m.source)).join(''));
    }
    const items = Array.isArray(itinerary?.restaurants) ? itinerary.restaurants : [];
    if (!items.length) return '';
    return sectionWrapper('Restaurantes', items.map((r: any) => renderRestaurant(r)).join(''));
}

function renderTipsSection(itinerary: any, merged: MergedItinerary | null | undefined, ctx: SectionContext): string {
    if (ctx.variant === 'personalized') {
        const items = merged?.generalTips ?? [];
        if (!items.length) return '';
        return sectionWrapper('Dicas', items.map(m => renderGeneralTip(m.data, m.source)).join(''));
    }
    const items = Array.isArray(itinerary?.generalTips) ? itinerary.generalTips : [];
    if (!items.length) return '';
    return sectionWrapper('Dicas', items.map((t: any) => renderGeneralTip(t)).join(''));
}

function renderChecklistSection(itinerary: any, merged: MergedItinerary | null | undefined, ctx: SectionContext): string {
    if (ctx.variant === 'personalized') {
        const items = merged?.checklistItems ?? [];
        if (!items.length) return '';
        const body = `<ul class="checklist">${items.map(m => renderChecklistItem(m.data, m.source)).join('')}</ul>`;
        return sectionWrapper('Checklist', body);
    }
    const items = Array.isArray(itinerary?.checklists)
        ? itinerary.checklists
        : (Array.isArray(itinerary?.checklist) ? itinerary.checklist : []);
    if (!items.length) return '';
    const body = `<ul class="checklist">${items.map((c: any) => renderChecklistItem(c)).join('')}</ul>`;
    return sectionWrapper('Checklist', body);
}

function renderTravelerChecklist(items: PdfBuildOpts['travelerChecklist'], variant: PdfVariant): string {
    if (variant !== 'personalized' || !items?.length) return '';
    const body = `<ul class="checklist">${items.map(item => `
        <li class="checklist-item">
            ${item.completed ? '✓' : '○'} ${escapeHtml(item.item)}
            ${item.category ? `<span class="field-label"> · ${escapeHtml(item.category)}</span>` : ''}
        </li>`).join('')}</ul>`;
    return sectionWrapper('Meu checklist', body);
}

function renderTravelerFiles(items: PdfBuildOpts['travelerFiles'], variant: PdfVariant): string {
    if (variant !== 'personalized' || !items?.length) return '';
    const body = items.map(file => `
        <div class="card">
            <div class="card-header"><h3>${escapeHtml(file.title)}</h3></div>
            ${renderField('Categoria', file.category)}
            ${renderField('Arquivo', file.originalFileName)}
            ${renderParagraph(file.note)}
        </div>`).join('');
    return sectionWrapper('Arquivos da viagem', body);
}

function renderExtraSpendingSection(itinerary: any, merged: MergedItinerary | null | undefined, ctx: SectionContext): string {
    if (ctx.variant === 'personalized') {
        const items = merged?.extraSpendingItems ?? [];
        if (!items.length) return '';
        return sectionWrapper('Gastos Extras', items.map(m => renderExtraSpending(m.data, m.source)).join(''));
    }
    const items = Array.isArray(itinerary?.extraSpendingItems) ? itinerary.extraSpendingItems : [];
    if (!items.length) return '';
    return sectionWrapper('Gastos Extras', items.map((e: any) => renderExtraSpending(e)).join(''));
}

/**
 * Seção de custos do PDF — USA A MESMA FONTE QUE A TELA (`getCostReferences`
 * de @vamo/shared) sobre os MESMOS arrays:
 *   - 'original'     → arrays do snapshot/itinerary;
 *   - 'personalized' → arrays do merged (com edições/adições/ocultações).
 *
 * Cada item sai na moeda original informada + conversão "≈ A$" (taxas do
 * caller). O total é multi-moeda-safe: soma o valor por pessoa de cada item
 * convertido para AUD (nunca soma JPY+AUD cru). Espelha exatamente a
 * "Referência de Gastos por Pessoa" da tela do roteiro comprado.
 */
function renderCostReferenceSection(
    itinerary: any,
    merged: MergedItinerary | null | undefined,
    ctx: SectionContext,
): string {
    const useMerged = ctx.variant === 'personalized' && !!merged;
    const pick = (mergedArr: MergedItem[] | undefined, itinArr: any): any[] =>
        useMerged
            ? (mergedArr ?? []).map(m => m.data)
            : (Array.isArray(itinArr) ? itinArr : []);

    const costForm = {
        accommodations: pick(merged?.accommodations, itinerary?.accommodations),
        attractions: pick(merged?.attractions, itinerary?.attractions),
        transports: pick(merged?.transports, itinerary?.transports),
        restaurants: pick(merged?.restaurants, itinerary?.restaurants),
        extraSpendingItems: pick(merged?.extraSpendingItems, itinerary?.extraSpendingItems),
        // Voo ainda vem do snapshot (viajante não edita custo de voo hoje).
        flightCost: itinerary?.flightInfo?.cost,
        flightSpending: itinerary?.flightInfo?.spending,
    };

    const groups = getCostReferences(costForm as any);
    if (!groups.length) return '';

    const rates = ctx.rates ?? {};
    const allItems = groups.flatMap(group => group.items);
    const convertedSummary = summarizeInAud(
        allItems.map(item => ({
            amount: item.amountPerPerson,
            currency: item.currency,
        })),
        rates,
    );

    const groupsHtml = groups.map(group => {
        const itemsHtml = group.items.map(item => {
            const main = formatMoney(item.amountPerPerson, item.currency);
            const converted = convertToAud(item.amountPerPerson, item.currency, rates);
            const conv = item.currency !== 'AUD'
                ? converted === null
                    ? ' <span class="cost-conv">· cotação AUD indisponível</span>'
                    : ` <span class="cost-conv">≈ ${escapeHtml(formatMoney(converted, 'AUD'))}</span>`
                : '';
            const base = item.sharedByPeople > 1
                ? `<div class="cost-base">Base: ${escapeHtml(formatMoney(item.amountTotal, item.currency))} ÷ ${item.sharedByPeople} pessoas</div>`
                : '';
            return `
                <div class="cost-item">
                    <div class="cost-item-head">
                        <span class="cost-item-title">${escapeHtml(item.title)}</span>
                        <span class="cost-item-value">${escapeHtml(main)} / pessoa${conv}</span>
                    </div>
                    ${base}
                </div>`;
        }).join('');
        return `
            <div class="cost-group">
                <h3 class="cost-group-title">${escapeHtml(group.moduleLabel)}</h3>
                ${itemsHtml}
            </div>`;
    }).join('');

    const totalHtml = convertedSummary.missingCurrencies.length === 0
        ? `<div class="cost-total">Total estimado por pessoa <strong>${escapeHtml(formatMoney(convertedSummary.totalAud, 'AUD'))}</strong></div>`
        : `<div class="cost-total">Total em AUD indisponível: falta cotação para <strong>${escapeHtml(convertedSummary.missingCurrencies.join(', '))}</strong>.</div>`;
    const disclaimer = `<p class="cost-disclaimer">Valores de referência por pessoa, informados pelo criador ou por você. Podem variar por época, câmbio e disponibilidade.</p>`;

    return sectionWrapper('Custos e orçamento (referência por pessoa)', groupsHtml + totalHtml + disclaimer);
}

// ─── CSS ────────────────────────────────────────────────────────────
//
// Mantido inline para o PDF ser self-contained. Fonte usa system stack —
// expo-print no iOS/Android usa o WebView que tem San Francisco / Roboto.

const PDF_CSS = `
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }
    body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, system-ui, sans-serif;
        color: #1A3263;
        font-size: 12pt;
        line-height: 1.5;
        background: #fff;
        padding: 32px 36px 64px;
    }
    /* Header */
    .header {
        border-bottom: 3px solid #28C9BF;
        padding-bottom: 18px;
        margin-bottom: 24px;
        position: relative;
    }
    .header h1 {
        margin: 0 0 6px;
        font-size: 26pt;
        line-height: 1.15;
        color: #1A3263;
        font-weight: 700;
        padding-right: 180px;
    }
    .header .meta {
        font-size: 11pt;
        color: #4A5876;
        margin: 0;
    }
    .header .notes-excerpt {
        margin-top: 12px;
        padding: 10px 14px;
        background: #F4FBFB;
        border-left: 3px solid #28C9BF;
        color: #1A3263;
        font-size: 10pt;
        line-height: 1.5;
        border-radius: 4px;
    }
    .variant-badge {
        position: absolute;
        top: 0;
        right: 0;
        padding: 6px 12px;
        border-radius: 999px;
        font-size: 9pt;
        font-weight: 600;
        color: #fff;
        letter-spacing: 0.3px;
    }
    .variant-badge.original { background: #1A3263; }
    .variant-badge.personalized { background: #28C9BF; }
    /* Sections */
    .section {
        margin-bottom: 28px;
        page-break-inside: auto;
    }
    .section-title {
        font-size: 16pt;
        color: #1A3263;
        font-weight: 700;
        margin: 0 0 14px;
        padding-bottom: 6px;
        border-bottom: 2px solid #E0EAF0;
    }
    /* Custos */
    .cost-group { margin-bottom: 14px; page-break-inside: avoid; }
    .cost-group-title {
        font-size: 12pt; color: #1FA89F; font-weight: 700;
        margin: 0 0 6px; text-transform: uppercase; letter-spacing: 0.3px;
    }
    .cost-item { padding: 6px 0; border-bottom: 1px solid #EEF3F7; }
    .cost-item-head { display: flex; justify-content: space-between; gap: 12px; }
    .cost-item-title { color: #1A3263; }
    .cost-item-value { color: #1A3263; font-weight: 600; white-space: nowrap; }
    .cost-conv { color: #64748B; font-weight: 400; }
    .cost-base { font-size: 10pt; color: #64748B; margin-top: 2px; }
    .cost-total {
        margin-top: 12px; padding-top: 10px; border-top: 2px solid #28C9BF;
        display: flex; justify-content: space-between; font-size: 13pt; color: #1A3263;
    }
    .cost-disclaimer { font-size: 9.5pt; color: #94A3B8; margin: 8px 0 0; }
    /* Cards */
    .card {
        border: 1px solid #E0EAF0;
        border-radius: 8px;
        padding: 14px 16px;
        margin-bottom: 12px;
        background: #FAFCFD;
        page-break-inside: avoid;
    }
    .card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
        margin-bottom: 6px;
    }
    .card h3 {
        margin: 0;
        font-size: 13pt;
        color: #1A3263;
        font-weight: 600;
        flex: 1;
    }
    .field {
        font-size: 10.5pt;
        color: #1A3263;
        margin: 2px 0;
    }
    .field-label {
        color: #4A5876;
        font-weight: 600;
    }
    .desc {
        margin: 8px 0 0;
        font-size: 11pt;
        line-height: 1.5;
        color: #1A3263;
    }
    .tip {
        margin: 8px 0 0;
        font-size: 10.5pt;
        color: #1A3263;
        background: #F4FBFB;
        padding: 8px 10px;
        border-radius: 4px;
        border-left: 3px solid #28C9BF;
    }
    /* Day */
    .day {
        margin-bottom: 18px;
        page-break-inside: avoid;
    }
    .day-title {
        font-size: 13pt;
        color: #28C9BF;
        margin: 0 0 6px;
        font-weight: 700;
    }
    .day-summary {
        font-size: 10.5pt;
        color: #4A5876;
        font-style: italic;
        margin: 0 0 6px;
    }
    .day-desc {
        font-size: 11pt;
        color: #1A3263;
        margin: 0 0 10px;
    }
    .day-activities { padding-left: 0; }
    .activity {
        border-left: 3px solid #28C9BF;
        padding: 8px 12px;
        margin-bottom: 8px;
        background: #FAFCFD;
        border-radius: 0 6px 6px 0;
        page-break-inside: avoid;
    }
    .activity-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
        margin-bottom: 4px;
    }
    .activity-title {
        font-weight: 600;
        font-size: 11.5pt;
        color: #1A3263;
        flex: 1;
    }
    .activity-time {
        font-size: 10pt;
        color: #28C9BF;
        font-weight: 600;
    }
    /* Tip-only card */
    .tip-card { background: #F4FBFB; border-color: #B8E8E5; }
    .tip-text {
        margin: 0;
        font-size: 11pt;
        color: #1A3263;
        flex: 1;
    }
    /* Checklist */
    .checklist {
        list-style: none;
        padding: 0;
        margin: 0;
    }
    .checklist-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 10px;
        border-bottom: 1px solid #E0EAF0;
        font-size: 11pt;
        color: #1A3263;
        page-break-inside: avoid;
    }
    .check-box {
        font-size: 14pt;
        color: #28C9BF;
    }
    .check-text { flex: 1; }
    .check-cat {
        font-size: 9.5pt;
        color: #4A5876;
        background: #F4FBFB;
        padding: 2px 8px;
        border-radius: 999px;
    }
    /* Badges per item (personalized only) */
    .badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 999px;
        font-size: 8.5pt;
        font-weight: 600;
        color: #fff;
        letter-spacing: 0.3px;
        white-space: nowrap;
    }
    .badge-added { background: #28C9BF; }
    .badge-edited { background: #1A3263; }
    /* Footer */
    .footer {
        margin-top: 36px;
        padding-top: 12px;
        border-top: 1px solid #E0EAF0;
        font-size: 9.5pt;
        color: #4A5876;
        text-align: center;
    }
    .footer strong { color: #1A3263; }
`;

// ─── API pública ────────────────────────────────────────────────────

/**
 * Constrói o HTML completo do PDF. Sempre retorna documento válido —
 * mesmo com `itinerary` mínimo ou `merged` ausente.
 *
 * Decisões:
 *  - Footer recebe `generatedAtISO` do caller. Não fazemos `new Date()`
 *    aqui para não introduzir drift entre o `exportRoutePdf` e o
 *    template em testes/snapshots.
 *  - Arquivos do viajante entram apenas como índice textual
 *    (título/categoria/nome/nota), nunca como conteúdo binário.
 *  - Para 'personalized', `merged` ausente cai num PDF basicamente vazio
 *    (mas válido) — é responsabilidade do caller passar merged.
 */
export function buildPdfHtml(opts: PdfBuildOpts): string {
    const { itinerary, merged, variant } = opts;
    const generatedAtISO = opts.generatedAtISO ?? new Date().toISOString();
    const ctx: SectionContext = { variant, rates: opts.rates };

    const meta = getMeta(itinerary);

    const notesExcerpt = variant === 'personalized' && merged?.notes
        ? `<div class="notes-excerpt">${escapeHtml(truncate(merged.notes, 240))}</div>`
        : '';

    const variantBadge = variant === 'personalized'
        ? `<span class="variant-badge personalized">Versão personalizada</span>`
        : `<span class="variant-badge original">Versão original</span>`;

    const metaLine = [meta.destination, meta.duration].filter(Boolean).join(' · ');

    // Ordem alinhada a MODULE_ORDER (@vamo/shared/itinerary/sectionOrder):
    // voo → hospedagem → passeios → itinerário → transporte → restaurantes →
    // dicas → gastos extras → checklist. Meu checklist e Arquivos (só na
    // versão personalized) ficam depois do checklist do criador. Custos
    // fecha o documento como resumo final, como é tradicional em PDFs.
    const sections = [
        renderFlightsSection(itinerary, merged, ctx),
        renderAccommodationsSection(itinerary, merged, ctx),
        renderAttractionsSection(itinerary, merged, ctx),
        renderItineraryDays(itinerary, merged, ctx),
        renderTransportsSection(itinerary, merged, ctx),
        renderRestaurantsSection(itinerary, merged, ctx),
        renderTipsSection(itinerary, merged, ctx),
        renderExtraSpendingSection(itinerary, merged, ctx),
        renderChecklistSection(itinerary, merged, ctx),
        renderTravelerChecklist(opts.travelerChecklist, variant),
        renderTravelerFiles(opts.travelerFiles, variant),
        renderCostReferenceSection(itinerary, merged, ctx),
    ].filter(Boolean).join('');

    const generatedAt = formatDateBR(generatedAtISO);
    const footerDate = generatedAt ? `Gerado em ${escapeHtml(generatedAt)} · <strong>VAMO</strong>` : `<strong>VAMO</strong>`;

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${meta.title}</title>
    <style>${PDF_CSS}</style>
</head>
<body>
    <header class="header">
        ${variantBadge}
        <h1>${meta.title}</h1>
        ${metaLine ? `<p class="meta">${metaLine}</p>` : ''}
        ${notesExcerpt}
    </header>
    ${sections}
    <footer class="footer">${footerDate}</footer>
</body>
</html>`;
}

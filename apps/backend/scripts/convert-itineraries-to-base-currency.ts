/**
 * Converte o PREÇO DE VENDA dos roteiros que estão em outra moeda para a
 * moeda-base do mercado (market.ts → hoje USD). Só mexe em `price` e
 * `currency` da tabela `itineraries`; custos internos do roteiro (cada item
 * guarda a própria moeda) NÃO são alterados.
 *
 *   npx tsx scripts/convert-itineraries-to-base-currency.ts            # DRY-RUN (só mostra)
 *   npx tsx scripts/convert-itineraries-to-base-currency.ts --apply    # grava no banco
 *
 * Preço novo = preço antigo × taxa (DEFAULT_RATES_TO_BASE), arredondado para
 * cima no padrão "X.90" (ex.: 26.33 → 26.90) — ou passe --exact para manter
 * o valor convertido com 2 casas. Rode `npx tsx scripts/backup-db.ts` ANTES
 * de usar --apply.
 */
import 'dotenv/config';
import prisma from '../src/lib/prisma';
import { BASE_CURRENCY, DEFAULT_RATES_TO_BASE } from '@vamo/shared/itinerary';

const apply = process.argv.includes('--apply');
const exact = process.argv.includes('--exact');

function convert(price: number, from: string): number {
    const rate = DEFAULT_RATES_TO_BASE[from.toUpperCase()];
    if (!rate) throw new Error(`Sem taxa para ${from}`);
    const raw = price * rate;
    if (exact) return Math.round(raw * 100) / 100;
    return Math.max(0.9, Math.ceil(raw) - 0.1);
}

async function main() {
    const rows = await prisma.itinerary.findMany({
        where: { NOT: { currency: BASE_CURRENCY } },
        select: { id: true, title: true, price: true, currency: true, status: true },
        orderBy: { createdAt: 'asc' },
    });
    console.log(`${apply ? 'APLICANDO' : 'DRY-RUN'} — ${rows.length} roteiro(s) fora de ${BASE_CURRENCY}\n`);
    for (const r of rows) {
        const next = r.price > 0 ? convert(r.price, r.currency) : 0;
        console.log(`  ${r.title.slice(0, 48).padEnd(48)} ${r.currency} ${r.price}  →  ${BASE_CURRENCY} ${next}  [${r.status}]`);
        if (apply) {
            await prisma.itinerary.update({ where: { id: r.id }, data: { price: next, currency: BASE_CURRENCY } });
        }
    }
    if (!apply && rows.length) console.log('\nNada foi gravado. Para gravar: --apply (faça o backup antes).');
    await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });

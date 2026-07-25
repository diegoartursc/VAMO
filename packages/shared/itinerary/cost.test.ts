/**
 * Testes da agregação de custos por categoria (seção pública consolidada
 * "Referência de custos da viagem"). Roda sem framework:
 * `npx tsx --test packages/shared/itinerary/cost.test.ts`
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    aggregateCostsByCategory,
    buildConsolidatedCostSummary,
    getCostReferences,
    formatMoney,
    type ConvertToAud,
} from './cost';

// Taxas fixas de teste: 1 unidade da moeda = X AUD. JPY bem pequeno (como na
// vida real) pra expor bugs de soma bruta sem conversão.
const RATES: Record<string, number> = { AUD: 1, JPY: 0.01, USD: 1.5 };
const convert: ConvertToAud = (amount, currency) => {
    const code = String(currency || '').toUpperCase();
    if (code === 'AUD') return amount;
    const rate = RATES[code];
    if (!Number.isFinite(rate) || rate <= 0) return null;
    return amount * rate;
};

function cost(amount: string | number, opts: Partial<{
    currency: string; disclosureType: 'estimated' | 'verified'; sharedByPeople: number; proofStatus: string;
}> = {}) {
    return {
        amount: String(amount),
        currency: opts.currency ?? 'AUD',
        disclosureType: opts.disclosureType ?? 'estimated',
        sharedByPeople: opts.sharedByPeople ?? 1,
        notes: '',
        proofFiles: [],
        proofStatus: opts.proofStatus ?? 'none',
    };
}

// ── 1. Agregação por categoria: soma múltiplos itens ──
test('soma múltiplos itens da mesma categoria (hospedagem) corretamente', () => {
    const form: any = {
        accommodations: [
            { name: 'Hotel A', cost: cost(30000, { currency: 'JPY', sharedByPeople: 2 }) }, // 15000/pessoa
            { name: 'Hotel B', cost: cost(20000, { currency: 'JPY', sharedByPeople: 2 }) }, // 10000/pessoa
        ],
    };
    const groups = getCostReferences(form);
    const [cat] = aggregateCostsByCategory(groups, convert);
    assert.equal(cat.moduleKey, 'hospedagem');
    // 15000 + 10000 = 25000 JPY/pessoa * 0.01 = 250 AUD
    assert.equal(cat.perPersonAUD, 250);
    assert.equal(cat.originalCurrency, 'JPY');
    assert.equal(cat.originalAmountPerPerson, 25000);
});

// ── 2. Nomes específicos de item NUNCA aparecem no agregado ──
test('categoria agregada nunca expõe título/nome de item individual', () => {
    const form: any = {
        accommodations: [{ name: 'Shinjuku Granbell Hotel', cost: cost(15000, { currency: 'JPY' }) }],
    };
    const groups = getCostReferences(form);
    const [cat] = aggregateCostsByCategory(groups, convert);
    const serialized = JSON.stringify(cat);
    assert.ok(!serialized.includes('Shinjuku'), 'nome do hotel vazou pro agregado público');
    assert.equal(cat.moduleLabel, 'Hospedagens');
});

// ── 3. Custo individual vs. compartilhado ──
test('custo individual (sharedByPeople=1) não gera "Base"', () => {
    const form: any = { attractions: [{ name: 'X', cost: cost(5000, { currency: 'JPY' }) }] };
    const [cat] = aggregateCostsByCategory(getCostReferences(form), convert);
    assert.equal(cat.sharedBase, null);
});

test('custo compartilhado (sharedByPeople>1) gera "Base" com total e pessoas', () => {
    const form: any = { accommodations: [{ name: 'X', cost: cost(30000, { currency: 'JPY', sharedByPeople: 2 }) }] };
    const [cat] = aggregateCostsByCategory(getCostReferences(form), convert);
    assert.deepEqual(cat.sharedBase, { amountTotal: 30000, currency: 'JPY', people: 2 });
});

test('categoria com múltiplos itens não expõe "Base" única (ambígua)', () => {
    const form: any = {
        accommodations: [
            { name: 'A', cost: cost(30000, { currency: 'JPY', sharedByPeople: 2 }) },
            { name: 'B', cost: cost(10000, { currency: 'JPY' }) },
        ],
    };
    const [cat] = aggregateCostsByCategory(getCostReferences(form), convert);
    assert.equal(cat.sharedBase, null);
});

// ── 4/5/6. Status verified / estimated / mixed ──
test('status verified: todos os itens da categoria comprovados', () => {
    const form: any = { attractions: [{ name: 'A', cost: cost(100, { disclosureType: 'verified' }) }] };
    const [cat] = aggregateCostsByCategory(getCostReferences(form), convert);
    assert.equal(cat.status, 'verified');
    assert.equal(cat.verifiedAUD, 100);
    assert.equal(cat.estimatedAUD, 0);
});

test('status estimated: todos os itens da categoria estimados', () => {
    const form: any = { attractions: [{ name: 'A', cost: cost(100, { disclosureType: 'estimated' }) }] };
    const [cat] = aggregateCostsByCategory(getCostReferences(form), convert);
    assert.equal(cat.status, 'estimated');
});

test('status mixed: categoria com um item comprovado e outro estimado', () => {
    const form: any = {
        attractions: [
            { name: 'A', cost: cost(100, { disclosureType: 'verified' }) },
            { name: 'B', cost: cost(50, { disclosureType: 'estimated' }) },
        ],
    };
    const [cat] = aggregateCostsByCategory(getCostReferences(form), convert);
    assert.equal(cat.status, 'mixed');
    assert.equal(cat.verifiedAUD, 100);
    assert.equal(cat.estimatedAUD, 50);
});

// ── 7. Categorias sem valor (missing), só entre as ativas ──
test('categoria ativa sem nenhum custo aparece em missingCategories', () => {
    const form: any = { attractions: [{ name: 'A', cost: cost(100) }] };
    const summary = buildConsolidatedCostSummary(form, ['passeios', 'restaurantes', 'transporte'], convert);
    assert.deepEqual(summary.missingCategories, ['Restaurantes & Gastronomia', 'Transporte']);
});

test('módulo NÃO ativo no roteiro nunca aparece como "sem valor"', () => {
    const form: any = { attractions: [{ name: 'A', cost: cost(100) }] };
    const summary = buildConsolidatedCostSummary(form, ['passeios'], convert);
    assert.deepEqual(summary.missingCategories, []);
});

// ── Percentuais: por valor monetário, não por contagem de itens, sem 99/101 ──
test('percentuais são calculados pelo VALOR monetário, não pela quantidade de itens', () => {
    const form: any = {
        attractions: [
            { name: 'A', cost: cost(900, { disclosureType: 'verified' }) }, // 1 item, valor alto
            { name: 'B', cost: cost(50, { disclosureType: 'estimated' }) },
            { name: 'C', cost: cost(50, { disclosureType: 'estimated' }) }, // 2 itens, valor baixo
        ],
    };
    const summary = buildConsolidatedCostSummary(form, ['passeios'], convert);
    // 900 comprovado de 1000 total = 90%, não 33% (1 de 3 itens)
    assert.equal(summary.verifiedPercentage, 90);
    assert.equal(summary.estimatedPercentage, 10);
});

test('percentuais sempre somam exatamente 100 (nunca 99 ou 101)', () => {
    const form: any = {
        attractions: [
            { name: 'A', cost: cost(1, { disclosureType: 'verified' }) },
            { name: 'B', cost: cost(2, { disclosureType: 'estimated' }) },
        ],
    };
    const summary = buildConsolidatedCostSummary(form, ['passeios'], convert);
    assert.equal(summary.verifiedPercentage + summary.estimatedPercentage, 100);
});

test('total zero: percentuais ficam 0 e 0, sem divisão por zero (NaN/Infinity)', () => {
    const summary = buildConsolidatedCostSummary({}, [], convert);
    assert.equal(summary.verifiedPercentage, 0);
    assert.equal(summary.estimatedPercentage, 0);
    assert.equal(summary.hasAnyData, false);
    assert.ok(Number.isFinite(summary.perPersonTotalAUD));
});

// ── Múltiplas moedas ──
test('categoria com moeda única preserva moeda original + equivalente AUD', () => {
    const form: any = { attractions: [{ name: 'A', cost: cost(1000, { currency: 'JPY' }) }] };
    const [cat] = aggregateCostsByCategory(getCostReferences(form), convert);
    assert.equal(cat.originalCurrency, 'JPY');
    assert.equal(cat.perPersonAUD, 10); // 1000 * 0.01
});

test('categoria com moedas MISTAS não inventa uma moeda original única', () => {
    const form: any = {
        accommodations: [
            { name: 'A', cost: cost(1000, { currency: 'JPY' }) },
            { name: 'B', cost: cost(100, { currency: 'USD' }) },
        ],
    };
    const [cat] = aggregateCostsByCategory(getCostReferences(form), convert);
    assert.equal(cat.originalCurrency, null);
    assert.deepEqual(cat.originalCurrencies.sort(), ['JPY', 'USD']);
    // 1000*0.01 + 100*1.5 = 10 + 150 = 160
    assert.equal(cat.perPersonAUD, 160);
});

test('agregado nunca soma moedas diferentes cruas (bug do total "dominante")', () => {
    // JPY 12.000 + AUD 2.000 NÃO pode virar "A$ 14.000" (soma bruta).
    const form: any = {
        accommodations: [
            { name: 'A', cost: cost(12000, { currency: 'JPY' }) }, // = A$120
            { name: 'B', cost: cost(2000, { currency: 'AUD' }) },  // = A$2000
        ],
    };
    const [cat] = aggregateCostsByCategory(getCostReferences(form), convert);
    assert.equal(cat.perPersonAUD, 2120); // correto: 120 + 2000
    assert.notEqual(cat.perPersonAUD, 14000); // bug antigo
});

// ── Falha de conversão ──
test('moeda sem taxa cadastrada: categoria continua existindo, marca hasConversionGap', () => {
    const form: any = { attractions: [{ name: 'A', cost: cost(100, { currency: 'XYZ' }) }] };
    const [cat] = aggregateCostsByCategory(getCostReferences(form), convert);
    assert.equal(cat.hasConversionGap, true);
    assert.equal(cat.perPersonAUD, 0); // não soma 0 disfarçado de conversão bem-sucedida
    assert.ok(!Number.isNaN(cat.perPersonAUD));
});

test('falha de conversão numa categoria não quebra o total das demais', () => {
    const form: any = {
        attractions: [{ name: 'A', cost: cost(100, { currency: 'XYZ' }) }],
        accommodations: [{ name: 'B', cost: cost(50, { currency: 'AUD' }) }],
    };
    const summary = buildConsolidatedCostSummary(form, ['passeios', 'hospedagem'], convert);
    assert.equal(summary.hasConversionFailure, true);
    assert.equal(summary.perPersonTotalAUD, 50); // só a categoria convertível entra no total
});

// ── Grupo de pessoas (a lógica do simulador em si vive no componente RN;
//    aqui validamos que a fonte é sempre o valor JÁ normalizado por pessoa) ──
test('valor por pessoa é a fonte canônica pro simulador (não duplica divisão)', () => {
    const form: any = { accommodations: [{ name: 'A', cost: cost(30000, { currency: 'JPY', sharedByPeople: 2 }) }] };
    const summary = buildConsolidatedCostSummary(form, ['hospedagem'], convert);
    // 30000/2 = 15000 JPY por pessoa * 0.01 = 150 AUD por pessoa (não 300, não 75)
    assert.equal(summary.perPersonTotalAUD, 150);
    const forThreePeople = Math.round(summary.perPersonTotalAUD * 3 * 100) / 100;
    assert.equal(forThreePeople, 450);
});

// ── formatMoney: plural/arredondamento sanity (usado nos rótulos) ──
test('formatMoney formata AUD com prefixo A$', () => {
    assert.equal(formatMoney(29088, 'AUD'), 'A$ 29,088.00');
});

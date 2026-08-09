/**
 * Testes do resumo do card de roteiro: linha de destino, encaixe dos itens
 * em uma linha ("+X") e rótulo acessível.
 *
 *   npx tsx --test apps/mobile/src/utils/itineraryCardSummary.test.ts
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    formatItineraryDestination,
    fitSummaryItems,
    estimatePillWidth,
    buildSummaryAccessibilityLabel,
} from './itineraryCardSummary';
import { getCategoryChips, getModuleBadges } from './itineraryCardBadges';

const item = (label: string) => ({ key: label.toLowerCase(), label });

/** Larguras usadas nos cenários (medidas no app rodando). */
const WIDTH_PHONE_LIST = 260;   // card full width em tela de 390px
const WIDTH_CAROUSEL = 222;     // card width={320}
const WIDTH_TABLET = 704;       // listagem em 834px

// ══════════════════════════════════════════════════════════════════
// 2. DESTINO
// ══════════════════════════════════════════════════════════════════

test('2. destino combina cidades e país em uma linha', () => {
    assert.equal(
        formatItineraryDestination({ destination: 'Tóquio', country: 'Japão' }),
        'Tóquio · Japão',
    );
    assert.equal(
        formatItineraryDestination({ destination: 'Tóquio', extraCities: ['Kyoto', 'Osaka'], country: 'Japão' }),
        'Tóquio, Kyoto e Osaka · Japão',
    );
});

test('2b. destino sem país, e país sem cidade, continuam válidos', () => {
    assert.equal(formatItineraryDestination({ destination: 'Bali' }), 'Bali');
    assert.equal(formatItineraryDestination({ country: 'Austrália' }), 'Austrália');
});

test('2c. nunca produz "undefined, undefined" — sem dado devolve null', () => {
    for (const source of [null, undefined, {}, { destination: null, country: undefined }, { destination: '   ' }]) {
        assert.equal(formatItineraryDestination(source as any), null, `falhou em ${JSON.stringify(source)}`);
    }
});

test('2d. não repete o país quando ele também está como cidade', () => {
    assert.equal(
        formatItineraryDestination({ destination: 'Portugal', country: 'Portugal' }),
        'Portugal',
    );
    // Dado invertido real em produção (destination=país, country=cidade):
    // apenas concatena, sem inventar semântica.
    assert.equal(
        formatItineraryDestination({ destination: 'Portugal', country: 'Lisboa' }),
        'Portugal · Lisboa',
    );
});

// ══════════════════════════════════════════════════════════════════
// 6/7/8. LIMITES E "+X"
// ══════════════════════════════════════════════════════════════════

test('6. no máximo 2 estilos, mesmo com largura de sobra', () => {
    const categorias = ['Cultura', 'Gastronomia', 'Histórico', 'Natureza'].map(item);
    const { visible, hidden } = fitSummaryItems(categorias, WIDTH_TABLET, 2);
    assert.deepEqual(visible.map(v => v.label), ['Cultura', 'Gastronomia']);
    assert.equal(hidden, 2, 'o "+X" precisa refletir os 2 restantes');
});

test('7. no máximo 3 inclusos, mesmo com largura de sobra', () => {
    const modulos = ['Itinerário', 'Passeios', 'Hospedagens', 'Transporte', 'Voos'].map(item);
    const { visible, hidden } = fitSummaryItems(modulos, WIDTH_TABLET, 3);
    assert.equal(visible.length, 3);
    assert.equal(hidden, 2);
});

test('8. "+X" conta exatamente o que ficou de fora (cenário do enunciado)', () => {
    const categorias = ['Cultura', 'Gastronomia', 'Histórico', 'Natureza'].map(item);
    const { visible, hidden } = fitSummaryItems(categorias, WIDTH_PHONE_LIST, 2);
    assert.deepEqual(visible.map(v => v.label), ['Cultura', 'Gastronomia']);
    assert.equal(hidden, 2);
    // visíveis + escondidos == total, sempre.
    assert.equal(visible.length + hidden, categorias.length);
});

test('sem itens escondidos, hidden é 0 (nenhum "+X" é renderizado)', () => {
    const { visible, hidden } = fitSummaryItems([item('Cultura')], WIDTH_PHONE_LIST, 2);
    assert.equal(visible.length, 1);
    assert.equal(hidden, 0);
});

test('lista vazia não devolve nada (a linha não é renderizada)', () => {
    assert.deepEqual(fitSummaryItems([], WIDTH_PHONE_LIST, 3), { visible: [], hidden: 0 });
});

// ══════════════════════════════════════════════════════════════════
// 19. RESPONSIVIDADE — uma linha, sem overflow, sem corte
// ══════════════════════════════════════════════════════════════════

/** Soma real ocupada pelos pills escolhidos, incluindo gaps e o "+X". */
function occupiedWidth(result: { visible: { label: string }[]; hidden: number }): number {
    const widths = result.visible.map(v => estimatePillWidth(v.label));
    if (result.hidden > 0) widths.push(estimatePillWidth(`+${result.hidden}`, false));
    const gaps = Math.max(0, widths.length - 1) * 6;
    return widths.reduce((a, b) => a + b, 0) + gaps;
}

test('o conteúdo escolhido nunca ultrapassa a largura disponível', () => {
    const modulos = ['Itinerário', 'Passeios', 'Hospedagens', 'Transporte', 'Gastronomia', 'Dicas exclusivas', 'Checklist', 'Voos', 'Gastos extras'].map(item);
    const categorias = ['Cultura', 'Gastronomia', 'Histórico', 'Natureza', 'Praia'].map(item);

    for (const width of [WIDTH_CAROUSEL, WIDTH_PHONE_LIST, 200, 180, WIDTH_TABLET]) {
        const mods = fitSummaryItems(modulos, width, 3);
        const cats = fitSummaryItems(categorias, width, 2);
        assert.ok(occupiedWidth(mods) <= width, `inclui estourou em ${width}px`);
        assert.ok(occupiedWidth(cats) <= width, `estilo estourou em ${width}px`);
        assert.ok(mods.visible.length >= 1 && cats.visible.length >= 1, `sumiu tudo em ${width}px`);
    }
});

test('card estreito mostra menos itens que card largo (redução automática)', () => {
    const modulos = ['Itinerário', 'Passeios', 'Hospedagens', 'Transporte'].map(item);
    const estreito = fitSummaryItems(modulos, WIDTH_CAROUSEL, 3).visible.length;
    const largo = fitSummaryItems(modulos, WIDTH_TABLET, 3).visible.length;
    assert.ok(estreito < largo, `esperava menos itens no estreito (${estreito}) que no largo (${largo})`);
    assert.equal(largo, 3);
});

test('largura ainda desconhecida cai no limite máximo, sem quebrar', () => {
    const modulos = ['Itinerário', 'Passeios', 'Hospedagens', 'Transporte'].map(item);
    assert.equal(fitSummaryItems(modulos, 0, 3).visible.length, 3);
    assert.equal(fitSummaryItems(modulos, -50, 3).visible.length, 3);
    assert.equal(fitSummaryItems(modulos, NaN, 3).visible.length, 3);
    assert.equal(fitSummaryItems(modulos, 0, 3).hidden, 1);
});

test('largura minúscula ainda mostra 1 item (nunca linha vazia)', () => {
    const modulos = ['Dicas exclusivas', 'Passeios'].map(item);
    const r = fitSummaryItems(modulos, 40, 3);
    assert.equal(r.visible.length, 1);
    assert.equal(r.hidden, 1);
});

// ══════════════════════════════════════════════════════════════════
// 18. ACESSIBILIDADE
// ══════════════════════════════════════════════════════════════════

test('18. rótulo acessível nomeia TODOS os itens reais, não "mais 2"', () => {
    const label = buildSummaryAccessibilityLabel(
        ['Cultura', 'Gastronomia'].map(item),
        ['Itinerário', 'Passeios', 'Hospedagens'].map(item),
    );
    assert.equal(label, 'Estilo: Cultura e Gastronomia. Inclui: Itinerário, Passeios e Hospedagens.');
    assert.ok(!label!.includes('+'), 'não pode vazar o "+X" visual para o leitor de tela');
});

test('rótulo acessível omite a parte que não existe', () => {
    assert.equal(buildSummaryAccessibilityLabel([item('Cultura')], []), 'Estilo: Cultura.');
    assert.equal(buildSummaryAccessibilityLabel([], [item('Voos')]), 'Inclui: Voos.');
    assert.equal(buildSummaryAccessibilityLabel([], []), undefined);
});

// ══════════════════════════════════════════════════════════════════
// 4/5/15. DADOS REAIS — o painel consome as fontes existentes
// ══════════════════════════════════════════════════════════════════

/** Payload no formato da API pública (GET /api/itineraries). */
const itinerarioReal = {
    id: 'x',
    title: 'Japão Clássico',
    destination: 'Tóquio',
    country: 'Japão',
    categories: ['cultura', 'gastronomia', 'historico'],
    activeModules: ['itinerario', 'passeios', 'hospedagem', 'dicas'],
};

test('4/5. Estilo vem de getCategoryChips e Inclui de getModuleBadges', () => {
    const categorias = getCategoryChips(itinerarioReal);
    const modulos = getModuleBadges(itinerarioReal);

    assert.deepEqual(categorias.map(c => c.label), ['Cultura', 'Gastronomia', 'Histórico']);
    assert.deepEqual(modulos.map(m => m.label), ['Itinerário', 'Passeios', 'Hospedagens', 'Dicas exclusivas']);

    // "Gastronomia" (estilo) e "Gastronomia" (módulo restaurantes) são coisas
    // diferentes e vivem em linhas diferentes — nunca no mesmo conjunto.
    const estilo = fitSummaryItems(categorias, WIDTH_PHONE_LIST, 2);
    const inclui = fitSummaryItems(modulos, WIDTH_PHONE_LIST, 3);
    assert.equal(estilo.hidden, 1);
    assert.equal(inclui.visible.length + inclui.hidden, 4);
});

test('9/10/11. sem categorias e/ou sem módulos, as linhas somem', () => {
    const semCategorias = { ...itinerarioReal, categories: [] };
    const semModulos = { ...itinerarioReal, activeModules: [] };
    const semNada = { ...itinerarioReal, categories: [], activeModules: [] };

    assert.equal(getCategoryChips(semCategorias).length, 0);
    assert.ok(getModuleBadges(semCategorias).length > 0);

    assert.equal(getModuleBadges(semModulos).length, 0);
    assert.ok(getCategoryChips(semModulos).length > 0);

    // Sem nenhum dos dois o painel inteiro não deve existir.
    assert.equal(getCategoryChips(semNada).length, 0);
    assert.equal(getModuleBadges(semNada).length, 0);
    assert.equal(buildSummaryAccessibilityLabel([], []), undefined);
});

test('módulo ativo mas VAZIO não vira "Inclui" (não prometemos o que não existe)', () => {
    const comModuloVazio = {
        ...itinerarioReal,
        activeModules: ['itinerario', 'hospedagem'],
        days: [{ id: 1 }],
        accommodations: [],
    };
    assert.deepEqual(getModuleBadges(comModuloVazio).map(m => m.key), ['itinerario']);
});

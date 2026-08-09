/**
 * Padronização dos cards de roteiro da Home.
 *
 * Cobre a regra de largura responsiva (função pura) e o contrato de código da
 * Home: um único componente de card, uma única largura, um único gap/padding e
 * nenhum resquício do mini card local.
 *
 *   npx tsx --test apps/mobile/src/components/home/homeItinerarySection.test.ts
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    getHomeItineraryCardWidth,
    HOME_ITINERARY_CARD_MAX_WIDTH,
    HOME_CAROUSEL_GAP,
    HOME_CAROUSEL_PADDING_HORIZONTAL,
} from '../../utils/homeItineraryLayout';

const here = dirname(fileURLToPath(import.meta.url));
const section = readFileSync(join(here, 'HomeItinerarySection.tsx'), 'utf8');
const home = readFileSync(join(here, '../../../app/(tabs)/index.tsx'), 'utf8');

/** Remove comentários — só o CÓDIGO é avaliado. */
const stripComments = (src: string) =>
    src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
const homeCode = stripComments(home);
const sectionCode = stripComments(section);

// ══════════════════════════════════════════════════════════════════
// LARGURA RESPONSIVA
// ══════════════════════════════════════════════════════════════════

test('6. largura padrão é 320 sempre que couber', () => {
    assert.equal(HOME_ITINERARY_CARD_MAX_WIDTH, 320);
    for (const vw of [375, 390, 414, 768, 1280]) {
        assert.equal(getHomeItineraryCardWidth(vw), 320, `viewport ${vw}`);
    }
});

test('em tela estreita o card encolhe e não encosta nas bordas', () => {
    // 320px (iPhone SE): 320 - 20 - 20 = 280.
    assert.equal(getHomeItineraryCardWidth(320), 280);
    assert.equal(getHomeItineraryCardWidth(360), 320);
    // Nunca maior que o espaço disponível entre as margens.
    for (const vw of [240, 280, 320, 359]) {
        const w = getHomeItineraryCardWidth(vw);
        assert.ok(w <= vw - HOME_CAROUSEL_PADDING_HORIZONTAL * 2, `estourou em ${vw}`);
        assert.ok(w > 0);
    }
});

test('largura inválida cai no padrão, sem quebrar', () => {
    for (const vw of [0, -100, NaN, Infinity]) {
        assert.equal(getHomeItineraryCardWidth(vw as number), 320, `entrada ${vw}`);
    }
});

test('7/8. gap e padding do carrossel têm um valor único', () => {
    assert.equal(HOME_CAROUSEL_GAP, 16);
    assert.equal(HOME_CAROUSEL_PADDING_HORIZONTAL, 20);
});

// ══════════════════════════════════════════════════════════════════
// CONTRATO DA SEÇÃO
// ══════════════════════════════════════════════════════════════════

test('1-4. a seção renderiza o ItineraryCard oficial (não uma cópia)', () => {
    assert.ok(sectionCode.includes("from '../cards/ItineraryCard'"), 'importa o card oficial');
    assert.ok(/<ItineraryCard/.test(sectionCode), 'renderiza o card oficial');
    // Nenhuma reimplementação de comportamento do card dentro da seção.
    for (const proibido of ['useFavorites', 'useCart', 'formatMoney', 'getRouteRatingDisplay', 'getCategoryChips']) {
        assert.ok(!sectionCode.includes(proibido), `${proibido} não pode ser reimplementado na seção`);
    }
});

test('a seção usa a mesma largura calculada para todos os cards', () => {
    assert.ok(/getHomeItineraryCardWidth\(windowWidth\)/.test(sectionCode));
    assert.ok(/width=\{cardWidth\}/.test(sectionCode), 'todos os cards recebem a mesma largura');
    assert.ok(!/width=\{\d+\}/.test(sectionCode), 'nada de largura numérica fixa');
});

test('a largura responde ao redimensionamento (useWindowDimensions)', () => {
    assert.ok(sectionCode.includes('useWindowDimensions'), 'precisa reagir a resize no RN Web');
    assert.ok(!/Dimensions\.get\(/.test(sectionCode), 'Dimensions.get congela a largura');
});

test('24. seção sem roteiros e sem fallback não renderiza', () => {
    assert.ok(/if \(!hasItineraries && !fallback\) return null;/.test(sectionCode));
});

// ══════════════════════════════════════════════════════════════════
// CONTRATO DA HOME
// ══════════════════════════════════════════════════════════════════

test('5. HomeMiniItineraryCard não existe mais', () => {
    assert.ok(!home.includes('HomeMiniItineraryCard'), 'o mini card local foi removido');
    assert.ok(!/mini[A-Z]\w*/.test(home), 'nenhum estilo/handler miniXxx sobrou');
});

test('1-4. as quatro seções de roteiros usam HomeItinerarySection', () => {
    const titulos = ['Roteiros em Destaque', 'Novos Roteiros', 'Continue sua busca', 'Experiências inesquecíveis'];
    for (const titulo of titulos) {
        const re = new RegExp(`<HomeItinerarySection[\\s\\S]{0,200}title="${titulo}"`);
        assert.ok(re.test(homeCode), `"${titulo}" precisa usar HomeItinerarySection`);
    }
    const usos = homeCode.match(/<HomeItinerarySection/g) ?? [];
    assert.equal(usos.length, 4, `esperava 4 seções, achei ${usos.length}`);
});

test('a Home não renderiza mais nenhum card de roteiro por conta própria', () => {
    assert.ok(!/<ItineraryCard/.test(homeCode), 'o card só é renderizado dentro da seção compartilhada');
});

test('7/8. não há mais contentContainerStyle inline com padding/gap de carrossel', () => {
    assert.ok(
        !/contentContainerStyle=\{\{\s*paddingHorizontal:\s*20,\s*gap:/.test(homeCode),
        'padding e gap devem vir do estilo compartilhado da seção',
    );
});

test('25. imports que só serviam ao mini card foram removidos', () => {
    for (const orfao of ['useFavorites', 'getCoverImages', 'formatMoney', 'getRouteRatingDisplay', 'FALLBACK_IMAGE', 'getPrimaryImage', 'formatPrice']) {
        assert.ok(!home.includes(orfao), `"${orfao}" ficou órfão na Home`);
    }
    // Image continua em uso pelo Hero — não pode ter sido removido junto.
    assert.ok(home.includes('<Image'), 'o Hero ainda usa Image');
    assert.ok(/^\s+Image,$/m.test(home), 'o import de Image precisa continuar');
});

test('26. estilos mortos removidos, estilos ainda usados preservados', () => {
    assert.ok(!home.includes('sectionSubtitle'), 'subtítulo migrou para a seção compartilhada');
    // "Destinos em Alta" ainda usa estes:
    for (const vivo of ['styles.section', 'styles.sectionHeader', 'styles.sectionTitle', 'styles.seeAllText']) {
        assert.ok(home.includes(vivo), `${vivo} ainda é usado e não pode sumir`);
    }
});

// ══════════════════════════════════════════════════════════════════
// 8/22/23. REGRAS DE SELEÇÃO PRESERVADAS
// ══════════════════════════════════════════════════════════════════

test('22/23. cada seção mantém seu seletor e seu limite', () => {
    assert.ok(/selectFeatured\(publicItineraries, 5\)/.test(homeCode), 'Destaque: selectFeatured limite 5');
    assert.ok(/selectNew\(publicItineraries, 5\)/.test(homeCode), 'Novos: selectNew limite 5');
    assert.ok(/selectContinueSearch\(publicItineraries, searchIntent\)/.test(homeCode), 'Continue: depende do histórico real');
    assert.ok(/selectUnforgettable\(publicItineraries\)/.test(homeCode), 'Inesquecíveis: selectUnforgettable');
    // Todas partem do MESMO conjunto já filtrado — sem refazer request.
    assert.ok(/publicItineraries = useMemo/.test(homeCode));
});

test('21. o "Ver todos" de cada seção mantém o destino original', () => {
    assert.ok(/title="Novos Roteiros"[\s\S]{0,300}sort: 'newest'/.test(homeCode), 'Novos → sort=newest');
    assert.ok(/title="Experiências inesquecíveis"[\s\S]{0,300}sort: 'score'/.test(homeCode), 'Inesquecíveis → sort=score');
    assert.ok(/seeAllLabel="Explorar"/.test(homeCode), 'Novos mantém o rótulo "Explorar"');
});

// ══════════════════════════════════════════════════════════════════
// 16. ANALYTICS
// ══════════════════════════════════════════════════════════════════

test('16. a origem da seção vai para o analytics, sem evento duplicado', () => {
    for (const origem of ['featured', 'new', 'continue_search', 'unforgettable']) {
        assert.ok(homeCode.includes(`'${origem}'`), `origem "${origem}" ausente`);
    }
    // Um único ponto de disparo — o card usa o mesmo onPress no card e no CTA.
    const disparos = homeCode.match(/analytics\.homeItineraryCardClicked/g) ?? [];
    assert.equal(disparos.length, 1, 'o evento deve sair de um handler único');
});

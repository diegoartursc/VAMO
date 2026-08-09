/**
 * Contrato de código do ItineraryCard e do painel de resumo.
 *
 * O projeto não tem runner de componentes (sem jest/RNTL), então o que dá para
 * garantir automaticamente é a ESTRUTURA: selo único, descrição de uma linha,
 * painel sem flexWrap, handlers de favorito/carrinho com stopPropagation, etc.
 * O comportamento visual foi verificado no app rodando (listagem, carrossel,
 * perfil do criador, 375/390/834/1024px).
 *
 *   npx tsx --test apps/mobile/src/components/cards/itineraryCard.contract.test.ts
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const card = readFileSync(join(here, 'ItineraryCard.tsx'), 'utf8');
const panel = readFileSync(join(here, 'ItinerarySummaryPanel.tsx'), 'utf8');

/** Remove comentários — só o CÓDIGO é avaliado (exemplos em doc são ok). */
function stripComments(source: string): string {
    return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}
const cardCode = stripComments(card);
const panelCode = stripComments(panel);

// ── Redundâncias removidas ────────────────────────────────────────────────

test('13. o selo de verificação aparece UMA vez só (saiu de cima da imagem)', () => {
    const usos = card.match(/<VerifiedBadge/g) ?? [];
    assert.equal(usos.length, 1, `esperava 1 <VerifiedBadge>, achei ${usos.length}`);
    assert.ok(!/verifiedBadge:\s*{/.test(card), 'o estilo absoluto sobre a imagem deve ter sumido');
});

test('a localização não ocupa mais uma linha isolada no rodapé', () => {
    // O bloco de ações não contém mais o destino.
    const footer = card.slice(card.indexOf('footerActions:'));
    assert.ok(!/destinationRow/.test(footer), 'destino não pode voltar para o rodapé');
    // E o destino é renderizado logo após o título.
    const posTitulo = card.indexOf('styles.title');
    const posDestino = card.indexOf('styles.destinationRow');
    const posDescricao = card.indexOf('styles.description');
    assert.ok(posTitulo < posDestino, 'destino precisa vir depois do título');
    assert.ok(posDestino < posDescricao, 'destino precisa vir antes da descrição');
});

test('3. a descrição é limitada a uma linha com ellipsis', () => {
    assert.ok(
        /styles\.description[\s\S]{0,120}numberOfLines=\{1\}[\s\S]{0,60}ellipsizeMode="tail"/.test(card),
        'descrição deve usar numberOfLines={1} + ellipsizeMode="tail"',
    );
    assert.ok(!card.includes("'Planejamento digital com dicas práticas"), 'sem texto genérico de enchimento');
});

test('1. o título continua com no máximo duas linhas', () => {
    assert.ok(/styles\.title[\s\S]{0,80}numberOfLines=\{2\}/.test(card));
});

// ── Painel ────────────────────────────────────────────────────────────────

test('as duas linhas do painel são rotuladas e semanticamente separadas', () => {
    assert.ok(panel.includes('label="Estilo"'), 'linha de tema precisa do rótulo "Estilo"');
    assert.ok(panel.includes('label="Inclui"'), 'linha de conteúdo precisa do rótulo "Inclui"');
    // A diferença não pode depender só de cor.
    assert.ok(panel.includes("tone=\"category\"") && panel.includes("tone=\"included\""));
});

test('o painel não usa flexWrap (altura previsível) nem rolagem horizontal', () => {
    assert.ok(!/flexWrap/.test(panelCode), 'flexWrap deixaria a altura imprevisível');
    assert.ok(!/ScrollView/.test(panelCode), 'nada de rolagem horizontal dentro do card');
    assert.ok(!/flexWrap/.test(cardCode), 'as linhas de chips com wrap do card antigo devem ter sumido');
});

test('11. sem categorias E sem módulos o painel inteiro não renderiza', () => {
    assert.ok(
        /if \(!hasCategories && !hasModules\) return null;/.test(panel),
        'painel precisa retornar null quando não há nenhum dos dois',
    );
});

test('os pills usam ícones Lucide, sem emoji', () => {
    assert.ok(panel.includes('<Icon'), 'usa o componente Icon do projeto');
    const emoji = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
    assert.ok(!emoji.test(panel), 'painel não pode conter emoji');
});

test('altura e tipografia dos pills ficam na faixa compacta especificada', () => {
    const pillStyle = panel.slice(panel.indexOf('    pill: {'));
    const altura = pillStyle.slice(0, pillStyle.indexOf('},')).match(/height:\s*(\d+),/);
    assert.ok(altura, 'pill precisa de altura declarada');
    const h = Number(altura![1]);
    assert.ok(h >= 24 && h <= 28, `altura do pill fora da faixa 24–28 (${h})`);
    assert.ok(/size=\{12\}/.test(panel), 'ícone do pill entre 11 e 13px');
    assert.ok(/fontSize:\s*11,/.test(panel), 'texto do pill entre 10,5 e 12px');
});

// ── Comportamento preservado ──────────────────────────────────────────────

test('14/15. favoritar e carrinho não abrem o roteiro (stopPropagation)', () => {
    assert.ok(/const handleFav[\s\S]{0,120}e\.stopPropagation\?\.\(\)/.test(card));
    assert.ok(/const handleCart[\s\S]{0,120}e\.stopPropagation\?\.\(\)/.test(card));
});

test('17. o gate de compra continua intacto (carrinho, dono, disponibilidade)', () => {
    assert.ok(/if \(inCart\) return;/.test(card), 'item já no carrinho não re-adiciona');
    assert.ok(/if \(owned\) return;/.test(card), 'roteiro já adquirido não vai pro carrinho');
    assert.ok(/evaluateItineraryAvailability\(itinerary\)/.test(card), 'validação de disponibilidade preservada');
    assert.ok(/calculateBudgetSummary\(/.test(card), 'cálculo de confiança dos custos inalterado');
});

test('16. o CTA abre os detalhes e o botão do carrinho mantém 44x44', () => {
    assert.ok(/styles\.ctaButton[\s\S]{0,120}onPress=\{onPress\}/.test(card));
    assert.ok(/cartButton:\s*{\s*width:\s*44,\s*height:\s*44,/.test(card), 'área de toque do carrinho');
    assert.ok(/minHeight:\s*44,/.test(card), 'CTA com altura de toque acessível');
});

test('18. estados acessíveis nos botões de ação', () => {
    assert.ok(/accessibilityRole="button"/.test(card));
    assert.ok(/accessibilityState=\{\{ selected: inCart/.test(card), 'estado "no carrinho" anunciado');
    assert.ok(/accessibilityLabel=\{`Ver roteiro \$\{title\}`\}/.test(card));
});

test('12. o card não reserva espaço para seções ausentes (marginTop, não marginBottom)', () => {
    // Cada bloco condicional declara a própria distância para o anterior.
    for (const bloco of ['destinationRow', 'description', 'summaryWrapper', 'budgetBadgeRow', 'footerActions']) {
        const trecho = card.slice(card.indexOf(`${bloco}: {`));
        const corpo = trecho.slice(0, trecho.indexOf('},'));
        assert.ok(/marginTop:/.test(corpo), `${bloco} deveria posicionar-se por marginTop`);
        assert.ok(!/marginBottom:/.test(corpo), `${bloco} não pode usar marginBottom (acumula em seções ausentes)`);
    }
});

test('a origem dos dados continua centralizada em itineraryCardBadges', () => {
    assert.ok(/getCategoryChips\(itinerary\)/.test(card));
    assert.ok(/getModuleBadges\(itinerary\)/.test(card));
    // O card não pode reimplementar regra de módulo/categoria.
    assert.ok(!/activeModules/.test(card), 'o card não deve inspecionar activeModules direto');
    assert.ok(!/MODULE_PRIORITY|isModulePopulated/.test(card));
});

test('nenhum nome de categoria ou módulo está hardcoded no card ou no painel', () => {
    const codigoCard = cardCode;
    const codigoPanel = panelCode;
    for (const proibido of ['Cultura', 'Gastronomia', 'Itinerário', 'Hospedagens', 'Passeios']) {
        assert.ok(!codigoCard.includes(proibido), `"${proibido}" não pode estar hardcoded no card`);
        assert.ok(!codigoPanel.includes(proibido), `"${proibido}" não pode estar hardcoded no painel`);
    }
});

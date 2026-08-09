/**
 * Contrato de código do CTACarousel — igualdade de dimensões entre slides.
 *
 * O projeto não tem runner de componentes (sem jest/RNTL), então o que dá para
 * travar automaticamente é a ESTRUTURA que garante a igualdade: stretch na
 * linha, wrapper esticado, gradiente preenchendo o wrapper, CTA ancorado e
 * zero estilo indexado por slide. As medições reais (273×343 idênticos em
 * ambos os cards, e 295 com um terceiro slide de teste) foram feitas no app
 * rodando — ver relatório.
 *
 *   npx tsx --test apps/mobile/src/components/home/ctaCarousel.contract.test.ts
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const carousel = readFileSync(join(here, 'CTACarousel.tsx'), 'utf8');
const home = readFileSync(join(here, '../../../app/(tabs)/index.tsx'), 'utf8');
const itineraries = readFileSync(join(here, '../../../app/(tabs)/itineraries.tsx'), 'utf8');

/** Remove comentários — só o CÓDIGO é avaliado. */
const stripComments = (src: string) =>
    src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
const code = stripComments(carousel);

/** Corpo de um estilo declarado no StyleSheet (só o conteúdo entre chaves). */
function styleBody(name: string): string {
    const start = code.indexOf(`    ${name}: {`);
    assert.ok(start >= 0, `estilo "${name}" não encontrado`);
    const rest = code.slice(start + `    ${name}: {`.length);
    return rest.slice(0, rest.indexOf('\n    },'));
}

// ══════════════════════════════════════════════════════════════════
// 2/4. EQUALIZAÇÃO DE ALTURA
// ══════════════════════════════════════════════════════════════════

test('2. a linha do carrossel estica todos os slides (alignItems: stretch)', () => {
    assert.ok(/alignItems: 'stretch'/.test(styleBody('scrollContent')));
    // O contentContainerStyle precisa vir do estilo compartilhado — inline
    // poderia perder o stretch numa edição futura.
    assert.ok(/contentContainerStyle=\{styles\.scrollContent\}/.test(code));
});

test('4. o wrapper aceita a altura da linha e o gradiente PREENCHE o wrapper', () => {
    assert.ok(/alignSelf: 'stretch'/.test(styleBody('slideWrapper')), 'wrapper precisa esticar');
    // Era o elo que faltava: sem flex:1 o LinearGradient parava no tamanho do
    // próprio conteúdo (243px vs 269px medidos antes da correção).
    assert.ok(/flex: 1,/.test(styleBody('card')), 'o card precisa preencher a altura recebida');
});

test('minHeight continua como piso de segurança, não como altura fixa', () => {
    const card = styleBody('card');
    assert.ok(/minHeight: 200,/.test(card), 'piso preservado');
    assert.ok(!/\n\s+height: \d+/.test(card), 'altura fixa arbitrária não pode existir');
});

test('3/4. nenhuma altura é definida por slide, id, cor ou posição', () => {
    assert.ok(!/slide\.id ===/.test(code), 'nada de estilo condicional por id');
    assert.ok(!/idx ===\s*0/.test(code), 'nada de estilo condicional pela posição');
    assert.ok(!/gradientColors\[0\] ===/.test(code), 'nada condicional por cor');
    // O único uso de índice é o gap entre slides (último não tem).
    const usosDeIdx = (code.match(/idx ===/g) ?? []).length;
    assert.equal(usosDeIdx, 1, 'idx só deve decidir o marginRight do último slide');
    assert.ok(/marginRight: idx === slides\.length - 1 \? 0 : CARD_GAP/.test(code));
});

test('5. todos os slides usam o MESMO objeto de estilo (sem variantes)', () => {
    // Um único style={styles.card} e um único wrapper compartilhado.
    assert.equal((code.match(/style=\{styles\.card\}/g) ?? []).length, 1);
    assert.equal((code.match(/styles\.slideWrapper/g) ?? []).length, 1);
    // O map é único: não há branch renderizando slides de formas diferentes.
    assert.equal((code.match(/slides\.map\(/g) ?? []).length, 2, 'um map de slides + um de dots');
});

// ══════════════════════════════════════════════════════════════════
// 7. ÁREAS INTERNAS E CTA
// ══════════════════════════════════════════════════════════════════

test('7. o CTA fica ancorado no rodapé, igual em todos os cards', () => {
    assert.ok(/marginTop: 'auto',/.test(styleBody('ctaRow')), 'CTA ancorado no fim do card');
    const textContent = styleBody('textContent');
    assert.ok(/flex: 1,/.test(textContent), 'a área de texto absorve a folga de altura');
    assert.ok(/justifyContent: 'center'/.test(textContent));
});

test('7. a ordem interna é ícone → texto → CTA', () => {
    const posIcone = code.indexOf('styles.iconContainer');
    const posTexto = code.indexOf('styles.textContent');
    const posCta = code.indexOf('styles.ctaRow');
    assert.ok(posIcone < posTexto && posTexto < posCta, 'ordem interna inconsistente');
});

test('9. o CTA continua renderizado em todos os slides', () => {
    assert.ok(/styles\.ctaText/.test(code) && />Explorar</.test(code));
});

// ══════════════════════════════════════════════════════════════════
// 8. TÍTULOS E SUBTÍTULOS
// ══════════════════════════════════════════════════════════════════

test('7/8. título em 2 linhas e subtítulo em 3, sempre com reticências', () => {
    assert.ok(/numberOfLines=\{TITLE_MAX_LINES\}[\s\S]{0,40}ellipsizeMode="tail"/.test(code));
    assert.ok(/numberOfLines=\{SUBTITLE_MAX_LINES\}[\s\S]{0,40}ellipsizeMode="tail"/.test(code));
    assert.ok(/const TITLE_MAX_LINES = 2;/.test(code));
    assert.ok(/const SUBTITLE_MAX_LINES = 3;/.test(code));
});

test('8. a área reservada do título é derivada do lineHeight (não número solto)', () => {
    const title = styleBody('title');
    assert.ok(/lineHeight: TITLE_LINE_HEIGHT,/.test(title));
    assert.ok(/minHeight: TITLE_LINE_HEIGHT \* TITLE_MAX_LINES,/.test(title),
        'a área de 2 linhas precisa acompanhar automaticamente o lineHeight');
    assert.ok(/lineHeight: SUBTITLE_LINE_HEIGHT,/.test(styleBody('subtitle')));
});

// ══════════════════════════════════════════════════════════════════
// 9/13. LARGURA, SNAP E SLIDES FUTUROS
// ══════════════════════════════════════════════════════════════════

test('9. largura, snap e paddings continuam como estavam', () => {
    assert.ok(/const HORIZONTAL_PADDING = 16;/.test(code));
    assert.ok(/const CARD_GAP = 12;/.test(code));
    assert.ok(/cardWidth = Math\.max\(0, availableWidth - HORIZONTAL_PADDING \* 2\)/.test(code));
    assert.ok(/snapInterval = cardWidth > 0 \? cardWidth \+ CARD_GAP : 0/.test(code));
    assert.ok(/snapToInterval=\{snapInterval > 0 \? snapInterval : undefined\}/.test(code));
});

test('9. a largura continua vindo do container medido, não da tela', () => {
    assert.ok(/availableWidth = hasMeasured \? containerWidth : screenWidth/.test(code),
        'screenWidth só pode ser fallback antes da medição');
    assert.ok(/onLayout=\{handleContainerLayout\}/.test(code), 'resize/rotação remede o container');
});

test('10/13. autoplay e paginação continuam derivando de slides.length', () => {
    assert.ok(/\(currentIndex \+ 1\) % slides\.length/.test(code), 'autoplay preservado');
    assert.ok(/Math\.min\(slides\.length - 1/.test(code), 'índice do swipe preservado');
    assert.ok(/const interval = setInterval\(/.test(code) && /AUTO_SCROLL_INTERVAL/.test(code));
    // Paginação: um dot por slide, sem número fixo.
    assert.ok(/slides\.map\(\(_, index\) =>/.test(code));
    assert.ok(!/\bslides\.length === 2\b/.test(code), 'nada pode presumir 2 slides');
});

test('13. um slide novo não exige nenhuma alteração de estilo', () => {
    // Nenhum estilo cita slide/índice; a regra é a mesma para qualquer item.
    for (const name of ['scrollContent', 'slideWrapper', 'card', 'textContent', 'ctaRow']) {
        const body = styleBody(name);
        assert.ok(!/\b(slide|idx|index)\b/.test(body), `${name} não pode depender de índice`);
    }
});

// ══════════════════════════════════════════════════════════════════
// 12. ACESSIBILIDADE
// ══════════════════════════════════════════════════════════════════

test('12. o card inteiro é uma ação acessível com nome descritivo', () => {
    assert.ok(/accessibilityRole="button"/.test(code));
    assert.ok(/accessibilityLabel=\{`\$\{slide\.title\}\. \$\{slide\.subtitle\}\. Explorar\.`\}/.test(code));
});

// ══════════════════════════════════════════════════════════════════
// 10/18. USO NAS DUAS TELAS
// ══════════════════════════════════════════════════════════════════

test('16/17. Home e tela de roteiros renderizam o mesmo componente', () => {
    assert.ok(/<CTACarousel \/>/.test(home), 'Home renderiza o carrossel');
    assert.ok(/<CTACarousel \/>/.test(itineraries), 'Tela de roteiros renderiza o carrossel');
});

test('18. nenhuma tela passa altura ou corrige o carrossel por fora', () => {
    for (const [nome, src] of [['index.tsx', home], ['itineraries.tsx', itineraries]] as const) {
        assert.ok(!/<CTACarousel[^/>]+\w/.test(src), `${nome} não pode passar props ao carrossel`);
        assert.ok(!/ctaCard|ctaCarousel(Height|Card)/i.test(src), `${nome} não pode ter estilo próprio do carrossel`);
    }
});

test('14. os textos dos slides não foram encurtados para "caber"', () => {
    // A correção é estrutural: o conteúdo original continua íntegro.
    assert.ok(carousel.includes('Conheça os roteiros dos viajantes'));
    assert.ok(carousel.includes('Explore experiências autênticas compartilhadas pela comunidade'));
    assert.ok(carousel.includes('Quer vender seus roteiros?'));
    assert.ok(carousel.includes('Já viajou bastante? Transforme sua experiência em renda extra'));
});

test('os gradientes originais foram preservados', () => {
    assert.ok(carousel.includes("['#667eea', '#764ba2']"));
    assert.ok(carousel.includes("['#f093fb', '#f5576c']"));
});

/**
 * Testes da seção "Dicas" no PDF (buildPdfHtml). Cobre o bug relatado:
 * título "Dicas" renderizava, mas os cards saíam vazios porque
 * `generalTips` é `string[]` no snapshot e o renderer assumia `{ text }`.
 *
 * Roda sem framework: `npx tsx --test src/features/route-versioning/pdfTemplate.test.ts`
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPdfHtml } from './pdfTemplate';
import { mergeItineraryWithCustomization } from './mergeEngine';

function countOccurrences(haystack: string, needle: string): number {
    return haystack.split(needle).length - 1;
}

/** Extrai o HTML da seção "Dicas" (entre o h2 e o próximo </section>). */
function extractTipsSection(html: string): string | null {
    const marker = '<h2 class="section-title">Dicas</h2>';
    const start = html.indexOf(marker);
    if (start === -1) return null;
    const end = html.indexOf('</section>', start);
    return html.slice(start, end === -1 ? undefined : end);
}

// ─── Cenário A — versão original ────────────────────────────────────

test('original: dicas do criador (string[]) aparecem com o texto visível', () => {
    const html = buildPdfHtml({
        itinerary: { title: 'Japão Clássico', generalTips: ['Leve calçados confortáveis', 'Reserve ingressos com antecedência'] },
        variant: 'original',
    });
    const section = extractTipsSection(html);
    assert.ok(section, 'seção Dicas deveria existir');
    assert.ok(section!.includes('Leve calçados confortáveis'));
    assert.ok(section!.includes('Reserve ingressos com antecedência'));
    assert.equal(countOccurrences(section!, 'class="card tip-card"'), 2);
});

// ─── Cenário F — sem dicas ───────────────────────────────────────────

test('original: roteiro sem dicas não renderiza título nem seção', () => {
    const html = buildPdfHtml({
        itinerary: { title: 'Sem dicas', generalTips: [] },
        variant: 'original',
    });
    assert.equal(extractTipsSection(html), null);
    assert.ok(!html.includes('>Dicas<'));
});

test('original: generalTips ausente (undefined) não quebra e não renderiza seção', () => {
    const html = buildPdfHtml({
        itinerary: { title: 'Sem campo' },
        variant: 'original',
    });
    assert.equal(extractTipsSection(html), null);
});

test('dica só com espaços é tratada como vazia — não vira card nem "esconde" a seção inteira indevidamente', () => {
    const html = buildPdfHtml({
        itinerary: { title: 'Mix', generalTips: ['Dica válida', '   ', ''] },
        variant: 'original',
    });
    const section = extractTipsSection(html);
    assert.ok(section);
    assert.equal(countOccurrences(section!, 'class="card tip-card"'), 1);
    assert.ok(section!.includes('Dica válida'));
});

test('todas as dicas em branco: seção inteira some (sem título nem caixas vazias)', () => {
    const html = buildPdfHtml({
        itinerary: { title: 'Só espaços', generalTips: ['   ', ''] },
        variant: 'original',
    });
    assert.equal(extractTipsSection(html), null);
});

test('nenhum card renderizado tem parágrafo de texto vazio', () => {
    const html = buildPdfHtml({
        itinerary: { title: 'Vazio', generalTips: ['', '   ', null as any, undefined as any] },
        variant: 'original',
    });
    assert.ok(!html.includes('<p class="tip-text"></p>'));
    assert.equal(extractTipsSection(html), null);
});

// ─── Cenários B–E — versão personalizada ────────────────────────────

test('personalizado sem alterações: dicas originais permanecem visíveis', () => {
    const snapshot = { title: 'Roteiro', generalTips: ['Dica 1', 'Dica 2'] } as any;
    const merged = mergeItineraryWithCustomization(snapshot, null);
    const html = buildPdfHtml({ itinerary: snapshot, merged, variant: 'personalized' });
    const section = extractTipsSection(html);
    assert.ok(section);
    assert.ok(section!.includes('Dica 1'));
    assert.ok(section!.includes('Dica 2'));
});

test('personalizado com dica adicionada: original + nova aparecem, nova com badge "Adicionado"', () => {
    const snapshot = { title: 'Roteiro', generalTips: ['Dica original'] } as any;
    const customization = {
        addedItems: { generalTips: [{ addedId: 'a1', kind: 'generalTips', data: { text: 'Minha dica nova' } }] },
    } as any;
    const merged = mergeItineraryWithCustomization(snapshot, customization);
    const html = buildPdfHtml({ itinerary: snapshot, merged, variant: 'personalized' });
    const section = extractTipsSection(html);
    assert.ok(section);
    assert.ok(section!.includes('Dica original'));
    assert.ok(section!.includes('Minha dica nova'));
    assert.ok(section!.includes('badge-added'));
});

test('personalizado com dica editada: mostra o texto novo, não o antigo', () => {
    const snapshot = { title: 'Roteiro', generalTips: ['Dica antiga'] } as any;
    const customization = {
        editedOriginalItems: { 'generalTips:0': { text: 'Dica corrigida' } },
    } as any;
    const merged = mergeItineraryWithCustomization(snapshot, customization);
    const html = buildPdfHtml({ itinerary: snapshot, merged, variant: 'personalized' });
    const section = extractTipsSection(html);
    assert.ok(section);
    assert.ok(section!.includes('Dica corrigida'));
    assert.ok(!section!.includes('Dica antiga'));
    assert.ok(section!.includes('badge-edited'));
});

test('personalizado com dica excluída: não é restaurada a partir do snapshot original', () => {
    const snapshot = { title: 'Roteiro', generalTips: ['Dica 1', 'Dica 2'] } as any;
    const customization = { hiddenOriginalIds: ['generalTips:0'] } as any;
    const merged = mergeItineraryWithCustomization(snapshot, customization);
    const html = buildPdfHtml({ itinerary: snapshot, merged, variant: 'personalized' });
    const section = extractTipsSection(html);
    assert.ok(section);
    assert.ok(!section!.includes('Dica 1'));
    assert.ok(section!.includes('Dica 2'));
});

test('personalizado sem nenhuma dica válida: seção não aparece', () => {
    const snapshot = { title: 'Roteiro', generalTips: [] } as any;
    const merged = mergeItineraryWithCustomization(snapshot, null);
    const html = buildPdfHtml({ itinerary: snapshot, merged, variant: 'personalized' });
    assert.equal(extractTipsSection(html), null);
});

// ─── Dados legados / dedupe com dicas de módulo ─────────────────────

test('formato legado (string[]) e formato objeto ({text}) coexistem sem duplicar nem quebrar', () => {
    const snapshot = { title: 'Legado', generalTips: ['Dica legada em string'] } as any;
    const customization = {
        addedItems: { generalTips: [{ addedId: 'a1', kind: 'generalTips', data: { text: 'Dica nova em objeto' } }] },
    } as any;
    const merged = mergeItineraryWithCustomization(snapshot, customization);
    const html = buildPdfHtml({ itinerary: snapshot, merged, variant: 'personalized' });
    const section = extractTipsSection(html)!;
    assert.equal(countOccurrences(section, 'class="card tip-card"'), 2);
    assert.ok(section.includes('Dica legada em string'));
    assert.ok(section.includes('Dica nova em objeto'));
});

test('dica de restaurante não duplica na seção geral "Dicas"', () => {
    const html = buildPdfHtml({
        itinerary: {
            title: 'Roteiro',
            generalTips: ['Dica geral única'],
            restaurants: [{ name: 'Sushi Bar', tips: 'Peça o menu degustação' }],
        },
        variant: 'original',
    });
    const tipsSection = extractTipsSection(html)!;
    assert.ok(tipsSection.includes('Dica geral única'));
    assert.ok(!tipsSection.includes('Peça o menu degustação'));
    // A dica do restaurante deve continuar aparecendo, só que dentro do card do módulo.
    assert.ok(html.includes('Peça o menu degustação'));
    assert.equal(countOccurrences(html, 'Peça o menu degustação'), 1);
});

test('nunca renderiza "[object Object]" mesmo com item malformado', () => {
    const html = buildPdfHtml({
        itinerary: { title: 'Malformado', generalTips: [{ foo: 'bar' } as any, 'Dica válida'] },
        variant: 'original',
    });
    assert.ok(!html.includes('[object Object]'));
    const section = extractTipsSection(html)!;
    assert.equal(countOccurrences(section, 'class="card tip-card"'), 1);
});

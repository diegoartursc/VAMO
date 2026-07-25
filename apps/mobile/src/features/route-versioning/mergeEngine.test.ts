/**
 * Testes do mergeEngine focados no bug de "Dicas" vazias no PDF:
 * `generalTips` é `string[]` no snapshot mas `{ text }` no overlay do
 * viajante — `resolveGeneralTipText` é a única fonte de verdade pros dois
 * shapes, e `applyPatch` não pode corromper uma dica original (string)
 * quando o viajante edita.
 *
 * Roda sem framework: `npx tsx --test src/features/route-versioning/mergeEngine.test.ts`
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    applyPatch,
    mergeItineraryWithCustomization,
    resolveGeneralTipText,
} from './mergeEngine';

// ─── resolveGeneralTipText ──────────────────────────────────────────

test('resolveGeneralTipText: string crua (shape canônico de generalTips)', () => {
    assert.equal(resolveGeneralTipText('Leve calçados confortáveis'), 'Leve calçados confortáveis');
});

test('resolveGeneralTipText: objeto { text } (overlay do viajante)', () => {
    assert.equal(resolveGeneralTipText({ text: 'Reserve com antecedência' }), 'Reserve com antecedência');
});

test('resolveGeneralTipText: trims espaços em ambos os shapes', () => {
    assert.equal(resolveGeneralTipText('  espaçado  '), 'espaçado');
    assert.equal(resolveGeneralTipText({ text: '  espaçado  ' }), 'espaçado');
});

test('resolveGeneralTipText: string só de espaços vira vazia', () => {
    assert.equal(resolveGeneralTipText('   '), '');
    assert.equal(resolveGeneralTipText({ text: '   ' }), '');
});

test('resolveGeneralTipText: null/undefined/objeto sem campo de texto vira vazia', () => {
    assert.equal(resolveGeneralTipText(null), '');
    assert.equal(resolveGeneralTipText(undefined), '');
    assert.equal(resolveGeneralTipText({}), '');
    assert.equal(resolveGeneralTipText({ id: 'x' }), '');
});

test('resolveGeneralTipText: nunca produz "[object Object]"', () => {
    const text = resolveGeneralTipText({ text: 'ok' });
    assert.ok(!text.includes('[object Object]'));
});

// ─── applyPatch ─────────────────────────────────────────────────────

test('applyPatch: patch sobre string crua não espalha caracteres em índices numéricos', () => {
    const result = applyPatch('Leve calçados confortáveis', { text: 'Use tênis de trilha' });
    assert.deepEqual(result, { text: 'Use tênis de trilha' });
    assert.equal((result as any)[0], undefined);
});

test('applyPatch: patch sobre objeto continua fazendo merge normal', () => {
    const result = applyPatch({ name: 'Hotel X', address: 'Rua A' }, { address: 'Rua B' });
    assert.deepEqual(result, { name: 'Hotel X', address: 'Rua B' });
});

test('applyPatch: valor null no patch remove o campo', () => {
    const result = applyPatch({ name: 'Hotel X', notes: 'algo' }, { notes: null });
    assert.deepEqual(result, { name: 'Hotel X' });
});

// ─── mergeItineraryWithCustomization: generalTips ponta a ponta ────

function baseSnapshot(generalTips: any[]) {
    return { generalTips } as any;
}

test('merge: dicas originais (string[]) aparecem como source original', () => {
    const merged = mergeItineraryWithCustomization(
        baseSnapshot(['Dica 1', 'Dica 2']),
        null,
    );
    assert.equal(merged.generalTips.length, 2);
    assert.equal(resolveGeneralTipText(merged.generalTips[0].data), 'Dica 1');
    assert.equal(merged.generalTips[0].source, 'original');
});

test('merge: dica adicionada pelo viajante aparece com source added', () => {
    const merged = mergeItineraryWithCustomization(
        baseSnapshot(['Dica original']),
        { addedItems: { generalTips: [{ addedId: 'a1', kind: 'generalTips', data: { text: 'Minha dica' } }] } } as any,
    );
    assert.equal(merged.generalTips.length, 2);
    const added = merged.generalTips.find(t => t.source === 'added');
    assert.ok(added);
    assert.equal(resolveGeneralTipText(added!.data), 'Minha dica');
});

test('merge: dica editada reflete o novo texto, não o original', () => {
    const merged = mergeItineraryWithCustomization(
        baseSnapshot(['Dica original']),
        { editedOriginalItems: { 'generalTips:0': { text: 'Dica editada' } } } as any,
    );
    assert.equal(merged.generalTips.length, 1);
    assert.equal(merged.generalTips[0].source, 'edited');
    assert.equal(resolveGeneralTipText(merged.generalTips[0].data), 'Dica editada');
});

test('merge: dica excluída não é restaurada a partir do snapshot', () => {
    const merged = mergeItineraryWithCustomization(
        baseSnapshot(['Dica 1', 'Dica 2']),
        { hiddenOriginalIds: ['generalTips:0'] } as any,
    );
    assert.equal(merged.generalTips.length, 1);
    assert.equal(resolveGeneralTipText(merged.generalTips[0].data), 'Dica 2');
    assert.equal(merged.hidden.some(h => resolveGeneralTipText(h.data) === 'Dica 1'), true);
});

test('merge: sem alterações do viajante, dicas originais permanecem intactas', () => {
    const merged = mergeItineraryWithCustomization(
        baseSnapshot(['Dica 1', 'Dica 2', 'Dica 3']),
        { notes: null, editedOriginalItems: {}, hiddenOriginalIds: [], addedItems: {} } as any,
    );
    assert.deepEqual(merged.generalTips.map(t => resolveGeneralTipText(t.data)), ['Dica 1', 'Dica 2', 'Dica 3']);
});

test('merge: roteiro sem generalTips retorna array vazio (sem lançar erro)', () => {
    const merged = mergeItineraryWithCustomization(baseSnapshot([]), null);
    assert.deepEqual(merged.generalTips, []);
});

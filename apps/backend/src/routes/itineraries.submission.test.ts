/**
 * validateItinerarySubmission (usada pelo POST, pelo PUT e pela troca de status
 * para PENDING_REVIEW) tem que aceitar/rejeitar os mesmos casos que o
 * validador do app (`validateForSubmission`, em @vamo/shared).
 *
 * Roda via runner nativo do Node:
 *   cd apps/backend && npx tsx --test src/routes/itineraries.submission.test.ts
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createEmptyForm, buildPayload, validateForSubmission, type ItineraryFormState, type Day } from '@vamo/shared/itinerary';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

function baseForm(overrides: Partial<ItineraryFormState> = {}): ItineraryFormState {
    return {
        ...createEmptyForm(),
        title: 'Mexico in 12 days',
        locations: [{ country: 'Mexico', cities: ['Mexico City'] }],
        destination: 'Mexico City',
        country: 'Mexico',
        description: 'Complete itinerary.',
        duration: 12,
        categories: ['aventura'],
        travelProofUrl: 'https://exemplo.test/comprovante.pdf',
        price: 20,
        activeModules: ['dicas'],
        generalTips: ['Tip 1', 'Tip 2'],
        highlightPhotos: ['https://exemplo.test/capa.jpg'],
        ...overrides,
    };
}

const completeDay = (n: number): Day => ({
    dayNumber: n,
    title: `Day ${n}`,
    summary: '',
    description: `Day description ${n}`,
    activities: [{ title: 'Activity', description: '', location: '', mapLink: '' } as any],
});

async function backendIssues(form: ItineraryFormState): Promise<string[]> {
    const { validateItinerarySubmission } = await import('./itineraries');
    return validateItinerarySubmission(buildPayload(form));
}

test('F: itinerario desativado e sem dias → backend aceita (POST/PUT PENDING_REVIEW)', async () => {
    const form = baseForm({ days: [] });
    assert.deepEqual(await backendIssues(form), []);
    assert.deepEqual(validateForSubmission(form), []);
});

test('F: itinerario desativado após preencher parcialmente → backend aceita', async () => {
    const form = baseForm({ days: [1, 2, 3].map(completeDay) });
    assert.deepEqual(await backendIssues(form), []);
});

test('F: itinerario ativo com 5 de 12 dias → backend rejeita, uma única mensagem de dias', async () => {
    const form = baseForm({ activeModules: ['itinerario', 'dicas'], days: [1, 2, 3, 4, 5].map(completeDay) });
    const issues = await backendIssues(form);
    assert.ok(issues.some(m => /Add all 12 days/.test(m)));
    assert.equal(issues.filter(m => /days set in the itinerary duration|Fill in the daily itinerary/.test(m)).length, 1);
    assert.ok(validateForSubmission(form).length > 0, 'frontend também rejeita');
});

test('F: itinerario ativo com os 12 dias completos → backend aceita', async () => {
    const days = Array.from({ length: 12 }, (_, i) => completeDay(i + 1));
    const form = baseForm({ activeModules: ['itinerario'], days });
    assert.deepEqual(await backendIssues(form), []);
    assert.deepEqual(validateForSubmission(form), []);
});

test('F: itinerario ativo com dia incompleto → backend rejeita, como o frontend', async () => {
    const days = Array.from({ length: 12 }, (_, i) => completeDay(i + 1));
    days[4] = { ...days[4], activities: [] };
    const form = baseForm({ activeModules: ['itinerario'], days });
    assert.ok((await backendIssues(form)).length > 0);
    assert.ok(validateForSubmission(form).length > 0);
});

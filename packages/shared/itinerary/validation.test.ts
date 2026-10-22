/**
 * Módulos desativados não geram pendência nem bloqueiam o envio.
 * Roda sem framework:
 * `npx tsx --test packages/shared/itinerary/validation.test.ts`
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createEmptyForm, type ItineraryFormState, type ModuleKey, type Day } from './types';
import { validateForSubmission } from './validation';

/** Roteiro de 12 dias válido, só com o módulo "dicas" ativo. */
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

const dayCount = /days set in the itinerary duration|Complete .* of the itinerary|Fill in every day|Add at least 1 day/;
const has = (issues: { message: string }[], re: RegExp) => issues.some(i => re.test(i.message));

test('A: itinerario desativado, 12 dias e days vazio → sem pendência de itinerário', () => {
    const issues = validateForSubmission(baseForm({ days: [] }));
    assert.deepEqual(issues, []);
});

test('B: itinerario ativo com só 5 dias completos → bloqueia, sem mensagem duplicada', () => {
    const form = baseForm({
        activeModules: ['itinerario', 'dicas'],
        days: [1, 2, 3, 4, 5].map(completeDay),
    });
    const issues = validateForSubmission(form);
    assert.ok(has(issues, /Add all 12 days/));
    assert.equal(issues.filter(i => dayCount.test(i.message)).length, 1);
});

test('B2: itinerario ativo com 12 dias, alguns incompletos → aponta os dias', () => {
    const days = Array.from({ length: 12 }, (_, i) => completeDay(i + 1));
    days[2] = { ...days[2], activities: [] };
    const issues = validateForSubmission(baseForm({ activeModules: ['itinerario'], days }));
    assert.ok(has(issues, /Complete Day 3 of the itinerary/));
    assert.ok(!has(issues, /Add all 12 days/));
});

test('B3: itinerario ativo e completo → envia', () => {
    const days = Array.from({ length: 12 }, (_, i) => completeDay(i + 1));
    assert.deepEqual(validateForSubmission(baseForm({ activeModules: ['itinerario'], days })), []);
});

test('C: ativa, preenche parcialmente e desativa → sem pendência de dias, dados preservados', () => {
    const partial = [1, 2, 3].map(completeDay);
    const form = baseForm({ activeModules: ['dicas'], days: partial });
    assert.deepEqual(validateForSubmission(form), []);
    assert.equal(form.days.length, 3, 'não apaga os dados do módulo desativado');
});

test('D: links inválidos em módulos desativados não bloqueiam', () => {
    const bad = 'this is not a link';
    const day = completeDay(1);
    (day.activities[0] as any).mapLink = bad;
    const form = baseForm({
        activeModules: ['dicas'],
        days: [day],
        accommodations: [{ name: 'Hotel', mapLink: bad, externalLink: bad } as any],
        attractions: [{ name: 'Passeio', mapLink: bad, externalLink: bad } as any],
        restaurants: [{ name: 'Rest', location: 'x', externalLink: bad } as any],
    });
    assert.deepEqual(validateForSubmission(form), []);
});

test('E: links inválidos em módulo ativo continuam bloqueando', () => {
    const bad = 'this is not a link';
    const cases: Array<[ModuleKey, Partial<ItineraryFormState>, RegExp]> = [
        ['hospedagem', { accommodations: [{ name: 'Hotel', mapLink: bad, externalLink: '' } as any] }, /Lodging: review invalid links/],
        ['passeios', { attractions: [{ name: 'Passeio', mapLink: '', externalLink: bad } as any] }, /Tours & Attractions: review invalid links/],
        ['restaurantes', { restaurants: [{ name: 'Rest', location: 'x', externalLink: bad } as any] }, /Restaurants: review invalid links/],
    ];
    for (const [mod, data, re] of cases) {
        const issues = validateForSubmission(baseForm({ activeModules: ['dicas', mod], ...data }));
        assert.ok(has(issues, re), `${mod} should block an invalid link`);
    }
    const day = completeDay(1);
    (day.activities[0] as any).mapLink = bad;
    const days = Array.from({ length: 12 }, (_, i) => (i === 0 ? day : completeDay(i + 1)));
    const issues = validateForSubmission(baseForm({ activeModules: ['itinerario'], days }));
    assert.ok(has(issues, /Day 1, activity 1: invalid map link/));
});

test('regressão: demais módulos opcionais desativados com dados vazios/incompletos não geram pendência', () => {
    const form = baseForm({
        activeModules: ['dicas'],
        accommodations: [{ name: '' } as any],
        attractions: [{ name: '' } as any],
        transports: [{ description: '', passTypes: '' } as any],
        restaurants: [{ name: '', location: '' } as any],
        checklistItems: [{ item: '' } as any],
        extraSpendingItems: [{ title: '' } as any],
        spendingEntries: [{ moduleKey: 'voo', priceValue: '0' } as any],
    });
    assert.deepEqual(validateForSubmission(form), []);
});

test('regressão: módulo ativo continua exigindo o próprio conteúdo', () => {
    const modules: ModuleKey[] = ['voo', 'hospedagem', 'passeios', 'transporte', 'restaurantes', 'checklist', 'gastos_extras', 'gasto'];
    for (const m of modules) {
        const issues = validateForSubmission(baseForm({ activeModules: ['dicas', m] }));
        assert.ok(issues.some(i => i.section === m), `${m} ativo e vazio deve gerar pendência`);
    }
});

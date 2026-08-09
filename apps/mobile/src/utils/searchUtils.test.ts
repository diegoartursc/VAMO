/**
 * Testes das regras de busca: autocomplete de destino e faixas de duração.
 *
 * Roda sem framework instalado, via runner nativo do Node:
 *   npx tsx --test apps/mobile/src/utils/searchUtils.test.ts
 *
 * As fixtures reproduzem o payload REAL de GET /api/itineraries (inclusive a
 * inversão de semântica que existe hoje em produção: um roteiro cadastrado com
 * destination="Tóquio"/country="Japão" e outro com destination="Portugal"/
 * country="Lisboa").
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    buildDestinationSuggestions,
    searchDestinationSuggestions,
    itineraryMatchesDestination,
    filterItinerariesByDestination,
    matchesDuration,
    filterItinerariesByDuration,
    getItineraryDurationDays,
    applyAllItineraryFilters,
    countMatchingItineraries,
    isPublicItinerary,
} from './searchUtils';
import {
    DURATION_PRESETS,
    getDurationRange,
    getDurationPreset,
    resolveDurationPresetFromRange,
    DEFAULT_DURATION_PRESET,
} from '../constants/durationPresets';

function makeItinerary(over: Record<string, any> = {}): any {
    return {
        id: over.id ?? Math.random().toString(36).slice(2),
        title: 'Roteiro X',
        destination: 'Tóquio',
        country: 'Japão',
        duration: 10,
        status: 'ACTIVE',
        categories: [],
        travelStyles: [],
        ...over,
    };
}

/** Espelho do banco real: 3 roteiros públicos, durações 8, 3 e 10. */
const REAL_LIKE_ITINERARIES = [
    makeItinerary({
        id: 'pt',
        title: 'Portugal Autêntico: 8 dias por Lisboa, Sintra, Porto e Vale do Douro',
        destination: 'Portugal',
        country: 'Lisboa',
        duration: 8,
    }),
    makeItinerary({
        id: 'jp-classico',
        title: 'Japão Clássico: 10 Dias em Tóquio, Kyoto e Osaka',
        destination: 'Tóquio',
        country: 'Japão',
        extraCities: ['Kyoto', 'Osaka'],
        duration: 3,
    }),
    makeItinerary({
        id: 'jp-essencial',
        title: 'Japão Essencial: 10 dias por Tóquio, Kyoto e Osaka',
        destination: 'Tóquio',
        country: 'Japão',
        duration: 10,
    }),
];

const helper = (id: string) => getDurationRange(id as any);

// ══════════════════════════════════════════════════════════════════════
// AUTOCOMPLETE
// ══════════════════════════════════════════════════════════════════════

test('1. digitar "ja" retorna Japão quando existem roteiros relacionados', () => {
    const suggestions = buildDestinationSuggestions(REAL_LIKE_ITINERARIES);
    const labels = searchDestinationSuggestions(suggestions, 'ja').map(s => s.label);
    assert.ok(labels.includes('Japão'), `esperava Japão em ${JSON.stringify(labels)}`);
});

test('2. digitar "japao" (sem acento) também retorna Japão', () => {
    const suggestions = buildDestinationSuggestions(REAL_LIKE_ITINERARIES);
    const labels = searchDestinationSuggestions(suggestions, 'japao').map(s => s.label);
    assert.ok(labels.includes('Japão'));
});

test('3. com ou sem acento, maiúsculas ou não, o resultado é o mesmo', () => {
    const suggestions = buildDestinationSuggestions(REAL_LIKE_ITINERARIES);
    const variants = ['Tóquio', 'toquio', 'TOQUIO', 'tóQuIo'];
    const results = variants.map(v => searchDestinationSuggestions(suggestions, v).map(s => s.id));
    for (const result of results) {
        assert.deepEqual(result, results[0], `variação divergente: ${JSON.stringify(results)}`);
    }
    assert.ok(results[0].includes('toquio'));
});

test('4. cidade e país são pesquisáveis (inclusive cidades extras)', () => {
    const suggestions = buildDestinationSuggestions(REAL_LIKE_ITINERARIES);
    assert.ok(searchDestinationSuggestions(suggestions, 'osaka').some(s => s.label === 'Osaka'));
    assert.ok(searchDestinationSuggestions(suggestions, 'kyo').some(s => s.label === 'Kyoto'));
    assert.ok(searchDestinationSuggestions(suggestions, 'austr').length === 0); // não há roteiro
    assert.ok(searchDestinationSuggestions(suggestions, 'lisboa').some(s => s.label === 'Lisboa'));
});

test('4b. alias em inglês encontra o destino cadastrado em português', () => {
    const suggestions = buildDestinationSuggestions(REAL_LIKE_ITINERARIES);
    assert.ok(searchDestinationSuggestions(suggestions, 'tokyo').some(s => s.label === 'Tóquio'));
    assert.ok(searchDestinationSuggestions(suggestions, 'japan').some(s => s.label === 'Japão'));
});

test('5. sugestões duplicadas são removidas e a contagem é acumulada', () => {
    const suggestions = buildDestinationSuggestions(REAL_LIKE_ITINERARIES);
    const toquio = suggestions.filter(s => s.id === 'toquio');
    assert.equal(toquio.length, 1, 'Tóquio aparece em 2 roteiros e deve virar UMA sugestão');
    assert.equal(toquio[0].itineraryCount, 2);

    const ids = suggestions.map(s => s.id);
    assert.equal(new Set(ids).size, ids.length, 'não pode haver id repetido');
});

test('6. a sugestão carrega um searchValue que casa com os campos filtrados', () => {
    const suggestions = buildDestinationSuggestions(REAL_LIKE_ITINERARIES);
    const toquio = suggestions.find(s => s.id === 'toquio')!;
    // 9. o valor selecionado NUNCA é um label composto ("Tóquio, Japão").
    assert.equal(toquio.searchValue, 'Tóquio');
    assert.ok(!toquio.searchValue.includes(','));

    const found = filterItinerariesByDestination(REAL_LIKE_ITINERARIES, toquio.searchValue);
    assert.equal(found.length, 2);
});

test('7. campo vazio não filtra nada (limpar o destino remove o filtro)', () => {
    assert.equal(filterItinerariesByDestination(REAL_LIKE_ITINERARIES, '').length, 3);
    assert.equal(filterItinerariesByDestination(REAL_LIKE_ITINERARIES, '   ').length, 3);
    assert.equal(countMatchingItineraries(REAL_LIKE_ITINERARIES, { destination: '' }), 3);
});

test('8. destino sem roteiro disponível não vira sugestão', () => {
    const comRascunho = [
        ...REAL_LIKE_ITINERARIES,
        makeItinerary({ id: 'draft', destination: 'Bali', country: 'Indonésia', status: 'DRAFT' }),
        makeItinerary({ id: 'arch', destination: 'Cancún', country: 'México', status: 'ARCHIVED' }),
    ];
    const labels = buildDestinationSuggestions(comRascunho).map(s => s.label);
    assert.ok(!labels.includes('Bali'), 'roteiro em rascunho não pode sugerir destino');
    assert.ok(!labels.includes('Cancún'), 'roteiro arquivado não pode sugerir destino');
    assert.ok(labels.includes('Japão'));
});

test('8b. query sem correspondência devolve lista vazia (estado "nenhum destino")', () => {
    const suggestions = buildDestinationSuggestions(REAL_LIKE_ITINERARIES);
    assert.deepEqual(searchDestinationSuggestions(suggestions, 'atlantida'), []);
});

test('autocomplete prioriza quem começa com o termo e respeita o limite', () => {
    const itineraries = [
        makeItinerary({ id: 'a', destination: 'Osaka', country: 'Japão' }),
        makeItinerary({ id: 'b', destination: 'Grande Osaka', country: 'Japão' }),
    ];
    const suggestions = buildDestinationSuggestions(itineraries);
    const result = searchDestinationSuggestions(suggestions, 'osa');
    assert.equal(result[0].label, 'Osaka', 'prefixo tem precedência sobre "contém"');

    const muitos = Array.from({ length: 20 }, (_, i) =>
        makeItinerary({ id: `x${i}`, destination: `Cidade ${i}`, country: `País ${i}` }),
    );
    assert.equal(searchDestinationSuggestions(buildDestinationSuggestions(muitos), '').length, 8);
    assert.equal(searchDestinationSuggestions(buildDestinationSuggestions(muitos), '', 3).length, 3);
});

test('busca por país acha o roteiro mesmo quando só a cidade está no destino', () => {
    const jp = REAL_LIKE_ITINERARIES[1];
    assert.equal(itineraryMatchesDestination(jp, 'Japão'), true);
    assert.equal(itineraryMatchesDestination(jp, 'japao'), true);
    assert.equal(itineraryMatchesDestination(jp, 'Kyoto'), true);
    assert.equal(itineraryMatchesDestination(jp, 'Portugal'), false);
});

test('campos de localização em formatos variados não quebram', () => {
    const casos = [
        makeItinerary({ destination: null, country: undefined, extraCities: null }),
        makeItinerary({ destination: ['Tóquio', 'Kyoto'], country: null }),
        makeItinerary({ destination: 'Japão', locations: [{ country: 'Japão', cities: ['Nara'] }] }),
        makeItinerary({ destination: {}, country: [] }),
        makeItinerary({ extraCountries: [null, '', 'Japão'] }),
    ];
    for (const itinerary of casos) {
        assert.doesNotThrow(() => itineraryMatchesDestination(itinerary, 'japao'));
        assert.doesNotThrow(() => buildDestinationSuggestions([itinerary]));
    }
    assert.equal(itineraryMatchesDestination(casos[2], 'nara'), true);
    assert.equal(itineraryMatchesDestination(casos[4], 'japao'), true);
});

test('título só é usado quando NÃO há campo estruturado de localização', () => {
    const semLocalizacao = makeItinerary({
        title: 'Mochilão pela Tailândia',
        destination: null,
        country: null,
    });
    assert.equal(itineraryMatchesDestination(semLocalizacao, 'tailandia'), true);

    // Com localização cadastrada, o título não pode "salvar" um destino errado.
    const comLocalizacao = makeItinerary({
        title: 'Mochilão pela Tailândia',
        destination: 'Tóquio',
        country: 'Japão',
    });
    assert.equal(itineraryMatchesDestination(comLocalizacao, 'tailandia'), false);
});

// ══════════════════════════════════════════════════════════════════════
// DURAÇÃO
// ══════════════════════════════════════════════════════════════════════

test('10. "Qualquer" não aplica limite algum', () => {
    const range = helper('any');
    assert.equal(range.durationMin, undefined);
    assert.equal(range.durationMax, undefined);
    for (const dias of [1, 2, 7, 16, 19, 45, 365]) {
        assert.equal(matchesDuration(dias, range.durationMin, range.durationMax), true);
    }
    assert.equal(filterItinerariesByDuration(REAL_LIKE_ITINERARIES).length, 3);
});

test('11. "Fim de semana" aceita 2 e 3 dias', () => {
    const { durationMin, durationMax } = helper('weekend');
    assert.equal(durationMin, 2);
    assert.equal(durationMax, 3);
    assert.equal(matchesDuration(2, durationMin, durationMax), true);
    assert.equal(matchesDuration(3, durationMin, durationMax), true);
});

test('12. "Fim de semana" rejeita 1 e 4 dias', () => {
    const { durationMin, durationMax } = helper('weekend');
    assert.equal(matchesDuration(1, durationMin, durationMax), false);
    assert.equal(matchesDuration(4, durationMin, durationMax), false);
});

test('13. "Até 7 dias" aceita 7 e rejeita 8', () => {
    const { durationMin, durationMax } = helper('up_to_7');
    assert.equal(durationMin, undefined, 'não pode existir piso artificial');
    assert.equal(matchesDuration(7, durationMin, durationMax), true);
    assert.equal(matchesDuration(1, durationMin, durationMax), true);
    assert.equal(matchesDuration(8, durationMin, durationMax), false);
});

test('14. "Até 15 dias" aceita 15 e rejeita 16', () => {
    const { durationMin, durationMax } = helper('up_to_15');
    assert.equal(matchesDuration(15, durationMin, durationMax), true);
    assert.equal(matchesDuration(16, durationMin, durationMax), false);
});

test('15. "+20 dias" aceita 20, 30 e 45 (sem teto artificial)', () => {
    const { durationMin, durationMax } = helper('20_plus');
    assert.equal(durationMin, 20);
    assert.equal(durationMax, undefined, '+20 dias não pode ter máximo');
    for (const dias of [20, 30, 45, 120]) {
        assert.equal(matchesDuration(dias, durationMin, durationMax), true, `${dias} dias deveria entrar`);
    }
});

test('16. "+20 dias" rejeita 19', () => {
    const { durationMin, durationMax } = helper('20_plus');
    assert.equal(matchesDuration(19, durationMin, durationMax), false);
});

test('16b. roteiros de 16 a 19 dias só aparecem em "Qualquer"', () => {
    const dezoito = makeItinerary({ duration: 18 });
    const presetsQueMostram = DURATION_PRESETS
        .filter(preset => matchesDuration(18, preset.min, preset.max))
        .map(preset => preset.id);
    assert.deepEqual(presetsQueMostram, ['any']);
    assert.equal(countMatchingItineraries([dezoito], helper('20_plus')), 0);
});

test('17. duração inválida ou ausente não quebra a aplicação', () => {
    const invalidos = [undefined, null, NaN, 'abc', {}, [], Infinity];
    for (const valor of invalidos) {
        assert.doesNotThrow(() => matchesDuration(valor, 2, 3));
        assert.equal(matchesDuration(valor, 2, 3), false, `${String(valor)} não pode casar com faixa`);
        // Sem faixa ativa, nada é excluído.
        assert.equal(matchesDuration(valor, undefined, undefined), true);
    }
    assert.equal(getItineraryDurationDays({ duration: 'abc' }), null);
    assert.equal(getItineraryDurationDays(null), null);
    assert.equal(getItineraryDurationDays({}), null);
});

test('17b. duração é lida de duration, durationDays, totalDays ou days[]', () => {
    assert.equal(getItineraryDurationDays({ duration: 5 }), 5);
    assert.equal(getItineraryDurationDays({ durationDays: 6 }), 6);
    assert.equal(getItineraryDurationDays({ totalDays: 7 }), 7);
    assert.equal(getItineraryDurationDays({ days: [{}, {}, {}] }), 3);
    assert.equal(getItineraryDurationDays({ duration: '9' }), 9, 'string numérica da API');
});

test('18. o filtro usa a faixa, nunca a média do intervalo', () => {
    // Média de 20..30 seria 25 e deixaria passar um roteiro de 25 dias como
    // "máximo", escondendo os de 30+. Aqui 21 (dentro da faixa) entra e
    // 25 também, mas um roteiro de 19 fica de fora.
    const { durationMin, durationMax } = helper('20_plus');
    assert.equal(matchesDuration(25, durationMin, durationMax), true);
    assert.equal(matchesDuration(19, durationMin, durationMax), false);

    // "Fim de semana" com média (2+3)/2 ≈ 3 deixaria 1 dia passar como "≤3".
    const weekend = helper('weekend');
    assert.equal(matchesDuration(1, weekend.durationMin, weekend.durationMax), false);
});

test('preset ↔ faixa é reversível e o padrão é "Qualquer"', () => {
    assert.equal(DEFAULT_DURATION_PRESET, 'any');
    for (const preset of DURATION_PRESETS) {
        const range = getDurationRange(preset.id);
        assert.equal(range.durationPreset, preset.id);
        assert.equal(resolveDurationPresetFromRange(range.durationMin, range.durationMax), preset.id);
    }
    // Id desconhecido nunca quebra a UI.
    assert.equal(getDurationPreset('inexistente' as any).id, 'any');
    assert.equal(resolveDurationPresetFromRange(undefined, undefined), 'any');
});

test('as 5 opções pedidas existem, nessa ordem', () => {
    assert.deepEqual(
        DURATION_PRESETS.map(p => p.label),
        ['Qualquer', 'Fim de semana', 'Até 7 dias', 'Até 15 dias', '+20 dias'],
    );
    assert.deepEqual(
        DURATION_PRESETS.map(p => p.id),
        ['any', 'weekend', 'up_to_7', 'up_to_15', '20_plus'],
    );
});

// ══════════════════════════════════════════════════════════════════════
// INTEGRAÇÃO (contagem = listagem)
// ══════════════════════════════════════════════════════════════════════

test('26. destino + duração combinam (AND, não OR)', () => {
    const soJapao = applyAllItineraryFilters(REAL_LIKE_ITINERARIES, { destination: 'Japão' });
    assert.equal(soJapao.length, 2);

    const japaoCurto = applyAllItineraryFilters(REAL_LIKE_ITINERARIES, {
        destination: 'Japão',
        ...helper('weekend'),
    });
    assert.deepEqual(japaoCurto.map(i => i.id), ['jp-classico'], 'só o de 3 dias');

    const japaoAte15 = applyAllItineraryFilters(REAL_LIKE_ITINERARIES, {
        destination: 'Japão',
        ...helper('up_to_15'),
    });
    assert.equal(japaoAte15.length, 2);

    const portugalCurto = applyAllItineraryFilters(REAL_LIKE_ITINERARIES, {
        destination: 'Portugal',
        ...helper('weekend'),
    });
    assert.equal(portugalCurto.length, 0, 'Portugal tem 8 dias — não é fim de semana');
});

test('27. categoria e intenção continuam funcionando junto com os demais filtros', () => {
    const itineraries = [
        makeItinerary({ id: 'c1', categories: ['cultura'], travelStyles: ['luxo'], duration: 5 }),
        makeItinerary({ id: 'c2', categories: ['praia'], travelStyles: ['economico'], duration: 5 }),
    ];
    assert.deepEqual(
        applyAllItineraryFilters(itineraries, { selectedCategories: ['cultura'] }).map(i => i.id),
        ['c1'],
    );
    assert.deepEqual(
        applyAllItineraryFilters(itineraries, { travelIntent: 'luxo' }).map(i => i.id),
        ['c1'],
    );
    assert.deepEqual(
        applyAllItineraryFilters(itineraries, { travelIntent: 'moderado' }).map(i => i.id),
        ['c2'],
        'moderado = tudo que não é luxo',
    );
    assert.deepEqual(
        applyAllItineraryFilters(itineraries, {
            selectedCategories: ['cultura'],
            travelIntent: 'luxo',
            ...helper('up_to_7'),
        }).map(i => i.id),
        ['c1'],
    );
});

test('29. limpar filtros não deixa restrição invisível', () => {
    const limpo = { destination: '', ...helper(DEFAULT_DURATION_PRESET), selectedCategories: [], travelIntent: null };
    assert.equal(countMatchingItineraries(REAL_LIKE_ITINERARIES, limpo), 3);
    assert.equal(applyAllItineraryFilters(REAL_LIKE_ITINERARIES, limpo).length, 3);
});

test('a contagem do modal usa o MESMO corte de disponibilidade da listagem', () => {
    const comRascunho = [
        ...REAL_LIKE_ITINERARIES,
        makeItinerary({ id: 'draft-jp', destination: 'Tóquio', country: 'Japão', status: 'DRAFT' }),
    ];
    assert.equal(isPublicItinerary(comRascunho[3]), false);
    assert.equal(
        countMatchingItineraries(comRascunho, { destination: 'Japão' }),
        2,
        'rascunho não pode entrar na contagem',
    );
});

test('contagem reflete cada mudança local (destino → duração → categoria)', () => {
    assert.equal(countMatchingItineraries(REAL_LIKE_ITINERARIES, {}), 3);
    assert.equal(countMatchingItineraries(REAL_LIKE_ITINERARIES, { destination: 'Tóquio' }), 2);
    assert.equal(
        countMatchingItineraries(REAL_LIKE_ITINERARIES, { destination: 'Tóquio', ...helper('weekend') }),
        1,
    );
    assert.equal(
        countMatchingItineraries(REAL_LIKE_ITINERARIES, {
            destination: 'Tóquio',
            ...helper('weekend'),
            selectedCategories: ['praia'],
        }),
        0,
    );
});

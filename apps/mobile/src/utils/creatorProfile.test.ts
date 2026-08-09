/**
 * Testes do link para o perfil público do roteirista (acesso a partir dos
 * detalhes do roteiro).
 *
 * Roda sem framework instalado, via runner nativo do Node:
 *   npx tsx --test apps/mobile/src/utils/creatorProfile.test.ts
 *
 * Cobre: id real vindo do relacionamento roteiro→criador, aliases legados,
 * e a garantia de que NUNCA sai uma rota com undefined/null.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    CREATOR_PROFILE_ROUTE_PREFIX,
    resolveCreatorId,
    buildCreatorProfileHref,
    getCreatorProfileHref,
    sanitizeReturnPath,
} from './creatorProfile';

/** Payload no formato real de GET /api/itineraries/:id. */
function makeItinerary(creator: Record<string, any> | null = {}): any {
    return {
        id: 'cmqyjuler0001t8p0p8uqx4c6',
        title: 'Japão Clássico: 10 Dias em Tóquio, Kyoto e Osaka',
        creator: creator === null
            ? null
            : {
                id: 'cmq0dp8pt00011dwy784yz0jk',
                name: 'Julia Beckenkamp',
                avatar: 'https://cdn.example/avatar.jpg',
                verificationLevel: 'basic',
                rating: 5,
                salesCount: 2,
                ...creator,
            },
    };
}

test('usa o id REAL do criador vinculado ao roteiro (creator.id)', () => {
    const itinerary = makeItinerary();
    assert.equal(resolveCreatorId(itinerary), 'cmq0dp8pt00011dwy784yz0jk');
    assert.equal(getCreatorProfileHref(itinerary), '/creator/cmq0dp8pt00011dwy784yz0jk');
});

test('a rota segue o prefixo do perfil público existente', () => {
    assert.equal(CREATOR_PROFILE_ROUTE_PREFIX, '/creator');
    assert.ok(getCreatorProfileHref(makeItinerary())!.startsWith(`${CREATOR_PROFILE_ROUTE_PREFIX}/`));
});

test('funciona para qualquer criador — nada hardcoded', () => {
    for (const id of ['abc123', 'zzz999', 'creator-42']) {
        const itinerary = makeItinerary({ id, name: `Criador ${id}` });
        assert.equal(getCreatorProfileHref(itinerary), `/creator/${id}`);
    }
});

test('aceita os aliases creatorId / authorId quando creator não vem embutido', () => {
    assert.equal(resolveCreatorId({ creatorId: 'from-creator-id' } as any), 'from-creator-id');
    assert.equal(resolveCreatorId({ authorId: 'from-author-id' } as any), 'from-author-id');
});

test('creator.id tem precedência sobre os aliases', () => {
    const itinerary = { creator: { id: 'principal' }, creatorId: 'legado', authorId: 'antigo' } as any;
    assert.equal(resolveCreatorId(itinerary), 'principal');
});

test('nunca gera rota com undefined/null/vazio', () => {
    const semCriador = [
        null,
        undefined,
        {},
        { creator: null },
        { creator: {} },
        { creator: { id: null } },
        { creator: { id: undefined } },
        { creator: { id: '' } },
        { creator: { id: '   ' } },
        // Literais que vazam de URLs/serialização e viravam "/creator/undefined".
        { creator: { id: 'undefined' } },
        { creator: { id: 'null' } },
    ];
    for (const source of semCriador) {
        assert.equal(resolveCreatorId(source as any), null, `esperava null para ${JSON.stringify(source)}`);
        assert.equal(getCreatorProfileHref(source as any), null, `esperava href null para ${JSON.stringify(source)}`);
    }
    assert.equal(buildCreatorProfileHref(undefined), null);
    assert.equal(buildCreatorProfileHref(null), null);
    assert.equal(buildCreatorProfileHref(''), null);
});

test('id com espaços em volta é normalizado, não quebra a rota', () => {
    assert.equal(buildCreatorProfileHref('  abc123  '), '/creator/abc123');
});

test('id com caracteres especiais é escapado (rota sempre válida)', () => {
    assert.equal(buildCreatorProfileHref('a b/c'), '/creator/a%20b%2Fc');
});

// ── Voltar para os detalhes do roteiro ────────────────────────────────────

test('carrega o caminho de volta para os detalhes do roteiro', () => {
    const itinerary = makeItinerary();
    assert.equal(
        getCreatorProfileHref(itinerary, { from: `/itinerary/${itinerary.id}` }),
        '/creator/cmq0dp8pt00011dwy784yz0jk?from=%2Fitinerary%2Fcmqyjuler0001t8p0p8uqx4c6',
    );
});

test('sem `from` a rota continua limpa', () => {
    assert.equal(buildCreatorProfileHref('abc'), '/creator/abc');
    assert.equal(buildCreatorProfileHref('abc', {}), '/creator/abc');
    assert.equal(buildCreatorProfileHref('abc', { from: null }), '/creator/abc');
});

test('`from` só aceita caminho interno (nada de redirect pra fora)', () => {
    assert.equal(sanitizeReturnPath('/itinerary/abc'), '/itinerary/abc');
    for (const hostil of ['https://evil.example', '//evil.example', 'evil.example', '', undefined, null, 42]) {
        assert.equal(sanitizeReturnPath(hostil as any), null, `esperava null para ${String(hostil)}`);
    }
    assert.equal(buildCreatorProfileHref('abc', { from: 'https://evil.example' }), '/creator/abc');
});

test('`from` inválido não impede a navegação para o perfil', () => {
    assert.equal(buildCreatorProfileHref('abc', { from: '//evil.example' }), '/creator/abc');
});

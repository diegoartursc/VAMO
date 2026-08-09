/**
 * creatorProfile — resolução do identificador público do roteirista e da rota
 * do seu perfil público.
 *
 * Fonte única para "qual é o link do perfil deste criador?". A tela de detalhes
 * do roteiro, os cards e qualquer outro ponto que queira abrir o perfil devem
 * passar por aqui em vez de montar `/creator/${...}` na mão — assim ninguém
 * gera `/creator/undefined` quando o payload vier sem criador.
 *
 * A rota é a MESMA já existente: app/(tabs)/creator/[id].tsx (perfil PÚBLICO,
 * consumido por GET /api/creators/:id, sem exigir login). Não confundir com
 * /(tabs)/profile (conta do usuário logado) nem com /creator-settings
 * (edição do próprio perfil).
 */

/** Prefixo da rota do perfil público — declarado uma vez só. */
export const CREATOR_PROFILE_ROUTE_PREFIX = '/creator';

/**
 * Shape mínimo aceito. Cobrimos os aliases que aparecem nos payloads do VAMO
 * (`creator.id` é o oficial hoje; os demais existem por legado/robustez).
 */
export interface CreatorIdSource {
    creator?: { id?: string | null } | null;
    creatorId?: string | null;
    authorId?: string | null;
}

/** Descarta '', espaços e os literais 'undefined'/'null' que vêm de URLs. */
function normalizeId(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (!trimmed || trimmed === 'undefined' || trimmed === 'null') return null;
    return trimmed;
}

/**
 * Extrai o id do criador de um roteiro (ou de qualquer objeto creator-like),
 * na ordem de precedência do payload atual da API.
 */
export function resolveCreatorId(source: CreatorIdSource | null | undefined): string | null {
    if (!source) return null;
    return (
        normalizeId(source.creator?.id) ??
        normalizeId(source.creatorId) ??
        normalizeId(source.authorId)
    );
}

/**
 * Aceita só caminho interno ("/algo"). Bloqueia URL absoluta, protocol-relative
 * e lixo — o `from` vira destino de navegação, então não pode virar vetor de
 * redirect pra fora do app.
 */
export function sanitizeReturnPath(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return null;
    return trimmed;
}

export interface CreatorProfileHrefOptions {
    /**
     * De onde o usuário veio, para o "voltar" do perfil ter destino certo.
     * `/creator/[id]` é irmão de `/itinerary/[id]` dentro do navegador de Tabs
     * — a navegação entre eles não empilha histórico, então sem esse `from` o
     * voltar cairia na Home em vez dos detalhes do roteiro.
     */
    from?: string | null;
}

/** Monta a rota do perfil público. Retorna `null` quando não há id válido. */
export function buildCreatorProfileHref(
    creatorId: string | null | undefined,
    options: CreatorProfileHrefOptions = {},
): string | null {
    const id = normalizeId(creatorId);
    if (!id) return null;
    const base = `${CREATOR_PROFILE_ROUTE_PREFIX}/${encodeURIComponent(id)}`;
    const from = sanitizeReturnPath(options.from);
    return from ? `${base}?from=${encodeURIComponent(from)}` : base;
}

/** Atalho: do roteiro direto para a rota (ou `null` se o criador não veio). */
export function getCreatorProfileHref(
    source: CreatorIdSource | null | undefined,
    options: CreatorProfileHrefOptions = {},
): string | null {
    return buildCreatorProfileHref(resolveCreatorId(source), options);
}

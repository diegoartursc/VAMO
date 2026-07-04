/**
 * Resolução central do avatar de usuário/criador.
 *
 * O backend retorna o avatar do criador como `traveler.avatar || '👤'`, ou
 * seja, o campo NUNCA é vazio — é uma URL http(s) (ou caminho /uploads) OU o
 * emoji placeholder '👤'. Cada componente decidir isso sozinho gerava o bug
 * de "card sempre com ícone genérico". Aqui centralizamos a regra.
 *
 * `resolveAvatarUrl(value)` devolve uma URL renderizável como <Image> OU null
 * quando não há foto real (emoji, vazio, ou string não-URL). Quando null, o
 * componente deve cair no fallback (iniciais/ícone).
 *
 * Cache: o upload de avatar gera um nome de arquivo único por timestamp
 * (`avatar-<ts>-<rand>.jpg`), então cada troca de foto = nova URL. Isso já
 * invalida o cache naturalmente — não precisamos de `?v=` artificial.
 */

/** Detecta se um valor é uma URL de imagem renderizável (não emoji/placeholder). */
export function resolveAvatarUrl(value?: string | null): string | null {
    if (typeof value !== 'string') return null;
    const v = value.trim();
    if (!v) return null;
    // Aceita http(s), caminhos servidos pelo backend (/uploads/...) e data URIs.
    if (/^https?:\/\//i.test(v)) return v;
    if (/^\/uploads\//.test(v)) return v;
    if (/^data:image\//i.test(v)) return v;
    // Qualquer outra coisa (emoji '👤', '', texto solto) → sem foto real.
    return null;
}

/**
 * Resolve o avatar de um "creator-like" (objeto vindo dos payloads de roteiro).
 * Procura nas chaves conhecidas, na ordem de prioridade do projeto.
 */
export function resolveCreatorAvatar(creator?: {
    avatar?: string | null;
    avatarUrl?: string | null;
    profileImageUrl?: string | null;
} | null): string | null {
    if (!creator) return null;
    return (
        resolveAvatarUrl(creator.avatar)
        ?? resolveAvatarUrl(creator.avatarUrl)
        ?? resolveAvatarUrl(creator.profileImageUrl)
    );
}

/** Iniciais para o fallback (ex.: "Maria Beckenkamp" → "MB"). */
export function initialsFromName(name?: string | null): string {
    const clean = String(name || '').trim();
    if (!clean) return '';
    const parts = clean.split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

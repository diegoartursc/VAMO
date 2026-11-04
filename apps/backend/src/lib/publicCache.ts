/**
 * Cache em memória das respostas PÚBLICAS do catálogo (AUD-P3).
 *
 * Só para respostas idênticas para qualquer visitante (não dependem de login):
 * GET /api/itineraries e GET /api/itineraries/featured. Nada privado entra aqui.
 *
 * - TTL curto (PUBLIC_CATALOG_CACHE_MS, padrão 30 s; 0 desliga);
 * - qualquer escrita bem-sucedida na API limpa tudo (ver app.ts), então
 *   publicar, aprovar, editar, avaliar ou vender aparece na hora;
 * - por instância: com várias instâncias cada uma tem o seu (sem Redis).
 */
const ttlMs = () => {
    const v = Number(process.env.PUBLIC_CATALOG_CACHE_MS);
    return Number.isFinite(v) && v >= 0 ? v : 30_000;
};
const MAX_KEYS = 200;
const store = new Map<string, { at: number; body: unknown }>();
export const publicCacheStats = { hits: 0, misses: 0, clears: 0 };

export function getPublicCache(key: string): unknown | undefined {
    const ttl = ttlMs();
    if (!ttl) return undefined;
    const hit = store.get(key);
    if (hit && Date.now() - hit.at < ttl) { publicCacheStats.hits++; return hit.body; }
    if (hit) store.delete(key);
    publicCacheStats.misses++;
    return undefined;
}

export function setPublicCache(key: string, body: unknown): void {
    if (!ttlMs()) return;
    if (store.size >= MAX_KEYS) store.delete(store.keys().next().value as string);
    store.set(key, { at: Date.now(), body });
}

export function clearPublicCache(): void {
    if (store.size) { store.clear(); publicCacheStats.clears++; }
}

/** Chave estável a partir da rota e dos parâmetros (ordem não importa). */
export function publicCacheKey(route: string, query: Record<string, unknown>): string {
    const parts = Object.keys(query).sort().map((k) => `${k}=${String(query[k]).slice(0, 80)}`);
    return `${route}?${parts.join('&')}`;
}

/**
 * Resolução central de mídia de um roteiro.
 *
 * Roteiros podem ter mídia em 3 campos diferentes (legacy + atual):
 *   - `highlightPhotos`: array de URLs das fotos de capa (até 3, prioridade alta)
 *   - `images`: array de URLs da galeria (vem do backend como ItineraryImage[])
 *   - `mediaUrls`: array de URLs de fotos/vídeos extras
 *
 * Esta é a única fonte de verdade para o card, capa e galeria. Garante
 * que o card NUNCA mostre "sem imagem" quando o roteirista enviou fotos
 * em qualquer dos 3 campos.
 */

const VIDEO_EXTENSIONS = ['mp4', 'mov', 'webm', 'm4v'];
const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'avif'];

export type MediaType = 'image' | 'video';

export interface MediaItem {
    url: string;
    type: MediaType;
    /** Origem do campo (útil para debug e ordering). */
    source: 'highlight' | 'gallery' | 'extra';
    order: number;
}

/** Heurística simples: verifica extensão. Default: image. */
export function isVideoUrl(url: string | null | undefined): boolean {
    if (!url) return false;
    const lower = url.split('?')[0].toLowerCase();
    return VIDEO_EXTENSIONS.some(ext => lower.endsWith(`.${ext}`));
}

export function detectMediaType(url: string | null | undefined): MediaType {
    return isVideoUrl(url) ? 'video' : 'image';
}

/** URL válida = string não vazia. Tolerante: dá benefício da dúvida. */
export function isValidMediaUrl(url: unknown): url is string {
    return typeof url === 'string' && url.trim().length > 0;
}

/**
 * Extrai um array de URLs de qualquer campo, lidando com:
 *   - array de strings: ["url1", "url2"]
 *   - array de objetos {url: ...}: [{url:"u1"}, {url:"u2"}]
 *   - undefined/null
 */
function extractUrls(field: unknown): string[] {
    if (!Array.isArray(field)) return [];
    return field
        .map((item: any) => {
            if (typeof item === 'string') return item;
            if (item && typeof item === 'object' && typeof item.url === 'string') return item.url;
            return null;
        })
        .filter(isValidMediaUrl);
}

/**
 * Retorna as URLs para usar como CAPA do roteiro (carousel hero).
 *
 * Ordem de prioridade:
 *   1. highlightPhotos (capa marcada pelo criador)
 *   2. images (galeria principal)
 *   3. mediaUrls (mídia extra)
 *
 * Deduplicado mantendo a primeira ocorrência. Retorna array vazio se
 * não há nenhuma imagem — o componente de exibição mostra fallback.
 */
export function getCoverImages(itinerary: any): string[] {
    if (!itinerary) return [];
    const highlights = extractUrls(itinerary.highlightPhotos);
    const gallery = extractUrls(itinerary.images);
    const extras = extractUrls(itinerary.mediaUrls);
    // Capa: prefere imagens (vídeo não é capa). Dedup.
    const all = [...highlights, ...gallery, ...extras].filter(u => !isVideoUrl(u));
    return Array.from(new Set(all));
}

/**
 * Retorna TODOS os arquivos de mídia (fotos + vídeos) do roteiro, com
 * tipagem e origem. Para a seção "Fotos e Vídeos da Viagem".
 *
 * Imagens (highlight) vêm primeiro, depois galeria, depois extras.
 * Vídeos sempre vão para o final, mantendo a ordem original dentro do
 * grupo. Deduplicado por URL.
 */
export function getAllMedia(itinerary: any): MediaItem[] {
    if (!itinerary) return [];
    const make = (urls: string[], source: MediaItem['source'], baseOrder: number): MediaItem[] =>
        urls.map((url, i) => ({
            url,
            type: detectMediaType(url),
            source,
            order: baseOrder + i,
        }));

    const items: MediaItem[] = [
        ...make(extractUrls(itinerary.highlightPhotos), 'highlight', 0),
        ...make(extractUrls(itinerary.images),         'gallery',   1000),
        ...make(extractUrls(itinerary.mediaUrls),      'extra',     2000),
    ];

    // Dedup por URL preservando a primeira ocorrência (a de maior prioridade)
    const seen = new Set<string>();
    const deduped = items.filter(item => {
        if (seen.has(item.url)) return false;
        seen.add(item.url);
        return true;
    });

    // Vídeos vão para o fim, preservando ordem interna
    const images = deduped.filter(m => m.type === 'image');
    const videos = deduped.filter(m => m.type === 'video');
    return [...images, ...videos];
}

/**
 * Retorna apenas fotos (sem vídeos) — útil para galeria de imagens.
 */
export function getAllPhotos(itinerary: any): MediaItem[] {
    return getAllMedia(itinerary).filter(m => m.type === 'image');
}

/**
 * Retorna apenas vídeos.
 */
export function getAllVideos(itinerary: any): MediaItem[] {
    return getAllMedia(itinerary).filter(m => m.type === 'video');
}

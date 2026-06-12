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

// ─────────────────────────────────────────────
// Resolução de URL por ambiente
// ─────────────────────────────────────────────
//
// Uploads feitos em modo disco gravam no banco a URL ABSOLUTA do host que
// recebeu o upload (`http://localhost:3333/uploads/...` quando o criador
// usou o ambiente local). Essa URL morta quebra a capa no deploy (Vercel),
// onde o backend é outro host. Aqui normalizamos no momento da LEITURA:
// qualquer URL de /uploads/ apontando para localhost é re-ancorada na
// origem da API configurada (EXPO_PUBLIC_API_URL). URLs externas
// (Supabase Storage, Unsplash, etc.) passam intocadas.
const API_ORIGIN = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3333/api')
    .replace(/\/api\/?$/, '');

const LOCALHOST_UPLOADS = /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?(\/uploads\/.+)$/i;

/**
 * Normaliza uma URL de mídia para o ambiente atual.
 *  - `/uploads/...` relativo → prefixa a origem da API.
 *  - `http://localhost:<porta>/uploads/...` → troca a origem pela da API.
 *  - Qualquer outra URL → intocada.
 */
export function resolveMediaUrl(url: string): string {
    if (url.startsWith('/uploads/')) return API_ORIGIN + url;
    const m = url.match(LOCALHOST_UPLOADS);
    if (m) return API_ORIGIN + m[1];
    return url;
}

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
        .filter(isValidMediaUrl)
        .map(resolveMediaUrl);
}

/** Máximo de imagens exibidas no carrossel de capa. Spec: 3 destaques. */
export const MAX_COVER_IMAGES = 3;

/**
 * Retorna as URLs para usar como CAPA do roteiro (carousel hero).
 *
 * Contrato:
 *   - Se `highlightPhotos` tem qualquer URL válida, usa SÓ as destacadas
 *     (capa marcada pelo criador). Capped em MAX_COVER_IMAGES.
 *   - Senão, fallback: usa as primeiras imagens válidas de `images` ou
 *     `mediaUrls`. Capped em MAX_COVER_IMAGES.
 *   - Vídeos são filtrados — capa é só imagem.
 *
 * Sem mídia em nenhum campo, retorna array vazio (componente mostra fallback).
 */
export function getCoverImages(itinerary: any): string[] {
    if (!itinerary) return [];
    const highlights = extractUrls(itinerary.highlightPhotos).filter(u => !isVideoUrl(u));
    if (highlights.length > 0) {
        return Array.from(new Set(highlights)).slice(0, MAX_COVER_IMAGES);
    }
    // Fallback quando o criador não marcou destaque: usa images depois mediaUrls.
    const gallery = extractUrls(itinerary.images).filter(u => !isVideoUrl(u));
    const extras = extractUrls(itinerary.mediaUrls).filter(u => !isVideoUrl(u));
    const fallback = Array.from(new Set([...gallery, ...extras]));
    return fallback.slice(0, MAX_COVER_IMAGES);
}

/**
 * Retorna TODOS os arquivos de mídia (fotos + vídeos) do roteiro, com
 * tipagem e origem. Útil para galeria full / lightbox.
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
 * Mídias para a seção "Fotos e Vídeos da Viagem".
 *
 * Quando o criador marcou destaques (highlightPhotos), removemos elas da
 * galeria — destaques já estão no topo via getCoverImages. Garantia
 * de que os "10 adicionais" não dupliquem os "3 destaques".
 *
 * Quando NÃO há highlightPhotos, a galeria mostra todas as mídias (mesmo
 * as que viraram capa por fallback) — preferimos exibir o material todo
 * a esconder por causa de overlap em fallback.
 */
export function getGalleryMedia(itinerary: any): MediaItem[] {
    if (!itinerary) return [];
    const highlightUrls = new Set(extractUrls(itinerary.highlightPhotos));
    if (highlightUrls.size === 0) return getAllMedia(itinerary);
    return getAllMedia(itinerary).filter(m => !highlightUrls.has(m.url));
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

// ─────────────────────────────────────────────
// Focal point — enquadramento da capa
// ─────────────────────────────────────────────

export interface FocalPoint {
    /** 0 = esquerda, 0.5 = centro, 1 = direita */
    x: number;
    /** 0 = topo, 0.5 = centro, 1 = base */
    y: number;
}

export const DEFAULT_FOCAL_POINT: FocalPoint = { x: 0.5, y: 0.5 };

function clamp01(n: unknown): number {
    const v = typeof n === 'number' && Number.isFinite(n) ? n : 0.5;
    return Math.max(0, Math.min(1, v));
}

/**
 * Lê o focal point da capa do roteiro. Fallback: centro.
 *
 * Aceita as duas formas que podem vir do backend:
 *   { x, y }
 *   { coverFocalPoint: { x, y } }
 */
export function getCoverFocalPoint(itinerary: any): FocalPoint {
    if (!itinerary) return DEFAULT_FOCAL_POINT;
    const raw = itinerary.coverFocalPoint ?? itinerary.focalPoint ?? null;
    if (!raw || typeof raw !== 'object') return DEFAULT_FOCAL_POINT;
    return { x: clamp01(raw.x), y: clamp01(raw.y) };
}

/**
 * Mídia "capa" pronta pra renderizar — URLs + focal point juntos.
 * Mesma regra de prioridade de getCoverImages.
 */
export interface RouteCoverMedia {
    images: string[];
    focalPoint: FocalPoint;
}

export function getRouteCoverMedia(itinerary: any): RouteCoverMedia {
    return {
        images: getCoverImages(itinerary),
        focalPoint: getCoverFocalPoint(itinerary),
    };
}

/**
 * One-stop pra qualquer surface (card, hero, preview, galeria).
 *
 * Evita que cada tela precise lembrar de chamar 3 helpers diferentes,
 * e garante coerência: a capa sempre vem da mesma regra.
 */
export interface NormalizedRouteMedia {
    coverImages: string[];
    coverFocalPoint: FocalPoint;
    galleryMedia: MediaItem[];
    allMedia: MediaItem[];
    coverUrl: string | null;
}

export function normalizeRouteMedia(itinerary: any): NormalizedRouteMedia {
    const coverImages = getCoverImages(itinerary);
    return {
        coverImages,
        coverFocalPoint: getCoverFocalPoint(itinerary),
        galleryMedia: getGalleryMedia(itinerary),
        allMedia: getAllMedia(itinerary),
        coverUrl: coverImages[0] ?? null,
    };
}

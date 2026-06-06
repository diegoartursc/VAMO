/**
 * Suporte centralizado a HEIC/HEIF.
 *
 * iPhones gravam fotos em HEIC por padrão. Mantemos uma única fonte de
 * verdade para validar e detectar esses arquivos em todos os uploads do
 * app — comprovantes, mídia de roteiro, avaliações e gastos.
 *
 * Observação sobre conversão no mobile:
 * o `expo-image-picker` no iOS converte HEIC para JPEG quando recebe
 * `quality < 1` (compressão acionada). Na imensa maioria dos casos o
 * asset chega já como `image/jpeg`. Mas se o picker (Android com galeria
 * sincronizada do iCloud, web mobile, etc.) entregar HEIC bruto, o
 * upload precisa funcionar — daí mantemos HEIC nas allow-lists em vez
 * de tentar transcodificar manualmente.
 */

/** MIME types HEIC/HEIF reconhecidos. Inclui variantes de sequência. */
export const HEIC_MIME_TYPES: ReadonlySet<string> = new Set([
    'image/heic',
    'image/heif',
    'image/heic-sequence',
    'image/heif-sequence',
]);

/** Extensões HEIC/HEIF reconhecidas (lowercase). */
export const HEIC_EXTENSIONS: ReadonlySet<string> = new Set(['heic', 'heif']);

/** Extensões e MIMEs aceitos pelo backend para qualquer upload de imagem. */
export const ALLOWED_IMAGE_MIME_TYPES: ReadonlySet<string> = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
    'image/heic-sequence',
    'image/heif-sequence',
]);

export const ALLOWED_IMAGE_EXTENSIONS: ReadonlySet<string> = new Set([
    'jpg', 'jpeg', 'png', 'webp', 'heic', 'heif',
]);

/** Mesma allow-list, mas incluindo PDF (para comprovantes). */
export const ALLOWED_PROOF_MIME_TYPES: ReadonlySet<string> = new Set([
    ...ALLOWED_IMAGE_MIME_TYPES,
    'application/pdf',
]);

export const ALLOWED_PROOF_EXTENSIONS: ReadonlySet<string> = new Set([
    ...ALLOWED_IMAGE_EXTENSIONS,
    'pdf',
]);

/**
 * Detecta HEIC/HEIF por MIME, extensão, URI ou nome de arquivo.
 *
 * Robusto contra: MIME ausente, extensão maiúscula, URI com query string.
 */
export function isHeicFile(input: {
    mime?: string | null;
    filename?: string | null;
    uri?: string | null;
}): boolean {
    const mime = (input.mime || '').toLowerCase();
    if (mime && HEIC_MIME_TYPES.has(mime)) return true;
    if (mime.includes('heic') || mime.includes('heif')) return true;

    const candidates = [input.filename, input.uri].filter(Boolean) as string[];
    for (const c of candidates) {
        const cleaned = c.split('?')[0].split('#')[0];
        const m = cleaned.match(/\.([a-zA-Z0-9]+)$/);
        const ext = m ? m[1].toLowerCase() : '';
        if (HEIC_EXTENSIONS.has(ext)) return true;
    }
    return false;
}

/**
 * Infere o MIME canônico a partir da extensão do filename — usado
 * quando o picker/SO não entrega `mimeType` no asset.
 */
export function inferMimeFromExtension(filename: string, fallback = 'image/jpeg'): string {
    const ext = (filename.match(/\.([a-zA-Z0-9]+)$/)?.[1] || '').toLowerCase();
    switch (ext) {
        case 'pdf':  return 'application/pdf';
        case 'png':  return 'image/png';
        case 'webp': return 'image/webp';
        case 'heic': return 'image/heic';
        case 'heif': return 'image/heif';
        case 'mp4':
        case 'm4v':  return 'video/mp4';
        case 'mov':  return 'video/quicktime';
        case 'webm': return 'video/webm';
        case 'jpg':
        case 'jpeg': return 'image/jpeg';
        default:     return fallback;
    }
}

/** Lista legível dos formatos aceitos — para textos de UI. */
export const ACCEPTED_IMAGE_FORMATS_LABEL = 'JPG, PNG, WEBP ou HEIC';
export const ACCEPTED_PROOF_FORMATS_LABEL = 'JPG, PNG, WEBP, HEIC ou PDF';

/**
 * Verifica se um arquivo é aceito como imagem — passa se o MIME ou
 * a extensão estiver na allow-list. Quando ambos são desconhecidos,
 * deixa passar (alguns pickers não entregam metadata; o backend valida).
 */
export function isAcceptedImage(mime?: string | null, filename?: string | null): boolean {
    const m = (mime || '').toLowerCase();
    if (m && ALLOWED_IMAGE_MIME_TYPES.has(m)) return true;
    const ext = (filename?.match(/\.([a-zA-Z0-9]+)$/)?.[1] || '').toLowerCase();
    if (ext && ALLOWED_IMAGE_EXTENSIONS.has(ext)) return true;
    return !m && !ext; // metadata ausente → não bloqueia
}

export function isAcceptedProof(mime?: string | null, filename?: string | null): boolean {
    const m = (mime || '').toLowerCase();
    if (m && ALLOWED_PROOF_MIME_TYPES.has(m)) return true;
    const ext = (filename?.match(/\.([a-zA-Z0-9]+)$/)?.[1] || '').toLowerCase();
    if (ext && ALLOWED_PROOF_EXTENSIONS.has(ext)) return true;
    return !m && !ext;
}

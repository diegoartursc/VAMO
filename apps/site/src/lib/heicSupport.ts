/**
 * Suporte centralizado a HEIC/HEIF no site (Next.js / Expo Web).
 *
 * Browsers não renderizam HEIC em `<img>` (exceto Safari). Por isso,
 * sempre que possível, convertemos HEIC para JPEG no client antes do
 * upload — preview e admin funcionam em qualquer browser.
 *
 * A conversão usa `heic2any` via dynamic import: se a lib não estiver
 * instalada, voltamos a enviar o HEIC bruto (o backend aceita). Esse
 * fallback garante que o app nunca quebra por causa de uma dependência
 * ausente.
 *
 * Para habilitar a conversão no client, instale `heic2any`:
 *     pnpm add heic2any
 */

/** Allow-lists alinhadas com o backend e o app mobile. */
export const HEIC_MIME_TYPES = new Set([
    'image/heic',
    'image/heif',
    'image/heic-sequence',
    'image/heif-sequence',
]);

export const HEIC_EXTENSIONS = new Set(['heic', 'heif']);

export const ACCEPTED_IMAGE_FORMATS = 'JPG, PNG, WEBP ou HEIC';
export const ACCEPTED_PROOF_FORMATS = 'JPG, PNG, WEBP, HEIC ou PDF';

/**
 * `accept` para `<input type="file">` — imagens.
 * @deprecated Prefira `acceptAttributeFor('routeCoverMedia' | 'profileAvatar' | ...)`
 *             de `lib/uploadContexts.ts` para que o aceite siga o contexto.
 */
export const ACCEPT_IMAGE_INPUT =
    'image/jpeg,image/png,image/webp,image/heic,image/heif,' +
    '.jpg,.jpeg,.png,.webp,.heic,.heif';

/** `accept` para comprovantes — imagens + PDF. */
export const ACCEPT_PROOF_INPUT = `${ACCEPT_IMAGE_INPUT},application/pdf,.pdf`;

/** `accept` para galerias — imagens + vídeo. */
export const ACCEPT_IMAGE_VIDEO_INPUT =
    `${ACCEPT_IMAGE_INPUT},video/mp4,video/quicktime,video/*,.mp4,.mov`;

/** Detecção robusta por MIME, extensão ou nome de arquivo. */
export function isHeicFile(file: Pick<File, 'name' | 'type'> | { name?: string; type?: string }): boolean {
    const mime = (file.type || '').toLowerCase();
    if (mime && (HEIC_MIME_TYPES.has(mime) || mime.includes('heic') || mime.includes('heif'))) return true;
    const name = (file.name || '').toLowerCase();
    const ext = name.match(/\.([a-z0-9]+)$/)?.[1] || '';
    return HEIC_EXTENSIONS.has(ext);
}

/**
 * Converte HEIC/HEIF para JPEG quando possível. Retorna o arquivo
 * original (HEIC bruto) se a conversão falhar ou `heic2any` não estiver
 * instalado — o backend aceita HEIC, então o upload segue.
 *
 * O arquivo retornado já tem `name` e `type` atualizados para .jpg
 * quando convertido.
 */
export async function convertHeicIfNeeded(file: File, quality = 0.9): Promise<File> {
    if (!isHeicFile(file)) return file;
    if (typeof window === 'undefined') return file; // SSR: skip

    try {
        // Dynamic import — code-splitting nativo do Next: a lib só é
        // baixada quando há HEIC para converter. Se a importação falhar
        // (lib ausente / SSR / erro de chunk), retornamos o original.
        // @ts-ignore — heic2any não tem types oficiais; tratamos como any.
        const mod: any = await import('heic2any').catch(() => null);
        if (!mod) {
            console.warn('[heic] heic2any indisponível, enviando HEIC bruto');
            return file;
        }
        const heic2any = mod.default || mod;
        const blobOrBlobs = await heic2any({
            blob: file,
            toType: 'image/jpeg',
            quality,
        });
        const blob: Blob = Array.isArray(blobOrBlobs) ? blobOrBlobs[0] : blobOrBlobs;
        const newName = file.name.replace(/\.(heic|heif)$/i, '.jpg');
        return new File([blob], newName, { type: 'image/jpeg', lastModified: Date.now() });
    } catch (err) {
        console.warn('[heic] conversão falhou, enviando HEIC bruto:', err);
        return file;
    }
}

/**
 * Verifica se o arquivo é aceito como imagem. Quando metadata está
 * ausente, não bloqueia (o backend é a fonte de verdade).
 */
export function isAcceptedImage(file: File): boolean {
    const mime = (file.type || '').toLowerCase();
    if (mime) {
        return /^image\/(jpeg|png|webp|heic|heif)/.test(mime)
            || HEIC_MIME_TYPES.has(mime);
    }
    const ext = (file.name.match(/\.([a-z0-9]+)$/i)?.[1] || '').toLowerCase();
    return !!ext && /^(jpg|jpeg|png|webp|heic|heif)$/.test(ext);
}

export function isAcceptedProof(file: File): boolean {
    if (isAcceptedImage(file)) return true;
    if (file.type === 'application/pdf') return true;
    const ext = (file.name.match(/\.([a-z0-9]+)$/i)?.[1] || '').toLowerCase();
    return ext === 'pdf';
}

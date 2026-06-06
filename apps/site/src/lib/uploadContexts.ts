/**
 * VAMO Web — Matriz central de contextos de upload.
 *
 * Espelha apps/mobile/src/utils/uploadContexts.ts. Ambos os apps
 * declaram os mesmos contextos para que a regra de "que formato vale
 * onde" seja única em todo o produto.
 *
 * Diferenças do mobile:
 *   - validateUploadFile recebe um `File` real (browser) em vez de
 *     metadados soltos.
 *   - `prepareUploadFile` aplica a conversão HEIC→JPEG do heicSupport
 *     quando o contexto aceita imagens.
 */

import { HEIC_EXTENSIONS, HEIC_MIME_TYPES, convertHeicIfNeeded } from './heicSupport';

export type MediaKind = 'image' | 'video' | 'document';

interface FormatGroup {
    mimes: ReadonlySet<string>;
    extensions: ReadonlySet<string>;
    label: string;
}

export const IMAGE_FORMATS: FormatGroup = {
    mimes: new Set<string>([
        'image/jpeg', 'image/png', 'image/webp',
        ...HEIC_MIME_TYPES,
    ]),
    extensions: new Set<string>(['jpg', 'jpeg', 'png', 'webp', ...HEIC_EXTENSIONS]),
    label: 'JPG, PNG, WEBP ou HEIC',
};

export const VIDEO_FORMATS: FormatGroup = {
    mimes: new Set<string>(['video/mp4', 'video/quicktime', 'video/webm']),
    extensions: new Set<string>(['mp4', 'mov', 'webm']),
    label: 'MP4, MOV ou WEBM',
};

export const DOCUMENT_FORMATS: FormatGroup = {
    mimes: new Set<string>(['application/pdf']),
    extensions: new Set<string>(['pdf']),
    label: 'PDF',
};

export type UploadContext =
    | 'routeCoverMedia'
    | 'routeGalleryMedia'
    | 'travelProof'
    | 'costProof'
    | 'reviewMedia'
    | 'profileAvatar'
    | 'adminAttachment';

interface UploadContextDef {
    groups: FormatGroup[];
    maxBytes: number;
    purpose: string;
}

const MB = 1024 * 1024;

export const UPLOAD_CONTEXTS: Record<UploadContext, UploadContextDef> = {
    routeCoverMedia:    { groups: [IMAGE_FORMATS],                                    maxBytes: 25 * MB,  purpose: 'capa do roteiro' },
    routeGalleryMedia:  { groups: [IMAGE_FORMATS, VIDEO_FORMATS],                     maxBytes: 100 * MB, purpose: 'galeria do roteiro' },
    travelProof:        { groups: [IMAGE_FORMATS, DOCUMENT_FORMATS],                  maxBytes: 25 * MB,  purpose: 'comprovante de viagem' },
    costProof:          { groups: [IMAGE_FORMATS, DOCUMENT_FORMATS],                  maxBytes: 25 * MB,  purpose: 'comprovante de custo' },
    reviewMedia:        { groups: [IMAGE_FORMATS],                                    maxBytes: 25 * MB,  purpose: 'foto da avaliação' },
    profileAvatar:      { groups: [IMAGE_FORMATS],                                    maxBytes: 10 * MB,  purpose: 'foto de perfil' },
    adminAttachment:    { groups: [IMAGE_FORMATS, VIDEO_FORMATS, DOCUMENT_FORMATS],   maxBytes: 100 * MB, purpose: 'anexo administrativo' },
};

function extName(name: string): string {
    return (name.match(/\.([a-zA-Z0-9]+)$/)?.[1] || '').toLowerCase();
}

function groupForFile(mime: string, ext: string, groups: FormatGroup[]): { group: FormatGroup; kind: MediaKind } | null {
    for (const g of groups) {
        if ((mime && g.mimes.has(mime)) || (ext && g.extensions.has(ext))) {
            const kind: MediaKind =
                g === IMAGE_FORMATS ? 'image'
                    : g === VIDEO_FORMATS ? 'video'
                        : 'document';
            return { group: g, kind };
        }
    }
    return null;
}

export interface ValidationOk {
    valid: true;
    mediaType: MediaKind;
    extension: string;
    mimeType: string;
}
export interface ValidationError {
    valid: false;
    reason: string;
}
export type ValidationResult = ValidationOk | ValidationError;

export function validateUploadFile(file: File, context: UploadContext): ValidationResult {
    const ctx = UPLOAD_CONTEXTS[context];
    const mime = (file.type || '').toLowerCase();
    const ext = extName(file.name || '');

    if (!mime && !ext) return { valid: false, reason: 'Arquivo sem extensão reconhecível.' };

    const match = groupForFile(mime, ext, ctx.groups);
    if (!match) {
        return { valid: false, reason: `Formato não aceito para ${ctx.purpose}. Use ${acceptedFormatsLabel(context)}.` };
    }

    if (file.size > ctx.maxBytes) {
        const mb = (file.size / MB).toFixed(1);
        const limit = (ctx.maxBytes / MB).toFixed(0);
        return { valid: false, reason: `Arquivo muito grande (${mb} MB). Máximo: ${limit} MB.` };
    }

    return {
        valid: true,
        mediaType: match.kind,
        extension: ext,
        mimeType: mime || (match.kind === 'document' ? 'application/pdf' : 'application/octet-stream'),
    };
}

export function acceptedFormatsLabel(context: UploadContext): string {
    return UPLOAD_CONTEXTS[context].groups.map(g => g.label).join(', ');
}

export function maxMegabytes(context: UploadContext): number {
    return Math.round(UPLOAD_CONTEXTS[context].maxBytes / MB);
}

export function uploadHint(context: UploadContext): string {
    return `${acceptedFormatsLabel(context)} — até ${maxMegabytes(context)} MB`;
}

export function acceptAttributeFor(context: UploadContext): string {
    const ctx = UPLOAD_CONTEXTS[context];
    const mimes = new Set<string>();
    const exts = new Set<string>();
    for (const g of ctx.groups) {
        g.mimes.forEach(m => mimes.add(m));
        g.extensions.forEach(e => exts.add(`.${e}`));
    }
    return [...mimes, ...exts].join(',');
}

/**
 * Aplica conversão de HEIC→JPEG quando o contexto aceita imagens.
 * Para vídeos/PDFs, retorna o arquivo intocado.
 */
export async function prepareUploadFile(file: File, context: UploadContext): Promise<File> {
    const ctx = UPLOAD_CONTEXTS[context];
    const acceptsImage = ctx.groups.includes(IMAGE_FORMATS);
    if (!acceptsImage) return file;
    return convertHeicIfNeeded(file);
}

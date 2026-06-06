/**
 * VAMO — Matriz central de contextos de upload.
 *
 * Cada ponto de upload do app declara um `UploadContext` e usa
 * `validateUploadFile(file, context)` para checar se o arquivo é aceito.
 * Toda a UI (textos de hint, accept= em inputs web, mensagens de erro)
 * é derivada desta matriz — telas não duplicam allow-lists.
 *
 * Convenção: cada contexto declara
 *   - quais grupos de mídia aceita (image / video / document),
 *   - o limite de bytes,
 *   - um label legível para mensagens de UI.
 *
 * Para adicionar um novo ponto de upload no app:
 *   1. Adicione um membro em UPLOAD_CONTEXTS (ou reutilize um existente).
 *   2. No call site, chame validateUploadFile() antes de subir.
 *   3. Use ACCEPT_BY_CONTEXT[context] em <input> web e
 *      acceptedFormatsLabel(context) na mensagem de UI.
 */

import {
    HEIC_EXTENSIONS,
    HEIC_MIME_TYPES,
    inferMimeFromExtension,
} from './heicSupport';

// ─── Catálogo de formatos por categoria ─────────────────────────────

/** Tipo de mídia normalizado depois da validação. */
export type MediaKind = 'image' | 'video' | 'document';

interface FormatGroup {
    /** Conjunto de MIMEs (em lowercase) aceitos neste grupo. */
    mimes: ReadonlySet<string>;
    /** Conjunto de extensões (sem ponto, lowercase) aceitas neste grupo. */
    extensions: ReadonlySet<string>;
    /** Rótulo curto para UI (ex: "JPG, PNG, WEBP ou HEIC"). */
    label: string;
}

export const IMAGE_FORMATS: FormatGroup = {
    mimes: new Set<string>([
        'image/jpeg',
        'image/png',
        'image/webp',
        ...HEIC_MIME_TYPES,
    ]),
    extensions: new Set<string>(['jpg', 'jpeg', 'png', 'webp', ...HEIC_EXTENSIONS]),
    label: 'JPG, PNG, WEBP ou HEIC',
};

export const VIDEO_FORMATS: FormatGroup = {
    mimes: new Set<string>([
        'video/mp4',
        'video/quicktime',
        'video/webm',
        // alguns clientes mandam genérico — aceitamos por extensão
    ]),
    extensions: new Set<string>(['mp4', 'mov', 'webm']),
    label: 'MP4, MOV ou WEBM',
};

export const DOCUMENT_FORMATS: FormatGroup = {
    mimes: new Set<string>(['application/pdf']),
    extensions: new Set<string>(['pdf']),
    label: 'PDF',
};

// ─── Definição dos contextos ────────────────────────────────────────

/** Identificador estável de cada ponto de upload do app. */
export type UploadContext =
    | 'routeCoverMedia'      // Capa/destaque do roteiro — só imagens
    | 'routeGalleryMedia'    // Galeria "Fotos e Vídeos da Viagem" — imagens + vídeos
    | 'travelProof'          // Comprovante de viagem — imagens + PDF
    | 'costProof'            // Comprovante de custo (módulos) — imagens + PDF
    | 'reviewMedia'          // Foto em avaliação — só imagens
    | 'profileAvatar'        // Avatar/foto de perfil — só imagens
    | 'travelerFile'         // Arquivo da viagem (Central da Viagem) — imagens + PDF + vídeos
    | 'adminAttachment';     // Admin — tudo

interface UploadContextDef {
    /** Grupos de formato aceitos, na ordem em que aparecem no label. */
    groups: FormatGroup[];
    /** Limite de bytes para este contexto. */
    maxBytes: number;
    /** Descrição curta usada em mensagens de erro/hint. */
    purpose: string;
}

const MB = 1024 * 1024;

export const UPLOAD_CONTEXTS: Record<UploadContext, UploadContextDef> = {
    routeCoverMedia: {
        groups: [IMAGE_FORMATS],
        maxBytes: 25 * MB,
        purpose: 'capa do roteiro',
    },
    routeGalleryMedia: {
        groups: [IMAGE_FORMATS, VIDEO_FORMATS],
        maxBytes: 100 * MB, // vídeos exigem mais
        purpose: 'galeria do roteiro',
    },
    travelProof: {
        groups: [IMAGE_FORMATS, DOCUMENT_FORMATS],
        maxBytes: 25 * MB,
        purpose: 'comprovante de viagem',
    },
    costProof: {
        groups: [IMAGE_FORMATS, DOCUMENT_FORMATS],
        maxBytes: 25 * MB,
        purpose: 'comprovante de custo',
    },
    reviewMedia: {
        groups: [IMAGE_FORMATS],
        maxBytes: 25 * MB,
        purpose: 'foto da avaliação',
    },
    profileAvatar: {
        groups: [IMAGE_FORMATS],
        maxBytes: 10 * MB,
        purpose: 'foto de perfil',
    },
    travelerFile: {
        groups: [IMAGE_FORMATS, VIDEO_FORMATS, DOCUMENT_FORMATS],
        maxBytes: 50 * MB,
        purpose: 'arquivo da viagem',
    },
    adminAttachment: {
        groups: [IMAGE_FORMATS, VIDEO_FORMATS, DOCUMENT_FORMATS],
        maxBytes: 100 * MB,
        purpose: 'anexo administrativo',
    },
};

// ─── Helpers de extração ────────────────────────────────────────────

function extractExtension(filename?: string | null, uri?: string | null): string {
    const candidates = [filename, uri].filter(Boolean) as string[];
    for (const c of candidates) {
        const cleaned = c.split('?')[0].split('#')[0];
        const m = cleaned.match(/\.([a-zA-Z0-9]+)$/);
        if (m) return m[1].toLowerCase();
    }
    return '';
}

function groupForExtensionOrMime(
    mime: string,
    ext: string,
    groups: FormatGroup[],
): { group: FormatGroup; kind: MediaKind } | null {
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

// ─── API pública ────────────────────────────────────────────────────

export interface UploadFileInput {
    /** URI local (file://, blob:, content://). */
    uri?: string | null;
    /** Nome de arquivo informado pelo picker/SO. */
    filename?: string | null;
    /** MIME informado pelo picker (pode estar vazio). */
    mime?: string | null;
    /** Tamanho em bytes (se conhecido). */
    size?: number | null;
}

export interface ValidationOk {
    valid: true;
    mediaType: MediaKind;
    extension: string;
    mimeType: string;
    /** Filename garantidamente preenchido (gerado se ausente). */
    filename: string;
    size?: number;
}

export interface ValidationError {
    valid: false;
    reason: string;
}

export type ValidationResult = ValidationOk | ValidationError;

/**
 * Valida um arquivo contra a matriz de um contexto. Não faz I/O —
 * todas as decisões são tomadas a partir dos metadados informados.
 */
export function validateUploadFile(
    file: UploadFileInput,
    context: UploadContext,
): ValidationResult {
    const ctx = UPLOAD_CONTEXTS[context];
    if (!ctx) return { valid: false, reason: 'Contexto de upload desconhecido.' };

    const mime = (file.mime || '').toLowerCase();
    const ext = extractExtension(file.filename, file.uri);

    // Sem nenhum metadado, não conseguimos decidir — recusamos.
    if (!mime && !ext) {
        return { valid: false, reason: 'Arquivo sem extensão reconhecível.' };
    }

    const match = groupForExtensionOrMime(mime, ext, ctx.groups);
    if (!match) {
        return {
            valid: false,
            reason: `Formato não aceito para ${ctx.purpose}. Use ${acceptedFormatsLabel(context)}.`,
        };
    }

    if (file.size != null && file.size > ctx.maxBytes) {
        const mb = (file.size / MB).toFixed(1);
        const limitMb = (ctx.maxBytes / MB).toFixed(0);
        return {
            valid: false,
            reason: `Arquivo muito grande (${mb} MB). Máximo: ${limitMb} MB.`,
        };
    }

    const filename = file.filename
        || (file.uri ? file.uri.split('/').pop()?.split('?')[0] : undefined)
        || `upload-${Date.now()}.${ext || 'bin'}`;

    return {
        valid: true,
        mediaType: match.kind,
        extension: ext || (mime.split('/')[1] ?? ''),
        mimeType: mime || inferMimeFromExtension(filename),
        filename,
        size: file.size ?? undefined,
    };
}

/** Rótulo legível dos formatos aceitos por um contexto. */
export function acceptedFormatsLabel(context: UploadContext): string {
    const ctx = UPLOAD_CONTEXTS[context];
    return ctx.groups.map(g => g.label).join(', ');
}

/** Limite em MB (inteiro arredondado) para uso em mensagens de UI. */
export function maxMegabytes(context: UploadContext): number {
    return Math.round(UPLOAD_CONTEXTS[context].maxBytes / MB);
}

/** String "JPG, PNG, WEBP ou HEIC — até 25 MB" para hints de UI. */
export function uploadHint(context: UploadContext): string {
    return `${acceptedFormatsLabel(context)} — até ${maxMegabytes(context)} MB`;
}

/**
 * `accept` correspondente para <input type="file"> no Expo Web.
 * Inclui MIMEs e extensões com ponto — cobre browsers que se baseiam
 * só num dos dois.
 */
export function acceptAttributeFor(context: UploadContext): string {
    const ctx = UPLOAD_CONTEXTS[context];
    const mimes = new Set<string>();
    const extDots = new Set<string>();
    for (const g of ctx.groups) {
        g.mimes.forEach(m => mimes.add(m));
        g.extensions.forEach(e => extDots.add(`.${e}`));
    }
    return [...mimes, ...extDots].join(',');
}

/** Detecta o `mediaType` resultante (sem revalidar o resto). */
export function detectMediaType(file: UploadFileInput): MediaKind | null {
    const mime = (file.mime || '').toLowerCase();
    const ext = extractExtension(file.filename, file.uri);
    if (IMAGE_FORMATS.mimes.has(mime) || IMAGE_FORMATS.extensions.has(ext)) return 'image';
    if (VIDEO_FORMATS.mimes.has(mime) || VIDEO_FORMATS.extensions.has(ext)) return 'video';
    if (DOCUMENT_FORMATS.mimes.has(mime) || DOCUMENT_FORMATS.extensions.has(ext)) return 'document';
    return null;
}

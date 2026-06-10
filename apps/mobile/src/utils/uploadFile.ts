import { Platform } from 'react-native';
import { getSession, setSession } from './secureSession';
import { inferMimeFromExtension } from './heicSupport';
import {
    detectMediaType,
    validateUploadFile,
    type MediaKind,
    type UploadContext,
} from './uploadContexts';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3333/api';

export interface PreparedUploadFile {
    uri: string;
    fileName: string;
    originalFileName: string;
    mimeType: string;
    fileType: MediaKind;
    size?: number;
    context: UploadContext;
    previewUri: string;
    convertedFrom?: string;
}

export interface UploadedFileMetadata {
    url: string;
    storagePath: string;
    fileName: string;
    originalFileName: string;
    mimeType: string;
    fileType: MediaKind;
    size?: number;
    context: UploadContext;
    thumbnailUrl?: string;
    convertedFrom?: string;
}

export interface UploadInput {
    uri: string;
    filename?: string | null;
    mime?: string | null;
    size?: number | null;
}

/**
 * Tenta renovar o accessToken usando o refreshToken salvo na sessão
 * (SecureStore no nativo, AsyncStorage no web — via secureSession).
 * Retorna o novo token ou null se o refresh falhou (sessão precisa de login).
 */
async function tryRefreshSession(): Promise<string | null> {
    try {
        const session = await getSession();
        const refreshToken = session?.refreshToken;
        if (!session || !refreshToken) return null;

        const res = await fetch(`${API_BASE}/auth/traveler/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
        });
        if (!res.ok) return null;
        const data = await res.json();
        const newToken = data.accessToken;
        if (!newToken) return null;

        await setSession({ ...session, accessToken: newToken });
        return newToken;
    } catch {
        return null;
    }
}

function filenameFromUri(uri: string, fallbackExt = 'jpg'): string {
    return uri.split('/').pop()?.split('?')[0]?.split('#')[0] || `upload-${Date.now()}.${fallbackExt}`;
}

function storagePathFromUrl(url: string): string {
    try {
        return new URL(url).pathname;
    } catch {
        return url;
    }
}

function friendlyUploadError(status: number): string {
    if (status === 401) return 'Sua sessão expirou. Faça login novamente.';
    if (status === 403) return 'Você não tem permissão para enviar este arquivo.';
    if (status === 413) return 'Esse arquivo é muito grande. Tente enviar uma versão menor.';
    if (status === 415) return 'Esse formato não é aceito neste campo.';
    return 'Não foi possível enviar o arquivo. Verifique sua conexão e tente novamente.';
}

export async function prepareUploadFile(
    input: UploadInput,
    context: UploadContext,
): Promise<PreparedUploadFile> {
    const fallbackName = filenameFromUri(input.uri);
    const filename = input.filename || fallbackName;
    const mime = (input.mime || inferMimeFromExtension(filename, '')).toLowerCase();
    const validation = validateUploadFile(
        { uri: input.uri, filename, mime, size: input.size },
        context,
    );

    if (!validation.valid) {
        throw new Error(validation.reason);
    }

    return {
        uri: input.uri,
        fileName: validation.filename,
        originalFileName: filename,
        mimeType: validation.mimeType || mime || inferMimeFromExtension(filename),
        fileType: validation.mediaType,
        size: validation.size,
        context,
        previewUri: input.uri,
    };
}

export async function uploadPreparedFile(
    prepared: PreparedUploadFile,
    token: string | null | undefined,
): Promise<UploadedFileMetadata> {
    const startedAt = Date.now();
    const buildFormData = async (): Promise<FormData> => {
        const fd = new FormData();
        if (Platform.OS === 'web') {
            const blobRes = await fetch(prepared.uri);
            if (!blobRes.ok) {
                throw new Error('Não foi possível ler o arquivo selecionado.');
            }
            const blob = await blobRes.blob();
            const blobToSend = blob.type
                ? blob
                : new Blob([blob], { type: prepared.mimeType });
            fd.append('file', blobToSend, prepared.fileName);
        } else {
            // @ts-ignore RN-specific form data shape
            fd.append('file', {
                uri: prepared.uri,
                name: prepared.fileName,
                type: prepared.mimeType,
            });
        }
        return fd;
    };

    let currentToken = token;
    let res: Response;
    for (let attempt = 0; attempt < 2; attempt++) {
        const headers: Record<string, string> = {};
        if (currentToken) headers.Authorization = `Bearer ${currentToken}`;
        const formData = await buildFormData();
        res = await fetch(`${API_BASE}/uploads`, {
            method: 'POST',
            headers,
            body: formData,
        });
        if (res.status !== 401 || attempt === 1) break;
        const newToken = await tryRefreshSession();
        if (!newToken) throw new Error('Sua sessão expirou. Faça login novamente.');
        currentToken = newToken;
    }

    const elapsed = Date.now() - startedAt;
    if (!res!.ok) {
        let detail = '';
        try { detail = await res!.text(); } catch {}
        console.warn('[upload] falhou', { status: res!.status, detail, elapsed });
        throw new Error(friendlyUploadError(res!.status));
    }

    const data = await res!.json();
    const url = data.url || data.urls?.[0];
    if (!url) throw new Error('Servidor não retornou a URL do arquivo.');
    const returnedMime = data.mimetype || prepared.mimeType;
    const returnedName = data.filename || prepared.fileName;

    return {
        url,
        storagePath: storagePathFromUrl(url),
        fileName: returnedName,
        originalFileName: data.originalName || prepared.originalFileName,
        mimeType: returnedMime,
        fileType: data.mediaType || detectMediaType({ filename: returnedName, mime: returnedMime }) || prepared.fileType,
        size: data.size || prepared.size,
        context: prepared.context,
        thumbnailUrl: data.thumbnailUrl,
        convertedFrom: prepared.convertedFrom,
    };
}

/**
 * Upload cross-platform de um arquivo (imagem/PDF) para POST /api/uploads.
 *
 *  - Native (iOS/Android): usa o shape RN `{ uri, name, type }` no FormData.
 *  - Web (Expo Web): converte a URI (`blob:`, `data:`, `http:`) num Blob real
 *    antes de anexar — caso contrário o backend recebe campo vazio.
 *
 * Em caso de 401, tenta refresh do token uma vez e refaz a requisição.
 * Lança Error com mensagem descritiva ao falhar (em vez de retornar null
 * silenciosamente) — permite mostrar o erro real ao usuário.
 *
 * Retorna a URL pública (https://...) salva pelo backend.
 */
export async function uploadFile(
    uri: string,
    token: string | null | undefined,
    filenameHint?: string,
    mimeHint?: string,
    context: UploadContext = 'adminAttachment',
): Promise<string> {
    const prepared = await prepareUploadFile(
        { uri, filename: filenameHint, mime: mimeHint },
        context,
    );
    const uploaded = await uploadPreparedFile(prepared, token);
    return uploaded.url;
}

export default uploadFile;

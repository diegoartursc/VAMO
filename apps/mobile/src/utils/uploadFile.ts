import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3333/api';

/**
 * Tenta renovar o accessToken usando o refreshToken salvo no AsyncStorage.
 * Retorna o novo token ou null se o refresh falhou (sessão precisa de login).
 */
async function tryRefreshSession(): Promise<string | null> {
    try {
        const raw = await AsyncStorage.getItem('@vamo_session');
        if (!raw) return null;
        const session = JSON.parse(raw);
        const refreshToken = session?.refreshToken;
        if (!refreshToken) return null;

        const res = await fetch(`${API_BASE}/auth/traveler/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
        });
        if (!res.ok) return null;
        const data = await res.json();
        const newToken = data.accessToken;
        if (!newToken) return null;

        await AsyncStorage.setItem(
            '@vamo_session',
            JSON.stringify({ ...session, accessToken: newToken }),
        );
        return newToken;
    } catch {
        return null;
    }
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
): Promise<string> {
    const startedAt = Date.now();
    const filename = filenameHint || uri.split('/').pop()?.split('?')[0] || `upload-${Date.now()}.jpg`;
    const ext = (filename.match(/\.(\w+)$/)?.[1] || 'jpg').toLowerCase();
    const inferredMime = mimeHint
        || (ext === 'pdf' ? 'application/pdf'
            : ext === 'png' ? 'image/png'
            : ext === 'webp' ? 'image/webp'
            : ext === 'gif' ? 'image/gif'
            : 'image/jpeg');

    // Constrói o FormData (factory para podermos reconstruir no retry —
    // alguns FormData em RN não são reutilizáveis após uma falha.)
    const buildFormData = async (): Promise<FormData> => {
        const fd = new FormData();
        if (Platform.OS === 'web') {
            const blobRes = await fetch(uri);
            if (!blobRes.ok) {
                throw new Error(`Não foi possível ler o arquivo selecionado (HTTP ${blobRes.status}).`);
            }
            const blob = await blobRes.blob();
            fd.append('file', blob, filename);
        } else {
            // @ts-ignore RN-specific form data shape
            fd.append('file', { uri, name: filename, type: inferredMime });
        }
        return fd;
    };

    // Tentativa principal. Em caso de 401, refresh + 1 retry.
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
        if (res!.status === 401) throw new Error('Sua sessão expirou. Faça login novamente.');
        if (res!.status === 413) throw new Error('Arquivo muito grande (máx 25 MB).');
        if (res!.status === 415) throw new Error('Formato de arquivo não suportado.');
        throw new Error(`Upload falhou (HTTP ${res!.status}). Verifique sua conexão.`);
    }
    const data = await res!.json();
    const url = data.url || data.urls?.[0];
    if (!url) throw new Error('Servidor não retornou a URL do arquivo.');
    return url;
}

export default uploadFile;

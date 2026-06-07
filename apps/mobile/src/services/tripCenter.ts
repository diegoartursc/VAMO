/**
 * VAMO — Minha Central da Viagem (API service).
 *
 * Cobre os endpoints `/api/trip-center/:itineraryId/...`:
 *
 *   - Checklist: GET / POST / PATCH / DELETE
 *   - Arquivos:  GET / POST / DELETE
 *
 * Toda chamada exige JWT do viajante (Authorization: Bearer <token>).
 * Os erros do backend (`{ error: '...' }`) viram `throw new Error(error)`,
 * para que a UI possa exibir a mensagem ao usuário diretamente.
 *
 * Tipos `TravelerChecklistItem` e `TravelerFile` espelham as models do
 * Prisma — campos em camelCase, datas como string ISO (serializadas pelo
 * Express JSON).
 */

import { Platform } from 'react-native';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3333/api';

// ─── Tipos ──────────────────────────────────────────────────────────

export interface TravelerChecklistItem {
    id: string;
    travelerId: string;
    itineraryId: string;
    purchaseId: string | null;
    saleId: string | null;
    category: string;
    item: string;
    completed: boolean;
    order: number;
    createdAt: string;
    updatedAt: string;
}

export interface TravelerFile {
    id: string;
    travelerId: string;
    itineraryId: string;
    purchaseId: string | null;
    saleId: string | null;
    category: string;
    title: string;
    url: string;
    originalFileName: string | null;
    mimeType: string | null;
    sizeBytes: number | null;
    note: string | null;
    createdAt: string;
}

// ─── Helper interno ─────────────────────────────────────────────────

/**
 * Wrapper único para fetch — anexa o JWT, parseia JSON, padroniza erros.
 * Suporta GET (default) e métodos com `body` JSON.
 */
async function request<T>(
    path: string,
    token: string,
    init?: { method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'; body?: unknown },
): Promise<T> {
    const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
    };
    let body: BodyInit | undefined;
    if (init?.body !== undefined) {
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify(init.body);
    }
    const res = await fetch(`${API_BASE_URL}${path}`, {
        method: init?.method ?? 'GET',
        headers,
        body,
    });
    // Tenta parsear sempre — mesmo em erro, o backend devolve `{ error }`.
    let data: any = null;
    try { data = await res.json(); } catch { /* ignore */ }
    if (!res.ok) {
        const message = data?.error || `API Error: ${res.status}`;
        throw new Error(message);
    }
    return data as T;
}

// ─── Checklist ──────────────────────────────────────────────────────

export async function getTripChecklist(
    itineraryId: string,
    token: string,
): Promise<TravelerChecklistItem[]> {
    const data = await request<{ items: TravelerChecklistItem[] }>(
        `/trip-center/${encodeURIComponent(itineraryId)}/checklist`,
        token,
    );
    return Array.isArray(data?.items) ? data.items : [];
}

export async function addChecklistItem(
    itineraryId: string,
    body: { category: string; item: string },
    token: string,
): Promise<TravelerChecklistItem> {
    const data = await request<{ item: TravelerChecklistItem }>(
        `/trip-center/${encodeURIComponent(itineraryId)}/checklist`,
        token,
        { method: 'POST', body },
    );
    return data.item;
}

export async function updateChecklistItem(
    itineraryId: string,
    itemId: string,
    body: Partial<{ completed: boolean; item: string; category: string }>,
    token: string,
): Promise<TravelerChecklistItem> {
    const data = await request<{ item: TravelerChecklistItem }>(
        `/trip-center/${encodeURIComponent(itineraryId)}/checklist/${encodeURIComponent(itemId)}`,
        token,
        { method: 'PATCH', body },
    );
    return data.item;
}

export async function deleteChecklistItem(
    itineraryId: string,
    itemId: string,
    token: string,
): Promise<void> {
    await request<{ ok: true }>(
        `/trip-center/${encodeURIComponent(itineraryId)}/checklist/${encodeURIComponent(itemId)}`,
        token,
        { method: 'DELETE' },
    );
}

// ─── Arquivos ───────────────────────────────────────────────────────

export async function getTripFiles(
    itineraryId: string,
    token: string,
): Promise<TravelerFile[]> {
    const data = await request<{ files: TravelerFile[] }>(
        `/trip-center/${encodeURIComponent(itineraryId)}/files`,
        token,
    );
    return Array.isArray(data?.files) ? data.files : [];
}

export async function uploadTripFile(
    itineraryId: string,
    body: {
        category: string;
        title: string;
        note?: string;
        uri: string;
        filename: string;
        mimeType: string;
    },
    token: string,
): Promise<TravelerFile> {
    const form = new FormData();
    form.append('category', body.category);
    form.append('title', body.title);
    if (body.note?.trim()) form.append('note', body.note.trim());
    if (Platform.OS === 'web') {
        const source = await fetch(body.uri);
        if (!source.ok) throw new Error('Não foi possível ler o arquivo selecionado.');
        const blob = await source.blob();
        form.append('file', blob.type ? blob : new Blob([blob], { type: body.mimeType }), body.filename);
    } else {
        // @ts-ignore React Native multipart file shape.
        form.append('file', { uri: body.uri, name: body.filename, type: body.mimeType });
    }

    const response = await fetch(
        `${API_BASE_URL}/trip-center/${encodeURIComponent(itineraryId)}/files/upload`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form },
    );
    let data: any = null;
    try { data = await response.json(); } catch {}
    if (!response.ok) throw new Error(data?.error || `API Error: ${response.status}`);
    return data.file;
}

export async function deleteTripFile(
    itineraryId: string,
    fileId: string,
    token: string,
): Promise<void> {
    await request<{ ok: true }>(
        `/trip-center/${encodeURIComponent(itineraryId)}/files/${encodeURIComponent(fileId)}`,
        token,
        { method: 'DELETE' },
    );
}

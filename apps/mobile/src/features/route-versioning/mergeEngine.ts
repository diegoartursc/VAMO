/**
 * VAMO — Roteiro Editável Pós-Compra (merge engine).
 *
 * Combina o `snapshot` congelado da venda (versão "Original") com o
 * `customization` overlay do viajante (notas, edições, adições e
 * ocultações) e produz um único `MergedItinerary` pronto para render
 * na aba "Minha versão".
 *
 * Princípios:
 *  - Pura: sem React, sem fetch, sem mutação dos inputs.
 *  - Tolerante a entrada: snapshot/customization podem ser null/parciais.
 *  - Origem rastreável: cada item carrega `source` ('original' | 'added'
 *    | 'edited') para a UI desenhar badges.
 *  - Determinística: dois roteiros idênticos produzem o mesmo `originalId`
 *    (necessário para identificar itens no backend mesmo sem `id`).
 *
 * Identificação dos itens originais (`originalIdOf`):
 *  - `dayActivity`        → `<dayNumber>:<idx>`
 *  - `flightOutbound`     → `flightOutbound:0` (singleton)
 *  - `flightReturn`       → `flightReturn:0`
 *  - todos os outros kinds → `<id>` se houver, senão `<kind>:<idx>`
 *
 * A escolha de derivar do índice é deliberada: o snapshot é imutável
 * depois da venda, então a ordem dos itens não muda — usar índice
 * mantém o pareamento estável mesmo para itens sem `id` no banco
 * (atrações, restaurantes, etc.).
 */

import type {
    AddedItem,
    AddedItemsMap,
    EditedPatchMap,
    ItemKind,
    RouteSnapshot,
    TravelerItineraryCustomization,
} from '../../services/routeCustomization';

// Re-export para os componentes não precisarem dupla-importar.
export type { ItemKind, AddedItem };

export type ItemSource = 'original' | 'added' | 'edited';

/**
 * Item já mesclado, pronto para a UI. `data` é o conteúdo final
 * (snapshot + patch para 'edited'; payload bruto para 'added';
 * snapshot puro para 'original').
 */
export interface MergedItem {
    kind: ItemKind;
    source: ItemSource;
    /** Presente quando o item nasceu do snapshot original. */
    originalId?: string;
    /** Presente quando o item foi adicionado pelo viajante. */
    addedId?: string;
    data: any;
}

/**
 * Dia mesclado — atividades já passaram pelo merge com edições e
 * ocultações, e adições do viajante para aquele `dayNumber` foram
 * concatenadas.
 */
export interface MergedDay {
    dayNumber: number;
    title?: string;
    summary?: string;
    description?: string;
    activities: MergedItem[];
}

/**
 * Resultado completo do merge. `base` é o snapshot bruto (para
 * componentes que precisam de metadados — título, destino, capa, etc.).
 * `hidden` reúne os originais que o viajante escondeu, para a UI poder
 * oferecer "mostrar/restaurar".
 */
export interface MergedItinerary {
    base: RouteSnapshot | null;
    notes: string | null;
    accommodations: MergedItem[];
    transports: MergedItem[];
    attractions: MergedItem[];
    restaurants: MergedItem[];
    generalTips: MergedItem[];
    checklistItems: MergedItem[];
    extraSpendingItems: MergedItem[];
    flightOutbound: MergedItem | null;
    flightReturn: MergedItem | null;
    days: MergedDay[];
    hidden: MergedItem[];
}

// ─── Helpers ────────────────────────────────────────────────────────

function isPlainObject(value: unknown): value is Record<string, any> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Identificador estável de um item do snapshot, usado para casar com
 * `hiddenOriginalIds` e `editedOriginalItems` no customization.
 *
 * Para `dayActivity`, recebe `dayNumber` (a chave inclui o dia para
 * evitar colisão entre dias). Para singletons de voo, retorna a chave
 * literal `flightOutbound:0` / `flightReturn:0`.
 */
export function originalIdOf(
    kind: ItemKind,
    item: any,
    idx: number,
    dayNumber?: number,
): string {
    if (kind === 'dayActivity') {
        const day = typeof dayNumber === 'number' ? dayNumber : 0;
        return `${day}:${idx}`;
    }
    if (kind === 'flightOutbound') return `flightOutbound:0`;
    if (kind === 'flightReturn') return `flightReturn:0`;
    const id = item && typeof item.id === 'string' && item.id.length > 0 ? item.id : null;
    return id ?? `${kind}:${idx}`;
}

/**
 * Aplica um patch parcial sobre `data`. Convenção: valor `null` no
 * patch significa "remover esse campo do resultado" (delete). Qualquer
 * outro valor sobrescreve.
 *
 * Não muta `data` original — retorna sempre um objeto novo.
 */
export function applyPatch(
    data: any,
    patch: Record<string, any | null> | undefined,
): any {
    if (!patch || !isPlainObject(patch)) return data;
    const base = isPlainObject(data) ? { ...data } : { ...(data ?? {}) };
    for (const key of Object.keys(patch)) {
        const value = patch[key];
        if (value === null) {
            delete base[key];
        } else {
            base[key] = value;
        }
    }
    return base;
}

/**
 * Normaliza `addedItems` aceitando tanto o shape novo (objeto agrupado
 * por kind) quanto o legado (array plano de `AddedItem`). Sempre retorna
 * o shape objeto, mesmo que vazio — simplifica os consumidores.
 */
function normalizeAddedItems(raw: unknown): AddedItemsMap {
    if (Array.isArray(raw)) {
        // Legado: array plano — agrupa por kind.
        const grouped: AddedItemsMap = {};
        for (const item of raw as AddedItem[]) {
            if (!item || typeof item !== 'object') continue;
            const kind = item.kind;
            if (kind === 'flightOutbound' || kind === 'flightReturn') {
                grouped[kind] = item;
                continue;
            }
            if (kind === 'dayActivity') {
                (grouped.dayActivities ||= []).push(item);
                continue;
            }
            const bucket = (grouped[kind] ||= []) as AddedItem[];
            bucket.push(item);
        }
        return grouped;
    }
    if (isPlainObject(raw)) return raw as AddedItemsMap;
    return {};
}

function safeArray<T>(value: unknown): T[] {
    return Array.isArray(value) ? (value as T[]) : [];
}

/**
 * Merge para arrays de itens (accommodations, attractions, etc.):
 *  1. Mapeia cada item do snapshot com `originalId`, source 'original',
 *     aplica patch de `editedOriginalItems[originalId]` se existir
 *     (source vira 'edited').
 *  2. Itens em `hiddenOriginalIds` saem do array principal e entram em
 *     `hidden`.
 *  3. Concatena `addedItems[kind]` com source 'added' no final.
 */
function mergeArrayKind(
    kind: ItemKind,
    snapshotList: any[],
    edited: EditedPatchMap,
    hiddenSet: Set<string>,
    added: AddedItem[] | undefined,
    hiddenBucket: MergedItem[],
): MergedItem[] {
    const result: MergedItem[] = [];
    snapshotList.forEach((item, idx) => {
        const originalId = originalIdOf(kind, item, idx);
        const patch = edited[originalId];
        const hasPatch = isPlainObject(patch) && Object.keys(patch).length > 0;
        const data = hasPatch ? applyPatch(item, patch) : item;
        const source: ItemSource = hasPatch ? 'edited' : 'original';
        const merged: MergedItem = { kind, source, originalId, data };
        if (hiddenSet.has(originalId)) {
            hiddenBucket.push(merged);
        } else {
            result.push(merged);
        }
    });
    if (Array.isArray(added)) {
        for (const a of added) {
            if (!a || typeof a !== 'object') continue;
            result.push({
                kind,
                source: 'added',
                addedId: a.addedId,
                data: a.data,
            });
        }
    }
    return result;
}

/**
 * Merge para singletons de voo (flightOutbound / flightReturn).
 *  - Lê de `snapshot.flightInfo.outbound` / `.return`.
 *  - Se hidden → null.
 *  - Patch em `editedOriginalItems[<kind>:0]` → applyPatch + 'edited'.
 *  - Se original ausente e `addedItems.<kind>` presente → usa o added.
 */
function mergeFlightSingleton(
    kind: 'flightOutbound' | 'flightReturn',
    flightOriginal: any,
    edited: EditedPatchMap,
    hiddenSet: Set<string>,
    addedSingleton: AddedItem | null | undefined,
): MergedItem | null {
    const originalId = originalIdOf(kind, flightOriginal, 0);
    const isHidden = hiddenSet.has(originalId);
    const hasOriginal = !!flightOriginal && isPlainObject(flightOriginal);

    if (hasOriginal && !isHidden) {
        const patch = edited[originalId];
        const hasPatch = isPlainObject(patch) && Object.keys(patch).length > 0;
        const data = hasPatch ? applyPatch(flightOriginal, patch) : flightOriginal;
        return {
            kind,
            source: hasPatch ? 'edited' : 'original',
            originalId,
            data,
        };
    }

    // Sem original (ou escondido) — se o viajante adicionou um voo, usa o added.
    if (addedSingleton && typeof addedSingleton === 'object') {
        return {
            kind,
            source: 'added',
            addedId: addedSingleton.addedId,
            data: addedSingleton.data,
        };
    }

    return null;
}

// ─── API pública ────────────────────────────────────────────────────

/**
 * Mescla `snapshot` (versão "Original" congelada da venda) com o
 * `customization` overlay do viajante. Sempre retorna um `MergedItinerary`
 * — entradas vazias viram listas vazias.
 *
 *  - `snapshot == null` e `customization == null` → tudo vazio.
 *  - `snapshot == null` mas tem customization → expõe só os adicionados
 *    + notes. (Casos extremos onde o snapshot ainda não foi gerado.)
 *  - `customization == null` → tudo source 'original'.
 */
export function mergeItineraryWithCustomization(
    snapshot: RouteSnapshot | null | undefined,
    customization: TravelerItineraryCustomization | null | undefined,
): MergedItinerary {
    const base = snapshot ?? null;
    const notes = customization?.notes ?? null;

    const edited: EditedPatchMap = isPlainObject(customization?.editedOriginalItems)
        ? (customization!.editedOriginalItems as EditedPatchMap)
        : {};
    const hiddenSet = new Set<string>(
        Array.isArray(customization?.hiddenOriginalIds)
            ? (customization!.hiddenOriginalIds as string[])
            : [],
    );
    const added = normalizeAddedItems(customization?.addedItems);
    const hidden: MergedItem[] = [];

    const accommodations = mergeArrayKind(
        'accommodations',
        safeArray<any>(base?.accommodations),
        edited, hiddenSet, added.accommodations, hidden,
    );
    const transports = mergeArrayKind(
        'transports',
        safeArray<any>(base?.transports),
        edited, hiddenSet, added.transports, hidden,
    );
    const attractions = mergeArrayKind(
        'attractions',
        safeArray<any>(base?.attractions),
        edited, hiddenSet, added.attractions, hidden,
    );
    const restaurants = mergeArrayKind(
        'restaurants',
        safeArray<any>(base?.restaurants),
        edited, hiddenSet, added.restaurants, hidden,
    );
    const generalTips = mergeArrayKind(
        'generalTips',
        safeArray<any>(base?.generalTips),
        edited, hiddenSet, added.generalTips, hidden,
    );
    const checklistItems = mergeArrayKind(
        'checklistItems',
        // Snapshot expõe tanto `checklists` (canônico) quanto `checklist`
        // (alias) — preferimos `checklists`.
        safeArray<any>(base?.checklists ?? base?.checklist),
        edited, hiddenSet, added.checklistItems, hidden,
    );
    const extraSpendingItems = mergeArrayKind(
        'extraSpendingItems',
        safeArray<any>(base?.extraSpendingItems),
        edited, hiddenSet, added.extraSpendingItems, hidden,
    );

    const flightOutbound = mergeFlightSingleton(
        'flightOutbound',
        base?.flightInfo?.outbound,
        edited, hiddenSet, added.flightOutbound,
    );
    const flightReturn = mergeFlightSingleton(
        'flightReturn',
        base?.flightInfo?.return,
        edited, hiddenSet, added.flightReturn,
    );

    // Dias: cada activity recebe originalId `<dayNumber>:<idx>` e
    // pode receber patch/hide. Depois, adições do viajante com
    // `dayNumber === day.dayNumber` entram no final.
    const addedDayActivities = safeArray<AddedItem>(added.dayActivities);
    const days: MergedDay[] = safeArray<any>(base?.days).map((d: any) => {
        const dayNumber = typeof d?.dayNumber === 'number' ? d.dayNumber : 0;
        const activities: MergedItem[] = [];
        safeArray<any>(d?.activities).forEach((a: any, idx: number) => {
            const originalId = originalIdOf('dayActivity', a, idx, dayNumber);
            if (hiddenSet.has(originalId)) {
                hidden.push({ kind: 'dayActivity', source: 'original', originalId, data: a });
                return;
            }
            const patch = edited[originalId];
            const hasPatch = isPlainObject(patch) && Object.keys(patch).length > 0;
            const data = hasPatch ? applyPatch(a, patch) : a;
            activities.push({
                kind: 'dayActivity',
                source: hasPatch ? 'edited' : 'original',
                originalId,
                data,
            });
        });
        for (const a of addedDayActivities) {
            if (a?.dayNumber === dayNumber) {
                activities.push({
                    kind: 'dayActivity',
                    source: 'added',
                    addedId: a.addedId,
                    data: a.data,
                });
            }
        }
        return {
            dayNumber,
            title: d?.title,
            summary: d?.summary,
            description: d?.description,
            activities,
        };
    });

    return {
        base,
        notes,
        accommodations,
        transports,
        attractions,
        restaurants,
        generalTips,
        checklistItems,
        extraSpendingItems,
        flightOutbound,
        flightReturn,
        days,
        hidden,
    };
}

// ─── Geração de IDs ─────────────────────────────────────────────────

let __addedIdCounter = 0;

/**
 * Gera um `addedId` único para um novo item adicionado pelo viajante.
 * Usa `crypto.randomUUID()` quando disponível (RN 0.74+ / web) e cai
 * num counter local determinístico em ambientes mais antigos.
 *
 * Não confiar em colisão entre dispositivos — IDs locais existem só
 * dentro do overlay; o backend só guarda o array opaco.
 */
export function generateAddedId(): string {
    try {
        const c: any = (globalThis as any).crypto;
        if (c && typeof c.randomUUID === 'function') {
            return c.randomUUID();
        }
    } catch { /* ignore */ }
    return `local-${Date.now()}-${++__addedIdCounter}`;
}

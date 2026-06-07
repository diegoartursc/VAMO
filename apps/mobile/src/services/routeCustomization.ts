/**
 * VAMO — Roteiro Editável Pós-Compra (API service).
 *
 * Cobre os endpoints `/api/route-customization/:itineraryId/...`:
 *
 *   - GET    /:itineraryId/customization        → overlay do viajante
 *   - PUT    /:itineraryId/customization        → upsert do overlay
 *   - DELETE /:itineraryId/customization        → reset (idempotente)
 *   - GET    /:itineraryId/snapshot             → versão "Original" da venda
 *   - POST   /:itineraryId/purchased-snapshot   → recuperação somente se ausente
 *
 * Toda chamada exige JWT do viajante (Authorization: Bearer <token>).
 * Os erros do backend (`{ error: '...' }`) viram `throw new Error(error)`,
 * para que a UI possa exibir a mensagem ao usuário diretamente.
 *
 * Mesmo padrão de `services/tripCenter.ts`: fetch + Bearer +
 * `EXPO_PUBLIC_API_URL`, sem dependência de React.
 */

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3333/api';

// ─── Tipos compartilhados com mergeEngine ───────────────────────────

/**
 * Categorias de item que podem ser adicionados/editados/ocultados pelo
 * viajante. `flightOutbound` / `flightReturn` são singletons (uma única
 * peça por venda). `dayActivity` é tratado à parte porque cada item
 * pertence a um dia específico (`dayNumber`).
 *
 * `day` é um kind especial — não representa um item dentro de um dia,
 * representa o **próprio dia** (cabeçalho/título/resumo). Adicionar um
 * `day` cria um novo dia editável; ocultá-lo remove o dia inteiro da
 * Minha Versão; editá-lo altera título/resumo. Atividades dentro de um
 * dia adicionado seguem usando `dayActivity` com `dayNumber` igual ao
 * `data.dayNumber` do dia novo.
 */
export type ItemKind =
    | 'accommodations'
    | 'transports'
    | 'attractions'
    | 'restaurants'
    | 'generalTips'
    | 'checklistItems'
    | 'extraSpendingItems'
    | 'flightOutbound'
    | 'flightReturn'
    | 'dayActivity'
    | 'day';

/**
 * Item adicionado pelo viajante. `addedId` é único dentro do overlay
 * (UUID se possível; fallback `local-<ts>-<seq>`). Para `dayActivity`,
 * `dayNumber` indica em qual dia ele entra.
 */
export interface AddedItem {
    addedId: string;
    kind: ItemKind;
    data: any;
    dayNumber?: number;
}

/**
 * Patch parcial aplicado sobre um item do snapshot original.
 * Valores `null` significam "remover esse campo do data merge".
 * Indexado por `originalId` (ver `originalIdOf` no mergeEngine).
 */
export interface EditedPatchMap {
    [originalId: string]: Record<string, any | null>;
}

/**
 * Shape do `addedItems` persistido. Aceitamos um objeto agrupado por
 * kind — os arrays guardam listas de `AddedItem`. Os singletons
 * (`flightOutbound`/`flightReturn`) podem ser `null` ou um único
 * `AddedItem`. `dayActivities` mistura todos os dias num único array
 * (cada item carrega `dayNumber`). `days` guarda dias inteiros novos
 * criados pelo viajante (cada item carrega `data.dayNumber`,
 * `data.title`, `data.summary`, `data.description`).
 *
 * `dayOrder` é a ordem visual dos dias na Minha Versão. Cada elemento é
 * uma chave estável: `"day:<dayNumber>"` para dias do snapshot original
 * ou `"added:<addedId>"` para dias criados pelo viajante. Dias que não
 * aparecem em `dayOrder` (recém-adicionados ou snapshot novo) caem pro
 * fim na ordem natural por `dayNumber`. Quando `dayOrder` está ausente,
 * mergeEngine usa a ordem por `dayNumber` (back-compat 100%).
 *
 * Decisão: viver dentro de `addedItems` (e não como campo top-level no
 * customization) evita mudar o validador do backend — `addedItems` já é
 * JSON livre tipado como `array | objeto`.
 */
export interface AddedItemsMap {
    accommodations?: AddedItem[];
    transports?: AddedItem[];
    attractions?: AddedItem[];
    restaurants?: AddedItem[];
    generalTips?: AddedItem[];
    checklistItems?: AddedItem[];
    extraSpendingItems?: AddedItem[];
    dayActivities?: AddedItem[];
    days?: AddedItem[];
    flightOutbound?: AddedItem | null;
    flightReturn?: AddedItem | null;
    dayOrder?: string[];
    creatorChecklistProgress?: Record<string, boolean>;
    /**
     * Overrides do viajante sobre o checklist do CRIADOR (vindo do snapshot
     * do roteiro). NÃO confundir com `checklistItems` (itens adicionados
     * pelo viajante via API trip-center).
     *
     *  - `hidden` — chaves de itens do criador que o viajante removeu da
     *    sua versão (mesmo formato de `key` produzido pelo ChecklistTab:
     *    `"id:<id>"` ou `"idx:<n>"`).
     *  - `edits` — overrides de texto/categoria de itens do criador.
     *    Item editado continua mostrado, mas com o texto/categoria
     *    pessoais do viajante.
     *
     * Se um item tem entrada em `edits` E também em `hidden`, `hidden`
     * ganha (o item some). O roteiro original do criador NUNCA é tocado.
     */
    checklistOverrides?: {
        hidden?: string[];
        edits?: { [key: string]: { item?: string; category?: string } };
    };
}

/**
 * Espelha o model `TravelerItineraryCustomization` do Prisma — campos
 * em camelCase, datas como string ISO (serializadas pelo Express JSON).
 *
 * Nota: o backend aceita `addedItems` como array (legado) ou objeto
 * agrupado por kind. Esta tipagem assume o shape novo (objeto); o
 * mergeEngine trata o caso array → objeto vazio.
 */
export interface TravelerItineraryCustomization {
    id: string;
    travelerId: string;
    itineraryId: string;
    saleId: string | null;
    notes: string | null;
    addedItems: AddedItemsMap;
    hiddenOriginalIds: string[];
    editedOriginalItems: EditedPatchMap;
    createdAt: string;
    updatedAt: string;
}

/**
 * Payload aceito pelo PUT — qualquer campo ausente é "não tocar".
 * `notes` aceita `null` para limpar.
 */
export interface CustomizationPatch {
    notes?: string | null;
    addedItems?: AddedItemsMap;
    hiddenOriginalIds?: string[];
    editedOriginalItems?: EditedPatchMap;
}

/**
 * Shape do snapshot retornado pelo GET /snapshot. É o mesmo objeto
 * produzido por `buildPurchasedItineraryPayload` no backend — campos
 * extras `purchaseId`, `purchasedAt`, `pricePaid` são adicionados pela
 * rota quando lê do `purchasedSnapshot` antigo. Aqui tipamos só como
 * `any` para evitar acoplamento — o mergeEngine extrai o que precisa.
 */
export type RouteSnapshot = Record<string, any>;

// ─── Helper interno ─────────────────────────────────────────────────

/**
 * Wrapper único para fetch — anexa o JWT, parseia JSON, padroniza erros.
 * Suporta GET (default) e métodos com `body` JSON.
 */
async function request<T>(
    path: string,
    token: string,
    init?: { method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; body?: unknown },
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
    let data: any = null;
    try { data = await res.json(); } catch { /* ignore */ }
    if (!res.ok) {
        const message = data?.error || `API Error: ${res.status}`;
        throw new Error(message);
    }
    return data as T;
}

// ─── Customization (overlay do viajante) ────────────────────────────

/**
 * Carrega o overlay do viajante. Retorna `null` quando o viajante ainda
 * não personalizou nada (o backend devolve `{ customization: null }`).
 */
export async function getCustomization(
    itineraryId: string,
    token: string,
): Promise<TravelerItineraryCustomization | null> {
    const data = await request<{ customization: TravelerItineraryCustomization | null }>(
        `/route-customization/${encodeURIComponent(itineraryId)}/customization`,
        token,
    );
    return data?.customization ?? null;
}

/**
 * Upsert do overlay. Qualquer campo omitido em `patch` é preservado.
 * `notes: null` limpa a nota. O backend valida shape (arrays / objetos)
 * e tamanho de `notes` — erros viram `Error` com a mensagem do servidor.
 */
export async function putCustomization(
    itineraryId: string,
    patch: CustomizationPatch,
    token: string,
): Promise<TravelerItineraryCustomization> {
    const data = await request<{ customization: TravelerItineraryCustomization }>(
        `/route-customization/${encodeURIComponent(itineraryId)}/customization`,
        token,
        { method: 'PUT', body: patch },
    );
    return data.customization;
}

/**
 * Remove TODO o overlay do viajante para este roteiro (idempotente —
 * não-erro se já estava limpo). Útil para o botão "Restaurar versão
 * original".
 */
export async function resetCustomization(
    itineraryId: string,
    token: string,
): Promise<void> {
    await request<{ ok: true }>(
        `/route-customization/${encodeURIComponent(itineraryId)}/customization`,
        token,
        { method: 'DELETE' },
    );
}

// ─── Snapshot (versão "Original" da venda) ─────────────────────────

/**
 * Retorna o snapshot congelado da venda. Se o backend não encontrar o
 * snapshot, ele reconstrói on-the-fly a partir do estado atual do
 * roteiro e persiste — então sempre retorna um payload válido (ou
 * lança em caso de erro / roteiro não acessível).
 */
export async function getSnapshot(
    itineraryId: string,
    token: string,
): Promise<RouteSnapshot> {
    const data = await request<{ snapshot: RouteSnapshot }>(
        `/route-customization/${encodeURIComponent(itineraryId)}/snapshot`,
        token,
    );
    return data.snapshot;
}

/**
 * Formatos de saída de roteiro por papel (SEC-02/SEC-03/NEW-04).
 *
 * - Público (vitrine, detalhe sem compra): só a prévia de marketplace. Dias,
 *   atividades, dicas, checklist, hospedagens/restaurantes/transportes
 *   detalhados, arquivos e links ficam só para comprador, dono ou admin. Os
 *   módulos viram "tocos" com o bloco de custo (para o resumo de orçamento) e
 *   `contentCounts` diz quantos itens existem.
 * - Comprador: conteúdo completo, sem documentos internos.
 * - Em qualquer saída que não seja dono/admin: comprovantes (`travelProofUrl`,
 *   `cost.proofFiles[].url`, `receiptUrl`) e a nota interna do admin
 *   (`approvalNote`) nunca saem. `proofFiles` vira marcador sem URL, para o
 *   cálculo de confiança dos custos (que só conta quantos há) seguir igual.
 */

const STRIPPED_KEYS = new Set(['travelProofUrl', 'receiptUrl', 'approvalNote']);

/** Cópia profunda sem documentos internos. Aceita snapshots antigos (qualquer formato). */
export function redactPrivateDocs<T>(value: T): T {
    if (Array.isArray(value)) return value.map((v) => redactPrivateDocs(v)) as any;
    if (!value || typeof value !== 'object' || value instanceof Date) return value;
    const out: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
        if (STRIPPED_KEYS.has(key)) continue;
        if (key === 'proofFiles' && Array.isArray(v)) {
            out[key] = v.map(() => ({ url: '', redacted: true }));
            continue;
        }
        out[key] = redactPrivateDocs(v);
    }
    return out as T;
}

const arr = (v: unknown): any[] => (Array.isArray(v) ? v : []);
const filled = (v: unknown) => typeof v === 'string' && v.trim().length > 0;

export interface ContentCounts {
    itinerario?: number;
    dicas?: number;
    passeios?: number;
    restaurantes?: number;
    hospedagem?: number;
    transporte?: number;
    checklist?: number;
    voo?: number;
    gastos_extras?: number;
    checklistCategories?: string[];
}

/** Contagens a partir do payload completo (só conta o que existe no objeto). */
export function buildContentCounts(full: any): ContentCounts {
    const counts: ContentCounts = {};
    if (full.days !== undefined) counts.itinerario = arr(full.days).length;
    if (full.generalTips !== undefined) counts.dicas = arr(full.generalTips).filter(filled).length;
    if (full.attractions !== undefined) counts.passeios = arr(full.attractions).filter((a) => filled(a?.name)).length;
    if (full.restaurants !== undefined) counts.restaurantes = arr(full.restaurants).filter((r) => filled(r?.name)).length;
    if (full.accommodations !== undefined) counts.hospedagem = arr(full.accommodations).filter((a) => filled(a?.name)).length;
    if (full.transports !== undefined) counts.transporte = arr(full.transports).filter((t) => filled(t?.description) || filled(t?.passTypes)).length;
    const checklist = full.checklists ?? full.checklist;
    if (checklist !== undefined) {
        const items = arr(checklist).filter((c) => filled(c?.item));
        counts.checklist = items.length;
        counts.checklistCategories = Array.from(new Set(items.map((c) => String(c.category || '').trim()).filter(Boolean)));
    }
    if (full.flightInfo !== undefined) {
        const f = full.flightInfo;
        counts.voo = f && (f.outbound?.airline || f.outbound?.originCity || f.return?.airline || f.return?.originCity) ? 1 : 0;
    }
    if (full.extraSpendingItems !== undefined) counts.gastos_extras = arr(full.extraSpendingItems).length;
    return counts;
}

const pick = (item: any, keys: string[]) => {
    const out: Record<string, unknown> = {};
    for (const k of keys) if (item?.[k] !== undefined) out[k] = item[k];
    return out;
};

// Só o necessário para getCostReferences/calculateBudgetSummary (valores e moeda).
const COST_KEYS = ['cost', 'spending'];
const stubs = (list: unknown, extra: string[] = []) =>
    arr(list).map((item) => pick(item, [...COST_KEYS, ...extra]));

/** Módulos JSON da listagem/destaque reduzidos a custos + contagens. */
export function toListingModules(it: any) {
    const counts = buildContentCounts({
        attractions: it.attractions ?? [],
        restaurants: it.restaurants ?? [],
        extraSpendingItems: it.extraSpendingItems ?? [],
        flightInfo: it.flightInfo ?? null,
    });
    return redactPrivateDocs({
        attractions: stubs(it.attractions, ['price']),
        restaurants: stubs(it.restaurants),
        extraSpendingItems: stubs(it.extraSpendingItems, ['value', 'currency', 'category']),
        flightInfo: it.flightInfo ? pick(it.flightInfo, COST_KEYS) : null,
        contentCounts: counts,
    });
}

const PUBLIC_TOP_LEVEL = [
    'id', 'title', 'destination', 'country', 'creator', 'salesCount', 'description', 'price', 'currency',
    'images', 'rating', 'reviewCount', 'inclusions', 'duration', 'featured', 'highlights',
    'estimatedSpending', 'downloadCount', 'subtitle', 'travelStyles', 'categories', 'productType',
    'activeModules', 'promoPrice', 'immediateAccess', 'lifetimeAccess', 'offlineDownload', 'allowPdf',
    'allowShare', 'qualityScore', 'status', 'approvedAt', 'extraCities', 'extraCountries',
    'tripStartDate', 'tripEndDate', 'mediaUrls', 'highlightPhotos', 'reviews',
];

/** Prévia pública do detalhe (quem não comprou). */
export function toPublicItineraryPreview(full: any) {
    const preview: Record<string, unknown> = pick(full, PUBLIC_TOP_LEVEL);
    preview.isPreview = true;
    preview.contentCounts = buildContentCounts(full);
    preview.accommodations = stubs(full.accommodations, ['totalPrice', 'priceCurrency', 'nights']);
    preview.transports = stubs(full.transports, ['priceValue', 'priceCurrency', 'estimatedPrice']);
    preview.attractions = stubs(full.attractions, ['price']);
    preview.restaurants = stubs(full.restaurants);
    preview.extraSpendingItems = stubs(full.extraSpendingItems, ['value', 'currency', 'category']);
    preview.flightInfo = full.flightInfo ? pick(full.flightInfo, COST_KEYS) : null;
    return redactPrivateDocs(preview);
}

/** Payload do comprador (conteúdo completo, sem documentos internos). */
export function toBuyerItinerary<T>(payload: T): T {
    return redactPrivateDocs(payload);
}

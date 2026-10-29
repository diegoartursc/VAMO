/**
 * Selo "Verified by VAMO" só com decisão do admin (SEC-14).
 *
 * O criador NUNCA define `proofStatus`: ao salvar, o backend recalcula.
 *  - sem arquivo de comprovante → 'none';
 *  - com arquivo → mantém a decisão anterior do admin (approved/rejected/
 *    pending_review) SÓ se valor, moeda e arquivos forem exatamente os mesmos
 *    da versão aprovada; qualquer mudança volta para 'uploaded' (nova revisão).
 * A decisão do admin também carrega `adminNote`, que o criador não escreve.
 */
const ADMIN_DECISIONS = new Set(['approved', 'rejected', 'pending_review']);

const arr = (v: unknown): any[] => (Array.isArray(v) ? v : []);

function fingerprint(cost: any): string | null {
    const files = arr(cost?.proofFiles).map((f) => String(f?.url || '')).filter(Boolean).sort();
    if (files.length === 0) return null;
    return JSON.stringify([String(cost?.amount ?? ''), String(cost?.currency ?? ''), Number(cost?.sharedByPeople ?? 1), files]);
}

const MODULES: Array<[string, string]> = [
    ['accommodations', 'name'], ['transports', 'description'], ['attractions', 'name'],
    ['restaurants', 'name'], ['extraSpendingItems', 'title'],
];
const norm = (v: unknown) => String(v ?? '').trim().toLowerCase().replace(/\s+/g, ' ');

/**
 * Todos os blocos `cost` com a identidade do item (módulo + nome). A decisão do
 * admin vale para AQUELE item: copiar o bloco aprovado para outro item, ou
 * renomear o item, volta para revisão (R-T1).
 */
function costsOf(data: any): Array<{ key: string; cost: any }> {
    if (!data || typeof data !== 'object') return [];
    const out: Array<{ key: string; cost: any }> = [];
    for (const [module, nameField] of MODULES) {
        for (const item of arr(data[module])) {
            if (item?.cost && typeof item.cost === 'object') out.push({ key: `${module}:${norm(item[nameField])}`, cost: item.cost });
        }
    }
    if (data.flightInfo?.cost && typeof data.flightInfo.cost === 'object') out.push({ key: 'flight:', cost: data.flightInfo.cost });
    return out;
}

type Decision = { proofStatus: string; adminNote?: string };

/** Decisões do admin ainda válidas, por item + impressão digital do custo (uso único). */
export function adminDecisionsOf(existing: any): Map<string, Decision[]> {
    const map = new Map<string, Decision[]>();
    for (const { key, cost } of costsOf(existing)) {
        const fp = fingerprint(cost);
        if (!fp || !ADMIN_DECISIONS.has(cost.proofStatus)) continue;
        const k = `${key}|${fp}`;
        const list = map.get(k) ?? [];
        list.push({ proofStatus: cost.proofStatus, ...(cost.adminNote ? { adminNote: cost.adminNote } : {}) });
        map.set(k, list);
    }
    return map;
}

function enforceCost(cost: any, itemKey: string, decisions: Map<string, Decision[]>) {
    if (!cost || typeof cost !== 'object') return cost;
    const { proofStatus: _ignored, adminNote: _ignoredNote, ...rest } = cost;
    const fp = fingerprint(rest);
    if (!fp) return { ...rest, proofStatus: 'none' };
    const list = decisions.get(`${itemKey}|${fp}`);
    const decision = list?.shift(); // cada decisão do admin cobre um item só
    return decision ? { ...rest, ...decision } : { ...rest, proofStatus: 'uploaded' };
}

/** Reescreve `proofStatus` de todos os custos do corpo enviado pelo criador. */
export function enforceProofStatus<T extends Record<string, any>>(body: T, existing?: any): T {
    if (!body || typeof body !== 'object') return body;
    const decisions = existing ? adminDecisionsOf(existing) : new Map<string, Decision[]>();
    const out: any = { ...body };
    for (const [module, nameField] of MODULES) {
        if (Array.isArray(out[module])) {
            out[module] = out[module].map((item: any) => (item && typeof item === 'object' && item.cost
                ? { ...item, cost: enforceCost(item.cost, `${module}:${norm(item[nameField])}`, decisions) }
                : item));
        }
    }
    if (out.flightInfo && typeof out.flightInfo === 'object' && out.flightInfo.cost) {
        out.flightInfo = { ...out.flightInfo, cost: enforceCost(out.flightInfo.cost, 'flight:', decisions) };
    }
    return out;
}

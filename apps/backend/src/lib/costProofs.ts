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

/** Todos os blocos `cost` de um roteiro (formato do corpo da API ou do registro salvo). */
function costsOf(data: any): any[] {
    if (!data || typeof data !== 'object') return [];
    return [
        ...arr(data.accommodations).map((x) => x?.cost),
        ...arr(data.transports).map((x) => x?.cost),
        ...arr(data.attractions).map((x) => x?.cost),
        ...arr(data.restaurants).map((x) => x?.cost),
        ...arr(data.extraSpendingItems).map((x) => x?.cost),
        data.flightInfo?.cost,
    ].filter((c) => c && typeof c === 'object');
}

/** Decisões do admin ainda válidas na versão salva, por impressão digital do custo. */
export function adminDecisionsOf(existing: any): Map<string, { proofStatus: string; adminNote?: string }> {
    const map = new Map<string, { proofStatus: string; adminNote?: string }>();
    for (const cost of costsOf(existing)) {
        const fp = fingerprint(cost);
        if (fp && ADMIN_DECISIONS.has(cost.proofStatus)) {
            map.set(fp, { proofStatus: cost.proofStatus, ...(cost.adminNote ? { adminNote: cost.adminNote } : {}) });
        }
    }
    return map;
}

function enforceCost(cost: any, decisions: Map<string, { proofStatus: string; adminNote?: string }>) {
    if (!cost || typeof cost !== 'object') return cost;
    const { proofStatus: _ignored, adminNote: _ignoredNote, ...rest } = cost;
    const fp = fingerprint(rest);
    if (!fp) return { ...rest, proofStatus: 'none' };
    const decision = decisions.get(fp);
    return decision ? { ...rest, ...decision } : { ...rest, proofStatus: 'uploaded' };
}

/** Reescreve `proofStatus` de todos os custos do corpo enviado pelo criador. */
export function enforceProofStatus<T extends Record<string, any>>(body: T, existing?: any): T {
    if (!body || typeof body !== 'object') return body;
    const decisions = existing ? adminDecisionsOf(existing) : new Map();
    const out: any = { ...body };
    for (const key of ['accommodations', 'transports', 'attractions', 'restaurants', 'extraSpendingItems']) {
        if (Array.isArray(out[key])) out[key] = out[key].map((item: any) => (item && typeof item === 'object' && item.cost ? { ...item, cost: enforceCost(item.cost, decisions) } : item));
    }
    if (out.flightInfo && typeof out.flightInfo === 'object' && out.flightInfo.cost) {
        out.flightInfo = { ...out.flightInfo, cost: enforceCost(out.flightInfo.cost, decisions) };
    }
    return out;
}

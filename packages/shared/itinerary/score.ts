/**
 * Cálculo de score de qualidade do roteiro (0-100).
 * Portado integralmente de apps/site/src/app/dashboard/roteiro/[id]/page.tsx
 * para servir de single source of truth entre web, mobile e backend.
 *
 *  Distribuição:
 *   1. Identidade & Indexação        20
 *   2. Preço & Comercial             10
 *   3. Fotos de capa                  8
 *   4. Roteiro dia a dia             20
 *   5. Módulos de conteúdo           15
 *   6. Estimativa de gastos por pess. 5
 *   7. Confiança & Qualidade         12
 *                                  ─────
 *   Total                          90 → cap em 100
 */

export interface ScoreCriterion {
    text: string;
    done: boolean;
    pts: number;
}

export interface ScoreBlock {
    label: string;
    earned: number;
    max: number;
    criteria: ScoreCriterion[];
}

/** Dados aceitos pelo score — qualquer objeto que se pareça com o estado do form. */
export interface ScoreInput {
    title?: string;
    description?: string;
    destination?: string;
    country?: string;
    locations?: { country?: string; cities?: string[] }[];
    travelStyles?: string[];
    categories?: string[];
    price?: number;
    highlightPhotos?: string[];
    images?: string[];
    duration?: number;
    days?: { description?: string; activities?: { time?: string }[] }[];
    accommodations?: { name?: string }[];
    attractions?: { name?: string }[];
    restaurants?: { name?: string }[];
    transports?: { description?: string }[];
    generalTips?: string[];
    checklistItems?: { item?: string }[];
    spendingEntries?: { priceValue?: string }[];
    hasSpending?: boolean;
    highlights?: string[];
    travelProofUrl?: string;
}

export function calcQualityBlocks(data: ScoreInput): ScoreBlock[] {
    // ─── Bloco 1: Identidade & Indexação (20 pts) ───
    const loc0 = (data.locations ?? [])[0];
    const city    = (loc0?.cities?.[0] || data.destination || "").trim();
    const country = (loc0?.country     || data.country     || "").trim();

    const b1: ScoreCriterion[] = [
        { text: "Título do roteiro preenchido",          done: !!(data.title?.trim()),                                pts: 5 },
        { text: "Cidade de destino informada",           done: !!city,                                                pts: 3 },
        { text: "País de destino informado",             done: !!country,                                             pts: 2 },
        { text: "Descrição preenchida",                  done: !!(data.description?.trim()),                          pts: 2 },
        { text: "Descrição com 150+ caracteres",         done: (data.description?.trim().length ?? 0) >= 150,         pts: 2 },
        { text: "Estilo de viagem selecionado (1+)",     done: (data.travelStyles?.length ?? 0) >= 1,                 pts: 3 },
        { text: "Categoria temática selecionada (1+)",   done: (data.categories?.length ?? 0) >= 1,                   pts: 3 },
    ];

    // ─── Bloco 2: Preço & Comercial (10 pts) ───
    const priceOk = (data.price ?? 0) > 0;
    const b2: ScoreCriterion[] = [
        { text: "Preço de venda definido", done: priceOk, pts: 10 },
    ];

    // ─── Bloco 3: Fotos de capa (8 pts) ───
    const coverPhotos = (data.highlightPhotos ?? []).filter(Boolean);
    const galleryImgs = (data.images ?? []).filter(Boolean);
    const totalImgs   = new Set([...coverPhotos, ...galleryImgs]).size;
    const b3: ScoreCriterion[] = [
        { text: "Pelo menos 1 foto de capa adicionada", done: totalImgs >= 1, pts: 5 },
        { text: "3 fotos de capa (ideal)",              done: totalImgs >= 3, pts: 3 },
    ];

    // ─── Bloco 4: Roteiro dia a dia (20 pts) ───
    const days       = data.days ?? [];
    const duration   = Math.max(data.duration ?? 1, 1);
    const daysCreated = days.length;
    const allDaysDone = daysCreated >= duration;
    const totalActs   = days.reduce((a, d) => a + (d.activities?.length ?? 0), 0);
    const avgActs     = daysCreated > 0 ? totalActs / daysCreated : 0;
    const daysWithDesc = days.filter(d => d.description?.trim()).length;
    const actsWithTime = days.some(d => d.activities?.some(a => a.time?.trim()));

    const daysLabel = allDaysDone
        ? `${daysCreated}/${duration} dias preenchidos ✓`
        : `${daysCreated}/${duration} dias preenchidos`;

    const b4: ScoreCriterion[] = [
        { text: "Ao menos 1 dia de roteiro criado",                    done: daysCreated >= 1,                              pts: 4 },
        { text: daysLabel,                                              done: allDaysDone,                                   pts: 6 },
        { text: "Todos os dias com descrição",                         done: daysCreated > 0 && daysWithDesc === daysCreated, pts: 4 },
        { text: "Ao menos 1 atividade por dia (média)",                done: avgActs >= 1,                                  pts: 4 },
        { text: "Horários definidos nas atividades",                   done: actsWithTime,                                  pts: 2 },
    ];

    // ─── Bloco 5: Módulos de conteúdo (15 pts) ───
    const b5: ScoreCriterion[] = [
        { text: "Hospedagem recomendada adicionada",   done: (data.accommodations?.length ?? 0) >= 1,                                pts: 3 },
        { text: "Passeio/atração adicionado",          done: (data.attractions?.length ?? 0) >= 1,                                   pts: 3 },
        { text: "Restaurante recomendado adicionado",  done: (data.restaurants?.length ?? 0) >= 1,                                   pts: 3 },
        { text: "Dicas de transporte local",           done: (data.transports?.length ?? 0) >= 1,                                    pts: 3 },
        { text: "Dicas gerais de viagem (1+)",         done: (data.generalTips ?? []).filter(t => t?.trim()).length >= 1,            pts: 2 },
        { text: "Checklist de viagem adicionado",      done: (data.checklistItems?.length ?? 0) >= 1,                                pts: 1 },
    ];

    // ─── Bloco 6: Estimativa de gastos por pessoa (5 pts) ───
    const hasSpending = data.hasSpending || (data.spendingEntries ?? []).some(e => parseFloat(e.priceValue ?? "") > 0);
    const b6: ScoreCriterion[] = [
        { text: "Estimativa de gastos preenchida", done: !!hasSpending, pts: 5 },
    ];

    // ─── Bloco 7: Confiança & Qualidade (12 pts) ───
    const b7: ScoreCriterion[] = [
        { text: "Comprovante de viagem enviado",         done: !!(data.travelProofUrl?.trim()),                       pts: 7 },
        { text: "Destaques do roteiro preenchidos (2+)", done: (data.highlights ?? []).filter(Boolean).length >= 2,   pts: 5 },
    ];

    const sum = (arr: ScoreCriterion[]) => arr.reduce((s, c) => s + (c.done ? c.pts : 0), 0);

    return [
        { label: "Identidade & Indexação",          earned: sum(b1), max: 20, criteria: b1 },
        { label: "Preço & Comercial",               earned: sum(b2), max: 10, criteria: b2 },
        { label: "Fotos de capa",                   earned: sum(b3), max: 8,  criteria: b3 },
        { label: "Roteiro dia a dia",               earned: sum(b4), max: 20, criteria: b4 },
        { label: "Módulos de conteúdo",             earned: sum(b5), max: 15, criteria: b5 },
        { label: "Estimativa de gastos por pessoa", earned: sum(b6), max: 5,  criteria: b6 },
        { label: "Confiança & Qualidade",           earned: sum(b7), max: 12, criteria: b7 },
    ];
}

export function calcQuality(data: ScoreInput): number {
    return Math.min(
        calcQualityBlocks(data).reduce((s, b) => s + b.earned, 0),
        100,
    );
}

"use client";

/**
 * CostProofsModal — modal admin para revisar comprovantes de custo
 * anexados a um roteiro (transparência graduada).
 *
 * Fetcha:  GET  /api/admin/itineraries/:id/cost-proofs
 * Decide:  POST /api/admin/itineraries/:id/cost-proofs/decide
 *
 * Esta tela é o único lugar no produto onde os comprovantes brutos
 * podem ser visualizados — comprador/criador NÃO têm acesso.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333/api";

type Decision = "approved" | "rejected" | "pending_review";

interface CostProofRow {
    module: string;
    itemRef: string;
    itemLabel?: string;
    disclosureType: string;
    proofStatus: string;
    amount?: string | number | null;
    currency?: string;
    notes?: string;
    proofFiles: Array<{ url: string; name?: string; mimeType?: string }>;
}

interface CostProofsResponse {
    id: string;
    title: string;
    destination: string;
    country: string;
    status: string;
    creator: { id: string; name: string };
    totalProofs: number;
    byStatus: { uploaded: number; pending_review: number; approved: number; rejected: number };
    proofs: CostProofRow[];
}

export interface CostProofsModalProps {
    itineraryId: string | null;
    /** Token JWT do admin (já obtido via useAdmin/getToken). Pode ser null
     *  se o admin não estiver logado — nesse caso o fetch falhará com 401
     *  e o toast de erro será exibido. */
    getToken: () => string | null;
    onClose: () => void;
    onToast?: (msg: string, type: "success" | "error") => void;
}

const STATUS_COLOR: Record<string, string> = {
    uploaded:        "#D97706",
    pending_review:  "#6366F1",
    approved:        "#16A34A",
    rejected:        "#DC2626",
    none:            "#94A3B8",
};
const STATUS_LABEL: Record<string, string> = {
    uploaded:        "Enviado",
    pending_review:  "Em análise",
    approved:        "Aprovado pela VAMO",
    rejected:        "Rejeitado",
    none:            "Sem comprovante",
};
const MODULE_LABEL: Record<string, string> = {
    accommodation: "🏨 Hospedagem",
    transport:     "🚌 Transporte",
    attraction:    "🎫 Passeio/atração",
    restaurant:    "🍽️ Restaurante",
    flight:        "✈️ Voo",
    extra:         "➕ Gasto extra",
};

export default function CostProofsModal({ itineraryId, getToken, onClose, onToast }: CostProofsModalProps) {
    const [data, setData] = useState<CostProofsResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [decidingRef, setDecidingRef] = useState<string | null>(null);
    const [rejectNote, setRejectNote] = useState<{ ref: string; note: string } | null>(null);

    // Refs estáveis evitam loop infinito: o parent pode passar callbacks
    // não-memoizadas (getToken/onToast). Atualizamos as refs a cada render
    // mas dependemos apenas de `itineraryId` no useEffect.
    const getTokenRef = useRef(getToken);
    const onToastRef = useRef(onToast);
    useEffect(() => { getTokenRef.current = getToken; }, [getToken]);
    useEffect(() => { onToastRef.current = onToast; }, [onToast]);

    const load = useCallback(async () => {
        if (!itineraryId) return;
        setLoading(true);
        try {
            const res = await fetch(`${API}/admin/itineraries/${itineraryId}/cost-proofs`, {
                headers: { Authorization: `Bearer ${getTokenRef.current()}` },
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json: CostProofsResponse = await res.json();
            setData(json);
        } catch (e: any) {
            onToastRef.current?.(`Erro ao carregar: ${e?.message || "desconhecido"}`, "error");
        } finally {
            setLoading(false);
        }
    }, [itineraryId]);

    useEffect(() => { load(); }, [load]);

    const decide = useCallback(async (row: CostProofRow, decision: Decision, note?: string) => {
        if (!itineraryId) return;
        setDecidingRef(row.itemRef);
        try {
            const res = await fetch(`${API}/admin/itineraries/${itineraryId}/cost-proofs/decide`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${getTokenRef.current()}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    module: row.module,
                    itemRef: row.itemRef,
                    decision,
                    ...(note ? { note } : {}),
                }),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            onToastRef.current?.(decision === "approved" ? "Comprovante aprovado" : decision === "rejected" ? "Comprovante rejeitado" : "Status atualizado", "success");
            await load();
        } catch (e: any) {
            onToastRef.current?.(`Erro: ${e?.message || "falha"}`, "error");
        } finally {
            setDecidingRef(null);
            setRejectNote(null);
        }
    }, [itineraryId, load]);

    const summary = useMemo(() => {
        if (!data) return null;
        const { byStatus, totalProofs } = data;
        return { ...byStatus, total: totalProofs };
    }, [data]);

    if (!itineraryId) return null;

    return (
        <div
            onClick={onClose}
            style={{
                position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)",
                display: "flex", alignItems: "center", justifyContent: "center",
                zIndex: 1000, padding: 16,
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: "#fff", borderRadius: 20, padding: 24,
                    width: "100%", maxWidth: 920, maxHeight: "90vh", overflowY: "auto",
                    boxShadow: "0 24px 60px rgba(15,23,42,0.2)",
                }}
            >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
                    <div>
                        <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1A3263", margin: 0 }}>
                            Comprovantes de custo
                        </h2>
                        {data && (
                            <p style={{ fontSize: 13, color: "#64748B", margin: "4px 0 0" }}>
                                {data.title} · {data.destination}, {data.country}
                                {data.creator?.name ? ` · ${data.creator.name}` : ""}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            border: "none", background: "transparent", cursor: "pointer",
                            fontSize: 20, color: "#94A3B8", padding: 4,
                        }}
                        aria-label="Fechar"
                    >
                        ✕
                    </button>
                </div>

                {/* Privacy notice */}
                <div style={{
                    background: "#FEF3C7", border: "1px solid #FCD34D",
                    borderRadius: 12, padding: 10, marginBottom: 16,
                    fontSize: 12, color: "#92400E", lineHeight: 1.4,
                }}>
                    🔒 <strong>Visualização restrita ao admin.</strong> Os arquivos abaixo podem
                    conter dados pessoais do criador. Não compartilhe URLs externamente.
                </div>

                {/* Loading */}
                {loading && (
                    <div style={{ padding: 24, textAlign: "center", color: "#94A3B8" }}>
                        Carregando comprovantes…
                    </div>
                )}

                {/* Stats */}
                {!loading && summary && (
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
                        <Stat label="Total" value={summary.total} color="#1A3263" />
                        <Stat label="Enviados" value={summary.uploaded} color={STATUS_COLOR.uploaded} />
                        <Stat label="Em análise" value={summary.pending_review} color={STATUS_COLOR.pending_review} />
                        <Stat label="Aprovados" value={summary.approved} color={STATUS_COLOR.approved} />
                        <Stat label="Rejeitados" value={summary.rejected} color={STATUS_COLOR.rejected} />
                    </div>
                )}

                {/* Empty state */}
                {!loading && data && data.proofs.length === 0 && (
                    <div style={{
                        background: "#F8FAFC", borderRadius: 12, padding: 32,
                        textAlign: "center", color: "#64748B",
                    }}>
                        <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
                        <strong style={{ color: "#1A3263" }}>Nenhum comprovante anexado</strong>
                        <p style={{ fontSize: 13, margin: "6px 0 0" }}>
                            Este roteiro não tem itens com <code>disclosureType=verified</code> + arquivo.
                        </p>
                    </div>
                )}

                {/* Proofs list */}
                {!loading && data && data.proofs.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {data.proofs.map((row) => {
                            const isDeciding = decidingRef === row.itemRef;
                            const showRejectForm = rejectNote?.ref === row.itemRef;
                            return (
                                <div
                                    key={row.itemRef}
                                    style={{
                                        background: "#fff", border: "1px solid #E2E8F0",
                                        borderRadius: 12, padding: 14,
                                        display: "flex", flexDirection: "column", gap: 10,
                                    }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: "#1A3263" }}>
                                                {MODULE_LABEL[row.module] || row.module}
                                                {row.itemLabel ? ` · ${row.itemLabel}` : ""}
                                            </div>
                                            <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>
                                                <code>{row.itemRef}</code>
                                            </div>
                                        </div>
                                        <span
                                            style={{
                                                padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                                                background: `${STATUS_COLOR[row.proofStatus] || "#94A3B8"}22`,
                                                color: STATUS_COLOR[row.proofStatus] || "#94A3B8",
                                            }}
                                        >
                                            {STATUS_LABEL[row.proofStatus] || row.proofStatus}
                                        </span>
                                    </div>

                                    {/* Value + notes */}
                                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12, color: "#475569" }}>
                                        {row.amount != null && row.amount !== "" && (
                                            <div>
                                                <strong>Valor:</strong>{" "}
                                                {row.amount} {row.currency || ""}
                                            </div>
                                        )}
                                        {row.notes && (
                                            <div style={{ flex: 1, minWidth: 200 }}>
                                                <strong>Obs.:</strong> {row.notes}
                                            </div>
                                        )}
                                    </div>

                                    {/* Files */}
                                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                        {row.proofFiles.map((f, i) => {
                                            const isImg = (f.mimeType || "").startsWith("image/");
                                            return (
                                                <a
                                                    key={i}
                                                    href={f.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{
                                                        display: "flex", alignItems: "center", gap: 8,
                                                        padding: 8, border: "1px solid #E2E8F0",
                                                        borderRadius: 10, textDecoration: "none",
                                                        color: "#1A3263", fontSize: 12, background: "#F8FAFC",
                                                    }}
                                                >
                                                    {isImg ? (
                                                        <img
                                                            src={f.url}
                                                            alt=""
                                                            style={{ width: 48, height: 48, borderRadius: 6, objectFit: "cover" }}
                                                        />
                                                    ) : (
                                                        <div
                                                            style={{
                                                                width: 48, height: 48, borderRadius: 6,
                                                                background: "#E0F2FE", display: "flex",
                                                                alignItems: "center", justifyContent: "center",
                                                                fontSize: 20,
                                                            }}
                                                        >
                                                            📄
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div style={{ fontWeight: 600 }}>
                                                            {f.name || `Arquivo ${i + 1}`}
                                                        </div>
                                                        <div style={{ fontSize: 10, color: "#64748B" }}>
                                                            Abrir em nova aba →
                                                        </div>
                                                    </div>
                                                </a>
                                            );
                                        })}
                                    </div>

                                    {/* Reject form */}
                                    {showRejectForm && (
                                        <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginTop: 4 }}>
                                            <textarea
                                                value={rejectNote!.note}
                                                onChange={e => setRejectNote({ ref: row.itemRef, note: e.target.value })}
                                                placeholder="Motivo da rejeição (opcional, visível no log de auditoria)"
                                                rows={2}
                                                style={{
                                                    flex: 1, padding: 8, border: "1px solid #E2E8F0",
                                                    borderRadius: 8, fontSize: 12, fontFamily: "inherit",
                                                    resize: "vertical",
                                                }}
                                            />
                                            <button
                                                onClick={() => decide(row, "rejected", rejectNote!.note)}
                                                disabled={isDeciding}
                                                style={{
                                                    padding: "8px 14px", borderRadius: 8, border: "none",
                                                    background: "#DC2626", color: "#fff", fontWeight: 700,
                                                    fontSize: 12, cursor: "pointer",
                                                    opacity: isDeciding ? 0.6 : 1,
                                                }}
                                            >
                                                Confirmar rejeição
                                            </button>
                                            <button
                                                onClick={() => setRejectNote(null)}
                                                style={{
                                                    padding: "8px 14px", borderRadius: 8,
                                                    border: "1px solid #E2E8F0", background: "#fff",
                                                    color: "#64748B", fontSize: 12, cursor: "pointer",
                                                }}
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    {!showRejectForm && (
                                        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
                                            <button
                                                onClick={() => decide(row, "approved")}
                                                disabled={isDeciding || row.proofStatus === "approved"}
                                                style={{
                                                    padding: "8px 14px", borderRadius: 8, border: "none",
                                                    background: "linear-gradient(135deg, #28C9BF, #1FA89F)",
                                                    color: "#fff", fontWeight: 700, fontSize: 12,
                                                    cursor: isDeciding || row.proofStatus === "approved" ? "not-allowed" : "pointer",
                                                    opacity: row.proofStatus === "approved" ? 0.5 : isDeciding ? 0.6 : 1,
                                                }}
                                            >
                                                ✓ Aprovar
                                            </button>
                                            <button
                                                onClick={() => setRejectNote({ ref: row.itemRef, note: "" })}
                                                disabled={isDeciding || row.proofStatus === "rejected"}
                                                style={{
                                                    padding: "8px 14px", borderRadius: 8,
                                                    border: "1.5px solid #FCA5A5", background: "#FEF2F2",
                                                    color: "#DC2626", fontWeight: 700, fontSize: 12,
                                                    cursor: isDeciding || row.proofStatus === "rejected" ? "not-allowed" : "pointer",
                                                    opacity: row.proofStatus === "rejected" ? 0.5 : isDeciding ? 0.6 : 1,
                                                }}
                                            >
                                                ✕ Rejeitar
                                            </button>
                                            {row.proofStatus !== "pending_review" && (
                                                <button
                                                    onClick={() => decide(row, "pending_review")}
                                                    disabled={isDeciding}
                                                    style={{
                                                        padding: "8px 14px", borderRadius: 8,
                                                        border: "1px solid #E2E8F0", background: "#fff",
                                                        color: "#64748B", fontSize: 12, cursor: "pointer",
                                                    }}
                                                >
                                                    Marcar em análise
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div
            style={{
                background: `${color}11`, border: `1px solid ${color}33`,
                borderRadius: 10, padding: "6px 12px",
                display: "flex", alignItems: "baseline", gap: 6,
            }}
        >
            <span style={{ fontWeight: 800, color, fontSize: 16 }}>{value}</span>
            <span style={{ fontSize: 11, color: "#64748B" }}>{label}</span>
        </div>
    );
}

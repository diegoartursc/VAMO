"use client";

import React, { useEffect, useState } from "react";
import { AdminDataProvider, useAdmin, API } from "../shared";

type Filter = "reported" | "hidden" | "all";
type ReviewRow = {
    id: string; itineraryTitle: string; userName: string | null; rating: number; comment: string;
    createdAt: string; hidden: boolean; hiddenReason: string | null;
    reports: { reason: string; details: string | null; createdAt: string }[];
};

const REASONS: Record<string, string> = {
    spam: "Spam", offensive: "Ofensiva", fake: "Falsa", irrelevant: "Fora do assunto", other: "Outro",
};

function ReviewsContent() {
    const { getToken, showToast } = useAdmin();
    const [filter, setFilter] = useState<Filter>("reported");
    const [rows, setRows] = useState<ReviewRow[] | null>(null);
    const [busy, setBusy] = useState<string | null>(null);

    const load = (f: Filter) => {
        setRows(null);
        fetch(`${API}/admin/reviews?filter=${f}`, { headers: { Authorization: `Bearer ${getToken()}` }, cache: "no-store" })
            .then(r => (r.ok ? r.json() : []))
            .then(setRows)
            .catch(() => setRows([]));
    };
    useEffect(() => { load(filter); }, [filter]);

    const act = async (row: ReviewRow, action: "hide" | "unhide") => {
        let body: string | undefined;
        if (action === "hide") {
            const reason = window.prompt("Motivo para esconder esta avaliação (fica registrado):");
            if (!reason || !reason.trim()) return;
            body = JSON.stringify({ reason: reason.trim() });
        } else if (!window.confirm("Voltar a exibir esta avaliação?")) return;
        setBusy(row.id);
        try {
            const res = await fetch(`${API}/admin/reviews/${row.id}/${action}`, {
                method: "POST",
                headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
                body,
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data?.error || "Erro");
            showToast(action === "hide" ? "Avaliação escondida; notas recalculadas." : "Avaliação restaurada; notas recalculadas.", "success");
            load(filter);
        } catch (e: any) { showToast(e?.message || "Erro", "error"); }
        finally { setBusy(null); }
    };

    const tab = (f: Filter, label: string) => (
        <button key={f} onClick={() => setFilter(f)} style={{
            padding: "8px 14px", borderRadius: 10, border: "1px solid rgba(226,232,240,0.9)", cursor: "pointer", fontWeight: 700, fontSize: 13,
            background: filter === f ? "#1A3263" : "#fff", color: filter === f ? "#fff" : "#1A3263",
        }}>{label}</button>
    );

    return (
        <div className="dash-container">
            <header className="dash-header">
                <div>
                    <h1 className="dash-title">Avaliações</h1>
                    <p className="dash-subtitle">Avaliações denunciadas pelos usuários. Esconder não apaga: a avaliação sai da página do roteiro e da nota média, e pode ser restaurada.</p>
                </div>
            </header>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                {tab("reported", "Denunciadas")}{tab("hidden", "Escondidas")}{tab("all", "Todas")}
            </div>
            {!rows ? <div style={{ color: "#5A6B8C", fontSize: 13 }}>Carregando…</div> : rows.length === 0 ? (
                <div style={{ background: "#fff", borderRadius: 18, padding: "40px 24px", border: "1px solid rgba(226,232,240,0.7)", textAlign: "center", color: "#98989D" }}>
                    Nenhuma avaliação neste filtro.
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {rows.map(r => (
                        <div key={r.id} style={{ background: "#fff", borderRadius: 16, padding: "16px 20px", border: "1px solid rgba(226,232,240,0.7)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                                <div>
                                    <div style={{ fontWeight: 700, color: "#1A3263", fontSize: 14 }}>{r.itineraryTitle}</div>
                                    <div style={{ fontSize: 12, color: "#5A6B8C" }}>{r.userName || "Viajante"} · {"★".repeat(Math.round(r.rating))} ({r.rating}) · {new Date(r.createdAt).toLocaleDateString("en-US")}</div>
                                </div>
                                {r.hidden
                                    ? <button disabled={busy === r.id} onClick={() => act(r, "unhide")} style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid #28C9BF", background: "#fff", color: "#1FA89F", fontWeight: 700, cursor: "pointer" }}>Restaurar</button>
                                    : <button disabled={busy === r.id} onClick={() => act(r, "hide")} style={{ padding: "8px 14px", borderRadius: 10, border: "none", background: "#DC2626", color: "#fff", fontWeight: 700, cursor: "pointer" }}>Esconder</button>}
                            </div>
                            <p style={{ margin: "10px 0", fontSize: 14, color: "#1A3263", whiteSpace: "pre-wrap" }}>{r.comment || "(sem texto)"}</p>
                            {r.hidden && <div style={{ fontSize: 12, color: "#DC2626" }}>Escondida: {r.hiddenReason}</div>}
                            {r.reports.length > 0 && (
                                <div style={{ fontSize: 12, color: "#5A6B8C", marginTop: 6 }}>
                                    {r.reports.length} denúncia(s): {r.reports.map(x => `${REASONS[x.reason] || x.reason}${x.details ? ` — “${x.details}”` : ""}`).join("; ")}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function AdminReviewsPage() {
    return <AdminDataProvider><ReviewsContent /></AdminDataProvider>;
}

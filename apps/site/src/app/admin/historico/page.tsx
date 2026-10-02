"use client";

import React from "react";
import Link from "next/link";
import { AdminDataProvider, useAdmin, STATUS_LABEL, STATUS_COLOR, Status } from "../shared";

function HistoryContent() {
    const { allItineraries, loading } = useAdmin();
    const decided = allItineraries
        .filter(i => ["APPROVED", "ACTIVE", "REJECTED"].includes(i.status))
        .map(i => ({ ...i, when: (i as any).approvedAt || (i as any).updatedAt || i.createdAt }))
        .sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime());

    return (
        <div className="dash-container">
            <header className="dash-header">
                <div>
                    <h1 className="dash-title">Histórico</h1>
                    <p className="dash-subtitle">Decisões de moderação dos roteiros (aprovados, publicados e rejeitados).</p>
                </div>
            </header>
            {loading ? <div style={{ color: "#5A6B8C" }}>Carregando…</div> : decided.length === 0 ? (
                <div style={{ background: "#fff", borderRadius: 18, padding: 40, border: "1px solid rgba(226,232,240,0.7)", textAlign: "center", color: "#98989D" }}>Nenhuma decisão ainda.</div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {decided.map(i => (
                        <Link key={i.id} href={`/admin/roteiros/${i.id}`} style={{ background: "#fff", borderRadius: 14, padding: "14px 18px", border: "1px solid rgba(226,232,240,0.7)", display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
                            <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: `${STATUS_COLOR[i.status as Status]}14`, color: STATUS_COLOR[i.status as Status] }}>{STATUS_LABEL[i.status as Status]}</span>
                            <span style={{ flex: 1, color: "#1A3263", fontWeight: 600, fontSize: 14 }}>{i.title}</span>
                            {i.approvalNote && <span style={{ fontSize: 12, color: "#DC2626", maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Motivo: {i.approvalNote}</span>}
                            <span style={{ fontSize: 12, color: "#98989D" }}>{new Date(i.when).toLocaleDateString("pt-BR")}</span>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function AdminHistoricoPage() {
    return <AdminDataProvider><HistoryContent /></AdminDataProvider>;
}

"use client";

import React, { useEffect, useState } from "react";
import { AdminDataProvider, useAdmin, Icon, API } from "../shared";

function CreatorsContent() {
    const { creators, getToken, showToast, refetch } = useAdmin();
    const [busy, setBusy] = useState<string | null>(null);
    const [all, setAll] = useState<{ id: string; name: string; email: string; level: string; itineraries: number }[] | null>(null);
    const loadAll = () => fetch(`${API}/admin/travelers`, { headers: { Authorization: `Bearer ${getToken()}` }, cache: "no-store" })
        .then(r => r.ok ? r.json() : [])
        .then((rows: any[]) => setAll(rows.filter(t => t.creator).map(t => ({ id: t.creator.id, name: t.name, email: t.email, level: t.creator.verificationLevel, itineraries: t.creator._count?.itineraries ?? 0 }))))
        .catch(() => setAll([]));
    useEffect(() => { loadAll(); }, []);
    const approve = async (id: string, name: string) => {
        if (!window.confirm(`Aprovar ${name} como Roteirista Recomendado? Ela(e) recebe um e-mail.`)) return;
        setBusy(id);
        try {
            const res = await fetch(`${API}/admin/creators/${id}/approve`, { method: "POST", headers: { Authorization: `Bearer ${getToken()}` } });
            const body = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(body?.error || "Erro ao aprovar");
            showToast(`${name} aprovado(a). E-mail enviado.`, "success");
            refetch(); loadAll();
        } catch (e: any) { showToast(e?.message || "Erro ao aprovar", "error"); }
        finally { setBusy(null); }
    };
    return (
        <div className="dash-container">
            <header className="dash-header">
                <div>
                    <h1 className="dash-title">Roteiristas</h1>
                    <p className="dash-subtitle">Roteiristas no nível básico. Aprovar = selo “Roteirista Recomendado” no perfil e nos roteiros. Não é preciso aprovar o roteirista para aprovar os roteiros dele.</p>
                </div>
            </header>
            {creators.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {creators.map(c => (
                        <div key={c.id} style={{
                            background: "#fff", borderRadius: "18px", padding: "18px 22px",
                            border: "1px solid rgba(226,232,240,0.7)", display: "flex",
                            alignItems: "center", gap: "16px",
                        }}>
                            <div style={{
                                width: "48px", height: "48px", borderRadius: "12px",
                                background: "linear-gradient(135deg, rgba(40,201,191,0.15), rgba(40,201,191,0.06))",
                                display: "flex", alignItems: "center", justifyContent: "center",
                            }}>{Icon.user({ size: 22, color: "#28C9BF" })}</div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: "700", fontSize: "15px", color: "#1A3263" }}>{c.traveler.name}</div>
                                <div style={{ fontSize: "12px", color: "#5A6B8C" }}>{c.traveler.email}</div>
                                {c.bio && <div style={{ fontSize: "12px", color: "#98989D", marginTop: "4px" }}>{c.bio}</div>}
                            </div>
                            <button onClick={() => approve(c.id, c.traveler.name)} disabled={busy === c.id} style={{
                                padding: "9px 16px", borderRadius: "10px", border: "none", cursor: "pointer",
                                background: "linear-gradient(135deg, #28C9BF, #1FA89F)", color: "#fff", fontWeight: 700, fontSize: "13px",
                                opacity: busy === c.id ? 0.6 : 1,
                            }}>{busy === c.id ? "Aprovando…" : "✓ Aprovar"}</button>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{
                    background: "#fff", borderRadius: "18px", padding: "48px 32px",
                    border: "1px solid rgba(226,232,240,0.7)", textAlign: "center",
                }}>
                    <div style={{ marginBottom: "12px" }}>{Icon.checkCircle({ size: 48, color: "#28C9BF" })}</div>
                    <div style={{ fontSize: "16px", fontWeight: "700", color: "#1A3263" }}>Nenhum roteirista a verificar</div>
                    <div style={{ fontSize: "14px", color: "#98989D", marginTop: "4px" }}>Todos os roteiristas estão aprovados.</div>
                </div>
            )}

            <h2 style={{ fontSize: 15, fontWeight: 800, color: "#1A3263", margin: "28px 0 12px" }}>Todos os roteiristas {all ? `(${all.length})` : ""}</h2>
            {!all ? <div style={{ color: "#5A6B8C", fontSize: 13 }}>Carregando…</div> : all.length === 0 ? (
                <div style={{ color: "#98989D", fontSize: 13 }}>Nenhum roteirista cadastrado ainda.</div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {all.map(c => (
                        <div key={c.id} style={{ background: "#fff", borderRadius: 14, padding: "12px 16px", border: "1px solid rgba(226,232,240,0.7)", display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, fontSize: 14, color: "#1A3263" }}>{c.name}</div>
                                <div style={{ fontSize: 12, color: "#5A6B8C" }}>{c.email} · {c.itineraries} roteiro(s)</div>
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 8, color: c.level === "BASIC" ? "#D97706" : "#16A34A", background: c.level === "BASIC" ? "rgba(217,119,6,0.1)" : "rgba(22,163,74,0.1)" }}>
                                {({ BASIC: "Básico (a verificar)", TRUSTED: "Recomendado", EXPERT: "Curador", AMBASSADOR: "Embaixador" } as Record<string, string>)[c.level] || c.level}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function AdminCreatorsPage() {
    return <AdminDataProvider><CreatorsContent /></AdminDataProvider>;
}

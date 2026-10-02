"use client";

import React, { useState } from "react";
import { AdminDataProvider, useAdmin, Icon, API } from "../shared";

function CreatorsContent() {
    const { creators, getToken, showToast, refetch } = useAdmin();
    const [busy, setBusy] = useState<string | null>(null);
    const approve = async (id: string, name: string) => {
        if (!window.confirm(`Aprovar ${name} como Roteirista Recomendado? Ela(e) recebe um e-mail.`)) return;
        setBusy(id);
        try {
            const res = await fetch(`${API}/admin/creators/${id}/approve`, { method: "POST", headers: { Authorization: `Bearer ${getToken()}` } });
            const body = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(body?.error || "Erro ao aprovar");
            showToast(`${name} aprovado(a). E-mail enviado.`, "success");
            refetch();
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
        </div>
    );
}

export default function AdminCreatorsPage() {
    return <AdminDataProvider><CreatorsContent /></AdminDataProvider>;
}

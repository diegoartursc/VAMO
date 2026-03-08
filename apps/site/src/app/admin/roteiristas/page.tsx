"use client";

import React from "react";
import { AdminDataProvider, useAdmin, Icon } from "../shared";

function CreatorsContent() {
    const { creators } = useAdmin();
    return (
        <div className="dash-container">
            <header className="dash-header">
                <div>
                    <h1 className="dash-title">Roteiristas</h1>
                    <p className="dash-subtitle">Gerenciamento de criadores de conteúdo</p>
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
                            <span style={{ fontSize: "11px", color: "#D97706", fontWeight: "700", background: "rgba(217,119,6,0.1)", padding: "4px 10px", borderRadius: "8px" }}>Pendente</span>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{
                    background: "#fff", borderRadius: "18px", padding: "48px 32px",
                    border: "1px solid rgba(226,232,240,0.7)", textAlign: "center",
                }}>
                    <div style={{ marginBottom: "12px" }}>{Icon.checkCircle({ size: 48, color: "#28C9BF" })}</div>
                    <div style={{ fontSize: "16px", fontWeight: "700", color: "#1A3263" }}>Nenhum roteirista pendente</div>
                    <div style={{ fontSize: "14px", color: "#98989D", marginTop: "4px" }}>Todos os roteiristas estão aprovados.</div>
                </div>
            )}
        </div>
    );
}

export default function AdminCreatorsPage() {
    return <AdminDataProvider><CreatorsContent /></AdminDataProvider>;
}

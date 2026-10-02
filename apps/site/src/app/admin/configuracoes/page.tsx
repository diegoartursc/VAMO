"use client";

import React, { useEffect, useState } from "react";

export default function AdminConfigPage() {
    const [admin, setAdmin] = useState<{ name?: string; email?: string; role?: string } | null>(null);
    useEffect(() => {
        try { setAdmin(JSON.parse(localStorage.getItem("adminUser") || "null")); } catch { setAdmin(null); }
    }, []);
    const items = [
        { label: "Conta conectada", value: admin?.email ? `${admin.name || ""} (${admin.email})` : "—", desc: admin?.role ? `Perfil: ${admin.role}` : "" },
        { label: "E-mail de avisos do admin", value: "vamoappviagens@gmail.com", desc: "Recebe o aviso de “roteiro enviado para revisão” (variável ADMIN_NOTIFICATION_EMAIL no Render)." },
        { label: "Trocar a senha do admin", value: "npx tsx scripts/reset-admin-password.ts <email> [senha]", desc: "Rodar em apps/backend. A troca pelo painel ainda não existe." },
        { label: "Idioma do painel", value: "Português (BR)", desc: "" },
    ];
    return (
        <div className="dash-container">
            <header className="dash-header">
                <div>
                    <h1 className="dash-title">Configurações</h1>
                    <p className="dash-subtitle">Informações do painel administrativo</p>
                </div>
            </header>
            <div style={{ background: "#fff", borderRadius: "18px", padding: "32px", border: "1px solid rgba(226,232,240,0.7)", maxWidth: "640px" }}>
                {items.map(item => (
                    <div key={item.label} style={{ paddingBottom: "16px", marginBottom: "16px", borderBottom: "1px solid #F0F2F5" }}>
                        <div style={{ fontSize: "13px", fontWeight: 700, color: "#1A3263", marginBottom: "4px" }}>{item.label}</div>
                        <div style={{ fontSize: "14px", color: "#5A6B8C", wordBreak: "break-word" }}>{item.value}</div>
                        {item.desc && <div style={{ fontSize: "11px", color: "#98989D", marginTop: "2px" }}>{item.desc}</div>}
                    </div>
                ))}
            </div>
        </div>
    );
}

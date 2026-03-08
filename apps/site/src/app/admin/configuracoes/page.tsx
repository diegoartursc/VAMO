"use client";

import React from "react";
import { Icon } from "../shared";

export default function AdminConfigPage() {
    return (
        <div className="dash-container">
            <header className="dash-header">
                <div>
                    <h1 className="dash-title">Configurações</h1>
                    <p className="dash-subtitle">Configurações do painel administrativo</p>
                </div>
            </header>
            <div style={{ background: "#fff", borderRadius: "18px", padding: "32px", border: "1px solid rgba(226,232,240,0.7)", maxWidth: "600px" }}>
                {[
                    { label: "E-mail de Notificações", value: "admin@vamo.travel", desc: "Recebe alertas de novas agências e roteiros" },
                    { label: "Tema", value: "Escuro", desc: "Tema visual do painel" },
                    { label: "Idioma", value: "Português (BR)", desc: "Idioma do dashboard" },
                ].map(item => (
                    <div key={item.label} style={{ paddingBottom: "16px", marginBottom: "16px", borderBottom: "1px solid #F0F2F5" }}>
                        <div style={{ fontSize: "13px", fontWeight: "700", color: "#1A3263", marginBottom: "4px" }}>{item.label}</div>
                        <div style={{ fontSize: "14px", color: "#5A6B8C" }}>{item.value}</div>
                        <div style={{ fontSize: "11px", color: "#98989D", marginTop: "2px" }}>{item.desc}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

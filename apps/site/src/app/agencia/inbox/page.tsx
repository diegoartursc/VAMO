"use client";

import { useState } from "react";

export default function InboxPage() {
    const [messages] = useState([
        { id: 1, from: "Suporte VAMO", subject: "Sua conta foi verificada!", body: "Olá! Parabéns, sua agência agora é uma parceira verificada VAMO. Seus pacotes já estão visíveis para todos.", date: "2026-02-27", unread: true },
        { id: 2, from: "Sistema", subject: "Novo comentário no roteiro", body: "Você recebeu um novo comentário de Mariana Silva no roteiro 'Fernando de Noronha'.", date: "2026-02-25", unread: false },
        { id: 3, from: "Admin", subject: "Dica de Venda", body: "Vimos que você cadastrou um roteiro para o Jalapão. Sabia que adicionar fotos de alta qualidade aumenta em 40% a conversão?", date: "2026-02-20", unread: false },
    ]);

    return (
        <div className="inbox-page">
            <div className="dash-header">
                <h1 className="dash-title">Caixa de Entrada</h1>
                <p className="dash-subtitle">Mensagens do suporte e notificações do sistema</p>
            </div>

            <div className="inbox-list" style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "2rem" }}>
                {messages.map(m => (
                    <div className="inbox-item" key={m.id} style={{
                        padding: "1.5rem",
                        backgroundColor: m.unread ? "rgba(var(--primary-rgb), 0.05)" : "white",
                        borderRadius: "12px",
                        border: "1px solid",
                        borderColor: m.unread ? "var(--primary)" : "#eee",
                        cursor: "pointer",
                        transition: "all 0.2s"
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                            <span style={{ fontWeight: 700, color: "var(--primary)" }}>{m.from}</span>
                            <span style={{ fontSize: "12px", color: "#666" }}>{m.date}</span>
                        </div>
                        <div style={{ fontWeight: 600, fontSize: "16px", marginBottom: "4px" }}>
                            {m.subject} {m.unread && <span style={{ color: "var(--error)", fontSize: "12px" }}>● novo</span>}
                        </div>
                        <p style={{ fontSize: "14px", color: "#444", margin: 0 }}>{m.body}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

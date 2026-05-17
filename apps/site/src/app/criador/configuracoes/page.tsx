"use client";

import { useEffect, useState } from "react";
import { getTravelerSession } from "../../../lib/auth";

export default function CriadorConfiguracoesPage() {
    const [saved, setSaved] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");

    useEffect(() => {
        const s = getTravelerSession();
        if (s) {
            setName(s.name || "");
            setEmail(s.email || "");
        }
    }, []);

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <div className="dash-container">
            <header className="dash-header">
                <div>
                    <h1 className="dash-title">Configurações da Conta</h1>
                    <p className="dash-subtitle">Gerencie suas preferências e dados pessoais</p>
                </div>
                <button className="btn-primary" onClick={handleSave}>
                    Salvar Alterações
                </button>
            </header>

            {saved && (
                <div role="alert" style={{ background: "#e8f5e9", color: "#2e7d32", padding: "12px", borderRadius: "8px", marginBottom: "20px" }}>
                    ✅ Configurações salvas com sucesso!
                </div>
            )}

            <div className="form-box">
                <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#1A3263", marginBottom: "16px" }}>
                    Informações Pessoais
                </h3>
                <div className="form-group">
                    <label className="form-label">Nome de Exibição</label>
                    <input
                        className="form-input"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Seu nome"
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">E-mail de Contato</label>
                    <input
                        className="form-input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu@email.com"
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">Biografia Curta</label>
                    <textarea
                        className="form-input"
                        placeholder="Conte um pouco sobre você como criador de roteiros..."
                        style={{ minHeight: "80px" }}
                    />
                </div>
            </div>

            <div className="form-box" style={{ marginTop: "24px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#1A3263", marginBottom: "16px" }}>
                    Notificações
                </h3>
                <label className="editor-toggle-row" style={{ padding: "12px 0", borderBottom: "1px solid #E2E8F0" }}>
                    <div className="editor-toggle-info">
                        <span className="editor-toggle-label" style={{ fontWeight: 500 }}>Avisos de novas vendas</span>
                    </div>
                    <label className="editor-toggle">
                        <input type="checkbox" defaultChecked />
                        <span className="editor-toggle-track" /><span className="editor-toggle-thumb" />
                    </label>
                </label>
                <label className="editor-toggle-row" style={{ padding: "12px 0" }}>
                    <div className="editor-toggle-info">
                        <span className="editor-toggle-label" style={{ fontWeight: 500 }}>Feedbacks de viajantes</span>
                    </div>
                    <label className="editor-toggle">
                        <input type="checkbox" defaultChecked />
                        <span className="editor-toggle-track" /><span className="editor-toggle-thumb" />
                    </label>
                </label>
            </div>
        </div>
    );
}

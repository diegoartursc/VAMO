"use client";

import { useState } from "react";

export default function AgenciaConfiguracoesPage() {
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <div className="dash-container">
            <header className="dash-header">
                <div>
                    <h1 className="dash-title">Configurações da Agência</h1>
                    <p className="dash-subtitle">Gerencie o perfil público e integrações</p>
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
                    Perfil da Empresa
                </h3>
                <div className="form-group">
                    <label className="form-label">Nome Fantasia</label>
                    <input className="form-input" defaultValue="VAMO Demo Agency" />
                </div>
                <div className="form-group">
                    <label className="form-label">Identificação fiscal (opcional)</label>
                    <input className="form-input" defaultValue="00.000.000/0001-00" readOnly style={{ opacity: 0.6 }} />
                </div>
                <div className="form-group">
                    <label className="form-label">WhatsApp Comercial</label>
                    <input className="form-input" defaultValue="+55 11 99999-9999" />
                </div>
            </div>
        </div>
    );
}

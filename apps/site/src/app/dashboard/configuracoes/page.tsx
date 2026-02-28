"use client";

export default function ConfiguracoesPage() {
    return (
        <div className="editor-container" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", textAlign: "center" }}>
            <div style={{ fontSize: 64, marginBottom: 24 }}>⚙️</div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: "#fff", marginBottom: 12 }}>Em Breve</h1>
            <p style={{ color: "#94a3b8", fontSize: 16, maxWidth: 400, lineHeight: 1.6 }}>
                As configurações da conta estão sendo desenvolvidas. Em breve você poderá personalizar seu perfil, alterar senha e gerenciar preferências.
            </p>
            <div style={{ marginTop: 32, padding: "10px 24px", borderRadius: 12, background: "rgba(99,102,241,0.15)", color: "#818cf8", fontSize: 13, fontWeight: 600 }}>
                🔧 Em desenvolvimento
            </div>
        </div>
    );
}

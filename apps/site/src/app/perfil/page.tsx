"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCurrentUser, type CurrentUser } from "../../lib/auth";

export default function PerfilPage() {
    const [user, setUser] = useState<CurrentUser | null>(null);
    useEffect(() => { setUser(getCurrentUser()); }, []);

    if (!user) return null;
    const isCreator = !!user.creatorId;
    const initials = user.name.split(" ").filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase()).join("");

    return (
        <div>
            {/* ── Hero do perfil ── */}
            <section
                style={{
                    display: "flex",
                    gap: 24,
                    alignItems: "center",
                    padding: "32px 0 40px",
                    borderBottom: "1px solid rgba(0,0,0,0.06)",
                }}
            >
                <div
                    style={{
                        width: 88,
                        height: 88,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #FF5A5F, #FF385C)",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 32,
                        fontWeight: 700,
                        letterSpacing: 1,
                        boxShadow: "0 10px 24px rgba(255,56,92,0.28)",
                    }}
                >
                    {initials || "U"}
                </div>
                <div style={{ flex: 1 }}>
                    <h1 style={{ fontSize: 32, fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>
                        {user.name}
                    </h1>
                    <div style={{ color: "#6b7280", marginTop: 4, fontSize: 15 }}>{user.email}</div>
                    <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {user.roles.map((r) => (
                            <span
                                key={r}
                                style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    letterSpacing: 0.6,
                                    padding: "5px 12px",
                                    borderRadius: 999,
                                    background:
                                        r === "CREATOR"
                                            ? "rgba(255, 56, 92, 0.12)"
                                            : r === "ADMIN"
                                                ? "rgba(16, 185, 129, 0.12)"
                                                : "rgba(59, 130, 246, 0.12)",
                                    color:
                                        r === "CREATOR"
                                            ? "#FF385C"
                                            : r === "ADMIN"
                                                ? "#059669"
                                                : "#2563eb",
                                }}
                            >
                                {r === "CREATOR" ? "Criador" : r === "ADMIN" ? "Admin" : "Viajante"}
                            </span>
                        ))}
                    </div>
                </div>
                <Link
                    href="/dashboard/configuracoes"
                    style={{
                        padding: "10px 18px",
                        borderRadius: 999,
                        border: "1px solid rgba(0,0,0,0.12)",
                        background: "#fff",
                        textDecoration: "none",
                        color: "#1c1c1e",
                        fontSize: 14,
                        fontWeight: 600,
                    }}
                >
                    Editar perfil
                </Link>
            </section>

            {/* ── Seções (cards) ── */}
            <section style={{ marginTop: 32 }}>
                <h2 style={{ fontSize: 14, fontWeight: 700, letterSpacing: 1.2, color: "#6b7280", textTransform: "uppercase", marginBottom: 16 }}>
                    Minha conta
                </h2>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                        gap: 16,
                    }}
                >
                    <Card
                        href="/perfil/favoritos"
                        title="Favoritos"
                        subtitle="Roteiros salvos pra depois"
                        emoji="❤️"
                    />
                    <Card
                        href="/perfil/compras"
                        title="Minhas compras"
                        subtitle="Roteiros e pacotes adquiridos"
                        emoji="🧳"
                    />
                    <Card
                        href="/criadores"
                        title="Explorar"
                        subtitle="Descubra novos roteiros"
                        emoji="🗺️"
                    />
                </div>
            </section>

            {isCreator ? (
                <section style={{ marginTop: 40 }}>
                    <h2 style={{ fontSize: 14, fontWeight: 700, letterSpacing: 1.2, color: "#6b7280", textTransform: "uppercase", marginBottom: 16 }}>
                        Modo criador
                    </h2>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                            gap: 16,
                        }}
                    >
                        <Card
                            href="/dashboard"
                            title="Dashboard creator"
                            subtitle="Estatísticas, vendas, comentários"
                            emoji="📊"
                            highlight
                        />
                        <Card
                            href="/dashboard/roteiros"
                            title="Meus roteiros"
                            subtitle="Gerencie seus roteiros publicados"
                            emoji="📍"
                        />
                        <Card
                            href="/dashboard/roteiro/novo"
                            title="Criar novo roteiro"
                            subtitle="Comece um roteiro do zero"
                            emoji="✨"
                        />
                    </div>
                </section>
            ) : (
                <section style={{ marginTop: 40 }}>
                    <div
                        style={{
                            padding: 28,
                            borderRadius: 16,
                            background: "linear-gradient(135deg, #fff5f6, #fff)",
                            border: "1px solid rgba(255,56,92,0.16)",
                            display: "flex",
                            alignItems: "center",
                            gap: 20,
                        }}
                    >
                        <div style={{ fontSize: 36 }}>✨</div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: 18 }}>Vire um criador</div>
                            <div style={{ color: "#6b7280", marginTop: 4 }}>
                                Publique seus roteiros e ganhe a cada viajante que escolher você.
                            </div>
                        </div>
                        <Link
                            href="/perfil/virar-criador"
                            style={{
                                padding: "12px 22px",
                                borderRadius: 999,
                                background: "#FF385C",
                                color: "#fff",
                                textDecoration: "none",
                                fontWeight: 700,
                                fontSize: 14,
                                boxShadow: "0 6px 16px rgba(255,56,92,0.3)",
                            }}
                        >
                            Começar
                        </Link>
                    </div>
                </section>
            )}
        </div>
    );
}

function Card({
    href,
    title,
    subtitle,
    emoji,
    highlight = false,
}: {
    href: string;
    title: string;
    subtitle: string;
    emoji: string;
    highlight?: boolean;
}) {
    return (
        <Link
            href={href}
            style={{
                display: "block",
                padding: 20,
                borderRadius: 16,
                background: highlight ? "linear-gradient(135deg, #fff5f6, #fff)" : "#fff",
                border: highlight ? "1px solid rgba(255,56,92,0.18)" : "1px solid rgba(0,0,0,0.06)",
                textDecoration: "none",
                color: "inherit",
                boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                transition: "transform 160ms ease, box-shadow 160ms ease",
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.08)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.04)";
            }}
        >
            <div style={{ fontSize: 28, marginBottom: 12 }}>{emoji}</div>
            <div style={{ fontWeight: 700, fontSize: 16, color: highlight ? "#FF385C" : "#1c1c1e" }}>
                {title}
            </div>
            <div style={{ marginTop: 4, fontSize: 13, color: "#6b7280" }}>{subtitle}</div>
        </Link>
    );
}

"use client";

import React from "react";
import Link from "next/link";
import { AdminDataProvider, useAdmin, Icon } from "./shared";

const card: React.CSSProperties = {
    background: "#fff", borderRadius: "18px", padding: "18px 20px",
    border: "1px solid rgba(226,232,240,0.7)", boxShadow: "0 2px 8px rgba(26,50,99,0.04)",
    textDecoration: "none", display: "block",
};

function OverviewContent() {
    const { itineraries, creators, stats, loading } = useAdmin();

    if (loading) return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
            <div style={{ fontSize: "16px", color: "#5A6B8C" }}>Carregando…</div>
        </div>
    );

    const pendingTotal = (stats?.pendingItineraries ?? itineraries.length) + creators.length;
    const statCards = [
        { label: "Roteiros para revisar", value: stats?.pendingItineraries ?? itineraries.length, icon: Icon.hourglass, color: "#D97706", bg: "rgba(217,119,6,0.08)", href: "/admin/roteiros?status=PENDING_REVIEW" },
        { label: "Aprovados, aguardando publicação", value: stats?.approvedAwaitingPublish ?? 0, icon: Icon.checkCircle, color: "#6366F1", bg: "rgba(99,102,241,0.08)", href: "/admin/roteiros?status=APPROVED" },
        { label: "Roteiros no ar", value: stats?.activeItineraries ?? 0, icon: Icon.map, color: "#16A34A", bg: "rgba(22,163,74,0.08)", href: "/admin/roteiros?status=ACTIVE" },
        { label: "Roteiristas a verificar", value: creators.length, icon: Icon.compass, color: "#1FA89F", bg: "rgba(31,168,159,0.08)", href: "/admin/roteiristas" },
        { label: "Usuários", value: stats?.travelers ?? 0, icon: Icon.users, color: "#1A3263", bg: "rgba(26,50,99,0.06)", href: "/admin/clientes" },
        { label: "Vendas", value: stats?.sales ?? 0, icon: Icon.wallet, color: "#1A3263", bg: "rgba(26,50,99,0.06)", href: "/admin/financeiro" },
    ];

    return (
        <div className="dash-container">
            <header className="dash-header">
                <div>
                    <h1 className="dash-title">Visão Geral</h1>
                    <p className="dash-subtitle">{new Date().toLocaleDateString("pt-BR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
                </div>
            </header>

            {pendingTotal > 0 ? (
                <Link href={itineraries.length > 0 ? "/admin/roteiros?status=PENDING_REVIEW" : "/admin/roteiristas"} style={{
                    marginBottom: "20px", background: "rgba(217,119,6,0.06)", border: "1px solid rgba(217,119,6,0.2)",
                    borderRadius: "14px", padding: "14px 18px", display: "flex", alignItems: "center", gap: "10px", textDecoration: "none",
                }}>
                    {Icon.alertTriangle({ size: 18, color: "#D97706" })}
                    <span style={{ fontSize: "14px", color: "#92400E", fontWeight: 700 }}>
                        {pendingTotal} {pendingTotal === 1 ? "item aguardando" : "itens aguardando"} sua revisão
                    </span>
                    <span style={{ marginLeft: "auto", fontSize: "13px", color: "#D97706", fontWeight: 700 }}>Revisar →</span>
                </Link>
            ) : (
                <div style={{ marginBottom: "20px", background: "rgba(22,163,74,0.06)", border: "1px solid rgba(22,163,74,0.2)", borderRadius: "14px", padding: "14px 18px", display: "flex", alignItems: "center", gap: "10px" }}>
                    {Icon.checkCircle({ size: 18, color: "#16A34A" })}
                    <span style={{ fontSize: "14px", color: "#166534", fontWeight: 700 }}>Nada aguardando revisão. Tudo em dia.</span>
                </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "14px", marginBottom: "24px" }}>
                {statCards.map(stat => (
                    <Link key={stat.label} href={stat.href} style={card} className="admin-stat-card">
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: stat.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                {stat.icon({ size: 18, color: stat.color })}
                            </div>
                            <span style={{ fontSize: "12px", color: "#5A6B8C", fontWeight: 600 }}>{stat.label}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                            <span style={{ fontSize: "28px", fontWeight: 800, color: stat.color }}>{stat.value}</span>
                            <span style={{ fontSize: "12px", color: "#98989D", fontWeight: 600 }}>Abrir →</span>
                        </div>
                    </Link>
                ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
                <div style={{ ...card }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                        {Icon.map({ size: 16, color: "#D97706" })}
                        <span style={{ fontSize: "13px", fontWeight: 700, color: "#1A3263" }}>Roteiros para revisar</span>
                        <Link href="/admin/roteiros?status=PENDING_REVIEW" style={{ marginLeft: "auto", fontSize: "12px", color: "#1FA89F", fontWeight: 700, textDecoration: "none" }}>Ver todos →</Link>
                    </div>
                    {itineraries.slice(0, 5).map(p => (
                        <Link key={p.id} href={`/admin/roteiros/${p.id}`} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 0", borderBottom: "1px solid #F0F2F5", fontSize: "13px", color: "#1A3263", textDecoration: "none" }}>
                            <span style={{ flex: 1 }}>{p.title} <span style={{ color: "#98989D" }}>· {(p as any).creator?.traveler?.name || "Roteirista"}</span></span>
                            <span style={{ fontSize: "12px", color: "#1FA89F", fontWeight: 700 }}>Revisar →</span>
                        </Link>
                    ))}
                    {itineraries.length === 0 && <div style={{ fontSize: "13px", color: "#98989D" }}>Nenhum roteiro aguardando revisão.</div>}
                </div>

                <div style={{ ...card }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                        {Icon.compass({ size: 16, color: "#1FA89F" })}
                        <span style={{ fontSize: "13px", fontWeight: 700, color: "#1A3263" }}>Roteiristas a verificar</span>
                        <Link href="/admin/roteiristas" style={{ marginLeft: "auto", fontSize: "12px", color: "#1FA89F", fontWeight: 700, textDecoration: "none" }}>Ver todos →</Link>
                    </div>
                    {creators.slice(0, 5).map(c => (
                        <Link key={c.id} href="/admin/roteiristas" style={{ display: "block", padding: "10px 0", borderBottom: "1px solid #F0F2F5", fontSize: "13px", color: "#1A3263", textDecoration: "none" }}>
                            {c.traveler.name} <span style={{ color: "#98989D" }}>· {c.traveler.email}</span>
                        </Link>
                    ))}
                    {creators.length === 0 && <div style={{ fontSize: "13px", color: "#98989D" }}>Nenhum roteirista a verificar.</div>}
                </div>
            </div>
        </div>
    );
}

export default function AdminOverviewPage() {
    return (
        <AdminDataProvider>
            <OverviewContent />
        </AdminDataProvider>
    );
}

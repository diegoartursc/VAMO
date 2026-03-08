"use client";

import React from "react";
import Link from "next/link";
import { AdminDataProvider, useAdmin, Icon } from "./shared";

function OverviewContent() {
    const { packages, itineraries, creators, stats, loading } = useAdmin();

    if (loading) return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
            <div style={{ fontSize: "16px", color: "#5A6B8C" }}>Carregando…</div>
        </div>
    );

    return (
        <div className="dash-container">
            <header className="dash-header">
                <div>
                    <h1 className="dash-title">Visão Geral</h1>
                    <p className="dash-subtitle">{new Date().toLocaleDateString("pt-BR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
                </div>
            </header>

            {/* Stats cards */}
            {stats && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "24px" }}>
                    {[
                        { label: "Total Pendente", value: stats.totalPending + creators.length, icon: Icon.hourglass, color: "#D97706", bg: "rgba(217,119,6,0.08)" },
                        { label: "Pacotes Pendentes", value: stats.pendingPackages, icon: Icon.package, color: "#1FA89F", bg: "rgba(31,168,159,0.08)" },
                        { label: "Roteiros Pendentes", value: stats.pendingItineraries, icon: Icon.map, color: "#6366F1", bg: "rgba(99,102,241,0.08)" },
                        { label: "Aprovados Hoje", value: stats.approvedToday, icon: Icon.checkCircle, color: "#16A34A", bg: "rgba(22,163,74,0.08)" },
                    ].map(stat => (
                        <div key={stat.label} style={{
                            background: "#fff", borderRadius: "18px", padding: "18px 20px",
                            border: "1px solid rgba(226,232,240,0.7)", boxShadow: "0 2px 8px rgba(26,50,99,0.04)",
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                                <div style={{
                                    width: "36px", height: "36px", borderRadius: "10px",
                                    background: stat.bg, display: "flex", alignItems: "center", justifyContent: "center",
                                }}>{stat.icon({ size: 18, color: stat.color })}</div>
                                <span style={{ fontSize: "12px", color: "#5A6B8C", fontWeight: "600" }}>{stat.label}</span>
                            </div>
                            <div style={{ fontSize: "28px", fontWeight: "800", color: stat.color }}>{stat.value}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Quick lists */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                {/* Pending packages */}
                <div style={{ background: "#fff", borderRadius: "18px", padding: "20px", border: "1px solid rgba(226,232,240,0.7)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                        {Icon.package({ size: 16, color: "#1FA89F" })}
                        <span style={{ fontSize: "13px", fontWeight: "700", color: "#1A3263" }}>Pacotes pendentes</span>
                        <span style={{ marginLeft: "auto", fontSize: "11px", fontWeight: "700", color: "#1FA89F", background: "rgba(31,168,159,0.1)", padding: "2px 8px", borderRadius: "8px" }}>{packages.length}</span>
                    </div>
                    {packages.slice(0, 3).map(p => (
                        <div key={p.id} style={{ padding: "8px 0", borderBottom: "1px solid #F0F2F5", fontSize: "13px", color: "#1A3263" }}>
                            {p.title} <span style={{ color: "#98989D" }}>· {p.agency?.name}</span>
                        </div>
                    ))}
                    {packages.length === 0 && <div style={{ fontSize: "13px", color: "#98989D" }}>Nenhum pacote pendente</div>}
                    {packages.length > 3 && <Link href="/admin/pacotes" style={{ marginTop: "8px", display: "inline-block", fontSize: "12px", color: "#28C9BF", fontWeight: "600", textDecoration: "none" }}>Ver todos →</Link>}
                </div>

                {/* Pending creators */}
                <div style={{ background: "#fff", borderRadius: "18px", padding: "20px", border: "1px solid rgba(226,232,240,0.7)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                        {Icon.compass({ size: 16, color: "#6366F1" })}
                        <span style={{ fontSize: "13px", fontWeight: "700", color: "#1A3263" }}>Roteiristas pendentes</span>
                        <span style={{ marginLeft: "auto", fontSize: "11px", fontWeight: "700", color: "#6366F1", background: "rgba(99,102,241,0.1)", padding: "2px 8px", borderRadius: "8px" }}>{creators.length}</span>
                    </div>
                    {creators.slice(0, 3).map(c => (
                        <div key={c.id} style={{ padding: "8px 0", borderBottom: "1px solid #F0F2F5", fontSize: "13px", color: "#1A3263" }}>
                            {c.traveler.name} <span style={{ color: "#98989D" }}>· {c.traveler.email}</span>
                        </div>
                    ))}
                    {creators.length === 0 && <div style={{ fontSize: "13px", color: "#98989D" }}>Nenhum roteirista pendente</div>}
                    {creators.length > 3 && <Link href="/admin/roteiristas" style={{ marginTop: "8px", display: "inline-block", fontSize: "12px", color: "#28C9BF", fontWeight: "600", textDecoration: "none" }}>Ver todos →</Link>}
                </div>
            </div>

            {/* Warning */}
            {(stats && stats.totalPending + creators.length > 5) && (
                <div style={{ marginTop: "16px", background: "rgba(217,119,6,0.06)", border: "1px solid rgba(217,119,6,0.15)", borderRadius: "14px", padding: "14px 18px", display: "flex", alignItems: "center", gap: "10px" }}>
                    {Icon.alertTriangle({ size: 18, color: "#D97706" })}
                    <span style={{ fontSize: "13px", color: "#92400E", fontWeight: "600" }}>
                        Existem {stats.totalPending + creators.length} itens aguardando sua revisão.
                    </span>
                </div>
            )}
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

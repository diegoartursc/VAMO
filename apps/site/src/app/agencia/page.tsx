"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { getSession, isAgencySession, type AuthSession } from "../../lib/auth";
import { getAgencyPackages } from "../../lib/api";

export default function AgenciaDashboardPage() {
    const [session, setSession] = useState<AuthSession | null>(null);
    const [packages, setPackages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const raw = await getSession();
                const s = isAgencySession(raw) ? raw : null;
                if (s) setSession(s);

                // If ADMIN, fetch all packages (passing no agencyId)
                const isAuthAdmin = s?.employee?.role === "ADMIN";
                const pkgs = await getAgencyPackages(isAuthAdmin ? "" : (s?.agency?.id || "mock"));
                setPackages(pkgs || []);
            } catch {
                // mock data already handled in api.ts
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const formatCurrency = (value: number) =>
        `A$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`;

    const activePackages = packages.filter(p => p.status === "ACTIVE" || p.status === "active");
    const totalSales = packages.reduce((s, p) => s + (p.recentPurchases || 0), 0);
    const avgRating = packages.filter(p => p.rating).length > 0
        ? (packages.reduce((s, p) => s + (p.rating || 0), 0) / packages.filter(p => p.rating).length).toFixed(1)
        : "—";
    const avgQuality = packages.length > 0
        ? Math.round(packages.reduce((s, p) => s + (p.qualityScore || 0), 0) / packages.length)
        : 0;

    if (loading) return (
        <>
            <div className="dash-header">
                <h1 className="dash-title">Visão Geral</h1>
                <p className="dash-subtitle">Carregando dados...</p>
            </div>
            <div className="dash-stats">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="dash-stat-card" style={{ opacity: 0.4 }}>
                        <div className="dash-stat-label">—</div>
                        <div className="dash-stat-value">...</div>
                    </div>
                ))}
            </div>
        </>
    );

    return (
        <>
            <div className="dash-header">
                <h1 className="dash-title">Visão Geral</h1>
                <p className="dash-subtitle">
                    {session?.employee?.role === "ADMIN" ? "VAMO Admin Control" : (session?.agency?.name || "Sua Agência")} — Gerencie pacotes, vendas e avaliações
                </p>
            </div>

            {/* Stats */}
            <div className="dash-stats">
                <div className="dash-stat-card">
                    <div className="dash-stat-label">Pacotes Ativos</div>
                    <div className="dash-stat-value teal">{activePackages.length}</div>
                    <div className="dash-stat-change">{packages.length} total cadastrados</div>
                </div>
                <div className="dash-stat-card">
                    <div className="dash-stat-label">Vendas Totais</div>
                    <div className="dash-stat-value">{totalSales}</div>
                    <div className="dash-stat-change">
                        {packages.reduce((s, p) => s + (p.reviewCount || 0), 0)} avaliações recebidas
                    </div>
                </div>
                <div className="dash-stat-card">
                    <div className="dash-stat-label">Avaliação Média</div>
                    <div className="dash-stat-value">{avgRating}</div>
                    <div className="dash-stat-change">de 5.0 estrelas</div>
                </div>
                <div className="dash-stat-card">
                    <div className="dash-stat-label">Qualidade Média</div>
                    <div className="dash-stat-value"
                        style={{ color: avgQuality >= 80 ? "var(--success)" : avgQuality >= 50 ? "var(--warning)" : "var(--error)" }}>
                        {avgQuality}%
                    </div>
                    <div className="dash-stat-change">Quality Score</div>
                </div>
            </div>

            {/* Packages Table */}
            <div className="itinerary-table">
                <div className="table-header">
                    <h3 className="table-title">Seus Pacotes ({packages.length})</h3>
                    <Link href="/agencia/pacote/new">
                        <button className="btn-new">+ Novo Pacote</button>
                    </Link>
                </div>

                <div className="table-row table-row-head" style={{ gridTemplateColumns: "2.5fr 1fr 1fr 1fr 1fr 100px" }}>
                    <div className="table-cell">Pacote</div>
                    <div className="table-cell">Status</div>
                    <div className="table-cell">Preço</div>
                    <div className="table-cell">Vendas</div>
                    <div className="table-cell">Score</div>
                    <div className="table-cell">Ações</div>
                </div>

                {packages.length === 0 ? (
                    <div className="table-row">
                        <div className="table-cell" style={{ gridColumn: "1 / -1", textAlign: "center", padding: "2rem" }}>
                            Nenhum pacote cadastrado.{" "}
                            <Link href="/agencia/pacote/new" style={{ color: "var(--primary)", fontWeight: 600 }}>
                                Crie seu primeiro pacote →
                            </Link>
                        </div>
                    </div>
                ) : (
                    packages.map((pkg) => (
                        <div className="table-row" key={pkg.id} style={{ gridTemplateColumns: "2.5fr 1fr 1fr 1fr 1fr 100px" }}>
                            <div className="table-cell">
                                <div className="itinerary-name">{pkg.title} — {pkg.duration} dias</div>
                                <div className="itinerary-destination">📍 {pkg.destination}, {pkg.country}</div>
                            </div>
                            <div className="table-cell">
                                <span className={`status-badge ${pkg.status === "ACTIVE" || pkg.status === "active" ? "published" : pkg.status === "PAUSED" || pkg.status === "paused" ? "draft" : "archived"}`}>
                                    {pkg.status === "ACTIVE" || pkg.status === "active" ? "Ativo" : pkg.status === "PAUSED" || pkg.status === "paused" ? "Pausado" : "Arquivado"}
                                </span>
                            </div>
                            <div className="table-cell">
                                {pkg.priceMin != null ? formatCurrency(pkg.priceMin) : pkg.price?.min != null ? formatCurrency(pkg.price.min) : "—"}
                            </div>
                            <div className="table-cell">
                                {(pkg.recentPurchases || 0) > 0 ? pkg.recentPurchases : "—"}
                            </div>
                            <div className="table-cell">
                                <span style={{
                                    fontWeight: 700,
                                    color: (pkg.qualityScore || 0) >= 80 ? "var(--success)" : (pkg.qualityScore || 0) >= 50 ? "var(--warning)" : "var(--error)"
                                }}>
                                    {pkg.qualityScore || 0}%
                                </span>
                            </div>
                            <div className="table-cell table-actions">
                                <Link href={`/agencia/pacote/${pkg.id}`}>
                                    <button className="table-action-btn" title="Editar">✏️</button>
                                </Link>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </>
    );
}

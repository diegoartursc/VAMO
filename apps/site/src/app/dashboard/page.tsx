"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { getSession, type AuthSession } from "../../lib/auth";
import { getAgencyPackages } from "../../lib/api";

export default function DashboardPage() {
    const [session, setSession] = useState<AuthSession | null>(null);
    const [packages, setPackages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const s = await getSession();
                if (!s) return;
                setSession(s);

                const pkgs = await getAgencyPackages(s.agency.id);
                setPackages(pkgs || []);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    if (loading) {
        return (
            <>
                <div className="dash-header">
                    <h1 className="dash-title">Visão Geral</h1>
                    <p className="dash-subtitle">Carregando dados...</p>
                </div>
                <div className="dash-stats">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="dash-stat-card" style={{ opacity: 0.5 }}>
                            <div className="dash-stat-label">—</div>
                            <div className="dash-stat-value">...</div>
                        </div>
                    ))}
                </div>
            </>
        );
    }

    if (error) {
        return (
            <>
                <div className="dash-header">
                    <h1 className="dash-title">Visão Geral</h1>
                    <p className="dash-subtitle" style={{ color: "#e74c3c" }}>
                        Erro ao carregar: {error}. Verifique se o backend está rodando em localhost:3000.
                    </p>
                </div>
            </>
        );
    }

    const formatCurrency = (value: number) =>
        `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`;

    const activePackages = packages.filter(p =>
        p.status === 'ACTIVE' || p.status === 'active' ||
        p.status === 'APPROVED' || p.status === 'PENDING_REVIEW'
    );
    const avgQuality = packages.length > 0
        ? Math.round(packages.reduce((sum, p) => sum + (p.qualityScore || 0), 0) / packages.length)
        : 0;

    return (
        <>
            <div className="dash-header">
                <h1 className="dash-title">Visão Geral</h1>
                <p className="dash-subtitle">
                    {session?.agency.name} — Acompanhe seus pacotes e vendas
                </p>
            </div>

            {/* Stats */}
            <div className="dash-stats">
                <div className="dash-stat-card">
                    <div className="dash-stat-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 7V5a4 4 0 00-8 0v2" /></svg>
                    </div>
                    <div className="dash-stat-label">Pacotes Ativos</div>
                    <div className="dash-stat-value teal">{activePackages.length}</div>
                    <div className="dash-stat-change">{packages.length} total cadastrados</div>
                </div>
                <div className="dash-stat-card">
                    <div className="dash-stat-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>
                    </div>
                    <div className="dash-stat-label">Vendas Totais</div>
                    <div className="dash-stat-value">{packages.reduce((sum, p) => sum + (p.recentPurchases || 0), 0)}</div>
                    <div className="dash-stat-change">{packages.reduce((sum, p) => sum + (p.reviewCount || 0), 0)} avaliações</div>
                </div>
                <div className="dash-stat-card">
                    <div className="dash-stat-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                    </div>
                    <div className="dash-stat-label">Avaliação Média</div>
                    <div className="dash-stat-value">
                        {packages.filter(p => p.rating).length > 0
                            ? (packages.reduce((sum, p) => sum + (p.rating || 0), 0) / packages.filter(p => p.rating).length).toFixed(1)
                            : "—"}
                    </div>
                    <div className="dash-stat-change">de 5.0</div>
                </div>
                <div className="dash-stat-card">
                    <div className="dash-stat-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                    </div>
                    <div className="dash-stat-label">Qualidade Média</div>
                    <div className="dash-stat-value">{avgQuality}%</div>
                    <div className="dash-stat-change">Quality Score</div>
                </div>
            </div>

            {/* Recent Packages */}
            <div className="itinerary-table">
                <div className="table-header">
                    <h3 className="table-title">Seus Pacotes</h3>
                    <Link href="/dashboard/pacote/new">
                        <button className="btn-new">+ Novo Pacote</button>
                    </Link>
                </div>

                <div className="table-row table-row-head">
                    <div className="table-cell">Pacote</div>
                    <div className="table-cell">Status</div>
                    <div className="table-cell">Preço</div>
                    <div className="table-cell">Score</div>
                    <div className="table-cell">Ações</div>
                </div>

                {packages.length === 0 ? (
                    <div className="table-row">
                        <div className="table-cell" style={{ gridColumn: "1 / -1", textAlign: "center", padding: "2rem" }}>
                            Nenhum pacote cadastrado.{" "}
                            <Link href="/dashboard/pacote/new" style={{ color: "var(--primary)", fontWeight: 600 }}>
                                Crie seu primeiro pacote!
                            </Link>
                        </div>
                    </div>
                ) : (
                    packages.slice(0, 10).map((pkg) => (
                        <div className="table-row" key={pkg.id}>
                            <div className="table-cell">
                                <div className="itinerary-name">
                                    {pkg.title} — {pkg.duration} dias
                                </div>
                                <div className="itinerary-destination">
                                    {pkg.destination}, {pkg.country}
                                </div>
                            </div>
                            <div className="table-cell">
                                <span className={`status-badge ${pkg.status === 'APPROVED' ? 'approved' :
                                        pkg.status === 'PENDING_REVIEW' ? 'pending' :
                                            pkg.status === 'ACTIVE' ? 'published' :
                                                pkg.status === 'REJECTED' ? 'rejected' :
                                                    'draft'
                                    }`}>
                                    {pkg.status === 'APPROVED' ? '✅ Aprovado'
                                        : pkg.status === 'PENDING_REVIEW' ? '🕐 Em revisão'
                                            : pkg.status === 'DRAFT' ? '📝 Rascunho'
                                                : pkg.status === 'ACTIVE' ? 'Ativo'
                                                    : pkg.status === 'PAUSED' ? 'Pausado'
                                                        : pkg.status === 'REJECTED' ? '❌ Rejeitado'
                                                            : 'Arquivado'}
                                </span>
                            </div>
                            <div className="table-cell">
                                {pkg.price?.min != null
                                    ? formatCurrency(pkg.price.min)
                                    : pkg.priceMin != null
                                        ? formatCurrency(pkg.priceMin)
                                        : "—"}
                            </div>
                            <div className="table-cell">
                                <div className="pkg-quality-mini" style={{
                                    "--q": `${pkg.qualityScore || 0}%`,
                                    "--qc": (pkg.qualityScore || 0) >= 80 ? "var(--success)" : (pkg.qualityScore || 0) >= 50 ? "var(--warning)" : "var(--error)",
                                } as any}>
                                    <span>{pkg.qualityScore || 0}%</span>
                                </div>
                            </div>
                            <div className="table-cell table-actions">
                                <Link href={`/dashboard/pacote/${pkg.id}`}>
                                    <button className="table-action-btn" title="Editar">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                                    </button>
                                </Link>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </>
    );
}

"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { getSession, type AuthSession } from "../../lib/auth";
import { getAgencyPackages, getAgencySales } from "../../lib/api";

function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
}

function formatCurrency(value: number) {
    if (value >= 1000) return `R$ ${(value / 1000).toFixed(1).replace(".", ",")}k`;
    return `R$ ${value.toLocaleString("pt-BR")}`;
}

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
    ACTIVE:         { label: "Ativo",       color: "#28C9BF", bg: "rgba(40,201,191,0.1)"  },
    APPROVED:       { label: "Aprovado",    color: "#16A34A", bg: "rgba(34,197,94,0.1)"   },
    PENDING_REVIEW: { label: "Em análise",  color: "#D97706", bg: "rgba(245,158,11,0.1)"  },
    DRAFT:          { label: "Rascunho",    color: "#64748B", bg: "rgba(100,116,139,0.1)" },
    PAUSED:         { label: "Pausado",     color: "#F59E0B", bg: "rgba(245,158,11,0.1)"  },
    REJECTED:       { label: "Rejeitado",   color: "#DC2626", bg: "rgba(239,68,68,0.1)"   },
};

/* ── SVG Icons ── */
const Ic = {
    bag:     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a4 4 0 00-8 0v2"/></svg>,
    dollar:  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
    star:    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    check:   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
    plus:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    arrow:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
    edit:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
    map:     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z M8 2v16 M16 6v16"/></svg>,
    lightning: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
    starFill: <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    sales:   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z M3 6h18 M16 10a4 4 0 01-8 0"/></svg>,
    comment: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>,
};

function hoverCard(e: React.MouseEvent<HTMLElement>, enter: boolean) {
    const el = e.currentTarget as HTMLElement;
    el.style.transform = enter ? "translateY(-3px)" : "translateY(0)";
    el.style.boxShadow = enter ? "0 12px 32px rgba(26,50,99,0.1)" : "0 1px 4px rgba(26,50,99,0.05)";
}
function hoverAction(e: React.MouseEvent<HTMLElement>, enter: boolean, border = "rgba(40,201,191,0.3)") {
    const el = e.currentTarget as HTMLElement;
    el.style.transform = enter ? "translateY(-2px)" : "translateY(0)";
    el.style.boxShadow = enter ? "0 8px 24px rgba(26,50,99,0.1)" : "0 1px 4px rgba(26,50,99,0.05)";
    el.style.borderColor = enter ? border : "rgba(226,232,240,0.7)";
}

export default function DashboardPage() {
    const [session, setSession] = useState<AuthSession | null>(null);
    const [packages, setPackages] = useState<any[]>([]);
    const [sales, setSales] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const s = await getSession();
                if (!s) return;
                setSession(s);
                const [pkgs, sls] = await Promise.all([
                    getAgencyPackages(s.agency.id),
                    getAgencySales(s.agency.id),
                ]);
                setPackages(pkgs || []);
                setSales(sls || []);
            } catch { }
            finally { setLoading(false); }
        })();
    }, []);

    const firstName = session?.employee?.name?.split(" ")[0] || "Criador";
    const activePackages = packages.filter(p => ["ACTIVE","active","APPROVED","PENDING_REVIEW"].includes(p.status));
    const totalRevenue   = sales.reduce((s, v) => s + (v.totalPrice || 0), 0);
    const avgRating      = packages.filter(p => p.rating).length > 0
        ? (packages.reduce((s, p) => s + (p.rating || 0), 0) / packages.filter(p => p.rating).length)
        : null;
    const avgQuality     = packages.length > 0
        ? Math.round(packages.reduce((s, p) => s + (p.qualityScore || 0), 0) / packages.length)
        : 0;
    const pending = packages.filter(p => p.status === "PENDING_REVIEW").length;
    const recent  = [...packages]
        .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime())
        .slice(0, 4);

    const statCards = [
        {
            icon: Ic.bag, label: "Roteiros Ativos",
            value: loading ? "—" : String(activePackages.length),
            sub:   loading ? "" : `${packages.length} no total`,
            color: "#28C9BF", iconColor: "#28C9BF", iconBg: "rgba(40,201,191,0.1)",
        },
        {
            icon: Ic.sales, label: "Vendas Totais",
            value: loading ? "—" : String(sales.length),
            sub:   loading ? "" : formatCurrency(totalRevenue) + " em receita",
            color: "#6366F1", iconColor: "#6366F1", iconBg: "rgba(99,102,241,0.08)",
        },
        {
            icon: Ic.star, label: "Avaliação Média",
            value: loading ? "—" : avgRating != null ? avgRating.toFixed(1) : "—",
            sub:   "de 5.0",
            color: "#F59E0B", iconColor: "#F59E0B", iconBg: "rgba(245,158,11,0.08)",
        },
        {
            icon: Ic.check, label: "Qualidade Média",
            value: loading ? "—" : `${avgQuality}%`,
            sub:   "Quality Score",
            color: "#10B981", iconColor: "#10B981", iconBg: "rgba(16,185,129,0.08)",
        },
    ];

    return (
        <div style={{ paddingBottom: 48 }}>

            {/* ═══ HERO ═══ */}
            <div style={{
                background: "linear-gradient(135deg, #1A3263 0%, #0D2045 55%, #122D58 100%)",
                borderRadius: 24, padding: "40px 44px", marginBottom: 28,
                position: "relative", overflow: "hidden",
            }}>
                {/* Aurora glow */}
                <div style={{
                    position: "absolute", inset: 0, pointerEvents: "none",
                    background: [
                        "radial-gradient(ellipse 65% 90% at 85% 15%, rgba(40,201,191,0.2) 0%, transparent 60%)",
                        "radial-gradient(ellipse 45% 55% at 5% 85%, rgba(40,201,191,0.12) 0%, transparent 55%)",
                        "radial-gradient(ellipse 30% 40% at 50% 50%, rgba(99,102,241,0.06) 0%, transparent 60%)",
                    ].join(", "),
                }} />

                <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 24 }}>
                    <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(40,201,191,0.85)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 10 }}>
                            {getGreeting()},
                        </div>
                        <h1 style={{ fontSize: 40, fontWeight: 800, color: "#fff", letterSpacing: "-1.2px", margin: "0 0 10px", lineHeight: 1.05 }}>
                            {loading ? "..." : firstName}
                        </h1>
                        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.55)", fontWeight: 500, margin: "0 0 28px", maxWidth: 420, lineHeight: 1.6 }}>
                            Gerencie seus roteiros, acompanhe vendas e expanda seu alcance como criador de viagens.
                        </p>
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                            <Link href="/dashboard/roteiro/novo" style={{
                                display: "inline-flex", alignItems: "center", gap: 7,
                                padding: "11px 22px", borderRadius: 12,
                                background: "linear-gradient(135deg, #28C9BF, #1FA89F)",
                                color: "#fff", fontWeight: 700, fontSize: 14, textDecoration: "none",
                                boxShadow: "0 4px 16px rgba(40,201,191,0.4)",
                            }}>
                                {Ic.plus} Novo Roteiro
                            </Link>
                            <Link href="/dashboard/roteiros" style={{
                                display: "inline-flex", alignItems: "center", gap: 7,
                                padding: "11px 22px", borderRadius: 12,
                                background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)",
                                color: "rgba(255,255,255,0.85)", fontWeight: 600, fontSize: 14, textDecoration: "none",
                                backdropFilter: "blur(8px)",
                            }}>
                                Ver Roteiros {Ic.arrow}
                            </Link>
                        </div>
                    </div>

                    {/* Status pills */}
                    {!loading && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10, flexShrink: 0 }}>
                            {pending > 0 && (
                                <div style={{
                                    display: "flex", alignItems: "center", gap: 10,
                                    padding: "12px 18px", borderRadius: 14,
                                    background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.25)",
                                    backdropFilter: "blur(8px)",
                                }}>
                                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#F59E0B" }} />
                                    <span style={{ fontSize: 13, fontWeight: 700, color: "#FDE68A" }}>
                                        {pending} em análise
                                    </span>
                                </div>
                            )}
                            {activePackages.length > 0 && (
                                <div style={{
                                    display: "flex", alignItems: "center", gap: 10,
                                    padding: "12px 18px", borderRadius: 14,
                                    background: "rgba(40,201,191,0.12)", border: "1px solid rgba(40,201,191,0.2)",
                                    backdropFilter: "blur(8px)",
                                }}>
                                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#28C9BF" }} />
                                    <span style={{ fontSize: 13, fontWeight: 700, color: "#6EE7E7" }}>
                                        {activePackages.length} ativo{activePackages.length > 1 ? "s" : ""}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ═══ STAT CARDS ═══ */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
                {statCards.map((s) => (
                    <div key={s.label}
                        style={{
                            background: "#fff", borderRadius: 20, padding: "22px 22px 18px",
                            border: "1px solid rgba(226,232,240,0.7)",
                            boxShadow: "0 1px 4px rgba(26,50,99,0.05)",
                            transition: "transform 0.2s, box-shadow 0.2s",
                            cursor: "default",
                        }}
                        onMouseEnter={e => hoverCard(e, true)}
                        onMouseLeave={e => hoverCard(e, false)}
                    >
                        <div style={{
                            width: 42, height: 42, borderRadius: 13,
                            background: s.iconBg, color: s.iconColor,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            marginBottom: 14,
                        }}>
                            {s.icon}
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.7px", textTransform: "uppercase", marginBottom: 5 }}>
                            {s.label}
                        </div>
                        <div style={{ fontSize: 32, fontWeight: 800, color: s.color, letterSpacing: "-1.2px", lineHeight: 1, marginBottom: 5 }}>
                            {s.value}
                        </div>
                        <div style={{ fontSize: 12, color: "#94A3B8", fontWeight: 500 }}>
                            {s.sub}
                        </div>
                    </div>
                ))}
            </div>

            {/* ═══ BOTTOM: TABELA + AÇÕES ═══ */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20 }}>

                {/* Tabela de roteiros */}
                <div style={{
                    background: "#fff", borderRadius: 20,
                    border: "1px solid rgba(226,232,240,0.7)",
                    boxShadow: "0 1px 4px rgba(26,50,99,0.05)",
                    overflow: "hidden",
                }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid rgba(226,232,240,0.5)" }}>
                        <h3 style={{ fontSize: 15, fontWeight: 800, color: "#1A3263", margin: 0 }}>Seus Roteiros</h3>
                        <Link href="/dashboard/roteiro/novo" style={{
                            display: "inline-flex", alignItems: "center", gap: 6,
                            padding: "8px 16px", borderRadius: 10,
                            background: "linear-gradient(135deg, #28C9BF, #1FA89F)",
                            color: "#fff", fontWeight: 700, fontSize: 13, textDecoration: "none",
                            boxShadow: "0 2px 8px rgba(40,201,191,0.3)",
                        }}>
                            {Ic.plus} Novo
                        </Link>
                    </div>

                    {/* Cabeçalho da tabela */}
                    <div style={{
                        display: "grid", gridTemplateColumns: "2fr 1fr 1fr 80px 48px",
                        padding: "10px 24px", background: "#F8FAFC",
                        borderBottom: "1px solid rgba(226,232,240,0.5)",
                    }}>
                        {["Roteiro", "Status", "Preço", "Score", ""].map(h => (
                            <div key={h} style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.5px", textTransform: "uppercase" }}>{h}</div>
                        ))}
                    </div>

                    {loading ? (
                        <div style={{ padding: "24px" }}>
                            {[1,2,3].map(i => (
                                <div key={i} style={{ height: 56, borderRadius: 10, background: "#F1F5F9", marginBottom: 10 }} />
                            ))}
                        </div>
                    ) : packages.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "48px 24px" }}>
                            <div style={{ fontSize: 13, color: "#94A3B8", marginBottom: 14, lineHeight: 1.6 }}>
                                Nenhum roteiro ainda.<br />Crie seu primeiro itinerário.
                            </div>
                            <Link href="/dashboard/roteiro/novo" style={{
                                display: "inline-flex", alignItems: "center", gap: 6,
                                padding: "10px 20px", borderRadius: 10,
                                background: "linear-gradient(135deg, #28C9BF, #1FA89F)",
                                color: "#fff", fontWeight: 700, fontSize: 13, textDecoration: "none",
                            }}>
                                {Ic.plus} Criar roteiro
                            </Link>
                        </div>
                    ) : (
                        recent.map((pkg, idx) => {
                            const meta = STATUS_META[pkg.status] ?? { label: pkg.status, color: "#64748B", bg: "rgba(100,116,139,0.1)" };
                            const price = pkg.priceMin ?? pkg.price?.min;
                            const quality = pkg.qualityScore || 0;
                            return (
                                <div key={pkg.id} style={{
                                    display: "grid", gridTemplateColumns: "2fr 1fr 1fr 80px 48px",
                                    padding: "14px 24px", alignItems: "center",
                                    borderBottom: idx < recent.length - 1 ? "1px solid rgba(226,232,240,0.4)" : "none",
                                    transition: "background 0.15s",
                                }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "rgba(40,201,191,0.02)"; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
                                >
                                    <div>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: "#1A3263", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {pkg.title}
                                        </div>
                                        <div style={{ fontSize: 12, color: "#94A3B8" }}>{pkg.destination}, {pkg.country}</div>
                                    </div>
                                    <div>
                                        <span style={{
                                            padding: "3px 10px", borderRadius: 20,
                                            fontSize: 11, fontWeight: 700,
                                            color: meta.color, background: meta.bg,
                                        }}>
                                            {meta.label}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: "#1A3263" }}>
                                        {price != null ? formatCurrency(price) : "—"}
                                    </div>
                                    <div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                            <div style={{
                                                flex: 1, height: 4, borderRadius: 4,
                                                background: "rgba(226,232,240,0.8)",
                                                overflow: "hidden",
                                            }}>
                                                <div style={{
                                                    width: `${quality}%`, height: "100%", borderRadius: 4,
                                                    background: quality >= 80 ? "#10B981" : quality >= 50 ? "#F59E0B" : "#EF4444",
                                                    transition: "width 0.6s ease",
                                                }} />
                                            </div>
                                            <span style={{ fontSize: 12, fontWeight: 700, color: quality >= 80 ? "#10B981" : quality >= 50 ? "#F59E0B" : "#EF4444", flexShrink: 0 }}>
                                                {quality}%
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "center" }}>
                                        <Link href={`/dashboard/roteiro/${pkg.id}`} style={{
                                            width: 32, height: 32, borderRadius: 8,
                                            background: "rgba(26,50,99,0.06)", border: "1px solid rgba(226,232,240,0.7)",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            color: "#1A3263", textDecoration: "none",
                                            transition: "background 0.15s, border-color 0.15s",
                                        }}
                                            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(40,201,191,0.1)"; (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(40,201,191,0.3)"; (e.currentTarget as HTMLAnchorElement).style.color = "#28C9BF"; }}
                                            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(26,50,99,0.06)"; (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(226,232,240,0.7)"; (e.currentTarget as HTMLAnchorElement).style.color = "#1A3263"; }}
                                        >
                                            {Ic.edit}
                                        </Link>
                                    </div>
                                </div>
                            );
                        })
                    )}

                    {packages.length > 4 && (
                        <div style={{ padding: "14px 24px", borderTop: "1px solid rgba(226,232,240,0.5)", textAlign: "center" }}>
                            <Link href="/dashboard/roteiros" style={{
                                fontSize: 13, fontWeight: 600, color: "#28C9BF", textDecoration: "none",
                                display: "inline-flex", alignItems: "center", gap: 5,
                            }}>
                                Ver todos os roteiros {Ic.arrow}
                            </Link>
                        </div>
                    )}
                </div>

                {/* Ações Rápidas + Tip */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 800, color: "#1A3263", margin: "0 0 2px" }}>Ações Rápidas</h3>

                    <Link href="/dashboard/roteiro/novo" style={{
                        display: "flex", alignItems: "center", gap: 14, padding: "16px 18px",
                        borderRadius: 16, textDecoration: "none", cursor: "pointer",
                        background: "linear-gradient(135deg, #28C9BF, #1FA89F)",
                        boxShadow: "0 4px 14px rgba(40,201,191,0.3)",
                        transition: "transform 0.18s, box-shadow 0.18s",
                    }}
                        onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 8px 24px rgba(40,201,191,0.4)"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 4px 14px rgba(40,201,191,0.3)"; }}
                    >
                        <div style={{ width: 38, height: 38, borderRadius: 11, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0 }}>{Ic.plus}</div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>Criar Roteiro</div>
                            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 2 }}>Novo itinerário</div>
                        </div>
                        <div style={{ color: "rgba(255,255,255,0.65)" }}>{Ic.arrow}</div>
                    </Link>

                    <Link href="/dashboard/roteiros" style={{
                        display: "flex", alignItems: "center", gap: 14, padding: "16px 18px",
                        borderRadius: 16, textDecoration: "none", cursor: "pointer",
                        background: "#fff", border: "1px solid rgba(226,232,240,0.7)",
                        boxShadow: "0 1px 4px rgba(26,50,99,0.05)",
                        transition: "transform 0.18s, box-shadow 0.18s, border-color 0.18s",
                    }}
                        onMouseEnter={e => hoverAction(e, true)}
                        onMouseLeave={e => hoverAction(e, false)}
                    >
                        <div style={{ width: 38, height: 38, borderRadius: 11, background: "rgba(26,50,99,0.07)", display: "flex", alignItems: "center", justifyContent: "center", color: "#1A3263", flexShrink: 0 }}>{Ic.map}</div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 800, color: "#1A3263" }}>Meus Roteiros</div>
                            <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>Gerenciar tudo</div>
                        </div>
                        <div style={{ color: "#CBD5E1" }}>{Ic.arrow}</div>
                    </Link>

                    <Link href="/dashboard/vendas" style={{
                        display: "flex", alignItems: "center", gap: 14, padding: "16px 18px",
                        borderRadius: 16, textDecoration: "none", cursor: "pointer",
                        background: "#fff", border: "1px solid rgba(226,232,240,0.7)",
                        boxShadow: "0 1px 4px rgba(26,50,99,0.05)",
                        transition: "transform 0.18s, box-shadow 0.18s, border-color 0.18s",
                    }}
                        onMouseEnter={e => hoverAction(e, true, "rgba(99,102,241,0.3)")}
                        onMouseLeave={e => hoverAction(e, false)}
                    >
                        <div style={{ width: 38, height: 38, borderRadius: 11, background: "rgba(99,102,241,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "#6366F1", flexShrink: 0 }}>{Ic.sales}</div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 800, color: "#1A3263" }}>Minhas Vendas</div>
                            <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>Histórico financeiro</div>
                        </div>
                        <div style={{ color: "#CBD5E1" }}>{Ic.arrow}</div>
                    </Link>

                    <Link href="/dashboard/comentarios" style={{
                        display: "flex", alignItems: "center", gap: 14, padding: "16px 18px",
                        borderRadius: 16, textDecoration: "none", cursor: "pointer",
                        background: "#fff", border: "1px solid rgba(226,232,240,0.7)",
                        boxShadow: "0 1px 4px rgba(26,50,99,0.05)",
                        transition: "transform 0.18s, box-shadow 0.18s, border-color 0.18s",
                    }}
                        onMouseEnter={e => hoverAction(e, true, "rgba(245,158,11,0.3)")}
                        onMouseLeave={e => hoverAction(e, false)}
                    >
                        <div style={{ width: 38, height: 38, borderRadius: 11, background: "rgba(245,158,11,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "#F59E0B", flexShrink: 0 }}>{Ic.comment}</div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 800, color: "#1A3263" }}>Comentários</div>
                            <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>Avaliações dos viajantes</div>
                        </div>
                        <div style={{ color: "#CBD5E1" }}>{Ic.arrow}</div>
                    </Link>

                    {/* Dica Pro */}
                    <div style={{
                        padding: "16px 18px", borderRadius: 16, marginTop: 2,
                        background: "linear-gradient(135deg, rgba(26,50,99,0.03), rgba(40,201,191,0.05))",
                        border: "1px solid rgba(40,201,191,0.14)",
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
                            <span style={{ color: "#28C9BF" }}>{Ic.lightning}</span>
                            <span style={{ fontSize: 11, fontWeight: 800, color: "#1A3263", textTransform: "uppercase", letterSpacing: "0.6px" }}>Dica Pro</span>
                        </div>
                        <p style={{ fontSize: 13, color: "#5A6B8C", lineHeight: 1.55, margin: 0 }}>
                            Roteiros com score acima de <strong style={{ color: "#1A3263" }}>80%</strong> têm aprovação 3× mais rápida e mais destaque no app.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

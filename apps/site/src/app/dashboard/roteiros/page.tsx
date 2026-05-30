"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { getDashboardStats, deleteItinerary, type DashboardItinerary } from "../../../lib/api";
import { getTravelerSession } from "../../../lib/auth";

/* ── Status config (SVG only, no emojis) ── */
const STATUS_META: Record<string, { label: string; color: string; bg: string; dot: string }> = {
    ACTIVE:         { label: "Publicado",  color: "#28C9BF", bg: "rgba(40,201,191,0.1)",   dot: "#28C9BF" },
    active:         { label: "Publicado",  color: "#28C9BF", bg: "rgba(40,201,191,0.1)",   dot: "#28C9BF" },
    APPROVED:       { label: "Aprovado",   color: "#16A34A", bg: "rgba(34,197,94,0.1)",    dot: "#16A34A" },
    approved:       { label: "Aprovado",   color: "#16A34A", bg: "rgba(34,197,94,0.1)",    dot: "#16A34A" },
    PENDING_REVIEW: { label: "Em análise", color: "#D97706", bg: "rgba(245,158,11,0.1)",   dot: "#F59E0B" },
    pending_review: { label: "Em análise", color: "#D97706", bg: "rgba(245,158,11,0.1)",   dot: "#F59E0B" },
    pending:        { label: "Em análise", color: "#D97706", bg: "rgba(245,158,11,0.1)",   dot: "#F59E0B" },
    DRAFT:          { label: "Rascunho",   color: "#64748B", bg: "rgba(100,116,139,0.1)", dot: "#94A3B8" },
    draft:          { label: "Rascunho",   color: "#64748B", bg: "rgba(100,116,139,0.1)", dot: "#94A3B8" },
    PAUSED:         { label: "Pausado",    color: "#F59E0B", bg: "rgba(245,158,11,0.08)",  dot: "#F59E0B" },
    paused:         { label: "Pausado",    color: "#F59E0B", bg: "rgba(245,158,11,0.08)",  dot: "#F59E0B" },
    REJECTED:       { label: "Rejeitado",  color: "#DC2626", bg: "rgba(239,68,68,0.1)",    dot: "#EF4444" },
    rejected:       { label: "Rejeitado",  color: "#DC2626", bg: "rgba(239,68,68,0.1)",    dot: "#EF4444" },
};

const STATUS_PRIORITY: Record<string, number> = {
    PENDING_REVIEW: 0, pending_review: 0, pending: 0,
    DRAFT: 1, draft: 1,
    ACTIVE: 2, active: 2,
    APPROVED: 3, approved: 3,
    PAUSED: 4, paused: 4,
    REJECTED: 5, rejected: 5,
    ARCHIVED: 6, archived: 6,
};

const FILTER_OPTIONS = [
    { key: "ALL",           label: "Todos"       },
    { key: "ACTIVE",        label: "Publicados"  },
    { key: "PENDING_REVIEW",label: "Em análise"  },
    { key: "DRAFT",         label: "Rascunhos"   },
    { key: "REJECTED",      label: "Rejeitados"  },
    { key: "PAUSED",        label: "Pausados"    },
];

/* ── SVG Icons ── */
const Ic = {
    map:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z M8 2v16 M16 6v16"/></svg>,
    plus:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    edit:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
    eye:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
    book:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>,
    trash:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
    pin:    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>,
    clock:  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    star:   <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    bag:    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z M3 6h18 M16 10a4 4 0 01-8 0"/></svg>,
    alert:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    dollar: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
};

function formatCurrency(v: number) {
    if (v >= 1000) return `A$ ${(v / 1000).toFixed(1).replace(".", ",")}k`;
    return `A$ ${v.toLocaleString("pt-BR")}`;
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function matchesFilter(status: string, filter: string): boolean {
    if (filter === "ALL") return true;
    if (filter === "ACTIVE")         return ["ACTIVE","active","APPROVED","approved"].includes(status);
    if (filter === "PENDING_REVIEW") return ["PENDING_REVIEW","pending_review","pending"].includes(status);
    if (filter === "DRAFT")          return ["DRAFT","draft"].includes(status);
    if (filter === "REJECTED")       return ["REJECTED","rejected"].includes(status);
    if (filter === "PAUSED")         return ["PAUSED","paused"].includes(status);
    return status === filter;
}

function countByFilter(items: DashboardItinerary[], filter: string) {
    if (filter === "ALL") return items.length;
    return items.filter(i => matchesFilter(i.status, filter)).length;
}

export default function RoteirosPage() {
    const [itineraries, setItineraries] = useState<DashboardItinerary[]>([]);
    const [loading, setLoading]         = useState(true);
    const [error, setError]             = useState<string | null>(null);
    const [filter, setFilter]           = useState("ALL");
    const [archiving, setArchiving]     = useState<string | null>(null);

    const loadData = () => {
        setLoading(true);
        setError(null);
        const traveler = getTravelerSession();
        const creatorId = traveler?.creatorId ?? undefined;
        getDashboardStats(creatorId)
            .then(s => {
                const sorted = [...(s.itineraries || [])].sort((a, b) => {
                    const pa = STATUS_PRIORITY[a.status] ?? 99;
                    const pb = STATUS_PRIORITY[b.status] ?? 99;
                    if (pa !== pb) return pa - pb;
                    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
                });
                setItineraries(sorted);
            })
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    };

    useEffect(() => { loadData(); }, []);

    const handleArchive = async (id: string, title: string) => {
        if (!confirm(`Arquivar "${title}"?`)) return;
        setArchiving(id);
        try {
            await deleteItinerary(id);
            loadData();
        } catch (e: any) {
            alert(`Erro ao arquivar: ${e.message}`);
        } finally {
            setArchiving(null);
        }
    };

    const visible = itineraries.filter(i => matchesFilter(i.status, filter));
    const totalSales   = itineraries.reduce((s, i) => s + (i.sales || 0), 0);
    const totalRevenue = itineraries.reduce((s, i) => s + (i.revenue || 0), 0);

    return (
        <div style={{ paddingBottom: 48 }}>

            {/* ═══ HEADER ═══ */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1A3263", letterSpacing: "-0.8px", margin: 0 }}>
                            Meus Roteiros
                        </h1>
                        {!loading && (
                            <span style={{
                                padding: "3px 10px", borderRadius: 20,
                                background: "rgba(40,201,191,0.1)", color: "#1FA89F",
                                fontSize: 13, fontWeight: 700,
                            }}>
                                {itineraries.length}
                            </span>
                        )}
                    </div>
                    <p style={{ fontSize: 14, color: "#64748B", fontWeight: 500, margin: 0 }}>
                        Gerencie e acompanhe todos os seus itinerários
                    </p>
                </div>
                <Link href="/dashboard/roteiro/novo" style={{
                    display: "inline-flex", alignItems: "center", gap: 7,
                    padding: "11px 22px", borderRadius: 12,
                    background: "linear-gradient(135deg, #28C9BF, #1FA89F)",
                    color: "#fff", fontWeight: 700, fontSize: 14, textDecoration: "none",
                    boxShadow: "0 4px 14px rgba(40,201,191,0.35)",
                    flexShrink: 0,
                }}>
                    {Ic.plus} Novo Roteiro
                </Link>
            </div>

            {/* ═══ MINI STATS ═══ */}
            {!loading && itineraries.length > 0 && (
                <div style={{
                    display: "flex", gap: 24, marginBottom: 20,
                    padding: "14px 20px", borderRadius: 14,
                    background: "#fff", border: "1px solid rgba(226,232,240,0.7)",
                    boxShadow: "0 1px 4px rgba(26,50,99,0.04)",
                }}>
                    {[
                        { icon: Ic.map,    label: "Publicados",   value: String(itineraries.filter(i => ["ACTIVE","active","APPROVED","approved"].includes(i.status)).length), color: "#28C9BF" },
                        { icon: Ic.bag,    label: "Vendas",        value: totalSales.toLocaleString("pt-BR"),  color: "#6366F1" },
                        { icon: Ic.dollar, label: "Receita",       value: formatCurrency(totalRevenue),        color: "#10B981" },
                    ].map((s, i) => (
                        <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 10, paddingRight: 24, borderRight: i < 2 ? "1px solid rgba(226,232,240,0.6)" : "none" }}>
                            <div style={{ color: s.color }}>{s.icon}</div>
                            <div>
                                <div style={{ fontSize: 16, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                                <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, marginTop: 2 }}>{s.label}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ═══ FILTER PILLS ═══ */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
                {FILTER_OPTIONS.map(f => {
                    const count = loading ? 0 : countByFilter(itineraries, f.key);
                    const active = filter === f.key;
                    return (
                        <button key={f.key} onClick={() => setFilter(f.key)} style={{
                            display: "inline-flex", alignItems: "center", gap: 6,
                            padding: "7px 14px", borderRadius: 10, fontSize: 13, fontWeight: 700,
                            cursor: "pointer", transition: "all 0.15s",
                            border: active ? "2px solid #28C9BF" : "1.5px solid rgba(226,232,240,0.8)",
                            background: active ? "rgba(40,201,191,0.08)" : "#fff",
                            color: active ? "#1FA89F" : "#64748B",
                            boxShadow: active ? "0 2px 8px rgba(40,201,191,0.15)" : "none",
                        }}>
                            {f.label}
                            <span style={{
                                fontSize: 11, fontWeight: 700,
                                color: active ? "#28C9BF" : "#94A3B8",
                            }}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* ═══ LIST ═══ */}
            {loading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {[1,2,3].map(i => (
                        <div key={i} style={{
                            height: 88, borderRadius: 16, border: "1px solid rgba(226,232,240,0.6)",
                            background: "linear-gradient(90deg, #F8FAFC 0%, #F1F5F9 50%, #F8FAFC 100%)",
                        }} />
                    ))}
                </div>
            ) : error ? (
                <div style={{
                    background: "#fff", borderRadius: 16, padding: "32px 24px",
                    border: "1px solid rgba(239,68,68,0.2)", textAlign: "center",
                }}>
                    <div style={{ color: "#DC2626", marginBottom: 8 }}>{Ic.alert}</div>
                    <div style={{ fontSize: 14, color: "#DC2626", fontWeight: 600 }}>Erro ao carregar roteiros</div>
                    <div style={{ fontSize: 13, color: "#94A3B8", marginTop: 4 }}>{error}</div>
                    <button onClick={loadData} style={{
                        marginTop: 16, padding: "9px 18px", borderRadius: 10,
                        background: "linear-gradient(135deg, #28C9BF, #1FA89F)",
                        color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer",
                    }}>
                        Tentar novamente
                    </button>
                </div>
            ) : visible.length === 0 ? (
                <div style={{
                    background: "#fff", borderRadius: 20, padding: "56px 32px",
                    border: "1px solid rgba(226,232,240,0.7)",
                    boxShadow: "0 1px 4px rgba(26,50,99,0.05)",
                    textAlign: "center",
                }}>
                    <div style={{
                        width: 56, height: 56, borderRadius: 16, margin: "0 auto 16px",
                        background: "rgba(40,201,191,0.08)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#28C9BF",
                    }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z M8 2v16 M16 6v16"/></svg>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#1A3263", marginBottom: 6 }}>
                        {filter === "ALL" ? "Nenhum roteiro ainda" : `Nenhum roteiro ${FILTER_OPTIONS.find(f=>f.key===filter)?.label?.toLowerCase()}`}
                    </div>
                    <div style={{ fontSize: 14, color: "#94A3B8", marginBottom: 24, lineHeight: 1.6 }}>
                        {filter === "ALL"
                            ? "Crie seu primeiro roteiro e comece a vender experiências de viagem."
                            : "Tente outro filtro ou crie um novo roteiro."}
                    </div>
                    <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                        <Link href="/dashboard/roteiro/novo" style={{
                            display: "inline-flex", alignItems: "center", gap: 7,
                            padding: "11px 22px", borderRadius: 12,
                            background: "linear-gradient(135deg, #28C9BF, #1FA89F)",
                            color: "#fff", fontWeight: 700, fontSize: 14, textDecoration: "none",
                        }}>
                            {Ic.plus} Criar Roteiro
                        </Link>
                        {filter !== "ALL" && (
                            <button onClick={() => setFilter("ALL")} style={{
                                padding: "11px 22px", borderRadius: 12,
                                border: "1.5px solid rgba(226,232,240,0.8)", background: "#fff",
                                color: "#64748B", fontWeight: 600, fontSize: 14, cursor: "pointer",
                            }}>
                                Ver todos
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {visible.map((it) => {
                        const meta = STATUS_META[it.status] ?? { label: it.status, color: "#64748B", bg: "rgba(100,116,139,0.1)", dot: "#94A3B8" };
                        const isArchiving = archiving === it.id;
                        return (
                            <div key={it.id} style={{
                                background: "#fff", borderRadius: 16,
                                border: "1px solid rgba(226,232,240,0.7)",
                                boxShadow: "0 1px 4px rgba(26,50,99,0.04)",
                                padding: "16px 20px",
                                display: "flex", alignItems: "center", gap: 16,
                                transition: "border-color 0.15s, box-shadow 0.15s, transform 0.15s",
                                opacity: isArchiving ? 0.5 : 1,
                            }}
                                onMouseEnter={e => {
                                    const el = e.currentTarget as HTMLDivElement;
                                    el.style.borderColor = "rgba(40,201,191,0.3)";
                                    el.style.boxShadow = "0 4px 16px rgba(26,50,99,0.08)";
                                    el.style.transform = "translateY(-1px)";
                                }}
                                onMouseLeave={e => {
                                    const el = e.currentTarget as HTMLDivElement;
                                    el.style.borderColor = "rgba(226,232,240,0.7)";
                                    el.style.boxShadow = "0 1px 4px rgba(26,50,99,0.04)";
                                    el.style.transform = "translateY(0)";
                                }}
                            >
                                {/* Icon */}
                                <div style={{
                                    width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                                    background: "linear-gradient(135deg, rgba(40,201,191,0.1), rgba(26,50,99,0.06))",
                                    display: "flex", alignItems: "center", justifyContent: "center", color: "#28C9BF",
                                }}>
                                    {Ic.map}
                                </div>

                                {/* Title + meta */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 15, fontWeight: 700, color: "#1A3263", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {it.title}
                                        <span style={{ fontSize: 13, fontWeight: 500, color: "#94A3B8", marginLeft: 6 }}>· {it.duration}d</span>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                                        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#94A3B8" }}>
                                            <span style={{ color: "#CBD5E1" }}>{Ic.pin}</span>
                                            {it.destination}, {it.country}
                                        </span>
                                        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#94A3B8" }}>
                                            <span style={{ color: "#CBD5E1" }}>{Ic.clock}</span>
                                            {formatDate(it.updatedAt)}
                                        </span>
                                    </div>
                                </div>

                                {/* Status badge */}
                                <div style={{ flexShrink: 0 }}>
                                    <span style={{
                                        display: "inline-flex", alignItems: "center", gap: 6,
                                        padding: "5px 12px", borderRadius: 20,
                                        fontSize: 12, fontWeight: 700,
                                        color: meta.color, background: meta.bg,
                                    }}>
                                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: meta.dot, flexShrink: 0 }} />
                                        {meta.label}
                                    </span>
                                    {it.status === "REJECTED" && (it as any).approvalNote && (
                                        <div style={{ fontSize: 11, color: "#DC2626", marginTop: 4, maxWidth: 160, lineHeight: 1.4, display: "flex", alignItems: "flex-start", gap: 4 }}>
                                            <span style={{ flexShrink: 0, marginTop: 1 }}>{Ic.alert}</span>
                                            {(it as any).approvalNote}
                                        </div>
                                    )}
                                </div>

                                {/* Metrics */}
                                <div style={{ display: "flex", gap: 20, flexShrink: 0 }}>
                                    <div style={{ textAlign: "center" }}>
                                        <div style={{ fontSize: 15, fontWeight: 800, color: "#1A3263", lineHeight: 1 }}>
                                            {it.sales > 0 ? it.sales.toLocaleString("pt-BR") : "—"}
                                        </div>
                                        <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, marginTop: 3 }}>Vendas</div>
                                    </div>
                                    <div style={{ textAlign: "center" }}>
                                        <div style={{ fontSize: 15, fontWeight: 800, color: it.revenue > 0 ? "#10B981" : "#1A3263", lineHeight: 1 }}>
                                            {it.revenue > 0 ? formatCurrency(it.revenue) : "—"}
                                        </div>
                                        <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, marginTop: 3 }}>Receita</div>
                                    </div>
                                    <div style={{ textAlign: "center" }}>
                                        <div style={{ fontSize: 15, fontWeight: 800, lineHeight: 1, display: "flex", alignItems: "center", gap: 4, justifyContent: "center", color: it.rating ? "#F59E0B" : "#1A3263" }}>
                                            {it.rating ? (
                                                <><span style={{ color: "#F59E0B" }}>{Ic.star}</span>{it.rating}</>
                                            ) : "—"}
                                        </div>
                                        <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, marginTop: 3 }}>
                                            {it.reviewCount > 0 ? `${it.reviewCount} av.` : "Nota"}
                                        </div>
                                    </div>
                                </div>

                                {/* Divider */}
                                <div style={{ width: 1, height: 40, background: "rgba(226,232,240,0.6)", flexShrink: 0 }} />

                                {/* Actions */}
                                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                                    {[
                                        { href: `/dashboard/roteiro/${it.id}`, icon: Ic.edit,  title: "Editar",          color: "#1A3263", hover: "rgba(40,201,191,0.1)"  },
                                        { href: `http://localhost:8081/itinerary/${it.id}`,          icon: Ic.eye,   title: "Ver público",     color: "#6366F1", hover: "rgba(99,102,241,0.1)", external: true },
                                        { href: `http://localhost:8081/purchased-itinerary/${it.id}`, icon: Ic.book, title: "Ver como comprador", color: "#28C9BF", hover: "rgba(40,201,191,0.1)", external: true },
                                    ].map(({ href, icon, title, color, hover, external }) => (
                                        <a key={title} href={href} title={title}
                                            target={external ? "_blank" : undefined}
                                            rel={external ? "noopener noreferrer" : undefined}
                                            style={{
                                                width: 32, height: 32, borderRadius: 8,
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                background: "rgba(241,245,249,0.8)", border: "1px solid rgba(226,232,240,0.7)",
                                                color, textDecoration: "none", cursor: "pointer",
                                                transition: "background 0.15s, border-color 0.15s",
                                                flexShrink: 0,
                                            }}
                                            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = hover; (e.currentTarget as HTMLAnchorElement).style.borderColor = color + "44"; }}
                                            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(241,245,249,0.8)"; (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(226,232,240,0.7)"; }}
                                        >
                                            {icon}
                                        </a>
                                    ))}
                                    <button title="Arquivar" onClick={() => handleArchive(it.id, it.title)}
                                        disabled={isArchiving}
                                        style={{
                                            width: 32, height: 32, borderRadius: 8,
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            background: "rgba(241,245,249,0.8)", border: "1px solid rgba(226,232,240,0.7)",
                                            color: "#DC2626", cursor: isArchiving ? "not-allowed" : "pointer",
                                            transition: "background 0.15s, border-color 0.15s", flexShrink: 0,
                                        }}
                                        onMouseEnter={e => { if (!isArchiving) { (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.08)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(239,68,68,0.3)"; }}}
                                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(241,245,249,0.8)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(226,232,240,0.7)"; }}
                                    >
                                        {Ic.trash}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

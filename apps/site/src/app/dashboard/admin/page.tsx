"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333/api";

/* ═══════════════════════════════════════════════════
   SVG ICON COMPONENTS (Lucide-style, 24×24)
   ═══════════════════════════════════════════════════ */
const I = ({ d, size = 18, color = "currentColor" }: { d: string; size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);
const Icon = {
    shield: (p?: any) => <I d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" {...p} />,
    home: (p?: any) => <I d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10" {...p} />,
    package: (p?: any) => <I d="M16.5 9.4l-9-5.19 M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z M3.27 6.96L12 12.01l8.73-5.05 M12 22.08V12" {...p} />,
    map: (p?: any) => <I d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z M8 2v16 M16 6v16" {...p} />,
    building: (p?: any) => <I d="M6 22V4a2 2 0 012-2h8a2 2 0 012 2v18z M6 12H4a2 2 0 00-2 2v6a2 2 0 002 2h2 M18 9h2a2 2 0 012 2v9a2 2 0 01-2 2h-2 M10 6h4 M10 10h4 M10 14h4 M10 18h4" {...p} />,
    compass: (p?: any) => (
        <svg width={p?.size || 18} height={p?.size || 18} viewBox="0 0 24 24" fill="none" stroke={p?.color || "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill={p?.color || "currentColor"} opacity="0.15" stroke={p?.color || "currentColor"} />
        </svg>
    ),
    users: (p?: any) => <I d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75" {...p} />,
    user: (p?: any) => <I d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 3a4 4 0 110 8 4 4 0 010-8z" {...p} />,
    wallet: (p?: any) => <I d="M21 12V7H5a2 2 0 010-4h14v4 M3 5v14a2 2 0 002 2h16v-5 M18 12a1 1 0 100 2 1 1 0 000-2z" {...p} />,
    clock: (p?: any) => (
        <svg width={p?.size || 18} height={p?.size || 18} viewBox="0 0 24 24" fill="none" stroke={p?.color || "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
        </svg>
    ),
    settings: (p?: any) => (
        <svg width={p?.size || 18} height={p?.size || 18} viewBox="0 0 24 24" fill="none" stroke={p?.color || "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
        </svg>
    ),
    logout: (p?: any) => <I d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9" {...p} />,
    check: (p?: any) => <I d="M20 6L9 17l-5-5" {...p} />,
    x: (p?: any) => <I d="M18 6L6 18 M6 6l12 12" {...p} />,
    checkCircle: (p?: any) => (
        <svg width={p?.size || 18} height={p?.size || 18} viewBox="0 0 24 24" fill="none" stroke={p?.color || "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" />
        </svg>
    ),
    hourglass: (p?: any) => <I d="M5 22h14 M5 2h14 M17 22v-4.172a2 2 0 00-.586-1.414L12 12l-4.414 4.414A2 2 0 007 17.828V22 M7 2v4.172a2 2 0 00.586 1.414L12 12l4.414-4.414A2 2 0 0017 6.172V2" {...p} />,
    alertTriangle: (p?: any) => <I d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z M12 9v4 M12 17h.01" {...p} />,
};

/* ═══════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════ */
type Status = "DRAFT" | "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "ACTIVE" | "PAUSED" | "ARCHIVED";
type Tab = "overview" | "packages" | "itineraries" | "agencies" | "creators" | "clients" | "financial" | "history";

interface PendingPackage {
    id: string; title: string; destination: string; country: string;
    priceMin?: number; priceMax?: number; qualityScore?: number;
    status: Status; approvalNote?: string; createdAt: string;
    agency?: { id: string; name: string; logo?: string };
    images?: { url: string }[];
}
interface PendingItinerary {
    id: string; title: string; destination: string; country: string;
    price?: number; qualityScore?: number;
    status: Status; approvalNote?: string; createdAt: string;
    creator?: { id: string; traveler?: { name: string; avatar?: string } };
    images?: { url: string }[];
}
interface Stats { pendingPackages: number; pendingItineraries: number; totalPending: number; approvedToday: number; rejectedTotal: number; }
interface PendingCreator { id: string; traveler: { name: string; email: string; avatar?: string }; bio: string; createdAt: string; }

const STATUS_LABEL: Record<Status, string> = {
    DRAFT: "Rascunho", PENDING_REVIEW: "Em Revisão", APPROVED: "Aprovado",
    REJECTED: "Rejeitado", ACTIVE: "Ativo", PAUSED: "Pausado", ARCHIVED: "Arquivado",
};
const STATUS_COLOR: Record<Status, string> = {
    DRAFT: "#64748B", PENDING_REVIEW: "#D97706", APPROVED: "#16A34A",
    REJECTED: "#DC2626", ACTIVE: "#16A34A", PAUSED: "#64748B", ARCHIVED: "#64748B",
};

/* ═══════════════════════════════════════════════════
   SIDEBAR CONFIG
   ═══════════════════════════════════════════════════ */
const SIDEBAR_SECTIONS = [
    {
        label: "MODERAÇÃO",
        items: [
            { key: "overview", label: "Visão Geral", icon: Icon.home },
            { key: "packages", label: "Pacotes", icon: Icon.package },
            { key: "itineraries", label: "Roteiros", icon: Icon.map },
        ],
    },
    {
        label: "GESTÃO",
        items: [
            { key: "agencies", label: "Agências", icon: Icon.building },
            { key: "creators", label: "Roteiristas", icon: Icon.compass },
            { key: "clients", label: "Clientes", icon: Icon.users },
        ],
    },
    {
        label: "SISTEMA",
        items: [
            { key: "financial", label: "Financeiro", icon: Icon.wallet },
            { key: "history", label: "Histórico", icon: Icon.clock },
        ],
    },
];

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════ */
export default function AdminDashboardPage() {
    const router = useRouter();
    const [tab, setTab] = useState<Tab>("overview");
    const [packages, setPackages] = useState<PendingPackage[]>([]);
    const [itineraries, setItineraries] = useState<PendingItinerary[]>([]);
    const [creators, setCreators] = useState<PendingCreator[]>([]);
    const [history, setHistory] = useState<{ packages: any[]; itineraries: any[] }>({ packages: [], itineraries: [] });
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [newAgency, setNewAgency] = useState({ name: "", cnpj: "", employeeName: "", email: "", password: "" });
    const [adminUser, setAdminUser] = useState<{ name: string; email: string; role: string } | null>(null);

    // Modal state
    const [modal, setModal] = useState<{ type: "approve" | "reject"; itemType: "packages" | "itineraries"; id: string; title: string } | null>(null);
    const [rejectNote, setRejectNote] = useState("");
    const [actionLoading, setActionLoading] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

    const getToken = () => localStorage.getItem("adminToken");

    const fetchData = useCallback(async () => {
        const token = getToken();
        if (!token) { router.push("/dashboard/admin/login"); return; }
        try {
            const headers = { Authorization: `Bearer ${token}` };
            const fetchOpts = { headers, cache: 'no-store' as RequestCache };
            const [pendingRes, statsRes] = await Promise.all([
                fetch(`${API}/admin/pending`, fetchOpts),
                fetch(`${API}/admin/stats`, fetchOpts),
            ]);
            if (pendingRes.status === 401) { localStorage.removeItem("adminToken"); router.push("/dashboard/admin/login"); return; }
            const pendingData = await pendingRes.json();
            const statsData = await statsRes.json();
            console.log('[dashboard/admin] /pending', pendingData);
            console.log('[dashboard/admin] /stats', statsData);
            setPackages(pendingData.packages || []);
            setItineraries(pendingData.itineraries || []);
            setStats(statsData);
            const creatorsRes = await fetch(`${API}/admin/creators/pending`, fetchOpts);
            const creatorsData = await creatorsRes.json();
            setCreators(creatorsData || []);
            const histRes = await fetch(`${API}/admin/all`, fetchOpts);
            const histData = await histRes.json();
            console.log('[dashboard/admin] /all', histData);
            setHistory(histData);
        } catch {
            showToast("Erro ao carregar dados", "error");
        } finally { setLoading(false); }
    }, [router]);

    useEffect(() => {
        const user = localStorage.getItem("adminUser");
        if (user) setAdminUser(JSON.parse(user));
        fetchData();
    }, [fetchData]);

    const showToast = (msg: string, type: "success" | "error") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

    const handleApprove = (itemType: "packages" | "itineraries", id: string, title: string) => { setModal({ type: "approve", itemType, id, title }); };
    const handleReject = (itemType: "packages" | "itineraries", id: string, title: string) => { setRejectNote(""); setModal({ type: "reject", itemType, id, title }); };

    const handleApproveCreator = async (id: string) => {
        const token = getToken();
        try {
            const res = await fetch(`${API}/admin/creators/${id}/approve`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) throw new Error("Erro ao aprovar");
            showToast("Roteirista aprovado com sucesso!", "success");
            fetchData();
        } catch { showToast("Erro ao aprovar roteirista", "error"); }
    };

    const handleCreateAgency = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = getToken();
        setActionLoading(true);
        try {
            const res = await fetch(`${API}/admin/agencies`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(newAgency),
            });
            if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Erro ao criar agência"); }
            showToast("Agência criada com sucesso!", "success");
            setNewAgency({ name: "", cnpj: "", employeeName: "", email: "", password: "" });
        } catch (e: any) { showToast(e.message, "error"); }
        finally { setActionLoading(false); }
    };

    const confirmAction = async () => {
        if (!modal) return;
        setActionLoading(true);
        try {
            const endpoint = modal.type === "approve"
                ? `${API}/admin/${modal.itemType}/${modal.id}/approve`
                : `${API}/admin/${modal.itemType}/${modal.id}/reject`;
            const res = await fetch(endpoint, {
                method: "POST",
                headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
                body: JSON.stringify(modal.type === "reject" ? { note: rejectNote } : {}),
            });
            if (!res.ok) throw new Error("Erro ao executar ação");
            showToast(modal.type === "approve" ? "Aprovado com sucesso!" : "Rejeitado com nota.", "success");
            setModal(null);
            fetchData();
        } catch (e: any) { showToast(e.message, "error"); }
        finally { setActionLoading(false); }
    };

    const logout = () => { localStorage.removeItem("adminToken"); localStorage.removeItem("adminUser"); router.push("/dashboard/admin/login"); };

    const getBadge = (key: string) => {
        if (!stats) return 0;
        if (key === "packages") return stats.pendingPackages;
        if (key === "itineraries") return stats.pendingItineraries;
        if (key === "creators") return creators.length;
        if (key === "overview") return stats.totalPending + creators.length;
        return 0;
    };

    if (loading) return (
        <div style={{ minHeight: "100vh", background: "#F0F4F8", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif" }}>
            <div style={{ fontSize: "16px", color: "#64748B" }}>Carregando…</div>
        </div>
    );

    return (
        <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>
            {/* ═══ TOAST ═══ */}
            {toast && (
                <div style={{
                    position: "fixed", top: "20px", right: "20px", zIndex: 9999,
                    padding: "14px 20px", borderRadius: "14px",
                    background: toast.type === "success" ? "rgba(22,163,74,0.95)" : "rgba(220,38,38,0.95)",
                    color: "#fff", fontWeight: "700", fontSize: "14px",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                }}>{toast.msg}</div>
            )}

            {/* ═══ MODAL ═══ */}
            {modal && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
                    <div style={{ background: "#fff", borderRadius: "24px", padding: "32px", width: "100%", maxWidth: "480px", margin: "0 16px", boxShadow: "0 24px 60px rgba(0,0,0,0.2)" }}>
                        <h2 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: "800", color: "#1E293B", display: "flex", alignItems: "center", gap: "8px" }}>
                            {modal.type === "approve" ? <>{Icon.checkCircle({ color: "#16A34A", size: 22 })} Aprovar</> : <>{Icon.x({ color: "#DC2626", size: 22 })} Rejeitar</>}
                        </h2>
                        <p style={{ margin: "0 0 20px", color: "#64748B", fontSize: "14px" }}>
                            {modal.type === "approve" ? `Aprovar "${modal.title}"? Ele ficará visível no app.` : `Rejeitar "${modal.title}"? Informe o motivo.`}
                        </p>
                        {modal.type === "reject" && (
                            <textarea value={rejectNote} onChange={e => setRejectNote(e.target.value)}
                                placeholder="Motivo da rejeição (ex: imagens de baixa qualidade, preço inválido...)"
                                style={{ width: "100%", minHeight: "100px", padding: "12px 14px", borderRadius: "12px", border: "1.5px solid #E2E8F0", fontSize: "14px", fontFamily: "inherit", resize: "none", outline: "none", boxSizing: "border-box", background: "#F8FAFC", color: "#1E293B" }}
                            />
                        )}
                        <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                            <button onClick={() => setModal(null)} style={{ flex: 1, padding: "12px", borderRadius: "12px", border: "1.5px solid #E2E8F0", background: "#fff", cursor: "pointer", fontWeight: "600", fontSize: "14px", color: "#64748B" }}>Cancelar</button>
                            <button onClick={confirmAction} disabled={actionLoading} style={{
                                flex: 1, padding: "12px", borderRadius: "12px", border: "none",
                                background: modal.type === "approve" ? "linear-gradient(135deg, #28C9BF, #1FA89F)" : "linear-gradient(135deg, #EF4444, #DC2626)",
                                color: "#fff", cursor: "pointer", fontWeight: "700", fontSize: "14px",
                            }}>{actionLoading ? "..." : modal.type === "approve" ? "Aprovar" : "Rejeitar"}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ SIDEBAR ═══ */}
            <aside style={{
                width: "240px", minHeight: "100vh", background: "#0F172A",
                display: "flex", flexDirection: "column", flexShrink: 0,
                borderRight: "1px solid rgba(255,255,255,0.06)",
            }}>
                {/* Brand */}
                <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                        <div style={{
                            width: "32px", height: "32px", borderRadius: "10px",
                            background: "linear-gradient(135deg, #28C9BF, #1FA89F)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>{Icon.shield({ size: 16, color: "#fff" })}</div>
                        <span style={{ fontSize: "18px", fontWeight: "800", color: "#F1F5F9" }}>VAM<span style={{ color: "#28C9BF" }}>O</span></span>
                    </div>
                    <span style={{ fontSize: "11px", color: "#64748B", fontWeight: "500" }}>Painel Administrativo</span>
                </div>

                {/* User */}
                {adminUser && (
                    <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                        <div style={{
                            display: "flex", alignItems: "center", gap: "10px",
                        }}>
                            <div style={{
                                width: "36px", height: "36px", borderRadius: "10px",
                                background: "rgba(40,201,191,0.15)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                            }}>{Icon.user({ size: 16, color: "#28C9BF" })}</div>
                            <div>
                                <div style={{ fontSize: "13px", fontWeight: "600", color: "#E2E8F0" }}>{adminUser.name}</div>
                                <div style={{ fontSize: "10px", color: "#64748B" }}>{adminUser.role}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Nav sections */}
                <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto" }}>
                    {SIDEBAR_SECTIONS.map(section => (
                        <div key={section.label} style={{ marginBottom: "16px" }}>
                            <div style={{ fontSize: "10px", fontWeight: "700", color: "#475569", padding: "0 10px", marginBottom: "6px", letterSpacing: "0.05em" }}>{section.label}</div>
                            {section.items.map(item => {
                                const active = tab === item.key;
                                const badge = getBadge(item.key);
                                return (
                                    <button key={item.key} onClick={() => setTab(item.key as Tab)} style={{
                                        display: "flex", alignItems: "center", gap: "10px",
                                        width: "100%", padding: "9px 12px", borderRadius: "10px",
                                        border: "none", cursor: "pointer",
                                        background: active ? "rgba(40,201,191,0.12)" : "transparent",
                                        color: active ? "#28C9BF" : "#94A3B8",
                                        fontSize: "13px", fontWeight: active ? "700" : "500",
                                        transition: "all 0.15s", textAlign: "left",
                                        marginBottom: "2px",
                                    }}>
                                        {item.icon({ size: 17, color: active ? "#28C9BF" : "#64748B" })}
                                        <span style={{ flex: 1 }}>{item.label}</span>
                                        {badge > 0 && (
                                            <span style={{
                                                background: active ? "#28C9BF" : "rgba(217,119,6,0.9)",
                                                color: "#fff", fontSize: "10px", fontWeight: "800",
                                                padding: "2px 7px", borderRadius: "10px", minWidth: "18px",
                                                textAlign: "center",
                                            }}>{badge}</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </nav>

                {/* Footer */}
                <div style={{ padding: "12px 10px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <button disabled style={{
                        display: "flex", alignItems: "center", gap: "10px", width: "100%",
                        padding: "9px 12px", borderRadius: "10px", border: "none",
                        background: "transparent", color: "#64748B", cursor: "not-allowed", opacity: 0.5,
                        fontSize: "13px", fontWeight: "500", textAlign: "left", marginBottom: "2px",
                    }} title="Configurações em desenvolvimento">{Icon.settings({ size: 17, color: "#475569" })}<span>Configurações</span></button>
                    <button onClick={logout} style={{
                        display: "flex", alignItems: "center", gap: "10px", width: "100%",
                        padding: "9px 12px", borderRadius: "10px", border: "none",
                        background: "transparent", color: "#EF4444", cursor: "pointer",
                        fontSize: "13px", fontWeight: "500", textAlign: "left",
                    }}>{Icon.logout({ size: 17, color: "#EF4444" })}<span>Sair</span></button>
                </div>
            </aside>

            {/* ═══ MAIN CONTENT ═══ */}
            <main style={{ flex: 1, background: "#F0F4F8", overflow: "auto" }}>
                {/* Top bar */}
                <div style={{
                    background: "#fff", borderBottom: "1px solid rgba(226,232,240,0.8)",
                    padding: "0 32px", display: "flex", alignItems: "center",
                    justifyContent: "space-between", height: "56px",
                    boxShadow: "0 1px 4px rgba(26,50,99,0.04)",
                }}>
                    <div style={{ fontSize: "15px", fontWeight: "700", color: "#1E293B" }}>
                        {tab === "overview" && "Visão Geral"}
                        {tab === "packages" && "Pacotes Pendentes"}
                        {tab === "itineraries" && "Roteiros Pendentes"}
                        {tab === "agencies" && "Agências"}
                        {tab === "creators" && "Roteiristas"}
                        {tab === "clients" && "Clientes"}
                        {tab === "financial" && "Financeiro"}
                        {tab === "history" && "Histórico"}
                    </div>
                    <div style={{ fontSize: "12px", color: "#94A3B8" }}>
                        {new Date().toLocaleDateString("pt-BR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                    </div>
                </div>

                <div style={{ padding: "24px 32px", maxWidth: "1100px" }}>

                    {/* ═══ OVERVIEW TAB ═══ */}
                    {tab === "overview" && (
                        <>
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
                                                <span style={{ fontSize: "12px", color: "#64748B", fontWeight: "600" }}>{stat.label}</span>
                                            </div>
                                            <div style={{ fontSize: "28px", fontWeight: "800", color: stat.color }}>{stat.value}</div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Pending items quick list */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                {/* Pending packages */}
                                <div style={{ background: "#fff", borderRadius: "18px", padding: "20px", border: "1px solid rgba(226,232,240,0.7)" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                                        {Icon.package({ size: 16, color: "#1FA89F" })}
                                        <span style={{ fontSize: "13px", fontWeight: "700", color: "#1E293B" }}>Pacotes pendentes</span>
                                        <span style={{ marginLeft: "auto", fontSize: "11px", fontWeight: "700", color: "#1FA89F", background: "rgba(31,168,159,0.1)", padding: "2px 8px", borderRadius: "8px" }}>{packages.length}</span>
                                    </div>
                                    {packages.slice(0, 3).map(p => (
                                        <div key={p.id} style={{ padding: "8px 0", borderBottom: "1px solid #F1F5F9", fontSize: "13px", color: "#334155" }}>
                                            {p.title} <span style={{ color: "#94A3B8" }}>· {p.agency?.name}</span>
                                        </div>
                                    ))}
                                    {packages.length === 0 && <div style={{ fontSize: "13px", color: "#94A3B8" }}>Nenhum pacote pendente</div>}
                                    {packages.length > 3 && <button onClick={() => setTab("packages")} style={{ marginTop: "8px", fontSize: "12px", color: "#28C9BF", fontWeight: "600", background: "none", border: "none", cursor: "pointer" }}>Ver todos →</button>}
                                </div>

                                {/* Pending creators */}
                                <div style={{ background: "#fff", borderRadius: "18px", padding: "20px", border: "1px solid rgba(226,232,240,0.7)" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                                        {Icon.compass({ size: 16, color: "#6366F1" })}
                                        <span style={{ fontSize: "13px", fontWeight: "700", color: "#1E293B" }}>Roteiristas pendentes</span>
                                        <span style={{ marginLeft: "auto", fontSize: "11px", fontWeight: "700", color: "#6366F1", background: "rgba(99,102,241,0.1)", padding: "2px 8px", borderRadius: "8px" }}>{creators.length}</span>
                                    </div>
                                    {creators.slice(0, 3).map(c => (
                                        <div key={c.id} style={{ padding: "8px 0", borderBottom: "1px solid #F1F5F9", fontSize: "13px", color: "#334155" }}>
                                            {c.traveler.name} <span style={{ color: "#94A3B8" }}>· {c.traveler.email}</span>
                                        </div>
                                    ))}
                                    {creators.length === 0 && <div style={{ fontSize: "13px", color: "#94A3B8" }}>Nenhum roteirista pendente</div>}
                                    {creators.length > 3 && <button onClick={() => setTab("creators")} style={{ marginTop: "8px", fontSize: "12px", color: "#28C9BF", fontWeight: "600", background: "none", border: "none", cursor: "pointer" }}>Ver todos →</button>}
                                </div>
                            </div>

                            {/* Warnings section */}
                            {(stats && stats.totalPending + creators.length > 5) && (
                                <div style={{ marginTop: "16px", background: "rgba(217,119,6,0.06)", border: "1px solid rgba(217,119,6,0.15)", borderRadius: "14px", padding: "14px 18px", display: "flex", alignItems: "center", gap: "10px" }}>
                                    {Icon.alertTriangle({ size: 18, color: "#D97706" })}
                                    <span style={{ fontSize: "13px", color: "#92400E", fontWeight: "600" }}>
                                        Existem {stats.totalPending + creators.length} itens aguardando sua revisão.
                                    </span>
                                </div>
                            )}
                        </>
                    )}

                    {/* ═══ PACKAGES TAB ═══ */}
                    {tab === "packages" && (
                        <ItemList items={packages} type="packages" onApprove={handleApprove} onReject={handleReject} emptyMsg="Nenhum pacote aguardando revisão" />
                    )}

                    {/* ═══ ITINERARIES TAB ═══ */}
                    {tab === "itineraries" && (
                        <ItemList items={itineraries} type="itineraries" onApprove={handleApprove} onReject={handleReject} emptyMsg="Nenhum roteiro aguardando revisão" />
                    )}

                    {/* ═══ CREATORS TAB ═══ */}
                    {tab === "creators" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            {creators.map(c => (
                                <div key={c.id} style={{ background: "#fff", borderRadius: "20px", padding: "20px 24px", border: "1px solid rgba(226,232,240,0.7)", display: "flex", alignItems: "center", gap: "16px" }}>
                                    <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center" }}>{Icon.user({ size: 22, color: "#94A3B8" })}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: "700", fontSize: "15px", color: "#1E293B" }}>{c.traveler.name}</div>
                                        <div style={{ fontSize: "13px", color: "#64748B" }}>{c.traveler.email}</div>
                                        <div style={{ fontSize: "12px", color: "#94A3B8", marginTop: "4px", fontStyle: "italic" }}>&quot;{c.bio}&quot;</div>
                                    </div>
                                    <button onClick={() => handleApproveCreator(c.id)} style={{ padding: "9px 18px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #28C9BF, #1FA89F)", color: "#fff", fontWeight: "700", fontSize: "13px", cursor: "pointer" }}>
                                        Aprovar Roteirista
                                    </button>
                                </div>
                            ))}
                            {creators.length === 0 && <EmptyState msg="Nenhum roteirista aguardando aprovação" />}
                        </div>
                    )}

                    {/* ═══ AGENCIES TAB ═══ */}
                    {tab === "agencies" && (
                        <div style={{ background: "#fff", borderRadius: "20px", padding: "32px", border: "1px solid rgba(226,232,240,0.7)", maxWidth: "600px" }}>
                            <h3 style={{ margin: "0 0 20px", fontSize: "18px", fontWeight: "800", display: "flex", alignItems: "center", gap: "8px" }}>
                                {Icon.building({ size: 20, color: "#1FA89F" })} Registrar Nova Agência
                            </h3>
                            <form onSubmit={handleCreateAgency} style={{ display: "grid", gap: "16px" }}>
                                <div style={{ display: "grid", gap: "6px" }}>
                                    <label style={{ fontSize: "12px", fontWeight: "700", color: "#64748B" }}>Nome da Agência</label>
                                    <input type="text" value={newAgency.name} onChange={e => setNewAgency({ ...newAgency, name: e.target.value })} required style={{ padding: "12px", borderRadius: "10px", border: "1.5px solid #E2E8F0", outline: "none", fontFamily: "inherit", fontSize: "14px" }} />
                                </div>
                                <div style={{ display: "grid", gap: "6px" }}>
                                    <label style={{ fontSize: "12px", fontWeight: "700", color: "#64748B" }}>CNPJ</label>
                                    <input type="text" value={newAgency.cnpj} onChange={e => setNewAgency({ ...newAgency, cnpj: e.target.value })} required style={{ padding: "12px", borderRadius: "10px", border: "1.5px solid #E2E8F0", outline: "none", fontFamily: "inherit", fontSize: "14px" }} />
                                </div>
                                <hr style={{ border: "0", borderTop: "1px solid #E2E8F0", margin: "4px 0" }} />
                                <div style={{ display: "grid", gap: "6px" }}>
                                    <label style={{ fontSize: "12px", fontWeight: "700", color: "#64748B" }}>Nome do Gestor</label>
                                    <input type="text" value={newAgency.employeeName} onChange={e => setNewAgency({ ...newAgency, employeeName: e.target.value })} required style={{ padding: "12px", borderRadius: "10px", border: "1.5px solid #E2E8F0", outline: "none", fontFamily: "inherit", fontSize: "14px" }} />
                                </div>
                                <div style={{ display: "grid", gap: "6px" }}>
                                    <label style={{ fontSize: "12px", fontWeight: "700", color: "#64748B" }}>E-mail</label>
                                    <input type="email" value={newAgency.email} onChange={e => setNewAgency({ ...newAgency, email: e.target.value })} required style={{ padding: "12px", borderRadius: "10px", border: "1.5px solid #E2E8F0", outline: "none", fontFamily: "inherit", fontSize: "14px" }} />
                                </div>
                                <div style={{ display: "grid", gap: "6px" }}>
                                    <label style={{ fontSize: "12px", fontWeight: "700", color: "#64748B" }}>Senha Temporária</label>
                                    <input type="password" value={newAgency.password} onChange={e => setNewAgency({ ...newAgency, password: e.target.value })} required style={{ padding: "12px", borderRadius: "10px", border: "1.5px solid #E2E8F0", outline: "none", fontFamily: "inherit", fontSize: "14px" }} />
                                </div>
                                <button type="submit" disabled={actionLoading} style={{ marginTop: "10px", padding: "14px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg, #28C9BF, #1FA89F)", color: "#fff", fontWeight: "700", cursor: "pointer", fontFamily: "inherit", fontSize: "14px" }}>
                                    {actionLoading ? "Criando..." : "Criar Agência e Gestor"}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* ═══ CLIENTS TAB ═══ */}
                    {tab === "clients" && (
                        <ComingSoon title="Clientes" description="Gerencie viajantes cadastrados, histórico de compras e feedbacks." icon={Icon.users} />
                    )}

                    {/* ═══ FINANCIAL TAB ═══ */}
                    {tab === "financial" && (
                        <ComingSoon title="Financeiro" description="Acompanhe receitas, comissões de roteiristas e repasses para agências." icon={Icon.wallet} />
                    )}

                    {/* ═══ HISTORY TAB ═══ */}
                    {tab === "history" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            {[...history.packages, ...history.itineraries]
                                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                .map(item => (
                                    <div key={item.id} style={{
                                        background: "#fff", borderRadius: "16px", padding: "16px 20px",
                                        border: "1px solid rgba(226,232,240,0.7)",
                                        display: "flex", alignItems: "center", justifyContent: "space-between",
                                    }}>
                                        <div>
                                            <div style={{ fontWeight: "700", fontSize: "14px", color: "#1E293B" }}>{item.title}</div>
                                            <div style={{ fontSize: "12px", color: "#94A3B8", marginTop: "2px" }}>
                                                {item.destination} · {item.agency?.name || item.creator?.traveler?.name}
                                            </div>
                                        </div>
                                        <span style={{
                                            padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: "700",
                                            background: `${STATUS_COLOR[item.status as Status]}18`,
                                            color: STATUS_COLOR[item.status as Status],
                                        }}>{STATUS_LABEL[item.status as Status]}</span>
                                    </div>
                                ))}
                            {history.packages.length === 0 && history.itineraries.length === 0 && (
                                <EmptyState msg="Nenhum item no histórico" />
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

/* ═══════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════ */
function ItemList({ items, type, onApprove, onReject, emptyMsg }: {
    items: any[]; type: "packages" | "itineraries";
    onApprove: (type: "packages" | "itineraries", id: string, title: string) => void;
    onReject: (type: "packages" | "itineraries", id: string, title: string) => void;
    emptyMsg: string;
}) {
    if (items.length === 0) return <EmptyState msg={emptyMsg} />;
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {items.map(item => (
                <div key={item.id} style={{
                    background: "#fff", borderRadius: "20px", padding: "20px 24px",
                    border: "1px solid rgba(226,232,240,0.7)", boxShadow: "0 2px 8px rgba(26,50,99,0.04)",
                    display: "flex", alignItems: "center", gap: "16px",
                }}>
                    <div style={{
                        width: "64px", height: "64px", borderRadius: "14px",
                        background: "linear-gradient(135deg, rgba(40,201,191,0.12), rgba(40,201,191,0.06))",
                        flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
                    }}>
                        {item.images?.[0]?.url
                            ? <img src={item.images[0].url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            : type === "packages" ? Icon.package({ size: 24, color: "#28C9BF" }) : Icon.map({ size: 24, color: "#28C9BF" })}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: "700", fontSize: "15px", color: "#1E293B", marginBottom: "4px" }}>{item.title}</div>
                        <div style={{ fontSize: "13px", color: "#64748B" }}>
                            {item.destination}, {item.country} · <span style={{ color: "#94A3B8" }}>{type === "packages" ? item.agency?.name : item.creator?.traveler?.name}</span>
                        </div>
                        <div style={{ display: "flex", gap: "10px", marginTop: "6px", alignItems: "center" }}>
                            {item.qualityScore !== undefined && (
                                <span style={{ fontSize: "11px", fontWeight: "700", color: item.qualityScore >= 70 ? "#16A34A" : item.qualityScore >= 40 ? "#D97706" : "#DC2626" }}>Score: {item.qualityScore}%</span>
                            )}
                            <span style={{ fontSize: "11px", color: "#94A3B8" }}>{new Date(item.createdAt).toLocaleDateString("pt-BR")}</span>
                        </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: "14px", fontWeight: "700", color: "#1FA89F" }}>
                            {type === "packages" ? item.priceMin ? `R$ ${item.priceMin.toLocaleString("pt-BR")}` : "—" : item.price ? `R$ ${item.price.toLocaleString("pt-BR")}` : "—"}
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                        <button onClick={() => onApprove(type, item.id, item.title)} style={{
                            padding: "9px 16px", borderRadius: "10px", border: "none",
                            background: "linear-gradient(135deg, #28C9BF, #1FA89F)",
                            color: "#fff", fontWeight: "700", fontSize: "13px", cursor: "pointer",
                            boxShadow: "0 2px 8px rgba(40,201,191,0.25)",
                            display: "flex", alignItems: "center", gap: "6px",
                        }}>{Icon.check({ size: 14, color: "#fff" })} Aprovar</button>
                        <button onClick={() => onReject(type, item.id, item.title)} style={{
                            padding: "9px 16px", borderRadius: "10px",
                            border: "1.5px solid rgba(239,68,68,0.2)",
                            background: "rgba(239,68,68,0.06)",
                            color: "#DC2626", fontWeight: "700", fontSize: "13px", cursor: "pointer",
                            display: "flex", alignItems: "center", gap: "6px",
                        }}>{Icon.x({ size: 14, color: "#DC2626" })} Rejeitar</button>
                    </div>
                </div>
            ))}
        </div>
    );
}

function EmptyState({ msg }: { msg: string }) {
    return (
        <div style={{
            background: "#fff", borderRadius: "20px", padding: "48px 32px",
            border: "1px solid rgba(226,232,240,0.7)", textAlign: "center",
        }}>
            <div style={{ marginBottom: "12px" }}>{Icon.checkCircle({ size: 48, color: "#28C9BF" })}</div>
            <div style={{ fontSize: "16px", fontWeight: "700", color: "#1E293B", marginBottom: "6px" }}>{msg}</div>
            <div style={{ fontSize: "14px", color: "#94A3B8" }}>Tudo em dia por aqui.</div>
        </div>
    );
}

function ComingSoon({ title, description, icon }: { title: string; description: string; icon: (p?: any) => React.ReactElement }) {
    return (
        <div style={{
            background: "#fff", borderRadius: "20px", padding: "60px 32px",
            border: "1px solid rgba(226,232,240,0.7)", textAlign: "center",
        }}>
            <div style={{ marginBottom: "16px" }}>{icon({ size: 48, color: "#CBD5E1" })}</div>
            <div style={{ fontSize: "20px", fontWeight: "800", color: "#1E293B", marginBottom: "8px" }}>{title}</div>
            <div style={{ fontSize: "14px", color: "#94A3B8", maxWidth: "400px", margin: "0 auto", lineHeight: 1.6 }}>{description}</div>
            <div style={{
                marginTop: "20px", display: "inline-block", padding: "8px 20px",
                borderRadius: "10px", background: "rgba(40,201,191,0.08)",
                color: "#1FA89F", fontSize: "13px", fontWeight: "700",
            }}>Em breve</div>
        </div>
    );
}

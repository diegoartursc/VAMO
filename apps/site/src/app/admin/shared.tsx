"use client";

import React, { useState, useEffect, useCallback, createContext, useContext } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333/api";

/* ═══════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════ */
export type Status = "DRAFT" | "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "ACTIVE" | "PAUSED" | "ARCHIVED";

export interface PendingPackage {
    id: string; title: string; destination: string; country: string;
    priceMin?: number; priceMax?: number; qualityScore?: number;
    status: Status; approvalNote?: string; createdAt: string;
    agency?: { id: string; name: string; logo?: string };
    images?: { url: string }[];
}
export interface PendingItinerary {
    id: string; title: string; destination: string; country: string;
    price?: number; qualityScore?: number;
    status: Status; approvalNote?: string; createdAt: string;
    creator?: { id: string; traveler?: { name: string; avatar?: string } };
    images?: { url: string }[];
}
export interface Stats { pendingPackages: number; pendingItineraries: number; totalPending: number; approvedToday: number; rejectedTotal: number; }
export interface PendingCreator { id: string; traveler: { name: string; email: string; avatar?: string }; bio: string; createdAt: string; }

export type AgencyStatus = "PENDING" | "REVIEW" | "ACTIVE" | "SUSPENDED";
export interface MockAgency {
    id: string; name: string; cnpj: string; manager: string; email: string;
    status: AgencyStatus; createdAt: string; packagesCount: number; qualityAvg: number;
}

export const AGENCY_STATUS_LABEL: Record<AgencyStatus, string> = { PENDING: "Pendente", REVIEW: "Em Análise", ACTIVE: "Ativa", SUSPENDED: "Suspensa" };
export const AGENCY_STATUS_COLOR: Record<AgencyStatus, string> = { PENDING: "#D97706", REVIEW: "#6366F1", ACTIVE: "#16A34A", SUSPENDED: "#DC2626" };

export const STATUS_LABEL: Record<Status, string> = {
    DRAFT: "Rascunho", PENDING_REVIEW: "Em Revisão", APPROVED: "Aprovado",
    REJECTED: "Rejeitado", ACTIVE: "Ativo", PAUSED: "Pausado", ARCHIVED: "Arquivado",
};
export const STATUS_COLOR: Record<Status, string> = {
    DRAFT: "#64748B", PENDING_REVIEW: "#D97706", APPROVED: "#16A34A",
    REJECTED: "#DC2626", ACTIVE: "#16A34A", PAUSED: "#64748B", ARCHIVED: "#64748B",
};

export const MOCK_AGENCIES: MockAgency[] = [];

/* ═══════════════════════════════════════════════════
   ICONS (SVG – shared across admin views)
   ═══════════════════════════════════════════════════ */
const I = ({ d, size = 18, color = "currentColor" }: { d: string; size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);
export const Icon = {
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
    check: (p?: any) => <I d="M20 6L9 17l-5-5" {...p} />,
    x: (p?: any) => <I d="M18 6L6 18 M6 6l12 12" {...p} />,
    checkCircle: (p?: any) => (
        <svg width={p?.size || 18} height={p?.size || 18} viewBox="0 0 24 24" fill="none" stroke={p?.color || "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" />
        </svg>
    ),
    hourglass: (p?: any) => <I d="M5 22h14 M5 2h14 M17 22v-4.172a2 2 0 00-.586-1.414L12 12l-4.414 4.414A2 2 0 007 17.828V22 M7 2v4.172a2 2 0 00.586 1.414L12 12l4.414-4.414A2 2 0 0017 6.172V2" {...p} />,
    alertTriangle: (p?: any) => <I d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z M12 9v4 M12 17h.01" {...p} />,
    settings: (p?: any) => (
        <svg width={p?.size || 18} height={p?.size || 18} viewBox="0 0 24 24" fill="none" stroke={p?.color || "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
        </svg>
    ),
};

/* ═══════════════════════════════════════════════════
   ADMIN DATA CONTEXT
   ═══════════════════════════════════════════════════ */
export interface AdminData {
    packages: PendingPackage[];
    allPackages: PendingPackage[];
    itineraries: PendingItinerary[];
    allItineraries: PendingItinerary[];
    creators: PendingCreator[];
    stats: Stats | null;
    loading: boolean;
    refetch: () => void;
    showToast: (msg: string, type: "success" | "error") => void;
    toast: { msg: string; type: "success" | "error" } | null;
    getToken: () => string | null;
}

const AdminContext = createContext<AdminData | null>(null);
export const useAdmin = () => {
    const ctx = useContext(AdminContext);
    if (!ctx) throw new Error("useAdmin must be used inside AdminDataProvider");
    return ctx;
};

async function readJsonResponse<T>(res: Response): Promise<T | null> {
    if (!res.ok) return null;
    try {
        return await res.json();
    } catch {
        return null;
    }
}

function listFromPayload<T>(payload: unknown, key: "packages" | "itineraries"): T[] {
    if (!payload || typeof payload !== "object") return [];
    const value = (payload as Record<string, unknown>)[key];
    return Array.isArray(value) ? value as T[] : [];
}

function mergeAdminItems<T extends { id: string }>(preferred: T[], fallback: T[]): T[] {
    const seen = new Set<string>();
    const merged: T[] = [];
    for (const item of [...preferred, ...fallback]) {
        if (!item?.id || seen.has(item.id)) continue;
        seen.add(item.id);
        merged.push(item);
    }
    return merged;
}

export function AdminDataProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [packages, setPackages] = useState<PendingPackage[]>([]);
    const [allPackages, setAllPackages] = useState<PendingPackage[]>([]);
    const [itineraries, setItineraries] = useState<PendingItinerary[]>([]);
    const [allItineraries, setAllItineraries] = useState<PendingItinerary[]>([]);
    const [creators, setCreators] = useState<PendingCreator[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

    const getToken = () => localStorage.getItem("adminToken");
    const showToast = (msg: string, type: "success" | "error") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchData = useCallback(async () => {
        const token = getToken();
        if (!token) { router.push("/admin/login"); return; }
        try {
            const headers = { Authorization: `Bearer ${token}` };
            const fetchOpts = { headers, cache: 'no-store' as RequestCache };
            const fetchAdmin = async (path: string) => {
                const res = await fetch(`${API}${path}`, fetchOpts);
                if (res.status === 401) {
                    localStorage.removeItem("adminToken");
                    router.push("/admin/login");
                    return null;
                }
                return res;
            };

            const pendingPackagesRes = await fetchAdmin("/admin/pending?type=package");
            const pendingItinerariesRes = await fetchAdmin("/admin/pending?type=itinerary");
            const allPackagesRes = await fetchAdmin("/admin/all?type=package");
            const allItinerariesRes = await fetchAdmin("/admin/all?type=itinerary");
            const statsRes = await fetchAdmin("/admin/stats");

            if (!pendingPackagesRes || !pendingItinerariesRes || !allPackagesRes || !allItinerariesRes || !statsRes) {
                localStorage.removeItem("adminToken");
                return;
            }

            let pkgs: PendingPackage[] = [], its: PendingItinerary[] = [], allPkgs: PendingPackage[] = [], allIts: PendingItinerary[] = [];
            const [pendingPackagesData, pendingItinerariesData, allPackagesData, allItinerariesData] = await Promise.all([
                readJsonResponse<unknown>(pendingPackagesRes),
                readJsonResponse<unknown>(pendingItinerariesRes),
                readJsonResponse<unknown>(allPackagesRes),
                readJsonResponse<unknown>(allItinerariesRes),
            ]);

            pkgs = listFromPayload<PendingPackage>(pendingPackagesData, "packages");
            its = listFromPayload<PendingItinerary>(pendingItinerariesData, "itineraries");
            allPkgs = mergeAdminItems(pkgs, listFromPayload<PendingPackage>(allPackagesData, "packages"));
            allIts = mergeAdminItems(its, listFromPayload<PendingItinerary>(allItinerariesData, "itineraries"));

            setPackages(pkgs);
            setItineraries(its);
            setAllPackages(allPkgs);
            setAllItineraries(allIts);

            let s: Stats = { pendingPackages: pkgs.length, pendingItineraries: its.length, totalPending: pkgs.length + its.length, approvedToday: 0, rejectedTotal: allPkgs.filter(p => p.status === "REJECTED").length + allIts.filter(i => i.status === "REJECTED").length };
            const statsData = await readJsonResponse<Stats>(statsRes);
            if (statsData) s = statsData;
            setStats(s);

            const creatorsRes = await fetch(`${API}/admin/creators/pending`, fetchOpts);
            if (creatorsRes.ok) {
                const cd = await readJsonResponse<PendingCreator[]>(creatorsRes);
                setCreators(Array.isArray(cd) ? cd : []);
            }
        } catch (error) {
            console.error("[admin/shared] failed to load admin data", error);
            setPackages([]); setItineraries([]);
            setAllPackages([]); setAllItineraries([]);
            setStats({ pendingPackages: 0, pendingItineraries: 0, totalPending: 0, approvedToday: 0, rejectedTotal: 0 });
            showToast("Não foi possível carregar os roteiros do admin agora.", "error");
        } finally { setLoading(false); }
    }, [router]);

    useEffect(() => { fetchData(); }, [fetchData]);

    return (
        <AdminContext.Provider value={{ packages, allPackages, itineraries, allItineraries, creators, stats, loading, refetch: fetchData, showToast, toast, getToken }}>
            {toast && (
                <div style={{
                    position: "fixed", top: "20px", right: "20px", zIndex: 9999,
                    padding: "14px 20px", borderRadius: "14px",
                    background: toast.type === "success" ? "rgba(22,163,74,0.95)" : "rgba(220,38,38,0.95)",
                    color: "#fff", fontWeight: "700", fontSize: "14px",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                }}>{toast.msg}</div>
            )}
            {children}
        </AdminContext.Provider>
    );
}

/* ═══════════════════════════════════════════════════
   SHARED SUB-COMPONENTS
   ═══════════════════════════════════════════════════ */
export function FilterBar({ current, onChange, counts }: { current: string; onChange: (v: string) => void; counts: Record<string, number> }) {
    const filters = [
        { key: "ALL", label: "Todos" },
        { key: "PENDING_REVIEW", label: "Pendentes" },
        { key: "APPROVED", label: "Aprovados" },
        { key: "ACTIVE", label: "Ativos" },
        { key: "REJECTED", label: "Rejeitados" },
    ];
    return (
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
            {filters.map(f => (
                <button key={f.key} onClick={() => onChange(f.key)} style={{
                    padding: "7px 14px", borderRadius: "10px", fontSize: "12px", fontWeight: "700", cursor: "pointer",
                    border: current === f.key ? "2px solid #28C9BF" : "1px solid #E2E8F0",
                    background: current === f.key ? "rgba(40,201,191,0.08)" : "#fff",
                    color: current === f.key ? "#1FA89F" : "#64748B",
                    transition: "all 0.15s",
                }}>{f.label} <span style={{ marginLeft: "4px", fontSize: "10px", opacity: 0.7 }}>({counts[f.key] ?? 0})</span></button>
            ))}
        </div>
    );
}

export function ItemList({ items, type, onApprove, onReject, onCostProofs, emptyMsg, showStatus }: {
    items: any[]; type: "packages" | "itineraries";
    onApprove: (type: "packages" | "itineraries", id: string, title: string) => void;
    onReject: (type: "packages" | "itineraries", id: string, title: string) => void;
    /** Quando setado, mostra botão "Comprovantes" no row (apenas para itineraries). */
    onCostProofs?: (id: string, title: string) => void;
    emptyMsg: string; showStatus?: boolean;
}) {
    if (items.length === 0) return <EmptyState msg={emptyMsg} />;
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {items.map(item => {
                const isPending = item.status === "PENDING_REVIEW";
                return (
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
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                                <span style={{ fontWeight: "700", fontSize: "15px", color: "#1A3263" }}>{item.title}</span>
                                {showStatus && (
                                    <span style={{
                                        padding: "2px 8px", borderRadius: "20px", fontSize: "10px", fontWeight: "700",
                                        background: `${STATUS_COLOR[item.status as Status]}14`,
                                        color: STATUS_COLOR[item.status as Status],
                                    }}>{STATUS_LABEL[item.status as Status]}</span>
                                )}
                            </div>
                            <div style={{ fontSize: "13px", color: "#5A6B8C" }}>
                                {item.destination}, {item.country} · <span style={{ color: "#98989D" }}>{type === "packages" ? item.agency?.name : item.creator?.traveler?.name}</span>
                            </div>
                            <div style={{ display: "flex", gap: "10px", marginTop: "6px", alignItems: "center", flexWrap: "wrap" }}>
                                {item.qualityScore !== undefined && (
                                    <span style={{ fontSize: "11px", fontWeight: "700", color: item.qualityScore >= 70 ? "#16A34A" : item.qualityScore >= 40 ? "#D97706" : "#DC2626" }}>Score: {item.qualityScore}%</span>
                                )}
                                <span style={{ fontSize: "11px", color: "#98989D" }}>{new Date(item.createdAt).toLocaleDateString("pt-BR")}</span>
                                {item.approvalNote && <span style={{ fontSize: "11px", color: "#DC2626", fontStyle: "italic" }}>Nota: {item.approvalNote}</span>}
                                {type === "itineraries" && item.travelProofUrl && (
                                    <a
                                        href={item.travelProofUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            fontSize: "11px", fontWeight: "700", color: "#1FA89F",
                                            textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4,
                                            background: "rgba(40,201,191,0.08)", padding: "2px 8px", borderRadius: 6,
                                            border: "1px solid rgba(40,201,191,0.25)",
                                        }}
                                    >
                                        📎 Ver Comprovante de Viagem
                                    </a>
                                )}
                                {type === "itineraries" && !item.travelProofUrl && (
                                    <span style={{ fontSize: "11px", color: "#DC2626", fontWeight: 600 }}>⚠️ Sem comprovante</span>
                                )}
                            </div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                            <div style={{ fontSize: "14px", fontWeight: "700", color: "#1FA89F" }}>
                                {type === "packages" ? item.priceMin ? `A$ ${item.priceMin.toLocaleString("pt-BR")}` : "—" : item.price ? `A$ ${item.price.toLocaleString("pt-BR")}` : "—"}
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                            {type === "itineraries" && onCostProofs && (
                                <button
                                    onClick={() => onCostProofs(item.id, item.title)}
                                    title="Revisar comprovantes de custo"
                                    style={{
                                        padding: "9px 14px", borderRadius: "10px",
                                        border: "1.5px solid rgba(40,201,191,0.25)",
                                        background: "rgba(40,201,191,0.08)",
                                        color: "#1FA89F", fontWeight: "700", fontSize: "13px", cursor: "pointer",
                                        display: "flex", alignItems: "center", gap: "6px",
                                    }}
                                >
                                    🛡️ Comprovantes
                                </button>
                            )}
                            {isPending && (
                                <>
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
                                </>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export function EmptyState({ msg }: { msg: string }) {
    return (
        <div style={{
            background: "#fff", borderRadius: "20px", padding: "48px 32px",
            border: "1px solid rgba(226,232,240,0.7)", textAlign: "center",
        }}>
            <div style={{ marginBottom: "12px" }}>{Icon.checkCircle({ size: 48, color: "#28C9BF" })}</div>
            <div style={{ fontSize: "16px", fontWeight: "700", color: "#1A3263", marginBottom: "6px" }}>{msg}</div>
            <div style={{ fontSize: "14px", color: "#98989D" }}>Tudo em dia por aqui.</div>
        </div>
    );
}

export function ApproveRejectModal({ modal, onClose, onConfirm, loading }: {
    modal: { type: "approve" | "reject"; itemType: "packages" | "itineraries"; id: string; title: string } | null;
    onClose: () => void; onConfirm: (note: string) => void; loading: boolean;
}) {
    const [note, setNote] = useState("");
    if (!modal) return null;
    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <div style={{ background: "#fff", borderRadius: "24px", padding: "32px", width: "100%", maxWidth: "480px", margin: "0 16px", boxShadow: "0 24px 60px rgba(0,0,0,0.2)" }}>
                <h2 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: "800", color: "#1A3263", display: "flex", alignItems: "center", gap: "8px" }}>
                    {modal.type === "approve" ? <>{Icon.checkCircle({ color: "#16A34A", size: 22 })} Aprovar</> : <>{Icon.x({ color: "#DC2626", size: 22 })} Rejeitar</>}
                </h2>
                <p style={{ margin: "0 0 20px", color: "#5A6B8C", fontSize: "14px" }}>
                    {modal.type === "approve" ? `Aprovar "${modal.title}"? Ele ficará visível no app.` : `Rejeitar "${modal.title}"? Informe o motivo.`}
                </p>
                {modal.type === "reject" && (
                    <textarea value={note} onChange={e => setNote(e.target.value)}
                        placeholder="Motivo da rejeição..."
                        style={{ width: "100%", minHeight: "100px", padding: "12px 14px", borderRadius: "12px", border: "1.5px solid #E0E4EB", fontSize: "14px", fontFamily: "inherit", resize: "none", outline: "none", boxSizing: "border-box", background: "#F8F9FA", color: "#1A3263" }}
                    />
                )}
                <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                    <button onClick={onClose} style={{ flex: 1, padding: "12px", borderRadius: "12px", border: "1.5px solid #E0E4EB", background: "#fff", cursor: "pointer", fontWeight: "600", fontSize: "14px", color: "#5A6B8C" }}>Cancelar</button>
                    <button onClick={() => onConfirm(note)} disabled={loading} style={{
                        flex: 1, padding: "12px", borderRadius: "12px", border: "none",
                        background: modal.type === "approve" ? "linear-gradient(135deg, #28C9BF, #1FA89F)" : "linear-gradient(135deg, #EF4444, #DC2626)",
                        color: "#fff", cursor: "pointer", fontWeight: "700", fontSize: "14px",
                    }}>{loading ? "..." : modal.type === "approve" ? "Aprovar" : "Rejeitar"}</button>
                </div>
            </div>
        </div>
    );
}

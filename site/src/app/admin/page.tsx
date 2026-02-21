"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333/api";

type Status = "DRAFT" | "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "ACTIVE" | "PAUSED" | "ARCHIVED";

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

const STATUS_LABEL: Record<Status, string> = {
    DRAFT: "Rascunho", PENDING_REVIEW: "Em Revisão", APPROVED: "Aprovado",
    REJECTED: "Rejeitado", ACTIVE: "Ativo", PAUSED: "Pausado", ARCHIVED: "Arquivado",
};
const STATUS_COLOR: Record<Status, string> = {
    DRAFT: "#64748B", PENDING_REVIEW: "#D97706", APPROVED: "#16A34A",
    REJECTED: "#DC2626", ACTIVE: "#16A34A", PAUSED: "#64748B", ARCHIVED: "#64748B",
};

export default function AdminDashboardPage() {
    const router = useRouter();
    const [tab, setTab] = useState<"packages" | "itineraries" | "history">("packages");
    const [packages, setPackages] = useState<PendingPackage[]>([]);
    const [itineraries, setItineraries] = useState<PendingItinerary[]>([]);
    const [history, setHistory] = useState<{ packages: any[]; itineraries: any[] }>({ packages: [], itineraries: [] });
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [adminUser, setAdminUser] = useState<{ name: string; email: string; role: string } | null>(null);

    // Modal state
    const [modal, setModal] = useState<{ type: "approve" | "reject"; itemType: "packages" | "itineraries"; id: string; title: string } | null>(null);
    const [rejectNote, setRejectNote] = useState("");
    const [actionLoading, setActionLoading] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

    const getToken = () => localStorage.getItem("adminToken");

    const fetchData = useCallback(async () => {
        const token = getToken();
        if (!token) { router.push("/admin/login"); return; }

        try {
            const headers = { Authorization: `Bearer ${token}` };
            const [pendingRes, statsRes] = await Promise.all([
                fetch(`${API}/admin/pending`, { headers }),
                fetch(`${API}/admin/stats`, { headers }),
            ]);

            if (pendingRes.status === 401) { localStorage.removeItem("adminToken"); router.push("/admin/login"); return; }

            const pendingData = await pendingRes.json();
            const statsData = await statsRes.json();
            setPackages(pendingData.packages || []);
            setItineraries(pendingData.itineraries || []);
            setStats(statsData);

            // Load history
            const histRes = await fetch(`${API}/admin/all`, { headers });
            const histData = await histRes.json();
            setHistory(histData);
        } catch (e: any) {
            showToast("Erro ao carregar dados", "error");
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        const user = localStorage.getItem("adminUser");
        if (user) setAdminUser(JSON.parse(user));
        fetchData();
    }, [fetchData]);

    const showToast = (msg: string, type: "success" | "error") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const handleApprove = async (itemType: "packages" | "itineraries", id: string, title: string) => {
        setModal({ type: "approve", itemType, id, title });
    };

    const handleReject = async (itemType: "packages" | "itineraries", id: string, title: string) => {
        setRejectNote("");
        setModal({ type: "reject", itemType, id, title });
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
            showToast(modal.type === "approve" ? "✅ Aprovado com sucesso!" : "❌ Rejeitado com nota.", "success");
            setModal(null);
            fetchData();
        } catch (e: any) {
            showToast(e.message, "error");
        } finally {
            setActionLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        router.push("/admin/login");
    };

    const s = { fontFamily: "'Inter', sans-serif" };

    if (loading) return (
        <div style={{ minHeight: "100vh", background: "#F0F4F8", display: "flex", alignItems: "center", justifyContent: "center", ...s }}>
            <div style={{ fontSize: "16px", color: "#64748B" }}>Carregando…</div>
        </div>
    );

    return (
        <div style={{ minHeight: "100vh", background: "#F0F4F8", ...s }}>
            {/* Toast */}
            {toast && (
                <div style={{
                    position: "fixed", top: "20px", right: "20px", zIndex: 9999,
                    padding: "14px 20px", borderRadius: "14px",
                    background: toast.type === "success" ? "rgba(22,163,74,0.95)" : "rgba(220,38,38,0.95)",
                    color: "#fff", fontWeight: "700", fontSize: "14px",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                }}>{toast.msg}</div>
            )}

            {/* Modal */}
            {modal && (
                <div style={{
                    position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
                    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
                }}>
                    <div style={{
                        background: "#fff", borderRadius: "24px", padding: "32px",
                        width: "100%", maxWidth: "480px", margin: "0 16px",
                        boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
                    }}>
                        <h2 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: "800", color: "#1E293B" }}>
                            {modal.type === "approve" ? "✅ Aprovar" : "❌ Rejeitar"}
                        </h2>
                        <p style={{ margin: "0 0 20px", color: "#64748B", fontSize: "14px" }}>
                            {modal.type === "approve"
                                ? `Aprovar "${modal.title}"? Ele ficará visível no app.`
                                : `Rejeitar "${modal.title}"? Informe o motivo.`}
                        </p>
                        {modal.type === "reject" && (
                            <textarea
                                value={rejectNote}
                                onChange={e => setRejectNote(e.target.value)}
                                placeholder="Motivo da rejeição (ex: imagens de baixa qualidade, preço inválido...)"
                                style={{
                                    width: "100%", minHeight: "100px", padding: "12px 14px",
                                    borderRadius: "12px", border: "1.5px solid #E2E8F0",
                                    fontSize: "14px", fontFamily: "inherit", resize: "none",
                                    outline: "none", boxSizing: "border-box",
                                    background: "#F8FAFC", color: "#1E293B",
                                }}
                            />
                        )}
                        <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                            <button onClick={() => setModal(null)} style={{
                                flex: 1, padding: "12px", borderRadius: "12px",
                                border: "1.5px solid #E2E8F0", background: "#fff",
                                cursor: "pointer", fontWeight: "600", fontSize: "14px", color: "#64748B",
                            }}>Cancelar</button>
                            <button onClick={confirmAction} disabled={actionLoading} style={{
                                flex: 1, padding: "12px", borderRadius: "12px", border: "none",
                                background: modal.type === "approve"
                                    ? "linear-gradient(135deg, #28C9BF, #1FA89F)"
                                    : "linear-gradient(135deg, #EF4444, #DC2626)",
                                color: "#fff", cursor: "pointer", fontWeight: "700", fontSize: "14px",
                            }}>
                                {actionLoading ? "..." : modal.type === "approve" ? "Aprovar" : "Rejeitar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div style={{
                background: "#fff", borderBottom: "1px solid rgba(226,232,240,0.8)",
                padding: "0 32px", display: "flex", alignItems: "center",
                justifyContent: "space-between", height: "64px",
                boxShadow: "0 1px 8px rgba(26,50,99,0.06)",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{
                        width: "36px", height: "36px", borderRadius: "12px",
                        background: "linear-gradient(135deg, #28C9BF, #1FA89F)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "18px", boxShadow: "0 2px 8px rgba(40,201,191,0.3)",
                    }}>🛡️</div>
                    <div>
                        <div style={{ fontWeight: "800", fontSize: "16px", color: "#1E293B" }}>VAMO Admin</div>
                        <div style={{ fontSize: "11px", color: "#94A3B8" }}>Painel de Moderação</div>
                    </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    {adminUser && (
                        <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: "13px", fontWeight: "600", color: "#1E293B" }}>{adminUser.name}</div>
                            <div style={{ fontSize: "11px", color: "#94A3B8" }}>{adminUser.role}</div>
                        </div>
                    )}
                    <button onClick={logout} style={{
                        padding: "8px 16px", borderRadius: "10px",
                        border: "1px solid rgba(226,232,240,0.8)",
                        background: "#F8FAFC", color: "#64748B",
                        fontSize: "13px", fontWeight: "600", cursor: "pointer",
                    }}>Sair</button>
                </div>
            </div>

            <div style={{ padding: "24px 32px", maxWidth: "1100px", margin: "0 auto" }}>
                {/* Stats */}
                {stats && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "24px" }}>
                        {[
                            { label: "Total Pendente", value: stats.totalPending, icon: "⏳", color: "#D97706", bg: "rgba(217,119,6,0.08)" },
                            { label: "Pacotes Pendentes", value: stats.pendingPackages, icon: "📦", color: "#1FA89F", bg: "rgba(31,168,159,0.08)" },
                            { label: "Roteiros Pendentes", value: stats.pendingItineraries, icon: "🗺️", color: "#6366F1", bg: "rgba(99,102,241,0.08)" },
                            { label: "Aprovados Hoje", value: stats.approvedToday, icon: "✅", color: "#16A34A", bg: "rgba(22,163,74,0.08)" },
                        ].map(stat => (
                            <div key={stat.label} style={{
                                background: "#fff", borderRadius: "18px", padding: "18px 20px",
                                border: "1px solid rgba(226,232,240,0.7)",
                                boxShadow: "0 2px 8px rgba(26,50,99,0.04)",
                            }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                                    <div style={{
                                        width: "36px", height: "36px", borderRadius: "10px",
                                        background: stat.bg, fontSize: "18px",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                    }}>{stat.icon}</div>
                                    <span style={{ fontSize: "12px", color: "#64748B", fontWeight: "600" }}>{stat.label}</span>
                                </div>
                                <div style={{ fontSize: "28px", fontWeight: "800", color: stat.color }}>{stat.value}</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Tabs */}
                <div style={{ display: "flex", gap: "4px", marginBottom: "20px", background: "#fff", padding: "6px", borderRadius: "14px", border: "1px solid rgba(226,232,240,0.7)", width: "fit-content" }}>
                    {[
                        { key: "packages", label: `Pacotes ${stats ? `(${stats.pendingPackages})` : ""}` },
                        { key: "itineraries", label: `Roteiros ${stats ? `(${stats.pendingItineraries})` : ""}` },
                        { key: "history", label: "Histórico" },
                    ].map(t => (
                        <button key={t.key} onClick={() => setTab(t.key as any)} style={{
                            padding: "8px 18px", borderRadius: "10px", border: "none",
                            background: tab === t.key ? "linear-gradient(135deg, #28C9BF, #1FA89F)" : "transparent",
                            color: tab === t.key ? "#fff" : "#64748B",
                            fontWeight: "700", fontSize: "13px", cursor: "pointer",
                            transition: "all 0.2s",
                        }}>{t.label}</button>
                    ))}
                </div>

                {/* Packages tab */}
                {tab === "packages" && (
                    <ItemList
                        items={packages}
                        type="packages"
                        onApprove={handleApprove}
                        onReject={handleReject}
                        emptyMsg="Nenhum pacote aguardando revisão"
                    />
                )}

                {/* Itineraries tab */}
                {tab === "itineraries" && (
                    <ItemList
                        items={itineraries}
                        type="itineraries"
                        onApprove={handleApprove}
                        onReject={handleReject}
                        emptyMsg="Nenhum roteiro aguardando revisão"
                    />
                )}

                {/* History tab */}
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
        </div>
    );
}

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
                    border: "1px solid rgba(226,232,240,0.7)",
                    boxShadow: "0 2px 8px rgba(26,50,99,0.04)",
                    display: "flex", alignItems: "center", gap: "16px",
                }}>
                    {/* Thumbnail */}
                    <div style={{
                        width: "64px", height: "64px", borderRadius: "14px",
                        background: "linear-gradient(135deg, rgba(40,201,191,0.12), rgba(40,201,191,0.06))",
                        flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "28px", overflow: "hidden",
                    }}>
                        {item.images?.[0]?.url
                            ? <img src={item.images[0].url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            : type === "packages" ? "📦" : "🗺️"}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: "700", fontSize: "15px", color: "#1E293B", marginBottom: "4px" }}>{item.title}</div>
                        <div style={{ fontSize: "13px", color: "#64748B" }}>
                            {item.destination}, {item.country} ·{" "}
                            <span style={{ color: "#94A3B8" }}>
                                {type === "packages"
                                    ? item.agency?.name
                                    : item.creator?.traveler?.name}
                            </span>
                        </div>
                        <div style={{ display: "flex", gap: "10px", marginTop: "6px", alignItems: "center" }}>
                            {item.qualityScore !== undefined && (
                                <span style={{
                                    fontSize: "11px", fontWeight: "700",
                                    color: item.qualityScore >= 70 ? "#16A34A" : item.qualityScore >= 40 ? "#D97706" : "#DC2626",
                                }}>Score: {item.qualityScore}%</span>
                            )}
                            <span style={{ fontSize: "11px", color: "#94A3B8" }}>
                                {new Date(item.createdAt).toLocaleDateString("pt-BR")}
                            </span>
                        </div>
                    </div>

                    {/* Price */}
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: "14px", fontWeight: "700", color: "#1FA89F" }}>
                            {type === "packages"
                                ? item.priceMin ? `R$ ${item.priceMin.toLocaleString("pt-BR")}` : "—"
                                : item.price ? `R$ ${item.price.toLocaleString("pt-BR")}` : "—"}
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                        <button onClick={() => onApprove(type, item.id, item.title)} style={{
                            padding: "9px 18px", borderRadius: "10px", border: "none",
                            background: "linear-gradient(135deg, #28C9BF, #1FA89F)",
                            color: "#fff", fontWeight: "700", fontSize: "13px", cursor: "pointer",
                            boxShadow: "0 2px 8px rgba(40,201,191,0.25)",
                        }}>✅ Aprovar</button>
                        <button onClick={() => onReject(type, item.id, item.title)} style={{
                            padding: "9px 18px", borderRadius: "10px",
                            border: "1.5px solid rgba(239,68,68,0.2)",
                            background: "rgba(239,68,68,0.06)",
                            color: "#DC2626", fontWeight: "700", fontSize: "13px", cursor: "pointer",
                        }}>❌ Rejeitar</button>
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
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>🎉</div>
            <div style={{ fontSize: "16px", fontWeight: "700", color: "#1E293B", marginBottom: "6px" }}>{msg}</div>
            <div style={{ fontSize: "14px", color: "#94A3B8" }}>Tudo em dia por aqui.</div>
        </div>
    );
}

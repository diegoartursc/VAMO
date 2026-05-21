"use client";
import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333/api";
const FALLBACK_IMG = "https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=900&auto=format&fit=crop";

/* ─── Icons ─── */
const Ic = ({ d, size = 16, color = "currentColor" }: { d: string; size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);
const Icons = {
    back:    () => <Ic d="M19 12H5 M12 19l-7-7 7-7" />,
    check:   () => <Ic d="M20 6L9 17l-5-5" color="#fff" size={15} />,
    x:       () => <Ic d="M18 6L6 18 M6 6l12 12" color="#fff" size={15} />,
    user:    () => <Ic d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 3a4 4 0 110 8 4 4 0 010-8z" size={18} />,
    img:     () => <Ic d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" size={18} />,
    day:     () => <Ic d="M8 6h13 M8 12h13 M8 18h13 M3 6h.01 M3 12h.01 M3 18h.01" size={18} />,
    tag:     () => <Ic d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z M7 7h.01" size={18} />,
    dollar:  () => <Ic d="M12 1v22 M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" size={18} />,
    link:    () => <Ic d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71 M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" size={18} />,
    alert:   () => <Ic d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z M12 9v4 M12 17h.01" size={18} />,
    checklist: () => <Ic d="M9 11l3 3L22 4 M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" size={18} />,
    tip:     () => <Ic d="M12 2a10 10 0 100 20 10 10 0 000-20z M12 16v-4 M12 8h.01" size={18} />,
};

const STATUS_LABEL: Record<string, string> = {
    DRAFT: "Rascunho", PENDING_REVIEW: "Em Revisão",
    APPROVED: "Aprovado", REJECTED: "Rejeitado", ACTIVE: "Ativo",
};
const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
    DRAFT:          { bg: "#F1F5F9", text: "#64748B" },
    PENDING_REVIEW: { bg: "#FEF3C7", text: "#D97706" },
    APPROVED:       { bg: "#DCFCE7", text: "#16A34A" },
    REJECTED:       { bg: "#FEE2E2", text: "#DC2626" },
    ACTIVE:         { bg: "#DCFCE7", text: "#16A34A" },
};

function fmt(n: number, currency = "BRL") {
    try { return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(n); }
    catch { return `R$ ${n}`; }
}
function fmtDate(d: string) {
    return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/* ─── Section accordion ─── */
function Section({ title, icon, children, defaultOpen = true }: { title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid rgba(226,232,240,0.7)", overflow: "hidden", marginBottom: "12px" }}>
            <button onClick={() => setOpen(v => !v)} style={{
                width: "100%", display: "flex", alignItems: "center", gap: "10px",
                padding: "16px 20px", background: "none", border: "none", cursor: "pointer",
                fontFamily: "inherit", textAlign: "left",
            }}>
                <span style={{ color: "#28C9BF" }}>{icon}</span>
                <span style={{ fontSize: "14px", fontWeight: "700", color: "#1E293B", flex: 1 }}>{title}</span>
                <span style={{ color: "#94A3B8", fontSize: "18px", lineHeight: 1 }}>{open ? "−" : "+"}</span>
            </button>
            {open && <div style={{ padding: "0 20px 20px" }}>{children}</div>}
        </div>
    );
}

/* ─── Key-value row ─── */
function KV({ label, value }: { label: string; value?: React.ReactNode }) {
    if (!value && value !== 0) return null;
    return (
        <div style={{ display: "flex", gap: "12px", padding: "8px 0", borderBottom: "1px solid #F1F5F9" }}>
            <span style={{ fontSize: "12px", fontWeight: "600", color: "#94A3B8", minWidth: "140px", flexShrink: 0, paddingTop: "1px" }}>{label}</span>
            <span style={{ fontSize: "13px", color: "#1E293B", flex: 1, lineHeight: 1.5 }}>{value}</span>
        </div>
    );
}

export default function AdminItineraryReviewPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [it, setIt] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionLoading, setActionLoading] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
    const [rejectModal, setRejectModal] = useState(false);
    const [rejectNote, setRejectNote] = useState("");
    const [confirmApprove, setConfirmApprove] = useState(false);
    const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

    const getToken = () => typeof window !== "undefined" ? localStorage.getItem("adminToken") : null;

    useEffect(() => {
        const token = getToken();
        if (!token) { router.push("/dashboard/admin/login"); return; }
        fetch(`${API}/admin/itineraries/${id}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => { if (r.status === 401) { localStorage.removeItem("adminToken"); router.push("/dashboard/admin/login"); return Promise.reject(); } return r.json(); })
            .then(data => { if (data?.error) throw new Error(data.error); setIt(data); })
            .catch(e => setError(e?.message || "Roteiro não encontrado"))
            .finally(() => setLoading(false));
    }, [id, router]);

    const showToast = (msg: string, type: "success" | "error") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const doApprove = async () => {
        setActionLoading(true);
        try {
            const res = await fetch(`${API}/admin/itineraries/${id}/approve`, {
                method: "POST",
                headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
                body: JSON.stringify({}),
            });
            if (!res.ok) throw new Error("Falha ao aprovar");
            setIt((prev: any) => ({ ...prev, status: "APPROVED", approvedAt: new Date().toISOString() }));
            setConfirmApprove(false);
            showToast("✅ Roteiro aprovado com sucesso! Agora está visível no marketplace.", "success");
        } catch (e: any) {
            showToast(e.message || "Erro ao aprovar", "error");
        } finally {
            setActionLoading(false);
        }
    };

    const doReject = async () => {
        setActionLoading(true);
        try {
            const res = await fetch(`${API}/admin/itineraries/${id}/reject`, {
                method: "POST",
                headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
                body: JSON.stringify({ note: rejectNote.trim() || "Não atende aos critérios de qualidade." }),
            });
            if (!res.ok) throw new Error("Falha ao rejeitar");
            setIt((prev: any) => ({ ...prev, status: "REJECTED", approvalNote: rejectNote.trim() || "Não atende aos critérios de qualidade." }));
            setRejectModal(false);
            showToast("Roteiro rejeitado. O criador será notificado.", "success");
        } catch (e: any) {
            showToast(e.message || "Erro ao rejeitar", "error");
        } finally {
            setActionLoading(false);
        }
    };

    /* ─── Collect all images ─── */
    const allImages = it ? [
        ...(it.images || []).map((i: any) => i.url),
        ...(it.highlightPhotos || []),
        ...(it.mediaUrls || []),
    ].filter((u: string, idx: number, arr: string[]) => u && !u.startsWith("blob:") && arr.indexOf(u) === idx) : [];

    /* ─── Loading / error states ─── */
    if (loading) return (
        <div style={{ minHeight: "100vh", background: "#F0F4F8", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif" }}>
            <div style={{ fontSize: "15px", color: "#64748B" }}>Carregando roteiro…</div>
        </div>
    );
    if (error || !it) return (
        <div style={{ minHeight: "100vh", background: "#F0F4F8", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif" }}>
            <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "20px", fontWeight: "700", color: "#1E293B", marginBottom: "8px" }}>{error || "Roteiro não encontrado"}</div>
                <button onClick={() => router.back()} style={{ padding: "10px 20px", borderRadius: "10px", border: "none", background: "#28C9BF", color: "#fff", fontWeight: "700", cursor: "pointer" }}>← Voltar</button>
            </div>
        </div>
    );

    const statusStyle = STATUS_COLOR[it.status] || STATUS_COLOR.DRAFT;
    const isPending = it.status === "PENDING_REVIEW";

    return (
        <div style={{ minHeight: "100vh", background: "#F0F4F8", fontFamily: "'Inter', sans-serif" }}>
            {/* Toast */}
            {toast && (
                <div style={{
                    position: "fixed", top: "20px", right: "20px", zIndex: 9999,
                    padding: "14px 20px", borderRadius: "14px",
                    background: toast.type === "success" ? "rgba(22,163,74,0.95)" : "rgba(220,38,38,0.95)",
                    color: "#fff", fontWeight: "700", fontSize: "14px",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.15)", maxWidth: "360px",
                }}>{toast.msg}</div>
            )}

            {/* Confirm approve modal */}
            {confirmApprove && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
                    <div style={{ background: "#fff", borderRadius: "24px", padding: "32px", width: "100%", maxWidth: "420px", margin: "0 16px", boxShadow: "0 24px 60px rgba(0,0,0,0.2)" }}>
                        <h2 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: "800", color: "#1E293B" }}>Aprovar roteiro?</h2>
                        <p style={{ margin: "0 0 24px", color: "#64748B", fontSize: "14px", lineHeight: 1.6 }}>
                            <strong>"{it.title}"</strong> ficará visível no marketplace para todos os viajantes.
                        </p>
                        <div style={{ display: "flex", gap: "10px" }}>
                            <button onClick={() => setConfirmApprove(false)} style={{ flex: 1, padding: "12px", borderRadius: "12px", border: "1.5px solid #E2E8F0", background: "#fff", cursor: "pointer", fontWeight: "600", fontSize: "14px", color: "#64748B" }}>Cancelar</button>
                            <button onClick={doApprove} disabled={actionLoading} style={{ flex: 1, padding: "12px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg, #28C9BF, #1FA89F)", color: "#fff", cursor: "pointer", fontWeight: "700", fontSize: "14px" }}>
                                {actionLoading ? "Aprovando…" : "✓ Aprovar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject modal */}
            {rejectModal && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
                    <div style={{ background: "#fff", borderRadius: "24px", padding: "32px", width: "100%", maxWidth: "480px", margin: "0 16px", boxShadow: "0 24px 60px rgba(0,0,0,0.2)" }}>
                        <h2 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: "800", color: "#DC2626" }}>Rejeitar roteiro</h2>
                        <p style={{ margin: "0 0 16px", color: "#64748B", fontSize: "14px" }}>Informe o motivo para o criador saber o que melhorar.</p>
                        <textarea
                            value={rejectNote}
                            onChange={e => setRejectNote(e.target.value)}
                            placeholder="Ex: Imagens de baixa qualidade, descrição incompleta, preço fora do padrão…"
                            style={{ width: "100%", minHeight: "110px", padding: "12px 14px", borderRadius: "12px", border: "1.5px solid #E2E8F0", fontSize: "14px", fontFamily: "inherit", resize: "none", outline: "none", boxSizing: "border-box", background: "#F8FAFC", color: "#1E293B" }}
                        />
                        <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                            <button onClick={() => setRejectModal(false)} style={{ flex: 1, padding: "12px", borderRadius: "12px", border: "1.5px solid #E2E8F0", background: "#fff", cursor: "pointer", fontWeight: "600", fontSize: "14px", color: "#64748B" }}>Cancelar</button>
                            <button onClick={doReject} disabled={actionLoading} style={{ flex: 1, padding: "12px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg, #EF4444, #DC2626)", color: "#fff", cursor: "pointer", fontWeight: "700", fontSize: "14px" }}>
                                {actionLoading ? "Rejeitando…" : "✗ Rejeitar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Sticky top bar ─── */}
            <div style={{
                position: "sticky", top: 0, zIndex: 100,
                background: "rgba(255,255,255,0.97)", backdropFilter: "blur(8px)",
                borderBottom: "1px solid rgba(226,232,240,0.8)",
                padding: "0 32px", height: "60px",
                display: "flex", alignItems: "center", gap: "16px",
                boxShadow: "0 1px 4px rgba(26,50,99,0.06)",
            }}>
                <button onClick={() => router.push("/dashboard/admin?tab=itineraries")} style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    padding: "8px 14px", borderRadius: "10px", border: "1px solid #E2E8F0",
                    background: "#fff", cursor: "pointer", fontSize: "13px", fontWeight: "600", color: "#64748B", flexShrink: 0,
                }}>
                    {Icons.back()} Voltar
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "15px", fontWeight: "700", color: "#1E293B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.title}</div>
                    <div style={{ fontSize: "12px", color: "#94A3B8" }}>{it.destination}{it.country ? `, ${it.country}` : ""}</div>
                </div>
                <span style={{ padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: "700", background: statusStyle.bg, color: statusStyle.text, flexShrink: 0 }}>
                    {STATUS_LABEL[it.status] || it.status}
                </span>
                {/* Action buttons — always visible in top bar */}
                {isPending && (
                    <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                        <button onClick={() => setRejectModal(true)} style={{
                            display: "flex", alignItems: "center", gap: "6px",
                            padding: "9px 18px", borderRadius: "10px", border: "1.5px solid rgba(239,68,68,0.25)",
                            background: "rgba(239,68,68,0.06)", color: "#DC2626",
                            fontWeight: "700", fontSize: "13px", cursor: "pointer", flexShrink: 0,
                        }}>
                            {Icons.x()} Rejeitar
                        </button>
                        <button onClick={() => setConfirmApprove(true)} style={{
                            display: "flex", alignItems: "center", gap: "6px",
                            padding: "9px 18px", borderRadius: "10px", border: "none",
                            background: "linear-gradient(135deg, #28C9BF, #1FA89F)",
                            color: "#fff", fontWeight: "700", fontSize: "13px", cursor: "pointer",
                            boxShadow: "0 2px 8px rgba(40,201,191,0.3)", flexShrink: 0,
                        }}>
                            {Icons.check()} Aprovar
                        </button>
                    </div>
                )}
                {!isPending && it.status === "APPROVED" && (
                    <button onClick={() => setRejectModal(true)} style={{
                        padding: "9px 18px", borderRadius: "10px", border: "1.5px solid rgba(239,68,68,0.25)",
                        background: "rgba(239,68,68,0.06)", color: "#DC2626",
                        fontWeight: "700", fontSize: "13px", cursor: "pointer",
                    }}>Rejeitar</button>
                )}
                {!isPending && it.status === "REJECTED" && (
                    <button onClick={() => setConfirmApprove(true)} style={{
                        padding: "9px 18px", borderRadius: "10px", border: "none",
                        background: "linear-gradient(135deg, #28C9BF, #1FA89F)",
                        color: "#fff", fontWeight: "700", fontSize: "13px", cursor: "pointer",
                    }}>Aprovar</button>
                )}
            </div>

            {/* ─── Main content ─── */}
            <div style={{ maxWidth: "900px", margin: "0 auto", padding: "24px 24px 80px" }}>

                {/* ── Cover image hero ── */}
                {allImages.length > 0 && (
                    <div style={{ borderRadius: "20px", overflow: "hidden", marginBottom: "16px", position: "relative" }}>
                        <img
                            src={imgErrors[allImages[0]] ? FALLBACK_IMG : allImages[0]}
                            alt={it.title}
                            onError={() => setImgErrors(p => ({ ...p, [allImages[0]]: true }))}
                            style={{ width: "100%", height: "280px", objectFit: "cover", display: "block" }}
                        />
                        <div style={{
                            position: "absolute", inset: 0,
                            background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 50%)",
                        }} />
                        <div style={{ position: "absolute", bottom: "20px", left: "24px" }}>
                            <div style={{ fontSize: "24px", fontWeight: "800", color: "#fff", textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}>{it.title}</div>
                            <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.85)", marginTop: "4px" }}>{it.destination}{it.country ? `, ${it.country}` : ""}</div>
                        </div>
                    </div>
                )}

                {/* ── 1. Identificação ── */}
                <Section title="Identificação" icon={Icons.tag()}>
                    <KV label="Título" value={it.title} />
                    <KV label="Destino" value={`${it.destination}${it.country ? `, ${it.country}` : ""}`} />
                    <KV label="Duração" value={it.duration ? `${it.duration} dias` : undefined} />
                    <KV label="Idioma" value={it.language} />
                    <KV label="Status" value={
                        <span style={{ padding: "2px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700", background: statusStyle.bg, color: statusStyle.text }}>
                            {STATUS_LABEL[it.status] || it.status}
                        </span>
                    } />
                    <KV label="Score de qualidade" value={it.qualityScore !== undefined ? (
                        <span style={{ fontWeight: "700", color: it.qualityScore >= 70 ? "#16A34A" : it.qualityScore >= 40 ? "#D97706" : "#DC2626" }}>
                            {it.qualityScore}%
                        </span>
                    ) : undefined} />
                    <KV label="Criado em" value={fmtDate(it.createdAt)} />
                    <KV label="Atualizado em" value={fmtDate(it.updatedAt)} />
                    {it.approvedAt && <KV label="Aprovado em" value={fmtDate(it.approvedAt)} />}
                    {it.approvalNote && (
                        <div style={{ marginTop: "12px", padding: "12px 14px", borderRadius: "10px", background: "#FEE2E2", border: "1px solid rgba(220,38,38,0.15)" }}>
                            <div style={{ fontSize: "11px", fontWeight: "700", color: "#DC2626", marginBottom: "4px" }}>MOTIVO DA REJEIÇÃO</div>
                            <div style={{ fontSize: "13px", color: "#7F1D1D" }}>{it.approvalNote}</div>
                        </div>
                    )}
                    {(it.travelStyles?.length > 0 || it.categories?.length > 0) && (
                        <div style={{ marginTop: "10px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
                            {[...(it.travelStyles || []), ...(it.categories || [])].map((t: string) => (
                                <span key={t} style={{ padding: "3px 10px", borderRadius: "20px", background: "#F1F5F9", color: "#475569", fontSize: "12px", fontWeight: "600" }}>{t}</span>
                            ))}
                        </div>
                    )}
                </Section>

                {/* ── 2. Criador ── */}
                <Section title="Dados do Criador" icon={Icons.user()}>
                    {it.creator?.traveler ? (
                        <>
                            <KV label="Nome" value={it.creator.traveler.name} />
                            <KV label="E-mail" value={<a href={`mailto:${it.creator.traveler.email}`} style={{ color: "#28C9BF", textDecoration: "none" }}>{it.creator.traveler.email}</a>} />
                            <KV label="ID do Traveler" value={<code style={{ fontSize: "11px", background: "#F1F5F9", padding: "2px 6px", borderRadius: "4px" }}>{it.creator.traveler.id}</code>} />
                            <KV label="ID do Creator" value={<code style={{ fontSize: "11px", background: "#F1F5F9", padding: "2px 6px", borderRadius: "4px" }}>{it.creator.id}</code>} />
                            <KV label="Verificação" value={it.creator.verificationLevel} />
                            {it.creator.balance && (
                                <KV label="Saldo disponível" value={fmt(it.creator.balance.availableBalance)} />
                            )}
                        </>
                    ) : (
                        <div style={{ fontSize: "13px", color: "#94A3B8" }}>Dados do criador indisponíveis.</div>
                    )}
                </Section>

                {/* ── 3. Preço / Comercial ── */}
                <Section title="Preço e Informações Comerciais" icon={Icons.dollar()}>
                    <KV label="Preço" value={<span style={{ fontWeight: "700", color: "#1E293B", fontSize: "15px" }}>{fmt(it.price, it.currency || "BRL")}</span>} />
                    {it.promoPrice && <KV label="Preço promocional" value={fmt(it.promoPrice, it.currency || "BRL")} />}
                    <KV label="Moeda" value={it.currency} />
                    <KV label="Parcelas" value={it.installments ? `${it.installments}x` : undefined} />
                    <KV label="Acesso imediato" value={it.immediateAccess ? "Sim" : "Não"} />
                    <KV label="Acesso vitalício" value={it.lifetimeAccess ? "Sim" : "Não"} />
                    <KV label="Download offline" value={it.offlineDownload ? "Sim" : "Não"} />
                </Section>

                {/* ── 4. Comprovante de viagem ── */}
                {it.travelProofUrl && (
                    <Section title="Comprovante de Viagem" icon={Icons.link()}>
                        {/\.(jpg|jpeg|png|webp|gif)$/i.test(it.travelProofUrl) ? (
                            <img
                                src={it.travelProofUrl}
                                alt="Comprovante"
                                style={{ maxWidth: "100%", maxHeight: "360px", objectFit: "contain", borderRadius: "10px", border: "1px solid #E2E8F0" }}
                                onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                            />
                        ) : (
                            <a href={it.travelProofUrl} target="_blank" rel="noopener noreferrer" style={{
                                display: "inline-flex", alignItems: "center", gap: "8px",
                                padding: "10px 16px", borderRadius: "10px", border: "1px solid #E2E8F0",
                                background: "#F8FAFC", color: "#1FA89F", fontWeight: "600", fontSize: "13px", textDecoration: "none",
                            }}>
                                {Icons.link()} Abrir comprovante
                            </a>
                        )}
                    </Section>
                )}

                {/* ── 5. Galeria de imagens ── */}
                {allImages.length > 0 && (
                    <Section title={`Galeria de Imagens (${allImages.length})`} icon={Icons.img()}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "10px" }}>
                            {allImages.map((url: string, i: number) => (
                                <a key={i} href={url} target="_blank" rel="noopener noreferrer" style={{ display: "block", borderRadius: "10px", overflow: "hidden", aspectRatio: "4/3" }}>
                                    <img
                                        src={imgErrors[url] ? FALLBACK_IMG : url}
                                        alt={`Imagem ${i + 1}`}
                                        onError={() => setImgErrors(p => ({ ...p, [url]: true }))}
                                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                                    />
                                </a>
                            ))}
                        </div>
                    </Section>
                )}

                {/* ── 6. Dias do roteiro ── */}
                {it.days?.length > 0 && (
                    <Section title={`Roteiro Dia a Dia (${it.days.length} dias)`} icon={Icons.day()}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            {it.days.map((day: any) => (
                                <div key={day.id} style={{ padding: "14px 16px", borderRadius: "12px", border: "1px solid #E2E8F0", background: "#F8FAFC" }}>
                                    <div style={{ fontWeight: "700", fontSize: "14px", color: "#1E293B", marginBottom: "6px" }}>
                                        Dia {day.dayNumber}{day.title ? ` — ${day.title}` : ""}
                                    </div>
                                    {day.description && <div style={{ fontSize: "13px", color: "#475569", lineHeight: 1.6, marginBottom: "8px" }}>{day.description}</div>}
                                    {day.activities?.length > 0 && (
                                        <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "6px" }}>
                                            {day.activities.map((act: any, ai: number) => (
                                                <div key={ai} style={{ fontSize: "12px", color: "#64748B", display: "flex", gap: "6px" }}>
                                                    {act.time && <span style={{ fontWeight: "600", color: "#94A3B8", minWidth: "44px" }}>{act.time}</span>}
                                                    <span>{act.description || act.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </Section>
                )}

                {/* ── 7. Atrações ── */}
                {it.attractions?.length > 0 && (
                    <Section title={`Atrações e Passeios (${it.attractions.length})`} icon={Icons.tag()}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            {it.attractions.map((a: any, i: number) => (
                                <div key={i} style={{ padding: "12px 14px", borderRadius: "10px", border: "1px solid #E2E8F0" }}>
                                    <div style={{ fontWeight: "700", fontSize: "13px", color: "#1E293B" }}>{a.name}</div>
                                    {a.description && <div style={{ fontSize: "12px", color: "#64748B", marginTop: "4px" }}>{a.description}</div>}
                                    {a.estimatedCost && <div style={{ fontSize: "12px", color: "#28C9BF", marginTop: "4px", fontWeight: "600" }}>{fmt(a.estimatedCost, a.currency || "BRL")}</div>}
                                </div>
                            ))}
                        </div>
                    </Section>
                )}

                {/* ── 8. Restaurantes ── */}
                {it.restaurants?.length > 0 && (
                    <Section title={`Restaurantes (${it.restaurants.length})`} icon={Icons.tip()}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            {it.restaurants.map((r: any, i: number) => (
                                <div key={i} style={{ padding: "12px 14px", borderRadius: "10px", border: "1px solid #E2E8F0" }}>
                                    <div style={{ fontWeight: "700", fontSize: "13px", color: "#1E293B" }}>{r.name}</div>
                                    {r.cuisine && <div style={{ fontSize: "12px", color: "#64748B" }}>{r.cuisine}</div>}
                                    {r.priceRange && <div style={{ fontSize: "12px", color: "#94A3B8" }}>{r.priceRange}</div>}
                                    {r.note && <div style={{ fontSize: "12px", color: "#475569", marginTop: "4px", fontStyle: "italic" }}>{r.note}</div>}
                                </div>
                            ))}
                        </div>
                    </Section>
                )}

                {/* ── 9. Estimativa de gastos ── */}
                {it.estimatedSpending && (
                    <Section title="Estimativa de Gastos" icon={Icons.dollar()} defaultOpen={false}>
                        {it.estimatedSpending.manualEntries?.length > 0 && (
                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                {it.estimatedSpending.manualEntries.map((e: any, i: number) => (
                                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #F1F5F9" }}>
                                        <span style={{ fontSize: "13px", color: "#475569" }}>{e.category || e.label}</span>
                                        <span style={{ fontSize: "13px", fontWeight: "600", color: "#1E293B" }}>
                                            {fmt(parseFloat(e.priceValue || e.value || 0), e.currency || it.currency || "BRL")}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                        {it.estimatedSpending.min && <KV label="Mínimo estimado" value={fmt(it.estimatedSpending.min, it.currency)} />}
                        {it.estimatedSpending.max && <KV label="Máximo estimado" value={fmt(it.estimatedSpending.max, it.currency)} />}
                        {!it.estimatedSpending.manualEntries?.length && !it.estimatedSpending.min && (
                            <div style={{ fontSize: "13px", color: "#94A3B8" }}>Sem detalhamento de gastos.</div>
                        )}
                    </Section>
                )}

                {/* ── 10. Dicas ── */}
                {it.generalTips?.length > 0 && (
                    <Section title={`Dicas Exclusivas (${it.generalTips.filter((t: string) => t?.trim()).length})`} icon={Icons.tip()} defaultOpen={false}>
                        <ul style={{ margin: 0, padding: "0 0 0 16px", display: "flex", flexDirection: "column", gap: "6px" }}>
                            {it.generalTips.filter((t: string) => t?.trim()).map((tip: string, i: number) => (
                                <li key={i} style={{ fontSize: "13px", color: "#475569", lineHeight: 1.6 }}>{tip}</li>
                            ))}
                        </ul>
                    </Section>
                )}

                {/* ── 11. Checklist ── */}
                {(it.checklists?.length > 0 || it.checklistItems?.length > 0) && (
                    <Section title={`Checklist (${(it.checklists || it.checklistItems || []).length} itens)`} icon={Icons.checklist()} defaultOpen={false}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            {(it.checklists || it.checklistItems || []).map((c: any, i: number) => (
                                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "8px", padding: "6px 0", borderBottom: "1px solid #F1F5F9" }}>
                                    <span style={{ fontSize: "14px", color: "#28C9BF", flexShrink: 0 }}>☐</span>
                                    <div>
                                        <span style={{ fontSize: "13px", color: "#1E293B" }}>{c.item || c.text}</span>
                                        {c.category && <span style={{ fontSize: "11px", color: "#94A3B8", marginLeft: "6px" }}>· {c.category}</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Section>
                )}

                {/* ── 12. Informações de voo ── */}
                {it.flightInfo && (it.flightInfo.outbound?.airline || it.flightInfo.return?.airline) && (
                    <Section title="Informações de Voo" icon={Icons.back()} defaultOpen={false}>
                        {it.flightInfo.outbound?.airline && (
                            <>
                                <div style={{ fontSize: "12px", fontWeight: "700", color: "#94A3B8", marginBottom: "6px" }}>IDA</div>
                                <KV label="Companhia" value={it.flightInfo.outbound.airline} />
                                <KV label="Origem" value={`${it.flightInfo.outbound.originCity} (${it.flightInfo.outbound.originAirport})`} />
                                <KV label="Destino" value={it.flightInfo.outbound.destinationAirport} />
                                <KV label="Partida" value={it.flightInfo.outbound.departureDate} />
                            </>
                        )}
                        {it.flightInfo.return?.airline && (
                            <>
                                <div style={{ fontSize: "12px", fontWeight: "700", color: "#94A3B8", marginTop: "12px", marginBottom: "6px" }}>VOLTA</div>
                                <KV label="Companhia" value={it.flightInfo.return.airline} />
                            </>
                        )}
                        {it.flightInfo.tips?.length > 0 && (
                            <div style={{ marginTop: "10px" }}>
                                <div style={{ fontSize: "12px", fontWeight: "700", color: "#94A3B8", marginBottom: "6px" }}>DICAS DE VOO</div>
                                {it.flightInfo.tips.map((t: string, i: number) => <div key={i} style={{ fontSize: "13px", color: "#475569", marginBottom: "4px" }}>• {t}</div>)}
                            </div>
                        )}
                    </Section>
                )}

                {/* ── 13. Highlights e Inclusions ── */}
                {(it.highlights?.length > 0 || it.inclusions?.length > 0) && (
                    <Section title="Destaques e Inclusões" icon={Icons.checklist()} defaultOpen={false}>
                        {it.highlights?.filter(Boolean).length > 0 && (
                            <>
                                <div style={{ fontSize: "12px", fontWeight: "700", color: "#94A3B8", marginBottom: "6px" }}>DESTAQUES</div>
                                {it.highlights.filter(Boolean).map((h: string, i: number) => <div key={i} style={{ fontSize: "13px", color: "#475569", marginBottom: "4px" }}>★ {h}</div>)}
                            </>
                        )}
                        {it.inclusions?.filter(Boolean).length > 0 && (
                            <>
                                <div style={{ fontSize: "12px", fontWeight: "700", color: "#94A3B8", marginTop: "10px", marginBottom: "6px" }}>INCLUSO</div>
                                {it.inclusions.filter(Boolean).map((h: string, i: number) => <div key={i} style={{ fontSize: "13px", color: "#475569", marginBottom: "4px" }}>✓ {h}</div>)}
                            </>
                        )}
                    </Section>
                )}

                {/* ── Ações administrativas no rodapé (para não esquecer) ── */}
                {isPending && (
                    <div style={{
                        background: "#fff", borderRadius: "16px", border: "1px solid rgba(226,232,240,0.7)",
                        padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px",
                    }}>
                        <div>
                            <div style={{ fontSize: "14px", fontWeight: "700", color: "#1E293B" }}>Decisão administrativa</div>
                            <div style={{ fontSize: "12px", color: "#94A3B8", marginTop: "2px" }}>Analise o conteúdo acima antes de decidir.</div>
                        </div>
                        <div style={{ display: "flex", gap: "10px" }}>
                            <button onClick={() => setRejectModal(true)} style={{
                                padding: "11px 22px", borderRadius: "10px", border: "1.5px solid rgba(239,68,68,0.25)",
                                background: "rgba(239,68,68,0.06)", color: "#DC2626",
                                fontWeight: "700", fontSize: "14px", cursor: "pointer",
                            }}>✗ Rejeitar</button>
                            <button onClick={() => setConfirmApprove(true)} style={{
                                padding: "11px 22px", borderRadius: "10px", border: "none",
                                background: "linear-gradient(135deg, #28C9BF, #1FA89F)",
                                color: "#fff", fontWeight: "700", fontSize: "14px", cursor: "pointer",
                                boxShadow: "0 4px 12px rgba(40,201,191,0.3)",
                            }}>✓ Aprovar roteiro</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

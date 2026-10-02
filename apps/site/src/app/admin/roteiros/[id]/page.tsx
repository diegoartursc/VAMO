"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AdminDataProvider, useAdmin, ApproveRejectModal, API, STATUS_LABEL, STATUS_COLOR, Status } from "../../shared";
import CostProofsModal from "../../CostProofsModal";
import ScoreBreakdownModal from "../../ScoreBreakdownModal";

const box: React.CSSProperties = { background: "#fff", borderRadius: "18px", padding: "20px 22px", border: "1px solid rgba(226,232,240,0.7)", marginBottom: "16px" };
const h2: React.CSSProperties = { fontSize: "15px", fontWeight: 800, color: "#1A3263", margin: "0 0 12px" };
const muted: React.CSSProperties = { fontSize: "13px", color: "#5A6B8C", lineHeight: 1.6 };
const row: React.CSSProperties = { padding: "10px 0", borderBottom: "1px solid #F0F2F5" };

const asArray = (v: any): any[] => (Array.isArray(v) ? v.filter(Boolean) : []);
const fmtDate = (v?: string) => (v ? new Date(v).toLocaleDateString("pt-BR") : "");

function Section({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
    if (count === 0) return null;
    return (
        <div style={box}>
            <h2 style={h2}>{title}{count != null ? ` (${count})` : ""}</h2>
            {children}
        </div>
    );
}

function DetailContent() {
    const { id } = useParams<{ id: string }>();
    const { getToken, showToast } = useAdmin();
    const [it, setIt] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [modal, setModal] = useState<{ type: "approve" | "reject"; itemType: "itineraries"; id: string; title: string } | null>(null);
    const [acting, setActing] = useState(false);
    const [proofsOpen, setProofsOpen] = useState(false);
    const [scoreOpen, setScoreOpen] = useState(false);

    const load = useCallback(async () => {
        try {
            const res = await fetch(`${API}/admin/itineraries/${id}`, { headers: { Authorization: `Bearer ${getToken()}` }, cache: "no-store" });
            const body = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(body?.error || `Erro ${res.status}`);
            setIt(body.itinerary ?? body);
        } catch (e: any) {
            setError(e?.message || "Não foi possível carregar o roteiro.");
        }
    }, [id, getToken]);

    useEffect(() => { load(); }, [load]);

    const decide = async (note: string) => {
        if (!modal) return;
        setActing(true);
        try {
            const res = await fetch(`${API}/admin/itineraries/${id}/${modal.type === "approve" ? "approve" : "reject"}`, {
                method: "POST",
                headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
                body: JSON.stringify(modal.type === "reject" ? { note } : {}),
            });
            const body = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(body?.error || "Erro ao executar ação");
            showToast(modal.type === "approve" ? "Aprovado! O roteirista recebeu um e-mail." : "Rejeitado. O motivo foi enviado ao roteirista.", "success");
            setModal(null);
            await load();
        } catch (e: any) {
            showToast(e?.message || "Erro ao executar ação", "error");
        } finally { setActing(false); }
    };

    if (error) return (
        <div className="dash-container">
            <Link href="/admin/roteiros" style={{ color: "#1FA89F", fontWeight: 700, textDecoration: "none" }}>← Roteiros</Link>
            <div style={{ ...box, marginTop: 16, color: "#DC2626", fontWeight: 600 }}>{error}</div>
        </div>
    );
    if (!it) return <div className="dash-container"><div style={muted}>Carregando roteiro…</div></div>;

    const status = it.status as Status;
    const isPending = status === "PENDING_REVIEW";
    const cover = asArray(it.images).map((i: any) => i.url).concat(asArray(it.highlightPhotos)).filter(Boolean);
    const days = asArray(it.days);
    const accommodations = asArray(it.accommodations);
    const transports = asArray(it.transports);
    const attractions = asArray(it.attractions);
    const restaurants = asArray(it.restaurants);
    const tips = asArray(it.generalTips).filter((t: any) => String(t).trim());
    const checklist = asArray(it.checklists);
    const extras = asArray(it.extraSpendingItems);
    const out = it.flightInfo?.outbound, ret = it.flightInfo?.return;
    const hasFlight = !!(out?.originCity || ret?.originCity);

    return (
        <div className="dash-container" style={{ maxWidth: 980 }}>
            <Link href="/admin/roteiros" style={{ color: "#1FA89F", fontWeight: 700, textDecoration: "none", fontSize: 14 }}>← Roteiros</Link>

            <div style={{ ...box, marginTop: 14, display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 260 }}>
                    <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: `${STATUS_COLOR[status]}14`, color: STATUS_COLOR[status] }}>{STATUS_LABEL[status] ?? status}</span>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1A3263", margin: "10px 0 6px" }}>{it.title}</h1>
                    {it.subtitle && <div style={{ ...muted, marginBottom: 6 }}>{it.subtitle}</div>}
                    <div style={muted}>
                        {it.destination}, {it.country} · {it.duration} dias · <b style={{ color: "#1FA89F" }}>{it.currency || "AUD"} {Number(it.price || 0).toFixed(2)}</b>
                    </div>
                    <div style={{ ...muted, marginTop: 4 }}>
                        Roteirista: <b>{it.creator?.traveler?.name}</b> ({it.creator?.traveler?.email}) · enviado em {fmtDate(it.updatedAt || it.createdAt)}
                    </div>
                    {it.qualityScore != null && (
                        <button onClick={() => setScoreOpen(true)} style={{ marginTop: 6, border: "none", background: "none", padding: 0, cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#1FA89F", textDecoration: "underline dotted" }}>Score de qualidade: {it.qualityScore}% ⓘ</button>
                    )}
                    {asArray(it.categories).length > 0 && <div style={{ ...muted, marginTop: 4 }}>Categorias: {asArray(it.categories).join(", ")}</div>}
                    {it.approvalNote && <div style={{ marginTop: 8, fontSize: 13, color: "#DC2626" }}>Motivo da última rejeição: {it.approvalNote}</div>}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {it.travelProofUrl
                        ? <a href={it.travelProofUrl} target="_blank" rel="noopener noreferrer" style={btn("#fff", "#1A3263", "#E2E8F0")}>📎 Comprovante de viagem</a>
                        : <span style={{ fontSize: 12, color: "#DC2626", fontWeight: 700, alignSelf: "center" }}>⚠️ Sem comprovante de viagem</span>}
                    <button onClick={() => setProofsOpen(true)} style={btn("rgba(40,201,191,0.08)", "#1FA89F", "rgba(40,201,191,0.25)")}>🛡️ Comprovantes de custo</button>
                    {isPending && <>
                        <button onClick={() => setModal({ type: "approve", itemType: "itineraries", id, title: it.title })} style={btn("#1FA89F", "#fff", "#1FA89F")}>✓ Aprovar</button>
                        <button onClick={() => setModal({ type: "reject", itemType: "itineraries", id, title: it.title })} style={btn("rgba(239,68,68,0.06)", "#DC2626", "rgba(239,68,68,0.25)")}>✕ Rejeitar</button>
                    </>}
                </div>
            </div>

            {!isPending && (
                <div style={{ ...box, background: "#F8FAFC", fontSize: 13, color: "#5A6B8C" }}>
                    {status === "APPROVED" && "Aprovado pelo fluxo antigo, ainda não publicado. O roteirista pode publicar no Portal do Roteirista."}
                    {status === "ACTIVE" && "Publicado: este roteiro está à venda no app."}
                    {status === "REJECTED" && "Rejeitado. O roteirista pode corrigir e reenviar para revisão."}
                    {!["APPROVED", "ACTIVE", "REJECTED"].includes(status) && "Este roteiro não está aguardando revisão."}
                </div>
            )}

            {cover.length > 0 && (
                <div style={{ ...box, display: "flex", gap: 10, overflowX: "auto" }}>
                    {cover.slice(0, 12).map((u: string, i: number) => (
                        <a key={i} href={u} target="_blank" rel="noopener noreferrer"><img src={u} alt="" style={{ height: 120, borderRadius: 12, objectFit: "cover" }} /></a>
                    ))}
                </div>
            )}

            <Section title="Descrição">
                <div style={{ ...muted, whiteSpace: "pre-wrap" }}>{it.description || "—"}</div>
                {asArray(it.highlights).length > 0 && (
                    <ul style={{ ...muted, margin: "10px 0 0", paddingLeft: 18 }}>{asArray(it.highlights).map((h: string, i: number) => <li key={i}>{h}</li>)}</ul>
                )}
            </Section>

            {hasFlight && (
                <Section title="Voo">
                    {[["Ida", out], ["Volta", ret]].map(([label, leg]: any) => leg?.originCity ? (
                        <div key={label} style={row}><b style={{ color: "#1A3263" }}>{label}:</b> <span style={muted}>{leg.originCity} → {leg.destinationCity || "—"} · {fmtDate(leg.departureDate)}{leg.airline ? ` · ${leg.airline}` : ""}</span></div>
                    ) : null)}
                </Section>
            )}

            <Section title="Hospedagem" count={accommodations.length}>
                {accommodations.map((a: any, i: number) => (
                    <div key={i} style={row}><b style={{ color: "#1A3263" }}>{a.name}</b><div style={muted}>{[a.location, a.type, a.nights ? `${a.nights} noites` : ""].filter(Boolean).join(" · ")}</div>{a.description && <div style={muted}>{a.description}</div>}</div>
                ))}
            </Section>

            <Section title="Passeios e atrações" count={attractions.length}>
                {attractions.map((a: any, i: number) => (
                    <div key={i} style={row}><b style={{ color: "#1A3263" }}>{a.name}</b><div style={muted}>{[a.location, a.duration].filter(Boolean).join(" · ")}</div>{a.description && <div style={muted}>{a.description}</div>}</div>
                ))}
            </Section>

            <Section title="Itinerário por dia" count={days.length}>
                {days.map((d: any) => (
                    <div key={d.id || d.dayNumber} style={row}>
                        <b style={{ color: "#1A3263" }}>Dia {d.dayNumber}{d.title ? ` — ${d.title}` : ""}</b>
                        {d.description && <div style={{ ...muted, whiteSpace: "pre-wrap" }}>{d.description}</div>}
                        {asArray(d.activities).length > 0 && (
                            <ul style={{ ...muted, margin: "6px 0 0", paddingLeft: 18 }}>
                                {asArray(d.activities).map((a: any, i: number) => <li key={a.id || i}>{a.time ? `${a.time} · ` : ""}{a.title}{a.description ? ` — ${a.description}` : ""}</li>)}
                            </ul>
                        )}
                    </div>
                ))}
            </Section>

            <Section title="Transporte" count={transports.length}>
                {transports.map((t: any, i: number) => <div key={i} style={row}><div style={muted}><b style={{ color: "#1A3263" }}>{t.passTypes || "Transporte"}</b> — {t.description}</div></div>)}
            </Section>

            <Section title="Restaurantes" count={restaurants.length}>
                {restaurants.map((r: any, i: number) => <div key={i} style={row}><b style={{ color: "#1A3263" }}>{r.name}</b><div style={muted}>{[r.cuisine, r.location].filter(Boolean).join(" · ")}</div></div>)}
            </Section>

            <Section title="Dicas" count={tips.length}>
                <ul style={{ ...muted, margin: 0, paddingLeft: 18 }}>{tips.map((t: string, i: number) => <li key={i}>{t}</li>)}</ul>
            </Section>

            <Section title="Gastos extras" count={extras.length}>
                {extras.map((e: any, i: number) => <div key={i} style={row}><b style={{ color: "#1A3263" }}>{e.title}</b><div style={muted}>{[e.description, e.value ? `${e.currency || ""} ${e.value}` : ""].filter(Boolean).join(" · ")}</div></div>)}
            </Section>

            <Section title="Checklist" count={checklist.length}>
                <ul style={{ ...muted, margin: 0, paddingLeft: 18 }}>{checklist.map((c: any, i: number) => <li key={c.id || i}>{c.item}</li>)}</ul>
            </Section>

            <ApproveRejectModal modal={modal} onClose={() => setModal(null)} onConfirm={decide} loading={acting} />
            {scoreOpen && <ScoreBreakdownModal itineraryId={id} storedScore={it.qualityScore} getToken={getToken} onClose={() => setScoreOpen(false)} />}
            {proofsOpen && <CostProofsModal itineraryId={id} getToken={getToken} onClose={() => setProofsOpen(false)} onToast={showToast} />}
        </div>
    );
}

function btn(bg: string, color: string, border: string): React.CSSProperties {
    return { padding: "9px 14px", borderRadius: 10, border: `1.5px solid ${border}`, background: bg, color, fontWeight: 700, fontSize: 13, cursor: "pointer", textDecoration: "none", display: "inline-flex", alignItems: "center" };
}

export default function AdminItineraryDetailPage() {
    return <AdminDataProvider><DetailContent /></AdminDataProvider>;
}

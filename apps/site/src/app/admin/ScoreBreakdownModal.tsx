"use client";

import React, { useEffect, useState } from "react";
import { calcQualityBlocks, type ScoreBlock, type ScoreInput } from "@vamo/shared/itinerary";
import { API } from "./shared";

const arr = (v: any): any[] => (Array.isArray(v) ? v.filter(Boolean) : []);

// Converte o roteiro salvo (formato da API admin) no formato do formulário,
// para recalcular o score com a MESMA fórmula usada no cadastro.
function toScoreInput(it: any): ScoreInput {
    return {
        title: it.title, description: it.description, destination: it.destination, country: it.country,
        locations: arr(it.locations), travelStyles: arr(it.travelStyles), categories: arr(it.categories),
        price: Number(it.price) || 0, highlightPhotos: arr(it.highlightPhotos),
        images: arr(it.images).map((i: any) => (typeof i === "string" ? i : i.url)),
        duration: Number(it.duration) || 0,
        days: arr(it.days).map((d: any) => ({ description: d.description, activities: arr(d.activities) })),
        accommodations: arr(it.accommodations), attractions: arr(it.attractions), restaurants: arr(it.restaurants),
        transports: arr(it.transports), extraSpendingItems: arr(it.extraSpendingItems),
        flightSpending: it.flightInfo?.spending, flightCost: it.flightInfo?.cost,
        generalTips: arr(it.generalTips), checklistItems: arr(it.checklists),
        highlights: arr(it.highlights), travelProofUrl: it.travelProofUrl || undefined,
    };
}

export default function ScoreBreakdownModal({ itineraryId, storedScore, getToken, onClose }: {
    itineraryId: string; storedScore?: number | null; getToken: () => string | null; onClose: () => void;
}) {
    const [blocks, setBlocks] = useState<ScoreBlock[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch(`${API}/admin/itineraries/${itineraryId}`, { headers: { Authorization: `Bearer ${getToken()}` }, cache: "no-store" })
            .then(async r => { const b = await r.json().catch(() => null); if (!r.ok) throw new Error(b?.error || `Erro ${r.status}`); setBlocks(calcQualityBlocks(toScoreInput(b.itinerary ?? b))); })
            .catch(e => setError(e?.message || "Não foi possível calcular o score."));
    }, [itineraryId, getToken]);

    const total = blocks ? Math.min(blocks.reduce((s, b) => s + b.earned, 0), 100) : null;

    return (
        <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 24, padding: 28, width: "100%", maxWidth: 560, maxHeight: "85vh", overflowY: "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.2)" }}>
                <div style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
                    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#1A3263", flex: 1 }}>Como o score foi calculado</h2>
                    <button onClick={onClose} aria-label="Fechar" style={{ border: "none", background: "none", fontSize: 20, cursor: "pointer", color: "#98989D" }}>✕</button>
                </div>
                <p style={{ margin: "0 0 16px", fontSize: 13, color: "#5A6B8C" }}>
                    Pontuação de qualidade do conteúdo (0 a 100), pelos mesmos critérios que o roteirista vê no cadastro.
                    {total != null && <> Total recalculado agora: <b style={{ color: "#1A3263" }}>{total}%</b>.</>}
                    {storedScore != null && total != null && storedScore !== total && <> (Score salvo no envio: {storedScore}% — o roteiro pode ter mudado depois.)</>}
                </p>
                {error && <div style={{ color: "#DC2626", fontSize: 13 }}>{error}</div>}
                {!blocks && !error && <div style={{ color: "#5A6B8C", fontSize: 13 }}>Calculando…</div>}
                {blocks?.map(b => (
                    <div key={b.label} style={{ border: "1px solid #EEF1F5", borderRadius: 14, padding: "12px 14px", marginBottom: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
                            <b style={{ flex: 1, color: "#1A3263", fontSize: 14 }}>{b.label}</b>
                            <span style={{ fontSize: 13, fontWeight: 800, color: b.earned >= b.max ? "#16A34A" : b.earned > 0 ? "#D97706" : "#DC2626" }}>{b.earned}/{b.max}</span>
                        </div>
                        {b.criteria.map((c, i) => (
                            <div key={i} style={{ display: "flex", gap: 8, fontSize: 13, color: c.done ? "#1A3263" : "#98989D", padding: "2px 0" }}>
                                <span style={{ color: c.done ? "#16A34A" : "#CBD5E1", fontWeight: 800 }}>{c.done ? "✓" : "○"}</span>
                                <span style={{ flex: 1 }}>{c.text}</span>
                                <span style={{ fontWeight: 700 }}>{c.pts > 0 ? `+${c.pts}` : ""}</span>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

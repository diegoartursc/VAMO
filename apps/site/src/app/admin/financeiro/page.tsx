"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AdminDataProvider, useAdmin, API } from "../shared";

interface Sale {
    id: string; createdAt: string; price: number; commission: number; net: number; currency: string;
    itineraryId: string; itineraryTitle: string; creatorName: string | null;
    buyerName: string; buyerEmail: string; provider: string | null; paymentStatus: string | null;
}

const money = (v: number, c = "AUD") => new Intl.NumberFormat("en-AU", { style: "currency", currency: c }).format(v || 0);
const card: React.CSSProperties = { background: "#fff", borderRadius: "18px", padding: "18px 20px", border: "1px solid rgba(226,232,240,0.7)" };

function FinanceContent() {
    const { getToken } = useAdmin();
    const [sales, setSales] = useState<Sale[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch(`${API}/admin/sales`, { headers: { Authorization: `Bearer ${getToken()}` }, cache: "no-store" })
            .then(async r => { const b = await r.json().catch(() => null); if (!r.ok) throw new Error(b?.error || `Erro ${r.status}`); setSales(b); })
            .catch(e => setError(e?.message || "Não foi possível carregar as vendas."));
    }, [getToken]);

    const total = (k: "price" | "commission" | "net") => (sales || []).reduce((s, x) => s + (x[k] || 0), 0);

    return (
        <div className="dash-container">
            <header className="dash-header">
                <div>
                    <h1 className="dash-title">Financeiro</h1>
                    <p className="dash-subtitle">Vendas de roteiros registradas no sistema (valores em AUD). Comissão = a registrada em cada venda.</p>
                </div>
            </header>
            {error && <div style={{ ...card, color: "#DC2626", fontWeight: 600 }}>{error}</div>}
            {!sales && !error && <div style={{ color: "#5A6B8C" }}>Carregando…</div>}
            {sales && (
                <>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14, marginBottom: 20 }}>
                        {[["Vendas", String(sales.length)], ["Faturamento bruto", money(total("price"))], ["Comissão VAMO", money(total("commission"))], ["A repassar (estimado)", money(total("net"))]].map(([l, v]) => (
                            <div key={l} style={card}><div style={{ fontSize: 12, color: "#5A6B8C", fontWeight: 600 }}>{l}</div><div style={{ fontSize: 24, fontWeight: 800, color: "#1A3263", marginTop: 6 }}>{v}</div></div>
                        ))}
                    </div>
                    {sales.length === 0 ? (
                        <div style={{ ...card, textAlign: "center", padding: 40, color: "#98989D" }}>Nenhuma venda ainda.</div>
                    ) : (
                        <div style={{ ...card, padding: 0, overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                                <thead><tr style={{ textAlign: "left", color: "#5A6B8C" }}>
                                    {["Data", "Roteiro", "Roteirista", "Comprador", "Valor", "Comissão", "Líquido", "Pagamento"].map(h => <th key={h} style={{ padding: "12px 14px", borderBottom: "1px solid #F0F2F5" }}>{h}</th>)}
                                </tr></thead>
                                <tbody>{sales.map(s => (
                                    <tr key={s.id} style={{ color: "#1A3263" }}>
                                        <td style={td}>{new Date(s.createdAt).toLocaleDateString("pt-BR")}</td>
                                        <td style={td}><Link href={`/admin/roteiros/${s.itineraryId}`} style={{ color: "#1FA89F", fontWeight: 700, textDecoration: "none" }}>{s.itineraryTitle}</Link></td>
                                        <td style={td}>{s.creatorName || "—"}</td>
                                        <td style={td}>{s.buyerName}<div style={{ color: "#98989D", fontSize: 12 }}>{s.buyerEmail}</div></td>
                                        <td style={td}>{money(s.price, s.currency)}</td>
                                        <td style={td}>{money(s.commission, s.currency)}</td>
                                        <td style={td}>{money(s.net, s.currency)}</td>
                                        <td style={td}>{s.provider === "stripe" ? "Stripe" : s.provider === "free" ? "Gratuito" : "—"}</td>
                                    </tr>
                                ))}</tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

const td: React.CSSProperties = { padding: "12px 14px", borderBottom: "1px solid #F0F2F5", verticalAlign: "top" };

export default function AdminFinanceiroPage() {
    return <AdminDataProvider><FinanceContent /></AdminDataProvider>;
}

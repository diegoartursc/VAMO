"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/hooks/useCart";
import { useRouter } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333/api";
const FALLBACK_IMG = "https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=900&auto=format&fit=crop";

interface CartItem {
    id: string;
    title: string;
    destination: string;
    country?: string;
    price: number;
    currency?: string;
    images?: string[];
    duration?: number;
    creator?: { id: string; name: string };
}

function formatPrice(p: number, currency = "BRL") {
    try { return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(p); }
    catch { return `R$ ${p.toFixed(2)}`; }
}

function pickCover(images?: string[]): string {
    if (!images || images.length === 0) return FALLBACK_IMG;
    return images.filter((u) => u && !u.startsWith("blob:"))[0] || FALLBACK_IMG;
}

export default function CarrinhoPage() {
    const { ids, remove, clear } = useCart();
    const [items, setItems] = useState<CartItem[] | null>(null);
    const router = useRouter();

    useEffect(() => {
        if (ids.length === 0) { setItems([]); return; }
        Promise.all(ids.map((id) =>
            fetch(`${API_BASE_URL}/itineraries/${id}`).then((r) => r.ok ? r.json() : null).catch(() => null)
        )).then((rs) => setItems(rs.filter(Boolean) as CartItem[]));
    }, [ids]);

    const total = (items || []).reduce((acc, it) => acc + (it.price || 0), 0);

    if (items === null) {
        return (
            <main style={{ maxWidth: 1100, margin: "32px auto 80px", padding: "0 24px" }}>
                <h1 style={{ fontSize: 28, fontWeight: 700 }}>Carrinho</h1>
                <div style={{ height: 200, borderRadius: 16, background: "#f3f4f6", marginTop: 16 }} />
            </main>
        );
    }

    if (items.length === 0) {
        return (
            <main style={{ maxWidth: 720, margin: "60px auto", padding: "0 24px", textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🛒</div>
                <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Seu carrinho está vazio</h1>
                <p style={{ color: "#6b7280", marginTop: 8 }}>
                    Explore roteiros e adicione os que você quer comprar.
                </p>
                <Link href="/explore" style={{
                    display: "inline-block", marginTop: 24,
                    padding: "12px 24px", background: "#1A3263", color: "#fff",
                    borderRadius: 9999, textDecoration: "none", fontWeight: 600,
                }}>Explorar roteiros</Link>
            </main>
        );
    }

    return (
        <main style={{ maxWidth: 1100, margin: "32px auto 80px", padding: "0 24px" }}>
            <header style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 12 }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Carrinho</h1>
                    <p style={{ color: "#6b7280", marginTop: 6 }}>
                        {items.length} {items.length === 1 ? "roteiro" : "roteiros"}
                    </p>
                </div>
                <button onClick={() => clear()} style={{
                    background: "transparent", border: "none", color: "#6b7280",
                    textDecoration: "underline", cursor: "pointer", fontSize: 14,
                }}>Esvaziar carrinho</button>
            </header>

            <div style={{ display: "grid", gap: 24, gridTemplateColumns: "minmax(0, 1fr) 320px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {items.map((it) => (
                        <article key={it.id} style={{
                            display: "grid", gridTemplateColumns: "160px 1fr",
                            background: "#fff", border: "1px solid rgba(0,0,0,0.06)",
                            borderRadius: 16, overflow: "hidden",
                        }}>
                            <Link href={`/roteiros/${it.id}`} style={{
                                background: `#f3f4f6 url(${pickCover(it.images)}) center/cover no-repeat`,
                                minHeight: 130, display: "block",
                            }} />
                            <div style={{ padding: 16, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                                <div>
                                    <Link href={`/roteiros/${it.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                                        <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{it.title}</h3>
                                        <p style={{ fontSize: 13, color: "#6b7280", margin: "4px 0 0" }}>
                                            {it.destination}{it.country ? `, ${it.country}` : ""}{it.duration ? ` · ${it.duration} dias` : ""}
                                        </p>
                                    </Link>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                                    <div style={{ fontSize: 16, fontWeight: 700, color: "#1A3263" }}>
                                        {formatPrice(it.price, it.currency)}
                                    </div>
                                    <button onClick={() => remove(it.id)} style={{
                                        background: "transparent", border: "1px solid #e5e7eb",
                                        padding: "6px 14px", borderRadius: 9999,
                                        color: "#6b7280", cursor: "pointer", fontSize: 13,
                                    }}>Remover</button>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>

                <aside style={{
                    background: "#fff", border: "1px solid rgba(0,0,0,0.06)",
                    borderRadius: 16, padding: 20, height: "fit-content",
                }}>
                    <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 12px" }}>Resumo</h2>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#374151", marginBottom: 6 }}>
                        <span>{items.length} {items.length === 1 ? "roteiro" : "roteiros"}</span>
                        <span>{formatPrice(total)}</span>
                    </div>
                    <div style={{ borderTop: "1px solid #e5e7eb", margin: "12px 0", paddingTop: 12, display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 18 }}>
                        <span>Total</span>
                        <span style={{ color: "#1A3263" }}>{formatPrice(total)}</span>
                    </div>
                    <button onClick={() => router.push("/checkout")} style={{
                        width: "100%", marginTop: 12,
                        background: "linear-gradient(90deg,#28C9BF,#1A3263)",
                        color: "#fff", border: "none", padding: "14px 22px",
                        borderRadius: 9999, fontWeight: 700, cursor: "pointer", fontSize: 15,
                    }}>Finalizar compra</button>
                    <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 10, textAlign: "center" }}>
                        Pagamento seguro · Acesso imediato após confirmação
                    </p>
                </aside>
            </div>
        </main>
    );
}

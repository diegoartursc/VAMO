"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import GlobalHeader from "@/components/GlobalHeader";
import { useFavorites } from "@/hooks/useFavorites";
import { useCart } from "@/hooks/useCart";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333/api";
const FALLBACK_IMG = "https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=1600&auto=format&fit=crop";

interface ItineraryDetail {
    id: string;
    title: string;
    subtitle?: string;
    destination: string;
    country?: string;
    description?: string;
    price: number;
    promoPrice?: number;
    currency?: string;
    images?: string[];
    mediaUrls?: string[];
    highlightPhotos?: string[];
    rating?: number;
    reviewCount?: number;
    duration?: number;
    highlights?: string[];
    inclusions?: string[];
    creator?: { id: string; name: string; avatar?: string };
}

function formatPrice(price: number, currency = "BRL") {
    try {
        return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(price);
    } catch {
        return `R$ ${price.toFixed(0)}`;
    }
}

function pickImages(it: ItineraryDetail): string[] {
    const all = [
        ...(it.images || []),
        ...(it.highlightPhotos || []),
        ...(it.mediaUrls || []),
    ].filter((u) => u && !u.startsWith("blob:"));
    return all.length ? all : [FALLBACK_IMG];
}

export default function RoteiroDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = String(params?.id || "");

    const [data, setData] = useState<ItineraryDetail | null>(null);
    const [notFound, setNotFound] = useState(false);
    const [toast, setToast] = useState<string | null>(null);

    const { isFavorite, toggle: toggleFav, requiresLogin: favRequiresLogin } = useFavorites();
    const { isInCart, add: addToCart, requiresLogin: cartRequiresLogin } = useCart();

    useEffect(() => {
        if (!id) return;
        fetch(`${API_BASE_URL}/itineraries/${id}`)
            .then((r) => r.ok ? r.json() : Promise.reject(r.status))
            .then((d) => setData(d))
            .catch(() => setNotFound(true));
    }, [id]);

    function showToast(msg: string) {
        setToast(msg);
        setTimeout(() => setToast(null), 2400);
    }

    function handleFav() {
        if (favRequiresLogin) {
            router.push(`/login?next=/roteiros/${id}`);
            return;
        }
        const nowFav = toggleFav(id);
        showToast(nowFav ? "Adicionado aos favoritos" : "Removido dos favoritos");
    }

    function handleCart() {
        if (cartRequiresLogin) {
            router.push(`/login?next=/roteiros/${id}`);
            return;
        }
        if (isInCart(id)) {
            router.push("/perfil/carrinho");
            return;
        }
        const added = addToCart(id);
        if (added) showToast("Roteiro adicionado ao carrinho");
    }

    if (notFound) {
        return (
            <>
                <GlobalHeader variant="solid" />
                <main style={{ maxWidth: 900, margin: "60px auto", padding: "0 24px", textAlign: "center" }}>
                    <h1 style={{ fontSize: 28, fontWeight: 700 }}>Roteiro não encontrado</h1>
                    <p style={{ color: "#6b7280", marginTop: 8 }}>Volte e explore outros roteiros disponíveis.</p>
                    <Link href="/explore" style={{
                        display: "inline-block", marginTop: 24, padding: "12px 24px",
                        background: "#1A3263", color: "#fff", borderRadius: 9999, textDecoration: "none", fontWeight: 600,
                    }}>Voltar para Explorar</Link>
                </main>
            </>
        );
    }

    if (!data) {
        return (
            <>
                <GlobalHeader variant="solid" />
                <main style={{ maxWidth: 1100, margin: "32px auto", padding: "0 24px" }}>
                    <div style={{ height: 360, borderRadius: 16, background: "#f3f4f6" }} />
                    <div style={{ height: 24, borderRadius: 8, background: "#f3f4f6", margin: "20px 0", width: "60%" }} />
                    <div style={{ height: 16, borderRadius: 8, background: "#f3f4f6", width: "40%" }} />
                </main>
            </>
        );
    }

    const images = pickImages(data);
    const fav = isFavorite(id);
    const inCart = isInCart(id);
    const finalPrice = data.promoPrice && data.promoPrice < data.price ? data.promoPrice : data.price;

    return (
        <>
            <GlobalHeader variant="solid" />

            <main style={{ maxWidth: 1100, margin: "32px auto 80px", padding: "0 24px" }}>
                {/* Title + meta */}
                <header style={{ marginBottom: 20 }}>
                    <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, lineHeight: 1.2 }}>
                        {data.title}
                    </h1>
                    <p style={{ color: "#6b7280", margin: "6px 0 0", display: "flex", gap: 14, flexWrap: "wrap", fontSize: 14 }}>
                        <span>📍 {data.destination}{data.country ? `, ${data.country}` : ""}</span>
                        {data.duration ? <span>📅 {data.duration} dias</span> : null}
                        {data.rating ? <span>★ {data.rating.toFixed(1)} ({data.reviewCount || 0})</span> : null}
                        {data.creator?.name ? <span>👤 {data.creator.name}</span> : null}
                    </p>
                </header>

                {/* Galeria — primeira foto grande + 4 miniaturas */}
                <section style={{
                    display: "grid", gap: 8,
                    gridTemplateColumns: "2fr 1fr 1fr",
                    gridTemplateRows: "200px 200px",
                    borderRadius: 16, overflow: "hidden",
                    marginBottom: 24,
                }}>
                    <div style={{
                        gridRow: "1 / 3", gridColumn: "1 / 2",
                        background: `#f3f4f6 url(${images[0]}) center/cover no-repeat`,
                    }} />
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} style={{
                            background: `#f3f4f6 url(${images[i] || images[0]}) center/cover no-repeat`,
                        }} />
                    ))}
                </section>

                {/* Conteúdo: left = info, right = sticky CTA */}
                <div style={{ display: "grid", gap: 32, gridTemplateColumns: "minmax(0, 1fr) 360px" }}>
                    <div>
                        {data.description ? (
                            <section style={{ marginBottom: 28 }}>
                                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>Sobre este roteiro</h2>
                                <p style={{ color: "#374151", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                                    {data.description}
                                </p>
                            </section>
                        ) : null}
                        {data.highlights?.length ? (
                            <section style={{ marginBottom: 28 }}>
                                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>Destaques</h2>
                                <ul style={{ paddingLeft: 18, color: "#374151", lineHeight: 1.7 }}>
                                    {data.highlights.map((h, i) => <li key={i}>{h}</li>)}
                                </ul>
                            </section>
                        ) : null}
                        {data.inclusions?.length ? (
                            <section style={{ marginBottom: 28 }}>
                                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>O que está incluso</h2>
                                <ul style={{ paddingLeft: 18, color: "#374151", lineHeight: 1.7 }}>
                                    {data.inclusions.map((h, i) => <li key={i}>{h}</li>)}
                                </ul>
                            </section>
                        ) : null}
                    </div>

                    {/* CTA sticky */}
                    <aside style={{
                        position: "sticky", top: 90, alignSelf: "flex-start",
                        background: "#fff", border: "1px solid rgba(0,0,0,0.08)",
                        borderRadius: 16, padding: 20,
                        boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
                        height: "fit-content",
                    }}>
                        <div style={{ fontSize: 13, color: "#6b7280" }}>Acesso imediato</div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 2 }}>
                            <div style={{ fontSize: 28, fontWeight: 700, color: "#1A3263" }}>
                                {formatPrice(finalPrice, data.currency)}
                            </div>
                            {data.promoPrice && data.promoPrice < data.price ? (
                                <div style={{ color: "#9ca3af", textDecoration: "line-through", fontSize: 14 }}>
                                    {formatPrice(data.price, data.currency)}
                                </div>
                            ) : null}
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 18 }}>
                            <button
                                onClick={handleCart}
                                style={{
                                    background: inCart ? "#fff" : "linear-gradient(90deg, #28C9BF, #1A3263)",
                                    color: inCart ? "#1A3263" : "#fff",
                                    border: inCart ? "1px solid #1A3263" : "none",
                                    padding: "14px 22px", borderRadius: 9999,
                                    fontWeight: 700, fontSize: 15, cursor: "pointer",
                                }}
                            >
                                {inCart ? "Ver carrinho →" : "Adicionar ao carrinho"}
                            </button>
                            <button
                                onClick={handleFav}
                                style={{
                                    background: "#fff", color: fav ? "#FF385C" : "#111",
                                    border: `1px solid ${fav ? "#FF385C" : "#e5e7eb"}`,
                                    padding: "12px 22px", borderRadius: 9999,
                                    fontWeight: 600, fontSize: 14, cursor: "pointer",
                                    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
                                }}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24"
                                    fill={fav ? "#FF385C" : "none"}
                                    stroke={fav ? "#FF385C" : "#111"}
                                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                </svg>
                                {fav ? "Salvo nos favoritos" : "Salvar nos favoritos"}
                            </button>
                        </div>
                        <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 14, textAlign: "center" }}>
                            Acesso imediato · Garantia de 7 dias
                        </p>
                    </aside>
                </div>
            </main>

            {/* Toast */}
            {toast ? (
                <div style={{
                    position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)",
                    background: "#1A3263", color: "#fff",
                    padding: "12px 22px", borderRadius: 9999,
                    boxShadow: "0 12px 32px rgba(0,0,0,0.2)", zIndex: 80,
                    fontSize: 14, fontWeight: 600,
                }}>{toast}</div>
            ) : null}
        </>
    );
}

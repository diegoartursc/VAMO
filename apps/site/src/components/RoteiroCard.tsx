"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFavorites } from "../hooks/useFavorites";
import { useCart } from "../hooks/useCart";

const FALLBACK_IMG =
    "https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=900&auto=format&fit=crop";

export interface RoteiroCardData {
    id: string;
    title: string;
    destination: string;
    country?: string;
    description?: string;
    price: number;
    currency?: string;
    images?: string[];
    rating?: number;
    reviewCount?: number;
    duration?: number;
    featured?: boolean;
    creator?: {
        id: string;
        name: string;
        avatar?: string;
        verificationLevel?: string;
    };
    tags?: string[];
    qualityScore?: number;
}

function formatPrice(price: number, currency = "BRL") {
    try {
        return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(price);
    } catch {
        return `R$ ${price.toFixed(0)}`;
    }
}

function pickCover(images?: string[]): string {
    if (!images || images.length === 0) return FALLBACK_IMG;
    const valid = images.filter((u) => u && !u.startsWith("blob:"));
    return valid[0] || FALLBACK_IMG;
}

export default function RoteiroCard({ data }: { data: RoteiroCardData }) {
    const router = useRouter();
    const {
        isFavorite, toggle, loaded: favLoaded, requiresLogin: favRequiresLogin,
    } = useFavorites();
    const {
        isInCart, add: addToCart, loaded: cartLoaded, requiresLogin: cartRequiresLogin,
    } = useCart();

    const [toast, setToast] = useState<string | null>(null);

    const fav = isFavorite(data.id);
    const inCart = isInCart(data.id);
    const cover = pickCover(data.images);
    const isVerified = (data.creator?.verificationLevel ?? "").toLowerCase() === "verified";

    function showToast(msg: string) {
        setToast(msg);
        setTimeout(() => setToast(null), 2200);
    }

    function handleFavClick(e: React.MouseEvent) {
        e.preventDefault();
        e.stopPropagation();
        if (!favLoaded) return; // ainda hidratando — ignora clique
        if (favRequiresLogin) {
            router.push(`/login?next=/roteiros/${data.id}`);
            return;
        }
        const nowFav = toggle(data.id);
        showToast(nowFav ? "❤️ Adicionado aos favoritos" : "Removido dos favoritos");
    }

    function handleCartClick(e: React.MouseEvent) {
        e.preventDefault();
        e.stopPropagation();
        if (!cartLoaded) return; // ainda hidratando — ignora clique
        if (cartRequiresLogin) {
            router.push(`/login?next=/roteiros/${data.id}`);
            return;
        }
        if (inCart) {
            router.push("/perfil/carrinho");
            return;
        }
        addToCart(data.id);
        showToast("🛒 Adicionado ao carrinho");
    }

    return (
        <Link
            href={`/roteiros/${data.id}`}
            style={{ textDecoration: "none", color: "inherit", display: "block", height: "100%" }}
        >
            <article
                style={{
                    borderRadius: 20,
                    overflow: "hidden",
                    background: "#fff",
                    border: "1px solid rgba(0,0,0,0.07)",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                    transition: "transform 220ms ease, box-shadow 220ms ease",
                    cursor: "pointer",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                }}
                onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = "translateY(-5px)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 18px 44px rgba(0,0,0,0.13)";
                }}
                onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 10px rgba(0,0,0,0.06)";
                }}
            >
                {/* ── Toast de feedback ── */}
                {toast && (
                    <div
                        style={{
                            position: "absolute",
                            top: 10,
                            left: "50%",
                            transform: "translateX(-50%)",
                            background: "rgba(15,15,15,0.88)",
                            color: "#fff",
                            padding: "6px 14px",
                            borderRadius: 9999,
                            fontSize: 12,
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                            zIndex: 20,
                            pointerEvents: "none",
                        }}
                    >
                        {toast}
                    </div>
                )}

                {/* ── Imagem de capa ── */}
                <div
                    style={{
                        position: "relative",
                        paddingTop: "60%",
                        background: `#eef2f7 url(${cover}) center/cover no-repeat`,
                        flexShrink: 0,
                    }}
                >
                    {/* Badge "Em destaque" */}
                    {data.featured && (
                        <div
                            style={{
                                position: "absolute",
                                top: 10,
                                left: 10,
                                background: "#1A3263",
                                color: "#fff",
                                padding: "4px 10px",
                                borderRadius: 9999,
                                fontSize: 10,
                                fontWeight: 700,
                                letterSpacing: 0.4,
                            }}
                        >
                            Em destaque
                        </div>
                    )}

                    {/* ── Botão Favoritar ── */}
                    <button
                        onClick={handleFavClick}
                        aria-label={fav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                        style={{
                            position: "absolute",
                            top: 10,
                            right: 10,
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            background: "rgba(255,255,255,0.93)",
                            border: "none",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.16)",
                            transition: "transform 150ms, background 150ms",
                        }}
                        onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.transform = "scale(1.12)";
                            (e.currentTarget as HTMLElement).style.background = "#fff";
                        }}
                        onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.transform = "scale(1)";
                            (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.93)";
                        }}
                    >
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill={fav ? "#FF385C" : "none"}
                            stroke={fav ? "#FF385C" : "#333"}
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                    </button>

                    {/* Badge rating no canto inferior esquerdo */}
                    {data.rating ? (
                        <div
                            style={{
                                position: "absolute",
                                bottom: 10,
                                left: 10,
                                background: "rgba(255,255,255,0.96)",
                                padding: "4px 10px",
                                borderRadius: 9999,
                                fontSize: 12,
                                fontWeight: 700,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                color: "#111",
                            }}
                        >
                            <span style={{ color: "#F59E0B" }}>★</span>
                            {data.rating.toFixed(1)}
                            {data.reviewCount ? (
                                <span style={{ color: "#6b7280", fontWeight: 400, fontSize: 11 }}>
                                    ({data.reviewCount})
                                </span>
                            ) : null}
                        </div>
                    ) : null}
                </div>

                {/* ── Conteúdo do card ── */}
                <div
                    style={{
                        padding: "14px 16px 14px",
                        display: "flex",
                        flexDirection: "column",
                        flex: 1,
                        gap: 0,
                    }}
                >
                    {/* Título principal */}
                    <h3
                        style={{
                            fontSize: 15,
                            fontWeight: 700,
                            margin: 0,
                            lineHeight: 1.4,
                            color: "#111",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            minHeight: "2.8em",
                        }}
                    >
                        {data.title}
                    </h3>

                    {/* Destino + duração */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginTop: 7,
                            gap: 4,
                        }}
                    >
                        <span
                            style={{
                                fontSize: 13,
                                color: "#6b7280",
                                fontWeight: 500,
                                overflow: "hidden",
                                whiteSpace: "nowrap",
                                textOverflow: "ellipsis",
                            }}
                        >
                            📍 {data.destination}
                            {data.country ? `, ${data.country}` : ""}
                        </span>
                        {data.duration ? (
                            <span
                                style={{
                                    fontSize: 11,
                                    color: "#6b7280",
                                    background: "#F3F4F6",
                                    padding: "3px 8px",
                                    borderRadius: 6,
                                    whiteSpace: "nowrap",
                                    fontWeight: 600,
                                    flexShrink: 0,
                                }}
                            >
                                {data.duration} dias
                            </span>
                        ) : null}
                    </div>

                    {/* Tags rápidas */}
                    {data.tags && data.tags.length > 0 && (
                        <div
                            style={{
                                display: "flex",
                                gap: 5,
                                flexWrap: "wrap",
                                marginTop: 8,
                            }}
                        >
                            {data.tags.slice(0, 3).map((tag) => (
                                <span
                                    key={tag}
                                    style={{
                                        fontSize: 10,
                                        fontWeight: 600,
                                        padding: "3px 8px",
                                        borderRadius: 6,
                                        background: "rgba(40,201,191,0.10)",
                                        color: "#0f766e",
                                        border: "1px solid rgba(40,201,191,0.2)",
                                    }}
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Criador */}
                    {data.creator?.name ? (
                        <p
                            style={{
                                fontSize: 12,
                                color: "#9ca3af",
                                margin: "8px 0 0",
                                fontWeight: 500,
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                            }}
                        >
                            por {data.creator.name}
                            {isVerified && (
                                <span
                                    style={{
                                        background: "rgba(40,201,191,0.15)",
                                        color: "#0f766e",
                                        borderRadius: 4,
                                        fontSize: 9,
                                        fontWeight: 700,
                                        padding: "2px 5px",
                                        letterSpacing: 0.3,
                                    }}
                                >
                                    ✓ Verificado
                                </span>
                            )}
                        </p>
                    ) : null}

                    {/* Espaçador */}
                    <div style={{ flex: 1 }} />

                    {/* ── Preço + botão carrinho ── */}
                    <div
                        style={{
                            marginTop: 12,
                            paddingTop: 12,
                            borderTop: "1px solid rgba(0,0,0,0.06)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 8,
                        }}
                    >
                        <div>
                            <div
                                style={{
                                    fontSize: 10,
                                    color: "#9ca3af",
                                    fontWeight: 500,
                                    textTransform: "uppercase",
                                    letterSpacing: 0.4,
                                    lineHeight: 1,
                                    marginBottom: 3,
                                }}
                            >
                                a partir de
                            </div>
                            <div
                                style={{
                                    fontSize: 19,
                                    fontWeight: 800,
                                    color: "#1A3263",
                                    lineHeight: 1,
                                }}
                            >
                                {formatPrice(data.price, data.currency)}
                            </div>
                        </div>

                        {/* ── Botão Adicionar ao Carrinho ── */}
                        <button
                            onClick={handleCartClick}
                            aria-label={inCart ? "Ver carrinho" : "Adicionar ao carrinho"}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 5,
                                padding: "8px 12px",
                                borderRadius: 10,
                                background: inCart
                                    ? "rgba(15,118,110,0.08)"
                                    : "linear-gradient(135deg, #28C9BF 0%, #1A3263 100%)",
                                color: inCart ? "#0f766e" : "#fff",
                                border: inCart ? "1.5px solid #28C9BF" : "none",
                                fontWeight: 700,
                                fontSize: 12,
                                cursor: "pointer",
                                transition: "opacity 150ms, transform 150ms",
                                whiteSpace: "nowrap",
                                flexShrink: 0,
                                boxShadow: inCart ? "none" : "0 3px 10px rgba(40,201,191,0.3)",
                            }}
                            onMouseEnter={(e) => {
                                (e.currentTarget as HTMLElement).style.opacity = "0.85";
                                (e.currentTarget as HTMLElement).style.transform = "scale(1.04)";
                            }}
                            onMouseLeave={(e) => {
                                (e.currentTarget as HTMLElement).style.opacity = "1";
                                (e.currentTarget as HTMLElement).style.transform = "scale(1)";
                            }}
                        >
                            {inCart ? (
                                <>
                                    {/* checkmark */}
                                    <svg
                                        width="13"
                                        height="13"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                    No carrinho
                                </>
                            ) : (
                                <>
                                    {/* cart icon */}
                                    <svg
                                        width="13"
                                        height="13"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <circle cx="9" cy="21" r="1" />
                                        <circle cx="20" cy="21" r="1" />
                                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                                    </svg>
                                    Carrinho
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </article>
        </Link>
    );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import GlobalHeader from "@/components/GlobalHeader";
import { useCart } from "@/hooks/useCart";
import { getCurrentUser, type CurrentUser } from "@/lib/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333/api";
const FALLBACK_IMG =
    "https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=900&auto=format&fit=crop";

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
    try {
        return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(p);
    } catch {
        return `R$ ${p.toFixed(2)}`;
    }
}

function pickCover(images?: string[]): string {
    if (!images || images.length === 0) return FALLBACK_IMG;
    return images.filter((u) => u && !u.startsWith("blob:"))[0] || FALLBACK_IMG;
}

export default function CheckoutPage() {
    const router = useRouter();
    const { ids, clear } = useCart();
    const [user, setUser] = useState<CurrentUser | null>(null);
    const [items, setItems] = useState<CartItem[] | null>(null);
    const [processing, setProcessing] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const u = getCurrentUser();
        if (!u) {
            router.replace("/login?next=/checkout");
            return;
        }
        setUser(u);
    }, [router]);

    useEffect(() => {
        if (ids.length === 0) {
            setItems([]);
            return;
        }
        Promise.all(
            ids.map((id) =>
                fetch(`${API_BASE_URL}/itineraries/${id}`)
                    .then((r) => (r.ok ? r.json() : null))
                    .catch(() => null)
            )
        ).then((rs) => setItems(rs.filter(Boolean) as CartItem[]));
    }, [ids]);

    const total = (items || []).reduce((acc, it) => acc + (it.price || 0), 0);

    async function handleCheckout() {
        setProcessing(true);
        // Simula processamento (integrar com gateway real futuramente)
        await new Promise((r) => setTimeout(r, 1800));
        clear();
        setProcessing(false);
        setSuccess(true);
    }

    if (success) {
        return (
            <>
                <GlobalHeader variant="solid" />
                <main
                    style={{
                        maxWidth: 600,
                        margin: "80px auto",
                        padding: "0 24px",
                        textAlign: "center",
                    }}
                >
                    <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
                    <h1 style={{ fontSize: 28, fontWeight: 700 }}>Compra confirmada!</h1>
                    <p style={{ color: "#6b7280", marginTop: 8, lineHeight: 1.6 }}>
                        Os roteiros foram liberados para acesso imediato na sua conta.
                        Em breve enviaremos um e-mail com todos os detalhes.
                    </p>
                    <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 28 }}>
                        <Link
                            href="/perfil/compras"
                            style={{
                                padding: "12px 24px",
                                borderRadius: 9999,
                                background: "linear-gradient(90deg, #28C9BF, #1A3263)",
                                color: "#fff",
                                textDecoration: "none",
                                fontWeight: 700,
                            }}
                        >
                            Ver minhas compras
                        </Link>
                        <Link
                            href="/explore"
                            style={{
                                padding: "12px 24px",
                                borderRadius: 9999,
                                border: "1px solid #e5e7eb",
                                background: "#fff",
                                color: "#111",
                                textDecoration: "none",
                                fontWeight: 600,
                            }}
                        >
                            Explorar mais
                        </Link>
                    </div>
                </main>
            </>
        );
    }

    if (!user || items === null) {
        return (
            <>
                <GlobalHeader variant="solid" />
                <main style={{ maxWidth: 900, margin: "40px auto", padding: "0 24px" }}>
                    <div
                        style={{
                            height: 300,
                            borderRadius: 16,
                            background: "#f3f4f6",
                            marginTop: 16,
                        }}
                    />
                </main>
            </>
        );
    }

    if (items.length === 0) {
        return (
            <>
                <GlobalHeader variant="solid" />
                <main
                    style={{
                        maxWidth: 600,
                        margin: "80px auto",
                        padding: "0 24px",
                        textAlign: "center",
                    }}
                >
                    <div style={{ fontSize: 48, marginBottom: 12 }}>🛒</div>
                    <h1 style={{ fontSize: 24, fontWeight: 700 }}>Carrinho vazio</h1>
                    <p style={{ color: "#6b7280", marginTop: 8 }}>
                        Adicione roteiros ao carrinho antes de finalizar a compra.
                    </p>
                    <Link
                        href="/explore"
                        style={{
                            display: "inline-block",
                            marginTop: 20,
                            padding: "12px 24px",
                            background: "#1A3263",
                            color: "#fff",
                            borderRadius: 9999,
                            textDecoration: "none",
                            fontWeight: 600,
                        }}
                    >
                        Explorar roteiros
                    </Link>
                </main>
            </>
        );
    }

    return (
        <>
            <GlobalHeader variant="solid" />
            <main style={{ maxWidth: 900, margin: "32px auto 80px", padding: "0 24px" }}>
                <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>
                    Finalizar compra
                </h1>

                <div
                    style={{
                        display: "grid",
                        gap: 28,
                        gridTemplateColumns: "minmax(0, 1fr) 340px",
                    }}
                >
                    {/* Left: resumo dos itens */}
                    <div>
                        <h2
                            style={{
                                fontSize: 16,
                                fontWeight: 700,
                                marginBottom: 14,
                                color: "#374151",
                            }}
                        >
                            Itens ({items.length})
                        </h2>
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 12,
                            }}
                        >
                            {items.map((it) => (
                                <div
                                    key={it.id}
                                    style={{
                                        display: "flex",
                                        gap: 14,
                                        padding: 14,
                                        background: "#fff",
                                        border: "1px solid rgba(0,0,0,0.06)",
                                        borderRadius: 14,
                                    }}
                                >
                                    <div
                                        style={{
                                            width: 80,
                                            height: 60,
                                            borderRadius: 10,
                                            background: `#f3f4f6 url(${pickCover(it.images)}) center/cover no-repeat`,
                                            flexShrink: 0,
                                        }}
                                    />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div
                                            style={{
                                                fontWeight: 700,
                                                fontSize: 14,
                                                lineHeight: 1.3,
                                            }}
                                        >
                                            {it.title}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 12,
                                                color: "#6b7280",
                                                marginTop: 2,
                                            }}
                                        >
                                            {it.destination}
                                            {it.country ? `, ${it.country}` : ""}
                                            {it.duration ? ` · ${it.duration} dias` : ""}
                                        </div>
                                    </div>
                                    <div
                                        style={{
                                            fontWeight: 700,
                                            fontSize: 15,
                                            color: "#1A3263",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {formatPrice(it.price, it.currency)}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Dados do comprador */}
                        <div
                            style={{
                                marginTop: 28,
                                padding: 20,
                                background: "#fff",
                                border: "1px solid rgba(0,0,0,0.06)",
                                borderRadius: 14,
                            }}
                        >
                            <h2
                                style={{
                                    fontSize: 16,
                                    fontWeight: 700,
                                    marginBottom: 12,
                                    color: "#374151",
                                }}
                            >
                                Dados do comprador
                            </h2>
                            <div
                                style={{
                                    display: "grid",
                                    gap: 8,
                                    fontSize: 14,
                                    color: "#374151",
                                }}
                            >
                                <div>
                                    <span style={{ color: "#9ca3af" }}>Nome: </span>
                                    {user.name}
                                </div>
                                <div>
                                    <span style={{ color: "#9ca3af" }}>E-mail: </span>
                                    {user.email}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: resumo + botao pagar */}
                    <aside
                        style={{
                            background: "#fff",
                            border: "1px solid rgba(0,0,0,0.06)",
                            borderRadius: 16,
                            padding: 22,
                            height: "fit-content",
                            position: "sticky",
                            top: 90,
                        }}
                    >
                        <h2
                            style={{
                                fontSize: 18,
                                fontWeight: 700,
                                margin: "0 0 14px",
                            }}
                        >
                            Resumo do pedido
                        </h2>
                        {items.map((it) => (
                            <div
                                key={it.id}
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    fontSize: 13,
                                    color: "#374151",
                                    marginBottom: 6,
                                }}
                            >
                                <span
                                    style={{
                                        overflow: "hidden",
                                        whiteSpace: "nowrap",
                                        textOverflow: "ellipsis",
                                        maxWidth: "65%",
                                    }}
                                >
                                    {it.title}
                                </span>
                                <span style={{ fontWeight: 600 }}>
                                    {formatPrice(it.price, it.currency)}
                                </span>
                            </div>
                        ))}
                        <div
                            style={{
                                borderTop: "1px solid #e5e7eb",
                                margin: "14px 0",
                                paddingTop: 14,
                                display: "flex",
                                justifyContent: "space-between",
                                fontWeight: 700,
                                fontSize: 18,
                            }}
                        >
                            <span>Total</span>
                            <span style={{ color: "#1A3263" }}>{formatPrice(total)}</span>
                        </div>

                        <button
                            onClick={handleCheckout}
                            disabled={processing}
                            style={{
                                width: "100%",
                                marginTop: 10,
                                background: processing
                                    ? "#94a3b8"
                                    : "linear-gradient(90deg, #28C9BF, #1A3263)",
                                color: "#fff",
                                border: "none",
                                padding: "14px 22px",
                                borderRadius: 9999,
                                fontWeight: 700,
                                cursor: processing ? "wait" : "pointer",
                                fontSize: 15,
                                transition: "opacity 150ms",
                            }}
                        >
                            {processing ? "Processando..." : "Confirmar e pagar"}
                        </button>

                        <p
                            style={{
                                fontSize: 12,
                                color: "#9ca3af",
                                marginTop: 10,
                                textAlign: "center",
                                lineHeight: 1.5,
                            }}
                        >
                            Pagamento seguro · Acesso imediato
                            <br />
                            Reembolso em at{"é"} 7 dias
                        </p>

                        <Link
                            href="/perfil/carrinho"
                            style={{
                                display: "block",
                                textAlign: "center",
                                marginTop: 14,
                                fontSize: 13,
                                color: "#6b7280",
                                textDecoration: "underline",
                            }}
                        >
                            ← Voltar ao carrinho
                        </Link>
                    </aside>
                </div>
            </main>
        </>
    );
}

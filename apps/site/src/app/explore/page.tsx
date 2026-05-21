"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import GlobalHeader from "@/components/GlobalHeader";
import RoteiroCard, { type RoteiroCardData } from "@/components/RoteiroCard";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333/api";

interface Itinerary {
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
    creator?: { id: string; name: string; avatar?: string };
}

function formatPrice(price: number, currency = "BRL") {
    try {
        return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(price);
    } catch {
        return `R$ ${price.toFixed(0)}`;
    }
}

const SORTS = [
    { value: "default", label: "Mais relevantes" },
    { value: "rating", label: "Melhor avaliados" },
    { value: "price_asc", label: "Menor preço" },
    { value: "price_desc", label: "Maior preço" },
];

export default function ExplorePage() {
    const params = useSearchParams();
    const router = useRouter();
    const initialQuery = params.get("q") || "";

    const [query, setQuery] = useState(initialQuery);
    const [search, setSearch] = useState(initialQuery);
    const [sort, setSort] = useState("default");
    const [items, setItems] = useState<Itinerary[] | null>(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const url = new URL(`${API_BASE_URL}/itineraries`);
        if (sort !== "default") url.searchParams.set("sort", sort);
        if (search) url.searchParams.set("destination", search);

        setItems(null);
        setError(false);
        fetch(url.toString())
            .then((r) => r.ok ? r.json() : Promise.reject())
            .then((data) => { if (!cancelled) setItems(Array.isArray(data) ? data : []); })
            .catch(() => { if (!cancelled) { setItems([]); setError(true); } });
        return () => { cancelled = true; };
    }, [search, sort]);

    const filtered = useMemo(() => items ?? [], [items]);

    function submit(e: React.FormEvent) {
        e.preventDefault();
        setSearch(query.trim());
        const next = new URLSearchParams();
        if (query.trim()) next.set("q", query.trim());
        router.replace(`/explore${next.toString() ? `?${next.toString()}` : ""}`);
    }

    return (
        <>
            <GlobalHeader variant="solid" />

            <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px 80px" }}>
                <header style={{ marginBottom: 24 }}>
                    <h1 style={{ fontSize: 32, fontWeight: 700, margin: 0 }}>Explorar roteiros</h1>
                    <p style={{ color: "#6b7280", marginTop: 6 }}>
                        Roteiros completos criados por viajantes experientes
                    </p>
                </header>

                {/* SEARCH + FILTERS */}
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 28 }}>
                    <form onSubmit={submit} style={{
                        flex: "1 1 320px", display: "flex", alignItems: "center",
                        background: "#fff", border: "1px solid #e5e7eb", borderRadius: 9999,
                        padding: "6px 6px 6px 18px", gap: 10,
                    }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                        </svg>
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Buscar destino — Paris, Tóquio, Itália..."
                            style={{ flex: 1, border: "none", outline: "none", fontSize: 15, padding: "8px 0", background: "transparent" }}
                        />
                        <button type="submit" style={{
                            background: "linear-gradient(90deg,#14b8a6,#2563eb)",
                            color: "#fff", border: "none", padding: "10px 22px",
                            borderRadius: 9999, fontWeight: 600, cursor: "pointer",
                        }}>Buscar</button>
                    </form>

                    <select
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                        style={{
                            background: "#fff", border: "1px solid #e5e7eb",
                            borderRadius: 9999, padding: "10px 18px", fontSize: 14,
                            cursor: "pointer", color: "#111",
                        }}
                    >
                        {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                </div>

                {/* RESULTS */}
                {items === null ? (
                    <div style={{
                        display: "grid", gap: 20,
                        gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                    }}>
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} style={{
                                borderRadius: 16, background: "#f3f4f6",
                                paddingTop: "62%", animation: "pulse 1.4s ease-in-out infinite",
                            }} />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{
                        padding: 60, textAlign: "center", background: "#f9fafb",
                        borderRadius: 16, color: "#6b7280",
                    }}>
                        <p style={{ fontSize: 18, fontWeight: 600, color: "#111", marginBottom: 8 }}>
                            {error ? "Não foi possível carregar os roteiros agora." : `Nenhum roteiro encontrado${search ? ` para "${search}"` : ""}.`}
                        </p>
                        <p>Que tal{" "}
                            <Link href="/dashboard/roteiro/novo" style={{ color: "#0f766e", fontWeight: 600 }}>
                                criar o seu
                            </Link>?
                        </p>
                    </div>
                ) : (
                    <>
                        <p style={{ color: "#6b7280", marginBottom: 16, fontSize: 14 }}>
                            {filtered.length} {filtered.length === 1 ? "roteiro encontrado" : "roteiros encontrados"}
                        </p>
                        <div style={{
                            display: "grid", gap: 20,
                            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                        }}>
                            {filtered.map((it) => (
                                <RoteiroCard key={it.id} data={it as RoteiroCardData} />
                            ))}
                        </div>
                    </>
                )}
            </main>
        </>
    );
}

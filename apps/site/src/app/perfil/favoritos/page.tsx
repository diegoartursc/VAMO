"use client";

import { useEffect, useState } from "react";
import EmptyState from "../_components/EmptyState";
import RoteiroCard, { type RoteiroCardData } from "@/components/RoteiroCard";
import { useFavorites } from "@/hooks/useFavorites";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333/api";

export default function FavoritosPage() {
    const { ids } = useFavorites();
    const [items, setItems] = useState<RoteiroCardData[] | null>(null);

    useEffect(() => {
        if (ids.length === 0) { setItems([]); return; }
        Promise.all(ids.map((id) =>
            fetch(`${API_BASE_URL}/itineraries/${id}`)
                .then((r) => r.ok ? r.json() : null)
                .catch(() => null)
        )).then((results) => {
            setItems(results.filter(Boolean) as RoteiroCardData[]);
        });
    }, [ids]);

    if (items === null) {
        return (
            <main style={{ maxWidth: 1100, margin: "32px auto 80px", padding: "0 24px" }}>
                <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>Seus favoritos</h1>
                <div style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
                    {[1, 2, 3].map((i) => (
                        <div key={i} style={{ borderRadius: 16, background: "#f3f4f6", paddingTop: "62%" }} />
                    ))}
                </div>
            </main>
        );
    }

    if (items.length === 0) {
        return (
            <EmptyState
                title="Seus favoritos"
                subtitle="Roteiros salvos pra depois aparecem aqui."
                emoji="❤️"
                ctaHref="/explore"
                ctaLabel="Explorar roteiros"
                description="Quando você favoritar um roteiro durante a navegação, ele entra direto nessa lista."
            />
        );
    }

    return (
        <main style={{ maxWidth: 1100, margin: "32px auto 80px", padding: "0 24px" }}>
            <header style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Seus favoritos</h1>
                <p style={{ color: "#6b7280", marginTop: 6 }}>
                    {items.length} {items.length === 1 ? "roteiro salvo" : "roteiros salvos"}
                </p>
            </header>
            <div style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
                {items.map((it) => <RoteiroCard key={it.id} data={it} />)}
            </div>
        </main>
    );
}

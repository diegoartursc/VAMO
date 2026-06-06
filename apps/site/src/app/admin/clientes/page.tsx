"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333/api";

interface TravelerRow {
    id: string;
    name: string;
    email: string;
    authProvider: string;
    createdAt: string;
    creator: {
        id: string;
        verificationLevel: string;
        _count: { itineraries: number };
    } | null;
    _count: {
        reviews: number;
        purchases: number;
        itinerarySales: number;
    };
}

export default function AdminClientsPage() {
    const router = useRouter();
    const [travelers, setTravelers] = useState<TravelerRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("adminToken");
        if (!token) {
            router.replace("/admin/login");
            return;
        }

        fetch(`${API}/admin/travelers`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
        })
            .then(async (res) => {
                if (res.status === 401) {
                    localStorage.removeItem("adminToken");
                    localStorage.removeItem("adminUser");
                    router.replace("/admin/login");
                }
                if (!res.ok) throw new Error("Falha ao carregar usuários");
                return res.json();
            })
            .then((data) => setTravelers(Array.isArray(data) ? data : []))
            .catch((cause) => setError(cause instanceof Error ? cause.message : "Falha ao carregar usuários"))
            .finally(() => setLoading(false));
    }, [router]);

    const filtered = useMemo(() => {
        const normalized = query.trim().toLowerCase();
        if (!normalized) return travelers;
        return travelers.filter((traveler) =>
            traveler.name.toLowerCase().includes(normalized)
            || traveler.email.toLowerCase().includes(normalized),
        );
    }, [query, travelers]);

    return (
        <div className="dash-container">
            <div className="dash-page-header">
                <div>
                    <h1>Clientes</h1>
                    <p>Usuários reais cadastrados no ambiente conectado.</p>
                </div>
            </div>

            <div className="dash-card" style={{ padding: 20 }}>
                <input
                    className="form-input"
                    type="search"
                    placeholder="Buscar por nome ou email"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    style={{ maxWidth: 420, marginBottom: 20 }}
                />

                {loading && <p>Carregando usuários...</p>}
                {error && <p style={{ color: "#DC2626" }}>{error}</p>}
                {!loading && !error && filtered.length === 0 && <p>Nenhum usuário encontrado.</p>}

                {!loading && !error && filtered.map((traveler) => (
                    <div
                        key={traveler.id}
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 20,
                            padding: "16px 0",
                            borderBottom: "1px solid #E5E7EB",
                        }}
                    >
                        <div>
                            <strong>{traveler.name}</strong>
                            <div style={{ color: "#64748B", fontSize: 13 }}>{traveler.email}</div>
                        </div>
                        <div style={{ textAlign: "right", color: "#64748B", fontSize: 13 }}>
                            <div>{traveler.creator ? `Roteirista ${traveler.creator.verificationLevel}` : "Viajante"}</div>
                            <div>{traveler.creator?._count.itineraries ?? 0} roteiro(s)</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

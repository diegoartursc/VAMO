"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import RoteiroCard, { type RoteiroCardData } from "./RoteiroCard";

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
    tags?: string[];
    qualityScore?: number;
    creator?: { id: string; name: string; avatar?: string; verificationLevel?: string };
}

const DESTINATIONS = [
    { name: "Paris", country: "França", image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=900&auto=format&fit=crop" },
    { name: "Tóquio", country: "Japão", image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=900&auto=format&fit=crop" },
    { name: "Nova York", country: "EUA", image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=900&auto=format&fit=crop" },
    { name: "Roma", country: "Itália", image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=900&auto=format&fit=crop" },
    { name: "Bali", country: "Indonésia", image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=900&auto=format&fit=crop" },
    { name: "Barcelona", country: "Espanha", image: "https://images.unsplash.com/photo-1583422409516-2895a77efded?q=80&w=900&auto=format&fit=crop" },
];

export default function MarketplaceShowcase() {
    const [itineraries, setItineraries] = useState<Itinerary[] | null>(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        let cancelled = false;
        fetch(`${API_BASE_URL}/itineraries`)
            .then((r) => r.ok ? r.json() : Promise.reject())
            .then((data) => { if (!cancelled) setItineraries(Array.isArray(data) ? data.slice(0, 8) : []); })
            .catch(() => { if (!cancelled) setError(true); });
        return () => { cancelled = true; };
    }, []);

    return (
        <>
            {/* ═══ ROTEIROS EM DESTAQUE ═══ */}
            <section className="section" id="roteiros-destaque" style={{ paddingTop: 56 }}>
                <div className="section-header" style={{ textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
                    <div>
                        <div className="section-tag">Marketplace</div>
                        <h2 className="section-title" style={{ textAlign: "left" }}>Roteiros em destaque</h2>
                        <p className="section-subtitle" style={{ textAlign: "left", margin: 0 }}>
                            Selecionados pela qualidade e pelas avaliações de viajantes
                        </p>
                    </div>
                    <Link href="/explore" style={{
                        color: "#0f766e", fontWeight: 600, textDecoration: "none",
                        padding: "10px 16px", borderRadius: 9999, border: "1px solid #0f766e",
                        fontSize: 14,
                    }}>
                        Ver todos →
                    </Link>
                </div>

                {itineraries === null && !error ? (
                    <div style={{
                        display: "grid", gap: 20,
                        gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                    }}>
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} style={{
                                borderRadius: 16, background: "#f3f4f6",
                                paddingTop: "62%", animation: "pulse 1.4s ease-in-out infinite",
                            }} />
                        ))}
                    </div>
                ) : itineraries && itineraries.length > 0 ? (
                    <div style={{
                        display: "grid", gap: 20,
                        gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                    }}>
                        {itineraries.map((it) => <RoteiroCard key={it.id} data={it as RoteiroCardData} />)}
                    </div>
                ) : (
                    <div style={{
                        padding: 40, textAlign: "center", background: "#f9fafb",
                        borderRadius: 16, color: "#6b7280",
                    }}>
                        <p>Em breve, novos roteiros incríveis. Que tal{" "}
                            <Link href="/dashboard/roteiro/novo" style={{ color: "#0f766e", fontWeight: 600 }}>
                                criar o seu primeiro
                            </Link>?
                        </p>
                    </div>
                )}
            </section>

            {/* ═══ DESTINOS EM ALTA ═══ */}
            <section className="section" id="destinos" style={{ paddingTop: 24 }}>
                <div className="section-header" style={{ textAlign: "left" }}>
                    <div className="section-tag">Destinos</div>
                    <h2 className="section-title" style={{ textAlign: "left" }}>Destinos em alta</h2>
                    <p className="section-subtitle" style={{ textAlign: "left", margin: 0 }}>
                        Comece pelas cidades mais procuradas pelos viajantes VAMO
                    </p>
                </div>
                <div style={{
                    display: "grid", gap: 16,
                    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                }}>
                    {DESTINATIONS.map((d) => (
                        <Link
                            key={d.name}
                            href={`/explore?q=${encodeURIComponent(d.name)}`}
                            style={{
                                position: "relative", paddingTop: "70%",
                                background: `url(${d.image}) center/cover no-repeat`,
                                borderRadius: 16, overflow: "hidden",
                                textDecoration: "none", color: "#fff",
                                display: "block", transition: "transform 220ms",
                            }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1.02)"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
                        >
                            <div style={{
                                position: "absolute", inset: 0,
                                background: "linear-gradient(to top, rgba(0,0,0,0.6), rgba(0,0,0,0) 60%)",
                            }} />
                            <div style={{
                                position: "absolute", bottom: 14, left: 16, right: 16,
                            }}>
                                <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.1 }}>{d.name}</div>
                                <div style={{ fontSize: 13, opacity: 0.9 }}>{d.country}</div>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>
        </>
    );
}

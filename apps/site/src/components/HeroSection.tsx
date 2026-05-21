"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface HeroSectionProps {
    backgroundImage?: string;
}

export default function HeroSection({
    backgroundImage = "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=2073&auto=format&fit=crop", // Paris as default
}: HeroSectionProps) {
    const router = useRouter();
    const [query, setQuery] = useState("");

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        const q = query.trim();
        if (q) router.push(`/explore?q=${encodeURIComponent(q)}`);
        else router.push("/explore");
    }

    return (
        <section
            className="hero-new"
            style={{ backgroundImage: `url(${backgroundImage})` }}
        >
            <div className="hero-overlay" />

            <div className="hero-content-new">
                {/* Headlines */}
                <div className="hero-titles">
                    <h1 className="hero-headline">
                        Para onde será sua<br />próxima aventura?
                    </h1>
                    <div className="hero-tagline">
                        Roteiros completos criados por quem já viveu.
                    </div>
                </div>

                {/* SEARCH BAR — marketplace entry */}
                <form
                    onSubmit={handleSearch}
                    style={{
                        marginTop: 28,
                        background: "#fff",
                        borderRadius: 9999,
                        padding: 6,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        maxWidth: 640,
                        boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, paddingLeft: 18, flex: 1 }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.35-4.35" />
                        </svg>
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Para onde você quer ir? Ex: Paris, Japão..."
                            style={{
                                flex: 1,
                                border: "none",
                                outline: "none",
                                fontSize: 16,
                                padding: "14px 0",
                                color: "#111",
                                background: "transparent",
                                minWidth: 0,
                            }}
                        />
                    </div>
                    <button
                        type="submit"
                        style={{
                            background: "linear-gradient(90deg, #14b8a6, #2563eb)",
                            color: "#fff",
                            fontWeight: 700,
                            border: "none",
                            padding: "14px 28px",
                            borderRadius: 9999,
                            cursor: "pointer",
                            fontSize: 15,
                            whiteSpace: "nowrap",
                        }}
                    >
                        Explorar
                    </button>
                </form>

                {/* Secondary CTAs */}
                <div style={{ display: "flex", gap: 12, marginTop: 20, flexWrap: "wrap", alignItems: "center" }}>
                    <Link href="/explore" style={{
                        display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 22px",
                        background: "rgba(255,255,255,0.15)", color: "#fff", fontWeight: 600,
                        borderRadius: 9999, border: "1px solid rgba(255,255,255,0.3)",
                        backdropFilter: "blur(10px)", textDecoration: "none", fontSize: 14,
                    }}>
                        Ver todos os roteiros →
                    </Link>
                    <Link href="/dashboard/roteiro/novo" style={{
                        display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 22px",
                        background: "rgba(255,255,255,0.15)", color: "#fff", fontWeight: 600,
                        borderRadius: 9999, border: "1px solid rgba(255,255,255,0.3)",
                        backdropFilter: "blur(10px)", textDecoration: "none", fontSize: 14,
                    }}>
                        Criar roteiro
                    </Link>
                </div>
            </div>
        </section>
    );
}

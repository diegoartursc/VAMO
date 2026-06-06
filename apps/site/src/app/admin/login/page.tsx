"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333/api";

export default function AdminLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async (event: React.FormEvent) => {
        event.preventDefault();
        setLoading(true);
        setError("");

        try {
            const response = await fetch(`${API}/admin/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || "Erro ao fazer login");
            }

            localStorage.setItem("adminToken", data.token);
            localStorage.setItem("adminUser", JSON.stringify(data.admin));
            router.replace("/admin");
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Erro ao fazer login");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: "100vh",
            background: "linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "'Inter', sans-serif",
        }}>
            <div style={{ width: "100%", maxWidth: 400, padding: "0 24px" }}>
                <div style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 24,
                    padding: 32,
                }}>
                    <h1 style={{ color: "#F1F5F9", fontSize: 22, margin: "0 0 8px" }}>VAMO Admin</h1>
                    <p style={{ color: "#94A3B8", fontSize: 14, margin: "0 0 24px" }}>
                        Entre com sua conta administrativa.
                    </p>

                    {error && (
                        <div style={{
                            padding: "12px 16px",
                            background: "rgba(239,68,68,0.12)",
                            borderRadius: 10,
                            color: "#FCA5A5",
                            fontSize: 14,
                            marginBottom: 16,
                        }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <input
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="Email"
                            autoComplete="username"
                            required
                            style={{
                                padding: "13px 16px",
                                borderRadius: 12,
                                border: "1.5px solid rgba(255,255,255,0.1)",
                                background: "rgba(255,255,255,0.06)",
                                color: "#F1F5F9",
                                fontSize: 14,
                            }}
                        />
                        <input
                            type="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            placeholder="Senha"
                            autoComplete="current-password"
                            required
                            style={{
                                padding: "13px 16px",
                                borderRadius: 12,
                                border: "1.5px solid rgba(255,255,255,0.1)",
                                background: "rgba(255,255,255,0.06)",
                                color: "#F1F5F9",
                                fontSize: 14,
                            }}
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                padding: 14,
                                borderRadius: 12,
                                border: 0,
                                background: "linear-gradient(135deg, #28C9BF, #1FA89F)",
                                color: "#fff",
                                fontSize: 15,
                                fontWeight: 700,
                                cursor: loading ? "not-allowed" : "pointer",
                                opacity: loading ? 0.7 : 1,
                            }}
                        >
                            {loading ? "Entrando..." : "Entrar"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

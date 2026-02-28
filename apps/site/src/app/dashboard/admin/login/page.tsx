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

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const res = await fetch(`${API}/admin/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Erro ao fazer login");
            localStorage.setItem("adminToken", data.token);
            localStorage.setItem("adminUser", JSON.stringify(data.admin));
            router.push("/dashboard/admin");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: "100vh",
            background: "linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'Inter', sans-serif",
        }}>
            <div style={{
                width: "100%", maxWidth: "400px", padding: "0 24px",
            }}>
                {/* Logo */}
                <div style={{ textAlign: "center", marginBottom: "40px" }}>
                    <div style={{
                        display: "inline-flex", alignItems: "center", gap: "10px",
                        marginBottom: "8px",
                    }}>
                        <div style={{
                            width: "44px", height: "44px", borderRadius: "14px",
                            background: "linear-gradient(135deg, #28C9BF, #1FA89F)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "20px", boxShadow: "0 4px 20px rgba(40,201,191,0.35)",
                        }}>🛡️</div>
                        <span style={{ fontSize: "22px", fontWeight: "800", color: "#fff" }}>VAMO Admin</span>
                    </div>
                    <p style={{ color: "#64748B", fontSize: "14px" }}>Painel de Moderação</p>
                </div>

                {/* Card */}
                <div style={{
                    background: "rgba(255,255,255,0.05)",
                    backdropFilter: "blur(20px)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "24px",
                    padding: "32px",
                }}>
                    <h1 style={{ color: "#F1F5F9", fontSize: "20px", fontWeight: "700", margin: "0 0 24px" }}>
                        Entrar como Admin
                    </h1>

                    {error && (
                        <div style={{
                            padding: "12px 16px", background: "rgba(239,68,68,0.12)",
                            border: "1px solid rgba(239,68,68,0.25)", borderRadius: "10px",
                            color: "#FCA5A5", fontSize: "14px", marginBottom: "16px",
                        }}>{error}</div>
                    )}

                    <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        <div>
                            <label style={{ display: "block", color: "#94A3B8", fontSize: "12px", fontWeight: "600", marginBottom: "6px" }}>EMAIL</label>
                            <input
                                type="email" value={email} onChange={e => setEmail(e.target.value)}
                                placeholder="admin@vamo.com" required
                                style={{
                                    width: "100%", padding: "13px 16px", borderRadius: "12px",
                                    border: "1.5px solid rgba(255,255,255,0.1)",
                                    background: "rgba(255,255,255,0.06)", color: "#F1F5F9",
                                    fontSize: "14px", outline: "none", fontFamily: "inherit",
                                    boxSizing: "border-box",
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: "block", color: "#94A3B8", fontSize: "12px", fontWeight: "600", marginBottom: "6px" }}>SENHA</label>
                            <input
                                type="password" value={password} onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••" required
                                style={{
                                    width: "100%", padding: "13px 16px", borderRadius: "12px",
                                    border: "1.5px solid rgba(255,255,255,0.1)",
                                    background: "rgba(255,255,255,0.06)", color: "#F1F5F9",
                                    fontSize: "14px", outline: "none", fontFamily: "inherit",
                                    boxSizing: "border-box",
                                }}
                            />
                        </div>
                        <button
                            type="submit" disabled={loading}
                            style={{
                                padding: "14px", borderRadius: "12px", border: "none",
                                background: "linear-gradient(135deg, #28C9BF, #1FA89F)",
                                color: "#fff", fontSize: "15px", fontWeight: "700",
                                cursor: loading ? "not-allowed" : "pointer",
                                opacity: loading ? 0.7 : 1,
                                boxShadow: "0 4px 16px rgba(40,201,191,0.3)",
                                fontFamily: "inherit",
                            }}
                        >
                            {loading ? "Entrando..." : "Entrar"}
                        </button>
                    </form>

                    <p style={{ color: "#475569", fontSize: "12px", textAlign: "center", marginTop: "20px", lineHeight: 1.5 }}>
                        Primeiro acesso? Use o endpoint <code style={{ color: "#28C9BF" }}>/api/admin/seed</code> para criar o primeiro admin.
                    </p>
                </div>
            </div>
        </div>
    );
}

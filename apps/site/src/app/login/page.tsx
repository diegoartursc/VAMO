"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "../../lib/auth";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const { useEffect } = require("react");

    useEffect(() => {
        router.push("/dashboard");
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await login(email, password);
            router.push("/dashboard");
        } catch (err: any) {
            setError(err.message || "Erro ao fazer login");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            {/* Left Side — Gradient Brand */}
            <div className="auth-side">
                <div className="auth-side-content">
                    <div className="auth-side-logo">VAMO</div>
                    <h2>Portal do Criador</h2>
                    <p>
                        Gerencie seus roteiros de viagem, acompanhe vendas e
                        conecte-se com milhares de viajantes.
                    </p>
                    <div className="auth-side-features">
                        <div className="auth-side-feature">
                            <span className="auth-feature-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
                            </span>
                            <span>Dashboard completo em tempo real</span>
                        </div>
                        <div className="auth-side-feature">
                            <div className="auth-feature-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                            </div>
                            <span>Editor de roteiros interativo</span>
                        </div>
                        <div className="auth-side-feature">
                            <div className="auth-feature-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>
                            </div>
                            <span>Gestão de conteúdo e preços</span>
                        </div>
                        <div className="auth-side-feature">
                            <div className="auth-feature-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></svg>
                            </div>
                            <span>Alcance milhares de viajantes</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side — Form */}
            <div className="auth-form-side">
                <div className="auth-card">
                    <div className="auth-logo">
                        <Link href="/" className="logo" style={{ fontSize: 36 }}>
                            VAM<span>O</span>
                        </Link>
                    </div>
                    <h1 className="auth-title">Bem-vindo de volta</h1>
                    <p className="auth-subtitle">
                        Entre no Portal do Criador para gerenciar seus roteiros
                    </p>

                    {error && (
                        <div className="auth-error">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                            {error}
                        </div>
                    )}

                    <form className="auth-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">E-mail</label>
                            <input
                                type="email"
                                className="form-input"
                                placeholder="seu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Senha</label>
                            <input
                                type="password"
                                className="form-input"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="auth-submit"
                            disabled={loading}
                        >
                            {loading ? "Entrando..." : "Entrar"}
                            {!loading && <span style={{ marginLeft: 8 }}>→</span>}
                        </button>
                    </form>

                    <div className="auth-divider">
                        <span>ou</span>
                    </div>

                    <p className="auth-footer">
                        Não tem conta? <Link href="/cadastro">Cadastre-se grátis</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { register } from "../../lib/auth";

export default function CadastroPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const next = searchParams.get("next");
    const [form, setForm] = useState({
        agencyName: "",
        cpf: "",
        phone: "",
        employeeName: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm((prev) => ({ ...prev, [field]: e.target.value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (form.password !== form.confirmPassword) {
            setError("As senhas não coincidem");
            return;
        }

        if (form.password.length < 6) {
            setError("A senha deve ter no mínimo 6 caracteres");
            return;
        }

        setLoading(true);

        try {
            await register({
                agencyName: form.agencyName,
                cpf: form.cpf.replace(/\D/g, ""),
                phone: form.phone || undefined,
                employeeName: form.employeeName,
                email: form.email,
                password: form.password,
            });
            router.push(next && next.startsWith("/") ? next : "/perfil");
        } catch (err: any) {
            setError(err.message || "Erro ao cadastrar");
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
                    <h2>Torne-se um Criador</h2>
                    <p>
                        Crie sua conta gratuita e comece a publicar roteiros de
                        viagem na maior plataforma de turismo do Brasil.
                    </p>
                    <div className="auth-side-features">
                        <div className="auth-side-feature">
                            <div className="auth-feature-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                            </div>
                            <span>Cadastro gratuito e rápido</span>
                        </div>
                        <div className="auth-side-feature">
                            <div className="auth-feature-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 7V5a4 4 0 00-8 0v2" /></svg>
                            </div>
                            <span>Dados protegidos e seguros</span>
                        </div>
                        <div className="auth-side-feature">
                            <div className="auth-feature-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                            </div>
                            <span>Editor de roteiros completo</span>
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
                    <h1 className="auth-title">Criar Conta</h1>
                    <p className="auth-subtitle">
                        Preencha seus dados para começar a criar roteiros
                    </p>

                    {error && (
                        <div className="auth-error">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                            {error}
                        </div>
                    )}

                    <form className="auth-form" onSubmit={handleSubmit}>
                        <div className="form-section-label">Dados do Criador</div>
                        <div className="form-group">
                            <label className="form-label">Nome do Perfil</label>
                            <input type="text" className="form-input" placeholder="Viagens da Ana" value={form.agencyName} onChange={set("agencyName")} required />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">CPF</label>
                                <input type="text" className="form-input" placeholder="000.000.000-00" value={form.cpf} onChange={set("cpf")} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Telefone (opcional)</label>
                                <input type="text" className="form-input" placeholder="(11) 99999-9999" value={form.phone} onChange={set("phone")} />
                            </div>
                        </div>

                        <div className="form-section-label" style={{ marginTop: 16 }}>Seu Acesso</div>
                        <div className="form-group">
                            <label className="form-label">Seu Nome</label>
                            <input type="text" className="form-input" placeholder="Ana Silva" value={form.employeeName} onChange={set("employeeName")} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">E-mail</label>
                            <input type="email" className="form-input" placeholder="ana@agencia.com" value={form.email} onChange={set("email")} required />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Senha</label>
                                <input type="password" className="form-input" placeholder="••••••••" value={form.password} onChange={set("password")} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Confirmar Senha</label>
                                <input type="password" className="form-input" placeholder="••••••••" value={form.confirmPassword} onChange={set("confirmPassword")} required />
                            </div>
                        </div>

                        <button type="submit" className="auth-submit" disabled={loading}>
                            {loading ? "Cadastrando..." : "Criar Conta Grátis"}
                            {!loading && <span style={{ marginLeft: 8 }}>→</span>}
                        </button>
                    </form>

                    <div className="auth-divider">
                        <span>ou</span>
                    </div>

                    <p className="auth-footer">
                        Já tem conta? <Link href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"}>Faça login</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

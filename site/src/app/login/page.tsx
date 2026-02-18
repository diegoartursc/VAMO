import Link from "next/link";

export default function LoginPage() {
    return (
        <div className="auth-page">
            {/* Left Side — Gradient Brand */}
            <div className="auth-side">
                <div className="auth-side-content">
                    <div className="auth-side-logo">VAMO</div>
                    <h2>Portal do Criador</h2>
                    <p>
                        Gerencie seus roteiros, acompanhe vendas e transforme
                        suas experiências de viagem em renda.
                    </p>
                    <div className="auth-side-features">
                        <div className="auth-side-feature">
                            <span>📊</span>
                            <span>Dashboard completo em tempo real</span>
                        </div>
                        <div className="auth-side-feature">
                            <span>✏️</span>
                            <span>Editor com 13 seções editáveis</span>
                        </div>
                        <div className="auth-side-feature">
                            <span>💰</span>
                            <span>Até 85% de comissão por venda</span>
                        </div>
                        <div className="auth-side-feature">
                            <span>🌍</span>
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

                    <form className="auth-form">
                        <div className="form-group">
                            <label className="form-label">E-mail</label>
                            <input
                                type="email"
                                className="form-input"
                                placeholder="seu@email.com"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Senha</label>
                            <input
                                type="password"
                                className="form-input"
                                placeholder="••••••••"
                            />
                        </div>
                        <Link href="/dashboard">
                            <button type="button" className="auth-submit">
                                Entrar →
                            </button>
                        </Link>
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

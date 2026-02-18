import Link from "next/link";

export default function CadastroPage() {
    return (
        <div className="auth-page">
            {/* Left Side — Gradient Brand */}
            <div className="auth-side">
                <div className="auth-side-content">
                    <div className="auth-side-logo">VAMO</div>
                    <h2>Comece a criar</h2>
                    <p>
                        Cadastre-se gratuitamente e transforme suas viagens
                        em roteiros que geram renda recorrente.
                    </p>
                    <div className="auth-side-features">
                        <div className="auth-side-feature">
                            <span>✅</span>
                            <span>Cadastro 100% gratuito</span>
                        </div>
                        <div className="auth-side-feature">
                            <span>🗺️</span>
                            <span>Crie roteiros ilimitados</span>
                        </div>
                        <div className="auth-side-feature">
                            <span>💰</span>
                            <span>Receba até 85% de cada venda</span>
                        </div>
                        <div className="auth-side-feature">
                            <span>📈</span>
                            <span>Acompanhe tudo pelo dashboard</span>
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
                    <h1 className="auth-title">Crie sua conta</h1>
                    <p className="auth-subtitle">
                        Comece a criar roteiros e ganhar com suas experiências
                    </p>

                    <form className="auth-form">
                        <div className="form-group">
                            <label className="form-label">Nome completo</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Seu nome"
                            />
                        </div>
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
                                placeholder="Mínimo 8 caracteres"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Confirmar senha</label>
                            <input
                                type="password"
                                className="form-input"
                                placeholder="Digite novamente"
                            />
                        </div>
                        <Link href="/dashboard">
                            <button type="button" className="auth-submit">
                                Criar Conta Grátis →
                            </button>
                        </Link>
                    </form>

                    <p className="auth-footer">
                        Já tem conta? <Link href="/login">Fazer login</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

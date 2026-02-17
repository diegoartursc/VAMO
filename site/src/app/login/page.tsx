import Link from "next/link";

export default function LoginPage() {
    return (
        <div className="auth-page">
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
                            Entrar
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
    );
}

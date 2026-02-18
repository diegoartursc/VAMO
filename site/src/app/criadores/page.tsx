import Link from "next/link";

export default function CriadoresPage() {
    return (
        <>
            <header className="header">
                <nav className="nav">
                    <Link href="/" className="logo">VAM<span>O</span></Link>
                    <div className="nav-links">
                        <Link href="/" className="nav-link">Início</Link>
                        <Link href="/criadores" className="nav-link" style={{ color: 'var(--primary)' }}>Para Criadores</Link>
                        <Link href="/login" className="nav-cta">Entrar →</Link>
                    </div>
                </nav>
            </header>

            {/* Hero */}
            <section className="hero">
                <div className="hero-content">
                    <div className="hero-badge">🗺️ Portal do Criador</div>
                    <h1>
                        Transforme suas viagens<br />
                        em <span className="highlight">renda recorrente</span>
                    </h1>
                    <p>
                        Crie roteiros detalhados com suas experiências de viagem e ganhe
                        comissão a cada venda. Alcance milhares de viajantes no app VAMO.
                    </p>
                    <div className="hero-actions">
                        <Link href="/cadastro" className="btn-primary">Começar Agora — É Grátis</Link>
                        <Link href="/login" className="btn-secondary">Já tenho conta</Link>
                    </div>

                    <div className="stats-bar">
                        <div className="stat-item">
                            <div className="stat-value">85%</div>
                            <div className="stat-label">Comissão por venda</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-value">R$ 0</div>
                            <div className="stat-label">Investimento inicial</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-value">5.000+</div>
                            <div className="stat-label">Viajantes na plataforma</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How it works for creators */}
            <section className="section">
                <div className="section-header">
                    <div className="section-tag">📋 Para criadores</div>
                    <h2 className="section-title">Como funciona para você</h2>
                    <p className="section-subtitle">Crie, publique e ganhe com seus roteiros</p>
                </div>
                <div className="steps-grid">
                    <div className="step-card">
                        <div className="step-number">1</div>
                        <div className="step-icon">📝</div>
                        <h3>Crie sua conta</h3>
                        <p>Cadastre-se gratuitamente e preencha seu perfil de criador.</p>
                    </div>
                    <div className="step-card">
                        <div className="step-number">2</div>
                        <div className="step-icon">🗺️</div>
                        <h3>Monte o roteiro</h3>
                        <p>Use nosso editor completo para criar roteiros dia a dia.</p>
                    </div>
                    <div className="step-card">
                        <div className="step-number">3</div>
                        <div className="step-icon">📢</div>
                        <h3>Publique</h3>
                        <p>Seu roteiro fica disponível para milhares de viajantes no app.</p>
                    </div>
                    <div className="step-card">
                        <div className="step-number">4</div>
                        <div className="step-icon">💰</div>
                        <h3>Ganhe</h3>
                        <p>Receba até 85% de comissão por cada venda realizada.</p>
                    </div>
                </div>
            </section>

            {/* Benefits */}
            <section className="features-section">
                <div className="section-header">
                    <div className="section-tag">💎 Benefícios</div>
                    <h2 className="section-title">Por que criar no VAMO?</h2>
                </div>
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon teal">💰</div>
                        <h3>Até 85% de comissão</h3>
                        <p>A maior comissão do mercado. Você define o preço e recebe a maior parte.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon amber">📊</div>
                        <h3>Dashboard completo</h3>
                        <p>Acompanhe vendas, visualizações, avaliações e receita em tempo real.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon blue">✏️</div>
                        <h3>Editor poderoso</h3>
                        <p>13 seções editáveis: dias, atividades, hospedagem, gastos, checklist e muito mais.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon green">🌍</div>
                        <h3>Alcance global</h3>
                        <p>Seus roteiros ficam disponíveis para milhares de viajantes no Brasil e no mundo.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon purple">🔒</div>
                        <h3>Proteção de conteúdo</h3>
                        <p>Seu conteúdo é protegido e só acessível por quem comprou.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon pink">💬</div>
                        <h3>Suporte dedicado</h3>
                        <p>Equipe exclusiva para ajudar criadores a ter mais sucesso.</p>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="section">
                <div className="creators-cta">
                    <h2>Pronto para começar? 🚀</h2>
                    <p>
                        Não precisa de investimento. Cadastre-se agora e comece a
                        compartilhar suas experiências com o mundo.
                    </p>
                    <Link href="/cadastro" className="btn-white">
                        Criar Minha Conta Grátis →
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="footer">
                <div className="footer-content">
                    <div className="footer-brand">
                        <div className="logo">VAM<span>O</span></div>
                        <p className="footer-desc">
                            Sua plataforma de viagens. Conectamos viajantes às melhores
                            experiências ao redor do mundo.
                        </p>
                    </div>
                    <div className="footer-column">
                        <h4>Produto</h4>
                        <Link href="/">Para viajantes</Link>
                        <Link href="/criadores">Para criadores</Link>
                    </div>
                    <div className="footer-column">
                        <h4>Suporte</h4>
                        <a href="#">Central de ajuda</a>
                        <a href="#">WhatsApp</a>
                    </div>
                    <div className="footer-column">
                        <h4>Legal</h4>
                        <a href="#">Termos de uso</a>
                        <a href="#">Privacidade</a>
                    </div>
                </div>
                <div className="footer-bottom">
                    <span>© 2026 VAMO. Todos os direitos reservados.</span>
                    <span>Feito com ❤️ no Brasil</span>
                </div>
            </footer>
        </>
    );
}

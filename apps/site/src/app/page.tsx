import Link from "next/link";

export default function Home() {
  return (
    <>
      {/* ═══ HEADER ═══ */}
      <header className="header">
        <nav className="nav">
          <Link href="/" className="logo">
            VAM<span>O</span>
          </Link>
          <div className="nav-links">
            <a href="#como-funciona" className="nav-link">Como funciona</a>
            <a href="#viajantes" className="nav-link">Viajantes</a>
            <Link href="/criador" className="nav-link">Criadores</Link>
            <Link href="/agencia" className="nav-link">Agências</Link>
            <Link href="/admin" className="nav-link">ADM</Link>
            <a href="#faq" className="nav-link">FAQ</a>
            <Link href="/login" className="nav-cta">
              Entrar →
            </Link>
          </div>
        </nav>
      </header>

      {/* ═══ HERO ═══ */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">✨ Plataforma #1 de roteiros de viagem</div>
          <h1>
            Sua próxima aventura<br />
            <span className="highlight">começa aqui.</span>
          </h1>
          <p>
            Descubra pacotes incríveis e roteiros criados por viajantes
            experientes. Planeje, reserve e viaje com confiança.
          </p>
          <div className="hero-actions">
            <button className="btn-primary">📱 Baixe o App Grátis</button>
            <Link href="/criadores" className="btn-secondary">
              🗺️ Seja um Criador
            </Link>
          </div>

          {/* Stats */}
          <div className="stats-bar">
            <div className="stat-item">
              <div className="stat-value">5.000+</div>
              <div className="stat-label">Viajantes ativos</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">200+</div>
              <div className="stat-label">Roteiros exclusivos</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">50+</div>
              <div className="stat-label">Destinos</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">4.9 ⭐</div>
              <div className="stat-label">Avaliação média</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ TRUST BADGE ═══ */}
      <div className="trust-badge">
        🛡️ Agências verificadas &nbsp;•&nbsp; 💰 Preço final garantido &nbsp;•&nbsp; 🔒 Compra segura
      </div>

      {/* ═══ COMO FUNCIONA ═══ */}
      <section className="section" id="como-funciona">
        <div className="section-header">
          <div className="section-tag">📋 Processo</div>
          <h2 className="section-title">Como funciona</h2>
          <p className="section-subtitle">
            Do planejamento à viagem em 4 passos simples
          </p>
        </div>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">1</div>
            <div className="step-icon">🔍</div>
            <h3>Explore</h3>
            <p>Navegue por pacotes de viagem e roteiros de viajantes experientes.</p>
          </div>
          <div className="step-card">
            <div className="step-number">2</div>
            <div className="step-icon">💎</div>
            <h3>Escolha</h3>
            <p>Selecione a experiência perfeita e verifique disponibilidade.</p>
          </div>
          <div className="step-card">
            <div className="step-number">3</div>
            <div className="step-icon">🔒</div>
            <h3>Reserve</h3>
            <p>Complete seu cadastro e finalize a reserva com segurança.</p>
          </div>
          <div className="step-card">
            <div className="step-number">4</div>
            <div className="step-icon">✈️</div>
            <h3>Viaje!</h3>
            <p>Receba todas as informações e aproveite sua aventura.</p>
          </div>
        </div>
      </section>

      {/* ═══ PARA VIAJANTES ═══ */}
      <section className="features-section" id="viajantes">
        <div className="section-header">
          <div className="section-tag">🧳 Viajantes</div>
          <h2 className="section-title">Por que escolher o VAMO?</h2>
          <p className="section-subtitle">
            Tudo que você precisa para planejar a viagem perfeita
          </p>
        </div>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon teal">✅</div>
            <h3>Agências verificadas</h3>
            <p>Todas as agências passam por um processo rigoroso de verificação antes de publicar pacotes.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon amber">💰</div>
            <h3>Preço final garantido</h3>
            <p>O preço que você vê é o preço que você paga. Sem taxas escondidas ou surpresas.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon blue">🗺️</div>
            <h3>Roteiros exclusivos</h3>
            <p>Acesse roteiros criados por viajantes locais com dicas que só quem já esteve lá sabe.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon green">🛡️</div>
            <h3>Compra segura</h3>
            <p>Pagamentos protegidos com criptografia e política de reembolso transparente.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon purple">📊</div>
            <h3>Compare preços</h3>
            <p>Veja pacotes de diferentes agências para o mesmo destino lado a lado.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon pink">💬</div>
            <h3>Suporte 24h</h3>
            <p>Nossa equipe está sempre disponível para ajudar antes, durante e depois da viagem.</p>
          </div>
        </div>
      </section>

      {/* ═══ PARA CRIADORES ═══ */}
      <section className="section" style={{ paddingBottom: 60 }}>
        <div className="creators-cta">
          <h2>Transforme suas viagens em renda 🚀</h2>
          <p>
            Crie roteiros detalhados, compartilhe sua experiência e ganhe
            comissão a cada venda. Sem investimento inicial.
          </p>
          <Link href="/cadastro" className="btn-white">
            Comece a Criar Agora →
          </Link>
          <div className="creators-benefits">
            <div className="creator-benefit">✅ Cadastro gratuito</div>
            <div className="creator-benefit">💰 Até 85% de comissão</div>
            <div className="creator-benefit">📈 Dashboard completo</div>
            <div className="creator-benefit">🌍 Alcance global</div>
          </div>
        </div>
      </section>

      {/* ═══ DEPOIMENTOS ═══ */}
      <section className="section" id="depoimentos">
        <div className="section-header">
          <div className="section-tag">💬 Depoimentos</div>
          <h2 className="section-title">O que dizem nossos viajantes</h2>
          <p className="section-subtitle">
            Mais de 5.000 viajantes já encontraram a viagem perfeita
          </p>
        </div>
        <div className="testimonials-grid">
          <div className="testimonial-card">
            <div className="testimonial-stars">★★★★★</div>
            <p className="testimonial-text">
              &ldquo;O roteiro de Paris foi incrível! Cada detalhe pensado, desde restaurantes até transporte. Economizei horas de planejamento.&rdquo;
            </p>
            <div className="testimonial-author">
              <div className="testimonial-avatar">🧑‍💼</div>
              <div>
                <div className="testimonial-name">Carlos M.</div>
                <div className="testimonial-trip">Paris, 2026</div>
              </div>
            </div>
          </div>
          <div className="testimonial-card">
            <div className="testimonial-stars">★★★★★</div>
            <p className="testimonial-text">
              &ldquo;Como criadora, já vendi mais de 500 roteiros. A plataforma é simples e o suporte é excepcional. Recomendo muito!&rdquo;
            </p>
            <div className="testimonial-author">
              <div className="testimonial-avatar">👩‍✈️</div>
              <div>
                <div className="testimonial-name">Ana L.</div>
                <div className="testimonial-trip">Criadora de roteiros</div>
              </div>
            </div>
          </div>
          <div className="testimonial-card">
            <div className="testimonial-stars">★★★★★</div>
            <p className="testimonial-text">
              &ldquo;Encontrei um pacote para o Japão com preço muito melhor do que nas agências tradicionais. Viagem perfeita do início ao fim.&rdquo;
            </p>
            <div className="testimonial-author">
              <div className="testimonial-avatar">🧑‍🎨</div>
              <div>
                <div className="testimonial-name">Rafael S.</div>
                <div className="testimonial-trip">Tóquio, 2026</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="section" id="faq">
        <div className="section-header">
          <div className="section-tag">❓ Dúvidas</div>
          <h2 className="section-title">Perguntas frequentes</h2>
        </div>
        <div className="faq-list">
          <div className="faq-item">
            <div className="faq-question">O que é o VAMO?</div>
            <p className="faq-answer">
              O VAMO é uma plataforma que conecta viajantes a pacotes verificados de agências e
              roteiros criados por viajantes experientes. Tudo em um só lugar.
            </p>
          </div>
          <div className="faq-item">
            <div className="faq-question">Como funciona a compra de roteiros?</div>
            <p className="faq-answer">
              Ao comprar um roteiro, você recebe acesso instantâneo a um guia completo com
              itinerário dia a dia, hospedagens recomendadas, dicas exclusivas, mapas e muito mais.
              É um produto digital — a viagem em si deve ser planejada separadamente.
            </p>
          </div>
          <div className="faq-item">
            <div className="faq-question">As agências são confiáveis?</div>
            <p className="faq-answer">
              Sim! Todas as agências passam por um processo de verificação antes de publicar
              pacotes na plataforma. Monitoramos avaliações e garantimos padrões de qualidade.
            </p>
          </div>
          <div className="faq-item">
            <div className="faq-question">Como me torno um criador de roteiros?</div>
            <p className="faq-answer">
              Basta criar uma conta no portal de criadores, preencher suas informações e começar
              a criar roteiros. Após revisão, seus roteiros ficam disponíveis para venda no app.
            </p>
          </div>
          <div className="faq-item">
            <div className="faq-question">Qual a comissão para criadores?</div>
            <p className="faq-answer">
              Criadores recebem até 85% do valor de cada venda. O restante cobre taxas de
              pagamento e manutenção da plataforma.
            </p>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="logo">
              VAM<span>O</span>
            </div>
            <p className="footer-desc">
              Sua plataforma de viagens. Conectamos viajantes às melhores
              experiências ao redor do mundo.
            </p>
          </div>
          <div className="footer-column">
            <h4>Produto</h4>
            <a href="#como-funciona">Como funciona</a>
            <a href="#viajantes">Para viajantes</a>
            <Link href="/criadores">Para criadores</Link>
            <a href="#">Preços</a>
          </div>
          <div className="footer-column">
            <h4>Suporte</h4>
            <a href="#">Central de ajuda</a>
            <a href="#">Fale conosco</a>
            <a href="#">WhatsApp</a>
            <a href="#">Status</a>
          </div>
          <div className="footer-column">
            <h4>Legal</h4>
            <a href="#">Termos de uso</a>
            <a href="#">Privacidade</a>
            <a href="#">Cookies</a>
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

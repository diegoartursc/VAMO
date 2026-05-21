import Link from "next/link";
import HeroSection from "@/components/HeroSection";
import GlobalHeader from "@/components/GlobalHeader";
import MarketplaceShowcase from "@/components/MarketplaceShowcase";

// ─── SVG Icons (inline, Lucide-style) ───────────────────
const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6L9 17l-5-5"/>
  </svg>
);
const IconShield = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const IconMap = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
    <line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>
  </svg>
);
const IconSearch = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
);
const IconStar = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);
const IconLock = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const IconPlane = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 19.5 2.5 18 1 16 1 14.5 2.5L11 6 2.8 4.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 1 1 1 1 1-1v-3l3-2 5.2 7.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
  </svg>
);
const IconVerified = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);
const IconDollar = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
);
const IconCompass = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
  </svg>
);
const IconBarChart = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
);
const IconMessageCircle = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);
const IconTrendingUp = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
  </svg>
);
const IconGlobe = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);

export default function Home() {
  return (
    <>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10 }}>
        <GlobalHeader variant="transparent" />
      </div>

      {/* HERO — busca + entrada do marketplace */}
      <HeroSection />

      {/* TRUST BAR — credibilidade rápida */}
      <div className="trust-badge">
        <div className="trust-badge-item">
          <IconVerified />
          Roteiros verificados por especialistas
        </div>
        <div className="trust-badge-divider" />
        <div className="trust-badge-item">
          <IconMap />
          Dicas exclusivas de quem esteve lá
        </div>
        <div className="trust-badge-divider" />
        <div className="trust-badge-item">
          <IconLock />
          Compra 100% segura
        </div>
      </div>

      {/* ═══ MARKETPLACE — ROTEIROS EM DESTAQUE + DESTINOS ═══ */}
      <MarketplaceShowcase />

      {/* ═══ CTA CRIADOR — virou marketplace, agora apresenta o caminho criador ═══ */}
      <section className="section" style={{ paddingBottom: 60 }}>
        <div className="creators-cta">
          <h2>Transforme suas viagens em renda</h2>
          <p>
            Crie roteiros detalhados, compartilhe sua experiência e ganhe
            comissão a cada venda. Sem investimento inicial.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/dashboard/roteiro/novo" className="btn-white">
              Criar meu primeiro roteiro →
            </Link>
            <Link href="/criadores" style={{
              display: "inline-flex", alignItems: "center", gap: 8, padding: "16px 32px",
              background: "rgba(255,255,255,0.18)", color: "#fff", fontWeight: 600,
              borderRadius: 9999, border: "1px solid rgba(255,255,255,0.3)",
              textDecoration: "none",
            }}>
              Saber mais
            </Link>
          </div>
          <div className="creators-benefits">
            <div className="creator-benefit"><IconCheck /> Cadastro gratuito</div>
            <div className="creator-benefit"><IconDollar /> Até 85% de comissão</div>
            <div className="creator-benefit"><IconTrendingUp /> Dashboard completo</div>
            <div className="creator-benefit"><IconGlobe /> Alcance global</div>
          </div>
        </div>
      </section>

      {/* ═══ COMO FUNCIONA — institucional, agora reposicionado ═══ */}
      <section className="section" id="como-funciona">
        <div className="section-header">
          <div className="section-tag">Processo</div>
          <h2 className="section-title">Como funciona</h2>
          <p className="section-subtitle">
            Do planejamento à viagem em 4 passos simples
          </p>
        </div>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">1</div>
            <div className="step-icon"><IconSearch /></div>
            <h3>Explore</h3>
            <p>Navegue por roteiros detalhados criados por viajantes experientes.</p>
          </div>
          <div className="step-card">
            <div className="step-number">2</div>
            <div className="step-icon"><IconStar /></div>
            <h3>Escolha</h3>
            <p>Selecione o roteiro perfeito e confira todos os detalhes do itinerário.</p>
          </div>
          <div className="step-card">
            <div className="step-number">3</div>
            <div className="step-icon"><IconLock /></div>
            <h3>Reserve</h3>
            <p>Adquira o roteiro e receba acesso imediato a todo o conteúdo.</p>
          </div>
          <div className="step-card">
            <div className="step-number">4</div>
            <div className="step-icon"><IconPlane /></div>
            <h3>Viaje!</h3>
            <p>Receba todas as informações e aproveite sua aventura.</p>
          </div>
        </div>
      </section>

      {/* ═══ POR QUE VAMO — institucional preservado ═══ */}
      <section className="features-section" id="viajantes">
        <div className="section-header">
          <div className="section-tag">Viajantes</div>
          <h2 className="section-title">Por que escolher o VAMO?</h2>
          <p className="section-subtitle">
            Tudo que você precisa para planejar a viagem perfeita
          </p>
        </div>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon teal"><IconVerified /></div>
            <h3>Roteiros verificados</h3>
            <p>Todos os roteiros passam por uma curadoria para garantir a melhor experiência para você.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon amber"><IconDollar /></div>
            <h3>Dicas de especialistas</h3>
            <p>Acesse informações privilegiadas de quem já esteve no destino e conhece cada detalhe.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon blue"><IconCompass /></div>
            <h3>Roteiros exclusivos</h3>
            <p>Acesse roteiros criados por viajantes locais com dicas que só quem já esteve lá sabe.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon green"><IconShield /></div>
            <h3>Compra segura</h3>
            <p>Pagamentos protegidos com criptografia e política de reembolso transparente.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon purple"><IconBarChart /></div>
            <h3>Fácil planejamento</h3>
            <p>Economize dezenas de horas de pesquisa com itinerários prontos para seguir.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon pink"><IconMessageCircle /></div>
            <h3>Suporte 24h</h3>
            <p>Nossa equipe está sempre disponível para ajudar antes, durante e depois da viagem.</p>
          </div>
        </div>
      </section>

      {/* ═══ DEPOIMENTOS ═══ */}
      <section className="section" id="depoimentos">
        <div className="section-header">
          <div className="section-tag">Depoimentos</div>
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
              <div className="testimonial-avatar">C</div>
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
              <div className="testimonial-avatar">A</div>
              <div>
                <div className="testimonial-name">Ana L.</div>
                <div className="testimonial-trip">Criadora de roteiros</div>
              </div>
            </div>
          </div>
          <div className="testimonial-card">
            <div className="testimonial-stars">★★★★★</div>
            <p className="testimonial-text">
              &ldquo;Encontrei um roteiro incrível do Japão com dicas que só quem já morou lá sabe. Viagem perfeita do início ao fim.&rdquo;
            </p>
            <div className="testimonial-author">
              <div className="testimonial-avatar">R</div>
              <div>
                <div className="testimonial-name">Rafael S.</div>
                <div className="testimonial-trip">Tóquio, 2026</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ BAIXAR APP — agora como complemento, não como foco ═══ */}
      <section className="section" id="app" style={{ paddingTop: 30 }}>
        <div style={{
          background: "linear-gradient(135deg, #0f766e, #1e3a8a)",
          borderRadius: 24, padding: "48px 32px",
          color: "#fff", textAlign: "center",
          maxWidth: 1100, margin: "0 auto",
        }}>
          <div className="section-tag" style={{ background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)" }}>
            App VAMO
          </div>
          <h2 style={{ fontSize: 32, fontWeight: 700, margin: "12px 0 8px" }}>
            Leve seus roteiros pra qualquer lugar
          </h2>
          <p style={{ fontSize: 16, opacity: 0.92, maxWidth: 560, margin: "0 auto 24px" }}>
            Mesmos roteiros, mesma conta — sincronizados no app mobile.
            Use offline durante a viagem.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="https://play.google.com/store/apps/details?id=com.vamo.app" target="_blank" rel="noopener noreferrer" style={{
              display: "inline-flex", alignItems: "center", gap: 10, padding: "10px 20px 10px 14px",
              background: "#000", color: "#fff", borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.3)", textDecoration: "none", minWidth: 160,
            }}>
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none">
                <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92z" fill="#4285F4"/>
                <path d="M17.556 8.236L5.148.856a1.003 1.003 0 00-1.04-.02l9.683 9.683 3.765-2.283z" fill="#EA4335"/>
                <path d="M17.556 15.764l-3.765-2.283-9.683 9.683c.32.178.716.19 1.04-.02l12.408-7.38z" fill="#34A853"/>
                <path d="M21.003 12c0-.402-.2-.77-.527-.99l-2.92-1.774-3.765 2.283v.962l3.765 2.283 2.92-1.774c.327-.22.527-.588.527-.99z" fill="#FBBC05"/>
              </svg>
              <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
                <span style={{ fontSize: 10, fontWeight: 400, opacity: 0.9 }}>Disponível no</span>
                <span style={{ fontSize: 16, fontWeight: 600 }}>Google Play</span>
              </div>
            </a>
            <a href="https://apps.apple.com/app/vamo/id6476234567" target="_blank" rel="noopener noreferrer" style={{
              display: "inline-flex", alignItems: "center", gap: 10, padding: "10px 20px 10px 14px",
              background: "#000", color: "#fff", borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.3)", textDecoration: "none", minWidth: 160,
            }}>
              <svg viewBox="0 0 24 24" width="28" height="28" fill="#fff">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
                <span style={{ fontSize: 10, fontWeight: 400, opacity: 0.9 }}>Baixar na</span>
                <span style={{ fontSize: 16, fontWeight: 600 }}>App Store</span>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="section" id="faq">
        <div className="section-header">
          <div className="section-tag">Dúvidas</div>
          <h2 className="section-title">Perguntas frequentes</h2>
        </div>
        <div className="faq-list">
          <div className="faq-item">
            <div className="faq-question">O que é o VAMO?</div>
            <p className="faq-answer">
              O VAMO é uma plataforma onde você encontra roteiros de viagem detalhados
              criados por viajantes experientes e especialistas. Tudo em um só lugar.
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
            <div className="faq-question">Os roteiros são confiáveis?</div>
            <p className="faq-answer">
              Sim! Todos os roteiros passam por um processo de curadoria antes de serem
              publicados na plataforma. Monitoramos avaliações e garantimos a qualidade do conteúdo.
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
              Roteiros de viagem criados por quem já esteve lá.
              Descubra destinos incríveis ao redor do mundo.
            </p>
          </div>
          <div className="footer-column">
            <h4>Produto</h4>
            <Link href="/explore">Explorar roteiros</Link>
            <a href="#como-funciona">Como funciona</a>
            <Link href="/criadores">Para criadores</Link>
            <Link href="/dashboard/roteiro/novo">Criar roteiro</Link>
          </div>
          <div className="footer-column">
            <h4>Suporte</h4>
            <a href="mailto:contato@vamo.app">Central de ajuda</a>
            <a href="mailto:contato@vamo.app">Fale conosco</a>
            <a href="https://wa.me/5511999999999?text=Olá! Preciso de ajuda." target="_blank" rel="noopener noreferrer">WhatsApp</a>
            <a href="https://status.vamo.app" target="_blank" rel="noopener noreferrer">Status</a>
          </div>
          <div className="footer-column">
            <h4>Legal</h4>
            <a href="/termos">Termos de uso</a>
            <a href="/privacidade">Privacidade</a>
            <a href="/privacidade">Cookies</a>
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

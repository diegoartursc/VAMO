import Link from "next/link";
import HeroSection from "@/components/HeroSection";
import GlobalHeader from "@/components/GlobalHeader";

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
const IconUsers = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
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
      <HeroSection />

      {/* ═══ TRUST BAR ═══ */}
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

      {/* ═══ COMO FUNCIONA ═══ */}
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

      {/* ═══ PARA VIAJANTES ═══ */}
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

      {/* ═══ PARA CRIADORES ═══ */}
      <section className="section" style={{ paddingBottom: 60 }}>
        <div className="creators-cta">
          <h2>Transforme suas viagens em renda</h2>
          <p>
            Crie roteiros detalhados, compartilhe sua experiência e ganhe
            comissão a cada venda. Sem investimento inicial.
          </p>
          <Link href="/cadastro" className="btn-white">
            Comece a Criar Agora →
          </Link>
          <div className="creators-benefits">
            <div className="creator-benefit"><IconCheck /> Cadastro gratuito</div>
            <div className="creator-benefit"><IconDollar /> Até 85% de comissão</div>
            <div className="creator-benefit"><IconTrendingUp /> Dashboard completo</div>
            <div className="creator-benefit"><IconGlobe /> Alcance global</div>
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
            <a href="#como-funciona">Como funciona</a>
            <a href="#viajantes">Para viajantes</a>
            <Link href="/criadores">Para criadores</Link>
            <Link href="/cadastro">Preços</Link>
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

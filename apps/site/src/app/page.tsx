import Link from "next/link";
import HeroSection from "@/components/HeroSection";

export default function Home() {
  return (
    <>
      <HeroSection />

      {/* ═══ TRUST BADGE ═══ */}
      <div className="trust-badge">
        🗺️ Roteiros verificados &nbsp;•&nbsp; 🎒 Dicas de especialistas &nbsp;•&nbsp; 🔒 Compra segura
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
            <p>Navegue por roteiros detalhados criados por viajantes experientes.</p>
          </div>
          <div className="step-card">
            <div className="step-number">2</div>
            <div className="step-icon">💎</div>
            <h3>Escolha</h3>
            <p>Selecione o roteiro perfeito e confira todos os detalhes do itinerário.</p>
          </div>
          <div className="step-card">
            <div className="step-number">3</div>
            <div className="step-icon">🔒</div>
            <h3>Reserve</h3>
            <p>Adquira o roteiro e receba acesso imediato a todo o conteúdo.</p>
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
            <h3>Roteiros verificados</h3>
            <p>Todos os roteiros passam por uma curadoria para garantir a melhor experiência para você.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon amber">💰</div>
            <h3>Dicas de especialistas</h3>
            <p>Acesse informações privilegiadas de quem já esteve no destino e conhece cada detalhe.</p>
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
            <h3>Fácil planejamento</h3>
            <p>Economize dezenas de horas de pesquisa com itinerários prontos para seguir.</p>
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
              &ldquo;Encontrei um roteiro incrível do Japão com dicas que só quem já morou lá sabe. Viagem perfeita do início ao fim.&rdquo;
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
            <a href="/termos" >Termos de uso</a>
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

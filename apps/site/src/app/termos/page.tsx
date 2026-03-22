'use client';

export default function TermosPage() {
  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f1b2d 0%, #1a3263 50%, #0f1b2d 100%)',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '60px 20px',
    }}>
      <div style={{
        maxWidth: 800,
        width: '100%',
        background: 'rgba(255,255,255,0.06)',
        borderRadius: 16,
        padding: '48px 40px',
        backdropFilter: 'blur(12px)',
      }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>📋 Termos de Uso</h1>
        <p style={{ color: '#8fa3c4', marginBottom: 32 }}>Última atualização: Março de 2026</p>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: '#28c9bf', marginBottom: 8 }}>1. Aceitação dos Termos</h2>
          <p style={{ color: '#c5d0e0', lineHeight: 1.7 }}>
            Ao acessar e utilizar a plataforma VAMO, você concorda com estes Termos de Uso.
            Se não concordar com algum dos termos, por favor não utilize nossos serviços.
          </p>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: '#28c9bf', marginBottom: 8 }}>2. Descrição do Serviço</h2>
          <p style={{ color: '#c5d0e0', lineHeight: 1.7 }}>
            A VAMO é uma plataforma de marketplace de viagens que conecta viajantes a agências verificadas e
            criadores de roteiros independentes. Nossa plataforma facilita a descoberta, comparação e reserva
            de pacotes de viagem e roteiros personalizados.
          </p>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: '#28c9bf', marginBottom: 8 }}>3. Cadastro e Conta</h2>
          <p style={{ color: '#c5d0e0', lineHeight: 1.7 }}>
            Para utilizar determinados serviços, você deverá criar uma conta fornecendo informações verdadeiras
            e completas. Você é responsável por manter a confidencialidade de sua senha e por todas as atividades
            realizadas em sua conta.
          </p>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: '#28c9bf', marginBottom: 8 }}>4. Reservas e Pagamentos</h2>
          <p style={{ color: '#c5d0e0', lineHeight: 1.7 }}>
            As reservas realizadas através da VAMO estão sujeitas à disponibilidade e às políticas de cancelamento
            de cada agência ou criador. Os pagamentos são processados de forma segura através de nossos parceiros
            de pagamento autorizados.
          </p>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: '#28c9bf', marginBottom: 8 }}>5. Contato</h2>
          <p style={{ color: '#c5d0e0', lineHeight: 1.7 }}>
            Para dúvidas sobre estes termos, entre em contato conosco pelo e-mail:{' '}
            <a href="mailto:contato@vamo.app" style={{ color: '#28c9bf' }}>contato@vamo.app</a>
          </p>
        </section>

        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <a href="/" style={{
            display: 'inline-block',
            padding: '12px 32px',
            background: '#28c9bf',
            color: '#0f1b2d',
            borderRadius: 8,
            textDecoration: 'none',
            fontWeight: 600,
          }}>← Voltar para o início</a>
        </div>
      </div>
    </main>
  );
}

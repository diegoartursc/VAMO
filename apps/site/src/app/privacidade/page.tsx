'use client';

export default function PrivacidadePage() {
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
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>🔒 Política de Privacidade</h1>
        <p style={{ color: '#8fa3c4', marginBottom: 32 }}>Última atualização: Março de 2026</p>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: '#28c9bf', marginBottom: 8 }}>1. Coleta de Dados</h2>
          <p style={{ color: '#c5d0e0', lineHeight: 1.7 }}>
            A VAMO coleta informações que você fornece diretamente ao criar uma conta, realizar reservas ou
            interagir com a plataforma. Isso inclui nome, e-mail, telefone e dados de pagamento.
          </p>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: '#28c9bf', marginBottom: 8 }}>2. Uso dos Dados</h2>
          <p style={{ color: '#c5d0e0', lineHeight: 1.7 }}>
            Utilizamos seus dados para processar reservas, personalizar sua experiência, enviar comunicações
            relevantes e melhorar nossos serviços. Seus dados nunca serão vendidos a terceiros.
          </p>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: '#28c9bf', marginBottom: 8 }}>3. Proteção de Dados</h2>
          <p style={{ color: '#c5d0e0', lineHeight: 1.7 }}>
            Adotamos medidas técnicas e organizacionais para proteger seus dados pessoais contra acesso
            não autorizado, alteração, divulgação ou destruição. Utilizamos criptografia SSL/TLS em todas
            as comunicações e armazenamento seguro de dados.
          </p>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: '#28c9bf', marginBottom: 8 }}>4. Seus Direitos</h2>
          <p style={{ color: '#c5d0e0', lineHeight: 1.7 }}>
            Conforme a LGPD (Lei Geral de Proteção de Dados), você tem direito a acessar, corrigir, excluir
            seus dados pessoais, solicitar portabilidade e revogar consentimento a qualquer momento.
          </p>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: '#28c9bf', marginBottom: 8 }}>5. Contato</h2>
          <p style={{ color: '#c5d0e0', lineHeight: 1.7 }}>
            Para questões sobre privacidade, entre em contato com nosso DPO pelo e-mail:{' '}
            <a href="mailto:privacidade@vamo.app" style={{ color: '#28c9bf' }}>privacidade@vamo.app</a>
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

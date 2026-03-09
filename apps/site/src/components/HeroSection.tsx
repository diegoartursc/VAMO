import Link from "next/link";

interface HeroSectionProps {
    backgroundImage?: string;
}

export default function HeroSection({
    backgroundImage = "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=2073&auto=format&fit=crop" // Paris as default
}: HeroSectionProps) {
    return (
        <section
            className="hero-new"
            style={{ backgroundImage: `url(${backgroundImage})` }}
        >
            <div className="hero-overlay" />

            <div className="hero-content-new">
                {/* Header / Logo */}
                <header className="hero-header-new">
                    <Link href="/" className="hero-logo-new" style={{ textDecoration: 'none' }}>
                        <img
                            src="/images/logo_transparent.png"
                            alt="VAMO Logo"
                            style={{ height: '32px', width: 'auto', objectFit: 'contain' }}
                        />
                    </Link>
                    <div className="hero-user-actions" style={{ display: 'flex', gap: '12px' }}>
                        <span style={{ fontSize: '20px', cursor: 'pointer' }}>❓</span>
                        <span style={{ fontSize: '20px', cursor: 'pointer' }}>🔔</span>
                    </div>
                </header>

                {/* Headlines */}
                <div className="hero-titles">
                    <h1 className="hero-headline">Explore novas<br />fronteiras</h1>
                    <div className="hero-tagline">Viajar ficou simples.</div>
                </div>

                {/* Description */}
                <p className="hero-description">
                    Roteiros exclusivos de viajantes<br />
                    e agências verificadas.
                </p>

                {/* CTAs */}
                <div style={{ display: 'flex', gap: '16px', marginTop: '32px', flexWrap: 'wrap' }}>
                    <button className="btn-primary" style={{ border: 'none' }}>
                        <span style={{ fontSize: '18px' }}>📱</span> Baixar o App
                    </button>
                    <Link href="/cadastro" style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '16px 32px',
                        background: 'rgba(255, 255, 255, 0.15)', color: '#fff', fontWeight: 600,
                        borderRadius: '9999px', border: '1px solid rgba(255, 255, 255, 0.2)',
                        backdropFilter: 'blur(10px)', textDecoration: 'none', transition: 'all 0.3s'
                    }}>
                        🏢 Sou Agência
                    </Link>
                    <Link href="/criadores" style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '16px 32px',
                        background: 'rgba(255, 255, 255, 0.15)', color: '#fff', fontWeight: 600,
                        borderRadius: '9999px', border: '1px solid rgba(255, 255, 255, 0.2)',
                        backdropFilter: 'blur(10px)', textDecoration: 'none', transition: 'all 0.3s'
                    }}>
                        ✍️ Sou Roteirista
                    </Link>
                </div>
            </div>
        </section>
    );
}

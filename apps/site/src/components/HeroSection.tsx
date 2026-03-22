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

                {/* Download App Section */}
                <div style={{ marginTop: '32px' }}>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                        {/* Google Play Badge */}
                        <Link href="#" style={{
                            display: 'inline-flex', alignItems: 'center', gap: '10px',
                            padding: '10px 20px 10px 14px',
                            background: '#000', color: '#fff',
                            borderRadius: '8px', border: '1px solid rgba(255,255,255,0.3)',
                            textDecoration: 'none', transition: 'all 0.3s',
                            minWidth: '160px'
                        }}>
                            <svg viewBox="0 0 24 24" width="28" height="28" fill="none">
                                <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92z" fill="#4285F4"/>
                                <path d="M17.556 8.236L5.148.856a1.003 1.003 0 00-1.04-.02l9.683 9.683 3.765-2.283z" fill="#EA4335"/>
                                <path d="M17.556 15.764l-3.765-2.283-9.683 9.683c.32.178.716.19 1.04-.02l12.408-7.38z" fill="#34A853"/>
                                <path d="M21.003 12c0-.402-.2-.77-.527-.99l-2.92-1.774-3.765 2.283v.962l3.765 2.283 2.92-1.774c.327-.22.527-.588.527-.99z" fill="#FBBC05"/>
                            </svg>
                            <div style={{ display: 'flex', flexDirection: 'column' as const, lineHeight: 1.2 }}>
                                <span style={{ fontSize: '10px', fontWeight: 400, opacity: 0.9, textTransform: 'uppercase' as const, letterSpacing: '0.03em' }}>Disponível no</span>
                                <span style={{ fontSize: '16px', fontWeight: 600 }}>Google Play</span>
                            </div>
                        </Link>
                        {/* App Store Badge */}
                        <Link href="#" style={{
                            display: 'inline-flex', alignItems: 'center', gap: '10px',
                            padding: '10px 20px 10px 14px',
                            background: '#000', color: '#fff',
                            borderRadius: '8px', border: '1px solid rgba(255,255,255,0.3)',
                            textDecoration: 'none', transition: 'all 0.3s',
                            minWidth: '160px'
                        }}>
                            <svg viewBox="0 0 24 24" width="28" height="28" fill="#fff">
                                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                            </svg>
                            <div style={{ display: 'flex', flexDirection: 'column' as const, lineHeight: 1.2 }}>
                                <span style={{ fontSize: '10px', fontWeight: 400, opacity: 0.9 }}>Baixar na</span>
                                <span style={{ fontSize: '16px', fontWeight: 600 }}>App Store</span>
                            </div>
                        </Link>
                    </div>
                </div>


                {/* Other CTAs */}
                <div style={{ display: 'flex', gap: '16px', marginTop: '24px', flexWrap: 'wrap' }}>
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

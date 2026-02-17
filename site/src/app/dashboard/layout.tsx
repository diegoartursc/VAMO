import Link from "next/link";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            {/* Header */}
            <header className="header">
                <nav className="nav">
                    <Link href="/" className="logo">VAM<span>O</span></Link>
                    <div className="nav-links">
                        <Link href="/dashboard" className="nav-link">Dashboard</Link>
                        <Link href="/dashboard/roteiros" className="nav-link">Meus Roteiros</Link>
                        <button className="nav-cta" style={{ background: 'transparent', border: '1.5px solid var(--border)', color: 'var(--text-secondary)' }}>
                            👨‍✈️ Diego Artur
                        </button>
                    </div>
                </nav>
            </header>

            <div className="dashboard-wrapper">
                {/* Sidebar */}
                <aside className="sidebar">
                    <div className="sidebar-profile">
                        <div className="sidebar-avatar">👨‍✈️</div>
                        <div>
                            <div className="sidebar-name">Diego Artur</div>
                            <div className="sidebar-role">Criador Verificado</div>
                        </div>
                    </div>

                    <nav className="sidebar-nav">
                        <Link href="/dashboard" className="sidebar-link">
                            <span className="sidebar-link-icon">📊</span>
                            Visão Geral
                        </Link>
                        <Link href="/dashboard/roteiros" className="sidebar-link">
                            <span className="sidebar-link-icon">🗺️</span>
                            Meus Roteiros
                        </Link>
                        <Link href="/dashboard/roteiro/new" className="sidebar-link">
                            <span className="sidebar-link-icon">➕</span>
                            Novo Roteiro
                        </Link>
                        <div style={{ height: 16 }} />
                        <a href="#" className="sidebar-link">
                            <span className="sidebar-link-icon">💰</span>
                            Financeiro
                        </a>
                        <a href="#" className="sidebar-link">
                            <span className="sidebar-link-icon">⭐</span>
                            Avaliações
                        </a>
                        <a href="#" className="sidebar-link">
                            <span className="sidebar-link-icon">⚙️</span>
                            Configurações
                        </a>
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="dashboard-main">
                    {children}
                </main>
            </div>
        </>
    );
}

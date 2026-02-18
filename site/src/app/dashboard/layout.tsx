import Link from "next/link";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <header className="header">
                <nav className="nav">
                    <Link href="/" className="logo">VAM<span>O</span></Link>
                    <div className="nav-links">
                        <Link href="/dashboard" className="nav-link">Dashboard</Link>
                        <Link href="/dashboard/roteiros" className="nav-link">Roteiros</Link>
                        <Link href="/" className="nav-link">Sair</Link>
                    </div>
                </nav>
            </header>

            <div className="dashboard-wrapper">
                <aside className="sidebar">
                    <div className="sidebar-profile">
                        <div className="sidebar-avatar">🧑‍✈️</div>
                        <div>
                            <div className="sidebar-name">Ana Viajante</div>
                            <div className="sidebar-role">Criadora Verificada</div>
                        </div>
                    </div>
                    <nav className="sidebar-nav">
                        <Link href="/dashboard" className="sidebar-link active">
                            <span className="sidebar-link-icon">📊</span>
                            Visão Geral
                        </Link>
                        <Link href="/dashboard/roteiros" className="sidebar-link">
                            <span className="sidebar-link-icon">🗺️</span>
                            Meus Roteiros
                        </Link>
                        <div className="sidebar-link">
                            <span className="sidebar-link-icon">💰</span>
                            Financeiro
                        </div>
                        <div className="sidebar-link">
                            <span className="sidebar-link-icon">⭐</span>
                            Avaliações
                        </div>
                        <div className="sidebar-link">
                            <span className="sidebar-link-icon">📈</span>
                            Analytics
                        </div>
                        <div className="sidebar-link">
                            <span className="sidebar-link-icon">⚙️</span>
                            Configurações
                        </div>
                    </nav>
                </aside>

                <main className="dashboard-main">
                    {children}
                </main>
            </div>
        </>
    );
}

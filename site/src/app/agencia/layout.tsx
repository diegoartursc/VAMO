"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { getSession, logout, isAuthenticated, type AuthSession } from "../../lib/auth";

const NAV_ITEMS = [
    { href: "/agencia", label: "Visão Geral", iconPath: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" },
    { href: "/agencia/pacotes", label: "Pacotes", iconPath: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
];

export default function AgenciaLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [session, setSession] = useState<AuthSession | null>(null);
    const [sessionLoading, setSessionLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated()) { window.location.href = "/login"; return; }
        getSession()
            .then((s) => { if (!s) { window.location.href = "/login"; return; } setSession(s); })
            .finally(() => setSessionLoading(false));
    }, []);

    const isActive = (href: string) => {
        if (href === "/agencia") return pathname === "/agencia";
        return pathname.startsWith(href);
    };

    return (
        <div className="dash-shell">
            <aside className="dash-sidebar">
                <div className="dash-sidebar-brand">
                    <Link href="/" className="dash-sidebar-logo">VAM<span>O</span></Link>
                    <span className="dash-sidebar-badge">Agência</span>
                </div>

                <div className="dash-sidebar-profile">
                    <div className="dash-sidebar-avatar">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
                        </svg>
                    </div>
                    <div className="dash-sidebar-user">
                        <div className="dash-sidebar-name">{sessionLoading ? "..." : session?.employee.name}</div>
                        <div className="dash-sidebar-agency">{sessionLoading ? "..." : session?.agency.name}</div>
                    </div>
                </div>

                <div className="dash-sidebar-section-label">Gerenciar</div>

                <nav className="dash-sidebar-nav">
                    {NAV_ITEMS.map((item) => (
                        <Link key={item.href} href={item.href} className={`dash-sidebar-link ${isActive(item.href) ? "active" : ""}`}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={item.iconPath} /></svg>
                            <span>{item.label}</span>
                            {isActive(item.href) && <span className="dash-sidebar-active-dot" />}
                        </Link>
                    ))}
                </nav>

                <div className="dash-sidebar-spacer" />

                <button className="dash-sidebar-link dash-sidebar-logout" onClick={logout}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                    <span>Sair</span>
                </button>
            </aside>

            <main className="dash-content">{children}</main>
        </div>
    );
}

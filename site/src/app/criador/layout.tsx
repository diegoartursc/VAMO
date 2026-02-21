"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { getSession, isAuthenticated, type AuthSession } from "../../lib/auth";

const NAV_ITEMS = [
    { href: "/criador", label: "Visão Geral", iconPath: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" },
    { href: "/criador/roteiros", label: "Roteiros", iconPath: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
];

export default function CriadorLayout({ children }: { children: React.ReactNode }) {
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
        if (href === "/criador") return pathname === "/criador";
        return pathname.startsWith(href);
    };

    return (
        <div className="dash-shell">
            {/* Creator sidebar — Teal gradient instead of Navy */}
            <aside className="dash-sidebar dash-sidebar-creator">
                <div className="dash-sidebar-brand">
                    <Link href="/" className="dash-sidebar-logo">VAM<span>O</span></Link>
                    <span className="dash-sidebar-badge dash-sidebar-badge-creator">Criador</span>
                </div>

                <div className="dash-sidebar-profile">
                    <div className="dash-sidebar-avatar dash-sidebar-avatar-creator">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
                        </svg>
                    </div>
                    <div className="dash-sidebar-user">
                        <div className="dash-sidebar-name">{sessionLoading ? "..." : session?.employee.name}</div>
                        <div className="dash-sidebar-agency">{sessionLoading ? "..." : "Criador Independente"}</div>
                    </div>
                </div>

                <div className="dash-sidebar-section-label">Conteúdo</div>

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

                <button className="dash-sidebar-link dash-sidebar-logout" onClick={() => { localStorage.clear(); window.location.href = "/login"; }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                    <span>Sair</span>
                </button>
            </aside>

            <main className="dash-content">{children}</main>
        </div>
    );
}

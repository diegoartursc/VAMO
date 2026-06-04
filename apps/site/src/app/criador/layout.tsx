"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { getSession, isAgencySession, logout, type AuthSession } from "../../lib/auth";

/* ─── Icon helpers ─── */
const SvgIcon = ({ d, size = 18 }: { d: string; size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d={d} />
    </svg>
);
const CircleIcon = ({ children, size = 18 }: { children: React.ReactNode; size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {children}
    </svg>
);

const ICONS = {
    home: <SvgIcon d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10" />,
    map: <SvgIcon d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z M8 2v16 M16 6v16" />,
    plusCircle: (
        <CircleIcon>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v8 M8 12h8" />
        </CircleIcon>
    ),
    shoppingBag: <SvgIcon d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z M3 6h18 M16 10a4 4 0 01-8 0" />,
    messageCircle: (
        <CircleIcon>
            <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
        </CircleIcon>
    ),
    settings: (
        <CircleIcon>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
        </CircleIcon>
    ),
    logout: <SvgIcon d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9" />,
    user: (
        <CircleIcon size={22}>
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </CircleIcon>
    ),
};

const NAV_SECTIONS = [
    {
        label: "MENU",
        items: [{ href: "/criador", label: "Visão Geral", icon: ICONS.home }],
    },
    {
        label: "ROTEIROS",
        items: [
            { href: "/criador/roteiros", label: "Meus Roteiros", icon: ICONS.map },
            { href: "/criador/roteiro/new", label: "Novo Roteiro", icon: ICONS.plusCircle },
        ],
    },
    {
        label: "NEGÓCIOS",
        items: [
            { href: "/criador/vendas", label: "Minhas Vendas", icon: ICONS.shoppingBag },
            { href: "/criador/comentarios", label: "Comentários", icon: ICONS.messageCircle },
        ],
    },
];

export default function CriadorLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [session, setSession] = useState<AuthSession | null>(null);
    const [sessionLoading, setSessionLoading] = useState(true);

    useEffect(() => {
        getSession()
            .then((s) => { if (isAgencySession(s)) setSession(s); })
            .catch(() => { })
            .finally(() => setSessionLoading(false));
    }, []);

    const isActive = (href: string) => {
        if (href === "/criador") return pathname === "/criador";
        return pathname.startsWith(href);
    };

    const userName = sessionLoading ? "..." : (session?.employee?.name || "Usuário");

    return (
        <div className="dash-shell">
            <aside className="dash-sidebar dash-sidebar-creator">
                {/* Brand */}
                <div className="dash-sidebar-brand">
                    <Link href="/" className="dash-sidebar-logo">VAM<span>O</span></Link>
                    <span className="dash-sidebar-badge dash-sidebar-badge-creator">Roteirista</span>
                </div>

                {/* User */}
                <div className="dash-sidebar-profile">
                    <div className="dash-sidebar-avatar dash-sidebar-avatar-creator">{ICONS.user}</div>
                    <div className="dash-sidebar-user">
                        <div className="dash-sidebar-name">{userName}</div>
                        <div className="dash-sidebar-agency">Roteirista Independente</div>
                    </div>
                </div>

                {/* Nav sections */}
                {NAV_SECTIONS.map((section) => (
                    <div key={section.label}>
                        <div className="dash-sidebar-section-label">{section.label}</div>
                        <nav className="dash-sidebar-nav">
                            {section.items.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`dash-sidebar-link ${isActive(item.href) ? "active" : ""}`}
                                >
                                    {item.icon}
                                    <span>{item.label}</span>
                                    {isActive(item.href) && <span className="dash-sidebar-active-dot" />}
                                </Link>
                            ))}
                        </nav>
                    </div>
                ))}

                <div className="dash-sidebar-spacer" />

                {/* Footer */}
                <div className="dash-sidebar-section-label">CONTA</div>
                <Link href="/criador/configuracoes" className={`dash-sidebar-link ${isActive("/criador/configuracoes") ? "active" : ""}`}>
                    {ICONS.settings}
                    <span>Configurações</span>
                </Link>
                <button className="dash-sidebar-link dash-sidebar-logout" onClick={logout}>
                    {ICONS.logout}
                    <span>Sair</span>
                </button>
            </aside>

            <main className="dash-content">{children}</main>
        </div>
    );
}

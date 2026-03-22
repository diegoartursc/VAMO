"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { getSession, logout, type AuthSession } from "../../lib/auth";

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
    package: <SvgIcon d="M16.5 9.4l-9-5.19 M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z M3.27 6.96L12 12.01l8.73-5.05 M12 22.08V12" />,
    plusCircle: (
        <CircleIcon>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v8 M8 12h8" />
        </CircleIcon>
    ),
    shoppingBag: <SvgIcon d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z M3 6h18 M16 10a4 4 0 01-8 0" />,
    users: <SvgIcon d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 11a4 4 0 100-8 4 4 0 000 8z M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75" />,
    messageCircle: (
        <CircleIcon>
            <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
        </CircleIcon>
    ),
    inbox: <SvgIcon d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6" />,
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
        items: [{ href: "/agencia", label: "Visão Geral", icon: ICONS.home }],
    },
    {
        label: "PACOTES",
        items: [
            { href: "/agencia/pacotes", label: "Meus Pacotes", icon: ICONS.package },
            { href: "/agencia/pacote/new", label: "Novo Pacote", icon: ICONS.plusCircle },
        ],
    },
    {
        label: "NEGÓCIOS",
        items: [
            { href: "/agencia/vendas", label: "Vendas / Clientes", icon: ICONS.users },
            { href: "/agencia/financeiro", label: "Financeiro", icon: ICONS.shoppingBag },
            { href: "/agencia/comentarios", label: "Comentários", icon: ICONS.messageCircle },
            { href: "/agencia/inbox", label: "Inbox", icon: ICONS.inbox },
        ],
    },
];

export default function AgenciaLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [session, setSession] = useState<AuthSession | null>(null);
    const [sessionLoading, setSessionLoading] = useState(true);

    useEffect(() => {
        getSession()
            .then((s) => { if (s) setSession(s); })
            .catch(() => { })
            .finally(() => setSessionLoading(false));
    }, []);

    const isActive = (href: string) => {
        if (href === "/agencia") return pathname === "/agencia";
        return pathname.startsWith(href);
    };

    const userName = sessionLoading ? "..." : (session?.employee?.name || "Usuário");
    const agencyName = sessionLoading ? "..." : (session?.agency?.name || "Agência Parceira");

    return (
        <div className="dash-shell">
            <aside className="dash-sidebar dash-sidebar-agency">
                {/* Brand */}
                <div className="dash-sidebar-brand">
                    <Link href="/" className="dash-sidebar-logo">VAM<span>O</span></Link>
                    <span className="dash-sidebar-badge dash-sidebar-badge-agency">Agência</span>
                </div>

                {/* User */}
                <div className="dash-sidebar-profile">
                    <div className="dash-sidebar-avatar dash-sidebar-avatar-agency">{ICONS.user}</div>
                    <div className="dash-sidebar-user">
                        <div className="dash-sidebar-name">{userName}</div>
                        <div className="dash-sidebar-agency">{agencyName}</div>
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
                <Link href="/agencia/configuracoes" className={`dash-sidebar-link ${isActive("/agencia/configuracoes") ? "active" : ""}`}>
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

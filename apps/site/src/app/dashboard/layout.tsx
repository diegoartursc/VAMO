"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { getSession, logout, isAuthenticated, type AuthSession } from "../../lib/auth";

/* ═══════════════════════════════════════════════════
   SVG Icon helpers (Lucide-style)
   ═══════════════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════════════
   ICONS
   ═══════════════════════════════════════════════════ */
const ICONS = {
    home: <SvgIcon d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10" />,
    package: <SvgIcon d="M16.5 9.4l-9-5.19 M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z M3.27 6.96L12 12.01l8.73-5.05 M12 22.08V12" />,
    map: <SvgIcon d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z M8 2v16 M16 6v16" />,
    plusCircle: (
        <CircleIcon size={18}>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v8 M8 12h8" />
        </CircleIcon>
    ),
    list: <SvgIcon d="M8 6h13 M8 12h13 M8 18h13 M3 6h.01 M3 12h.01 M3 18h.01" />,
    shoppingBag: <SvgIcon d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z M3 6h18 M16 10a4 4 0 01-8 0" />,
    messageCircle: (
        <CircleIcon size={18}>
            <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
        </CircleIcon>
    ),
    settings: (
        <CircleIcon size={18}>
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

/* ═══════════════════════════════════════════════════
   SIDEBAR NAV — Creator (Roteiros)
   ═══════════════════════════════════════════════════ */
function getCreatorNav() {
    return [
        {
            label: "MENU",
            items: [{ href: "/dashboard", label: "Visão Geral", icon: ICONS.home }],
        },
        {
            label: "ROTEIROS",
            items: [
                { href: "/dashboard/roteiros", label: "Meus Roteiros", icon: ICONS.map },
                { href: "/dashboard/roteiro/novo", label: "Novo Roteiro", icon: ICONS.plusCircle },
            ],
        },
        {
            label: "NEGÓCIOS",
            items: [
                { href: "/dashboard/vendas", label: "Minhas Vendas", icon: ICONS.shoppingBag },
                { href: "/dashboard/comentarios", label: "Comentários", icon: ICONS.messageCircle },
            ],
        },
    ];
}

/* ═══════════════════════════════════════════════════
   LAYOUT COMPONENT
   ═══════════════════════════════════════════════════ */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [session, setSession] = useState<AuthSession | null>(null);
    const [sessionLoading, setSessionLoading] = useState(true);

    useEffect(() => {
        if (pathname.startsWith("/dashboard/admin")) return;
        // Dev mode: just try to get session, don't force redirect to login
        getSession()
            .then((s) => { if (s) setSession(s); })
            .catch(() => { })
            .finally(() => setSessionLoading(false));
    }, []);

    const isActive = (href: string) => {
        if (href === "/dashboard") return pathname === "/dashboard";
        return pathname.startsWith(href);
    };

    // Admin routes have their own full-screen layout
    if (pathname.startsWith("/dashboard/admin")) {
        return <>{children}</>;
    }

    // Always use creator nav (roteiros-first model)
    const navSections = getCreatorNav();
    const badge = "Roteirista";
    const userName = sessionLoading ? "..." : (session?.employee?.name || "Usuário");
    const subtitle = sessionLoading ? "..." : "Criador de Roteiros";

    return (
        <div className="dash-shell" data-theme="creator">
            {/* ─── Dark Navy Sidebar ─── */}
            <aside className="dash-sidebar">
                {/* Brand */}
                <div className="dash-sidebar-brand">
                    <Link href="/" className="dash-sidebar-logo">
                        VAM<span>O</span>
                    </Link>
                    <span className="dash-sidebar-badge">{badge}</span>
                </div>

                {/* User profile */}
                <div className="dash-sidebar-profile">
                    <div className="dash-sidebar-avatar">{ICONS.user}</div>
                    <div className="dash-sidebar-user">
                        <div className="dash-sidebar-name">{userName}</div>
                        <div className="dash-sidebar-agency">{subtitle}</div>
                    </div>
                </div>

                {/* Nav sections */}
                {navSections.map((section) => (
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

                <Link href="/dashboard/configuracoes" className={`dash-sidebar-link ${isActive("/dashboard/configuracoes") ? "active" : ""}`}>
                    {ICONS.settings}
                    <span>Configurações</span>
                </Link>

                <button className="dash-sidebar-link dash-sidebar-logout" onClick={logout}>
                    {ICONS.logout}
                    <span>Sair</span>
                </button>
            </aside>

            {/* ─── Main Content ─── */}
            <main className="dash-content">
                {children}
            </main>
        </div>
    );
}

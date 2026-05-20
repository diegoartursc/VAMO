"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";

export const DOLLAR_RATE_KEY = "adminDollarRate";

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
    map: <SvgIcon d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z M8 2v16 M16 6v16" />,
    building: <SvgIcon d="M6 22V4a2 2 0 012-2h8a2 2 0 012 2v18z M6 12H4a2 2 0 00-2 2v6a2 2 0 002 2h2 M18 9h2a2 2 0 012 2v9a2 2 0 01-2 2h-2 M10 6h4 M10 10h4 M10 14h4 M10 18h4" />,
    compass: (
        <CircleIcon>
            <circle cx="12" cy="12" r="10" />
            <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" opacity="0.15" stroke="currentColor" />
        </CircleIcon>
    ),
    users: <SvgIcon d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75" />,
    wallet: <SvgIcon d="M21 12V7H5a2 2 0 010-4h14v4 M3 5v14a2 2 0 002 2h16v-5 M18 12a1 1 0 100 2 1 1 0 000-2z" />,
    dollar: <SvgIcon d="M12 1v22 M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />,
    pencil: <SvgIcon d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7 M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />,
    check: <SvgIcon d="M20 6L9 17l-5-5" />,
    x: <SvgIcon d="M18 6L6 18 M6 6l12 12" />,
    clock: (
        <CircleIcon>
            <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
        </CircleIcon>
    ),
    shield: <SvgIcon d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
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
        label: "MODERAÇÃO",
        items: [
            { href: "/admin", label: "Visão Geral", icon: ICONS.home, exact: true },
            { href: "/admin/roteiros", label: "Roteiros", icon: ICONS.map },
        ],
    },
    {
        label: "GESTÃO",
        items: [
            { href: "/admin/roteiristas", label: "Roteiristas", icon: ICONS.compass },
            { href: "/admin/clientes", label: "Clientes", icon: ICONS.users },
        ],
    },
    {
        label: "SISTEMA & CÂMBIO",
        items: [
            { href: "/admin/conversao", label: "Conversão de Moedas", icon: ICONS.dollar },
            { href: "/admin/financeiro", label: "Financeiro", icon: ICONS.wallet },
            { href: "/admin/historico", label: "Histórico", icon: ICONS.clock },
        ],
    },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [adminUser, setAdminUser] = useState<{ name: string; role: string } | null>(null);

    // Don't wrap the login page with the sidebar layout
    const isLoginPage = pathname === "/admin/login";

    useEffect(() => {
        const user = localStorage.getItem("adminUser");
        if (user) setAdminUser(JSON.parse(user));
    }, []);

    if (isLoginPage) return <>{children}</>;

    const isActive = (href: string, exact?: boolean) => {
        if (exact) return pathname === href;
        return pathname.startsWith(href);
    };

    const handleLogout = () => {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        router.push("/admin/login");
    };

    return (
        <div className="dash-shell">
            <aside className="dash-sidebar dash-sidebar-admin">
                {/* Brand */}
                <div className="dash-sidebar-brand">
                    <Link href="/" className="dash-sidebar-logo">VAM<span>O</span></Link>
                    <span className="dash-sidebar-badge dash-sidebar-badge-admin">Admin</span>
                </div>

                {/* User */}
                <div className="dash-sidebar-profile">
                    <div className="dash-sidebar-avatar dash-sidebar-avatar-admin">{ICONS.shield}</div>
                    <div className="dash-sidebar-user">
                        <div className="dash-sidebar-name">{adminUser?.name || "Administrador"}</div>
                        <div className="dash-sidebar-agency">{adminUser?.role || "Painel VAMO"}</div>
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
                                    className={`dash-sidebar-link ${isActive(item.href, item.exact) ? "active" : ""}`}
                                >
                                    {item.icon}
                                    <span>{item.label}</span>
                                    {isActive(item.href, item.exact) && <span className="dash-sidebar-active-dot" />}
                                </Link>
                            ))}
                        </nav>
                    </div>
                ))}

                <div className="dash-sidebar-spacer" />

                {/* Footer */}
                <div className="dash-sidebar-section-label">CONTA</div>
                <Link href="/admin/configuracoes" className={`dash-sidebar-link ${isActive("/admin/configuracoes") ? "active" : ""}`}>
                    {ICONS.settings}
                    <span>Configurações</span>
                </Link>
                <button className="dash-sidebar-link dash-sidebar-logout" onClick={handleLogout}>
                    {ICONS.logout}
                    <span>Sair</span>
                </button>
            </aside>

            <main className="dash-content">{children}</main>
        </div>
    );
}

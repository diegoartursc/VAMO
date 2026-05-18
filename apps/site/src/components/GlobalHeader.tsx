"use client";

/**
 * GlobalHeader — Top nav unificada (Airbnb-style)
 *
 * Comportamento:
 * - Logo à esquerda
 * - Nav central: Explorar, Criadores
 * - Direita:
 *   - Logado: avatar com dropdown (Perfil, Meus roteiros, Favoritos, Compras,
 *     Dashboard creator, Configurações, Sair)
 *   - Anônimo: links Entrar / Cadastrar
 *
 * Variantes:
 * - `variant="transparent"` (default na home/hero) — texto branco
 * - `variant="solid"` (em /perfil, /explore) — fundo branco, sombra leve
 */

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, logout, type CurrentUser } from "../lib/auth";

type Variant = "transparent" | "solid";

interface Props {
    variant?: Variant;
}

export default function GlobalHeader({ variant = "solid" }: Props) {
    const [user, setUser] = useState<CurrentUser | null>(null);
    const [hydrated, setHydrated] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        setUser(getCurrentUser());
        setHydrated(true);
    }, []);

    useEffect(() => {
        function onClickOutside(e: MouseEvent) {
            if (!menuRef.current) return;
            if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false);
        }
        if (menuOpen) document.addEventListener("mousedown", onClickOutside);
        return () => document.removeEventListener("mousedown", onClickOutside);
    }, [menuOpen]);

    const isCreator = !!user?.creatorId;
    const initials = (user?.name ?? "?")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join("");

    const transparent = variant === "transparent";

    return (
        <header
            className="vamo-header"
            data-variant={variant}
            style={{
                position: "sticky",
                top: 0,
                zIndex: 60,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 32px",
                background: transparent
                    ? "linear-gradient(to bottom, rgba(0,0,0,0.45), rgba(0,0,0,0))"
                    : "rgba(255,255,255,0.98)",
                backdropFilter: transparent ? undefined : "saturate(180%) blur(8px)",
                borderBottom: transparent ? "none" : "1px solid rgba(0,0,0,0.06)",
                color: transparent ? "#fff" : "#1c1c1e",
                transition: "background 240ms ease",
            }}
        >
            {/* Logo */}
            <Link
                href="/"
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    textDecoration: "none",
                    color: "inherit",
                    fontWeight: 700,
                    fontSize: 22,
                    letterSpacing: "-0.02em",
                }}
            >
                <img
                    src={transparent ? "/images/logo_transparent.png" : "/images/logo_transparent.png"}
                    alt="VAMO"
                    style={{
                        height: 28,
                        width: "auto",
                        objectFit: "contain",
                        filter: transparent ? "none" : "brightness(0.2)",
                    }}
                />
            </Link>

            {/* Center nav (hide on mobile) */}
            <nav
                className="vamo-header-nav"
                style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                }}
            >
                <Link
                    href="/explore"
                    style={{
                        padding: "10px 16px",
                        borderRadius: 999,
                        textDecoration: "none",
                        color: "inherit",
                        fontSize: 14,
                        fontWeight: 600,
                        opacity: 0.9,
                    }}
                >
                    Explorar
                </Link>
                <Link
                    href="/criadores"
                    style={{
                        padding: "10px 16px",
                        borderRadius: 999,
                        textDecoration: "none",
                        color: "inherit",
                        fontSize: 14,
                        fontWeight: 600,
                        opacity: 0.9,
                    }}
                >
                    Criadores
                </Link>
            </nav>

            {/* Right side */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {hydrated && user ? (
                    <div ref={menuRef} style={{ position: "relative" }}>
                        <button
                            onClick={() => setMenuOpen((v) => !v)}
                            aria-label="Menu da conta"
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 10,
                                padding: "6px 8px 6px 14px",
                                borderRadius: 999,
                                border: transparent
                                    ? "1px solid rgba(255,255,255,0.4)"
                                    : "1px solid rgba(0,0,0,0.12)",
                                background: transparent ? "rgba(255,255,255,0.08)" : "#fff",
                                color: "inherit",
                                cursor: "pointer",
                                boxShadow: transparent ? "none" : "0 1px 2px rgba(0,0,0,0.04)",
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="3" y1="6" x2="21" y2="6" />
                                <line x1="3" y1="12" x2="21" y2="12" />
                                <line x1="3" y1="18" x2="21" y2="18" />
                            </svg>
                            <span
                                style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: "50%",
                                    background: "linear-gradient(135deg, #FF5A5F, #FF385C)",
                                    color: "#fff",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontWeight: 700,
                                    fontSize: 12,
                                    letterSpacing: 0.4,
                                }}
                            >
                                {initials || "U"}
                            </span>
                        </button>

                        {menuOpen && (
                            <div
                                style={{
                                    position: "absolute",
                                    top: "calc(100% + 8px)",
                                    right: 0,
                                    width: 260,
                                    background: "#fff",
                                    color: "#1c1c1e",
                                    borderRadius: 16,
                                    boxShadow: "0 12px 32px rgba(0,0,0,0.16), 0 2px 6px rgba(0,0,0,0.06)",
                                    overflow: "hidden",
                                    border: "1px solid rgba(0,0,0,0.06)",
                                }}
                            >
                                <div style={{ padding: "16px 16px 8px" }}>
                                    <div style={{ fontWeight: 700, fontSize: 14 }}>{user.name}</div>
                                    <div style={{ fontSize: 12, color: "#6b7280" }}>{user.email}</div>
                                    <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                                        {user.roles.map((r) => (
                                            <span
                                                key={r}
                                                style={{
                                                    fontSize: 10,
                                                    fontWeight: 700,
                                                    letterSpacing: 0.6,
                                                    padding: "3px 8px",
                                                    borderRadius: 999,
                                                    background:
                                                        r === "CREATOR"
                                                            ? "rgba(255, 56, 92, 0.12)"
                                                            : r === "ADMIN"
                                                                ? "rgba(16, 185, 129, 0.12)"
                                                                : "rgba(59, 130, 246, 0.12)",
                                                    color:
                                                        r === "CREATOR"
                                                            ? "#FF385C"
                                                            : r === "ADMIN"
                                                                ? "#059669"
                                                                : "#2563eb",
                                                }}
                                            >
                                                {r === "CREATOR" ? "Criador" : r === "ADMIN" ? "Admin" : "Viajante"}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <Divider />
                                <MenuItem href="/perfil" onClick={() => setMenuOpen(false)}>Perfil</MenuItem>
                                <MenuItem href="/perfil/favoritos" onClick={() => setMenuOpen(false)}>Favoritos</MenuItem>
                                <MenuItem href="/perfil/compras" onClick={() => setMenuOpen(false)}>Minhas compras</MenuItem>
                                <Divider />
                                {isCreator ? (
                                    <>
                                        <MenuItem href="/dashboard" onClick={() => setMenuOpen(false)} highlight>
                                            Dashboard creator
                                        </MenuItem>
                                        <MenuItem href="/dashboard/roteiros" onClick={() => setMenuOpen(false)}>
                                            Meus roteiros
                                        </MenuItem>
                                        <MenuItem href="/dashboard/roteiro/novo" onClick={() => setMenuOpen(false)}>
                                            Criar roteiro
                                        </MenuItem>
                                    </>
                                ) : (
                                    <MenuItem href="/perfil/virar-criador" onClick={() => setMenuOpen(false)} highlight>
                                        Virar criador
                                    </MenuItem>
                                )}
                                <Divider />
                                <MenuItem href="/dashboard/configuracoes" onClick={() => setMenuOpen(false)}>
                                    Configurações
                                </MenuItem>
                                <button
                                    onClick={() => {
                                        setMenuOpen(false);
                                        logout();
                                    }}
                                    style={{
                                        width: "100%",
                                        textAlign: "left",
                                        padding: "12px 16px",
                                        background: "transparent",
                                        border: "none",
                                        color: "#1c1c1e",
                                        fontSize: 14,
                                        cursor: "pointer",
                                    }}
                                >
                                    Sair
                                </button>
                            </div>
                        )}
                    </div>
                ) : hydrated ? (
                    <>
                        <Link
                            href="/login"
                            style={{
                                padding: "10px 16px",
                                borderRadius: 999,
                                textDecoration: "none",
                                color: "inherit",
                                fontSize: 14,
                                fontWeight: 600,
                            }}
                        >
                            Entrar
                        </Link>
                        <Link
                            href="/cadastro"
                            style={{
                                padding: "10px 18px",
                                borderRadius: 999,
                                textDecoration: "none",
                                background: "#FF385C",
                                color: "#fff",
                                fontSize: 14,
                                fontWeight: 700,
                                boxShadow: "0 4px 12px rgba(255,56,92,0.3)",
                            }}
                        >
                            Cadastrar
                        </Link>
                    </>
                ) : (
                    // Placeholder while hydrating to avoid layout shift
                    <div style={{ width: 160, height: 36 }} />
                )}
            </div>
        </header>
    );
}

function Divider() {
    return <div style={{ height: 1, background: "rgba(0,0,0,0.06)" }} />;
}

function MenuItem({
    href,
    children,
    onClick,
    highlight = false,
}: {
    href: string;
    children: React.ReactNode;
    onClick?: () => void;
    highlight?: boolean;
}) {
    return (
        <Link
            href={href}
            onClick={onClick}
            style={{
                display: "block",
                padding: "12px 16px",
                textDecoration: "none",
                color: highlight ? "#FF385C" : "#1c1c1e",
                fontSize: 14,
                fontWeight: highlight ? 700 : 500,
                transition: "background 120ms ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.04)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
            {children}
        </Link>
    );
}

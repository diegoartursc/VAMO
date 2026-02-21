"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { getDashboardStats } from "@/lib/api";

export default function CriadorOverview() {
    const [stats, setStats] = useState({ total: 0, published: 0, totalSales: 0, totalRevenue: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getDashboardStats()
            .then((data) => {
                const its = data.itineraries || [];
                setStats({
                    total: its.length,
                    published: its.filter((i: any) => i.status === "active").length,
                    totalSales: its.reduce((s: number, i: any) => s + (i.sales || 0), 0),
                    totalRevenue: its.reduce((s: number, i: any) => s + (i.revenue || 0), 0),
                });
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    return (
        <div>
            <div className="dash-header">
                <h1 className="dash-title">Olá, Criador!</h1>
                <p className="dash-subtitle">Gerencie seus roteiros e acompanhe suas vendas</p>
            </div>

            <div className="dash-stats">
                <div className="dash-stat-card">
                    <div className="dash-stat-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#28C9BF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    </div>
                    <div className="dash-stat-label">Roteiros</div>
                    <div className="dash-stat-value">{loading ? "..." : stats.total}</div>
                </div>

                <div className="dash-stat-card">
                    <div className="dash-stat-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#28C9BF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                    </div>
                    <div className="dash-stat-label">Publicados</div>
                    <div className="dash-stat-value teal">{loading ? "..." : stats.published}</div>
                </div>

                <div className="dash-stat-card">
                    <div className="dash-stat-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#28C9BF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>
                    </div>
                    <div className="dash-stat-label">Vendas</div>
                    <div className="dash-stat-value">{loading ? "..." : stats.totalSales}</div>
                </div>

                <div className="dash-stat-card">
                    <div className="dash-stat-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#28C9BF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>
                    </div>
                    <div className="dash-stat-label">Receita</div>
                    <div className="dash-stat-value green">
                        {loading ? "..." : `R$ ${stats.totalRevenue.toLocaleString("pt-BR")}`}
                    </div>
                </div>
            </div>

            <div style={{ textAlign: "center", padding: "40px" }}>
                <Link href="/criador/roteiros" className="btn-primary" style={{ padding: "14px 32px", fontSize: 15 }}>
                    Ver Meus Roteiros
                </Link>
            </div>
        </div>
    );
}

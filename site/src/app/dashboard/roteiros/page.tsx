"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { getDashboardStats, deleteItinerary, type DashboardItinerary } from "../../../lib/api";

export default function RoteirosPage() {
    const [itineraries, setItineraries] = useState<DashboardItinerary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadData = () => {
        setLoading(true);
        getDashboardStats()
            .then((stats) => setItineraries(stats.itineraries))
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    };

    useEffect(() => { loadData(); }, []);

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Tem certeza que deseja arquivar "${title}"?`)) return;
        try {
            await deleteItinerary(id);
            loadData();
        } catch (err: any) {
            alert(`Erro ao arquivar: ${err.message}`);
        }
    };

    const formatCurrency = (value: number) =>
        `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`;

    const formatDate = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
    };

    if (loading) {
        return (
            <>
                <div className="dash-header">
                    <h1 className="dash-title">Meus Roteiros</h1>
                    <p className="dash-subtitle">Carregando...</p>
                </div>
            </>
        );
    }

    if (error) {
        return (
            <>
                <div className="dash-header">
                    <h1 className="dash-title">Meus Roteiros</h1>
                    <p className="dash-subtitle" style={{ color: "#e74c3c" }}>
                        Erro: {error}. Verifique se o backend está rodando.
                    </p>
                </div>
            </>
        );
    }

    return (
        <>
            <div className="dash-header">
                <h1 className="dash-title">Meus Roteiros</h1>
                <p className="dash-subtitle">Gerencie e edite todos os seus roteiros</p>
            </div>

            <div className="itinerary-table">
                <div className="table-header">
                    <h3 className="table-title">Todos os Roteiros ({itineraries.length})</h3>
                    <Link href="/dashboard/roteiro/new">
                        <button className="btn-new">+ Novo Roteiro</button>
                    </Link>
                </div>

                <div className="table-row table-row-head">
                    <div className="table-cell">Roteiro</div>
                    <div className="table-cell">Status</div>
                    <div className="table-cell">Vendas</div>
                    <div className="table-cell">Receita</div>
                    <div className="table-cell">Avaliação</div>
                    <div className="table-cell">Ações</div>
                </div>

                {itineraries.length === 0 ? (
                    <div className="table-row">
                        <div className="table-cell" style={{ gridColumn: "1 / -1", textAlign: "center", padding: "2rem" }}>
                            Nenhum roteiro encontrado.
                            <Link href="/dashboard/roteiro/new" style={{ color: "var(--teal)", marginLeft: 8 }}>
                                Crie seu primeiro roteiro →
                            </Link>
                        </div>
                    </div>
                ) : (
                    itineraries.map((it) => (
                        <div className="table-row" key={it.id}>
                            <div className="table-cell">
                                <div className="itinerary-name">{it.title} — {it.duration} dias</div>
                                <div className="itinerary-destination">
                                    📍 {it.destination}, {it.country} • Última edição: {formatDate(it.updatedAt)}
                                </div>
                            </div>
                            <div className="table-cell">
                                <span className={`status-badge ${it.status === "active" ? "published" : "draft"}`}>
                                    {it.status === "active" ? "Publicado" : it.status === "paused" ? "Pausado" : "Arquivado"}
                                </span>
                            </div>
                            <div className="table-cell">
                                {it.sales > 0 ? it.sales.toLocaleString("pt-BR") : "—"}
                            </div>
                            <div className="table-cell">
                                {it.revenue > 0 ? formatCurrency(it.revenue) : "—"}
                            </div>
                            <div className="table-cell">
                                {it.rating ? `${it.rating} ⭐` : "—"}
                                {it.reviewCount > 0 && ` (${it.reviewCount})`}
                            </div>
                            <div className="table-cell table-actions">
                                <Link href={`/dashboard/roteiro/${it.id}`}>
                                    <button className="table-action-btn" title="Editar">✏️</button>
                                </Link>
                                <button
                                    className="table-action-btn"
                                    title="Arquivar"
                                    onClick={() => handleDelete(it.id, it.title)}
                                >🗑️</button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </>
    );
}

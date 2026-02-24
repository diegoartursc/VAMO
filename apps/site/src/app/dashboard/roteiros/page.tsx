"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getDashboardStats, deleteItinerary, type DashboardItinerary } from "../../../lib/api";
import { MapPin, Pencil, Trash2, Star, Copy } from "lucide-react";

export default function RoteirosPage() {
    const [itineraries, setItineraries] = useState<DashboardItinerary[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        getDashboardStats()
            .then((data) => setItineraries(data.itineraries || []))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Arquivar "${title}"?`)) return;
        try {
            await deleteItinerary(id);
            setItineraries((prev) => prev.filter((i) => i.id !== id));
        } catch {
            alert("Erro ao arquivar");
        }
    };

    const handleDuplicate = (id: string, title: string) => {
        if (confirm(`Deseja iniciar um novo cadastro de roteiro a partir de uma cópia de "${title}"?`)) {
            router.push(`/dashboard/roteiro/new?from=${id}`);
        }
    };

    const formatCurrency = (v: number) =>
        `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`;

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
                            Nenhum roteiro cadastrado.{" "}
                            <Link href="/dashboard/roteiro/new" style={{ color: "var(--primary)", fontWeight: 600 }}>
                                Crie seu primeiro roteiro!
                            </Link>
                        </div>
                    </div>
                ) : (
                    itineraries.map((it) => (
                        <div className="table-row" key={it.id}>
                            <div className="table-cell">
                                <div className="itinerary-name">
                                    <MapPin size={14} /> {it.title}
                                </div>
                                <div className="itinerary-destination">{it.destination}</div>
                            </div>
                            <div className="table-cell">
                                <span className={`status-badge ${it.status === "published" ? "published" : it.status === "draft" ? "draft" : "archived"}`}>
                                    {it.status === "published" ? "Publicado" : it.status === "draft" ? "Rascunho" : "Arquivado"}
                                </span>
                            </div>
                            <div className="table-cell">{it.sales || "—"}</div>
                            <div className="table-cell">
                                {it.revenue > 0 ? formatCurrency(it.revenue) : "—"}
                            </div>
                            <div className="table-cell">
                                {it.rating ? <>{it.rating} <Star size={12} fill="currentColor" /></> : "—"}
                                {it.reviewCount > 0 && ` (${it.reviewCount})`}
                            </div>
                            <div className="table-cell table-actions">
                                <Link href={`/dashboard/roteiro/${it.id}`}>
                                    <button className="table-action-btn" title="Editar"><Pencil size={14} /></button>
                                </Link>
                                <button
                                    className="table-action-btn duplicate"
                                    title="Duplicar"
                                    onClick={() => handleDuplicate(it.id, it.title)}
                                ><Copy size={14} /></button>
                                <button
                                    className="table-action-btn"
                                    title="Arquivar"
                                    onClick={() => handleDelete(it.id, it.title)}
                                ><Trash2 size={14} /></button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </>
    );
}

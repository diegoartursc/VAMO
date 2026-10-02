"use client";

import React, { useState, useEffect } from "react";
import { AdminDataProvider, useAdmin, FilterBar, ItemList, ApproveRejectModal } from "../shared";
import CostProofsModal from "../CostProofsModal";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333/api";

function ItinerariesContent() {
    const { allItineraries, showToast, refetch, getToken } = useAdmin();
    const [filter, setFilter] = useState("ALL");
    const [filterChosen, setFilterChosen] = useState(false);

    // Filtro vindo do link (?status=PENDING_REVIEW…); sem ele, abre nos
    // pendentes quando houver algum — é o que o admin veio fazer aqui.
    useEffect(() => {
        const fromUrl = new URLSearchParams(window.location.search).get("status");
        if (fromUrl) { setFilter(fromUrl); setFilterChosen(true); }
    }, []);
    useEffect(() => {
        if (!filterChosen && allItineraries.some(i => i.status === "PENDING_REVIEW")) setFilter("PENDING_REVIEW");
    }, [allItineraries, filterChosen]);
    const chooseFilter = (f: string) => { setFilter(f); setFilterChosen(true); };
    const [modal, setModal] = useState<{ type: "approve" | "reject"; itemType: "packages" | "itineraries"; id: string; title: string } | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    /** Roteiro atualmente aberto na modal de comprovantes (null = fechado). */
    const [costProofsItineraryId, setCostProofsItineraryId] = useState<string | null>(null);

    const filtered = filter === "ALL" ? allItineraries : allItineraries.filter(i => i.status === filter);

    const handleApprove = (_: string, id: string, title: string) => setModal({ type: "approve", itemType: "itineraries", id, title });
    const handleReject = (_: string, id: string, title: string) => setModal({ type: "reject", itemType: "itineraries", id, title });

    const confirmAction = async (note: string) => {
        if (!modal) return;
        setActionLoading(true);
        try {
            const endpoint = modal.type === "approve"
                ? `${API}/admin/itineraries/${modal.id}/approve`
                : `${API}/admin/itineraries/${modal.id}/reject`;
            const res = await fetch(endpoint, {
                method: "POST",
                headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
                body: JSON.stringify(modal.type === "reject" ? { note } : {}),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body?.error || "Erro ao executar ação");
            }
            showToast(modal.type === "approve" ? "Aprovado! O roteirista recebeu um e-mail." : "Rejeitado. O motivo foi enviado ao roteirista.", "success");
            setModal(null); refetch();
        } catch (e: any) { showToast(e?.message || "Erro ao executar ação", "error"); }
        finally { setActionLoading(false); }
    };

    return (
        <div className="dash-container">
            <header className="dash-header">
                <div>
                    <h1 className="dash-title">Roteiros</h1>
                    <p className="dash-subtitle">Modere os roteiros dos criadores de conteúdo</p>
                </div>
            </header>
            <FilterBar current={filter} onChange={chooseFilter} counts={{
                ALL: allItineraries.length,
                PENDING_REVIEW: allItineraries.filter(i => i.status === "PENDING_REVIEW").length,
                APPROVED: allItineraries.filter(i => i.status === "APPROVED").length,
                ACTIVE: allItineraries.filter(i => i.status === "ACTIVE").length,
                REJECTED: allItineraries.filter(i => i.status === "REJECTED").length,
            }} />
            <ItemList
                items={filtered}
                type="itineraries"
                onApprove={handleApprove}
                onReject={handleReject}
                onCostProofs={(id) => setCostProofsItineraryId(id)}
                emptyMsg="Nenhum roteiro neste filtro"
                showStatus
            />
            <ApproveRejectModal modal={modal} onClose={() => setModal(null)} onConfirm={confirmAction} loading={actionLoading} />
            {costProofsItineraryId && (
                <CostProofsModal
                    itineraryId={costProofsItineraryId}
                    getToken={getToken}
                    onClose={() => setCostProofsItineraryId(null)}
                    onToast={showToast}
                />
            )}
        </div>
    );
}

export default function AdminItinerariesPage() {
    return <AdminDataProvider><ItinerariesContent /></AdminDataProvider>;
}

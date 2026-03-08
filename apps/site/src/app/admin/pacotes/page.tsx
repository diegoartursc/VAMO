"use client";

import React, { useState } from "react";
import { AdminDataProvider, useAdmin, FilterBar, ItemList, ApproveRejectModal } from "../shared";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333/api";

function PackagesContent() {
    const { allPackages, showToast, refetch, getToken } = useAdmin();
    const [filter, setFilter] = useState("ALL");
    const [modal, setModal] = useState<{ type: "approve" | "reject"; itemType: "packages" | "itineraries"; id: string; title: string } | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    const filtered = filter === "ALL" ? allPackages : allPackages.filter(p => p.status === filter);

    const handleApprove = (_: string, id: string, title: string) => setModal({ type: "approve", itemType: "packages", id, title });
    const handleReject = (_: string, id: string, title: string) => setModal({ type: "reject", itemType: "packages", id, title });

    const confirmAction = async (note: string) => {
        if (!modal) return;
        setActionLoading(true);
        try {
            const endpoint = modal.type === "approve"
                ? `${API}/admin/packages/${modal.id}/approve`
                : `${API}/admin/packages/${modal.id}/reject`;
            const res = await fetch(endpoint, {
                method: "POST",
                headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
                body: JSON.stringify(modal.type === "reject" ? { note } : {}),
            });
            if (!res.ok) throw new Error("Erro");
            showToast(modal.type === "approve" ? "Aprovado!" : "Rejeitado.", "success");
            setModal(null); refetch();
        } catch { showToast("Erro ao executar ação", "error"); }
        finally { setActionLoading(false); }
    };

    return (
        <div className="dash-container">
            <header className="dash-header">
                <div>
                    <h1 className="dash-title">Pacotes</h1>
                    <p className="dash-subtitle">Gerencie e modere os pacotes das agências</p>
                </div>
            </header>
            <FilterBar current={filter} onChange={setFilter} counts={{
                ALL: allPackages.length,
                PENDING_REVIEW: allPackages.filter(p => p.status === "PENDING_REVIEW").length,
                APPROVED: allPackages.filter(p => p.status === "APPROVED").length,
                ACTIVE: allPackages.filter(p => p.status === "ACTIVE").length,
                REJECTED: allPackages.filter(p => p.status === "REJECTED").length,
            }} />
            <ItemList items={filtered} type="packages" onApprove={handleApprove} onReject={handleReject} emptyMsg="Nenhum pacote neste filtro" showStatus />
            <ApproveRejectModal modal={modal} onClose={() => setModal(null)} onConfirm={confirmAction} loading={actionLoading} />
        </div>
    );
}

export default function AdminPackagesPage() {
    return <AdminDataProvider><PackagesContent /></AdminDataProvider>;
}

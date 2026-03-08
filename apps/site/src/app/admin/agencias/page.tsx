"use client";

import React, { useState } from "react";
import { AdminDataProvider, useAdmin, Icon, MOCK_AGENCIES, AGENCY_STATUS_LABEL, AGENCY_STATUS_COLOR, type AgencyStatus, type MockAgency } from "../shared";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333/api";

function AgenciesContent() {
    const { showToast, getToken } = useAdmin();
    const [agencies, setAgencies] = useState<MockAgency[]>(MOCK_AGENCIES);
    const [agencyFilter, setAgencyFilter] = useState<"ALL" | AgencyStatus>("ALL");
    const [showForm, setShowForm] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [newAgency, setNewAgency] = useState({ name: "", cnpj: "", employeeName: "", email: "", password: "" });

    const filteredAgencies = agencyFilter === "ALL" ? agencies : agencies.filter(a => a.status === agencyFilter);
    const counts: Record<AgencyStatus | "ALL", number> = {
        ALL: agencies.length, PENDING: agencies.filter(a => a.status === "PENDING").length,
        REVIEW: agencies.filter(a => a.status === "REVIEW").length,
        ACTIVE: agencies.filter(a => a.status === "ACTIVE").length,
        SUSPENDED: agencies.filter(a => a.status === "SUSPENDED").length,
    };

    const handleAction = (id: string, newStatus: AgencyStatus) => {
        setAgencies(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
        showToast(`Agência ${newStatus === "ACTIVE" ? "aprovada" : newStatus === "SUSPENDED" ? "suspensa" : "atualizada"}!`, "success");
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            const token = getToken();
            const res = await fetch(`${API}/admin/agencies`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify(newAgency),
            });
            if (res.ok) {
                showToast("Agência criada!", "success");
                setShowForm(false);
                setNewAgency({ name: "", cnpj: "", employeeName: "", email: "", password: "" });
            } else throw new Error();
        } catch { showToast("Erro ao criar (usando mock)", "error"); }
        finally { setActionLoading(false); }
    };

    return (
        <div className="dash-container">
            <header className="dash-header">
                <div>
                    <h1 className="dash-title">Agências</h1>
                    <p className="dash-subtitle">Pipeline de onboarding e gestão de agências parceiras</p>
                </div>
            </header>

            {/* Pipeline cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "20px" }}>
                {([
                    { key: "PENDING" as AgencyStatus, label: "Pendentes", icon: Icon.hourglass, color: "#D97706", bg: "rgba(217,119,6,0.08)" },
                    { key: "REVIEW" as AgencyStatus, label: "Em Análise", icon: Icon.clock, color: "#6366F1", bg: "rgba(99,102,241,0.08)" },
                    { key: "ACTIVE" as AgencyStatus, label: "Ativas", icon: Icon.checkCircle, color: "#16A34A", bg: "rgba(22,163,74,0.08)" },
                    { key: "SUSPENDED" as AgencyStatus, label: "Suspensas", icon: Icon.alertTriangle, color: "#DC2626", bg: "rgba(220,38,38,0.08)" },
                ]).map(card => (
                    <button key={card.key} onClick={() => setAgencyFilter(agencyFilter === card.key ? "ALL" : card.key)} style={{
                        background: agencyFilter === card.key ? `${card.bg.replace("0.08", "0.18")}` : "#fff",
                        borderRadius: "16px", padding: "16px 18px", cursor: "pointer",
                        border: agencyFilter === card.key ? `2px solid ${card.color}` : "1px solid rgba(226,232,240,0.7)",
                        boxShadow: "0 2px 8px rgba(26,50,99,0.04)", textAlign: "left",
                        transition: "all 0.15s",
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: card.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                {card.icon({ size: 16, color: card.color })}
                            </div>
                            <span style={{ fontSize: "11px", color: "#5A6B8C", fontWeight: "600" }}>{card.label}</span>
                        </div>
                        <div style={{ fontSize: "24px", fontWeight: "800", color: card.color }}>{counts[card.key]}</div>
                    </button>
                ))}
            </div>

            {/* Agency table */}
            <div style={{ background: "#fff", borderRadius: "18px", border: "1px solid rgba(226,232,240,0.7)", overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid #F0F2F5", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "14px", fontWeight: "700", color: "#1A3263" }}>
                        {agencyFilter === "ALL" ? "Todas as Agências" : `Agências — ${AGENCY_STATUS_LABEL[agencyFilter]}`} ({filteredAgencies.length})
                    </span>
                    <button onClick={() => setShowForm(!showForm)} style={{
                        padding: "7px 14px", borderRadius: "8px", border: "none", fontSize: "12px", fontWeight: "700", cursor: "pointer",
                        background: "linear-gradient(135deg, #28C9BF, #1FA89F)", color: "#fff",
                    }}>+ Nova Agência</button>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                        <tr style={{ background: "#F8F9FA" }}>
                            {["Agência", "CNPJ", "Gestor", "Pacotes", "Quality", "Status", "Ações"].map(h => (
                                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: "700", color: "#5A6B8C", fontSize: "11px", letterSpacing: "0.03em", borderBottom: "1px solid #F0F2F5" }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAgencies.map(ag => (
                            <tr key={ag.id} style={{ borderBottom: "1px solid #F8F9FA" }}>
                                <td style={{ padding: "12px 14px", fontWeight: "600", color: "#1A3263" }}>{ag.name}</td>
                                <td style={{ padding: "12px 14px", color: "#5A6B8C", fontFamily: "monospace", fontSize: "11px" }}>{ag.cnpj}</td>
                                <td style={{ padding: "12px 14px", color: "#5A6B8C" }}>{ag.manager}</td>
                                <td style={{ padding: "12px 14px", color: "#5A6B8C", textAlign: "center" }}>{ag.packagesCount}</td>
                                <td style={{ padding: "12px 14px", textAlign: "center" }}>
                                    {ag.qualityAvg > 0 ? (
                                        <span style={{ fontWeight: "700", color: ag.qualityAvg >= 70 ? "#16A34A" : ag.qualityAvg >= 40 ? "#D97706" : "#DC2626" }}>{ag.qualityAvg}%</span>
                                    ) : <span style={{ color: "#98989D" }}>—</span>}
                                </td>
                                <td style={{ padding: "12px 14px" }}>
                                    <span style={{
                                        display: "inline-block", padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700",
                                        background: `${AGENCY_STATUS_COLOR[ag.status]}14`, color: AGENCY_STATUS_COLOR[ag.status],
                                    }}>{AGENCY_STATUS_LABEL[ag.status]}</span>
                                </td>
                                <td style={{ padding: "12px 14px" }}>
                                    <div style={{ display: "flex", gap: "6px" }}>
                                        {(ag.status === "PENDING" || ag.status === "REVIEW") && (
                                            <button onClick={() => handleAction(ag.id, "ACTIVE")} style={{ padding: "5px 10px", borderRadius: "6px", border: "none", background: "rgba(22,163,74,0.1)", color: "#16A34A", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}>Aprovar</button>
                                        )}
                                        {ag.status === "PENDING" && (
                                            <button onClick={() => handleAction(ag.id, "REVIEW")} style={{ padding: "5px 10px", borderRadius: "6px", border: "none", background: "rgba(99,102,241,0.1)", color: "#6366F1", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}>Analisar</button>
                                        )}
                                        {ag.status === "ACTIVE" && (
                                            <button onClick={() => handleAction(ag.id, "SUSPENDED")} style={{ padding: "5px 10px", borderRadius: "6px", border: "none", background: "rgba(220,38,38,0.08)", color: "#DC2626", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}>Suspender</button>
                                        )}
                                        {ag.status === "SUSPENDED" && (
                                            <button onClick={() => handleAction(ag.id, "ACTIVE")} style={{ padding: "5px 10px", borderRadius: "6px", border: "none", background: "rgba(22,163,74,0.1)", color: "#16A34A", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}>Reativar</button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredAgencies.length === 0 && <div style={{ padding: "32px", textAlign: "center", color: "#98989D", fontSize: "14px" }}>Nenhuma agência com este status</div>}
            </div>

            {/* Collapsible form */}
            {showForm && (
                <div style={{ background: "#fff", borderRadius: "18px", padding: "24px", border: "1px solid rgba(226,232,240,0.7)", maxWidth: "600px", marginTop: "20px" }}>
                    <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: "800", display: "flex", alignItems: "center", gap: "8px", color: "#1A3263" }}>
                        {Icon.building({ size: 18, color: "#1FA89F" })} Registrar Nova Agência
                    </h3>
                    <form onSubmit={handleCreate} style={{ display: "grid", gap: "14px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                            <div style={{ display: "grid", gap: "4px" }}>
                                <label style={{ fontSize: "11px", fontWeight: "700", color: "#5A6B8C" }}>Nome da Agência</label>
                                <input type="text" value={newAgency.name} onChange={e => setNewAgency({ ...newAgency, name: e.target.value })} required style={{ padding: "10px", borderRadius: "8px", border: "1.5px solid #E0E4EB", outline: "none", fontFamily: "inherit", fontSize: "13px" }} />
                            </div>
                            <div style={{ display: "grid", gap: "4px" }}>
                                <label style={{ fontSize: "11px", fontWeight: "700", color: "#5A6B8C" }}>CNPJ</label>
                                <input type="text" value={newAgency.cnpj} onChange={e => setNewAgency({ ...newAgency, cnpj: e.target.value })} required style={{ padding: "10px", borderRadius: "8px", border: "1.5px solid #E0E4EB", outline: "none", fontFamily: "inherit", fontSize: "13px" }} />
                            </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px" }}>
                            <div style={{ display: "grid", gap: "4px" }}>
                                <label style={{ fontSize: "11px", fontWeight: "700", color: "#5A6B8C" }}>Gestor</label>
                                <input type="text" value={newAgency.employeeName} onChange={e => setNewAgency({ ...newAgency, employeeName: e.target.value })} required style={{ padding: "10px", borderRadius: "8px", border: "1.5px solid #E0E4EB", outline: "none", fontFamily: "inherit", fontSize: "13px" }} />
                            </div>
                            <div style={{ display: "grid", gap: "4px" }}>
                                <label style={{ fontSize: "11px", fontWeight: "700", color: "#5A6B8C" }}>E-mail</label>
                                <input type="email" value={newAgency.email} onChange={e => setNewAgency({ ...newAgency, email: e.target.value })} required style={{ padding: "10px", borderRadius: "8px", border: "1.5px solid #E0E4EB", outline: "none", fontFamily: "inherit", fontSize: "13px" }} />
                            </div>
                            <div style={{ display: "grid", gap: "4px" }}>
                                <label style={{ fontSize: "11px", fontWeight: "700", color: "#5A6B8C" }}>Senha</label>
                                <input type="password" value={newAgency.password} onChange={e => setNewAgency({ ...newAgency, password: e.target.value })} required style={{ padding: "10px", borderRadius: "8px", border: "1.5px solid #E0E4EB", outline: "none", fontFamily: "inherit", fontSize: "13px" }} />
                            </div>
                        </div>
                        <button type="submit" disabled={actionLoading} style={{ padding: "12px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #28C9BF, #1FA89F)", color: "#fff", fontWeight: "700", cursor: "pointer", fontFamily: "inherit", fontSize: "13px" }}>
                            {actionLoading ? "Criando..." : "Criar Agência e Gestor"}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}

export default function AdminAgenciesPage() {
    return <AdminDataProvider><AgenciesContent /></AdminDataProvider>;
}

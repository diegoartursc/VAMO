"use client";

import { useState } from "react";

export default function VendasPage() {
    const [balance] = useState(12450.00);
    const [pending] = useState(1200.00);

    const formatCurrency = (val: number) =>
        `A$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

    const transactions = [
        { id: 1, date: "27/02/2026", desc: "Venda: Roteiro Chapada Diamantina", amount: 450.00, status: "Recebido" },
        { id: 2, date: "26/02/2026", desc: "Venda: Roteiro Jalapão — 7 dias", amount: 150.00, status: "Recebido" },
        { id: 3, date: "25/02/2026", desc: "Comissão plataforma VAMO (10%)", amount: -45.00, status: "Pago" },
        { id: 4, date: "22/02/2026", desc: "Venda: Roteiro Fernando de Noronha", amount: 2500.00, status: "Pendente" },
        { id: 5, date: "20/02/2026", desc: "Venda: Roteiro Gramado & Canela", amount: 399.00, status: "Recebido" },
    ];

    return (
        <>
            <div className="dash-header">
                <h1 className="dash-title">Minhas Vendas</h1>
                <p className="dash-subtitle">Acompanhe seu saldo, transações e solicitações de saque</p>
            </div>

            <div className="dash-stats">
                <div className="dash-stat-card">
                    <div className="dash-stat-label">Saldo Disponível</div>
                    <div className="dash-stat-value teal">{formatCurrency(balance)}</div>
                    <div className="dash-stat-change">Disponível para saque imediato</div>
                </div>
                <div className="dash-stat-card">
                    <div className="dash-stat-label">A Receber</div>
                    <div className="dash-stat-value">{formatCurrency(pending)}</div>
                    <div className="dash-stat-change">Em processamento (30 dias)</div>
                </div>
                <div className="dash-stat-card">
                    <div className="dash-stat-label">Total Ganhos</div>
                    <div className="dash-stat-value">{formatCurrency(balance + pending)}</div>
                    <div className="dash-stat-change">Histórico completo</div>
                </div>
                <div className="dash-stat-card">
                    <div className="dash-stat-label">Vendas este mês</div>
                    <div className="dash-stat-value">
                        {transactions.filter(t => t.amount > 0 && t.status !== "Pendente").length}
                    </div>
                    <div className="dash-stat-change">roteiros vendidos</div>
                </div>
            </div>

            <div className="itinerary-table" style={{ marginTop: "2rem" }}>
                <div className="table-header">
                    <h3 className="table-title">Transações Recentes</h3>
                    <button className="btn-new">Solicitar Saque</button>
                </div>

                <div className="table-row table-row-head" style={{ gridTemplateColumns: "1fr 2.5fr 1fr 1fr" }}>
                    <div className="table-cell">Data</div>
                    <div className="table-cell">Descrição</div>
                    <div className="table-cell">Valor</div>
                    <div className="table-cell">Status</div>
                </div>

                {transactions.map(t => (
                    <div className="table-row" key={t.id} style={{ gridTemplateColumns: "1fr 2.5fr 1fr 1fr" }}>
                        <div className="table-cell">{t.date}</div>
                        <div className="table-cell">{t.desc}</div>
                        <div className="table-cell" style={{ color: t.amount > 0 ? "var(--success)" : "var(--error)", fontWeight: 600 }}>
                            {t.amount > 0 ? "+" : ""}{formatCurrency(t.amount)}
                        </div>
                        <div className="table-cell">
                            <span className={`status-badge ${t.status === "Recebido" ? "published" : t.status === "Pendente" ? "draft" : "archived"}`}>
                                {t.status}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}

"use client";

import { useState } from "react";

export default function FinanceiroPage() {
    const [balance] = useState(12450.00);
    const [pending] = useState(1200.00);

    const formatCurrency = (val: number) =>
        `A$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

    const transactions = [
        { id: 1, date: "2026-02-27", desc: "Venda: Pacote Chapada Diamantina", amount: 450.00, status: "Recebido" },
        { id: 2, date: "2026-02-26", desc: "Venda: Roteiro Jalapão", amount: 150.00, status: "Recebido" },
        { id: 3, date: "2026-02-25", desc: "Comissão: Agência VAMO", amount: -45.00, status: "Pago" },
        { id: 4, date: "2026-02-22", desc: "Venda: Pacote Fernando de Noronha", amount: 2500.00, status: "Pendente" },
    ];

    return (
        <div className="finance-page">
            <div className="dash-header">
                <h1 className="dash-title">Financeiro</h1>
                <p className="dash-subtitle">Gestão de saldos, vendas e saques</p>
            </div>

            <div className="dash-stats">
                <div className="dash-stat-card">
                    <div className="dash-stat-label">Saldo Disponível</div>
                    <div className="dash-stat-value success">{formatCurrency(balance)}</div>
                    <div className="dash-stat-change">Disponível para saque</div>
                </div>
                <div className="dash-stat-card">
                    <div className="dash-stat-label">Pendente</div>
                    <div className="dash-stat-value warning">{formatCurrency(pending)}</div>
                    <div className="dash-stat-change">A receber em 30 dias</div>
                </div>
                <div className="dash-stat-card">
                    <div className="dash-stat-label">Total Ganhos</div>
                    <div className="dash-stat-value">{formatCurrency(balance + pending)}</div>
                    <div className="dash-stat-change">Histórico total</div>
                </div>
            </div>

            <div className="itinerary-table" style={{ marginTop: "2rem" }}>
                <div className="table-header">
                    <h3 className="table-title">Transações Recentes</h3>
                    <button className="btn-primary" style={{ padding: "8px 16px", borderRadius: "8px", fontSize: "14px" }}>Solicitar Saque</button>
                </div>

                <div className="table-row table-row-head">
                    <div className="table-cell">Data</div>
                    <div className="table-cell">Descrição</div>
                    <div className="table-cell">Valor</div>
                    <div className="table-cell">Status</div>
                </div>

                {transactions.map(t => (
                    <div className="table-row" key={t.id}>
                        <div className="table-cell">{t.date}</div>
                        <div className="table-cell">{t.desc}</div>
                        <div className="table-cell" style={{ color: t.amount > 0 ? "var(--success)" : "var(--error)" }}>
                            {formatCurrency(t.amount)}
                        </div>
                        <div className="table-cell">
                            <span className={`status-badge ${t.status === "Recebido" ? "published" : t.status === "Pendente" ? "draft" : "archived"}`}>
                                {t.status}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

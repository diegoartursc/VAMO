import Link from "next/link";

export default function DashboardPage() {
    return (
        <>
            <div className="dash-header">
                <h1 className="dash-title">Visão Geral</h1>
                <p className="dash-subtitle">
                    Acompanhe o desempenho dos seus roteiros e vendas em tempo real
                </p>
            </div>

            {/* Stats */}
            <div className="dash-stats">
                <div className="dash-stat-card">
                    <div className="dash-stat-label">Receita Total</div>
                    <div className="dash-stat-value teal">R$ 66.907</div>
                    <div className="dash-stat-change">↑ 12% este mês</div>
                </div>
                <div className="dash-stat-card">
                    <div className="dash-stat-label">Vendas Totais</div>
                    <div className="dash-stat-value">1.323</div>
                    <div className="dash-stat-change">↑ 8% este mês</div>
                </div>
                <div className="dash-stat-card">
                    <div className="dash-stat-label">Avaliação Média</div>
                    <div className="dash-stat-value">4.9 ⭐</div>
                    <div className="dash-stat-change">257 avaliações</div>
                </div>
                <div className="dash-stat-card">
                    <div className="dash-stat-label">Roteiros Ativos</div>
                    <div className="dash-stat-value">3</div>
                    <div className="dash-stat-change">2 publicados, 1 rascunho</div>
                </div>
            </div>

            {/* Recent Itineraries */}
            <div className="itinerary-table">
                <div className="table-header">
                    <h3 className="table-title">Últimos Roteiros</h3>
                    <Link href="/dashboard/roteiros">
                        <button className="btn-new">Ver Todos →</button>
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

                <div className="table-row">
                    <div className="table-cell">
                        <div className="itinerary-name">Paris Econômica — 10 dias</div>
                        <div className="itinerary-destination">📍 Paris, França</div>
                    </div>
                    <div className="table-cell">
                        <span className="status-badge published">Publicado</span>
                    </div>
                    <div className="table-cell">1.234</div>
                    <div className="table-cell">R$ 61.576</div>
                    <div className="table-cell">4.9 ⭐</div>
                    <div className="table-cell table-actions">
                        <Link href="/dashboard/roteiro/paris-economica">
                            <button className="table-action-btn" title="Editar">✏️</button>
                        </Link>
                        <button className="table-action-btn" title="Visualizar">👁️</button>
                    </div>
                </div>

                <div className="table-row">
                    <div className="table-cell">
                        <div className="itinerary-name">Lisboa Clássica — 7 dias</div>
                        <div className="itinerary-destination">📍 Lisboa, Portugal</div>
                    </div>
                    <div className="table-cell">
                        <span className="status-badge published">Publicado</span>
                    </div>
                    <div className="table-cell">89</div>
                    <div className="table-cell">R$ 5.331</div>
                    <div className="table-cell">4.7 ⭐</div>
                    <div className="table-cell table-actions">
                        <Link href="/dashboard/roteiro/lisboa-classica">
                            <button className="table-action-btn" title="Editar">✏️</button>
                        </Link>
                        <button className="table-action-btn" title="Visualizar">👁️</button>
                    </div>
                </div>

                <div className="table-row">
                    <div className="table-cell">
                        <div className="itinerary-name">Tóquio Aventura — 14 dias</div>
                        <div className="itinerary-destination">📍 Tóquio, Japão</div>
                    </div>
                    <div className="table-cell">
                        <span className="status-badge draft">Rascunho</span>
                    </div>
                    <div className="table-cell">—</div>
                    <div className="table-cell">—</div>
                    <div className="table-cell">—</div>
                    <div className="table-cell table-actions">
                        <Link href="/dashboard/roteiro/toquio-aventura">
                            <button className="table-action-btn" title="Editar">✏️</button>
                        </Link>
                        <button className="table-action-btn" title="Visualizar">👁️</button>
                    </div>
                </div>
            </div>
        </>
    );
}

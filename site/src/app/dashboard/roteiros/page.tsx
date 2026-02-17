import Link from "next/link";

export default function RoteirosPage() {
    return (
        <>
            <div className="dash-header">
                <h1 className="dash-title">Meus Roteiros</h1>
                <p className="dash-subtitle">Gerencie e edite todos os seus roteiros</p>
            </div>

            <div className="itinerary-table">
                <div className="table-header">
                    <h3 className="table-title">Todos os Roteiros</h3>
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

                <div className="table-row">
                    <div className="table-cell">
                        <div className="itinerary-name">Paris Econômica — 10 dias</div>
                        <div className="itinerary-destination">📍 Paris, França • Última edição: 15/02/2026</div>
                    </div>
                    <div className="table-cell"><span className="status-badge published">Publicado</span></div>
                    <div className="table-cell">1.234</div>
                    <div className="table-cell">R$ 61.576</div>
                    <div className="table-cell">4.9 ⭐ (234)</div>
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
                        <div className="itinerary-destination">📍 Lisboa, Portugal • Última edição: 10/02/2026</div>
                    </div>
                    <div className="table-cell"><span className="status-badge published">Publicado</span></div>
                    <div className="table-cell">89</div>
                    <div className="table-cell">R$ 5.331</div>
                    <div className="table-cell">4.7 ⭐ (23)</div>
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
                        <div className="itinerary-destination">📍 Tóquio, Japão • Última edição: 08/02/2026</div>
                    </div>
                    <div className="table-cell"><span className="status-badge draft">Rascunho</span></div>
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

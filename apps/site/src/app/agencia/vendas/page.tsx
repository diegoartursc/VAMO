"use client";

import { useState } from "react";

/* ─── Types ─── */
type QuoteStatus = "AWAITING_QUOTE" | "QUOTED" | "ACCEPTED" | "EXPIRED" | "REJECTED";
type DocType = "BOARDING_PASS" | "HOTEL_VOUCHER" | "HOTEL_CHECKIN" | "TRANSFER_VOUCHER" | "TOUR_TICKET" | "INSURANCE" | "OTHER";

/* ─── Mock data: Cotações ─── */
const MOCK_QUOTES = [
    {
        id: "q-1",
        originCity: "Florianópolis",
        checkedBags: 2,
        status: "AWAITING_QUOTE" as QuoteStatus,
        createdAt: "2026-03-20T14:00:00",
        purchase: {
            contactName: "Diego Artur",
            contactEmail: "diego@email.com",
            adultsCount: 2,
            childrenCount: 0,
            travelDate: "2026-05-15",
            totalPrice: 5200,
            package: { title: "Paris Romântica — 10 dias" },
        },
        airline: null,
        flightDetails: null,
        airfarePrice: null,
        totalPrice: null,
        expiresAt: null,
    },
    {
        id: "q-2",
        originCity: "São Paulo",
        checkedBags: 0,
        status: "QUOTED" as QuoteStatus,
        createdAt: "2026-03-19T10:00:00",
        purchase: {
            contactName: "Mariana Silva",
            contactEmail: "mari@email.com",
            adultsCount: 1,
            childrenCount: 0,
            travelDate: "2026-06-01",
            totalPrice: 8500,
            package: { title: "Japão Completo" },
        },
        airline: "LATAM",
        flightDetails: "GRU → NRT · 1 escala (FCO) · Embarque 19:45",
        airfarePrice: 4200,
        totalPrice: 12700,
        expiresAt: "2026-03-22T16:00:00",
    },
];

/* ─── Mock data: Vendas confirmadas ─── */
const MOCK_CONFIRMED = [
    {
        id: "venda-1",
        clientName: "Diego Artur",
        clientEmail: "diego@email.com",
        package: "Paris Romântica — 10 dias",
        bookingCode: "VAMO-2026-PAR-7842",
        status: "confirmed",
        travelDate: "2026-03-15",
        price: 8500,
        travelers: 2,
        docs: [
            { name: "Passaporte", status: "approved", uploadedAt: "2026-02-20" },
            { name: "Seguro Viagem", status: "reviewing", uploadedAt: "2026-03-01" },
        ],
        agencyDocs: [
            { id: "ad-1", title: "Bilhete Aéreo LATAM — FLN → CDG", type: "BOARDING_PASS", sentAt: "2026-03-10", viewedAt: "2026-03-11" },
        ],
    },
    {
        id: "venda-2",
        clientName: "Mariana Silva",
        clientEmail: "mari@email.com",
        package: "Japão Completo",
        bookingCode: "VAMO-2026-JAP-3310",
        status: "confirmed",
        travelDate: "2026-05-10",
        price: 14000,
        travelers: 1,
        docs: [
            { name: "Passaporte", status: "approved", uploadedAt: "2026-01-15" },
            { name: "Visto Japonês", status: "reviewing", uploadedAt: "2026-02-01" },
        ],
        agencyDocs: [],
    },
];

const QUOTE_STATUS: Record<QuoteStatus, { label: string; color: string }> = {
    AWAITING_QUOTE: { label: "⏳ Aguardando cotação", color: "#D97706" },
    QUOTED: { label: "📨 Proposta enviada", color: "#3B82F6" },
    ACCEPTED: { label: "✅ Aceita", color: "#16A34A" },
    EXPIRED: { label: "⏰ Expirada", color: "#DC2626" },
    REJECTED: { label: "❌ Recusada", color: "#DC2626" },
};

const DOC_TYPES: { value: DocType; label: string; icon: string }[] = [
    { value: "BOARDING_PASS", label: "Bilhete Aéreo", icon: "✈️" },
    { value: "HOTEL_VOUCHER", label: "Voucher Hotel", icon: "🏨" },
    { value: "HOTEL_CHECKIN", label: "Check-in Hotel", icon: "🔑" },
    { value: "TRANSFER_VOUCHER", label: "Transfer", icon: "🚐" },
    { value: "TOUR_TICKET", label: "Ingresso Passeio", icon: "🎟️" },
    { value: "INSURANCE", label: "Seguro Viagem", icon: "🛡️" },
    { value: "OTHER", label: "Outro", icon: "📎" },
];

const DOC_STATUS: Record<string, { label: string; color: string }> = {
    pending: { label: "⏳ Pendente", color: "#D97706" },
    reviewing: { label: "🔍 Em análise", color: "#3B82F6" },
    approved: { label: "✅ Aprovado", color: "#16A34A" },
    rejected: { label: "❌ Rejeitado", color: "#DC2626" },
};

export default function VendasPage() {
    const [activeTab, setActiveTab] = useState<"quotes" | "sales" | "docs">("quotes");
    const [expandedQuoteId, setExpandedQuoteId] = useState<string | null>(null);
    const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);

    // Quote form states
    const [quoteAirline, setQuoteAirline] = useState("");
    const [quoteFlightDetails, setQuoteFlightDetails] = useState("");
    const [quoteAirfarePrice, setQuoteAirfarePrice] = useState("");
    const [quoteNote, setQuoteNote] = useState("");
    const [quoteValidity, setQuoteValidity] = useState("6");

    // Doc form states
    const [docType, setDocType] = useState<DocType>("BOARDING_PASS");
    const [docTitle, setDocTitle] = useState("");
    const [docFile, setDocFile] = useState<File | null>(null);
    const [docDesc, setDocDesc] = useState("");

    const formatDate = (d: string) =>
        new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

    const formatCurrency = (v: number) =>
        `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`;

    const getUrgencyColor = (createdAt: string) => {
        const hours = (Date.now() - new Date(createdAt).getTime()) / 3600000;
        if (hours > 4) return "#DC2626";
        if (hours > 2) return "#D97706";
        return "#16A34A";
    };

    const awaitingCount = MOCK_QUOTES.filter(q => q.status === "AWAITING_QUOTE").length;
    const quotedCount = MOCK_QUOTES.filter(q => q.status === "QUOTED").length;
    const acceptedCount = MOCK_QUOTES.filter(q => q.status === "ACCEPTED").length;

    return (
        <>
            <div className="dash-header">
                <h1 className="dash-title">Vendas e Cotações</h1>
                <p className="dash-subtitle">Gerencie cotações aéreas, reservas e documentos dos viajantes</p>
            </div>

            {/* Tab Navigation */}
            <div style={{ display: "flex", gap: 8, marginBottom: "1.5rem", borderBottom: "1px solid #e2e8f0", paddingBottom: 0 }}>
                {[
                    { key: "quotes", label: "🛫 Cotações", badge: awaitingCount },
                    { key: "sales", label: "📋 Reservas" },
                    { key: "docs", label: "📄 Enviar Docs" },
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key as any)}
                        style={{
                            padding: "10px 20px",
                            fontSize: 14,
                            fontWeight: activeTab === tab.key ? 700 : 500,
                            color: activeTab === tab.key ? "#14b8a6" : "#64748b",
                            background: "none",
                            border: "none",
                            borderBottom: activeTab === tab.key ? "3px solid #14b8a6" : "3px solid transparent",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                        }}
                    >
                        {tab.label}
                        {tab.badge && tab.badge > 0 ? (
                            <span style={{
                                background: "#DC2626", color: "#fff", borderRadius: 10,
                                padding: "2px 8px", fontSize: 11, fontWeight: 700,
                            }}>{tab.badge}</span>
                        ) : null}
                    </button>
                ))}
            </div>

            {/* ═══ TAB: COTAÇÕES ═══ */}
            {activeTab === "quotes" && (
                <>
                    {/* Stats */}
                    <div className="dash-stats">
                        <div className="dash-stat-card">
                            <div className="dash-stat-label">Aguardando Cotação</div>
                            <div className="dash-stat-value" style={{ color: "#D97706" }}>{awaitingCount}</div>
                        </div>
                        <div className="dash-stat-card">
                            <div className="dash-stat-label">Propostas Enviadas</div>
                            <div className="dash-stat-value" style={{ color: "#3B82F6" }}>{quotedCount}</div>
                        </div>
                        <div className="dash-stat-card">
                            <div className="dash-stat-label">Aceitas</div>
                            <div className="dash-stat-value teal">{acceptedCount}</div>
                        </div>
                    </div>

                    {/* Quotes Table */}
                    <div className="itinerary-table" style={{ marginTop: "1.5rem" }}>
                        <div className="table-header">
                            <h3 className="table-title">Cotações ({MOCK_QUOTES.length})</h3>
                        </div>
                        <div className="table-row table-row-head" style={{ gridTemplateColumns: "1.5fr 1.5fr 1fr 1fr 1fr 1fr 100px" }}>
                            <div className="table-cell">Cliente</div>
                            <div className="table-cell">Pacote</div>
                            <div className="table-cell">Origem</div>
                            <div className="table-cell">Data</div>
                            <div className="table-cell">Viajantes</div>
                            <div className="table-cell">Status</div>
                            <div className="table-cell">Ação</div>
                        </div>

                        {MOCK_QUOTES.map(q => {
                            const isExpanded = expandedQuoteId === q.id;
                            const qs = QUOTE_STATUS[q.status];
                            const urgColor = getUrgencyColor(q.createdAt);
                            const terrestrePrice = q.purchase.totalPrice;

                            return (
                                <div key={q.id}>
                                    <div className="table-row" style={{ gridTemplateColumns: "1.5fr 1.5fr 1fr 1fr 1fr 1fr 100px" }}>
                                        <div className="table-cell">
                                            <div className="itinerary-name">{q.purchase.contactName}</div>
                                            <div className="itinerary-destination">📧 {q.purchase.contactEmail}</div>
                                        </div>
                                        <div className="table-cell" style={{ fontSize: 13, fontWeight: 600 }}>
                                            {q.purchase.package.title}
                                        </div>
                                        <div className="table-cell" style={{ flexDirection: "column", alignItems: "flex-start", justifyContent: "center", gap: 2 }}>
                                            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 500 }}>
                                                ✈️ {q.originCity}
                                            </span>
                                            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#64748b" }}>
                                                🧳 {q.checkedBags > 0 ? `${q.checkedBags} mala(s) de 23kg` : 'Só bagagem de mão'}
                                            </span>
                                        </div>
                                        <div className="table-cell">{formatDate(q.purchase.travelDate)}</div>
                                        <div className="table-cell">
                                            {q.purchase.adultsCount} adulto{q.purchase.adultsCount > 1 ? "s" : ""}
                                            {q.purchase.childrenCount > 0 && ` + ${q.purchase.childrenCount} criança${q.purchase.childrenCount > 1 ? "s" : ""}`}
                                        </div>
                                        <div className="table-cell">
                                            <span style={{
                                                fontSize: 12, fontWeight: 600, color: qs.color,
                                                background: qs.color + "12", padding: "4px 10px", borderRadius: 8,
                                            }}>{qs.label}</span>
                                        </div>
                                        <div className="table-cell">
                                            {q.status === "AWAITING_QUOTE" && (
                                                <button
                                                    className="table-action-btn"
                                                    onClick={() => setExpandedQuoteId(isExpanded ? null : q.id)}
                                                    style={{
                                                        background: urgColor + "15", border: `1px solid ${urgColor}`,
                                                        borderRadius: 8, padding: "4px 12px", fontSize: 12,
                                                        fontWeight: 700, cursor: "pointer", color: urgColor,
                                                    }}
                                                >
                                                    {isExpanded ? "✕ Fechar" : "✈️ Cotar"}
                                                </button>
                                            )}
                                            {q.status === "QUOTED" && (
                                                <span style={{ fontSize: 12, color: "#3B82F6", fontWeight: 600 }}>
                                                    Aguardando cliente
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Expanded Quote Form */}
                                    {isExpanded && q.status === "AWAITING_QUOTE" && (
                                        <div style={{
                                            background: "rgba(248,250,252,0.95)", borderBottom: "1px solid #e2e8f0",
                                            padding: "1.5rem", display: "flex", flexDirection: "column", gap: 16,
                                        }}>
                                            <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b" }}>
                                                ✈️ Cotar voo para {q.purchase.contactName} — {q.originCity} ({q.checkedBags > 0 ? `${q.checkedBags} mala(s) de 23kg` : 'Só bagagem de mão'}) → {q.purchase.package.title}
                                            </div>

                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                                <div>
                                                    <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Cia Aérea</label>
                                                    <input
                                                        type="text" placeholder="Ex: LATAM, GOL, Azul"
                                                        value={quoteAirline} onChange={e => setQuoteAirline(e.target.value)}
                                                        style={inputStyle}
                                                    />
                                                </div>
                                                <div>
                                                    <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Valor do Aéreo (por pessoa)</label>
                                                    <input
                                                        type="number" placeholder="Ex: 1800"
                                                        value={quoteAirfarePrice} onChange={e => setQuoteAirfarePrice(e.target.value)}
                                                        style={inputStyle}
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Detalhes do Voo</label>
                                                <textarea
                                                    placeholder="Horários, escalas, bagagem inclusa..."
                                                    value={quoteFlightDetails} onChange={e => setQuoteFlightDetails(e.target.value)}
                                                    style={{ ...inputStyle, minHeight: 70, resize: "vertical" as any }}
                                                />
                                            </div>

                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                                <div>
                                                    <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Nota para o cliente</label>
                                                    <input
                                                        type="text" placeholder="Opcional"
                                                        value={quoteNote} onChange={e => setQuoteNote(e.target.value)}
                                                        style={inputStyle}
                                                    />
                                                </div>
                                                <div>
                                                    <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Validade da proposta</label>
                                                    <select value={quoteValidity} onChange={e => setQuoteValidity(e.target.value)} style={inputStyle}>
                                                        <option value="3">3 horas</option>
                                                        <option value="6">6 horas</option>
                                                        <option value="12">12 horas</option>
                                                        <option value="24">24 horas</option>
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Price calculation */}
                                            {quoteAirfarePrice && (
                                                <div style={{
                                                    background: "#f0fdfa", border: "1px solid #99f6e4", borderRadius: 10,
                                                    padding: 16, display: "flex", flexDirection: "column", gap: 6,
                                                }}>
                                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#475569" }}>
                                                        <span>Terrestre</span>
                                                        <span>{formatCurrency(terrestrePrice)}/pessoa</span>
                                                    </div>
                                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#475569" }}>
                                                        <span>Aéreo</span>
                                                        <span>{formatCurrency(Number(quoteAirfarePrice))}/pessoa</span>
                                                    </div>
                                                    <div style={{
                                                        display: "flex", justifyContent: "space-between",
                                                        fontSize: 16, fontWeight: 800, color: "#0d9488",
                                                        borderTop: "1px solid #99f6e4", paddingTop: 8, marginTop: 4,
                                                    }}>
                                                        <span>Total</span>
                                                        <span>{formatCurrency(terrestrePrice + Number(quoteAirfarePrice))}/pessoa</span>
                                                    </div>
                                                </div>
                                            )}

                                            <button
                                                style={{
                                                    background: "#14b8a6", color: "#fff", border: "none",
                                                    borderRadius: 10, padding: "12px 24px", fontSize: 14,
                                                    fontWeight: 700, cursor: "pointer", alignSelf: "flex-end",
                                                }}
                                                onClick={() => {
                                                    alert(`Proposta enviada para ${q.purchase.contactName}!\nTotal: ${formatCurrency(terrestrePrice + Number(quoteAirfarePrice))}/pessoa\nValidade: ${quoteValidity}h`);
                                                    setExpandedQuoteId(null);
                                                }}
                                            >
                                                📨 Enviar Proposta
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {/* ═══ TAB: RESERVAS ═══ */}
            {activeTab === "sales" && (
                <>
                    <div className="itinerary-table">
                        <div className="table-header">
                            <h3 className="table-title">Reservas ({MOCK_CONFIRMED.length})</h3>
                        </div>
                        <div className="table-row table-row-head" style={{ gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr 80px" }}>
                            <div className="table-cell">Cliente</div>
                            <div className="table-cell">Pacote</div>
                            <div className="table-cell">Data</div>
                            <div className="table-cell">Valor</div>
                            <div className="table-cell">Status</div>
                            <div className="table-cell">Docs</div>
                        </div>

                        {MOCK_CONFIRMED.map(venda => {
                            const pendingCount = venda.docs.filter(d => d.status === "pending").length;
                            const reviewCount = venda.docs.filter(d => d.status === "reviewing").length;
                            const isExpanded = expandedSaleId === venda.id;

                            return (
                                <div key={venda.id}>
                                    <div className="table-row" style={{ gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr 80px" }}>
                                        <div className="table-cell">
                                            <div className="itinerary-name">{venda.clientName}</div>
                                            <div className="itinerary-destination">📧 {venda.clientEmail}</div>
                                        </div>
                                        <div className="table-cell" style={{ fontSize: 13, fontWeight: 600 }}>{venda.package}</div>
                                        <div className="table-cell">{formatDate(venda.travelDate)}</div>
                                        <div className="table-cell">{formatCurrency(venda.price)}</div>
                                        <div className="table-cell">
                                            <span className="status-badge published">Confirmado</span>
                                        </div>
                                        <div className="table-cell">
                                            <button
                                                className="table-action-btn"
                                                onClick={() => setExpandedSaleId(isExpanded ? null : venda.id)}
                                                style={{
                                                    background: pendingCount > 0 ? "rgba(245,158,11,0.1)" : reviewCount > 0 ? "rgba(59,130,246,0.1)" : "rgba(22,163,74,0.1)",
                                                    border: "1px solid",
                                                    borderColor: pendingCount > 0 ? "#F59E0B" : reviewCount > 0 ? "#3B82F6" : "#16A34A",
                                                    borderRadius: 8, padding: "4px 8px", fontSize: 12, fontWeight: 600, cursor: "pointer",
                                                    color: pendingCount > 0 ? "#D97706" : reviewCount > 0 ? "#3B82F6" : "#16A34A",
                                                }}
                                            >
                                                {pendingCount > 0 ? `⏳ ${pendingCount}` : reviewCount > 0 ? `🔍 ${reviewCount}` : "✅"} Docs
                                            </button>
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div style={{ background: "rgba(248,250,252,0.8)", borderBottom: "1px solid #e2e8f0", padding: "1rem 1.5rem", display: "flex", flexDirection: "column", gap: 10 }}>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>📎 Documentos do viajante</div>
                                            {venda.docs.map((doc, i) => {
                                                const ds = DOC_STATUS[doc.status];
                                                return (
                                                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "white", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px" }}>
                                                        <div>
                                                            <div style={{ fontWeight: 600, fontSize: 14 }}>{doc.name}</div>
                                                            {doc.uploadedAt && <div style={{ fontSize: 11, color: "#94a3b8" }}>Enviado em {formatDate(doc.uploadedAt)}</div>}
                                                        </div>
                                                        <span style={{ fontSize: 13, fontWeight: 600, color: ds.color }}>{ds.label}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {/* ═══ TAB: ENVIAR DOCS ═══ */}
            {activeTab === "docs" && (
                <>
                    <div style={{ marginBottom: "1.5rem" }}>
                        <p style={{ fontSize: 14, color: "#64748b" }}>
                            Envie documentos de viagem (bilhetes, vouchers, check-in) para seus clientes com reservas confirmadas.
                        </p>
                    </div>

                    {MOCK_CONFIRMED.map(venda => (
                        <div key={venda.id} style={{
                            background: "white", border: "1px solid #e2e8f0", borderRadius: 12,
                            padding: "1.25rem", marginBottom: "1rem",
                        }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                                <div>
                                    <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b" }}>{venda.clientName}</div>
                                    <div style={{ fontSize: 13, color: "#64748b" }}>{venda.package} · {venda.bookingCode}</div>
                                </div>
                                <span className="status-badge published">Confirmado</span>
                            </div>

                            {/* Already sent docs */}
                            {venda.agencyDocs.length > 0 && (
                                <div style={{ marginBottom: 16 }}>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 8 }}>Documentos enviados</div>
                                    {venda.agencyDocs.map(doc => (
                                        <div key={doc.id} style={{
                                            display: "flex", alignItems: "center", justifyContent: "space-between",
                                            background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8,
                                            padding: "8px 12px", marginBottom: 6,
                                        }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                <span>{DOC_TYPES.find(t => t.value === doc.type)?.icon || "📎"}</span>
                                                <span style={{ fontSize: 13, fontWeight: 600 }}>{doc.title}</span>
                                            </div>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                {doc.viewedAt ? (
                                                    <span style={{ fontSize: 11, color: "#16A34A", fontWeight: 600 }}>✅ Visualizado</span>
                                                ) : (
                                                    <span style={{ fontSize: 11, color: "#94a3b8" }}>Não visualizado</span>
                                                )}
                                                <button style={{
                                                    background: "none", border: "none", color: "#DC2626",
                                                    fontSize: 14, cursor: "pointer",
                                                }}>🗑️</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Send new document form */}
                            <div style={{ background: "#f0fdfa", border: "1px solid #99f6e4", borderRadius: 10, padding: 16 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: "#0d9488", marginBottom: 12 }}>📤 Enviar novo documento</div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                                    <div>
                                        <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>Tipo</label>
                                        <select value={docType} onChange={e => setDocType(e.target.value as DocType)} style={inputStyle}>
                                            {DOC_TYPES.map(dt => (
                                                <option key={dt.value} value={dt.value}>{dt.icon} {dt.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>Título</label>
                                        <input type="text" placeholder='Ex: "Bilhete LATAM — FLN → CDG"' value={docTitle} onChange={e => setDocTitle(e.target.value)} style={inputStyle} />
                                    </div>
                                </div>
                                <div style={{ marginBottom: 10 }}>
                                    <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4, display: "block" }}>
                                        Arquivo do Documento (PDF ou Imagem)
                                    </label>
                                    <label style={{
                                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                                        border: docFile ? "2px solid #14b8a6" : "2px dashed #cbd5e1", 
                                        borderRadius: 8, padding: "20px", background: docFile ? "#f0fdfa" : "#f8fafc",
                                        cursor: "pointer", transition: "all 0.2s"
                                    }}>
                                        <input 
                                            type="file" 
                                            accept=".pdf,image/png,image/jpeg,image/jpg" 
                                            onChange={e => e.target.files && setDocFile(e.target.files[0])} 
                                            style={{ display: "none" }} 
                                        />
                                        <div style={{ fontSize: 24, marginBottom: 8 }}>{docFile ? "📄" : "📤"}</div>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: docFile ? "#0f766e" : "#475569", textAlign: "center" }}>
                                            {docFile ? docFile.name : "Clique para anexar ou arraste o arquivo"}
                                        </div>
                                        <div style={{ fontSize: 11, color: docFile ? "#14b8a6" : "#94a3b8", marginTop: 4 }}>
                                            {docFile ? `${(docFile.size / 1024 / 1024).toFixed(2)} MB` : "PDF, PNG, JPG (Máx. 5MB)"}
                                        </div>
                                    </label>
                                </div>
                                <div style={{ marginBottom: 12 }}>
                                    <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>Descrição (opcional)</label>
                                    <input type="text" placeholder="Detalhes extras" value={docDesc} onChange={e => setDocDesc(e.target.value)} style={inputStyle} />
                                </div>
                                <button
                                    style={{
                                        background: "#14b8a6", color: "#fff", border: "none",
                                        borderRadius: 8, padding: "10px 20px", fontSize: 13,
                                        fontWeight: 700, cursor: "pointer",
                                    }}
                                    onClick={() => {
                                        if (!docFile) {
                                            alert("Por favor, anexe um arquivo.");
                                            return;
                                        }
                                        alert(`Upload iniciado!\nDocumento "${docTitle || "Sem título"}" (${docFile.name}) preparado para envio para ${venda.clientName}.`);
                                    }}
                                >
                                    📤 Enviar documento
                                </button>
                            </div>
                        </div>
                    ))}
                </>
            )}
        </>
    );
}

const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #e2e8f0",
    fontSize: 13,
    marginTop: 4,
    outline: "none",
    background: "white",
};

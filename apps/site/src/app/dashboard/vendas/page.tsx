"use client";
import { useState, useEffect } from "react";
import { getAgencySales, updateSaleDocuments } from "@/lib/api";
import { getSession, isAgencySession } from "@/lib/auth";

export default function VendasListPage() {
    const [sales, setSales] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSale, setSelectedSale] = useState<any | null>(null);
    const [uploading, setUploading] = useState(false);
    
    // Form state
    const [voucherUrl, setVoucherUrl] = useState("");
    const [eticketUrl, setEticketUrl] = useState("");
    const [autoMessage, setAutoMessage] = useState("");

    useEffect(() => {
        fetchSales();
    }, []);

    const fetchSales = async () => {
        try {
            const raw = await getSession();
            const session = isAgencySession(raw) ? raw : null;
            if (session?.agency?.id) {
                const data = await getAgencySales(session.agency.id);
                setSales(data || []);
            }
        } catch {
            setSales([]);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (sale: any) => {
        setSelectedSale(sale);
        setVoucherUrl(sale.voucherUrl || "");
        setEticketUrl(sale.eticketUrl || "");
        setAutoMessage(sale.autoMessage || "");
    };

    const handleCloseModal = () => {
        setSelectedSale(null);
        setVoucherUrl("");
        setEticketUrl("");
        setAutoMessage("");
    };

    const handleSaveDocuments = async () => {
        if (!selectedSale) return;
        setUploading(true);
        try {
            await updateSaleDocuments(selectedSale.id, {
                voucherUrl: voucherUrl || undefined,
                eticketUrl: eticketUrl || undefined,
                autoMessage: autoMessage || undefined,
            });
            // Refresh list
            await fetchSales();
            handleCloseModal();
            alert("Documentos salvos com sucesso!");
        } catch (error) {
            alert("Erro ao salvar documentos.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div>
            <div className="roteiros-header">
                <h1 className="section-title">Minhas Vendas</h1>
            </div>

            {loading ? (
                <div className="editor-skeleton">
                    <div className="skeleton-bar" style={{ width: "100%", height: 60 }} />
                    <div className="skeleton-bar" style={{ width: "100%", height: 60, marginTop: 8 }} />
                    <div className="skeleton-bar" style={{ width: "100%", height: 60, marginTop: 8 }} />
                </div>
            ) : sales.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                    </div>
                    <h3>Nenhuma venda registrada</h3>
                    <p>Suas vendas aprovadas aparecerão aqui para você gerenciar vouchers e passagens.</p>
                </div>
            ) : (
                <div className="roteiros-table-wrap">
                    <table className="roteiros-table">
                        <thead>
                            <tr>
                                <th>Data da Compra</th>
                                <th>Viajante</th>
                                <th>Pacote</th>
                                <th>Saída</th>
                                <th>Status</th>
                                <th>Documentos</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sales.map(sale => {
                                const isReady = sale.voucherUrl || sale.eticketUrl;
                                return (
                                    <tr key={sale.id}>
                                        <td>{new Date(sale.createdAt).toLocaleDateString("pt-BR")}</td>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{sale.contactName || sale.traveler?.name || "Viajante"}</div>
                                            <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{sale.contactEmail || sale.traveler?.email}</div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 600, maxWidth: 200, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={sale.package?.title}>
                                                {sale.package?.title}
                                            </div>
                                        </td>
                                        <td>
                                            {sale.departure?.startDate
                                                ? new Date(sale.departure.startDate + 'T12:00:00').toLocaleDateString("pt-BR")
                                                : "—"}
                                        </td>
                                        <td>
                                            <span className={`status-badge active`}>
                                                Confirmada
                                            </span>
                                        </td>
                                        <td>
                                            {isReady ? (
                                                <span style={{ color: "var(--success)", fontSize: 13, fontWeight: 600 }}>✅ Anexados</span>
                                            ) : (
                                                <span style={{ color: "var(--warning)", fontSize: 13, fontWeight: 600 }}>⚠️ Pendentes</span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="action-btns">
                                                <button className="btn-sm" onClick={() => handleOpenModal(sale)}>
                                                    Anexar Docs
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal para upload de documentos */}
            {selectedSale && (
                <div style={{
                    position: "fixed",
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: "rgba(0,0,0,0.6)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 9999,
                    backdropFilter: "blur(4px)"
                }}>
                    <div style={{
                        backgroundColor: "var(--surface)",
                        padding: "24px 32px",
                        borderRadius: 16,
                        width: "100%",
                        maxWidth: 500,
                        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)"
                    }}>
                        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: "var(--text-primary)" }}>
                            Anexar Documentos da Viagem
                        </h2>
                        <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 20 }}>
                            Viagem: {selectedSale.package?.title}
                        </p>

                        <div className="editor-row" style={{ display: "block", marginBottom: 16 }}>
                            <div className="editor-field">
                                <label>Link do Voucher / Confirmação</label>
                                <input
                                    type="text"
                                    value={voucherUrl}
                                    onChange={e => setVoucherUrl(e.target.value)}
                                    placeholder="https://sua-agencia.com/voucher.pdf"
                                    className="editor-input"
                                />
                                <span className="editor-field-hint" style={{ fontSize: 12 }}>Link para o PDF do voucher do hotel/passeios.</span>
                            </div>
                        </div>

                        <div className="editor-row" style={{ display: "block", marginBottom: 16 }}>
                            <div className="editor-field">
                                <label>Link das Passagens Aéreas (e-ticket)</label>
                                <input
                                    type="text"
                                    value={eticketUrl}
                                    onChange={e => setEticketUrl(e.target.value)}
                                    placeholder="https://cia-aerea.com/eticket.pdf"
                                    className="editor-input"
                                />
                                <span className="editor-field-hint" style={{ fontSize: 12 }}>Link para o PDF das passagens aéreas.</span>
                            </div>
                        </div>

                        <div className="editor-row" style={{ display: "block", marginBottom: 24 }}>
                            <div className="editor-field">
                                <label>Mensagem para o Viajante (Opcional)</label>
                                <textarea
                                    value={autoMessage}
                                    onChange={e => setAutoMessage(e.target.value)}
                                    placeholder="Olá! Estamos ansiosos para a sua viagem. Aqui estão os detalhes..."
                                    className="editor-input"
                                    rows={3}
                                />
                            </div>
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                            <button
                                className="btn-sm"
                                onClick={handleCloseModal}
                                disabled={uploading}
                                style={{ background: "transparent", color: "var(--text-secondary)" }}
                            >
                                Cancelar
                            </button>
                            <button
                                className="btn-primary"
                                onClick={handleSaveDocuments}
                                disabled={uploading}
                                style={{ padding: "8px 20px" }}
                            >
                                {uploading ? "Salvando..." : "Salvar Documentos"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

"use client";

import React, { useState, useEffect } from "react";
import { useDollarRate, CURRENCY_RATES_KEY, CurrencyRates, DEFAULT_RATES } from "../../../hooks/useDollarRate";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333/api";

const CURRENCY_INFO: Record<string, { name: string; emoji: string }> = {
    AED: { name: "Dirham dos Emirados", emoji: "🇦🇪" },
    ARS: { name: "Peso Argentino", emoji: "🇦🇷" },
    AUD: { name: "Dólar Australiano", emoji: "🇦🇺" },
    BOB: { name: "Boliviano", emoji: "🇧🇴" },
    CAD: { name: "Dólar Canadense", emoji: "🇨🇦" },
    CHF: { name: "Franco Suíço", emoji: "🇨🇭" },
    CLP: { name: "Peso Chileno", emoji: "🇨🇱" },
    CNY: { name: "Yuan Chinês", emoji: "🇨🇳" },
    COP: { name: "Peso Colombiano", emoji: "🇨🇴" },
    CRC: { name: "Colón Costarriquenho", emoji: "🇨🇷" },
    CUP: { name: "Peso Cubano", emoji: "🇨🇺" },
    DOP: { name: "Peso Dominicano", emoji: "🇩🇴" },
    EGP: { name: "Libra Egípcia", emoji: "🇪🇬" },
    EUR: { name: "Euro", emoji: "🇪🇺" },
    GBP: { name: "Libra Esterlina", emoji: "🇬🇧" },
    GTQ: { name: "Quetzal Guatemalteco", emoji: "🇬🇹" },
    IDR: { name: "Rúpia Indonésia", emoji: "🇮🇩" },
    INR: { name: "Rúpia Indiana", emoji: "🇮🇳" },
    JPY: { name: "Iene Japonês", emoji: "🇯🇵" },
    KES: { name: "Xelim Queniano", emoji: "🇰🇪" },
    MAD: { name: "Dirham Marroquino", emoji: "🇲🇦" },
    MXN: { name: "Peso Mexicano", emoji: "🇲🇽" },
    MYR: { name: "Ringgit Malaio", emoji: "🇲🇾" },
    NOK: { name: "Coroa Norueguesa", emoji: "🇳🇴" },
    NZD: { name: "Dólar Neozelandês", emoji: "🇳🇿" },
    PEN: { name: "Sol Peruano", emoji: "🇵🇪" },
    PHP: { name: "Peso Filipino", emoji: "🇵🇭" },
    PYG: { name: "Guarani Paraguaio", emoji: "🇵🇾" },
    SGD: { name: "Dólar de Singapura", emoji: "🇸🇬" },
    THB: { name: "Baht Tailandês", emoji: "🇹🇭" },
    TRY: { name: "Lira Turca", emoji: "🇹🇷" },
    USD: { name: "Dólar Americano", emoji: "🇺🇸" },
    UYU: { name: "Peso Uruguaio", emoji: "🇺🇾" },
    VND: { name: "Dong Vietnamita", emoji: "🇻🇳" },
    ZAR: { name: "Rand Sul-africano", emoji: "🇿🇦" },
};

// Obter as chaves em ordem alfabética
const CURRENCY_KEYS = Object.keys(CURRENCY_INFO).sort();

export default function ConversaoMoedasPage() {
    const { rates } = useDollarRate();
    const [draftRates, setDraftRates] = useState<Record<string, string>>({});
    const [hasChanges, setHasChanges] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

    // Initialize drafts from global rates
    useEffect(() => {
        const init: Record<string, string> = {};
        CURRENCY_KEYS.forEach(code => {
            const val = rates[code] !== undefined ? rates[code] : DEFAULT_RATES[code];
            init[code] = val.toString().replace(".", ",");
        });
        setDraftRates(init);
        setHasChanges(false);
    }, [rates]);

    const handleInputChange = (code: string, val: string) => {
        // Allow numbers and comma
        if (/^[0-9,]*$/.test(val)) {
            setDraftRates(prev => ({ ...prev, [code]: val }));
            setHasChanges(true);
        }
    };

    const handleSaveSingle = (code: string) => {
        saveChanges([code]);
    };

    const handleSaveAll = () => {
        saveChanges(CURRENCY_KEYS);
    };

    const saveChanges = async (keysToSave: string[]) => {
        const newRates: CurrencyRates = { ...rates };
        let hasError = false;

        keysToSave.forEach(code => {
            const num = parseFloat(draftRates[code].replace(",", "."));
            if (isNaN(num) || num <= 0) {
                hasError = true;
            } else {
                newRates[code] = num;
            }
        });

        if (hasError) {
            setToast({ msg: "Valores inválidos encontrados. Verifique os campos.", type: "error" });
            return;
        }

        // 1. Salva no localStorage (uso imediato no site/dashboard)
        localStorage.setItem(CURRENCY_RATES_KEY, JSON.stringify(newRates));
        window.dispatchEvent(new CustomEvent("currencyRatesUpdated", { detail: { rates: newRates } }));

        // 2. Persiste no backend (uso pelo app mobile via GET /api/rates)
        try {
            await fetch(`${API}/rates`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rates: newRates }),
            });
        } catch (err) {
            console.warn("[conversao] Não foi possível sincronizar taxas com o backend:", err);
            // Não bloqueia — localStorage já está atualizado
        }

        setHasChanges(false);
        setToast({ msg: "Cotações atualizadas com sucesso!", type: "success" });
    };

    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 3000);
        return () => clearTimeout(t);
    }, [toast]);

    return (
        <div className="dash-container">
            <header className="dash-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                    <h1 className="dash-title">Conversão de Moedas</h1>
                    <p className="dash-subtitle">Gerencie as taxas de conversão (para BRL) utilizadas em todo o sistema.</p>
                </div>
                {hasChanges && (
                    <button 
                        onClick={handleSaveAll}
                        style={{
                            background: "#16A34A", color: "#fff", border: "none", borderRadius: "10px",
                            padding: "10px 20px", fontSize: "14px", fontWeight: "700", cursor: "pointer",
                            boxShadow: "0 2px 8px rgba(22,163,74,0.3)",
                            transition: "transform 0.1s"
                        }}
                        onMouseDown={e => e.currentTarget.style.transform = "scale(0.97)"}
                        onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
                    >
                        Salvar Todas Alterações
                    </button>
                )}
            </header>

            {toast && (
                <div style={{
                    marginBottom: 20, padding: 14, borderRadius: 10,
                    background: toast.type === "success" ? "#DCFCE7" : "#FEE2E2",
                    color: toast.type === "success" ? "#166534" : "#991B1B",
                    fontWeight: 600, fontSize: 14
                }}>
                    {toast.msg}
                </div>
            )}

            <div style={{ background: "#fff", borderRadius: "18px", border: "1px solid rgba(226,232,240,0.7)", overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "80px 100px 1fr 150px 120px", gap: 16, padding: "16px 24px", background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", fontSize: 13, fontWeight: 700, color: "#475569" }}>
                    <div>Bandeira</div>
                    <div>Sigla</div>
                    <div>Nome da Moeda</div>
                    <div>Taxa (R$)</div>
                    <div style={{ textAlign: "right" }}>Ações</div>
                </div>

                {CURRENCY_KEYS.map(code => {
                    const info = CURRENCY_INFO[code];
                    const currentGlobalVal = (rates[code] || DEFAULT_RATES[code]).toString().replace(".", ",");
                    const isEdited = draftRates[code] !== currentGlobalVal;

                    return (
                        <div key={code} style={{ 
                            display: "grid", gridTemplateColumns: "80px 100px 1fr 150px 120px", gap: 16, 
                            padding: "16px 24px", borderBottom: "1px solid #F0F2F5", alignItems: "center",
                            background: isEdited ? "rgba(245,158,11,0.03)" : "#fff",
                            transition: "background 0.3s"
                        }}>
                            <div style={{ fontSize: 24 }}>{info.emoji}</div>
                            <div style={{ fontWeight: 700, color: "#1E293B", fontSize: 16 }}>{code}</div>
                            <div style={{ color: "#64748B", fontSize: 15, fontWeight: 500 }}>{info.name}</div>
                            
                            <div style={{ position: "relative" }}>
                                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94A3B8", fontSize: 14 }}>R$</span>
                                <input 
                                    type="text" 
                                    value={draftRates[code] || ""}
                                    onChange={e => handleInputChange(code, e.target.value)}
                                    style={{
                                        width: "100%", padding: "8px 12px 8px 36px", borderRadius: 8,
                                        border: isEdited ? "1px solid #F59E0B" : "1px solid #E2E8F0",
                                        background: isEdited ? "#FFFBEB" : "#F8FAFC",
                                        outline: "none", fontSize: 15, fontWeight: 600, color: "#1E293B",
                                        transition: "all 0.2s"
                                    }}
                                />
                            </div>

                            <div style={{ textAlign: "right" }}>
                                <button 
                                    onClick={() => handleSaveSingle(code)}
                                    disabled={!isEdited}
                                    style={{
                                        background: isEdited ? "#2563EB" : "#E2E8F0",
                                        color: isEdited ? "#fff" : "#94A3B8",
                                        border: "none", borderRadius: 8, padding: "8px 16px",
                                        fontSize: 13, fontWeight: 700, cursor: isEdited ? "pointer" : "not-allowed",
                                        transition: "all 0.2s"
                                    }}
                                >
                                    Salvar
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            <div style={{ marginTop: 24, fontSize: 13, color: "#64748B", display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 16 }}>💡</span>
                <span>As taxas informadas representam o valor de <strong>1 unidade da moeda estrangeira</strong> em Reais (BRL). A moeda base de cálculo no banco de dados é o BRL.</span>
            </div>
        </div>
    );
}

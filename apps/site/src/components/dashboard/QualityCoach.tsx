"use client";

import { useRef, useEffect, useState } from "react";

interface QualityTip {
    condition: boolean;
    text: string;
    priority: number;
}

interface QualityCoachProps {
    score: number;
    tips: QualityTip[];
    maxTips?: number;
}

/* ─── Icons ─── */
const InfoIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
    </svg>
);
const CloseIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 6L6 18 M6 6l12 12" />
    </svg>
);
const TrendingUpIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
        <polyline points="17 6 23 6 23 12"></polyline>
    </svg>
);

/* ─── Particle burst on milestone ─── */
function Particles() {
    return (
        <div className="quality-particles" aria-hidden="true">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="quality-particle" />)}
        </div>
    );
}

export default function QualityCoach({ score, tips, maxTips = 3 }: QualityCoachProps) {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    const color = score >= 80 ? "#28C9BF" : score >= 50 ? "#F59E0B" : "#FF5252";
    const bgColor = score >= 80 ? "rgba(40,201,191,0.08)" : score >= 50 ? "rgba(245,158,11,0.08)" : "rgba(255,82,82,0.08)";

    const message =
        score >= 95 ? "Perfeito! 🏆 Pronto para publicar!"
            : score >= 80 ? "Excelente! Quase perfeito ✨"
                : score >= 60 ? "Bom progresso! Continue preenchendo 💪"
                    : score >= 30 ? "Bom começo! Preencha mais campos 📝"
                        : "Vamos começar! 🚀";

    const prevScore = useRef(0);
    const [isMilestone, setIsMilestone] = useState(false);
    const [showParticles, setShowParticles] = useState(false);
    const [showInfo, setShowInfo] = useState(false);

    useEffect(() => {
        // Trigger milestone glow when crossing 80%
        const crossedMilestone = prevScore.current < 80 && score >= 80;
        if (crossedMilestone) {
            setIsMilestone(true);
            setShowParticles(true);
            setTimeout(() => setIsMilestone(false), 1200);
            setTimeout(() => setShowParticles(false), 1000);
        }
        prevScore.current = score;
    }, [score]);

    const activeTips = tips
        .filter(t => t.condition)
        .sort((a, b) => a.priority - b.priority)
        .slice(0, maxTips);

    return (
        <>
            <div className={`quality-coach ${isMilestone ? "milestone" : ""}`}>
                {/* Header with Info Button */}
                <div style={{ position: "absolute", top: "12px", right: "12px", zIndex: 10 }}>
                    <button
                        onClick={() => setShowInfo(true)}
                        className="quality-info-btn"
                        style={{ color }}
                        title="Como o score é calculado?"
                    >
                        <InfoIcon />
                    </button>
                </div>

                {/* Gauge */}
                <div className={`quality-gauge ${isMilestone ? "milestone" : ""}`}
                    style={{ "--qc-color": color, "--qc-bg": bgColor } as any}>
                    <div style={{ position: "relative" }}>
                        <svg width="100" height="100" viewBox="0 0 100 100">
                            {/* Background circle */}
                            <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="6" />
                            {/* Progress circle */}
                            <circle
                                cx="50" cy="50" r={radius}
                                fill="none" stroke={color} strokeWidth="6"
                                strokeLinecap="round"
                                strokeDasharray={circumference}
                                strokeDashoffset={offset}
                                transform="rotate(-90 50 50)"
                                style={{ transition: "stroke-dashoffset 0.7s cubic-bezier(0.4,0,0.2,1), stroke 0.4s ease" }}
                            />
                        </svg>
                        {showParticles && <Particles />}
                    </div>
                    <div className="quality-gauge-value">
                        <span className="quality-gauge-number" style={{ color }} key={score}>{score}</span>
                        <span className="quality-gauge-percent">%</span>
                    </div>
                </div>

                {/* Message */}
                <div className="quality-message" key={message}>{message}</div>

                {/* Active tips - animate out when resolved */}
                {activeTips.length > 0 && (
                    <div className="quality-tips">
                        {activeTips.map((tip, i) => (
                            <div key={tip.text} className="quality-tip" style={{ animationDelay: `${i * 0.05}s` }}>
                                <span className="quality-tip-icon">💡</span>
                                <span className="quality-tip-text">{tip.text}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Completed state */}
                {activeTips.length === 0 && score > 0 && (
                    <div className="quality-tip" style={{ background: "rgba(40,201,191,0.06)", borderColor: "rgba(40,201,191,0.18)" }}>
                        <span className="quality-tip-icon">✅</span>
                        <span className="quality-tip-text" style={{ color: "#1FA89F" }}>
                            Todos os pontos preenchidos!
                        </span>
                    </div>
                )}
            </div>

            {/* ═══ INFO MODAL ═══ */}
            {showInfo && (
                <div className="qc-modal-overlay" onClick={() => setShowInfo(false)}>
                    <div className="qc-modal-content" onClick={e => e.stopPropagation()}>
                        <button className="qc-modal-close" onClick={() => setShowInfo(false)}><CloseIcon /></button>

                        <div className="qc-modal-header" style={{ borderBottomColor: bgColor }}>
                            <div className="qc-modal-icon" style={{ background: bgColor, color }}><TrendingUpIcon /></div>
                            <div>
                                <h3 className="qc-modal-title">Índice de Qualidade VAMO</h3>
                                <p className="qc-modal-subtitle">Descubra como seu score afeta suas vendas.</p>
                            </div>
                        </div>

                        <div className="qc-modal-body">
                            <p style={{ fontSize: "14px", color: "#475569", lineHeight: 1.6, marginBottom: "24px" }}>
                                O <strong>Score VAMO</strong> (0 a 100%) mede o nível de detalhamento do seu produto.
                                Pacotes e Roteiros com <strong>Score acima de 80% recebem o selo &quot;Destaque&quot;</strong>,
                                tendo prioridade nas buscas e convertendo até 2x mais vendas por passarem mais confiança.
                            </p>

                            <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#1E293B", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Calculo do Score</h4>

                            <div style={{ display: "grid", gap: "12px" }}>
                                <div className="qc-modal-rule">
                                    <div className="qc-rule-badge" style={{ background: "rgba(239,68,68,0.1)", color: "#DC2626" }}>Até 40%</div>
                                    <div className="qc-rule-text">
                                        <strong>Informações Básicas:</strong> Título, Destino, Preço, Duração e Fotos. (Obrigatório para publicar).
                                    </div>
                                </div>
                                <div className="qc-modal-rule">
                                    <div className="qc-rule-badge" style={{ background: "rgba(245,158,11,0.1)", color: "#D97706" }}>Até 75%</div>
                                    <div className="qc-rule-text">
                                        <strong>Atributos de Valor:</strong> Inclusões estruturadas, Estilos de Viagem selecionados e Categorias bem definidas.
                                    </div>
                                </div>
                                <div className="qc-modal-rule">
                                    <div className="qc-rule-badge" style={{ background: "rgba(40,201,191,0.1)", color: "#1FA89F" }}>100%</div>
                                    <div className="qc-rule-text">
                                        <strong>Riqueza de Detalhes:</strong> Textos longos na Descrição, Política de Cancelamento explicada e Destaques bem pontuados.
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginTop: "24px", padding: "16px", background: "#F8FAFC", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
                                <p style={{ margin: 0, fontSize: "13px", color: "#64748B", fontStyle: "italic", textAlign: "center" }}>
                                    Dica: Siga as lâmpadas amarelas (💡) indicadas no painel. Elas são atalhos diretos para os campos que mais geram pontuação!
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

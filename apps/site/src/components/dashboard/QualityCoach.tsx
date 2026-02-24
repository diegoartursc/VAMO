"use client";

interface QualityTip {
    condition: boolean;
    text: string;
    priority: number; // lower = more important
}

interface QualityCoachProps {
    score: number;
    tips: QualityTip[];
    maxTips?: number;
}

export default function QualityCoach({ score, tips, maxTips = 3 }: QualityCoachProps) {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    const color = score >= 80 ? "#28C9BF" : score >= 50 ? "#F59E0B" : "#FF5252";
    const bgColor = score >= 80 ? "rgba(40,201,191,0.08)" : score >= 50 ? "rgba(245,158,11,0.08)" : "rgba(255,82,82,0.08)";

    const message =
        score >= 90 ? "Pronto para impressionar! 🏆"
            : score >= 80 ? "Excelente! Quase perfeito ✨"
                : score >= 60 ? "Bom progresso! Continue preenchendo 💪"
                    : score >= 30 ? "Bom começo! Preencha mais campos 📝"
                        : "Vamos começar! 🚀";

    const activeTips = tips
        .filter(t => t.condition)
        .sort((a, b) => a.priority - b.priority)
        .slice(0, maxTips);

    return (
        <div className="quality-coach">
            {/* Gauge */}
            <div className="quality-gauge" style={{ "--qc-color": color, "--qc-bg": bgColor } as any}>
                <svg width="100" height="100" viewBox="0 0 100 100">
                    {/* Background circle */}
                    <circle
                        cx="50" cy="50" r={radius}
                        fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="6"
                    />
                    {/* Progress circle */}
                    <circle
                        cx="50" cy="50" r={radius}
                        fill="none" stroke={color} strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        transform="rotate(-90 50 50)"
                        style={{ transition: "stroke-dashoffset 0.6s ease, stroke 0.4s ease" }}
                    />
                </svg>
                <div className="quality-gauge-value">
                    <span className="quality-gauge-number" style={{ color }}>{score}</span>
                    <span className="quality-gauge-percent">%</span>
                </div>
            </div>

            {/* Message */}
            <div className="quality-message">{message}</div>

            {/* Tips */}
            {activeTips.length > 0 && (
                <div className="quality-tips">
                    {activeTips.map((tip, i) => (
                        <div key={i} className="quality-tip">
                            <span className="quality-tip-icon">💡</span>
                            <span className="quality-tip-text">{tip.text}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

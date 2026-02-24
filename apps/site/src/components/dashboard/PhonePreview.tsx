"use client";

interface PhonePreviewProps {
    title: string;
    subtitle?: string;
    destination: string;
    country: string;
    duration: number;
    price: number;
    currency?: string;
    coverImage?: string;
    highlights?: string[];
    days?: { dayNumber: number; title: string; activities: { title: string; time: string }[] }[];
    travelStyles?: string[];
    categories?: string[];
    type?: "roteiro" | "pacote";
}

export default function PhonePreview({
    title,
    subtitle,
    destination,
    country,
    duration,
    price,
    currency = "BRL",
    coverImage,
    highlights = [],
    days = [],
    travelStyles = [],
    categories = [],
    type = "roteiro",
}: PhonePreviewProps) {
    const currencySymbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : "R$";
    const formattedPrice = price > 0 ? `${currencySymbol} ${price.toLocaleString("pt-BR")}` : "—";
    const hasContent = !!(title || destination);

    return (
        <div className="phone-preview-wrapper">
            <div className="phone-preview-label">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                    <line x1="12" y1="18" x2="12.01" y2="18" />
                </svg>
                Preview no App
            </div>
            <div className="phone-frame">
                {/* Notch */}
                <div className="phone-notch" />

                {/* Screen content */}
                <div className="phone-screen">
                    {!hasContent ? (
                        <div className="phone-empty">
                            <div className="phone-empty-icon">✨</div>
                            <p>Preencha os campos ao lado para ver o preview</p>
                        </div>
                    ) : (
                        <>
                            {/* Cover */}
                            <div className="phone-cover">
                                {coverImage ? (
                                    <img src={coverImage} alt="" className="phone-cover-img" />
                                ) : (
                                    <div className="phone-cover-placeholder">
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5">
                                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                            <circle cx="8.5" cy="8.5" r="1.5" />
                                            <polyline points="21 15 16 10 5 21" />
                                        </svg>
                                    </div>
                                )}
                                <div className="phone-cover-overlay">
                                    <div className="phone-cover-badge">
                                        {type === "roteiro" ? "Roteiro Digital" : "Pacote"}
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="phone-content">
                                <h3 className="phone-title">{title || "Título do " + (type === "roteiro" ? "Roteiro" : "Pacote")}</h3>

                                {(destination || country) && (
                                    <div className="phone-location">
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                                            <circle cx="12" cy="10" r="3" />
                                        </svg>
                                        {destination}{country ? `, ${country}` : ""}
                                    </div>
                                )}

                                {subtitle && <p className="phone-subtitle">{subtitle}</p>}

                                <div className="phone-meta-row">
                                    {duration > 0 && (
                                        <span className="phone-meta-chip">
                                            📅 {duration} {duration === 1 ? "dia" : "dias"}
                                        </span>
                                    )}
                                    {price > 0 && (
                                        <span className="phone-meta-chip phone-meta-price">
                                            {formattedPrice}
                                        </span>
                                    )}
                                </div>

                                {/* Tags */}
                                {(travelStyles.length > 0 || categories.length > 0) && (
                                    <div className="phone-tags">
                                        {travelStyles.map(s => (
                                            <span key={s} className="phone-tag">{s}</span>
                                        ))}
                                        {categories.map(c => (
                                            <span key={c} className="phone-tag phone-tag-cat">{c}</span>
                                        ))}
                                    </div>
                                )}

                                {/* Highlights */}
                                {highlights.length > 0 && (
                                    <div className="phone-highlights">
                                        <div className="phone-section-label">Destaques</div>
                                        {highlights.slice(0, 3).map((h, i) => (
                                            <div key={i} className="phone-highlight-item">
                                                <span className="phone-highlight-dot" />
                                                {h}
                                            </div>
                                        ))}
                                        {highlights.length > 3 && (
                                            <div className="phone-highlight-more">+{highlights.length - 3} mais</div>
                                        )}
                                    </div>
                                )}

                                {/* Days preview */}
                                {days.length > 0 && (
                                    <div className="phone-days">
                                        <div className="phone-section-label">Itinerário</div>
                                        {days.slice(0, 3).map((day, i) => (
                                            <div key={i} className="phone-day-card">
                                                <div className="phone-day-badge">Dia {day.dayNumber || i + 1}</div>
                                                <div className="phone-day-title">{day.title || `Dia ${i + 1}`}</div>
                                                {day.activities.length > 0 && (
                                                    <div className="phone-day-activities">
                                                        {day.activities.slice(0, 2).map((act, j) => (
                                                            <span key={j} className="phone-day-act">
                                                                {act.time && <span className="phone-act-time">{act.time}</span>}
                                                                {act.title}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {days.length > 3 && (
                                            <div className="phone-days-more">+{days.length - 3} dias</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

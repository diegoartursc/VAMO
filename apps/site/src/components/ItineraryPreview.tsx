"use client";

import { useDollarRate } from "../hooks/useDollarRate";

/**
 * Componente de Prévia do Roteiro
 * Replica fielmente o layout/design da tela "DETALHES DO ROTEIRO" (mobile)
 * para ser exibida em tempo real enquanto o criador monta o roteiro.
 */

interface ItineraryPreviewProps {
  title: string;
  subtitle?: string;
  destination: string;
  country?: string;
  description?: string;
  price: number | string;
  currency: string;
  duration: number | string;
  images: string[];
  rating: number;
  reviewCount: number;
  highlights: string[];
  inclusions: string[];
  estimatedSpending?: { min: number; max: number; manualEntries?: any[] };
  featured?: boolean;
  creatorName?: string;
  locations?: { country: string; cities: string[] }[];
}

export default function ItineraryPreview({
  title,
  subtitle,
  destination,
  country,
  description,
  price,
  currency,
  duration,
  images,
  rating,
  reviewCount,
  highlights,
  inclusions,
  estimatedSpending,
  featured,
  creatorName = "Você (Criador)",
  locations = [],
}: ItineraryPreviewProps) {
  const { rates } = useDollarRate();

  const coverImage =
    images?.filter(Boolean)?.[0] ||
    "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop";
  const priceNum = typeof price === "string" ? parseFloat(price) || 0 : price;
  const durationNum = typeof duration === "string" ? parseInt(duration) || 0 : duration;
  const ratingNum = Math.min(5, Math.max(0, rating || 0));
  const curSymbol = currency === "BRL" ? "R$" : currency;

  /** Converte um valor em qualquer moeda para BRL usando as taxas do admin */
  const entryToBRL = (value: string | number, fromCurrency: string): string => {
    const n = typeof value === "number" ? value : parseFloat(value) || 0;
    if (n <= 0) return "R$ 0";
    const brl = fromCurrency === "BRL" ? n : n * (rates[fromCurrency] ?? 0);
    return brl.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
  };

  // Paleta alinhada com o theme do mobile
  const COLORS = {
    bg: "#FFFFFF",
    surface: "#FFFFFF",
    surfaceLight: "#F8FAFC",
    border: "#E5E7EB",
    borderLight: "#F1F5F9",
    primary: "#14B8A6",
    primaryDark: "#0F766E",
    deepBlue: "#1A3263",
    deepBlue2: "#162A55",
    accent: "#28C9BF",
    success: "#22C55E",
    warning: "#F59E0B",
    textPrimary: "#0F172A",
    textSecondary: "#64748B",
    textTertiary: "#94A3B8",
    verified: "#3B82F6",
  };

  return (
    <div
      style={{
        background: COLORS.surfaceLight,
        border: "1px solid var(--border, #E5E7EB)",
        borderRadius: 16,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        fontSize: 13,
        lineHeight: 1.5,
        color: COLORS.textPrimary,
      }}
    >
      {/* ── Label de Prévia ── */}
      <div
        style={{
          padding: "10px 14px",
          borderBottom: "1px solid var(--border, #E5E7EB)",
          background: "var(--surface-secondary, #F8FAFC)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: "var(--text-secondary, #64748B)",
            letterSpacing: 0.8,
          }}
        >
          📱 PRÉVIA · DETALHES DO ROTEIRO
        </div>
        <div
          style={{
            fontSize: 9,
            color: "var(--text-tertiary, #94A3B8)",
            fontWeight: 600,
          }}
        >
          AO VIVO
        </div>
      </div>

      {/* ── Scrollable Mobile Frame ── */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          background: COLORS.bg,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Hero Image */}
        <div
          style={{
            width: "100%",
            height: 200,
            background: `url('${coverImage}') center/cover`,
            position: "relative",
          }}
        >
          {/* Gradiente inferior (transição para o content sheet) */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 60,
              background:
                "linear-gradient(to bottom, transparent, rgba(255,255,255,0.15), rgba(255,255,255,0.6))",
              pointerEvents: "none",
            }}
          />
          {/* Nav header (blur) */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 12px",
              background: "rgba(0,0,0,0.25)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              borderBottom: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                background: "rgba(0,0,0,0.3)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              ←
            </div>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                background: "rgba(0,0,0,0.3)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
              }}
            >
              ⇪
            </div>
          </div>
          {featured && (
            <div
              style={{
                position: "absolute",
                top: 48,
                right: 12,
                background: COLORS.warning,
                color: "#000",
                padding: "4px 8px",
                borderRadius: 6,
                fontSize: 10,
                fontWeight: 700,
              }}
            >
              ⭐ DESTAQUE
            </div>
          )}
        </div>

        {/* Content Sheet (rounded top, overlapping hero) */}
        <div
          style={{
            background: COLORS.bg,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            marginTop: -20,
            padding: "18px 16px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {/* Creator Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 12px",
              borderRadius: 14,
              background: COLORS.surfaceLight,
              border: `1px solid ${COLORS.borderLight}`,
              alignSelf: "flex-start",
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                background: COLORS.primary + "22",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
              }}
            >
              👤
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>
                  {creatorName}
                </span>
                <span
                  style={{
                    fontSize: 9,
                    background: COLORS.verified,
                    color: "#fff",
                    padding: "1px 4px",
                    borderRadius: 4,
                    fontWeight: 700,
                  }}
                >
                  ✓
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 11,
                  color: COLORS.textSecondary,
                  marginTop: 2,
                }}
              >
                <span style={{ color: COLORS.warning }}>★</span>
                <span>{ratingNum.toFixed(1)} · novo criador</span>
              </div>
            </div>
          </div>

          {/* Title */}
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 700,
                color: COLORS.textPrimary,
                lineHeight: 1.25,
              }}
            >
              {title || "Título do roteiro"}
            </h2>
            {subtitle && (
              <p
                style={{
                  margin: "6px 0 0",
                  fontSize: 13,
                  color: COLORS.textSecondary,
                  lineHeight: 1.35,
                }}
              >
                {subtitle}
              </p>
            )}
            {/* Location */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "4px 12px",
                marginTop: 8,
                fontSize: 13,
                color: COLORS.textSecondary,
              }}
            >
                {(() => {
                  const parts: string[] = [];
                  const seen = new Set<string>();

                  const addPart = (part: string) => {
                    if (!seen.has(part)) {
                      seen.add(part);
                      parts.push(part);
                    }
                  };

                  const hasValidLocations = locations && locations.some(l => l.country || l.cities.length > 0);

                  if (hasValidLocations) {
                    locations.forEach(loc => {
                      if (!loc.country && loc.cities.length === 0) return;
                      const citiesStr = loc.cities.filter(Boolean).join(", ");
                      if (loc.country && citiesStr) addPart(`${loc.country} (${citiesStr})`);
                      else if (loc.country) addPart(loc.country);
                      else if (citiesStr) addPart(citiesStr);
                    });
                  } else {
                    // Legacy fallback
                    if (country && destination) addPart(`${country} (${destination})`);
                    else if (country) addPart(country);
                    else if (destination) addPart(destination || "Destino");
                  }

                  return parts.map((part, index) => (
                    <span key={index} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ color: COLORS.primary, fontSize: 14 }}>📍</span>
                      {part}
                    </span>
                  ));
                })()}
            </div>
          </div>

          {/* Stats Card */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: COLORS.surfaceLight,
              border: `1px solid ${COLORS.borderLight}`,
              borderRadius: 12,
              padding: "10px 14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 5, flex: 1, justifyContent: "center" }}>
              <span style={{ color: COLORS.warning }}>★</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{ratingNum.toFixed(1)}</span>
              <span style={{ fontSize: 11, color: COLORS.textSecondary }}>({reviewCount || 0})</span>
            </div>
            <div style={{ width: 1, height: 22, background: COLORS.border }} />
            <div style={{ display: "flex", alignItems: "center", gap: 5, flex: 1, justifyContent: "center" }}>
              <span style={{ color: COLORS.primary }}>📅</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>
                {durationNum} dia{durationNum !== 1 ? "s" : ""}
              </span>
            </div>
            <div style={{ width: 1, height: 22, background: COLORS.border }} />
            <div style={{ display: "flex", alignItems: "center", gap: 5, flex: 1, justifyContent: "center" }}>
              <span style={{ color: COLORS.primary }}>✓</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Digital</span>
            </div>
          </div>

          {/* Price Section (gradient) */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 16px",
              borderRadius: 14,
              background: `linear-gradient(135deg, ${COLORS.deepBlue}, ${COLORS.deepBlue2})`,
              color: "#fff",
              boxShadow: "0 2px 8px rgba(26,50,99,0.25)",
            }}
          >
            <div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.65)", marginBottom: 3 }}>
                Roteiro completo
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.accent }}>{curSymbol}</span>
                <span style={{ fontSize: 22, fontWeight: 700 }}>
                  {priceNum.toFixed(2).replace(".", ",")}
                </span>
              </div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>
                • Acesso imediato após compra
              </div>
            </div>
            <button
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                background: COLORS.primary,
                color: "#fff",
                border: "none",
                borderRadius: 22,
                padding: "9px 14px",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(20,184,166,0.35)",
              }}
            >
              Comprar Agora ›
            </button>
          </div>

          {/* Aviso: Produto Digital */}
          <div
            style={{
              display: "flex",
              gap: 8,
              padding: "10px 12px",
              background: COLORS.primary + "12",
              border: `1px solid ${COLORS.primary}33`,
              borderRadius: 10,
            }}
          >
            <span style={{ color: COLORS.primary, fontSize: 14, flexShrink: 0 }}>ⓘ</span>
            <div style={{ fontSize: 11, color: COLORS.textSecondary, lineHeight: 1.4 }}>
              Este é um <strong style={{ color: COLORS.textPrimary }}>produto digital</strong>. Ao
              comprar, você terá acesso a informações, dicas e planejamento de viagem.
            </div>
          </div>

          {/* Estimativa de Gasto */}
          {estimatedSpending && (estimatedSpending.min > 0 || estimatedSpending.max > 0) && (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 0",
                  borderBottom: `1px solid ${COLORS.borderLight}`,
                  marginBottom: 10,
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary }}>
                  Estimativa de Gasto
                </div>
                <span style={{ color: COLORS.textTertiary, fontSize: 14 }}>⌄</span>
              </div>
              <div
                style={{
                  padding: "14px 16px",
                  borderRadius: 12,
                  background: `linear-gradient(135deg, ${COLORS.deepBlue}, #1E4D8C)`,
                  color: "#fff",
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    color: "rgba(255,255,255,0.65)",
                    fontWeight: 500,
                    marginBottom: 4,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Estimativa total · {durationNum} dia{durationNum !== 1 ? "s" : ""}
                </div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>
                  {curSymbol} {estimatedSpending.max.toLocaleString("pt-BR")}
                </div>
                {estimatedSpending.manualEntries && estimatedSpending.manualEntries.length > 0 && (
                   <div style={{ marginTop: 12, borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                      {estimatedSpending.manualEntries.map((e: any, idx: number) => {
                          const labels: Record<string, string> = { 
                              voo: "✈️ Passagem Aérea", hospedagem: "🏨 Hospedagem", 
                              passeios: "🎫 Passeios & Atrações", transporte: "🚇 Transporte Local", 
                              restaurantes: "🍽️ Alimentação", extras: "➕ Outros Gastos" 
                          };
                          const val = parseFloat(e.priceValue) || 0;
                          if (val <= 0) return null;
                          return (
                              <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: "rgba(255,255,255,0.85)" }}>
                                  <span>{labels[e.moduleKey] || e.moduleKey}</span>
                                  <span style={{ fontWeight: 600 }}>{entryToBRL(e.priceValue, e.priceCurrency)}</span>
                              </div>
                          );
                      })}
                   </div>
                )}
              </div>
            </div>
          )}

          {/* Sobre o Roteiro */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 0",
                borderBottom: `1px solid ${COLORS.borderLight}`,
                marginBottom: 10,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary }}>
                Sobre o Roteiro
              </div>
              <span style={{ color: COLORS.textTertiary, fontSize: 14 }}>⌃</span>
            </div>
            <p
              style={{
                margin: 0,
                fontSize: 12,
                color: COLORS.textPrimary,
                lineHeight: 1.6,
              }}
            >
              {description ||
                "A descrição do roteiro aparecerá aqui. Escreva sobre o que torna sua viagem única..."}
            </p>
          </div>

          {/* Destaques */}
          {highlights && highlights.length > 0 && (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 0",
                  borderBottom: `1px solid ${COLORS.borderLight}`,
                  marginBottom: 10,
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary }}>
                  Destaques
                </div>
                <span style={{ color: COLORS.textTertiary, fontSize: 14 }}>⌃</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {highlights.slice(0, 4).map((h, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 9,
                        background: COLORS.success,
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 10,
                        fontWeight: 700,
                        flexShrink: 0,
                        marginTop: 1,
                      }}
                    >
                      ✓
                    </div>
                    <span style={{ fontSize: 12, color: COLORS.textPrimary, lineHeight: 1.4 }}>
                      {h || `Destaque ${i + 1}`}
                    </span>
                  </div>
                ))}
                {highlights.length > 4 && (
                  <div
                    style={{
                      fontSize: 11,
                      color: COLORS.textTertiary,
                      fontStyle: "italic",
                      marginLeft: 26,
                    }}
                  >
                    +{highlights.length - 4} mais...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* O que você vai receber */}
          {inclusions && inclusions.length > 0 && (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 0",
                  borderBottom: `1px solid ${COLORS.borderLight}`,
                  marginBottom: 10,
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary }}>
                  O que você vai receber
                </div>
                <span style={{ color: COLORS.textTertiary, fontSize: 14 }}>⌃</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {inclusions.map((inc, i) => {
                  // Extrai o emoji inicial do texto (ex: "📅 Roteiro..." → emoji="📅", texto="Roteiro...")
                  const emojiMatch = inc.match(/^([\p{Emoji_Presentation}\p{Extended_Pictographic}]+)\s*/u);
                  const emoji = emojiMatch ? emojiMatch[1] : "✓";
                  const label = emojiMatch ? inc.slice(emojiMatch[0].length) : inc;
                  const bgColors = [
                    "#14B8A618", "#F59E0B18", "#3B82F618", "#22C55E18",
                    "#8B5CF618", "#EF444418", "#06B6D418", "#F9731618",
                  ];
                  return (
                    <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <div
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 8,
                          background: bgColors[i % bgColors.length],
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 14,
                          flexShrink: 0,
                        }}
                      >
                        {emoji}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: COLORS.textPrimary,
                          lineHeight: 1.3,
                          flex: 1,
                          minWidth: 0,
                        }}
                      >
                        {label || inc}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Como você vai receber */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 0",
                borderBottom: `1px solid ${COLORS.borderLight}`,
                marginBottom: 10,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary }}>
                Como você vai receber
              </div>
              <span style={{ color: COLORS.textTertiary, fontSize: 14 }}>⌄</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 0, position: "relative" }}>
              {[
                { icon: "🛒", title: "1. Compre o roteiro", desc: "Pagamento seguro e acesso imediato" },
                { icon: "📱", title: "2. Acesse pelo app", desc: "Aparece em \"Minhas Viagens\"" },
                { icon: "♾️", title: "3. Acesso vitalício", desc: "Consulte quando e quantas vezes quiser" },
              ].map((step, i, arr) => (
                <div key={i} style={{ display: "flex", gap: 10, position: "relative", paddingBottom: i < arr.length - 1 ? 10 : 0 }}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      background: COLORS.primary + "18",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 14,
                      flexShrink: 0,
                      zIndex: 1,
                    }}
                  >
                    {step.icon}
                  </div>
                  <div style={{ flex: 1, paddingTop: 2 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.textPrimary }}>
                      {step.title}
                    </div>
                    <div style={{ fontSize: 11, color: COLORS.textSecondary, marginTop: 2, lineHeight: 1.4 }}>
                      {step.desc}
                    </div>
                  </div>
                  {i < arr.length - 1 && (
                    <div
                      style={{
                        position: "absolute",
                        left: 16,
                        top: 34,
                        bottom: -2,
                        width: 2,
                        background: COLORS.borderLight,
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Trust box */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              padding: "12px",
              borderRadius: 12,
              background: COLORS.verified + "0D",
              border: `1px solid ${COLORS.verified}33`,
            }}
          >
            <span style={{ color: COLORS.verified, fontSize: 18, flexShrink: 0 }}>🛡️</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.textPrimary }}>
                Criador Verificado
              </div>
              <div style={{ fontSize: 11, color: COLORS.textSecondary, marginTop: 2, lineHeight: 1.4 }}>
                {creatorName} é um viajante verificado pelo VAMO
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div
        style={{
          padding: "8px 14px",
          borderTop: "1px solid var(--border, #E5E7EB)",
          background: "var(--surface-secondary, #F8FAFC)",
          fontSize: 10,
          color: "var(--text-secondary, #64748B)",
          textAlign: "center",
        }}
      >
        💡 Prévia em tempo real — tudo que você preencher aparece aqui
      </div>
    </div>
  );
}

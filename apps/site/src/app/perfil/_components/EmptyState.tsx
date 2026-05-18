import Link from "next/link";

interface Props {
    title: string;
    subtitle: string;
    description?: string;
    emoji: string;
    ctaHref: string;
    ctaLabel: string;
}

export default function EmptyState({ title, subtitle, description, emoji, ctaHref, ctaLabel }: Props) {
    return (
        <div>
            <h1 style={{ fontSize: 32, fontWeight: 700, margin: "16px 0 8px", letterSpacing: "-0.02em" }}>
                {title}
            </h1>
            <p style={{ color: "#6b7280", margin: "0 0 32px", fontSize: 16 }}>{subtitle}</p>

            <div
                style={{
                    border: "1px dashed rgba(0,0,0,0.12)",
                    borderRadius: 20,
                    padding: "56px 32px",
                    textAlign: "center",
                    background: "#fff",
                }}
            >
                <div style={{ fontSize: 56, marginBottom: 16 }}>{emoji}</div>
                <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 8 }}>
                    Nada por aqui ainda
                </div>
                {description && (
                    <p style={{ color: "#6b7280", maxWidth: 480, margin: "0 auto 24px", fontSize: 14, lineHeight: 1.5 }}>
                        {description}
                    </p>
                )}
                <Link
                    href={ctaHref}
                    style={{
                        display: "inline-block",
                        padding: "12px 24px",
                        borderRadius: 999,
                        background: "#FF385C",
                        color: "#fff",
                        textDecoration: "none",
                        fontWeight: 700,
                        fontSize: 14,
                        boxShadow: "0 6px 16px rgba(255,56,92,0.3)",
                    }}
                >
                    {ctaLabel}
                </Link>
            </div>
        </div>
    );
}

"use client";

import { useState } from "react";

interface SectionInfoProps {
    tips: string[];
}

export default function SectionInfo({ tips }: SectionInfoProps) {
    const [open, setOpen] = useState(false);

    if (!tips.length) return null;

    return (
        <div className="section-info-wrapper">
            <button
                type="button"
                className={`section-info-btn ${open ? "open" : ""}`}
                onClick={() => setOpen(!open)}
                title="Dicas para esta etapa"
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
            </button>
            {open && (
                <div className="section-info-panel">
                    <div className="section-info-header">
                        <span>💡 Dicas para esta etapa</span>
                        <button type="button" className="section-info-close" onClick={() => setOpen(false)}>✕</button>
                    </div>
                    <ul className="section-info-list">
                        {tips.map((tip, i) => (
                            <li key={i}>{tip}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

"use client";

import React from "react";
import { Icon } from "../shared";

export default function AdminHistoricoPage() {
    return (
        <div className="dash-container">
            <div style={{
                background: "#fff", borderRadius: "20px", padding: "60px 32px",
                border: "1px solid rgba(226,232,240,0.7)", textAlign: "center",
            }}>
                <div style={{ marginBottom: "16px" }}>{Icon.clock({ size: 48, color: "#98989D" })}</div>
                <div style={{ fontSize: "20px", fontWeight: "800", color: "#1A3263", marginBottom: "8px" }}>Histórico de Ações</div>
                <div style={{ fontSize: "14px", color: "#98989D", maxWidth: "400px", margin: "0 auto", lineHeight: 1.6 }}>
                    Log completo de todas as aprovações, rejeições, criações e alterações realizadas no painel admin.
                </div>
                <div style={{
                    marginTop: "20px", display: "inline-block", padding: "8px 20px",
                    borderRadius: "10px", background: "rgba(40,201,191,0.08)",
                    color: "#1FA89F", fontSize: "13px", fontWeight: "700",
                }}>Em breve</div>
            </div>
        </div>
    );
}

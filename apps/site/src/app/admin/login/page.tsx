"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// MVP: auto-login para desenvolvimento — autenticação real será implementada na Fase 3
export default function AdminLoginPage() {
    const router = useRouter();

    useEffect(() => {
        // Define credenciais mock e redireciona direto ao painel admin
        localStorage.setItem("adminToken", "mock-admin-token");
        localStorage.setItem("adminUser", JSON.stringify({
            name: "Dev Admin",
            email: "admin@vamo.com",
            role: "SUPER_ADMIN",
        }));
        router.replace("/admin");
    }, [router]);

    return (
        <div style={{
            minHeight: "100vh",
            background: "linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'Inter', sans-serif",
        }}>
            <div style={{ textAlign: "center" }}>
                <div style={{
                    width: "44px", height: "44px", borderRadius: "14px",
                    background: "linear-gradient(135deg, #28C9BF, #1FA89F)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "20px", margin: "0 auto 16px",
                    boxShadow: "0 4px 20px rgba(40,201,191,0.35)",
                }}>🛡️</div>
                <p style={{ color: "#64748B", fontSize: "14px" }}>Entrando no painel…</p>
            </div>
        </div>
    );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import GlobalHeader from "../../components/GlobalHeader";
import { getCurrentUser, type CurrentUser } from "../../lib/auth";

export default function PerfilLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [user, setUser] = useState<CurrentUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const u = getCurrentUser();
        if (!u) {
            router.replace("/login");
            return;
        }
        setUser(u);
        setLoading(false);
    }, [router]);

    if (loading || !user) {
        return (
            <div style={{ minHeight: "100vh", background: "#fafafa" }}>
                <GlobalHeader variant="solid" />
                <div style={{ padding: 48, textAlign: "center", color: "#9ca3af" }}>Carregando…</div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: "100vh", background: "#fafafa" }}>
            <GlobalHeader variant="solid" />
            <main style={{ maxWidth: 1120, margin: "0 auto", padding: "32px 24px 64px" }}>
                {children}
            </main>
        </div>
    );
}

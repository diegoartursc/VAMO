import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // As rotas legacy (/agencia/*, /dashboard/*, /criador/*) que liam
    // session.agency / session.employee agora narrowam a sessão com o type
    // guard isAgencySession() (ver lib/auth.ts), então o build estrito passa.
    // Mantemos os erros de tipo ATIVOS no build de propósito — não reintroduzir
    // ignoreBuildErrors sem antes corrigir os tipos.
    // (Next 16 removeu a chave `eslint` do config; ESLint roda via `npm run lint`.)

    async redirects() {
        return [
            // /criador/* é legado (duplicado de /dashboard). Tudo migra pro dashboard.
            { source: "/criador", destination: "/dashboard", permanent: false },
            { source: "/criador/roteiros", destination: "/dashboard/roteiros", permanent: false },
            { source: "/criador/vendas", destination: "/dashboard/vendas", permanent: false },
            { source: "/criador/comentarios", destination: "/dashboard/comentarios", permanent: false },
            { source: "/criador/configuracoes", destination: "/dashboard/configuracoes", permanent: false },
            { source: "/criador/financeiro", destination: "/dashboard", permanent: false },
            { source: "/criador/inbox", destination: "/dashboard", permanent: false },
            { source: "/criador/roteiro/:id*", destination: "/dashboard/roteiro/:id*", permanent: false },
        ];
    },
};

export default nextConfig;

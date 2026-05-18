import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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

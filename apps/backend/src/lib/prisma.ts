import { PrismaClient } from '@prisma/client';

declare global {
    var prisma: PrismaClient | undefined;
}

// O Session pooler do Supabase aceita só 15 clientes. Sem limite, o Prisma abre
// (nº de CPUs × 2 + 1) conexões e, no Render, segurava as 15 ociosas — travando
// deploys (instância nova + antiga), migrations e scripts locais. 5 por
// instância deixa folga para o deploy sobreposto (5 + 5 + 1 do migrate).
// Um `connection_limit` já presente na DATABASE_URL tem prioridade.
function datasourceUrl(): string | undefined {
    const url = process.env.DATABASE_URL;
    if (!url || /[?&]connection_limit=/.test(url)) return url;
    const limit = Number(process.env.DB_POOL_SIZE) > 0 ? Number(process.env.DB_POOL_SIZE) : 5;
    return `${url}${url.includes('?') ? '&' : '?'}connection_limit=${limit}`;
}

const prisma = global.prisma || new PrismaClient({
    datasourceUrl: datasourceUrl(),
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
    global.prisma = prisma;
}

export default prisma;

import crypto from 'crypto';

const sha256 = (v: string) => crypto.createHash('sha256').update(v).digest('hex');

// SHA-256 de segredos que já apareceram em arquivos versionados (não guardamos o valor).
const KNOWN_PUBLIC_SECRETS = new Set([
    '64c48f528b8c058f2a37047caf9c5e750cad3a6c478fed01850deb7e4620b63e',
]);

/**
 * Validação de configuração antes de abrir a porta e iniciar jobs (SEC-06).
 * Falha fechado: em combinação insegura o processo não sobe.
 */
export function collectConfigProblems(env: NodeJS.ProcessEnv = process.env): { fatal: string[]; warnings: string[] } {
    const fatal: string[] = [];
    const warnings: string[] = [];
    const isProd = env.NODE_ENV === 'production';

    const secret = env.JWT_SECRET || '';
    if (secret.length < 32) fatal.push('JWT_SECRET precisa ter pelo menos 32 caracteres.');
    if (KNOWN_PUBLIC_SECRETS.has(sha256(secret))) {
        // Valor que já esteve publicado no repositório (.env.example): qualquer
        // pessoa conseguiria forjar tokens. Em produção, recusa subir.
        // Fatal em QUALQUER ambiente: o backend local usa o banco de produção.
        fatal.push('JWT_SECRET é um valor publicado no repositório. Gere um novo (openssl rand -base64 48).');
    }

    if (env.ALLOW_DEMO_PURCHASES === 'true' && env.NODE_ENV !== 'test') {
        fatal.push('ALLOW_DEMO_PURCHASES=true só é permitido em testes automatizados (NODE_ENV=test).');
    }

    if (isProd) {
        if (!env.DATABASE_URL) fatal.push('DATABASE_URL ausente.');
        if (env.STRIPE_SECRET_KEY && !env.STRIPE_WEBHOOK_SECRET) {
            fatal.push('STRIPE_SECRET_KEY definido sem STRIPE_WEBHOOK_SECRET: pagamentos não seriam confirmados.');
        }
        if (!env.ALLOWED_ORIGINS) warnings.push('ALLOWED_ORIGINS vazio: só origens localhost serão aceitas pelo CORS.');
    } else if (env.DATABASE_URL && !/@(localhost|127\.0\.0\.1)(:|\/)/.test(env.DATABASE_URL)) {
        // Hoje o ambiente local usa o banco de produção (CLAUDE.md). Os atalhos
        // perigosos de dev foram removidos; o aviso deixa a situação explícita.
        warnings.push('Processo fora de produção conectado a um banco remoto: tudo o que fizer aqui grava nos dados reais.');
    }
    if (env.STRIPE_SECRET_KEY?.startsWith('sk_live_') && !isProd) {
        fatal.push('Chave Stripe LIVE em ambiente que não é produção.');
    }
    return { fatal, warnings };
}

export function assertSafeConfig(env: NodeJS.ProcessEnv = process.env): void {
    const { fatal, warnings } = collectConfigProblems(env);
    for (const w of warnings) console.warn(`[config] AVISO: ${w}`);
    if (fatal.length) {
        for (const f of fatal) console.error(`[config] ERRO: ${f}`);
        throw new Error('Configuração insegura: o servidor não vai subir (ver mensagens [config] acima).');
    }
}

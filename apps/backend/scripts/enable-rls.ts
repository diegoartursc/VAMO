/**
 * Liga Row Level Security em TODAS as tabelas do schema `public`.
 *
 * Contexto: o Supabase alertou "rls_disabled_in_public" — 40 tabelas expostas
 * ao PostgREST sem nenhuma barreira. Hoje o risco é contido porque a anon key
 * não está publicada em lugar nenhum (o app fala com o Express no Render, não
 * com o PostgREST), mas sem RLS não existe SEGUNDA camada: se a chave vazar,
 * o banco inteiro fica legível e gravável por qualquer um.
 *
 * O que este script faz: `ENABLE ROW LEVEL SECURITY`, sem criar policy alguma.
 * Sem policy, o PostgREST (roles anon/authenticated) recebe negativa em tudo.
 *
 * Por que NÃO quebra a aplicação: o backend conecta como `postgres`, que tem
 * `rolbypassrls = true` — RLS não se aplica a ele. O Storage vive no schema
 * `storage`, que não é tocado aqui.
 *
 * Idempotente (rodar de novo não muda nada) e reversível:
 *   npx tsx scripts/enable-rls.ts            → aplica
 *   npx tsx scripts/enable-rls.ts --dry-run  → só mostra o que faria
 *   npx tsx scripts/enable-rls.ts --rollback → desliga de novo
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const dryRun = process.argv.includes('--dry-run');
const rollback = process.argv.includes('--rollback');

async function main() {
    const conn: any[] = await prisma.$queryRawUnsafe(
        `select current_user as usuario,
                (select rolbypassrls from pg_roles where rolname = current_user) as bypassa_rls`,
    );
    console.log(`Conectado como "${conn[0].usuario}" (bypassa RLS: ${conn[0].bypassa_rls})`);
    if (!conn[0].bypassa_rls && !rollback && !dryRun) {
        throw new Error(
            'Este usuário NÃO ignora RLS — ligar agora bloquearia o backend. Abortado.',
        );
    }

    const tabelas: { tabela: string; rls: boolean }[] = await prisma.$queryRawUnsafe(`
        select c.relname as tabela, c.relrowsecurity as rls
        from pg_class c join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relkind = 'r'
        order by c.relname`);

    const alvo = rollback ? tabelas.filter(t => t.rls) : tabelas.filter(t => !t.rls);
    const verbo = rollback ? 'DISABLE' : 'ENABLE';

    console.log(`\n${tabelas.length} tabelas no schema public · ${alvo.length} a alterar (${verbo})`);
    if (alvo.length === 0) {
        console.log('Nada a fazer — já está no estado desejado.');
        return;
    }

    for (const { tabela } of alvo) {
        const sql = `alter table public."${tabela}" ${verbo} row level security`;
        if (dryRun) {
            console.log(`  [dry-run] ${sql}`);
        } else {
            await prisma.$executeRawUnsafe(sql);
            console.log(`  ✓ ${tabela}`);
        }
    }

    if (dryRun) return;

    const depois: any[] = await prisma.$queryRawUnsafe(`
        select count(*) filter (where c.relrowsecurity) as com_rls,
               count(*) filter (where not c.relrowsecurity) as sem_rls
        from pg_class c join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relkind = 'r'`);
    console.log(`\nEstado final: ${depois[0].com_rls} com RLS · ${depois[0].sem_rls} sem RLS`);
}

main()
    .catch(e => { console.error('ERRO:', e.message); process.exit(1); })
    .finally(() => prisma.$disconnect());

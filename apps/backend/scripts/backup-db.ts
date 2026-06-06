/**
 * backup-db.ts — Backup completo do banco (todas as tabelas) para JSON.
 *
 * Lê TODAS as models do schema Prisma via DMMF e exporta cada uma para um
 * único arquivo JSON. NÃO modifica nada (apenas leitura).
 *
 * Uso:
 *   npm run db:backup                 # usa o DATABASE_URL do .env atual
 *   BACKUP_DIR=/caminho npm run db:backup
 *
 * Destino padrão: ../VAMO-backups-archive/db-backups/ (política do BACKUPS.md).
 */
import { PrismaClient, Prisma } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

function lcFirst(s: string) {
    return s.charAt(0).toLowerCase() + s.slice(1);
}

async function main() {
    const takenAt = new Date().toISOString();
    const dump: Record<string, unknown> = { takenAt };
    const counts: Record<string, number> = {};

    for (const model of Prisma.dmmf.datamodel.models) {
        const key = lcFirst(model.name);
        const delegate = (prisma as Record<string, any>)[key];
        if (delegate && typeof delegate.findMany === 'function') {
            const rows = await delegate.findMany();
            dump[model.name] = rows;
            counts[model.name] = rows.length;
        }
    }

    const outDir =
        process.env.BACKUP_DIR ||
        path.resolve(process.cwd(), '..', '..', '..', 'VAMO-backups-archive', 'db-backups');
    fs.mkdirSync(outDir, { recursive: true });

    const stamp = takenAt.replace(/[:.]/g, '-');
    const outFile = path.join(outDir, `db-backup-${stamp}.json`);
    // BigInt-safe serialization
    fs.writeFileSync(
        outFile,
        JSON.stringify(dump, (_k, v) => (typeof v === 'bigint' ? v.toString() : v), 2),
        { mode: 0o600 },
    );

    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    console.log(`✓ Backup salvo em: ${outFile}`);
    console.log(`  Models: ${Object.keys(counts).length} | Registros totais: ${total}`);
    console.log('  Contagem por tabela (não-vazias):');
    for (const [k, n] of Object.entries(counts).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1])) {
        console.log(`    ${k}: ${n}`);
    }
}

main()
    .catch((e) => {
        console.error('Falha no backup:', e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());

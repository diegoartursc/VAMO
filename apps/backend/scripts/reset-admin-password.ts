/**
 * Redefine a senha de um admin (painel admin do site).
 * Uso: npx tsx scripts/reset-admin-password.ts <email> [nova-senha]
 * Sem nova-senha, gera uma senha forte aleatória e mostra UMA vez no terminal.
 * O hash antigo é salvo em scripts/backups/ (fora do Git) para permitir desfazer.
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const [, , rawEmail, providedPassword] = process.argv;
if (!rawEmail) {
    console.error('Uso: npx tsx scripts/reset-admin-password.ts <email> [nova-senha]');
    process.exit(1);
}

const ALPHABET = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const group = () => Array.from(crypto.randomBytes(4), (b) => ALPHABET[b % ALPHABET.length]).join('');
const password = providedPassword || `Vamo-${group()}-${group()}-${group()}`;
if (password.length < 10) {
    console.error('A senha do admin precisa ter pelo menos 10 caracteres.');
    process.exit(1);
}

const prisma = new PrismaClient();
(async () => {
    const email = rawEmail.trim().toLowerCase();
    const admin = await prisma.admin.findUnique({ where: { email }, select: { id: true, email: true, passwordHash: true } });
    if (!admin) {
        console.error(`Nenhum admin com e-mail ${email}.`);
        process.exit(1);
    }

    const backupDir = path.join(__dirname, 'backups');
    fs.mkdirSync(backupDir, { recursive: true });
    const backupFile = path.join(backupDir, `admin-password-${admin.id}-${Date.now()}.json`);
    fs.writeFileSync(backupFile, JSON.stringify({ id: admin.id, email: admin.email, passwordHash: admin.passwordHash }, null, 2), { mode: 0o600 });

    await prisma.admin.update({ where: { id: admin.id }, data: { passwordHash: await bcrypt.hash(password, 10), active: true } });
    const fresh = await prisma.admin.findUnique({ where: { id: admin.id }, select: { passwordHash: true } });
    const ok = !!fresh && (await bcrypt.compare(password, fresh.passwordHash));

    console.log(`Senha do admin ${admin.email} redefinida. Verificação: ${ok ? 'OK' : 'FALHOU'}`);
    if (!providedPassword) console.log(`Nova senha (anote agora, não será mostrada de novo): ${password}`);
    console.log(`Hash antigo salvo em ${path.relative(process.cwd(), backupFile)}`);
    await prisma.$disconnect();
    process.exit(ok ? 0 : 1);
})();

/**
 * Redefine a senha de um traveler (qualquer usuário do app).
 * Uso: npx tsx scripts/reset-password.ts <email> <nova-senha>
 * Senhas são bcrypt (irreversíveis) — este é o único jeito de recuperar acesso.
 * O hash antigo é salvo em scripts/backups/ para permitir desfazer.
 */
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { hashPassword, comparePassword } from '../src/lib/auth';

const [, , rawEmail, newPassword] = process.argv;

if (!rawEmail || !newPassword) {
  console.error('Uso: npx tsx scripts/reset-password.ts <email> <nova-senha>');
  process.exit(1);
}
if (newPassword.length < 6) {
  console.error('A senha precisa ter pelo menos 6 caracteres (mesma regra do cadastro).');
  process.exit(1);
}

const email = rawEmail.trim().toLowerCase();
const prisma = new PrismaClient();

(async () => {
  const traveler = await prisma.traveler.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
    select: { id: true, email: true, name: true, passwordHash: true },
  });
  if (!traveler) {
    console.error(`Nenhum traveler com e-mail ${email}.`);
    process.exit(1);
  }

  const backupDir = path.join(__dirname, 'backups');
  fs.mkdirSync(backupDir, { recursive: true });
  const backupFile = path.join(backupDir, `password-${traveler.id}-${Date.now()}.json`);
  fs.writeFileSync(backupFile, JSON.stringify({ id: traveler.id, email: traveler.email, passwordHash: traveler.passwordHash }, null, 2));

  const passwordHash = await hashPassword(newPassword);
  await prisma.traveler.update({ where: { id: traveler.id }, data: { passwordHash } });

  const fresh = await prisma.traveler.findUnique({ where: { id: traveler.id }, select: { passwordHash: true } });
  const ok = !!fresh?.passwordHash && (await comparePassword(newPassword, fresh.passwordHash));

  console.log(`Senha de ${traveler.name} <${traveler.email}> redefinida. Verificação: ${ok ? 'OK' : 'FALHOU'}`);
  console.log(`Hash antigo salvo em ${path.relative(process.cwd(), backupFile)}`);
  await prisma.$disconnect();
  process.exit(ok ? 0 : 1);
})();

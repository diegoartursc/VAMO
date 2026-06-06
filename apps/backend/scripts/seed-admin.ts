/**
 * Cria a conta admin padrão (SUPER_ADMIN).
 * Idempotente — se já existir, atualiza a senha.
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const ADMIN_EMAIL = 'admin@vamo.com';
const ADMIN_PASSWORD = 'vamo2026';
const ADMIN_NAME = 'Admin VAMO';

const p = new PrismaClient();

(async () => {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const admin = await p.admin.upsert({
    where: { email: ADMIN_EMAIL },
    create: { email: ADMIN_EMAIL, name: ADMIN_NAME, passwordHash, role: 'SUPER_ADMIN', active: true },
    update: { passwordHash, role: 'SUPER_ADMIN', active: true },
  });
  console.log('Admin pronto:');
  console.log({ id: admin.id, email: admin.email, name: admin.name, role: admin.role, active: admin.active });
  await p.$disconnect();
})();

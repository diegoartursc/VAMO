import path from 'node:path';
import { pathToFileURL } from 'node:url';
async function main() {
  const fromRepo = async (p: string) => import(pathToFileURL(path.resolve(p)).href);
  await fromRepo('src/test/setup.ts');
  const helpersImport: any = await fromRepo('src/test/helpers.ts');
  const helpers = helpersImport.default ?? helpersImport;
  const bcryptImport: any = await import(pathToFileURL(path.resolve('../../node_modules/bcryptjs/index.js')).href);
  const bcrypt = bcryptImport.default ?? bcryptImport;
  const crypto = await import('node:crypto');
  const db = helpers.createFakePrisma();
  (globalThis as any).prisma = db;
  const oldPassword = 'audit-old-password-synthetic';
  const newPassword = 'audit-new-password-synthetic';
  const travelers = helpers.memoryTable([{id: 'race-user', email: 'race@example.invalid', name: 'Audit', passwordHash: await bcrypt.hash(oldPassword, 4), creator: null, personalData: null, passwordChangedAt: null}]);
  const sessions = helpers.memoryTable([]);
  const rawReset = 'audit-reset-token-only-synthetic-20261106';
  const resets = helpers.memoryTable([{id: 'reset-row', travelerId: 'race-user', tokenHash: crypto.createHash('sha256').update(rawReset).digest('hex'), expiresAt: new Date(Date.now() + 3_600_000)}]);
  Object.assign(db.traveler, travelers);
  Object.assign(db.travelerSession, sessions);
  Object.assign(db.passwordResetToken, resets);
  let delayNextCreate = false;
  let createReached: () => void = () => {};
  const reached = new Promise<void>(resolve => {createReached = resolve});
  let releaseCreate: () => void = () => {};
  const release = new Promise<void>(resolve => {releaseCreate = resolve});
  db.travelerSession.create = async (args: any) => {
    if (delayNextCreate) {delayNextCreate = false; createReached(); await release;}
    return sessions.create(args);
  };
  const appImport: any = await fromRepo('src/app.ts');
  const app = appImport.default?.default ?? appImport.default;
  const {base, close} = await helpers.startApp(app);
  try {
    const initial = await helpers.call(base, 'POST', '/api/auth/traveler/login', {body: {email: 'race@example.invalid', password: oldPassword}});
    delayNextCreate = true;
    const pendingLogin = helpers.call(base, 'POST', '/api/auth/traveler/login', {body: {email: 'race@example.invalid', password: oldPassword}});
    await reached; // Password already validated; the session INSERT has not executed.
    const reset = await helpers.call(base, 'POST', '/api/auth/traveler/reset-password', {body: {token: rawReset, password: newPassword}});
    releaseCreate();
    const lateLogin = await pendingLogin;
    const oldSession = await helpers.call(base, 'GET', '/api/auth/traveler/me', {token: initial.json.accessToken});
    const racedSession = await helpers.call(base, 'GET', '/api/auth/traveler/me', {token: lateLogin.json.accessToken});
    const rejectedOldPassword = await helpers.call(base, 'POST', '/api/auth/traveler/login', {body: {email: 'race@example.invalid', password: oldPassword}});
    console.log(JSON.stringify({proof: 'stale-login-after-password-reset', resetStatus: reset.status, initialAccessStatus: oldSession.status, pendingLoginUsingOldPasswordStatus: lateLogin.status, pendingLoginAccessAfterResetStatus: racedSession.status, freshLoginUsingOldPasswordStatus: rejectedOldPassword.status, stubbedDatabaseOnly: true, externalServices: false}));
  } finally {releaseCreate(); await close();}
}
main().catch(err => {console.error(err.message); process.exitCode=1});

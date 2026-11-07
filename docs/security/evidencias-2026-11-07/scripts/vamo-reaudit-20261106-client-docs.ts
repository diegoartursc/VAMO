import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

async function main() {
  const root = process.cwd();
  await import(root + '/apps/backend/src/test/setup.ts');
  const { createFakePrisma, memoryTable, startApp, call } = await import(root + '/apps/backend/src/test/helpers.ts');
  const db = createFakePrisma();
  (globalThis as any).prisma = db;
  const { hashPassword } = await import(root + '/apps/backend/src/lib/auth.ts');
  const travelers = memoryTable<any>([{ id: 'audit_client', email: 'client@example.invalid', name: 'Synthetic', passwordHash: await hashPassword('synthetic-client-password'), creator: null }]);
  Object.assign(db.traveler, travelers);
  Object.assign(db.travelerSession, memoryTable<any>([]));
  db.travelerFile.findFirst = async () => null;
  db.privateDocument.findMany = async () => [];
  db.privateDocument.aggregate = async () => ({ _count: { _all: 0 }, _sum: { sizeBytes: 0 } });
  db.privateDocument.create = async () => { throw new Error('synthetic-create-failed'); };
  const app = (await import(root + '/apps/backend/src/app.ts')).default;
  const { base, close } = await startApp(app);
  try {
    const login = await call(base, 'POST', '/api/auth/traveler/login', { body: { email: 'client@example.invalid', password: 'synthetic-client-password' } });
    assert.equal(login.status, 200);
    const token = login.json.accessToken;
    const storage = new Map<string, string>([['vamo_access_token', token], ['vamo_refresh_token', login.json.refreshToken], ['vamo_traveler_session', JSON.stringify({ travelerId: 'audit_client' })]]);
    (globalThis as any).window = { location: { replace: () => {} } };
    (globalThis as any).localStorage = { getItem: (k: string) => storage.get(k) ?? null, setItem: (k: string, v: string) => storage.set(k, v), removeItem: (k: string) => storage.delete(k) };
    const safeFetch = globalThis.fetch;
    let uploadPath = '';
    globalThis.fetch = (async (url: any, init?: any) => {
      const path = new URL(String(url)).pathname;
      assert.equal(path, '/api/uploads', 'site upload must be redirected to our isolated app only');
      uploadPath = path;
      return safeFetch(base + path, init);
    }) as typeof fetch;
    const siteApi = await import(root + '/apps/site/src/lib/api.ts');
    let publicUrl = '';
    try {
      publicUrl = await siteApi.uploadFile(new File(['%PDF-1.4 SYNTHETIC-PROOF-ONLY'], 'synthetic-proof.pdf', { type: 'application/pdf' }));
    } finally { globalThis.fetch = safeFetch; }
    const anonymousFile = await call(base, 'GET', new URL(publicUrl).pathname);
    assert.equal(anonymousFile.status, 200);
    assert.ok(anonymousFile.text.includes('SYNTHETIC-PROOF-ONLY'));
    const { canonicalizeDocRefs } = await import(root + '/apps/backend/src/lib/privateDocs.ts');
    const canonical: any = await canonicalizeDocRefs({ travelProofUrl: publicUrl, spendingProfile: { entries: [{ receiptUrl: publicUrl }] } }, 'audit_client');
    assert.equal(canonical.travelProofUrl, '');
    assert.equal(canonical.spendingProfile.entries[0].receiptUrl, publicUrl);
    console.log(JSON.stringify({ check: 'site-proof-upload-public', siteUploadEndpoint: uploadPath, anonymousDownloadStatus: anonymousFile.status, saveRemovesTravelProof: true, receiptUrlStillAccepted: true, data: 'synthetic-only', storage: 'temporary-local' }));

    const siteAuth = await import(root + '/apps/site/src/lib/auth.ts');
    let logoutNetworkCalls = 0;
    globalThis.fetch = (async () => { logoutNetworkCalls++; throw new Error('logout network should be observed only'); }) as typeof fetch;
    try { siteAuth.logout(); } finally { globalThis.fetch = safeFetch; }
    const afterLogout = await call(base, 'GET', '/api/auth/traveler/me', { token });
    assert.equal(logoutNetworkCalls, 0);
    assert.equal(storage.has('vamo_access_token'), false);
    assert.equal(afterLogout.status, 200);
    console.log(JSON.stringify({ check: 'site-logout-server-revocation', browserTokenCleared: true, logoutNetworkCalls, oldBearerAfterSiteLogout: afterLogout.status, data: 'synthetic-only' }));

    for (const failure of ['aggregate', 'create']) {
      db.privateDocument.aggregate = async () => { if (failure === 'aggregate') throw new Error('synthetic-aggregate-failed'); return { _count: { _all: 0 }, _sum: { sizeBytes: 0 } }; };
      const unhandled: string[] = [];
      const observer = (e: any) => unhandled.push(e?.message || String(e));
      process.on('unhandledRejection', observer);
      let status: number | null = null;
      let aborted = false;
      try {
        const body = new FormData(); body.append('file', new Blob(['%PDF-1.4 synthetic'], { type: 'application/pdf' }), 'audit.pdf');
        const response = await fetch(base + '/api/private-docs', { method: 'POST', headers: { authorization: `Bearer ${token}` }, body, signal: AbortSignal.timeout(500) });
        status = response.status;
      } catch (e: any) { if (e?.name === 'TimeoutError' || e?.name === 'AbortError') aborted = true; else throw e; }
      finally { process.removeListener('unhandledRejection', observer); }
      assert.equal(unhandled.length, 1);
      assert.equal(aborted, true);
      const alive = await call(base, 'GET', '/health');
      assert.equal(alive.status, 200);
      console.log(JSON.stringify({ check: 'private-doc-db-error', failure, unhandledRejections: unhandled.length, responseStatus: status, requestTimedOut: aborted, healthAfter: alive.status, data: 'synthetic-only' }));
    }
    const { collectConfigProblems } = await import(root + '/apps/backend/src/lib/config.ts');
    const config = collectConfigProblems({ NODE_ENV: 'test', JWT_SECRET: 'synthetic-only-configuration-key-0123456789', DATABASE_URL: 'postgresql://synthetic:synthetic@remote.example.invalid/audit', ALLOW_DEMO_PURCHASES: 'true' });
    assert.equal(config.fatal.length, 0);
    console.log(JSON.stringify({ check: 'demo-test-remote-config', fatalErrors: config.fatal.length, warnings: config.warnings.length, remoteConnectionAttempted: false }));

    // A failed filesystem removal must not make an old private document public.
    let privateRecordExists = true;
    const legacyUrl = base + '/uploads/itineraries/synthetic-legacy.pdf';
    const legacyPath = process.env.LOCAL_UPLOADS_DIR! + '/itineraries/synthetic-legacy.pdf';
    await fs.mkdir(process.env.LOCAL_UPLOADS_DIR! + '/itineraries', { recursive: true });
    await fs.writeFile(legacyPath, '%PDF-1.4 SYNTHETIC-LEGACY-ONLY');
    db.itinerarySale.findFirst = async () => ({ id: 'audit_sale' });
    db.travelerFile.findFirst = async () => privateRecordExists ? { id: 'audit_file', url: legacyUrl } : null;
    db.travelerFile.deleteMany = async () => { privateRecordExists = false; return { count: 1 }; };
    const beforeDelete = await call(base, 'GET', new URL(legacyUrl).pathname);
    assert.equal(beforeDelete.status, 404);
    const originalRm = fs.rm;
    (fs as any).rm = async (target: any, ...args: any[]) => {
      if (String(target) === legacyPath) throw Object.assign(new Error('synthetic removal denied'), { code: 'EACCES' });
      return (originalRm as any)(target, ...args);
    };
    let deleted: any;
    try { deleted = await call(base, 'DELETE', '/api/trip-center/audit_itinerary/files/audit_file', { token }); }
    finally { (fs as any).rm = originalRm; }
    const afterDelete = await call(base, 'GET', new URL(legacyUrl).pathname);
    assert.equal(deleted.status, 200);
    assert.equal(afterDelete.status, 200);
    console.log(JSON.stringify({ check: 'legacy-delete-removal-failure', anonymousBeforeDelete: beforeDelete.status, deleteStatus: deleted.status, simulatedRemovalError: 'EACCES', anonymousAfterDelete: afterDelete.status, data: 'synthetic-only' }));
  } finally {
    await close();
    await fs.rm(process.env.LOCAL_UPLOADS_DIR!, { recursive: true, force: true });
  }
}
main().catch(e => { console.error(e?.message || e); process.exitCode = 1; });

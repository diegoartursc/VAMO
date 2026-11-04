// Playwright da auditoria: só contra o build web local apontado para o
// backend ISOLADO. AUDIT_WEB_DIR = pasta gerada por
//   EXPO_PUBLIC_API_URL=http://localhost:4333/api npx expo export --platform web --output-dir <pasta>
import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const WEB = process.env.AUDIT_WEB || 'http://localhost:8091';
export default defineConfig({
    testDir: '.',
    testMatch: /.*\.spec\.mjs/,
    timeout: 30_000,
    workers: 4,
    reporter: [['list']],
    use: { baseURL: WEB, headless: true, viewport: { width: 1280, height: 800 } },
    webServer: process.env.AUDIT_WEB_DIR ? {
        command: `node serve-web.mjs "${process.env.AUDIT_WEB_DIR}" 8091`,
        url: WEB, reuseExistingServer: true, cwd: fileURLToPath(new URL('.', import.meta.url)),
    } : undefined,
});

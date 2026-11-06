import { Request, Response } from 'express';
import { Router } from '../lib/router';
import { adminAuthMiddleware } from '../middleware/admin-auth';
import { BASE_CURRENCY } from '@vamo/shared/itinerary';
import { getCurrentRates, refreshCurrencyRates, saveRates, SUPPORTED_CURRENCIES } from '../lib/currencyRates';

const router = Router();

/**
 * Taxas de câmbio (1 unidade da moeda = X moeda-base). Guardadas no banco e
 * atualizadas 1x por dia por `src/lib/currencyRates.ts`; ver lá a fonte e as regras.
 */

// GET /api/rates — público. Mesmo formato de sempre: { "CHF": 1.12, ... }
router.get('/', async (_req: Request, res: Response) => {
    res.json((await getCurrentRates()).rates);
});

// GET /api/rates/info — público. Taxas + de onde vieram e quando.
router.get('/info', async (_req: Request, res: Response) => {
    res.json(await getCurrentRates());
});

// PUT /api/rates — correção manual do admin (vale até a próxima atualização automática).
router.put('/', adminAuthMiddleware, async (req: Request, res: Response) => {
    const { rates } = req.body || {};
    if (!rates || typeof rates !== 'object' || Array.isArray(rates)) {
        res.status(400).json({ error: 'Body must contain a "rates" object with currency → value pairs.' });
        return;
    }
    const clean: Record<string, number> = {};
    for (const [code, val] of Object.entries(rates)) {
        if (!SUPPORTED_CURRENCIES.includes(code)) continue; // ignora moeda desconhecida
        if (typeof val !== 'number' || !Number.isFinite(val) || val <= 0) {
            res.status(400).json({ error: `Invalid rate for ${code}: ${val}` });
            return;
        }
        clean[code] = val;
    }
    try {
        const current = await getCurrentRates();
        const saved = await saveRates({ ...current.rates, ...clean, [BASE_CURRENCY]: 1 }, 'admin');
        res.json({ success: true, ...saved });
    } catch (err: any) {
        console.error('[rates] erro ao salvar taxas:', err?.message || err);
        res.status(500).json({ error: 'Failed to save rates.' });
    }
});

// POST /api/rates/refresh — admin pede a cotação do dia agora.
router.post('/refresh', adminAuthMiddleware, async (_req: Request, res: Response) => {
    const result = await refreshCurrencyRates();
    if (!result.ok) {
        res.status(502).json({ error: 'Could not fetch today\'s rates right now. The previous rates are still in use.' });
        return;
    }
    res.json({ success: true, ...(await getCurrentRates()), updated: result.updated });
});

export default router;

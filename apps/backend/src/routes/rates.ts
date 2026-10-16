import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { adminAuthMiddleware } from '../middleware/admin-auth';
import { BASE_CURRENCY, DEFAULT_RATES_TO_BASE } from '@vamo/shared/itinerary';

const router = Router();

const DATA_DIR = path.join(process.cwd(), 'data');
const RATES_FILE = path.join(DATA_DIR, 'currency-rates.json');

/**
 * Taxas padrão com base na moeda-base do mercado (1 unidade da moeda = X moeda-base).
 * Fonte única: DEFAULT_RATES_TO_BASE em packages/shared/itinerary/market.ts.
 * O arquivo salvo pelo admin só vale se declarar a mesma base (formato
 * { base, rates }); arquivos antigos (sem base, relativos a AUD/BRL) são ignorados.
 */
const DEFAULT_RATES: Record<string, number> = DEFAULT_RATES_TO_BASE;

function loadRates(): Record<string, number> {
    try {
        if (fs.existsSync(RATES_FILE)) {
            const raw = fs.readFileSync(RATES_FILE, 'utf-8');
            const saved = JSON.parse(raw);
            // Só aceita o arquivo se foi salvo na base atual do mercado.
            if (saved && saved.base === BASE_CURRENCY && saved.rates && typeof saved.rates === 'object') {
                // Mescla defaults com as taxas salvas (salvas têm prioridade)
                return { ...DEFAULT_RATES, ...saved.rates, [BASE_CURRENCY]: 1 };
            }
        }
    } catch (err) {
        console.error('[rates] Erro ao carregar rates.json:', err);
    }
    return DEFAULT_RATES;
}

// GET /api/rates — público, retorna taxas atuais
router.get('/', (req: Request, res: Response) => {
    res.json(loadRates());
});

// PUT /api/rates — salva taxas atualizadas pelo admin
router.put('/', adminAuthMiddleware, (req: Request, res: Response) => {
    const { rates } = req.body;

    if (!rates || typeof rates !== 'object' || Array.isArray(rates)) {
        res.status(400).json({ error: 'Body deve conter um objeto "rates" com os pares moeda → valor.' });
        return;
    }

    // Valida que todos os valores são números positivos
    for (const [code, val] of Object.entries(rates)) {
        if (typeof val !== 'number' || val <= 0) {
            res.status(400).json({ error: `Taxa inválida para ${code}: ${val}` });
            return;
        }
    }

    try {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        fs.writeFileSync(RATES_FILE, JSON.stringify({ base: BASE_CURRENCY, rates }, null, 2), 'utf-8');
        res.json({ success: true, rates });
    } catch (err: any) {
        console.error('[rates] Erro ao salvar rates.json:', err);
        res.status(500).json({ error: 'Falha ao salvar taxas.', detail: err.message });
    }
});

export default router;

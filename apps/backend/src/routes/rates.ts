import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();

const DATA_DIR = path.join(process.cwd(), 'data');
const RATES_FILE = path.join(DATA_DIR, 'currency-rates.json');

/**
 * Taxas padrão com base AUD (1 unidade da moeda = X AUD). AUD = 1.0.
 * Mercado australiano: a moeda-base do produto é o dólar australiano.
 * NOTA: taxas administráveis salvas em data/currency-rates.json (via PUT
 * /api/rates) eram relativas ao BRL e precisam ser re-semeadas para a base AUD.
 */
const DEFAULT_RATES: Record<string, number> = {
    AED: 0.41212,
    ARS: 0.0015152,
    AUD: 1.0,
    BOB: 0.21818,
    BRL: 0.30303,
    CAD: 1.1212,
    CHF: 1.697,
    CLP: 0.0015152,
    CNY: 0.21212,
    COP: 0.000303,
    CRC: 0.0030303,
    CUP: 0.06364,
    DOP: 0.02576,
    EGP: 0.0303,
    EUR: 1.6364,
    GBP: 1.9091,
    GTQ: 0.19697,
    IDR: 0.0000939,
    INR: 0.01818,
    JPY: 0.01,
    KES: 0.01152,
    MAD: 0.15152,
    MXN: 0.09091,
    MYR: 0.33939,
    NOK: 0.14242,
    NZD: 0.90909,
    PEN: 0.40606,
    PHP: 0.02697,
    PYG: 0.0002061,
    SGD: 1.1333,
    THB: 0.04545,
    TRY: 0.04545,
    USD: 1.5152,
    UYU: 0.03939,
    VND: 0.0000606,
    ZAR: 0.08182,
};

function loadRates(): Record<string, number> {
    try {
        if (fs.existsSync(RATES_FILE)) {
            const raw = fs.readFileSync(RATES_FILE, 'utf-8');
            const saved = JSON.parse(raw);
            // Mescla defaults com as taxas salvas (salvas têm prioridade)
            return { ...DEFAULT_RATES, ...saved };
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
router.put('/', (req: Request, res: Response) => {
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
        fs.writeFileSync(RATES_FILE, JSON.stringify(rates, null, 2), 'utf-8');
        res.json({ success: true, rates });
    } catch (err: any) {
        console.error('[rates] Erro ao salvar rates.json:', err);
        res.status(500).json({ error: 'Falha ao salvar taxas.', detail: err.message });
    }
});

export default router;

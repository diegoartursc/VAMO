import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();

const DATA_DIR = path.join(process.cwd(), 'data');
const RATES_FILE = path.join(DATA_DIR, 'currency-rates.json');

/** Taxas padrão — espelham DEFAULT_RATES do hook useDollarRate.ts no site */
const DEFAULT_RATES: Record<string, number> = {
    AED: 1.36,
    ARS: 0.005,
    AUD: 3.3,
    BOB: 0.72,
    BRL: 1.0,
    CAD: 3.7,
    CHF: 5.6,
    CLP: 0.005,
    CNY: 0.7,
    COP: 0.001,
    CRC: 0.01,
    CUP: 0.21,
    DOP: 0.085,
    EGP: 0.1,
    EUR: 5.4,
    GBP: 6.3,
    GTQ: 0.65,
    IDR: 0.00031,
    INR: 0.06,
    JPY: 0.033,
    KES: 0.038,
    MAD: 0.5,
    MXN: 0.3,
    MYR: 1.12,
    NOK: 0.47,
    NZD: 3.0,
    PEN: 1.34,
    PHP: 0.089,
    PYG: 0.00068,
    SGD: 3.74,
    THB: 0.15,
    TRY: 0.15,
    USD: 5.0,
    UYU: 0.13,
    VND: 0.0002,
    ZAR: 0.27,
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

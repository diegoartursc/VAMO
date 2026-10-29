/**
 * Limites de upload no servidor (SEC-08): tamanho do pedido inteiro, número
 * de arquivos e uploads simultâneos por usuário e no processo. Recusa ANTES de
 * ler o corpo (pelo Content-Length), para nenhum pedido encher a memória.
 * Valores configuráveis por env (testes usam limites pequenos).
 */
import type { Request, Response, NextFunction } from 'express';

const MB = 1024 * 1024;
const num = (key: string, fallback: number) => {
    const v = Number(process.env[key]);
    return Number.isFinite(v) && v > 0 ? v : fallback;
};

export function uploadLimits() {
    return {
        maxFileBytes: num('UPLOAD_MAX_FILE_BYTES', 100 * MB),
        maxRequestBytes: num('UPLOAD_MAX_REQUEST_BYTES', 210 * MB),
        maxFiles: num('UPLOAD_MAX_FILES', 10),
        perUser: num('UPLOAD_MAX_CONCURRENT_PER_USER', 2),
        global: num('UPLOAD_MAX_CONCURRENT', 12),
        // Cota por conta (R-U1): pedidos e bytes por hora.
        perHour: num('UPLOAD_MAX_PER_HOUR', 60),
        bytesPerHour: num('UPLOAD_MAX_BYTES_PER_HOUR', 1024 * MB),
        // Conexão lenta não segura a vaga para sempre (slowloris).
        timeoutMs: num('UPLOAD_TIMEOUT_MS', 5 * 60 * 1000),
    };
}

const activeByUser = new Map<string, number>();
const hourly = new Map<string, { resetAt: number; count: number; bytes: number }>();
let activeGlobal = 0;

/** `maxRequestBytes`: teto do pedido nesta rota (o menor entre ele e o global). */
export function uploadGuard(opts: { maxRequestBytes?: number } = {}) {
    return (req: Request, res: Response, next: NextFunction) => {
        const limits = uploadLimits();
        const maxRequest = Math.min(opts.maxRequestBytes ?? limits.maxRequestBytes, limits.maxRequestBytes);
        const length = Number(req.headers['content-length']);
        if (req.headers['transfer-encoding'] || !Number.isFinite(length) || length <= 0) {
            res.set('Connection', 'close').status(411).json({ error: 'Upload size is required.' });
            return;
        }
        if (length > maxRequest) {
            res.set('Connection', 'close').status(413).json({ error: 'Upload is too large.' });
            return;
        }
        const key = (req as any).traveler?.travelerId || req.ip || 'anon';
        const now = Date.now();
        let usage = hourly.get(key);
        if (!usage || usage.resetAt <= now) {
            usage = { resetAt: now + 60 * 60 * 1000, count: 0, bytes: 0 };
            hourly.set(key, usage);
        }
        if (usage.count >= limits.perHour || usage.bytes + length > limits.bytesPerHour) {
            res.set('Retry-After', String(Math.ceil((usage.resetAt - now) / 1000))).status(429)
                .json({ error: 'Upload limit reached for now. Please try again later.' });
            return;
        }
        if ((activeByUser.get(key) || 0) >= limits.perUser || activeGlobal >= limits.global) {
            res.set('Retry-After', '5').status(429).json({ error: 'Too many uploads at the same time. Please wait a moment.' });
            return;
        }
        usage.count++;
        usage.bytes += length;
        activeByUser.set(key, (activeByUser.get(key) || 0) + 1);
        activeGlobal++;
        let released = false;
        const release = () => {
            if (released) return;
            released = true;
            activeGlobal = Math.max(0, activeGlobal - 1);
            const left = (activeByUser.get(key) || 1) - 1;
            if (left <= 0) activeByUser.delete(key); else activeByUser.set(key, left);
        };
        res.on('finish', release);
        res.on('close', release);
        req.on('aborted', release);
        const timer = setTimeout(() => {
            if (!res.headersSent) res.set('Connection', 'close').status(408).json({ error: 'Upload took too long.' });
            req.destroy();
            release();
        }, limits.timeoutMs);
        timer.unref?.();
        res.on('close', () => clearTimeout(timer));
        next();
    };
}

/**
 * Rota pública para resolver links rastreáveis de compartilhamento.
 *
 *   GET /api/share/:code/resolve
 *
 * Incrementa o contador de cliques do ItineraryShare correspondente e
 * redireciona (302) o navegador para a página pública do roteiro. Nunca
 * exige login, nunca expõe dados privados — só conta o clique e redireciona.
 *
 * Limitação técnica conhecida: contamos "clique no link", não "conversão na
 * página de destino". A página em si pode emitir um beacon separado se
 * precisarmos diferenciar bots de humanos no futuro.
 */

import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

/** URL base do app público (Expo Web em Vercel). Sobrescrever em produção. */
const PUBLIC_WEB_URL = (process.env.PUBLIC_WEB_URL || 'https://vamo-ten.vercel.app').replace(/\/+$/, '');

/** Sanitiza um valor para uso em query string. */
const safeCode = (raw: unknown): string | null => {
    if (typeof raw !== 'string') return null;
    const trimmed = raw.trim();
    if (!trimmed || trimmed.length > 64) return null;
    return /^[A-Za-z0-9_-]+$/.test(trimmed) ? trimmed : null;
};

router.get('/:code/resolve', async (req: Request, res: Response) => {
    const code = safeCode(req.params.code);
    const fallback = PUBLIC_WEB_URL;

    if (!code) {
        res.redirect(302, fallback);
        return;
    }

    try {
        const share = await (prisma as any).itineraryShare.findUnique({
            where: { shareCode: code },
            select: { id: true, itineraryId: true },
        });

        if (!share) {
            res.redirect(302, fallback);
            return;
        }

        // Incremento e timestamp do último clique. Não bloqueamos o redirect
        // se o UPDATE falhar — clique perdido é melhor que página quebrada.
        (prisma as any).itineraryShare.update({
            where: { id: share.id },
            data: { clickedCount: { increment: 1 }, lastClickAt: new Date() },
        }).catch((err: unknown) => {
            console.error('[shares.resolve] failed to increment click', err);
        });

        const target = `${PUBLIC_WEB_URL}/itinerary/${share.itineraryId}` +
            `?ref=share&shareId=${encodeURIComponent(code)}` +
            `&utm_source=vamo_app&utm_medium=share&utm_campaign=itinerary_share`;
        res.redirect(302, target);
    } catch (error) {
        console.error('[shares.resolve] error', error);
        res.redirect(302, fallback);
    }
});

export default router;

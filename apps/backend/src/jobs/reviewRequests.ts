/**
 * Convites para avaliar o roteiro comprado.
 *
 *  - 1 convite, 3 dias depois da compra;
 *  - 1 lembrete, 7 dias depois do convite;
 *  - só para quem ainda não avaliou, nunca para o criador do próprio roteiro;
 *  - só vendas dos últimos 60 dias (nunca dispara e-mail em massa sobre compras antigas);
 *  - cada etapa é gravada ANTES de enviar (updateMany condicional), então reinício do
 *    servidor ou duas instâncias nunca mandam o mesmo e-mail duas vezes;
 *  - se o envio falhar (mailer devolve false), a marca é desfeita para tentar na próxima varredura.
 */
import prisma from '../lib/prisma';
import { sendReviewRequestEmail } from '../lib/mailer';

const DAY = 24 * 60 * 60 * 1000;
export const INVITE_AFTER_PURCHASE_MS = 3 * DAY;
export const REMINDER_AFTER_INVITE_MS = 7 * DAY;
export const MAX_SALE_AGE_MS = 60 * DAY;
const BATCH = 50;

export type ReviewRequestStage = 'invite' | 'reminder';

/** Decide, sem tocar no banco, qual e-mail (se algum) uma venda deve receber agora. */
export function nextReviewRequestStage(
    sale: { createdAt: Date; reviewRequestSentAt: Date | null; reviewReminderSentAt: Date | null },
    hasReview: boolean,
    now: Date = new Date(),
): ReviewRequestStage | null {
    if (hasReview) return null;
    const age = now.getTime() - sale.createdAt.getTime();
    if (age > MAX_SALE_AGE_MS) return null;
    if (!sale.reviewRequestSentAt) return age >= INVITE_AFTER_PURCHASE_MS ? 'invite' : null;
    if (sale.reviewReminderSentAt) return null;
    return now.getTime() - sale.reviewRequestSentAt.getTime() >= REMINDER_AFTER_INVITE_MS ? 'reminder' : null;
}

export async function runReviewRequestSweep(now: Date = new Date()): Promise<{ invites: number; reminders: number }> {
    const sales = await prisma.itinerarySale.findMany({
        where: {
            createdAt: { gte: new Date(now.getTime() - MAX_SALE_AGE_MS), lte: new Date(now.getTime() - INVITE_AFTER_PURCHASE_MS) },
            reviewReminderSentAt: null,
        },
        orderBy: { createdAt: 'asc' },
        take: BATCH,
        select: {
            id: true, createdAt: true, reviewRequestSentAt: true, reviewReminderSentAt: true,
            itineraryId: true, travelerId: true,
            traveler: { select: { email: true, name: true } },
            itinerary: { select: { title: true, creator: { select: { travelerId: true } } } },
        },
    });

    let invites = 0;
    let reminders = 0;
    for (const sale of sales) {
        if (sale.itinerary.creator?.travelerId === sale.travelerId) continue;
        const review = await prisma.review.findFirst({
            where: { travelerId: sale.travelerId, itineraryId: sale.itineraryId },
            select: { id: true },
        });
        const stage = nextReviewRequestStage(sale, !!review, now);
        if (!stage) continue;

        // Grava primeiro (condicional); só quem ganhou a gravação envia.
        const claimed = await prisma.itinerarySale.updateMany({
            where: stage === 'invite'
                ? { id: sale.id, reviewRequestSentAt: null }
                : { id: sale.id, reviewReminderSentAt: null, reviewRequestSentAt: { not: null } },
            data: stage === 'invite' ? { reviewRequestSentAt: now } : { reviewReminderSentAt: now },
        });
        if (claimed.count !== 1) continue;

        const sent = await sendReviewRequestEmail({
            to: sale.traveler.email,
            name: sale.traveler.name,
            itineraryId: sale.itineraryId,
            itineraryTitle: sale.itinerary.title,
            reminder: stage === 'reminder',
        });
        if (!sent) {
            // Envio falhou: devolve a marca para a próxima varredura tentar de novo.
            await prisma.itinerarySale.updateMany({
                where: { id: sale.id },
                data: stage === 'invite' ? { reviewRequestSentAt: null } : { reviewReminderSentAt: null },
            });
            continue;
        }
        if (stage === 'invite') invites++; else reminders++;
    }
    return { invites, reminders };
}

/** Roda a varredura a cada 6 horas (e uma vez logo após subir). Desligável com REVIEW_REQUESTS_ENABLED=false. */
export function startReviewRequestScheduler(): void {
    if (process.env.NODE_ENV !== 'production' || process.env.REVIEW_REQUESTS_ENABLED === 'false') {
        console.log('[review-requests] scheduler off (only runs in production)');
        return;
    }
    const tick = () => runReviewRequestSweep()
        .then((r) => { if (r.invites || r.reminders) console.log(`[review-requests] sent ${r.invites} invite(s), ${r.reminders} reminder(s)`); })
        .catch((e) => console.error('[review-requests] sweep failed:', e?.message || e));
    setTimeout(tick, 2 * 60 * 1000);
    setInterval(tick, 6 * 60 * 60 * 1000);
    console.log('[review-requests] scheduler on (every 6h)');
}

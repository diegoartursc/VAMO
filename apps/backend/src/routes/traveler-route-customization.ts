/**
 * Rotas de "Roteiro Editável Pós-Compra" — camada de overlay privada
 * que cada viajante mantém sobre o roteiro que comprou.
 *
 * Conceito:
 *  - O viajante NUNCA edita o roteiro original do criador. Em vez disso,
 *    o backend persiste um snapshot congelado da venda em
 *    `ItinerarySale.purchaseData.routeSnapshot` — essa é a versão
 *    "Original" compatível com o banco em produção.
 *  - As personalizações ficam num registro `TravelerItineraryCustomization`
 *    com 4 campos: `notes`, `addedItems`, `hiddenOriginalIds` e
 *    `editedOriginalItems`. O merge "snapshot + customization → roteiro
 *    personalizado" acontece inteiramente no mobile (mergeEngine.ts).
 *
 * Endpoints:
 *  - GET    /:itineraryId/customization        → retorna { customization | null }
 *  - PUT    /:itineraryId/customization        → upsert (notes/addedItems/hiddenOriginalIds/editedOriginalItems)
 *  - DELETE /:itineraryId/customization        → apaga (idempotente)
 *  - GET    /:itineraryId/snapshot             → retorna o snapshot da venda;
 *                                                 reconstrói on-the-fly se ausente
 *  - POST   /:itineraryId/purchased-snapshot   → recupera snapshot apenas se ausente
 *
 * Segurança:
 *  - Todas exigem `travelerAuthMiddleware`.
 *  - `assertOwnership(travelerId, itineraryId)` confirma que existe uma
 *    `ItinerarySale` ligando os dois — sem venda, 403 (nunca 404, para
 *    não vazar a existência do roteiro).
 *  - Defense in depth: em PUT/DELETE, antes de mutar o registro,
 *    confirmamos que o `travelerId` da linha existente bate com o do
 *    JWT autenticado.
 */

import { Router, Response } from 'express';
import { travelerAuthMiddleware, TravelerAuthRequest } from '../middleware/traveler-auth';
import prisma from '../lib/prisma';
import {
    buildItinerarySnapshot,
    getRouteSnapshot,
    serializeDate,
} from './itineraries';

const router = Router();

const MAX_NOTES_LEN = 8000;

// Cap total da customização para evitar DoS via JSON gigante. O viajante
// pode armazenar muitos addedItems + patches, mas não centenas de KB.
// Calculado sobre o stringify do payload PUT *após* validação dos campos
// individuais — pega o caso em que cada array/objeto isolado é válido mas
// o agregado explode storage.
const MAX_CUSTOMIZATION_PAYLOAD_BYTES = 256 * 1024; // 256 KB

// Caps individuais — uma camada acima da validação de tipos. Evita que
// um único array/objeto consuma toda a quota antes do agregado fechar.
const MAX_HIDDEN_IDS = 500;
const MAX_ADDED_ITEMS_BYTES = 200 * 1024;     // 200 KB
const MAX_EDITED_ITEMS_BYTES = 200 * 1024;    // 200 KB

type OwnershipResult = { saleId: string };

/**
 * Garante que o viajante autenticado é dono do roteiro. Olha
 * `ItinerarySale` (único caminho canônico para roteiros). Sem venda,
 * retorna null (caller responde 403).
 */
async function assertOwnership(
    travelerId: string,
    itineraryId: string,
): Promise<OwnershipResult | null> {
    const sale = await prisma.itinerarySale.findFirst({
        where: { itineraryId, travelerId },
        select: { id: true },
    });
    if (!sale) return null;
    return { saleId: sale.id };
}

function sendOwnershipError(res: Response): void {
    res.status(403).json({ error: 'Access denied to this trip' });
}

function isPlainObject(value: unknown): value is Record<string, any> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Valida e normaliza os campos editáveis do body do PUT. Aceita undefined
 * (= não tocar) e null em `notes` (= limpar). Retorna `{ data }` com só os
 * campos presentes, ou `{ error }` com mensagem para 400.
 */
function validateCustomizationBody(body: any):
    | { data: { notes?: string | null; addedItems?: any; hiddenOriginalIds?: any; editedOriginalItems?: any } }
    | { error: string } {
    const data: { notes?: string | null; addedItems?: any; hiddenOriginalIds?: any; editedOriginalItems?: any } = {};

    if (body?.notes !== undefined) {
        if (body.notes === null) {
            data.notes = null;
        } else if (typeof body.notes !== 'string') {
            return { error: 'notes must be a string or null' };
        } else if (body.notes.length > MAX_NOTES_LEN) {
            return { error: `notes exceeds the maximum length (${MAX_NOTES_LEN})` };
        } else {
            data.notes = body.notes;
        }
    }

    if (body?.addedItems !== undefined) {
        // Aceitamos tanto array (legado) quanto objeto agrupado por kind
        // — o mobile pode evoluir o shape, manter validação leve.
        if (!Array.isArray(body.addedItems) && !isPlainObject(body.addedItems)) {
            return { error: 'addedItems must be an array or object' };
        }
        if (byteLengthOfJson(body.addedItems) > MAX_ADDED_ITEMS_BYTES) {
            return { error: `addedItems exceeds ${Math.round(MAX_ADDED_ITEMS_BYTES / 1024)} KB` };
        }
        data.addedItems = body.addedItems;
    }

    if (body?.hiddenOriginalIds !== undefined) {
        if (!Array.isArray(body.hiddenOriginalIds)) {
            return { error: 'hiddenOriginalIds must be an array' };
        }
        if (body.hiddenOriginalIds.length > MAX_HIDDEN_IDS) {
            return { error: `hiddenOriginalIds exceeds the maximum of ${MAX_HIDDEN_IDS} entries` };
        }
        if (body.hiddenOriginalIds.some((id: any) => typeof id !== 'string' || id.length > 256)) {
            return { error: 'hiddenOriginalIds only accepts strings (≤ 256 chars)' };
        }
        data.hiddenOriginalIds = body.hiddenOriginalIds;
    }

    if (body?.editedOriginalItems !== undefined) {
        if (!isPlainObject(body.editedOriginalItems)) {
            return { error: 'editedOriginalItems must be an object' };
        }
        if (byteLengthOfJson(body.editedOriginalItems) > MAX_EDITED_ITEMS_BYTES) {
            return { error: `editedOriginalItems exceeds ${Math.round(MAX_EDITED_ITEMS_BYTES / 1024)} KB` };
        }
        data.editedOriginalItems = body.editedOriginalItems;
    }

    if (Object.keys(data).length === 0) {
        return { error: 'No fields provided' };
    }

    // Cap agregado — defesa final contra explosão de storage por viajante.
    if (byteLengthOfJson(data) > MAX_CUSTOMIZATION_PAYLOAD_BYTES) {
        return { error: `customization exceeds ${Math.round(MAX_CUSTOMIZATION_PAYLOAD_BYTES / 1024)} KB` };
    }

    return { data };
}

/**
 * Estima o tamanho do JSON em bytes via `Buffer.byteLength(JSON.stringify(...))`.
 * Defensivo contra estruturas circulares (que estourariam JSON.stringify) —
 * nesse caso retorna Infinity para forçar rejeição.
 */
function byteLengthOfJson(value: any): number {
    try {
        return Buffer.byteLength(JSON.stringify(value), 'utf8');
    } catch {
        return Number.POSITIVE_INFINITY;
    }
}

// ─────────────────────────────────────────────
// CUSTOMIZATION (overlay do viajante)
// ─────────────────────────────────────────────

// GET /api/route-customization/:itineraryId/customization
router.get(
    '/:itineraryId/customization',
    travelerAuthMiddleware,
    async (req: TravelerAuthRequest, res: Response) => {
        try {
            const travelerId = req.traveler!.travelerId;
            const itineraryId = req.params.itineraryId as string;

            const ownership = await assertOwnership(travelerId, itineraryId);
            if (!ownership) return sendOwnershipError(res);

            const customization = await prisma.travelerItineraryCustomization.findFirst({
                where: { travelerId, itineraryId, saleId: ownership.saleId },
            });

            res.json({ customization });
        } catch (error) {
            console.error('Error fetching route customization:', error);
            res.status(500).json({ error: 'Failed to load customization' });
        }
    },
);

// PUT /api/route-customization/:itineraryId/customization
router.put(
    '/:itineraryId/customization',
    travelerAuthMiddleware,
    async (req: TravelerAuthRequest, res: Response) => {
        try {
            const travelerId = req.traveler!.travelerId;
            const itineraryId = req.params.itineraryId as string;

            const ownership = await assertOwnership(travelerId, itineraryId);
            if (!ownership) return sendOwnershipError(res);

            const validated = validateCustomizationBody(req.body);
            if ('error' in validated) {
                res.status(400).json({ error: validated.error });
                return;
            }

            // Defense in depth: se já existe linha, confirma travelerId.
            const existing = await prisma.travelerItineraryCustomization.findFirst({
                where: { travelerId, itineraryId, saleId: ownership.saleId },
                select: { id: true, travelerId: true },
            });
            if (existing && existing.travelerId !== travelerId) {
                // Não deveria acontecer (unique key cobre), mas guarda extra.
                res.status(403).json({ error: 'This customization belongs to another traveler' });
                return;
            }

            const customization = existing
                ? await prisma.travelerItineraryCustomization.update({
                    where: { id: existing.id },
                    data: validated.data,
                })
                : await prisma.travelerItineraryCustomization.create({
                    data: {
                    travelerId,
                    itineraryId,
                    saleId: ownership.saleId,
                    notes: validated.data.notes ?? null,
                    addedItems: validated.data.addedItems ?? [],
                    hiddenOriginalIds: validated.data.hiddenOriginalIds ?? [],
                    editedOriginalItems: validated.data.editedOriginalItems ?? {},
                    },
                });

            res.json({ customization });
        } catch (error) {
            console.error('Error saving route customization:', error);
            res.status(500).json({ error: 'Failed to save customization' });
        }
    },
);

// DELETE /api/route-customization/:itineraryId/customization
router.delete(
    '/:itineraryId/customization',
    travelerAuthMiddleware,
    async (req: TravelerAuthRequest, res: Response) => {
        try {
            const travelerId = req.traveler!.travelerId;
            const itineraryId = req.params.itineraryId as string;

            const ownership = await assertOwnership(travelerId, itineraryId);
            if (!ownership) return sendOwnershipError(res);

            // Defense in depth: deleta só linhas pertencentes ao
            // viajante autenticado. `deleteMany` é idempotente — se não
            // existir, count = 0 e seguimos OK.
            await prisma.travelerItineraryCustomization.deleteMany({
                where: { travelerId, itineraryId, saleId: ownership.saleId },
            });

            res.json({ ok: true });
        } catch (error) {
            console.error('Error deleting route customization:', error);
            res.status(500).json({ error: 'Failed to remove customization' });
        }
    },
);

// ─────────────────────────────────────────────
// SNAPSHOT (versão "Original" da venda)
// ─────────────────────────────────────────────

// GET /api/route-customization/:itineraryId/snapshot
// Retorna o snapshot da venda em `purchaseData.routeSnapshot`; se estiver
// ausente, reconstrói on-the-fly e persiste usando o estado atual do roteiro.
router.get(
    '/:itineraryId/snapshot',
    travelerAuthMiddleware,
    async (req: TravelerAuthRequest, res: Response) => {
        try {
            const travelerId = req.traveler!.travelerId;
            const itineraryId = req.params.itineraryId as string;

            const sale = await prisma.itinerarySale.findFirst({
                where: { itineraryId, travelerId },
                select: { id: true, price: true, createdAt: true, purchaseData: true },
            });
            if (!sale) return sendOwnershipError(res);

            const existing = getRouteSnapshot(sale.purchaseData);
            if (existing) {
                res.json({
                    snapshot: {
                        ...(existing as any),
                        purchaseId: sale.id,
                        purchasedAt: serializeDate(sale.createdAt),
                        pricePaid: sale.price,
                    },
                });
                return;
            }

            // Sem snapshot — reconstroi com o estado atual do roteiro e
            // persiste em purchaseData para próximas leituras.
            const rebuilt = await buildItinerarySnapshot(prisma, itineraryId, {
                id: sale.id,
                price: sale.price,
                createdAt: sale.createdAt,
            });
            if (!rebuilt) {
                res.status(404).json({ error: 'Itinerary not found' });
                return;
            }

            const mergedPurchaseData = isPlainObject(sale.purchaseData)
                ? { ...(sale.purchaseData as any), routeSnapshot: rebuilt }
                : { routeSnapshot: rebuilt };

            await prisma.itinerarySale.update({
                where: { id: sale.id },
                data: {
                    purchaseData: mergedPurchaseData,
                },
            });

            res.json({ snapshot: rebuilt });
        } catch (error) {
            console.error('Error fetching route snapshot:', error);
            res.status(500).json({ error: 'Failed to load itinerary snapshot' });
        }
    },
);

// POST /api/route-customization/:itineraryId/purchased-snapshot
// Compatibilidade com clientes antigos: nunca substitui um snapshot já
// adquirido. Só recupera vendas legadas que ainda não tinham snapshot.
router.post(
    '/:itineraryId/purchased-snapshot',
    travelerAuthMiddleware,
    async (req: TravelerAuthRequest, res: Response) => {
        try {
            const travelerId = req.traveler!.travelerId;
            const itineraryId = req.params.itineraryId as string;

            const sale = await prisma.itinerarySale.findFirst({
                where: { itineraryId, travelerId },
                select: { id: true, price: true, createdAt: true, purchaseData: true },
            });
            if (!sale) return sendOwnershipError(res);

            const existing = getRouteSnapshot(sale.purchaseData);
            if (existing) {
                res.json({
                    snapshot: {
                        ...(existing as any),
                        purchaseId: sale.id,
                        purchasedAt: serializeDate(sale.createdAt),
                        pricePaid: sale.price,
                    },
                    unchanged: true,
                });
                return;
            }

            const rebuilt = await buildItinerarySnapshot(prisma, itineraryId, {
                id: sale.id,
                price: sale.price,
                createdAt: sale.createdAt,
            });
            if (!rebuilt) {
                res.status(404).json({ error: 'Itinerary not found' });
                return;
            }

            const mergedPurchaseData = isPlainObject(sale.purchaseData)
                ? { ...(sale.purchaseData as any), routeSnapshot: rebuilt }
                : { routeSnapshot: rebuilt };

            await prisma.itinerarySale.update({
                where: { id: sale.id },
                data: {
                    purchaseData: mergedPurchaseData,
                },
            });

            res.json({ snapshot: rebuilt });
        } catch (error) {
            console.error('Error rebuilding route snapshot:', error);
            res.status(500).json({ error: 'Failed to rebuild snapshot' });
        }
    },
);

export default router;

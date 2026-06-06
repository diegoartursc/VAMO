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
 *  - POST   /:itineraryId/purchased-snapshot   → força rebuild + persistência
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
    res.status(403).json({ error: 'Acesso negado a esta viagem' });
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
            return { error: 'notes precisa ser string ou null' };
        } else if (body.notes.length > MAX_NOTES_LEN) {
            return { error: `notes excede o tamanho máximo (${MAX_NOTES_LEN})` };
        } else {
            data.notes = body.notes;
        }
    }

    if (body?.addedItems !== undefined) {
        // Aceitamos tanto array (legado) quanto objeto agrupado por kind
        // — o mobile pode evoluir o shape, manter validação leve.
        if (!Array.isArray(body.addedItems) && !isPlainObject(body.addedItems)) {
            return { error: 'addedItems precisa ser array ou objeto' };
        }
        if (byteLengthOfJson(body.addedItems) > MAX_ADDED_ITEMS_BYTES) {
            return { error: `addedItems excede ${Math.round(MAX_ADDED_ITEMS_BYTES / 1024)} KB` };
        }
        data.addedItems = body.addedItems;
    }

    if (body?.hiddenOriginalIds !== undefined) {
        if (!Array.isArray(body.hiddenOriginalIds)) {
            return { error: 'hiddenOriginalIds precisa ser array' };
        }
        if (body.hiddenOriginalIds.length > MAX_HIDDEN_IDS) {
            return { error: `hiddenOriginalIds excede o máximo de ${MAX_HIDDEN_IDS} entradas` };
        }
        if (body.hiddenOriginalIds.some((id: any) => typeof id !== 'string' || id.length > 256)) {
            return { error: 'hiddenOriginalIds só aceita strings (≤ 256 chars)' };
        }
        data.hiddenOriginalIds = body.hiddenOriginalIds;
    }

    if (body?.editedOriginalItems !== undefined) {
        if (!isPlainObject(body.editedOriginalItems)) {
            return { error: 'editedOriginalItems precisa ser um objeto' };
        }
        if (byteLengthOfJson(body.editedOriginalItems) > MAX_EDITED_ITEMS_BYTES) {
            return { error: `editedOriginalItems excede ${Math.round(MAX_EDITED_ITEMS_BYTES / 1024)} KB` };
        }
        data.editedOriginalItems = body.editedOriginalItems;
    }

    if (Object.keys(data).length === 0) {
        return { error: 'Nenhum campo fornecido' };
    }

    // Cap agregado — defesa final contra explosão de storage por viajante.
    if (byteLengthOfJson(data) > MAX_CUSTOMIZATION_PAYLOAD_BYTES) {
        return { error: `customização excede ${Math.round(MAX_CUSTOMIZATION_PAYLOAD_BYTES / 1024)} KB` };
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

            const customization = await prisma.travelerItineraryCustomization.findUnique({
                where: { travelerId_itineraryId: { travelerId, itineraryId } },
            });

            res.json({ customization });
        } catch (error) {
            console.error('Error fetching route customization:', error);
            res.status(500).json({ error: 'Falha ao carregar personalização' });
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
            const existing = await prisma.travelerItineraryCustomization.findUnique({
                where: { travelerId_itineraryId: { travelerId, itineraryId } },
                select: { id: true, travelerId: true },
            });
            if (existing && existing.travelerId !== travelerId) {
                // Não deveria acontecer (unique key cobre), mas guarda extra.
                res.status(403).json({ error: 'Personalização pertence a outro viajante' });
                return;
            }

            const customization = await prisma.travelerItineraryCustomization.upsert({
                where: { travelerId_itineraryId: { travelerId, itineraryId } },
                update: validated.data,
                create: {
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
            res.status(500).json({ error: 'Falha ao salvar personalização' });
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
                where: { travelerId, itineraryId },
            });

            res.json({ ok: true });
        } catch (error) {
            console.error('Error deleting route customization:', error);
            res.status(500).json({ error: 'Falha ao remover personalização' });
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
                res.status(404).json({ error: 'Roteiro não encontrado' });
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
            res.status(500).json({ error: 'Falha ao carregar snapshot do roteiro' });
        }
    },
);

// POST /api/route-customization/:itineraryId/purchased-snapshot
// Força rebuild do snapshot a partir do estado atual do roteiro e
// persiste. Útil para regenerar manualmente caso o snapshot esteja
// ausente ou conhecido como obsoleto.
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

            const rebuilt = await buildItinerarySnapshot(prisma, itineraryId, {
                id: sale.id,
                price: sale.price,
                createdAt: sale.createdAt,
            });
            if (!rebuilt) {
                res.status(404).json({ error: 'Roteiro não encontrado' });
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
            res.status(500).json({ error: 'Falha ao reconstruir snapshot' });
        }
    },
);

export default router;

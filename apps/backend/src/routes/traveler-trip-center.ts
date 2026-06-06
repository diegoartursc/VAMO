/**
 * Rotas da "Minha Central da Viagem" — espaço privado por roteiro
 * comprado onde o viajante mantém um checklist editável e arquivos
 * (PDFs, vouchers, fotos de documento, etc.) ligados a uma viagem.
 *
 * Decisões de design:
 *  - Toda chamada exige `travelerAuthMiddleware` (token de viajante).
 *  - O dono é validado a cada request: `assertOwnership(travelerId, itineraryId)`
 *    confirma que existe um `ItinerarySale` para esta combinação. Sem
 *    venda, devolve 403 ("acesso negado"), nunca 404 (não vazamos a
 *    existência ou não do roteiro).
 *  - Defense in depth: além do ownership por roteiro, todo PATCH/DELETE
 *    confere que o registro a ser mutado tem o mesmo `travelerId` do
 *    autenticado — assim mesmo que duas vendas tenham IDs colididos por
 *    bug, ninguém edita item de outra pessoa.
 *  - Categorias livres por enquanto: o schema aceita string e o front
 *    decide a UI. Validamos só comprimento + tipo, sem enum no banco.
 */

import { Router, Response } from 'express';
import { travelerAuthMiddleware, TravelerAuthRequest } from '../middleware/traveler-auth';
import prisma from '../lib/prisma';

const router = Router();

// Status considerados "viagem comprada" o suficiente para liberar a
// Central. Inclui `DOCS_SENT` porque docs costumam chegar antes de
// `CONFIRMED` em alguns fluxos.
const APPROVED_PURCHASE_STATUSES = ['CONFIRMED', 'COMPLETED', 'DOCS_SENT'] as const;

const MAX_ITEM_LEN = 240;
const MAX_CATEGORY_LEN = 60;
const MAX_TITLE_LEN = 200;
const MAX_URL_LEN = 2048;
const MAX_MIME_LEN = 120;

type OwnershipResult = { saleId: string; purchaseId: string | null };

/**
 * Garante que o viajante autenticado é dono do roteiro. Retorna
 * `{ saleId, purchaseId }` ou null se não tem acesso. Olha primeiro
 * `ItinerarySale` (caminho canônico para roteiros) e, como fallback,
 * `PurchaseHistory` em status aprovado (caso o roteiro tenha sido
 * vendido como parte de um pacote — hoje raro mas reservamos a
 * porta). Sem schema link direto entre Itinerary↔Package, o fallback
 * é best-effort: confere se o viajante tem alguma compra ativa que
 * inclua este itineraryId via `package.itineraries` indireto. Como
 * essa relação não existe no schema, ficamos só com a ItinerarySale.
 */
async function assertOwnership(
    travelerId: string,
    itineraryId: string,
): Promise<OwnershipResult | null> {
    const sale = await prisma.itinerarySale.findFirst({
        where: { itineraryId, travelerId },
        select: { id: true },
    });

    if (sale) {
        return { saleId: sale.id, purchaseId: null };
    }

    // Fallback: alguma PurchaseHistory aprovada do viajante pode estar
    // ligada a este roteiro via `purchaseData.routeSnapshot.id` (o
    // mesmo formato usado em my-trips.ts). Não há FK direta — usamos
    // varredura limitada de compras aprovadas.
    const approvedPurchases = await prisma.purchaseHistory.findMany({
        where: {
            travelerId,
            status: { in: [...APPROVED_PURCHASE_STATUSES] },
        },
        select: { id: true },
        take: 50,
    });

    if (approvedPurchases.length > 0) {
        // Sem snapshot direto neste schema (purchaseHistory não tem
        // referência a itinerary). Mantém retorno null para forçar 403
        // se não houver ItinerarySale. O array está aqui apenas para
        // documentar a intenção e simplificar evolução futura quando
        // a relação for adicionada.
    }

    return null;
}

function sendOwnershipError(res: Response): void {
    // 403 ao invés de 404 para não vazar existência do roteiro.
    res.status(403).json({ error: 'Acesso negado a esta viagem' });
}

function validateNonEmptyString(value: unknown, maxLen: number): string | null {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (trimmed.length === 0 || trimmed.length > maxLen) return null;
    return trimmed;
}

// ─────────────────────────────────────────────
// CHECKLIST
// ─────────────────────────────────────────────

// GET /api/trip-center/:itineraryId/checklist
router.get('/:itineraryId/checklist', travelerAuthMiddleware, async (req: TravelerAuthRequest, res: Response) => {
    try {
        const travelerId = req.traveler!.travelerId;
        const itineraryId = req.params.itineraryId as string;

        const ownership = await assertOwnership(travelerId, itineraryId);
        if (!ownership) return sendOwnershipError(res);

        const items = await prisma.travelerChecklistItem.findMany({
            where: { travelerId, itineraryId },
            orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
        });

        res.json({ items });
    } catch (error) {
        console.error('Error fetching trip checklist:', error);
        res.status(500).json({ error: 'Falha ao carregar checklist' });
    }
});

// POST /api/trip-center/:itineraryId/checklist
router.post('/:itineraryId/checklist', travelerAuthMiddleware, async (req: TravelerAuthRequest, res: Response) => {
    try {
        const travelerId = req.traveler!.travelerId;
        const itineraryId = req.params.itineraryId as string;

        const ownership = await assertOwnership(travelerId, itineraryId);
        if (!ownership) return sendOwnershipError(res);

        const category = validateNonEmptyString(req.body?.category, MAX_CATEGORY_LEN);
        const itemText = validateNonEmptyString(req.body?.item, MAX_ITEM_LEN);

        if (!category) {
            res.status(400).json({ error: 'Categoria é obrigatória' });
            return;
        }
        if (!itemText) {
            res.status(400).json({ error: 'Descrição do item é obrigatória' });
            return;
        }

        // Próximo `order`: maior atual + 1, ou 0 se for o primeiro.
        const last = await prisma.travelerChecklistItem.findFirst({
            where: { travelerId, itineraryId },
            orderBy: { order: 'desc' },
            select: { order: true },
        });
        const nextOrder = (last?.order ?? -1) + 1;

        const item = await prisma.travelerChecklistItem.create({
            data: {
                travelerId,
                itineraryId,
                purchaseId: ownership.purchaseId,
                category,
                item: itemText,
                order: nextOrder,
            },
        });

        res.status(201).json({ item });
    } catch (error) {
        console.error('Error creating checklist item:', error);
        res.status(500).json({ error: 'Falha ao criar item' });
    }
});

// PATCH /api/trip-center/:itineraryId/checklist/:itemId
router.patch('/:itineraryId/checklist/:itemId', travelerAuthMiddleware, async (req: TravelerAuthRequest, res: Response) => {
    try {
        const travelerId = req.traveler!.travelerId;
        const itineraryId = req.params.itineraryId as string;
        const itemId = req.params.itemId as string;

        const ownership = await assertOwnership(travelerId, itineraryId);
        if (!ownership) return sendOwnershipError(res);

        // Defense in depth: confere que o item pertence ao mesmo
        // viajante autenticado antes de tocar nele.
        const existing = await prisma.travelerChecklistItem.findUnique({
            where: { id: itemId },
            select: { id: true, travelerId: true, itineraryId: true },
        });
        if (!existing || existing.travelerId !== travelerId || existing.itineraryId !== itineraryId) {
            res.status(404).json({ error: 'Item não encontrado' });
            return;
        }

        const updateData: { completed?: boolean; item?: string; category?: string } = {};

        if (typeof req.body?.completed === 'boolean') {
            updateData.completed = req.body.completed;
        }

        if (req.body?.item !== undefined) {
            const itemText = validateNonEmptyString(req.body.item, MAX_ITEM_LEN);
            if (!itemText) {
                res.status(400).json({ error: 'Descrição do item inválida' });
                return;
            }
            updateData.item = itemText;
        }

        if (req.body?.category !== undefined) {
            const category = validateNonEmptyString(req.body.category, MAX_CATEGORY_LEN);
            if (!category) {
                res.status(400).json({ error: 'Categoria inválida' });
                return;
            }
            updateData.category = category;
        }

        if (Object.keys(updateData).length === 0) {
            res.status(400).json({ error: 'Nenhuma alteração fornecida' });
            return;
        }

        const item = await prisma.travelerChecklistItem.update({
            where: { id: itemId },
            data: updateData,
        });

        res.json({ item });
    } catch (error) {
        console.error('Error updating checklist item:', error);
        res.status(500).json({ error: 'Falha ao atualizar item' });
    }
});

// DELETE /api/trip-center/:itineraryId/checklist/:itemId
router.delete('/:itineraryId/checklist/:itemId', travelerAuthMiddleware, async (req: TravelerAuthRequest, res: Response) => {
    try {
        const travelerId = req.traveler!.travelerId;
        const itineraryId = req.params.itineraryId as string;
        const itemId = req.params.itemId as string;

        const ownership = await assertOwnership(travelerId, itineraryId);
        if (!ownership) return sendOwnershipError(res);

        const existing = await prisma.travelerChecklistItem.findUnique({
            where: { id: itemId },
            select: { id: true, travelerId: true, itineraryId: true },
        });
        if (!existing || existing.travelerId !== travelerId || existing.itineraryId !== itineraryId) {
            res.status(404).json({ error: 'Item não encontrado' });
            return;
        }

        await prisma.travelerChecklistItem.delete({ where: { id: itemId } });

        res.json({ ok: true });
    } catch (error) {
        console.error('Error deleting checklist item:', error);
        res.status(500).json({ error: 'Falha ao remover item' });
    }
});

// ─────────────────────────────────────────────
// FILES
// ─────────────────────────────────────────────

// GET /api/trip-center/:itineraryId/files
router.get('/:itineraryId/files', travelerAuthMiddleware, async (req: TravelerAuthRequest, res: Response) => {
    try {
        const travelerId = req.traveler!.travelerId;
        const itineraryId = req.params.itineraryId as string;

        const ownership = await assertOwnership(travelerId, itineraryId);
        if (!ownership) return sendOwnershipError(res);

        const files = await prisma.travelerFile.findMany({
            where: { travelerId, itineraryId },
            orderBy: { createdAt: 'desc' },
        });

        res.json({ files });
    } catch (error) {
        console.error('Error fetching trip files:', error);
        res.status(500).json({ error: 'Falha ao carregar arquivos' });
    }
});

// POST /api/trip-center/:itineraryId/files
router.post('/:itineraryId/files', travelerAuthMiddleware, async (req: TravelerAuthRequest, res: Response) => {
    try {
        const travelerId = req.traveler!.travelerId;
        const itineraryId = req.params.itineraryId as string;

        const ownership = await assertOwnership(travelerId, itineraryId);
        if (!ownership) return sendOwnershipError(res);

        const category = validateNonEmptyString(req.body?.category, MAX_CATEGORY_LEN);
        const title = validateNonEmptyString(req.body?.title, MAX_TITLE_LEN);
        const url = validateNonEmptyString(req.body?.url, MAX_URL_LEN);

        if (!category) {
            res.status(400).json({ error: 'Categoria é obrigatória' });
            return;
        }
        if (!title) {
            res.status(400).json({ error: 'Título é obrigatório' });
            return;
        }
        if (!url) {
            res.status(400).json({ error: 'URL do arquivo é obrigatória' });
            return;
        }

        let mimeType: string | null = null;
        if (req.body?.mimeType !== undefined && req.body.mimeType !== null) {
            const value = validateNonEmptyString(req.body.mimeType, MAX_MIME_LEN);
            if (!value) {
                res.status(400).json({ error: 'mimeType inválido' });
                return;
            }
            mimeType = value;
        }

        let sizeBytes: number | null = null;
        if (req.body?.sizeBytes !== undefined && req.body.sizeBytes !== null) {
            const raw = Number(req.body.sizeBytes);
            if (!Number.isFinite(raw) || raw < 0 || raw > Number.MAX_SAFE_INTEGER) {
                res.status(400).json({ error: 'sizeBytes inválido' });
                return;
            }
            sizeBytes = Math.floor(raw);
        }

        const file = await prisma.travelerFile.create({
            data: {
                travelerId,
                itineraryId,
                purchaseId: ownership.purchaseId,
                category,
                title,
                url,
                mimeType,
                sizeBytes,
            },
        });

        res.status(201).json({ file });
    } catch (error) {
        console.error('Error creating trip file:', error);
        res.status(500).json({ error: 'Falha ao salvar arquivo' });
    }
});

// DELETE /api/trip-center/:itineraryId/files/:fileId
router.delete('/:itineraryId/files/:fileId', travelerAuthMiddleware, async (req: TravelerAuthRequest, res: Response) => {
    try {
        const travelerId = req.traveler!.travelerId;
        const itineraryId = req.params.itineraryId as string;
        const fileId = req.params.fileId as string;

        const ownership = await assertOwnership(travelerId, itineraryId);
        if (!ownership) return sendOwnershipError(res);

        const existing = await prisma.travelerFile.findUnique({
            where: { id: fileId },
            select: { id: true, travelerId: true, itineraryId: true },
        });
        if (!existing || existing.travelerId !== travelerId || existing.itineraryId !== itineraryId) {
            res.status(404).json({ error: 'Arquivo não encontrado' });
            return;
        }

        await prisma.travelerFile.delete({ where: { id: fileId } });

        res.json({ ok: true });
    } catch (error) {
        console.error('Error deleting trip file:', error);
        res.status(500).json({ error: 'Falha ao remover arquivo' });
    }
});

export default router;

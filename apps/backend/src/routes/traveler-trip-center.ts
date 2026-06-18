import { Router, Response, Request } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { travelerAuthMiddleware, TravelerAuthRequest } from '../middleware/traveler-auth';
import { generatePrivateFileToken, verifyPrivateFileToken } from '../lib/auth';
import prisma from '../lib/prisma';
import { hasValidFileSignature } from '../lib/file-signature';

const router = Router();
const MAX_ITEM_LEN = 240;
const MAX_CATEGORY_LEN = 60;
const MAX_TITLE_LEN = 200;
const MAX_NOTE_LEN = 2000;
const MAX_FILE_BYTES = 50 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif', 'pdf', 'mp4', 'mov', 'webm']);
const ALLOWED_MIMES = new Set([
    'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif',
    'image/heic-sequence', 'image/heif-sequence', 'application/pdf',
    'application/x-pdf', 'application/acrobat', 'applications/vnd.pdf',
    'text/pdf', 'text/x-pdf',
    'video/mp4', 'video/quicktime', 'video/webm', 'application/octet-stream',
]);
// Fonte de verdade das categorias = apps/mobile/src/features/trip-center/
// fileCategories.ts (FILE_CATEGORIES). Mantenha esta lista SINCRONIZADA com
// aquela (sempre em minúsculas — o handler compara com toLocaleLowerCase).
// Os aliases extras (`passeios`, `seguro viagem`, `geral`) cobrem dados
// legados/clientes antigos sem rejeitar uploads válidos.
const ALLOWED_CATEGORIES = new Set([
    // Canônicas (espelho de FILE_CATEGORIES, lowercase)
    'voos', 'hospedagem', 'passeios e ingressos', 'documentos',
    'seguro', 'recibos', 'transporte', 'outros',
    // Aliases legados aceitos por compatibilidade
    'passeios', 'seguro viagem', 'geral',
]);

type OwnershipResult = { saleId: string };

const privateUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_FILE_BYTES, files: 1 },
    fileFilter: (_req, file, cb) => {
        const extension = path.extname(file.originalname).slice(1).toLowerCase();
        const mime = (file.mimetype || '').toLowerCase();
        cb(null, ALLOWED_EXTENSIONS.has(extension) && ALLOWED_MIMES.has(mime));
    },
});

async function assertOwnership(travelerId: string, itineraryId: string): Promise<OwnershipResult | null> {
    const sale = await prisma.itinerarySale.findFirst({
        where: { itineraryId, travelerId },
        orderBy: { createdAt: 'desc' },
        select: { id: true },
    });
    return sale ? { saleId: sale.id } : null;
}

function sendOwnershipError(res: Response): void {
    res.status(403).json({ error: 'Acesso negado a esta viagem' });
}

function validateString(value: unknown, maxLen: number, required = true): string | null {
    if (value === undefined || value === null) return required ? null : '';
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    if ((required && !trimmed) || trimmed.length > maxLen) return null;
    return trimmed;
}

function safeFilename(value: string): string {
    return value.replace(/[\r\n"]/g, '_').slice(0, 180) || 'arquivo';
}

function normalizedMimeType(file: Express.Multer.File): string {
    const extension = path.extname(file.originalname).slice(1).toLowerCase();
    const mime = (file.mimetype || '').toLowerCase();
    if (extension === 'pdf') return 'application/pdf';
    return mime || 'application/octet-stream';
}

function signedFileUrl(req: Request, fileId: string, travelerId: string): string {
    const token = generatePrivateFileToken({ fileId, travelerId });
    return `${req.protocol}://${req.get('host')}/api/trip-center/files/${encodeURIComponent(fileId)}/content?token=${encodeURIComponent(token)}`;
}

function publicFile<T extends { id: string; travelerId: string; content?: unknown }>(req: Request, file: T) {
    const { content: _content, ...safe } = file;
    return { ...safe, url: signedFileUrl(req, file.id, file.travelerId) };
}

router.get('/:itineraryId/checklist', travelerAuthMiddleware, async (req: TravelerAuthRequest, res: Response) => {
    try {
        const travelerId = req.traveler!.travelerId;
        const itineraryId = req.params.itineraryId as string;
        const ownership = await assertOwnership(travelerId, itineraryId);
        if (!ownership) return sendOwnershipError(res);

        const items = await prisma.travelerChecklistItem.findMany({
            where: { travelerId, itineraryId, saleId: ownership.saleId },
            orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
        });
        res.json({ items });
    } catch (error) {
        console.error('Error fetching trip checklist:', error);
        res.status(500).json({ error: 'Falha ao carregar checklist' });
    }
});

router.post('/:itineraryId/checklist', travelerAuthMiddleware, async (req: TravelerAuthRequest, res: Response) => {
    try {
        const travelerId = req.traveler!.travelerId;
        const itineraryId = req.params.itineraryId as string;
        const ownership = await assertOwnership(travelerId, itineraryId);
        if (!ownership) return sendOwnershipError(res);

        const category = validateString(req.body?.category, MAX_CATEGORY_LEN);
        const itemText = validateString(req.body?.item, MAX_ITEM_LEN);
        if (!category) return void res.status(400).json({ error: 'Categoria é obrigatória' });
        if (!itemText) return void res.status(400).json({ error: 'Descrição do item é obrigatória' });

        const last = await prisma.travelerChecklistItem.findFirst({
            where: { travelerId, itineraryId, saleId: ownership.saleId },
            orderBy: { order: 'desc' },
            select: { order: true },
        });
        const item = await prisma.travelerChecklistItem.create({
            data: {
                travelerId,
                itineraryId,
                saleId: ownership.saleId,
                category,
                item: itemText,
                order: (last?.order ?? -1) + 1,
            },
        });
        res.status(201).json({ item });
    } catch (error) {
        console.error('Error creating checklist item:', error);
        res.status(500).json({ error: 'Falha ao criar item' });
    }
});

router.patch('/:itineraryId/checklist/:itemId', travelerAuthMiddleware, async (req: TravelerAuthRequest, res: Response) => {
    try {
        const travelerId = req.traveler!.travelerId;
        const itineraryId = req.params.itineraryId as string;
        const itemId = req.params.itemId as string;
        const ownership = await assertOwnership(travelerId, itineraryId);
        if (!ownership) return sendOwnershipError(res);

        const existing = await prisma.travelerChecklistItem.findFirst({
            where: { id: itemId, travelerId, itineraryId, saleId: ownership.saleId },
            select: { id: true },
        });
        if (!existing) return void res.status(404).json({ error: 'Item não encontrado' });

        const data: { completed?: boolean; item?: string; category?: string } = {};
        if (typeof req.body?.completed === 'boolean') data.completed = req.body.completed;
        if (req.body?.item !== undefined) {
            const value = validateString(req.body.item, MAX_ITEM_LEN);
            if (!value) return void res.status(400).json({ error: 'Descrição do item inválida' });
            data.item = value;
        }
        if (req.body?.category !== undefined) {
            const value = validateString(req.body.category, MAX_CATEGORY_LEN);
            if (!value) return void res.status(400).json({ error: 'Categoria inválida' });
            data.category = value;
        }
        if (!Object.keys(data).length) return void res.status(400).json({ error: 'Nenhuma alteração fornecida' });

        const item = await prisma.travelerChecklistItem.update({ where: { id: itemId }, data });
        res.json({ item });
    } catch (error) {
        console.error('Error updating checklist item:', error);
        res.status(500).json({ error: 'Falha ao atualizar item' });
    }
});

router.delete('/:itineraryId/checklist/:itemId', travelerAuthMiddleware, async (req: TravelerAuthRequest, res: Response) => {
    try {
        const travelerId = req.traveler!.travelerId;
        const itineraryId = req.params.itineraryId as string;
        const itemId = req.params.itemId as string;
        const ownership = await assertOwnership(travelerId, itineraryId);
        if (!ownership) return sendOwnershipError(res);

        const deleted = await prisma.travelerChecklistItem.deleteMany({
            where: { id: itemId, travelerId, itineraryId, saleId: ownership.saleId },
        });
        if (!deleted.count) return void res.status(404).json({ error: 'Item não encontrado' });
        res.json({ ok: true });
    } catch (error) {
        console.error('Error deleting checklist item:', error);
        res.status(500).json({ error: 'Falha ao remover item' });
    }
});

router.get('/:itineraryId/files', travelerAuthMiddleware, async (req: TravelerAuthRequest, res: Response) => {
    try {
        const travelerId = req.traveler!.travelerId;
        const itineraryId = req.params.itineraryId as string;
        const ownership = await assertOwnership(travelerId, itineraryId);
        if (!ownership) return sendOwnershipError(res);

        const files = await prisma.travelerFile.findMany({
            where: { travelerId, itineraryId, saleId: ownership.saleId },
            select: {
                id: true, travelerId: true, itineraryId: true, purchaseId: true, saleId: true,
                category: true, title: true, url: true, originalFileName: true, mimeType: true,
                sizeBytes: true, note: true, createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ files: files.map(file => publicFile(req, file)) });
    } catch (error) {
        console.error('Error fetching trip files:', error);
        res.status(500).json({ error: 'Falha ao carregar arquivos' });
    }
});

router.post(
    '/:itineraryId/files/upload',
    travelerAuthMiddleware,
    (req: TravelerAuthRequest, res: Response) => {
        privateUpload.single('file')(req, res, async (uploadError) => {
            try {
                if (uploadError instanceof multer.MulterError && uploadError.code === 'LIMIT_FILE_SIZE') {
                    return void res.status(413).json({ error: 'Arquivo muito grande (máx. 50 MB).' });
                }
                if (uploadError) return void res.status(415).json({ error: 'Formato não aceito para este campo.' });
                if (!req.file) return void res.status(400).json({ error: 'Arquivo ausente ou formato inválido.' });
                if (!hasValidFileSignature(req.file.buffer, req.file.originalname)) {
                    return void res.status(415).json({ error: 'O conteúdo do arquivo não corresponde ao formato informado.' });
                }

                const travelerId = req.traveler!.travelerId;
                const itineraryId = req.params.itineraryId as string;
                const ownership = await assertOwnership(travelerId, itineraryId);
                if (!ownership) return sendOwnershipError(res);

                const category = validateString(req.body?.category, MAX_CATEGORY_LEN);
                const title = validateString(req.body?.title, MAX_TITLE_LEN);
                const note = validateString(req.body?.note, MAX_NOTE_LEN, false);
                if (!category || !ALLOWED_CATEGORIES.has(category.toLocaleLowerCase('pt-BR'))) {
                    return void res.status(400).json({ error: 'Categoria inválida' });
                }
                if (!title) return void res.status(400).json({ error: 'Título é obrigatório' });
                if (note === null) return void res.status(400).json({ error: 'Observação inválida' });

                const file = await prisma.travelerFile.create({
                    data: {
                        travelerId,
                        itineraryId,
                        saleId: ownership.saleId,
                        category,
                        title,
                        url: 'private://postgres',
                        originalFileName: req.file.originalname,
                        mimeType: normalizedMimeType(req.file),
                        sizeBytes: req.file.size,
                        note: note || null,
                        content: req.file.buffer,
                    },
                    select: {
                        id: true, travelerId: true, itineraryId: true, purchaseId: true, saleId: true,
                        category: true, title: true, url: true, originalFileName: true, mimeType: true,
                        sizeBytes: true, note: true, createdAt: true,
                    },
                });
                res.status(201).json({ file: publicFile(req, file) });
            } catch (error) {
                console.error('Error uploading trip file:', error);
                res.status(500).json({ error: 'Não foi possível enviar o arquivo.' });
            }
        });
    },
);

// Compatibility guard: old clients must not persist arbitrary public URLs.
router.post('/:itineraryId/files', travelerAuthMiddleware, (_req, res) => {
    res.status(410).json({ error: 'Atualize o app para usar o upload privado da Central da Viagem.' });
});

router.get('/files/:fileId/content', async (req: Request, res: Response) => {
    try {
        const fileId = req.params.fileId as string;
        const token = typeof req.query.token === 'string' ? req.query.token : '';
        const payload = verifyPrivateFileToken(token);
        if (!payload || payload.fileId !== fileId) return void res.status(401).json({ error: 'Link inválido ou expirado' });

        const file = await prisma.travelerFile.findFirst({
            where: { id: fileId, travelerId: payload.travelerId },
            select: { content: true, url: true, mimeType: true, originalFileName: true, title: true },
        });
        if (!file) return void res.status(404).json({ error: 'Arquivo não encontrado' });

        res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
        res.setHeader('Content-Disposition', `inline; filename="${safeFilename(file.originalFileName || file.title)}"`);
        res.setHeader('Cache-Control', 'private, max-age=300');
        res.setHeader('X-Content-Type-Options', 'nosniff');

        if (file.content) {
            res.send(file.content);
            return;
        }

        // Legacy records: serve the old local file only through this signed URL.
        const legacyName = path.basename(new URL(file.url, 'http://local').pathname);
        const legacyPath = path.join(process.cwd(), 'public/uploads/itineraries', legacyName);
        if (!legacyName || !fs.existsSync(legacyPath)) {
            return void res.status(410).json({ error: 'Arquivo legado indisponível; envie-o novamente.' });
        }
        res.sendFile(legacyPath);
    } catch (error) {
        console.error('Error serving trip file:', error);
        res.status(500).json({ error: 'Falha ao abrir arquivo' });
    }
});

router.delete('/:itineraryId/files/:fileId', travelerAuthMiddleware, async (req: TravelerAuthRequest, res: Response) => {
    try {
        const travelerId = req.traveler!.travelerId;
        const itineraryId = req.params.itineraryId as string;
        const fileId = req.params.fileId as string;
        const ownership = await assertOwnership(travelerId, itineraryId);
        if (!ownership) return sendOwnershipError(res);

        const deleted = await prisma.travelerFile.deleteMany({
            where: { id: fileId, travelerId, itineraryId, saleId: ownership.saleId },
        });
        if (!deleted.count) return void res.status(404).json({ error: 'Arquivo não encontrado' });
        res.json({ ok: true });
    } catch (error) {
        console.error('Error deleting trip file:', error);
        res.status(500).json({ error: 'Falha ao remover arquivo' });
    }
});

export default router;

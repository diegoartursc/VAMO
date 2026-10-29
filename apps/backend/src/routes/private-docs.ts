/**
 * Comprovantes privados (SEC-03).
 *   POST /api/private-docs            — envia um comprovante (criador logado)
 *   GET  /api/private-docs/:id/:name  — abre com link assinado (dono/admin)
 */
import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { Router } from '../lib/router';
import prisma from '../lib/prisma';
import { travelerAuthMiddleware, TravelerAuthRequest } from '../middleware/traveler-auth';
import { verifyDocumentToken } from '../lib/auth';
import { hasValidFileSignature } from '../lib/file-signature';
import { PRIVATE_DOC_PREFIX, signedDocUrl } from '../lib/privateDocs';

const router = Router();

const MAX_DOC_BYTES = 15 * 1024 * 1024;
const PURPOSES = new Set(['travelProof', 'costProof']);
const MIME_BY_EXT: Record<string, string> = {
    pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
    webp: 'image/webp', heic: 'image/heic', heif: 'image/heif',
};

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_DOC_BYTES, files: 1, fields: 5, fieldSize: 1024, parts: 7 },
    fileFilter: (_req, file, cb) => {
        const ext = path.extname(file.originalname || '').slice(1).toLowerCase();
        cb(null, Boolean(MIME_BY_EXT[ext]));
    },
});

router.post('/', travelerAuthMiddleware, (req: TravelerAuthRequest, res: Response) => {
    upload.single('file')(req, res, async (err: any) => {
        if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
            res.status(413).json({ error: 'File is too large (max 15 MB).' });
            return;
        }
        if (err) {
            res.status(400).json({ error: 'We couldn\'t process the upload.' });
            return;
        }
        const file = (req as any).file as Express.Multer.File | undefined;
        if (!file) {
            res.status(415).json({ error: 'Send a PDF or an image (JPG, PNG, WEBP, HEIC).' });
            return;
        }
        const purpose = String(req.body?.purpose || 'costProof');
        if (!PURPOSES.has(purpose)) {
            res.status(400).json({ error: 'Invalid purpose' });
            return;
        }
        if (!hasValidFileSignature(file.buffer, file.originalname)) {
            res.status(415).json({ error: 'The file contents don\'t match the stated format.' });
            return;
        }
        const ext = path.extname(file.originalname).slice(1).toLowerCase();
        const doc = await prisma.privateDocument.create({
            data: {
                ownerTravelerId: req.traveler!.travelerId,
                purpose,
                mimeType: MIME_BY_EXT[ext],
                originalFileName: file.originalname.slice(0, 180),
                sizeBytes: file.size,
                content: file.buffer,
            },
            select: { id: true, originalFileName: true, mimeType: true, sizeBytes: true },
        });
        res.status(201).json({
            // `url` é um link assinado (o app mostra a prévia); ao salvar o roteiro,
            // o backend troca por `private-doc://<id>`.
            url: signedDocUrl(req, doc.id, doc.originalFileName),
            ref: `${PRIVATE_DOC_PREFIX}${doc.id}`,
            filename: doc.originalFileName,
            originalName: doc.originalFileName,
            mimetype: doc.mimeType,
            size: doc.sizeBytes,
            mediaType: doc.mimeType === 'application/pdf' ? 'document' : 'image',
        });
    });
});

router.get('/:id/:name', async (req: Request, res: Response) => {
    const claims = verifyDocumentToken(req.query.token);
    if (!claims || claims.docId !== req.params.id) {
        res.status(401).json({ error: 'Link is invalid or has expired' });
        return;
    }
    const doc = await prisma.privateDocument.findUnique({
        where: { id: claims.docId },
        select: { content: true, mimeType: true, originalFileName: true },
    });
    if (!doc) {
        res.status(404).json({ error: 'File not found' });
        return;
    }
    const safe = doc.originalFileName.replace(/[\r\n"]/g, '_').slice(0, 180) || 'document';
    res.setHeader('Content-Type', doc.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${safe}"`);
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.send(Buffer.from(doc.content));
});

export default router;

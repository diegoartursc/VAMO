import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import prisma from '../lib/prisma';
import { authMiddleware, optionalAuthMiddleware, AuthRequest } from '../middleware/auth';
import { travelerAuthMiddleware, TravelerAuthRequest } from '../middleware/traveler-auth';

const router = express.Router();
const AGENCY_DOCS_DIR = path.join(process.cwd(), 'public/uploads/agency_docs');
fs.mkdirSync(AGENCY_DOCS_DIR, { recursive: true });

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, AGENCY_DOCS_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// ─── POST /api/agency-docs/:purchaseId — Agency sends document to traveler ───
router.post('/:purchaseId', authMiddleware, upload.single('file'), async (req: AuthRequest, res) => {
    try {
        const purchaseId = req.params.purchaseId as string;
        const { title, description, type } = req.body;
        
        let fileUrl = req.body.fileUrl as string | undefined; // Fallback to URL text if no file uploaded
        let fileName = req.body.fileName as string | undefined;

        if (req.file) {
            fileUrl = `/uploads/agency_docs/${req.file.filename}`;
            fileName = req.file.originalname;
        }

        if (!title || !type || !fileUrl) {
            return res.status(400).json({ error: 'title, type, and fileUrl (or file) are required' });
        }

        // Verify purchase exists
        const purchase = await prisma.purchaseHistory.findUnique({
            where: { id: purchaseId },
            include: { package: { select: { agencyId: true } } },
        });
        if (!purchase) {
            return res.status(404).json({ error: 'Purchase not found' });
        }
        if (purchase.package.agencyId !== req.agency?.agencyId) {
            return res.status(403).json({ error: 'Acesso negado a esta reserva' });
        }

        const doc = await prisma.agencyDocument.create({
            data: {
                purchaseId,
                title,
                description,
                type,
                fileUrl,
                fileName,
            },
        });

        // Update purchase status to DOCS_SENT if it was CONFIRMED or PROCESSING
        if (['CONFIRMED', 'PROCESSING'].includes(purchase.status)) {
            await prisma.purchaseHistory.update({
                where: { id: purchaseId },
                data: { status: 'DOCS_SENT' },
            });
        }

        res.status(201).json(doc);
    } catch (error) {
        console.error('Error creating agency document:', error);
        res.status(500).json({ error: 'Failed to create agency document' });
    }
});

// ─── GET /api/agency-docs/:purchaseId — List docs for a purchase ───
router.get('/:purchaseId', optionalAuthMiddleware, async (req: AuthRequest, res) => {
    try {
        if (!req.traveler && !req.agency) {
            return res.status(401).json({ error: 'Autenticação necessária' });
        }
        const purchaseId = String(req.params.purchaseId);
        const purchase = await prisma.purchaseHistory.findUnique({
            where: { id: purchaseId },
            select: { travelerId: true, package: { select: { agencyId: true } } },
        });
        if (!purchase) return res.status(404).json({ error: 'Purchase not found' });
        const isTravelerOwner = req.traveler?.travelerId === purchase.travelerId;
        const isAgencyOwner = req.agency?.agencyId === purchase.package.agencyId;
        if (!isTravelerOwner && !isAgencyOwner) {
            return res.status(req.traveler || req.agency ? 403 : 401).json({ error: 'Acesso negado a esta reserva' });
        }

        const docs = await prisma.agencyDocument.findMany({
            where: { purchaseId },
            orderBy: { sentAt: 'desc' },
        });

        res.json(docs);
    } catch (error) {
        console.error('Error fetching agency documents:', error);
        res.status(500).json({ error: 'Failed to fetch agency documents' });
    }
});

// ─── DELETE /api/agency-docs/doc/:docId — Remove a document ───
router.delete('/doc/:docId', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const docId = String(req.params.docId);
        const existing = await prisma.agencyDocument.findUnique({
            where: { id: docId },
            select: { purchase: { select: { package: { select: { agencyId: true } } } } },
        });
        if (!existing) return res.status(404).json({ error: 'Document not found' });
        if (existing.purchase.package.agencyId !== req.agency?.agencyId) {
            return res.status(403).json({ error: 'Acesso negado a este documento' });
        }

        await prisma.agencyDocument.delete({
            where: { id: docId },
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting agency document:', error);
        res.status(500).json({ error: 'Failed to delete agency document' });
    }
});

// ─── PUT /api/agency-docs/doc/:docId/viewed — Mark document as viewed by user ───
router.put('/doc/:docId/viewed', travelerAuthMiddleware, async (req: TravelerAuthRequest, res) => {
    try {
        const docId = String(req.params.docId);
        const existing = await prisma.agencyDocument.findUnique({
            where: { id: docId },
            select: { purchase: { select: { travelerId: true } } },
        });
        if (!existing) return res.status(404).json({ error: 'Document not found' });
        if (existing.purchase.travelerId !== req.traveler!.travelerId) {
            return res.status(403).json({ error: 'Acesso negado a este documento' });
        }

        const doc = await prisma.agencyDocument.update({
            where: { id: docId },
            data: { viewedAt: new Date() },
        });

        res.json(doc);
    } catch (error) {
        console.error('Error marking document as viewed:', error);
        res.status(500).json({ error: 'Failed to update document' });
    }
});

export default router;

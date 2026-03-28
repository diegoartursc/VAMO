import express from 'express';
import multer from 'multer';
import path from 'path';
import prisma from '../lib/prisma';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/agency_docs');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// ─── POST /api/agency-docs/:purchaseId — Agency sends document to traveler ───
router.post('/:purchaseId', upload.single('file'), async (req, res) => {
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
        const purchase = await prisma.purchaseHistory.findUnique({ where: { id: purchaseId } });
        if (!purchase) {
            return res.status(404).json({ error: 'Purchase not found' });
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
router.get('/:purchaseId', async (req, res) => {
    try {
        const { purchaseId } = req.params;

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
router.delete('/doc/:docId', async (req, res) => {
    try {
        const { docId } = req.params;

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
router.put('/doc/:docId/viewed', async (req, res) => {
    try {
        const { docId } = req.params;

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

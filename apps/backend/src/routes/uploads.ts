import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Garante que o diretório exista (multer não cria recursivamente)
const UPLOAD_DIR = path.join(process.cwd(), 'public/uploads/itineraries');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const safeExt = path.extname(file.originalname).toLowerCase().replace(/[^a-z0-9.]/g, '');
        cb(null, `${file.fieldname}-${unique}${safeExt}`);
    },
});

// 25MB máximo, aceita imagem e PDF
const upload = multer({
    storage,
    limits: { fileSize: 25 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const ok = /image\/(jpeg|png|webp|gif)|application\/pdf/.test(file.mimetype);
        cb(null, ok);
    },
});

// POST /api/uploads — upload de um único arquivo, retorna URL absoluta
router.post('/', upload.single('file'), (req, res) => {
    if (!req.file) {
        res.status(400).json({ error: 'Arquivo ausente (campo "file")' });
        return;
    }
    const host = `${req.protocol}://${req.get('host')}`;
    const url = `${host}/uploads/itineraries/${req.file.filename}`;
    res.json({
        url,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
    });
});

// POST /api/uploads/multiple — upload de múltiplos arquivos
router.post('/multiple', upload.array('files', 20), (req, res) => {
    const files = (req.files as Express.Multer.File[] | undefined) || [];
    if (files.length === 0) {
        res.status(400).json({ error: 'Nenhum arquivo enviado (campo "files")' });
        return;
    }
    const host = `${req.protocol}://${req.get('host')}`;
    res.json({
        urls: files.map(f => `${host}/uploads/itineraries/${f.filename}`),
    });
});

export default router;

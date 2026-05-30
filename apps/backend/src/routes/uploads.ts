import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { optionalAuthMiddleware, AuthRequest } from '../middleware/auth';

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

const ALLOWED_UPLOAD_MIME = /^(image\/(jpeg|png|webp|gif)|application\/pdf)$/;

// 25MB máximo, aceita imagem e PDF
const upload = multer({
    storage,
    limits: { fileSize: 25 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (!ALLOWED_UPLOAD_MIME.test(file.mimetype)) {
            cb(new Error('UNSUPPORTED_FILE_TYPE'));
            return;
        }
        cb(null, true);
    },
});

function sendUploadError(res: express.Response, err: unknown): boolean {
    if (!err) return false;
    const error = err as Error & { code?: string };
    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
        res.status(413).json({ error: 'Arquivo muito grande (máx 25 MB).' });
        return true;
    }
    if (error.message === 'UNSUPPORTED_FILE_TYPE') {
        res.status(415).json({ error: 'Formato de arquivo não suportado. Use JPG, PNG, WEBP, GIF ou PDF.' });
        return true;
    }
    res.status(400).json({ error: error.message || 'Não foi possível processar o upload.' });
    return true;
}

// POST /api/uploads — upload de um único arquivo, retorna URL absoluta
router.post('/', optionalAuthMiddleware, (req: AuthRequest, res) => {
    if (!req.traveler) {
        res.status(401).json({ error: 'Autenticação necessária para fazer upload' });
        return;
    }
    upload.single('file')(req, res, (err) => {
        if (sendUploadError(res, err)) return;
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
});

// POST /api/uploads/multiple — upload de múltiplos arquivos
router.post('/multiple', optionalAuthMiddleware, (req: AuthRequest, res) => {
    if (!req.traveler) {
        res.status(401).json({ error: 'Autenticação necessária para fazer upload' });
        return;
    }
    upload.array('files', 20)(req, res, (err) => {
        if (sendUploadError(res, err)) return;
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
});

export default router;

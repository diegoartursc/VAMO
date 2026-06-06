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

// Conjunto canônico de formatos aceitos no upload bruto. A matriz
// fina de "que formato vale em qual contexto" mora no client
// (apps/{mobile,site}/src/.../uploadContexts.ts). O backend aplica
// apenas o teto: imagens, vídeos e PDF são aceitos; a discriminação
// por contexto é responsabilidade do client.
//
// Variantes "-sequence" cobrem Live Photos HEIC do iPhone.
const ALLOWED_UPLOAD_MIME =
    /^(image\/(jpeg|png|webp|heic|heif|heic-sequence|heif-sequence)|video\/(mp4|quicktime|webm)|application\/pdf)$/;

// Extensões aceitas — fallback quando o cliente envia o arquivo com
// MIME genérico (alguns browsers usam application/octet-stream para
// HEIC e MOV). Confiar na extensão preserva a experiência do usuário
// sem abrir a porta para arquivos arbitrários: o sistema continua
// gravando exatamente o que veio.
const ALLOWED_UPLOAD_EXT = /\.(jpe?g|png|webp|heic|heif|mp4|mov|webm|pdf)$/i;

// Teto único de 100 MB cobre o maior caso (vídeo da galeria). Limites
// menores por contexto (25 MB para imagens, etc.) são aplicados pelo
// client antes do upload.
const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;

const upload = multer({
    storage,
    limits: { fileSize: MAX_UPLOAD_BYTES },
    fileFilter: (_req, file, cb) => {
        const mimeOk = ALLOWED_UPLOAD_MIME.test(file.mimetype);
        const extOk  = ALLOWED_UPLOAD_EXT.test(file.originalname || '');
        if (!mimeOk && !extOk) {
            cb(new Error('UNSUPPORTED_FILE_TYPE'));
            return;
        }
        cb(null, true);
    },
});

/**
 * Categoriza o arquivo recebido como `image`, `video` ou `document`
 * para o client poder distinguir o tratamento (preview de imagem,
 * ícone de PDF, player de vídeo) sem reinspecionar o MIME.
 */
function inferMediaType(mime: string, filename: string): 'image' | 'video' | 'document' {
    if (/^image\//i.test(mime)) return 'image';
    if (/^video\//i.test(mime)) return 'video';
    if (mime === 'application/pdf') return 'document';
    if (/\.(jpe?g|png|webp|heic|heif)$/i.test(filename)) return 'image';
    if (/\.(mp4|mov|webm)$/i.test(filename)) return 'video';
    if (/\.pdf$/i.test(filename)) return 'document';
    return 'document';
}

function sendUploadError(res: express.Response, err: unknown): boolean {
    if (!err) return false;
    const error = err as Error & { code?: string };
    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
        res.status(413).json({ error: 'Arquivo muito grande (máx 100 MB).' });
        return true;
    }
    if (error.message === 'UNSUPPORTED_FILE_TYPE') {
        res.status(415).json({ error: 'Formato não suportado. Use JPG, PNG, WEBP, HEIC, MP4, MOV ou PDF.' });
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
            mediaType: inferMediaType(req.file.mimetype, req.file.originalname),
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
            items: files.map(f => ({
                url: `${host}/uploads/itineraries/${f.filename}`,
                filename: f.filename,
                originalName: f.originalname,
                size: f.size,
                mimetype: f.mimetype,
                mediaType: inferMediaType(f.mimetype, f.originalname),
            })),
        });
    });
});

export default router;

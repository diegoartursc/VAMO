import express from 'express';
import { Router } from '../lib/router';
import multer from 'multer';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { optionalAuthMiddleware, AuthRequest } from '../middleware/auth';
import { isCloudStorageEnabled, uploadBufferToCloud, contentTypeForFilename, LOCAL_UPLOADS_ROOT } from '../lib/storage';
import { hasValidFileSignature } from '../lib/file-signature';
import { uploadGuard, uploadLimits } from '../lib/uploadGuard';

const router = Router();

// Garante que o diretório exista (multer não cria recursivamente)
const UPLOAD_DIR = path.join(LOCAL_UPLOADS_ROOT, 'itineraries');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
const TEMP_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'vamo-uploads-'));

// Mesmo esquema de nome usado historicamente pelo diskStorage —
// compartilhado com o modo cloud para que as URLs sigam o mesmo padrão.
function generateFilename(fieldname: string, originalname: string): string {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const safeExt = path.extname(originalname).toLowerCase().replace(/[^a-z0-9.]/g, '');
    return `${fieldname}-${unique}${safeExt}`;
}

// Com SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY no env, os uploads vão para o
// Supabase Storage (bucket público "vamo-uploads") — necessário em produção,
// onde o disco do Render é efêmero. Sem as env vars, o comportamento local
// histórico (arquivo servido de public/uploads) permanece intacto.
const useCloudStorage = isCloudStorageEnabled();

// SEC-08: o arquivo sempre vai para um temporário em disco (nunca o pedido
// inteiro em memória). Em modo cloud ele é lido um por vez para subir e o
// temporário é apagado; em modo disco é movido para public/uploads.
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, TEMP_DIR),
    filename: (_req, file, cb) => cb(null, generateFilename(file.fieldname, file.originalname)),
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
// HEIC e MOV). A assinatura do conteúdo é conferida depois do recebimento.
const ALLOWED_UPLOAD_EXT = /\.(jpe?g|png|webp|heic|heif|mp4|mov|webm|pdf)$/i;

function buildUpload() {
    const limits = uploadLimits();
    return multer({
        storage,
        limits: {
            fileSize: limits.maxFileBytes,
            files: limits.maxFiles,
            fields: 10,
            fieldSize: 1024,
            parts: limits.maxFiles + 10,
        },
        fileFilter: (_req, file, cb) => {
            const mimeOk = ALLOWED_UPLOAD_MIME.test(file.mimetype);
            const extOk = ALLOWED_UPLOAD_EXT.test(file.originalname || '');
            if (!mimeOk && !extOk) {
                cb(new Error('UNSUPPORTED_FILE_TYPE'));
                return;
            }
            cb(null, true);
        },
    });
}

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
        res.status(413).json({ error: 'File is too large.' });
        return true;
    }
    if (error instanceof multer.MulterError) {
        res.status(413).json({ error: 'Too many files or fields in one upload.' });
        return true;
    }
    if (error.message === 'UNSUPPORTED_FILE_TYPE') {
        res.status(415).json({ error: 'Unsupported format. Use JPG, PNG, WEBP, HEIC, MP4, MOV or PDF.' });
        return true;
    }
    res.status(400).json({ error: 'We couldn\'t process the upload.' });
    return true;
}

/** Só os primeiros bytes, para conferir a assinatura sem carregar o arquivo. */
async function readHead(file: Express.Multer.File): Promise<Buffer> {
    const handle = await fs.promises.open(file.path, 'r');
    try {
        const buffer = Buffer.alloc(16);
        const { bytesRead } = await handle.read(buffer, 0, 16, 0);
        return buffer.subarray(0, bytesRead);
    } finally {
        await handle.close();
    }
}

async function removeTemp(files: Express.Multer.File[]): Promise<void> {
    await Promise.all(files.map((f) => (f?.path ? fs.promises.rm(f.path, { force: true }) : Promise.resolve())));
}

/**
 * Publica um arquivo já validado e devolve a URL pública final.
 * - Cloud: lê o temporário (um arquivo por vez) e sobe para o Supabase Storage.
 * - Disco: move o temporário para public/uploads/itineraries.
 */
async function persistUploadedFile(
    req: express.Request,
    file: Express.Multer.File,
): Promise<{ url: string; filename: string }> {
    const filename = generateFilename(file.fieldname, file.originalname);
    if (!useCloudStorage) {
        const target = path.join(UPLOAD_DIR, filename);
        await fs.promises.rename(file.path, target).catch(async (e: any) => {
            if (e?.code !== 'EXDEV') throw e; // temporário em outro disco: copia
            await fs.promises.copyFile(file.path, target);
        });
        const host = `${req.protocol}://${req.get('host')}`;
        return { url: `${host}/uploads/itineraries/${filename}`, filename };
    }
    const buffer = await fs.promises.readFile(file.path);
    const contentType = contentTypeForFilename(file.originalname, file.mimetype);
    const { url } = await uploadBufferToCloud(buffer, `itineraries/${filename}`, contentType);
    return { url, filename };
}

function requireTraveler(req: AuthRequest, res: express.Response, next: express.NextFunction) {
    if (!req.traveler) {
        res.status(401).json({ error: 'Sign in to upload files' });
        return;
    }
    next();
}

// POST /api/uploads — upload de um único arquivo, retorna URL absoluta
router.post('/', optionalAuthMiddleware, requireTraveler, uploadGuard({ maxRequestBytes: uploadLimits().maxFileBytes + 64 * 1024 }), (req: AuthRequest, res) => {
    buildUpload().single('file')(req, res, async (err) => {
        const file = req.file as Express.Multer.File | undefined;
        try {
            if (sendUploadError(res, err)) return;
            if (!file) {
                res.status(400).json({ error: 'File missing (field "file")' });
                return;
            }
            if (!hasValidFileSignature(await readHead(file), file.originalname)) {
                res.status(415).json({ error: 'The file contents don\'t match the stated format.' });
                return;
            }
            const { url, filename } = await persistUploadedFile(req, file);
            res.json({
                url,
                filename,
                originalName: file.originalname,
                size: file.size,
                mimetype: file.mimetype,
                mediaType: inferMediaType(file.mimetype, file.originalname),
            });
        } catch (uploadErr) {
            console.error('Error persisting upload:', uploadErr);
            if (!res.headersSent) res.status(500).json({ error: 'We couldn\'t save the file. Please try again.' });
        } finally {
            if (file) await removeTemp([file]);
        }
    });
});

// POST /api/uploads/multiple — upload de múltiplos arquivos
router.post('/multiple', optionalAuthMiddleware, requireTraveler, uploadGuard(), (req: AuthRequest, res) => {
    buildUpload().array('files', uploadLimits().maxFiles)(req, res, async (err) => {
        const files = (req.files as Express.Multer.File[] | undefined) || [];
        try {
            if (sendUploadError(res, err)) return;
            if (files.length === 0) {
                res.status(400).json({ error: 'No file uploaded (field "files")' });
                return;
            }
            for (const f of files) {
                if (!hasValidFileSignature(await readHead(f), f.originalname)) {
                    res.status(415).json({ error: 'One of the files doesn\'t match the stated format.' });
                    return;
                }
            }
            const items = [];
            for (const f of files) {
                const { url, filename } = await persistUploadedFile(req, f);
                items.push({
                    url,
                    filename,
                    originalName: f.originalname,
                    size: f.size,
                    mimetype: f.mimetype,
                    mediaType: inferMediaType(f.mimetype, f.originalname),
                });
            }
            res.json({
                urls: items.map(i => i.url),
                items,
            });
        } catch (uploadErr) {
            console.error('Error persisting uploads:', uploadErr);
            if (!res.headersSent) res.status(500).json({ error: 'We couldn\'t save the files. Please try again.' });
        } finally {
            await removeTemp(files);
        }
    });
});

export default router;

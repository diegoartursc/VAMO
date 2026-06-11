import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { optionalAuthMiddleware, AuthRequest } from '../middleware/auth';
import { isCloudStorageEnabled, uploadBufferToCloud, contentTypeForFilename } from '../lib/storage';
import { hasValidFileSignature } from '../lib/file-signature';

const router = express.Router();

// Garante que o diretório exista (multer não cria recursivamente)
const UPLOAD_DIR = path.join(process.cwd(), 'public/uploads/itineraries');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

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
// histórico (diskStorage em public/uploads) permanece intacto.
const useCloudStorage = isCloudStorageEnabled();

const storage = useCloudStorage
    ? multer.memoryStorage()
    : multer.diskStorage({
        destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
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

/**
 * Resolve a URL pública final de um arquivo já validado pelo multer.
 *
 * - Disco (modo atual): o multer já gravou em public/uploads/itineraries e
 *   preencheu `file.filename`; a URL aponta para o express.static do host.
 * - Cloud: o arquivo está em `file.buffer` (memoryStorage); geramos o nome
 *   com o mesmo esquema histórico e subimos para o Supabase Storage.
 */
async function persistUploadedFile(
    req: express.Request,
    file: Express.Multer.File,
): Promise<{ url: string; filename: string }> {
    if (!useCloudStorage) {
        const host = `${req.protocol}://${req.get('host')}`;
        return { url: `${host}/uploads/itineraries/${file.filename}`, filename: file.filename };
    }
    const filename = generateFilename(file.fieldname, file.originalname);
    const contentType = contentTypeForFilename(file.originalname, file.mimetype);
    const { url } = await uploadBufferToCloud(file.buffer, `itineraries/${filename}`, contentType);
    return { url, filename };
}

async function readUploadedBuffer(file: Express.Multer.File): Promise<Buffer> {
    if (file.buffer) return file.buffer;
    if (file.path) return fs.promises.readFile(file.path);
    throw new Error('UPLOAD_CONTENT_UNAVAILABLE');
}

async function cleanupLocalFiles(files: Express.Multer.File[]): Promise<void> {
    if (useCloudStorage) return;
    await Promise.all(files.map(async file => {
        if (!file.path) return;
        try {
            await fs.promises.unlink(file.path);
        } catch {
            // O arquivo pode já ter sido removido; não mascara o erro original.
        }
    }));
}

async function validateUploadedContent(file: Express.Multer.File): Promise<boolean> {
    const buffer = await readUploadedBuffer(file);
    return hasValidFileSignature(buffer, file.originalname);
}

// POST /api/uploads — upload de um único arquivo, retorna URL absoluta
router.post('/', optionalAuthMiddleware, (req: AuthRequest, res) => {
    if (!req.traveler) {
        res.status(401).json({ error: 'Autenticação necessária para fazer upload' });
        return;
    }
    upload.single('file')(req, res, async (err) => {
        if (sendUploadError(res, err)) return;
        if (!req.file) {
            res.status(400).json({ error: 'Arquivo ausente (campo "file")' });
            return;
        }
        try {
            if (!await validateUploadedContent(req.file)) {
                await cleanupLocalFiles([req.file]);
                res.status(415).json({ error: 'O conteúdo do arquivo não corresponde ao formato informado.' });
                return;
            }
            const { url, filename } = await persistUploadedFile(req, req.file);
            res.json({
                url,
                filename,
                originalName: req.file.originalname,
                size: req.file.size,
                mimetype: req.file.mimetype,
                mediaType: inferMediaType(req.file.mimetype, req.file.originalname),
            });
        } catch (uploadErr) {
            console.error('Error persisting upload:', uploadErr);
            res.status(500).json({ error: 'Não foi possível salvar o arquivo. Tente novamente.' });
        }
    });
});

// POST /api/uploads/multiple — upload de múltiplos arquivos
router.post('/multiple', optionalAuthMiddleware, (req: AuthRequest, res) => {
    if (!req.traveler) {
        res.status(401).json({ error: 'Autenticação necessária para fazer upload' });
        return;
    }
    upload.array('files', 20)(req, res, async (err) => {
        if (sendUploadError(res, err)) return;
        const files = (req.files as Express.Multer.File[] | undefined) || [];
        if (files.length === 0) {
            res.status(400).json({ error: 'Nenhum arquivo enviado (campo "files")' });
            return;
        }
        try {
            const validations = await Promise.all(files.map(validateUploadedContent));
            if (validations.some(valid => !valid)) {
                await cleanupLocalFiles(files);
                res.status(415).json({ error: 'Um dos arquivos não corresponde ao formato informado.' });
                return;
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
            res.status(500).json({ error: 'Não foi possível salvar os arquivos. Tente novamente.' });
        }
    });
});

export default router;

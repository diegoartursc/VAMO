import { Router, Request, Response } from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import prisma from '../lib/prisma';
import { hashPassword, comparePassword, generateAccessToken, generateRefreshToken, verifyToken } from '../lib/auth';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { sendWelcomeEmail, sendPasswordResetEmail, sendPasswordChangedEmail, buildPasswordResetUrl } from '../lib/mailer';
import { isCloudStorageEnabled, uploadBufferToCloud, contentTypeForFilename } from '../lib/storage';
import { hasValidFileSignature } from '../lib/file-signature';

const router = Router();

// ─── VALIDATION SCHEMAS ───
// Política única de senha: cadastro e redefinição usam o mesmo schema.
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');
const emailSchema = z.string().trim().toLowerCase().email('Invalid email');

const travelerRegisterSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: emailSchema,
    password: passwordSchema,
    // Campos opcionais — quando presentes, cria também um Creator vinculado
    profileName: z.string().min(2).optional(),
    cpf: z.string().optional(),
    phone: z.string().optional(),
});

const travelerLoginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required'),
});

// ─── TYPES ───
export interface TravelerAuthRequest extends Request {
    traveler?: {
        travelerId: string;
        email: string;
        name: string;
    };
}

// ─── POST /api/auth/traveler/register ───
router.post('/register', async (req: Request, res: Response) => {
    try {
        const validatedData = travelerRegisterSchema.parse(req.body);

        // Check if email already exists
        const existingTraveler = await prisma.traveler.findFirst({
            where: { email: { equals: validatedData.email, mode: 'insensitive' } },
        });

        if (existingTraveler) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Hash password
        const passwordHash = await hashPassword(validatedData.password);

        // Create traveler + creator em transação
        const result = await prisma.$transaction(async (tx) => {
            const traveler = await tx.traveler.create({
                data: {
                    name: validatedData.name,
                    email: validatedData.email,
                    passwordHash,
                    authProvider: 'EMAIL',
                },
            });

            // Se profileName veio no payload → também cria Creator. Nome de
            // exibição não é bio — bio pública começa vazia (ver creatorBio.ts).
            let creator: { id: string } | null = null;
            if (validatedData.profileName) {
                creator = await (tx.creator as any).create({
                    data: {
                        travelerId: traveler.id,
                        bio: '',
                        verificationLevel: 'BASIC',
                    },
                    select: { id: true },
                });
            }
            return { traveler, creator };
        });

        const { traveler, creator } = result;

        // Generate tokens
        const accessToken = generateAccessToken({
            travelerId: traveler.id,
            email: traveler.email,
        });
        const refreshToken = generateRefreshToken({
            travelerId: traveler.id,
            email: traveler.email,
        });

        console.log('[traveler-auth.register]', { travelerId: traveler.id, creatorId: creator?.id, email: traveler.email });
        void sendWelcomeEmail(traveler.email, traveler.name);

        res.json({
            message: 'Traveler registered successfully',
            traveler: {
                id: traveler.id,
                name: traveler.name,
                email: traveler.email,
                avatar: traveler.avatar,
                coverUrl: (traveler as any).coverUrl ?? null,
            },
            creator: creator ? { id: creator.id } : null,
            accessToken,
            refreshToken,
        });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(422).json({
                error: 'Validation failed',
                details: error.flatten().fieldErrors,
            });
        }
        console.error('Traveler register error:', error);
        res.status(500).json({ error: 'Failed to register traveler' });
    }
});

// ─── POST /api/auth/traveler/login ───
router.post('/login', async (req: Request, res: Response) => {
    try {
        const validatedData = travelerLoginSchema.parse(req.body);

        // Find traveler by email (include creator if exists)
        // Case-insensitive: contas antigas podem ter sido gravadas com maiúsculas.
        const traveler = await prisma.traveler.findFirst({
            where: { email: { equals: validatedData.email, mode: 'insensitive' } },
            include: { creator: { select: { id: true, verificationLevel: true } } },
        });

        if (!traveler || !traveler.passwordHash) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Verify password
        const isPasswordValid = await comparePassword(validatedData.password, traveler.passwordHash);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate tokens
        const accessToken = generateAccessToken({
            travelerId: traveler.id,
            email: traveler.email,
        });
        const refreshToken = generateRefreshToken({
            travelerId: traveler.id,
            email: traveler.email,
        });

        res.json({
            message: 'Login successful',
            traveler: {
                id: traveler.id,
                name: traveler.name,
                email: traveler.email,
                avatar: traveler.avatar,
                coverUrl: (traveler as any).coverUrl ?? null,
            },
            creator: traveler.creator
                ? { id: traveler.creator.id, verificationLevel: traveler.creator.verificationLevel }
                : null,
            accessToken,
            refreshToken,
        });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(422).json({
                error: 'Validation failed',
                details: error.flatten().fieldErrors,
            });
        }
        console.error('Traveler login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// ─── POST /api/auth/traveler/refresh ───
router.post('/refresh', async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token is required' });
        }

        const decoded = verifyToken(refreshToken);
        if (!decoded || typeof decoded === 'string') {
            return res.status(401).json({ error: 'Invalid refresh token' });
        }

        // Check if traveler still exists
        const traveler = await prisma.traveler.findUnique({
            where: { id: (decoded as any).travelerId },
        });

        if (!traveler) {
            return res.status(401).json({ error: 'Traveler not found' });
        }

        // Refresh emitido antes da última troca de senha não vale mais: sessões
        // antigas caem quando o access token (24h) expira.
        const issuedAt = (decoded as any).iat as number | undefined;
        if (traveler.passwordChangedAt && (!issuedAt || issuedAt < Math.floor(traveler.passwordChangedAt.getTime() / 1000))) {
            return res.status(401).json({ error: 'Session expired. Please log in again.' });
        }

        // Generate new access token
        const newAccessToken = generateAccessToken({
            travelerId: traveler.id,
            email: traveler.email,
        });

        res.json({
            accessToken: newAccessToken,
        });
    } catch (error) {
        console.error('Traveler refresh error:', error);
        res.status(500).json({ error: 'Failed to refresh token' });
    }
});

// ─── ESQUECI MINHA SENHA ───
// Token: 32 bytes aleatórios (base64url) no link do e-mail; no banco só o
// SHA-256. Uso único (a linha é apagada ao consumir), validade de 1 hora e só
// o token mais recente de cada traveler vale.
const RESET_TOKEN_TTL_MINUTES = 60;
const RESET_EMAIL_COOLDOWN_MS = 60 * 1000;
const FORGOT_PASSWORD_MESSAGE = 'Se existir uma conta associada a este e-mail, enviaremos as instruções para redefinir sua senha.';
const INVALID_RESET_LINK_MESSAGE = 'Este link é inválido ou expirou. Solicite uma nova redefinição de senha.';

const hashResetToken = (raw: string) => crypto.createHash('sha256').update(raw).digest('hex');

const forgotPasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Muitas solicitações. Aguarde alguns minutos e tente novamente.' },
});

const resetPasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' },
});

const forgotPasswordSchema = z.object({ email: emailSchema });
const resetPasswordSchema = z.object({
    token: z.string().trim().min(20).max(200),
    password: passwordSchema,
});

class InvalidResetTokenError extends Error {}

// ─── POST /api/auth/traveler/forgot-password ───
router.post('/forgot-password', forgotPasswordLimiter, async (req: Request, res: Response) => {
    let email: string;
    try {
        email = forgotPasswordSchema.parse(req.body).email;
    } catch {
        return res.status(422).json({ error: 'Informe um e-mail válido.' });
    }

    // Resposta idêntica com ou sem conta (evita enumeração de e-mails). O
    // trabalho real roda depois da resposta, então o tempo também não denuncia.
    res.json({ message: FORGOT_PASSWORD_MESSAGE });

    try {
        const traveler = await prisma.traveler.findFirst({
            where: { email: { equals: email, mode: 'insensitive' } },
            select: { id: true, email: true, name: true, authProvider: true },
        });
        // Contas de login social não têm senha para redefinir.
        if (!traveler || traveler.authProvider !== 'EMAIL') return;

        const latest = await prisma.passwordResetToken.findFirst({
            where: { travelerId: traveler.id },
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true },
        });
        if (latest && Date.now() - latest.createdAt.getTime() < RESET_EMAIL_COOLDOWN_MS) return;

        const rawToken = crypto.randomBytes(32).toString('base64url');
        await prisma.$transaction([
            prisma.passwordResetToken.deleteMany({ where: { travelerId: traveler.id } }),
            prisma.passwordResetToken.create({
                data: {
                    travelerId: traveler.id,
                    tokenHash: hashResetToken(rawToken),
                    expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000),
                },
            }),
        ]);

        const sent = await sendPasswordResetEmail({
            to: traveler.email,
            name: traveler.name,
            resetUrl: buildPasswordResetUrl(rawToken),
            expiresInMinutes: RESET_TOKEN_TTL_MINUTES,
        });
        if (!sent) console.error(`[forgot-password] e-mail de recuperação não enviado (traveler ${traveler.id})`);
    } catch (error: any) {
        console.error('[forgot-password] erro interno:', error?.message || error);
    }
});

// ─── POST /api/auth/traveler/reset-password ───
router.post('/reset-password', resetPasswordLimiter, async (req: Request, res: Response) => {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
        const fields = parsed.error.flatten().fieldErrors;
        if (fields.password) {
            return res.status(422).json({ error: 'A senha precisa ter pelo menos 6 caracteres.' });
        }
        return res.status(400).json({ error: INVALID_RESET_LINK_MESSAGE });
    }
    const { token, password } = parsed.data;

    try {
        const record = await prisma.passwordResetToken.findUnique({
            where: { tokenHash: hashResetToken(token) },
            select: { id: true, travelerId: true, expiresAt: true },
        });
        if (!record || record.expiresAt.getTime() <= Date.now()) {
            return res.status(400).json({ error: INVALID_RESET_LINK_MESSAGE });
        }

        const passwordHash = await hashPassword(password);
        const changedAt = new Date();
        const owner = await prisma.$transaction(async (tx) => {
            // Consumo atômico: numa corrida, só uma transação apaga a linha.
            const consumed = await tx.passwordResetToken.deleteMany({
                where: { id: record.id, expiresAt: { gt: new Date() } },
            });
            if (consumed.count !== 1) throw new InvalidResetTokenError();

            const t = await tx.traveler.update({
                where: { id: record.travelerId },
                data: { passwordHash, passwordChangedAt: changedAt },
                select: { email: true, name: true },
            });
            await tx.passwordResetToken.deleteMany({ where: { travelerId: record.travelerId } });
            return t;
        });

        console.log(`[reset-password] senha redefinida (traveler ${record.travelerId})`);
        // Um aviso por token consumido: só a transação que apagou o token chega aqui.
        void sendPasswordChangedEmail({ to: owner.email, name: owner.name, changedAt });
        res.json({ message: 'Senha alterada com sucesso.' });
    } catch (error: any) {
        if (error instanceof InvalidResetTokenError) {
            return res.status(400).json({ error: INVALID_RESET_LINK_MESSAGE });
        }
        console.error('[reset-password] erro interno:', error?.message || error);
        res.status(500).json({ error: 'Não foi possível redefinir a senha agora. Tente novamente.' });
    }
});

// ─── GET /api/auth/traveler/me ───
router.get('/me', async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }
        const token = authHeader.substring(7);
        const decoded = verifyToken(token);
        if (!decoded || typeof decoded === 'string' || !(decoded as any).travelerId) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        const traveler = await prisma.traveler.findUnique({
            where: { id: (decoded as any).travelerId },
            include: {
                creator: { select: { id: true, verificationLevel: true } },
                personalData: { select: { phone: true } },
            },
        });

        if (!traveler) {
            return res.status(404).json({ error: 'Traveler not found' });
        }

        res.json({
            traveler: {
                id: traveler.id,
                name: traveler.name,
                email: traveler.email,
                avatar: traveler.avatar,
                coverUrl: (traveler as any).coverUrl ?? null,
                bio: traveler.bio,
                phone: traveler.personalData?.phone ?? null,
            },
            creator: traveler.creator
                ? { id: traveler.creator.id, verificationLevel: traveler.creator.verificationLevel }
                : null,
        });
    } catch (error) {
        console.error('Traveler /me error:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// ─── GET /api/auth/traveler/passport-stats ───────────────────────
// Contadores reais do usuário logado para o Passaporte VAMO. Esta rota não
// concede XP; ela só agrega ações persistidas do próprio traveler.
router.get('/passport-stats', async (req: Request, res: Response) => {
    try {
        const travelerId = authTravelerIdFromHeader(req);
        if (!travelerId) return res.status(401).json({ error: 'No token provided' });

        const traveler = await prisma.traveler.findUnique({
            where: { id: travelerId },
            select: { id: true, name: true, email: true, avatar: true },
        });
        if (!traveler) return res.status(404).json({ error: 'Traveler not found' });

        const creator = await (prisma.creator as any).findUnique({
            where: { travelerId },
            select: { id: true },
        });
        const creatorId = creator?.id ?? null;
        const publishedStatuses = ['ACTIVE', 'APPROVED'];

        const [
            savedCount,
            uniquePurchases,
            questionsCount,
            sharedCount,
            reviewsCount,
            reviewsWithPhotoCount,
            customizedPurchasedItinerariesCount,
            creatorItineraries,
            ownItinerarySharesCount,
        ] = await Promise.all([
            prisma.savedItem.count({ where: { travelerId, itineraryId: { not: null } } }),
            prisma.itinerarySale.findMany({
                where: { travelerId },
                distinct: ['itineraryId'],
                select: { itineraryId: true },
            }),
            prisma.faqQuestion.count({ where: { travelerId, itineraryId: { not: null } } }),
            (prisma as any).itineraryShare.count({
                where: { travelerId, status: 'completed' },
            }),
            prisma.review.count({ where: { travelerId, itineraryId: { not: null } } }),
            prisma.review.count({
                where: { travelerId, itineraryId: { not: null }, images: { some: {} } },
            }),
            prisma.travelerItineraryCustomization.count({ where: { travelerId } }),
            creatorId
                ? prisma.itinerary.findMany({
                    where: { creatorId },
                    select: {
                        id: true,
                        status: true,
                        featured: true,
                        qualityScore: true,
                        sales: { select: { id: true } },
                    },
                })
                : Promise.resolve([]),
            creatorId
                ? (prisma as any).itineraryShare.count({
                    where: {
                        travelerId,
                        creatorId,
                        actorRole: 'creator',
                        status: 'completed',
                    },
                })
                : Promise.resolve(0),
        ]);

        const published = creatorItineraries.filter((it: any) =>
            publishedStatuses.includes(String(it.status || '').toUpperCase()),
        );
        const creatorSalesCount = creatorItineraries.reduce(
            (sum: number, it: any) => sum + (Array.isArray(it.sales) ? it.sales.length : 0),
            0,
        );

        res.json({
            profileCompleted: !!(traveler.name && traveler.email && traveler.avatar),
            savedCount,
            questionsCount,
            sharedCount,
            purchasesCount: uniquePurchases.length,
            customizedPurchasedItinerariesCount,
            reviewsCount,
            reviewsWithPhotoCount,
            publishedItinerariesCount: published.length,
            approvedItinerariesCount: published.length,
            ownItinerarySharesCount,
            creatorSalesCount,
            featuredItinerariesCount: published.filter((it: any) => !!it.featured).length,
            maxPublishedItineraryQualityScore: published.reduce(
                (max: number, it: any) => Math.max(max, Number(it.qualityScore) || 0),
                0,
            ),
            // cartCount é estado local do app mobile; o Perfil combina este
            // retorno com useCart() para manter o contador real do dispositivo.
        });
    } catch (error) {
        console.error('[traveler-auth.passport-stats] error', error);
        res.status(500).json({ error: 'Failed to fetch passport stats' });
    }
});

// ─── PATCH /api/auth/traveler/me ─────────────────────────────────
// Edita dados básicos do próprio usuário logado (nome, telefone, bio).
// E-mail e identidade ficam read-only nesta rota — alteração de e-mail
// exige fluxo de confirmação separado que ainda não existe.
const updateTravelerSchema = z.object({
    name: z.string().trim().min(2, 'Nome deve ter pelo menos 2 caracteres').max(80).optional(),
    phone: z.string().trim().max(40).nullable().optional(),
    bio: z.string().trim().max(500).nullable().optional(),
});

router.patch('/me', async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }
        const decoded = verifyToken(authHeader.substring(7));
        if (!decoded || typeof decoded === 'string' || !(decoded as any).travelerId) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        const travelerId = (decoded as any).travelerId as string;

        const data = updateTravelerSchema.parse(req.body || {});
        // Filtra apenas chaves enviadas — evita sobrescrever com undefined.
        const updateData: Record<string, unknown> = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.bio !== undefined) updateData.bio = data.bio;
        // Phone vive em TravelerPersonalData (relação 1:1 opcional). Sem ela,
        // ignoramos por enquanto — uma migration futura pode mover phone pra
        // o Traveler direto. Para esta versão, aceitamos o campo mas só
        // persistimos se já existir o registro.
        const updated = await prisma.traveler.update({
            where: { id: travelerId },
            data: updateData,
            include: {
                creator: { select: { id: true, verificationLevel: true } },
                personalData: { select: { phone: true } },
            },
        });

        if (data.phone !== undefined) {
            const phoneValue = data.phone === null ? null : data.phone.trim() || null;
            if (updated.personalData) {
                await (prisma as any).travelerPersonalData.update({
                    where: { travelerId: updated.id },
                    data: { phone: phoneValue },
                });
            } else if (phoneValue) {
                await (prisma as any).travelerPersonalData.create({
                    data: { travelerId: updated.id, phone: phoneValue },
                });
            }
        }

        // Recarrega para devolver o phone atualizado de forma consistente.
        const fresh = await prisma.traveler.findUnique({
            where: { id: travelerId },
            include: {
                creator: { select: { id: true, verificationLevel: true } },
                personalData: { select: { phone: true } },
            },
        });
        if (!fresh) {
            return res.status(404).json({ error: 'Traveler not found' });
        }

        res.json({
            traveler: {
                id: fresh.id,
                name: fresh.name,
                email: fresh.email,
                avatar: fresh.avatar,
                coverUrl: (fresh as any).coverUrl ?? null,
                bio: fresh.bio,
                phone: fresh.personalData?.phone ?? null,
            },
            creator: fresh.creator
                ? { id: fresh.creator.id, verificationLevel: fresh.creator.verificationLevel }
                : null,
        });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(422).json({
                error: 'Validation failed',
                details: error.flatten().fieldErrors,
            });
        }
        console.error('[traveler-auth.patch.me] error', error);
        res.status(500).json({ error: 'Failed to update traveler' });
    }
});

// ─── PATCH /api/auth/traveler/me/avatar e /me/cover ──────────────
// Upload de foto de perfil (avatar) e foto de capa (cover) do viajante.
//
// Estratégia: reaproveita a mesma infra do /api/uploads (multer + Supabase
// Storage cloud OU disco local), aplica limites menores específicos por
// caso (avatar 5 MB, cover 8 MB), valida assinatura mágica do arquivo
// (file-signature) e grava `avatar` ou `coverUrl` direto no Traveler.
//
// O endpoint NUNCA aceita atualizar usuário diferente do dono do token —
// derivamos o travelerId do JWT, não do body.

const PROFILE_IMAGE_MIME = /^image\/(jpeg|png|webp|heic|heif|heic-sequence|heif-sequence)$/;
const PROFILE_IMAGE_EXT = /\.(jpe?g|png|webp|heic|heif)$/i;
const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
const COVER_MAX_BYTES  = 8 * 1024 * 1024;

// Garante diretório local — mesma estratégia do /api/uploads. Quando o
// Supabase Storage está ligado (prod), o multer usa memoryStorage e este
// diretório fica ocioso.
const PROFILE_LOCAL_DIR = path.join(process.cwd(), 'public/uploads/profile');
fs.mkdirSync(PROFILE_LOCAL_DIR, { recursive: true });

const useCloudStorageProfile = isCloudStorageEnabled();

function profileStorage(): multer.StorageEngine {
    if (useCloudStorageProfile) return multer.memoryStorage();
    return multer.diskStorage({
        destination: (_req, _file, cb) => cb(null, PROFILE_LOCAL_DIR),
        filename: (_req, file, cb) => {
            const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
            const safeExt = path.extname(file.originalname || '').toLowerCase().replace(/[^a-z0-9.]/g, '');
            cb(null, `${file.fieldname}-${unique}${safeExt}`);
        },
    });
}

/** Constrói um middleware multer com limite específico (avatar ou cover). */
function buildProfileImageUpload(maxBytes: number) {
    return multer({
        storage: profileStorage(),
        limits: { fileSize: maxBytes },
        fileFilter: (_req, file, cb) => {
            const mimeOk = PROFILE_IMAGE_MIME.test(file.mimetype);
            const extOk  = PROFILE_IMAGE_EXT.test(file.originalname || '');
            if (!mimeOk && !extOk) {
                cb(new Error('UNSUPPORTED_FILE_TYPE'));
                return;
            }
            cb(null, true);
        },
    });
}

function sendUploadError(res: Response, err: unknown, max: number): boolean {
    if (!err) return false;
    const error = err as Error & { code?: string };
    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
        const mb = Math.round(max / (1024 * 1024));
        res.status(413).json({ error: `Imagem muito grande (máx ${mb} MB).` });
        return true;
    }
    if (error.message === 'UNSUPPORTED_FILE_TYPE') {
        res.status(415).json({ error: 'Formato não suportado. Use JPG, PNG, WEBP ou HEIC.' });
        return true;
    }
    res.status(400).json({ error: error.message || 'Não foi possível processar o upload.' });
    return true;
}

async function readUploadedBuffer(file: Express.Multer.File): Promise<Buffer> {
    if (file.buffer) return file.buffer;
    if (file.path) return fs.promises.readFile(file.path);
    throw new Error('UPLOAD_CONTENT_UNAVAILABLE');
}

async function persistProfileImage(
    req: Request,
    file: Express.Multer.File,
    kind: 'avatar' | 'cover',
): Promise<string> {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const safeExt = path.extname(file.originalname || '').toLowerCase().replace(/[^a-z0-9.]/g, '') || '.jpg';
    const filename = `${kind}-${unique}${safeExt}`;

    if (!useCloudStorageProfile) {
        // Multer já gravou o arquivo no disco com nome temporário; renomeamos
        // para o esquema canônico para que a URL pública fique previsível.
        if (file.path) {
            const finalPath = path.join(PROFILE_LOCAL_DIR, filename);
            await fs.promises.rename(file.path, finalPath);
        } else {
            const buffer = await readUploadedBuffer(file);
            await fs.promises.writeFile(path.join(PROFILE_LOCAL_DIR, filename), buffer);
        }
        const host = `${req.protocol}://${req.get('host')}`;
        return `${host}/uploads/profile/${filename}`;
    }

    const buffer = await readUploadedBuffer(file);
    const contentType = contentTypeForFilename(file.originalname, file.mimetype);
    const { url } = await uploadBufferToCloud(buffer, `profile/${filename}`, contentType);
    return url;
}

function authTravelerIdFromHeader(req: Request): string | null {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const decoded = verifyToken(authHeader.substring(7));
    if (!decoded || typeof decoded === 'string') return null;
    const travelerId = (decoded as any).travelerId;
    return typeof travelerId === 'string' ? travelerId : null;
}

function buildProfileImageHandler(kind: 'avatar' | 'cover') {
    const maxBytes = kind === 'avatar' ? AVATAR_MAX_BYTES : COVER_MAX_BYTES;
    const upload = buildProfileImageUpload(maxBytes);
    const dbField = kind === 'avatar' ? 'avatar' : 'coverUrl';

    return (req: Request, res: Response) => {
        const travelerId = authTravelerIdFromHeader(req);
        if (!travelerId) {
            res.status(401).json({ error: 'Autenticação necessária' });
            return;
        }

        upload.single('file')(req, res, async (err) => {
            if (sendUploadError(res, err, maxBytes)) return;
            const file = (req as any).file as Express.Multer.File | undefined;
            if (!file) {
                res.status(400).json({ error: 'Imagem ausente (campo "file")' });
                return;
            }

            try {
                const buffer = await readUploadedBuffer(file);
                if (!hasValidFileSignature(buffer, file.originalname)) {
                    if (file.path) await fs.promises.unlink(file.path).catch(() => {});
                    res.status(415).json({ error: 'O conteúdo do arquivo não corresponde ao formato informado.' });
                    return;
                }

                const url = await persistProfileImage(req, file, kind);
                const updated = await prisma.traveler.update({
                    where: { id: travelerId },
                    data: { [dbField]: url } as any,
                    select: { id: true, name: true, email: true, avatar: true, coverUrl: true } as any,
                });
                res.json({ traveler: updated, url });
            } catch (uploadErr) {
                console.error(`[traveler-auth.${kind}] error`, uploadErr);
                res.status(500).json({ error: 'Não foi possível atualizar a imagem. Tente novamente.' });
            }
        });
    };
}

router.patch('/me/avatar', buildProfileImageHandler('avatar'));
router.patch('/me/cover',  buildProfileImageHandler('cover'));

export default router;

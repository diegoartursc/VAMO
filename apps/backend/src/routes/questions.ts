/**
 * Rotas de perguntas (Q&A) sobre roteiros.
 *
 * O schema Prisma já tem `FaqQuestion` + `FaqAnswer`; antes não existiam
 * endpoints — a seção "FAQ" no app era estática (mockFAQ.ts). Estes endpoints
 * destravam o fluxo: viajante pergunta → criador responde → resposta vira
 * pública em "Detalhes do Roteiro".
 *
 * Convenções:
 *  - Toda chamada de gravação exige JWT do traveler (anti-spam básico).
 *  - Perguntas SEM resposta só aparecem para o autor; respondidas são públicas.
 *  - O próprio criador não pode perguntar no próprio roteiro.
 */

import { Router, Request, Response } from 'express';
import { optionalAuthMiddleware, AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';

const router = Router();

const MIN_QUESTION_LEN = 5;
const MAX_QUESTION_LEN = 500;
const MAX_ANSWER_LEN = 1000;

/** Janela mínima entre perguntas do mesmo usuário no mesmo roteiro (segundos). */
const ANTI_SPAM_WINDOW_SECONDS = 30;

// ─── POST /api/questions ────────────────────────────────────────
// Cria uma nova pergunta. Exige autenticação.
router.post('/', optionalAuthMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const travelerId = req.traveler?.travelerId;
        if (!travelerId) {
            return res.status(401).json({ error: 'Autenticação necessária para enviar pergunta' });
        }

        const { itineraryId, questionText } = req.body || {};
        const text = typeof questionText === 'string' ? questionText.trim() : '';

        if (!itineraryId || typeof itineraryId !== 'string') {
            return res.status(400).json({ error: 'itineraryId é obrigatório' });
        }
        if (!text) {
            return res.status(400).json({ error: 'Digite sua pergunta antes de enviar' });
        }
        if (text.length < MIN_QUESTION_LEN) {
            return res.status(400).json({ error: 'Escreva uma pergunta um pouco mais completa' });
        }
        if (text.length > MAX_QUESTION_LEN) {
            return res.status(400).json({ error: `Pergunta deve ter no máximo ${MAX_QUESTION_LEN} caracteres` });
        }

        // Roteiro existe e tem criador?
        const itinerary = await prisma.itinerary.findUnique({
            where: { id: itineraryId },
            select: {
                id: true,
                title: true,
                status: true,
                creator: { select: { travelerId: true } },
            },
        });
        if (!itinerary) {
            return res.status(404).json({ error: 'Roteiro não encontrado' });
        }
        if (!['APPROVED', 'ACTIVE'].includes(itinerary.status)) {
            return res.status(400).json({ error: 'Este roteiro ainda não está disponível para perguntas' });
        }
        // Criador não pode perguntar no próprio roteiro.
        if (itinerary.creator?.travelerId === travelerId) {
            return res.status(403).json({ error: 'Você é o criador deste roteiro' });
        }

        // Anti-spam básico: bloqueia envio repetido em menos de X segundos.
        const recent = await prisma.faqQuestion.findFirst({
            where: { travelerId, itineraryId },
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true },
        });
        if (recent) {
            const elapsed = (Date.now() - recent.createdAt.getTime()) / 1000;
            if (elapsed < ANTI_SPAM_WINDOW_SECONDS) {
                return res.status(429).json({
                    error: 'Você acabou de enviar uma pergunta. Aguarde alguns segundos antes de enviar outra.',
                });
            }
        }

        const question = await prisma.faqQuestion.create({
            data: { travelerId, itineraryId, question: text },
        });

        if (itinerary.creator?.travelerId) {
            prisma.notification.create({
                data: {
                    travelerId: itinerary.creator.travelerId,
                    type: 'SYSTEM',
                    title: 'Nova pergunta recebida',
                    body: `Você recebeu uma nova pergunta no roteiro ${itinerary.title}.`,
                    data: {
                        questionId: question.id,
                        itineraryId,
                        source: 'itinerary_question',
                    },
                },
            }).catch((error) => {
                console.warn('Failed to create question notification:', error);
            });
        }

        res.status(201).json({
            question: {
                id: question.id,
                itineraryId: question.itineraryId,
                question: question.question,
                createdAt: question.createdAt.toISOString(),
                answer: null,
            },
        });
    } catch (error) {
        console.error('Error creating question:', error);
        res.status(500).json({ error: 'Falha ao enviar pergunta' });
    }
});

// ─── GET /api/questions/itinerary/:id ───────────────────────────
// Lista perguntas de um roteiro. Retorna:
//   - Todas as perguntas RESPONDIDAS (públicas)
//   - As perguntas PENDENTES do próprio usuário (se autenticado)
router.get('/itinerary/:id', optionalAuthMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const itineraryId = req.params.id as string;
        const travelerId = req.traveler?.travelerId;

        const questions: any[] = await prisma.faqQuestion.findMany({
            where: { itineraryId },
            include: {
                answers: { orderBy: { createdAt: 'asc' }, take: 1 },
                traveler: { select: { id: true, name: true, avatar: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        // Filtra: respondida (todas) OU pertence ao usuário atual.
        const filtered = questions.filter(q => {
            const hasAnswer = q.answers.length > 0;
            const isMine = travelerId && q.travelerId === travelerId;
            return hasAnswer || isMine;
        });

        const result = filtered.map(q => {
            const answer = q.answers[0];
            return {
                id: q.id,
                itineraryId: q.itineraryId,
                question: q.question,
                createdAt: q.createdAt.toISOString(),
                user: { id: q.traveler?.id, name: q.traveler?.name, avatar: q.traveler?.avatar },
                isMine: travelerId === q.travelerId,
                answer: answer
                    ? {
                          id: answer.id,
                          text: answer.answer,
                          createdAt: answer.createdAt.toISOString(),
                      }
                    : null,
                status: answer ? 'answered' : 'pending',
            };
        }).sort((a, b) => {
            if (a.status !== b.status) return a.status === 'answered' ? -1 : 1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        res.json({ questions: result });
    } catch (error) {
        console.error('Error fetching itinerary questions:', error);
        res.status(500).json({ error: 'Falha ao carregar perguntas' });
    }
});

// ─── GET /api/questions/mine ────────────────────────────────────
// Perguntas que o usuário autenticado fez (todas, com roteiro e resposta).
router.get('/mine', optionalAuthMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const travelerId = req.traveler?.travelerId;
        if (!travelerId) {
            return res.status(401).json({ error: 'Autenticação necessária' });
        }

        const questions: any[] = await prisma.faqQuestion.findMany({
            where: { travelerId },
            include: {
                answers: { orderBy: { createdAt: 'asc' }, take: 1 },
                itinerary: {
                    select: {
                        id: true, title: true, destination: true, country: true,
                        images: { orderBy: { order: 'asc' }, take: 1, select: { url: true } },
                        creator: { include: { traveler: { select: { name: true } } } },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        const result = questions.map(q => {
            const answer = q.answers[0];
            return {
                id: q.id,
                question: q.question,
                createdAt: q.createdAt.toISOString(),
                answer: answer
                    ? { text: answer.answer, createdAt: answer.createdAt.toISOString() }
                    : null,
                status: answer ? 'answered' : 'pending',
                itinerary: q.itinerary
                    ? {
                          id: q.itinerary.id,
                          title: q.itinerary.title,
                          destination: q.itinerary.destination,
                          country: q.itinerary.country,
                          image: q.itinerary.images[0]?.url || null,
                          creatorName: q.itinerary.creator?.traveler?.name || 'Criador VAMO',
                      }
                    : null,
            };
        });

        res.json({ questions: result });
    } catch (error) {
        console.error('Error fetching user questions:', error);
        res.status(500).json({ error: 'Falha ao carregar perguntas' });
    }
});

// ─── GET /api/questions/creator/mine ────────────────────────────
// Perguntas recebidas nos roteiros do criador autenticado.
router.get('/creator/mine', optionalAuthMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const travelerId = req.traveler?.travelerId;
        if (!travelerId) {
            return res.status(401).json({ error: 'Autenticação necessária' });
        }

        const creator = await prisma.creator.findUnique({
            where: { travelerId },
            select: { id: true },
        });
        if (!creator) {
            return res.status(403).json({ error: 'Apenas criadores podem ver esta área' });
        }

        const questions: any[] = await prisma.faqQuestion.findMany({
            where: { itinerary: { creatorId: creator.id } },
            include: {
                answers: { orderBy: { createdAt: 'asc' }, take: 1 },
                traveler: { select: { id: true, name: true, avatar: true } },
                itinerary: { select: { id: true, title: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        const result = questions.map(q => {
            const answer = q.answers[0];
            return {
                id: q.id,
                question: q.question,
                createdAt: q.createdAt.toISOString(),
                user: { id: q.traveler?.id, name: q.traveler?.name, avatar: q.traveler?.avatar },
                itinerary: q.itinerary
                    ? { id: q.itinerary.id, title: q.itinerary.title }
                    : null,
                answer: answer
                    ? { text: answer.answer, createdAt: answer.createdAt.toISOString() }
                    : null,
                status: answer ? 'answered' : 'pending',
            };
        });

        res.json({ questions: result });
    } catch (error) {
        console.error('Error fetching creator questions:', error);
        res.status(500).json({ error: 'Falha ao carregar perguntas' });
    }
});

// ─── POST /api/questions/:id/answer ─────────────────────────────
// Criador responde a uma pergunta de um roteiro seu.
router.post('/:id/answer', optionalAuthMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const travelerId = req.traveler?.travelerId;
        if (!travelerId) {
            return res.status(401).json({ error: 'Autenticação necessária' });
        }

        const { answerText } = req.body || {};
        const text = typeof answerText === 'string' ? answerText.trim() : '';
        if (!text) return res.status(400).json({ error: 'Digite sua resposta' });
        if (text.length > MAX_ANSWER_LEN) {
            return res.status(400).json({ error: `Resposta deve ter no máximo ${MAX_ANSWER_LEN} caracteres` });
        }

        const questionId = req.params.id as string;
        const question: any = await prisma.faqQuestion.findUnique({
            where: { id: questionId },
            include: {
                itinerary: { select: { creator: { select: { id: true, travelerId: true } } } },
                answers: { select: { id: true }, take: 1 },
            },
        });
        if (!question) return res.status(404).json({ error: 'Pergunta não encontrada' });

        // Apenas o criador dono do roteiro pode responder.
        if (question.itinerary?.creator?.travelerId !== travelerId) {
            return res.status(403).json({ error: 'Apenas o criador do roteiro pode responder' });
        }
        if (question.answers.length > 0) {
            return res.status(409).json({ error: 'Esta pergunta já foi respondida' });
        }

        const answer = await prisma.faqAnswer.create({
            data: {
                questionId,
                creatorId: question.itinerary.creator.id,
                answer: text,
            },
        });

        prisma.notification.create({
            data: {
                travelerId: question.travelerId,
                type: 'SYSTEM',
                title: 'Sua pergunta foi respondida',
                body: 'O criador respondeu sua pergunta sobre o roteiro.',
                data: {
                    questionId,
                    itineraryId: question.itineraryId,
                    source: 'itinerary_question_answer',
                },
            },
        }).catch((error) => {
            console.warn('Failed to create answer notification:', error);
        });

        res.status(201).json({
            answer: {
                id: answer.id,
                text: answer.answer,
                createdAt: answer.createdAt.toISOString(),
            },
        });
    } catch (error) {
        console.error('Error answering question:', error);
        res.status(500).json({ error: 'Falha ao enviar resposta' });
    }
});

export default router;

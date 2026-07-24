import { Router, Request, Response } from 'express';
import type Stripe from 'stripe';
import prisma from '../lib/prisma';
import { travelerAuthMiddleware, TravelerAuthRequest } from '../middleware/traveler-auth';
import { getStripe, APP_BASE_URL } from '../lib/stripe';
import { isGenericCreatorBio } from '../utils/creatorBio';
import { PUBLIC_ITINERARY_WHERE } from '../lib/itineraryStatus';
import { calculateCreatorLevel, CREATOR_REPUTATION_BY_KEY } from '@vamo/shared';
import {
    buildRecommendationCandidate,
    rankRecommendationCandidates,
    classifyRecommendationResult,
    splitCsv,
    normalizeMatchText,
    type RecommendationCandidate,
} from '../utils/creatorRecommendation';

const router = Router();

// ─── Stripe Connect (payouts do roteirista) ─────────────────────
// MVP sem migration: o vínculo criador→conta Connect fica na METADATA da
// própria conta Stripe (metadata.creatorId). Em escala maior, migrar para uma
// coluna `stripeAccountId` no Creator. Volume atual (poucos criadores) torna o
// scan por metadata barato e seguro.

type PayoutStatus = 'not_started' | 'pending' | 'verified' | 'restricted' | 'disabled';

/** Mapeia o estado da conta Connect para o status que a UI já conhece. */
function mapAccountStatus(account: Stripe.Account | null): {
    status: PayoutStatus;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    detailsSubmitted: boolean;
    requirementsDue: string[];
} {
    if (!account) {
        return { status: 'not_started', chargesEnabled: false, payoutsEnabled: false, detailsSubmitted: false, requirementsDue: [] };
    }
    const detailsSubmitted = !!account.details_submitted;
    const payoutsEnabled = !!account.payouts_enabled;
    const chargesEnabled = !!account.charges_enabled;
    const disabledReason = account.requirements?.disabled_reason || null;
    const requirementsDue = account.requirements?.currently_due ?? [];

    let status: PayoutStatus;
    if (payoutsEnabled && detailsSubmitted) status = 'verified';
    else if (disabledReason && disabledReason.startsWith('rejected')) status = 'disabled';
    else if (disabledReason) status = 'restricted';
    else if (detailsSubmitted || requirementsDue.length > 0) status = 'pending';
    else status = 'pending'; // conta criada mas onboarding ainda não concluído
    return { status, chargesEnabled, payoutsEnabled, detailsSubmitted, requirementsDue };
}

/** Resolve o creator do token (sem fallback). */
async function resolveCreatorFromToken(req: TravelerAuthRequest): Promise<{ id: string; travelerId: string } | null> {
    const travelerId = req.traveler?.travelerId;
    if (!travelerId) return null;
    const creator = await prisma.creator.findUnique({ where: { travelerId }, select: { id: true, travelerId: true } });
    return creator || null;
}

/** Acha a conta Connect do criador via metadata.creatorId (scan paginado). */
async function findCreatorStripeAccount(stripe: Stripe, creatorId: string): Promise<Stripe.Account | null> {
    for await (const account of stripe.accounts.list({ limit: 100 })) {
        if (account.metadata?.creatorId === creatorId) return account;
    }
    return null;
}

// GET /api/creators/me/stripe/account-status
router.get('/me/stripe/account-status', travelerAuthMiddleware, async (req: TravelerAuthRequest, res: Response) => {
    try {
        const creator = await resolveCreatorFromToken(req);
        if (!creator) { res.json({ connected: false, ...mapAccountStatus(null) }); return; }

        const stripe = getStripe();
        if (!stripe) { res.json({ connected: false, stripeConfigured: false, ...mapAccountStatus(null) }); return; }

        const account = await findCreatorStripeAccount(stripe, creator.id);
        res.json({ connected: !!account, stripeConfigured: true, accountId: account?.id ?? null, ...mapAccountStatus(account) });
    } catch (error: any) {
        console.error('[stripe.account-status] error:', error?.message);
        res.status(500).json({ error: 'Falha ao consultar status de recebimento.' });
    }
});

// POST /api/creators/me/stripe/onboarding-link
// Cria (ou recupera) a conta Connect Express do criador e devolve o link de
// onboarding hospedado pela Stripe (cadastro de banco + verificação de identidade).
router.post('/me/stripe/onboarding-link', travelerAuthMiddleware, async (req: TravelerAuthRequest, res: Response) => {
    try {
        const creator = await resolveCreatorFromToken(req);
        if (!creator) { res.status(403).json({ error: 'Perfil de roteirista não encontrado.' }); return; }

        const stripe = getStripe();
        if (!stripe) { res.status(503).json({ error: 'Recebimentos indisponíveis no momento (Stripe não configurado).' }); return; }

        const traveler = await prisma.traveler.findUnique({ where: { id: creator.travelerId }, select: { email: true } });

        let account = await findCreatorStripeAccount(stripe, creator.id);
        if (!account) {
            // Conta Express. País = padrão da plataforma (omitido). `transfers`
            // é a capability necessária para receber repasses.
            account = await stripe.accounts.create({
                type: 'express',
                email: traveler?.email || undefined,
                metadata: { creatorId: creator.id, travelerId: creator.travelerId },
                capabilities: { transfers: { requested: true } },
                business_type: 'individual',
            });
        }

        const link = await stripe.accountLinks.create({
            account: account.id,
            refresh_url: `${APP_BASE_URL}/creator-earnings?stripe=refresh`,
            return_url: `${APP_BASE_URL}/creator-earnings?stripe=return`,
            type: 'account_onboarding',
        });

        res.json({ url: link.url, accountId: account.id });
    } catch (error: any) {
        const msg: string = error?.message || '';
        console.error('[stripe.onboarding-link] error:', msg);
        // Caso comum: a plataforma ainda não fez signup do Connect no dashboard.
        if (/sign(ed)? up for Connect/i.test(msg)) {
            res.status(503).json({
                error: 'Os recebimentos ainda estão sendo ativados pela VAMO. Tente novamente em breve.',
                code: 'connect_not_enabled',
            });
            return;
        }
        res.status(500).json({ error: msg || 'Não foi possível iniciar a configuração de recebimentos.' });
    }
});

// GET /api/creators/me/earnings
router.get('/me/earnings', travelerAuthMiddleware, async (req: TravelerAuthRequest, res: Response) => {
    try {
        const creator = await prisma.creator.findUnique({
            where: { travelerId: req.traveler!.travelerId },
            include: {
                balance: true,
                itineraries: {
                    select: {
                        id: true,
                        title: true,
                        sales: {
                            select: { id: true, price: true, commission: true, createdAt: true },
                            orderBy: { createdAt: 'desc' },
                        },
                    },
                },
            },
        });
        if (!creator) {
            res.status(404).json({ error: 'Perfil de roteirista não encontrado' });
            return;
        }

        const transactions = creator.itineraries.flatMap((itinerary) =>
            itinerary.sales.map((sale) => ({
                id: sale.id,
                itineraryId: itinerary.id,
                itineraryTitle: itinerary.title,
                saleDate: sale.createdAt.toISOString(),
                grossAmount: sale.price,
                platformFee: sale.commission,
                estimatedPayout: Math.max(0, sale.price - sale.commission),
                currency: 'AUD',
                status: 'pending',
            })),
        ).sort((a, b) => b.saleDate.localeCompare(a.saleDate));

        const pendingFromSales = transactions.reduce((sum, transaction) => sum + transaction.estimatedPayout, 0);
        res.json({
            summary: {
                currency: 'AUD',
                availableBalance: creator.balance?.availableBalance ?? 0,
                pendingBalance: creator.balance?.pendingBalance ?? pendingFromSales,
                totalEarned: pendingFromSales,
                payoutAccountStatus: 'not_started',
            },
            transactions,
        });
    } catch (error) {
        console.error('Error fetching creator earnings:', error);
        res.status(500).json({ error: 'Falha ao carregar ganhos do roteirista' });
    }
});

// GET /api/creators - List all creators (single query, no N+1)
router.get('/', async (req: Request, res: Response) => {
    try {
        const creators = await (prisma.creator as any).findMany({
            include: {
                traveler: { select: { name: true, avatar: true, coverUrl: true } },
                // Vendas reais contam TODOS os status (histórico não some com
                // pausa/arquivamento) — mas a contagem pública de "roteiros
                // publicados" abaixo usa uma query separada só com ACTIVE.
                itineraries: {
                    select: { status: true, _count: { select: { sales: true } } },
                },
            },
        });

        const result = creators.map((c: any) => {
            const realTotalSales = c.itineraries.reduce(
                (sum: number, itinerary: any) => sum + itinerary._count.sales,
                0,
            );
            const publicItinerariesCount = c.itineraries.filter(
                (it: any) => it.status === PUBLIC_ITINERARY_WHERE.status,
            ).length;
            return {
                id: c.id, name: c.traveler.name, avatar: c.traveler.avatar || '👤',
                coverUrl: c.traveler.coverUrl || null,
                verificationLevel: c.verificationLevel.toLowerCase(),
                stats: {
                    itinerariesCount: publicItinerariesCount,
                    totalSales: realTotalSales, averageRating: c.averageRating,
                    responseTime: c.responseTime, tripsCompleted: c.tripsCompleted,
                },
                bio: isGenericCreatorBio(c.bio) ? null : c.bio, destinations: c.destinations,
                memberSince: c.memberSince.getFullYear().toString(),
                languages: c.languages,
                socialLinks: {
                    instagram: c.instagramUrl, youtube: c.youtubeUrl, blog: c.blogUrl,
                },
            };
        }).sort((a: any, b: any) => b.stats.totalSales - a.stats.totalSales);

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch creators' });
    }
});

// GET /api/creators/by-traveler/:travelerId — resolve creatorId a partir do travelerId
router.get('/by-traveler/:travelerId', async (req: Request, res: Response) => {
    try {
        const creator = await (prisma.creator as any).findUnique({
            where: { travelerId: req.params.travelerId },
            select: { id: true, travelerId: true, verificationLevel: true },
        });
        if (!creator) { res.status(404).json({ error: 'Creator not found for this traveler' }); return; }
        res.json({ id: creator.id, travelerId: creator.travelerId, verificationLevel: creator.verificationLevel });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch creator' });
    }
});

// ─── RECOMMENDED CREATORS ───────────────────────────────────────
// GET /api/creators/recommended
//
// Ranking real de "Criadores recomendados" (seção da tela de exploração de
// roteiros). NUNCA ordena só por vendas nem por média simples — ver
// calculateCreatorLevel/confidenceRating em @vamo/shared. Regras:
//
//  1. Elegibilidade: precisa ter ao menos 1 roteiro ACTIVE (senão não há
//     nada pra vender agora) E nível de reputação calculado >= "Roteirista
//     Recomendado" (ver CREATOR_REPUTATION_ORDER). Um criador com só
//     rascunhos/pendentes/pausados/arquivados nunca aparece aqui, mesmo
//     com histórico de vendas antigo.
//  2. Score de ranking pondera vendas reais (log1p, satura influência de
//     volume bruto), nota com confiança estatística (confidenceRating —
//     suaviza notas com poucas avaliações), o PRÓPRIO nível de reputação
//     (peso adicional, não único critério) e qualidade média dos roteiros
//     ATIVOS. `responseRatePct`/`complaintRatePct` ainda não têm dado real
//     persistido no produto — entram como 0 (nem penalizam nem promovem
//     por dado inexistente; documentado como limitação conhecida).
//  3. Bônus contextual (destino/categoria/estilo do filtro ativo) é somado
//     DEPOIS do score de reputação e é limitado (CONTEXT_BONUS_CAP) pra
//     nunca superar a diferença típica entre dois níveis de reputação —
//     um criador sem histórico nunca fica em primeiro só por ter 1 roteiro
//     no destino pesquisado, porque ele nem passa da elegibilidade.
//  4. Sem candidato elegível relacionado ao contexto → cai pros melhores
//     elegíveis GLOBAIS (nunca perfis aleatórios, nunca afrouxa o piso de
//     elegibilidade só pra preencher a seção).
router.get('/recommended', async (req: Request, res: Response) => {
    try {
        const {
            destination, country, categories, travelStyles, limit: limitParam,
        } = req.query as Record<string, string | undefined>;

        const parsedLimit = parseInt(String(limitParam ?? ''), 10);
        const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 20) : 4;

        const wantedCategories = splitCsv(categories);
        const wantedStyles = splitCsv(travelStyles);
        const wantedDestination = normalizeMatchText(destination);
        const wantedCountry = normalizeMatchText(country);
        const hasContext = !!(wantedDestination || wantedCountry || wantedCategories.length || wantedStyles.length);

        const creators = await (prisma.creator as any).findMany({
            include: {
                traveler: { select: { name: true, avatar: true, coverUrl: true } },
                itineraries: {
                    select: {
                        id: true, title: true, status: true, destination: true, country: true,
                        categories: true, travelStyles: true, qualityScore: true,
                        reviews: { select: { rating: true } },
                        _count: { select: { sales: true } },
                        images: { orderBy: { order: 'asc' }, take: 1, select: { url: true } },
                    },
                },
            },
        });

        const candidates: RecommendationCandidate[] = creators.map((c: any) => buildRecommendationCandidate(
            { ...c, itineraries: c.itineraries.map((it: any) => ({ ...it, coverImage: it.images?.[0]?.url ?? null })) },
            { wantedDestination, wantedCountry, wantedCategories, wantedStyles },
        ));

        // Fallback automático embutido no próprio score: o bônus contextual
        // só existe quando há match real — sem nenhum match no pool
        // elegível, o ranking cai naturalmente pros melhores critérios
        // GLOBAIS (nunca afrouxa elegibilidade nem mostra perfil aleatório
        // só pra preencher a seção).
        const eligible = candidates.filter((c) => c.eligible);
        const ranked = rankRecommendationCandidates(eligible, limit);
        const type = classifyRecommendationResult(ranked, hasContext);

        res.json({ type, creators: ranked.map((c) => c.payload) });
    } catch (error) {
        console.error('[creators.recommended] error:', error);
        res.status(500).json({ error: 'Failed to fetch recommended creators' });
    }
});

// GET /api/creators/:id
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const c = await (prisma.creator as any).findUnique({
            where: { id: req.params.id },
            include: {
                traveler: { select: { name: true, avatar: true, coverUrl: true } },
                itineraries: {
                    where: { ...PUBLIC_ITINERARY_WHERE },
                    include: {
                        images: { orderBy: { order: 'asc' }, take: 1, select: { url: true } },
                        _count: { select: { sales: true } },
                    },
                },
            },
        });

        if (!c) { res.status(404).json({ error: 'Creator not found' }); return; }
        // O perfil público lista apenas roteiros ativos, mas o total de
        // vendas deve preservar compras de roteiros arquivados.
        const realTotalSales = await prisma.itinerarySale.count({
            where: { itinerary: { creatorId: c.id } },
        });
        // Avaliação REAL (agregado de Review, não o campo cacheado
        // `Creator.averageRating`, que pode estar desatualizado) — mesma
        // fonte usada pelo ranking de /recommended, pra nunca divergir.
        const reviewAgg = await prisma.review.aggregate({
            where: { itinerary: { creatorId: c.id } },
            _avg: { rating: true },
            _count: { rating: true },
        });
        const realReviewCount = reviewAgg._count.rating;
        const realAverageRating = reviewAgg._avg.rating ?? 0;

        // Reputação REAL calculada — a MESMA fórmula/config de
        // /api/creators/recommended (@vamo/shared). O card de recomendado e
        // o perfil público nunca podem mostrar níveis diferentes pro mesmo
        // criador.
        const reputationLevelResult = calculateCreatorLevel({
            identityApproved: true,
            activeItineraries: c.itineraries.length,
            totalSales: realTotalSales,
            averageRating: realAverageRating,
            reviewCount: realReviewCount,
            manualAmbassador: String(c.verificationLevel).toUpperCase() === 'AMBASSADOR',
        });
        const reputationConfig = CREATOR_REPUTATION_BY_KEY[reputationLevelResult.level];

        const result = {
            id: c.id, name: c.traveler.name, avatar: c.traveler.avatar || '👤',
            coverUrl: c.traveler.coverUrl || null,
            verificationLevel: c.verificationLevel.toLowerCase(),
            // Reputação calculada (fonte de verdade). `verificationLevel`
            // acima é mantido só por compatibilidade com badges antigos que
            // ainda não migraram pra este campo — ver nota na ponte
            // VERIFICATION_TO_REPUTATION no mobile.
            reputation: {
                level: reputationConfig.level,
                label: reputationConfig.label,
                icon: reputationConfig.icon,
                color: reputationConfig.color,
            },
            stats: {
                itinerariesCount: c.itineraries.length, totalSales: realTotalSales,
                averageRating: realReviewCount > 0 ? Math.round(realAverageRating * 10) / 10 : null,
                reviewCount: realReviewCount,
                responseTime: c.responseTime,
                tripsCompleted: c.tripsCompleted,
            },
            bio: isGenericCreatorBio(c.bio) ? null : c.bio, destinations: c.destinations,
            memberSince: c.memberSince.getFullYear().toString(),
            languages: c.languages,
            socialLinks: { instagram: c.instagramUrl, youtube: c.youtubeUrl, blog: c.blogUrl },
            itineraries: c.itineraries.map((it: any) => ({
                id: it.id, title: it.title, destination: it.destination, country: it.country,
                price: it.price, currency: it.currency, rating: it.rating, reviewCount: it.reviewCount,
                duration: it.duration, images: it.images.map((img: any) => img.url),
                salesCount: it._count.sales, categories: it.categories, activeModules: it.activeModules,
            })),
        };

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch creator' });
    }
});

export default router;

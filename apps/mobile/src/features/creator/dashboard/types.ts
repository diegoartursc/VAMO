/**
 * Tipos e configuração compartilhados do Portal do Roteirista.
 * Extraído de created-itineraries.tsx (ETAPA 2 da refatoração) para manter a
 * tela principal enxuta e permitir reuso pelos sub-dashboards (vendas,
 * avaliações, configurações).
 */
import { theme } from '../../../theme/theme';

// ─── Status ────────────────────────────────────────────────────
export type ItineraryStatus =
    | 'draft' | 'pending_review' | 'approved' | 'rejected'
    | 'active' | 'paused' | 'archived';

export type FilterTab = 'all' | 'active' | 'pending_review' | 'draft' | 'rejected' | 'paused';

export interface CreatorItinerary {
    id: string;
    title: string;
    destination: string;
    country: string;
    status: ItineraryStatus;
    sales: number;
    revenue: number;
    rating: number;
    reviewCount: number;
    duration: number;
    price: number;
    qualityScore?: number;
    updatedAt: string;
    /** Setado quando o roteiro foi aprovado pelo menos uma vez — usado pra
     *  distinguir "Em análise" (primeira submissão) de "Alterações em análise"
     *  (republicação após edição). */
    approvedAt?: string | null;
}

export interface DashboardStats {
    isCreator?: boolean;
    creator?: { id: string; verificationLevel?: string };
    totalRevenue: number;
    totalSales: number;
    averageRating: number;
    totalReviews: number;
    averageQualityScore?: number | null;
    activeItineraries: number;
    publishedItineraries?: number;
    totalItineraries: number;
    itineraries: CreatorItinerary[];
}

/** Roteiro está esperando análise por causa de uma edição de algo já
 *  publicado anteriormente — não é a primeira submissão. */
export const isPendingRevisionOfPublished = (
    it: { status: ItineraryStatus; approvedAt?: string | null },
) => it.status === 'pending_review' && !!it.approvedAt;

// ─── Status config ─────────────────────────────────────────────
export const STATUS_CONFIG: Record<ItineraryStatus, { label: string; color: string; bg: string; icon: string }> = {
    draft:          { label: 'Rascunho',  color: '#64748B', bg: '#F1F5F9', icon: 'create-outline' },
    pending_review: { label: 'Em análise',color: '#D97706', bg: '#FEF3C7', icon: 'time-outline' },
    approved:       { label: 'Aprovado',  color: '#059669', bg: '#D1FAE5', icon: 'checkmark-circle-outline' },
    active:         { label: 'Publicado', color: '#059669', bg: '#D1FAE5', icon: 'checkmark-circle' },
    rejected:       { label: 'Reprovado', color: '#DC2626', bg: '#FEE2E2', icon: 'close-circle-outline' },
    paused:         { label: 'Pausado',   color: '#9333EA', bg: '#F3E8FF', icon: 'pause-circle-outline' },
    archived:       { label: 'Arquivado', color: '#94A3B8', bg: '#F8FAFC', icon: 'archive-outline' },
};

// ─── Filter tabs config ─────────────────────────────────────────
export const FILTER_TABS: { key: FilterTab; label: string; statuses: ItineraryStatus[] }[] = [
    { key: 'all',            label: 'Todos',      statuses: [] },
    { key: 'active',         label: 'Publicados', statuses: ['active', 'approved'] },
    { key: 'pending_review', label: 'Em análise', statuses: ['pending_review'] },
    { key: 'draft',          label: 'Rascunhos',  statuses: ['draft'] },
    { key: 'rejected',       label: 'Reprovados', statuses: ['rejected'] },
    { key: 'paused',         label: 'Pausados',   statuses: ['paused'] },
];

// ─── Quick action por status (no card do roteiro) ───────────────
export const QUICK_ACTION: Partial<Record<ItineraryStatus, { label: string; icon: string; color: string }>> = {
    draft:          { label: 'Continuar',    icon: 'play-circle-outline',        color: theme.colors.primary },
    rejected:       { label: 'Corrigir',     icon: 'create-outline',             color: theme.colors.error },
    pending_review: { label: 'Ver status',   icon: 'information-circle-outline',  color: '#D97706' },
    active:         { label: 'Ver detalhes', icon: 'bar-chart-outline',          color: theme.colors.success },
    paused:         { label: 'Publicar',     icon: 'play-circle-outline',        color: '#9333EA' },
};

// ─── Estados vazios por filtro ──────────────────────────────────
export const EMPTY_MESSAGES: Record<FilterTab, { icon: string; title: string; text: string }> = {
    all:            { icon: 'document-text-outline', title: 'Nenhum roteiro ainda',    text: 'Crie seu primeiro roteiro e comece a vender na VAMO.' },
    active:         { icon: 'rocket-outline',        title: 'Nenhum roteiro publicado', text: 'Envie um roteiro para análise para publicá-lo.' },
    pending_review: { icon: 'time-outline',          title: 'Nenhum em análise',       text: 'Submeta um roteiro para a equipe VAMO revisar.' },
    draft:          { icon: 'create-outline',        title: 'Sem rascunhos',           text: 'Inicie um novo roteiro para vê-lo aqui.' },
    rejected:       { icon: 'checkmark-done-outline',title: 'Nenhuma reprovação',      text: 'Ótimo! Todos os seus roteiros foram aprovados.' },
    paused:         { icon: 'play-outline',          title: 'Nenhum roteiro pausado',  text: 'Seus roteiros publicados estão todos ativos.' },
};

/**
 * Largura máxima do conteúdo no web/desktop. Container centralizado evita que
 * cards estiquem na tela inteira. Use com alignSelf:'center' + width:'100%'.
 */
export const DASHBOARD_MAX_WIDTH = 1160;
/** A partir desta largura tratamos como layout "desktop/web largo". */
export const WIDE_BREAKPOINT = 900;

// ─── Respostas dos dashboards de vendas/avaliações ──────────────
// Espelham GET /api/itineraries/dashboard/sales e /dashboard/reviews.

export interface SalesByItinerary {
    itineraryId: string;
    title: string;
    salesCount: number;
    revenue: number;
    averagePrice: number;
    rating: number;
    reviewCount: number;
}
export interface RecentSale {
    id: string;
    date: string;
    itineraryId: string;
    itineraryTitle: string;
    amount: number;
    /** Nome do comprador já anonimizado pelo backend ("Diego A."). */
    buyerName: string;
    buyerAvatar: string;
}
export interface CreatorSalesDashboard {
    totalSales: number;
    totalRevenue: number;
    averageTicket: number;
    topItinerary: { itineraryId: string; title: string; salesCount: number } | null;
    salesByItinerary: SalesByItinerary[];
    recentSales: RecentSale[];
}

export interface ReviewsByItinerary {
    itineraryId: string;
    title: string;
    reviewCount: number;
    averageRating: number;
}
export interface CreatorReview {
    id: string;
    rating: number;
    comment: string;
    date: string;
    itineraryId: string;
    itineraryTitle: string;
    user: { name: string | null; location: string | null; avatar: string | null; initial: string | null };
    photos: string[];
    response: { id: string; text: string; createdAt: string } | null;
}
export interface CreatorReviewsDashboard {
    averageRating: number;
    totalReviews: number;
    ratedItinerariesCount: number;
    ratingDistribution: Record<'1' | '2' | '3' | '4' | '5', number>;
    topItinerary: { itineraryId: string; title: string; averageRating: number } | null;
    reviewsByItinerary: ReviewsByItinerary[];
    recentReviews: CreatorReview[];
}

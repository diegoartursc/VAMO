/**
 * Seção "Criadores recomendados" — busca de dados, estado, regras de copy
 * contextual e analytics vivem AQUI, separados da apresentação
 * (RecommendedCreatorCard) e da tela hospedeira (itineraries.tsx não deve
 * crescer com essa lógica).
 *
 * Regra de exibição: a seção NUNCA aparece vazia. Sem nenhum criador
 * elegível (ou erro no endpoint), o componente retorna `null` — sem
 * placeholder, sem mensagem "nenhum criador recomendado".
 */
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Icon } from '../common/Icons';
import { Skeleton } from '../common/Skeleton';
import { RecommendedCreatorCard } from './RecommendedCreatorCard';
import { getRecommendedCreators, RecommendedCreator, RecommendedCreatorsResultType } from '../../services/api';
import { analytics } from '../../services/analytics';
import { theme } from '../../theme/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.round(SCREEN_WIDTH * 0.82);
const CARD_GAP = theme.spacing.md;

interface RecommendedCreatorsSectionProps {
    /** Destino do filtro ativo, se houver (texto livre, ex.: "Tóquio"). */
    destination?: string;
    /** Categorias selecionadas na busca, se houver. */
    categories?: string[];
    /** false quando a lista de roteiros da pesquisa está vazia — muda a copy. */
    hasResults: boolean;
    /** true quando o usuário aplicou algum filtro (destino/categoria/intenção). */
    hasActiveFilters: boolean;
    onOpenCreator: (creatorId: string) => void;
    onOpenItinerary: (itineraryId: string) => void;
}

function sectionCopy(opts: { hasResults: boolean; hasActiveFilters: boolean; type: RecommendedCreatorsResultType }) {
    if (!opts.hasResults) {
        return {
            title: 'Talvez estes criadores possam inspirar você',
            subtitle: 'Não encontramos um roteiro exato, mas estes perfis possuem excelente reputação na comunidade.',
        };
    }
    if (opts.hasActiveFilters && opts.type === 'contextual') {
        return {
            title: 'Criadores relacionados à sua busca',
            subtitle: 'Selecionados pela experiência, avaliações e afinidade com seus filtros.',
        };
    }
    return {
        title: 'Criadores que vale conhecer',
        subtitle: 'Perfis bem avaliados com roteiros que podem inspirar sua próxima viagem.',
    };
}

export function RecommendedCreatorsSection({
    destination, categories, hasResults, hasActiveFilters, onOpenCreator, onOpenItinerary,
}: RecommendedCreatorsSectionProps) {
    const [creators, setCreators] = useState<RecommendedCreator[] | null>(null);
    const [resultType, setResultType] = useState<RecommendedCreatorsResultType>('global_fallback');
    const [loading, setLoading] = useState(true);
    const viewedRef = useRef(false);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        getRecommendedCreators({ destination, categories, limit: 4 })
            .then((res) => {
                if (cancelled) return;
                setCreators(res.creators);
                setResultType(res.type);
            })
            .catch((err) => {
                // Falha na seção de criadores nunca quebra a tela de roteiros:
                // oculta silenciosamente e registra o erro pra diagnóstico.
                console.warn('[RecommendedCreatorsSection] falha ao carregar:', err?.message);
                if (!cancelled) setCreators([]);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => { cancelled = true; };
    }, [destination, JSON.stringify(categories)]);

    useEffect(() => {
        if (!creators || creators.length === 0 || viewedRef.current) return;
        viewedRef.current = true;
        analytics.track('recommended_creators_viewed', {
            count: creators.length,
            source: 'itinerary_search',
            recommendationType: resultType,
            destinationFilter: destination || '',
        });
    }, [creators, resultType, destination]);

    if (loading) {
        return (
            <View style={styles.section}>
                <Skeleton width={220} height={20} style={{ marginBottom: 8 }} />
                <Skeleton width={260} height={14} style={{ marginBottom: 14 }} />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
                    {[0, 1].map((i) => <CardSkeleton key={i} />)}
                </ScrollView>
            </View>
        );
    }

    if (!creators || creators.length === 0) return null;

    const copy = sectionCopy({ hasResults, hasActiveFilters, type: resultType });

    const handleOpenCreator = (creator: RecommendedCreator, position: number) => {
        analytics.track('recommended_creator_clicked', {
            creatorId: creator.id,
            position,
            source: 'itinerary_search',
            recommendationType: resultType,
            destinationFilter: destination || '',
            categoryFilter: (categories || []).join(',') || '',
        });
        onOpenCreator(creator.id);
    };

    const handleOpenItinerary = (creator: RecommendedCreator, position: number, itineraryId: string) => {
        analytics.track('recommended_creator_itinerary_clicked', {
            creatorId: creator.id,
            itineraryId,
            position,
            source: 'itinerary_search',
        });
        onOpenItinerary(itineraryId);
    };

    return (
        <View style={styles.section}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Icon name="award" size={18} color={theme.colors.primary} strokeWidth={2} />
                <Text style={styles.sectionTitle}>{copy.title}</Text>
            </View>
            <Text style={styles.sectionSubtitle}>{copy.subtitle}</Text>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
                snapToInterval={CARD_WIDTH + CARD_GAP}
                snapToAlignment="start"
                contentContainerStyle={styles.row}
            >
                {creators.map((creator, index) => (
                    <RecommendedCreatorCard
                        key={creator.id}
                        creator={creator}
                        style={{ width: CARD_WIDTH }}
                        onPress={() => handleOpenCreator(creator, index)}
                        onThumbnailPress={(itineraryId) => handleOpenItinerary(creator, index, itineraryId)}
                    />
                ))}
            </ScrollView>
        </View>
    );
}

function CardSkeleton() {
    return (
        <View style={[styles.cardSkeleton, { width: CARD_WIDTH }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <Skeleton width={56} height={56} borderRadius={28} />
                <View style={{ flex: 1, gap: 6 }}>
                    <Skeleton width="70%" height={16} />
                    <Skeleton width="50%" height={14} borderRadius={10} />
                </View>
            </View>
            <Skeleton width="90%" height={12} style={{ marginBottom: 14 }} />
            <Skeleton width="100%" height={34} borderRadius={10} />
        </View>
    );
}

const styles = StyleSheet.create({
    section: {
        padding: theme.spacing.md,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        marginBottom: 4,
    },
    row: {
        gap: CARD_GAP,
        paddingTop: theme.spacing.sm,
        paddingRight: theme.spacing.md,
    },
    cardSkeleton: {
        backgroundColor: theme.colors.background,
        borderRadius: theme.borderRadius.lg,
        padding: 16,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
});

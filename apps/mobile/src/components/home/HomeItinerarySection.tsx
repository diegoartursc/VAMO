/**
 * HomeItinerarySection — seção de roteiros da Home (cabeçalho + carrossel).
 *
 * Existe para que TODA seção da Home mostre o roteiro do mesmo jeito. Antes,
 * "Destaque"/"Novos" usavam o `ItineraryCard` oficial enquanto "Continue sua
 * busca"/"Experiências inesquecíveis" usavam um mini card local — o mesmo
 * roteiro aparecia como dois produtos diferentes.
 *
 * O que varia por seção: título, subtítulo, rótulo e destino do "Ver todos",
 * o conjunto de roteiros e a origem no analytics. O card, a largura, o gap e
 * o padding são idênticos em todas.
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { theme } from '../../theme/theme';
import { ItineraryCard } from '../cards/ItineraryCard';
import {
    getHomeItineraryCardWidth,
    HOME_CAROUSEL_GAP,
    HOME_CAROUSEL_PADDING_HORIZONTAL,
} from '../../utils/homeItineraryLayout';

export interface HomeItinerarySectionProps {
    title: string;
    subtitle: string;
    /** Roteiros já selecionados pela regra da seção (selectFeatured, etc.). */
    itineraries: any[];
    seeAllLabel?: string;
    onSeeAll: () => void;
    /** Abre o roteiro. A seção informa a origem para o analytics do chamador. */
    onOpenItinerary: (itineraryId: string) => void;
    /**
     * Conteúdo alternativo quando não há roteiros (loading, erro, vazio).
     * Sem ele e sem roteiros, a seção inteira não renderiza.
     */
    fallback?: React.ReactNode;
}

export function HomeItinerarySection({
    title,
    subtitle,
    itineraries,
    seeAllLabel = 'Ver todos',
    onSeeAll,
    onOpenItinerary,
    fallback,
}: HomeItinerarySectionProps) {
    const { width: windowWidth } = useWindowDimensions();
    const cardWidth = getHomeItineraryCardWidth(windowWidth);

    const hasItineraries = itineraries.length > 0;
    if (!hasItineraries && !fallback) return null;

    return (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{title}</Text>
                <TouchableOpacity
                    onPress={onSeeAll}
                    accessibilityRole="button"
                    accessibilityLabel={`${seeAllLabel}: ${title}`}
                >
                    <Text style={styles.seeAllText}>{seeAllLabel}</Text>
                </TouchableOpacity>
            </View>
            <Text style={styles.sectionSubtitle}>{subtitle}</Text>

            {hasItineraries ? (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.carouselContent}
                >
                    {itineraries.map((itinerary) => (
                        <ItineraryCard
                            key={itinerary.id}
                            width={cardWidth}
                            itinerary={itinerary}
                            onPress={() => onOpenItinerary(itinerary.id)}
                        />
                    ))}
                </ScrollView>
            ) : (
                fallback
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    section: {
        marginBottom: 40,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingHorizontal: HOME_CAROUSEL_PADDING_HORIZONTAL,
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.colors.text.primary,
        letterSpacing: -0.5,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: theme.colors.text.tertiary,
        paddingHorizontal: HOME_CAROUSEL_PADDING_HORIZONTAL,
        marginBottom: 16,
    },
    seeAllText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.primary,
    },
    // Padding e gap únicos: o primeiro card alinha com o título da seção e
    // todos os carrosséis respiram igual.
    carouselContent: {
        paddingHorizontal: HOME_CAROUSEL_PADDING_HORIZONTAL,
        gap: HOME_CAROUSEL_GAP,
    },
});

export default HomeItinerarySection;

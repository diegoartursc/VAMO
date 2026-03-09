import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../src/theme/theme';
import { VerifiedBadge } from '../../src/components/creator/VerifiedBadge';
import { CreatorCard } from '../../src/components/creator/CreatorCard';
import { PriceComparison } from '../../src/components/comparison/PriceComparison';
import { getFeaturedCreators as apiFeaturedCreators } from '../../src/services/api';
import { VERIFICATION_CONFIGS } from '../../src/types/creator';
import { IconicSearchBar } from '../../src/components/search/IconicSearchBar';
import { SearchModal } from '../../src/components/search/SearchModal';
import { useSearch } from '../../src/hooks/useSearch';
import { CTACarousel } from '../../src/components/home/CTACarousel';
import { CoverCarousel } from '../../src/components/common/CoverCarousel';
import { ITINERARY_INCLUSIONS } from '../../src/data/itineraryInclusions';
import { Icon, IconName } from '../../src/components/common/Icons';
import { ItineraryCard } from '../../src/components/cards/ItineraryCard';

export default function ItinerariesScreen() {
    const router = useRouter();
    const { filters, applyFilters, allItineraries } = useSearch();
    const [searchModalVisible, setSearchModalVisible] = useState(false);
    const [showComparison, setShowComparison] = useState(false);
    const [featuredCreators, setFeaturedCreators] = useState<any[]>([]);

    useEffect(() => {
        apiFeaturedCreators().then(setFeaturedCreators).catch(console.error);
    }, []);

    return (
        <View style={styles.container}>
            {/* Header with Gradient */}
            <LinearGradient
                colors={theme.colors.gradients.institutional as unknown as [string, string]}
                style={styles.gradientHeader}
            >
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>Roteiros de Viajantes</Text>
                    <Text style={styles.headerSubtitle}>
                        Roteiros testados por viajantes reais
                    </Text>
                </View>
            </LinearGradient>

            {/* Iconic Search Bar */}
            <View style={styles.searchWrapper}>
                <IconicSearchBar
                    placeholder="Encontrar roteiros de viajantes"
                    onPress={() => setSearchModalVisible(true)}
                />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* 1️⃣ Featured Itineraries - PRIORITY */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Roteiros mais escolhidos pela comunidade</Text>

                    {allItineraries.filter(it => it.featured).map((itinerary) => (
                        <ItineraryCard
                            key={itinerary.id}
                            itinerary={itinerary}
                            onPress={() => router.push(`/itinerary/${itinerary.id}`)}
                        />
                    ))}
                </View>

                {/* 2️⃣ Featured Creators */}
                <View style={styles.section}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Icon name="award" size={18} color={theme.colors.primary} strokeWidth={2} />
                        <Text style={styles.sectionTitle}>Criadores recomendados</Text>
                    </View>
                    <Text style={styles.sectionSubtitle}>
                        Viajantes verificados com histórico comprovado
                    </Text>

                    {featuredCreators.slice(0, 2).map((creator) => (
                        <View key={creator.id} style={{ marginTop: theme.spacing.md }}>
                            <CreatorCard
                                creator={creator}
                                onPress={() => router.push(`/creator/${creator.id}`)}
                            />
                        </View>
                    ))}
                </View>

                {/* 3️⃣ Verification Levels */}
                <View style={styles.section}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Icon name="shield-check" size={18} color={theme.colors.primary} strokeWidth={2} />
                        <Text style={styles.sectionTitle}>Níveis de Verificação</Text>
                    </View>
                    <Text style={styles.sectionSubtitle}>
                        Aqui você sabe exatamente quem está por trás de cada roteiro
                    </Text>

                    <View style={styles.badgesGrid}>
                        {(['basic', 'trusted', 'expert', 'ambassador'] as const).map((level) => {
                            const config = VERIFICATION_CONFIGS[level];
                            return (
                                <View key={level} style={styles.badgeExplanation}>
                                    <VerifiedBadge level={level} size="large" />
                                    <Text style={styles.badgeDescription}>
                                        {config.description}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* 4️⃣ Community Coming Soon */}
                <View style={styles.section}>
                    <View style={styles.communityCard}>
                        {/* Header */}
                        <View style={styles.communityHeader}>
                            <Icon name="users" size={24} color={theme.colors.primary} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.communityTitle}>Comunidade</Text>
                                <Text style={styles.communitySubtitle}>Converse com viajantes reais</Text>
                            </View>
                            <View style={styles.comingSoonBadge}>
                                <Text style={styles.comingSoonText}>Em Breve</Text>
                            </View>
                        </View>

                        {/* Preview entries - faded */}
                        <View style={styles.communityPreview}>
                            {[
                                { icon: 'landmark' as IconName, name: 'Paris', type: 'Chat', members: 234, user: 'Diego Artur', msg: 'Acabei de voltar! A Torre Eiffel à noite é imperdi...' },
                                { icon: 'compass' as IconName, name: 'Cancún', type: 'Chat', members: 189, user: 'Maria Clara', msg: 'Alguém sabe qual a melhor época para ir?' },
                                { icon: 'mountain' as IconName, name: 'Machu Picchu', type: 'Roteiro', members: 67, user: 'Pedro Henrique', msg: 'Lembrem de levar coca tea para altitude!' },
                            ].map((item, idx) => (
                                <View key={idx} style={[styles.communityEntry, idx < 2 && styles.communityEntryBorder]}>
                                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.surfaceLight, alignItems: 'center', justifyContent: 'center' }}>
                                        <Icon name={item.icon} size={20} color={theme.colors.primary} />
                                    </View>
                                    <View style={styles.communityEntryContent}>
                                        <Text style={styles.communityEntryName}>{item.name}</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                            <Icon name="users" size={11} color={theme.colors.primary} />
                                            <Text style={styles.communityEntryMeta}>
                                                {item.type} • {item.members} membros
                                            </Text>
                                        </View>
                                        <Text style={styles.communityEntryMsg} numberOfLines={1}>
                                            <Text style={styles.communityEntryUser}>{item.user}: </Text>
                                            {item.msg}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>

                        {/* CTA */}
                        <View style={styles.communityFooter}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Icon name="bell" size={14} color={theme.colors.text.secondary} />
                                <Text style={styles.communityFooterText}>
                                    Quer ser avisado quando lançar?
                                </Text>
                            </View>
                            <TouchableOpacity style={styles.communityNotifyButton}>
                                <Text style={styles.communityNotifyText}>Me avise!</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* CTA Carousel - Auto-Play */}
                <View style={styles.section}>
                    <CTACarousel />
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
            {/* Search Modal */}
            <SearchModal
                visible={searchModalVisible}
                onClose={() => setSearchModalVisible(false)}
                onSearch={(newFilters) => {
                    applyFilters(newFilters);
                    setSearchModalVisible(false);
                }}
                context="itineraries"
                initialFilters={filters}
            />
        </View>
    );
}



const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.surface,
    },
    gradientHeader: {
        paddingTop: 60,
        paddingBottom: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    searchWrapper: {
        marginTop: -28,
        marginBottom: theme.spacing.md,
    },
    headerContent: {
        paddingHorizontal: theme.spacing.md,
        marginBottom: theme.spacing.sm,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: theme.colors.text.inverse,
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: theme.colors.text.inverse,
        opacity: 0.9,
    },
    content: {
        flex: 1,
    },
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
        marginBottom: 10,
    },
    badgesGrid: {
        gap: theme.spacing.sm,
    },
    badgeExplanation: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        backgroundColor: theme.colors.background,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
    },
    badgeDescription: {
        flex: 1,
        fontSize: 13,
        color: theme.colors.text.secondary,
    },
    toggleButton: {
        paddingVertical: theme.spacing.sm,
    },
    toggleButtonText: {
        fontSize: 15,
        color: theme.colors.primary,
        fontWeight: '500',
    },
    // Community Teaser Card
    communityCard: {
        backgroundColor: theme.colors.background,
        borderRadius: theme.borderRadius.lg,
        overflow: 'hidden',
        ...theme.shadows.medium,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    communityHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    communityIcon: {
        fontSize: 28,
    },
    communityTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.colors.text.primary,
    },
    communitySubtitle: {
        fontSize: 13,
        color: theme.colors.text.secondary,
        marginTop: 2,
    },
    comingSoonBadge: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: theme.borderRadius.full,
    },
    comingSoonText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FFFFFF',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    communityPreview: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        opacity: 0.55,
    },
    communityEntry: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        gap: 12,
    },
    communityEntryBorder: {
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    communityEntryEmoji: {
        fontSize: 36,
    },
    communityEntryContent: {
        flex: 1,
    },
    communityEntryName: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 2,
    },
    communityEntryMeta: {
        fontSize: 12,
        color: theme.colors.primary,
        fontWeight: '600',
        marginBottom: 4,
    },
    communityEntryMsg: {
        fontSize: 13,
        color: theme.colors.text.secondary,
        lineHeight: 18,
    },
    communityEntryUser: {
        fontWeight: '700',
        color: theme.colors.text.primary,
    },
    communityFooter: {
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderTopWidth: 1,
        borderTopColor: theme.colors.borderLight,
        gap: 10,
    },
    communityFooterText: {
        fontSize: 14,
        color: theme.colors.text.secondary,
    },
    communityNotifyButton: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: theme.borderRadius.full,
    },
    communityNotifyText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});

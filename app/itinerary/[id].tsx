import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { theme } from '../../src/theme/theme';
import { getItineraryById } from '../../src/data/mockItineraries';
import { Alert, Linking } from 'react-native';
import { VerifiedBadge } from '../../src/components/creator/VerifiedBadge';

const { width } = Dimensions.get('window');

export default function ItineraryDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const itinerary = getItineraryById(id);

    if (!itinerary) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Roteiro não encontrado</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Image Gallery */}
                <ScrollView
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                >
                    {itinerary.images.map((image, index) => (
                        <Image
                            key={index}
                            source={{ uri: image }}
                            style={styles.image}
                        />
                    ))}
                </ScrollView>

                {/* Content */}
                <View style={styles.content}>
                    {/* Creator Badge */}
                    <View style={styles.header}>
                        <View style={styles.creatorBadge}>
                            <Text style={styles.creatorAvatar}>{itinerary.creator.avatar}</Text>
                            <View style={styles.creatorInfo}>
                                <View style={styles.creatorNameRow}>
                                    <Text style={styles.creatorName}>{itinerary.creator.name}</Text>
                                    <VerifiedBadge level={itinerary.creator.verificationLevel} size="small" showLabel={false} />
                                </View>
                                <Text style={styles.creatorStats}>
                                    ⭐ {itinerary.creator.rating} • {itinerary.creator.salesCount.toLocaleString('pt-BR')} vendas
                                </Text>
                            </View>
                        </View>
                    </View>

                    <Text style={styles.title}>{itinerary.title}</Text>
                    <Text style={styles.destination}>
                        {itinerary.destination}, {itinerary.country}
                    </Text>

                    <View style={styles.ratingRow}>
                        <View style={styles.ratingContainer}>
                            <Text style={styles.ratingIcon}>⭐</Text>
                            <Text style={styles.ratingText}>{itinerary.rating}</Text>
                            <Text style={styles.reviewCount}>
                                ({itinerary.reviewCount} avaliações)
                            </Text>
                        </View>
                        <Text style={styles.duration}>📅 {itinerary.duration} dias</Text>
                    </View>

                    {/* Price */}
                    <View style={styles.priceCard}>
                        <Text style={styles.priceLabel}>Roteiro completo</Text>
                        <Text style={styles.price}>
                            R$ {itinerary.price.toFixed(2).replace('.', ',')}
                        </Text>
                        <Text style={styles.priceNote}>acesso imediato</Text>
                    </View>

                    {/* About */}
                    <View style={styles.aboutSection}>
                        <Text style={styles.aboutDescription}>
                            {itinerary.description}
                        </Text>

                        <Text style={styles.aboutTitle}>O que está incluído</Text>

                        <View style={styles.infoCardsContainer}>
                            {itinerary.inclusions.map((inclusion, index) => (
                                <View key={index} style={styles.infoCard}>
                                    <View style={styles.infoCardIcon}>
                                        <Text style={styles.infoIconText}>
                                            {inclusion === 'Planilha' ? '📋' :
                                                inclusion === 'Mapa' ? '🗺️' :
                                                    inclusion === 'Suporte' ? '💬' :
                                                        inclusion === 'Guia de Frases' ? '💬' :
                                                            inclusion === 'Guia de Museus' ? '🏛️' :
                                                                inclusion === 'Guia de Restaurantes' ? '🍽️' : '📱'}
                                        </Text>
                                    </View>
                                    <View style={styles.infoCardContent}>
                                        <Text style={styles.infoCardTitle}>{inclusion}</Text>
                                        <Text style={styles.infoCardDesc}>
                                            {inclusion === 'Planilha' ? 'Planilha completa de gastos e organização' :
                                                inclusion === 'Mapa' ? 'Mapa interativo com todos os pontos' :
                                                    inclusion === 'Suporte' ? 'Suporte direto do criador' :
                                                        inclusion === 'Guia de Frases' ? 'Principais frases úteis no idioma local' :
                                                            inclusion === 'Guia de Museus' ? 'Melhores museus e atrações culturais' :
                                                                inclusion === 'Guia de Restaurantes' ? 'Restaurantes aprovados e testados' :
                                                                    'Conteúdo digital exclusivo'}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Buy Button */}
                    <TouchableOpacity
                        style={styles.buyButton}
                        onPress={() => Alert.alert(
                            '💳 Comprar Roteiro',
                            `${itinerary.title}\n\nPreço: R$ ${itinerary.price.toFixed(2)}\nDuração: ${itinerary.duration} dias\n\nDeseja prosseguir para o pagamento?`,
                            [
                                { text: 'Voltar', style: 'cancel' },
                                { text: 'Comprar Agora', onPress: () => Alert.alert('Sucesso! ✅', 'Compra realizada! O roteiro foi enviado para seu email.') }
                            ]
                        )}
                    >
                        <Text style={styles.buyButtonText}>
                            Comprar por R$ {itinerary.price.toFixed(2).replace('.', ',')}
                        </Text>
                    </TouchableOpacity>

                    {/* Creator Contact */}
                    <TouchableOpacity
                        style={styles.contactButton}
                        onPress={() => Alert.alert(
                            `💬 Contato`,
                            `Deseja falar diretamente com ${itinerary.creator.name}?`,
                            [
                                { text: 'Cancelar', style: 'cancel' },
                                { text: 'Enviar mensagem', onPress: () => Alert.alert('Em breve!', 'Sistema de mensagens será implementado em breve.') }
                            ]
                        )}
                    >
                        <Text style={styles.contactButtonText}>
                            Falar com {itinerary.creator.name}
                        </Text>
                    </TouchableOpacity>

                    {/* Info */}
                    <View style={styles.infoBox}>
                        <Text style={styles.infoText}>
                            Este roteiro é criado por {itinerary.creator.name}, viajante verificado.
                        </Text>
                        <Text style={styles.infoText}>
                            O VAMO conecta você diretamente com criadores reais.
                        </Text>
                    </View>

                    <View style={{ height: 40 }} />
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    scrollContent: {
        flex: 1,
    },
    image: {
        width,
        height: 300,
        backgroundColor: theme.colors.surface,
    },
    content: {
        padding: theme.spacing.md,
    },
    header: {
        marginBottom: theme.spacing.md,
    },
    creatorBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.borderRadius.lg,
        alignSelf: 'flex-start',
        gap: theme.spacing.sm,
    },
    creatorAvatar: {
        fontSize: 28,
    },
    creatorInfo: {
        flex: 1,
    },
    creatorNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
    },
    creatorName: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    creatorStats: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        marginTop: 2,
    },
    title: {
        fontSize: theme.typography.sizes.title,
        fontWeight: theme.typography.weights.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
    },
    destination: {
        fontSize: 16,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.md,
    },
    ratingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingIcon: {
        fontSize: 16,
    },
    ratingText: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    reviewCount: {
        fontSize: 14,
        color: theme.colors.text.secondary,
    },
    duration: {
        fontSize: 14,
        color: theme.colors.text.secondary,
    },
    priceCard: {
        backgroundColor: theme.colors.surfaceLight,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        marginBottom: theme.spacing.lg,
        alignItems: 'center',
    },
    priceLabel: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        marginBottom: 4,
    },
    price: {
        fontSize: 32,
        fontWeight: '700',
        color: theme.colors.success,
        marginBottom: 4,
    },
    priceNote: {
        fontSize: 12,
        color: theme.colors.text.secondary,
    },
    aboutSection: {
        marginBottom: theme.spacing.lg,
    },
    aboutDescription: {
        fontSize: 15,
        color: theme.colors.text.primary,
        lineHeight: 22,
        marginBottom: theme.spacing.lg,
    },
    aboutTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.md,
    },
    infoCardsContainer: {
        gap: theme.spacing.md,
    },
    infoCard: {
        flexDirection: 'row',
        gap: theme.spacing.md,
        alignItems: 'flex-start',
    },
    infoCardIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.surfaceLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoIconText: {
        fontSize: 20,
    },
    infoCardContent: {
        flex: 1,
    },
    infoCardTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.text.primary,
        marginBottom: 4,
    },
    infoCardDesc: {
        fontSize: 13,
        color: theme.colors.text.secondary,
        lineHeight: 18,
    },
    buyButton: {
        backgroundColor: theme.colors.success,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.borderRadius.full,
        alignItems: 'center',
        marginBottom: theme.spacing.md,
        ...theme.shadows.button,
    },
    buyButtonText: {
        color: theme.colors.text.inverse,
        fontSize: 16,
        fontWeight: '700',
    },
    contactButton: {
        backgroundColor: theme.colors.surface,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.borderRadius.full,
        alignItems: 'center',
        marginBottom: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    contactButtonText: {
        color: theme.colors.text.primary,
        fontSize: 16,
        fontWeight: '600',
    },
    infoBox: {
        backgroundColor: theme.colors.surfaceLight,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        gap: theme.spacing.xs,
    },
    infoText: {
        fontSize: 13,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        lineHeight: 18,
    },
    errorText: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.error,
        textAlign: 'center',
    },
});

import React from 'react';
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
import { getPackageById } from '../../src/data/mockPackages';
import { Alert, Linking } from 'react-native';

const { width } = Dimensions.get('window');

export default function PackageDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const packageData = getPackageById(id);

    if (!packageData) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Pacote não encontrado</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Back Button */}
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Text style={styles.backButtonText}>‹ Voltar</Text>
            </TouchableOpacity>

            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Image Gallery */}
                <ScrollView
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                >
                    {packageData.images.map((image, index) => (
                        <Image
                            key={index}
                            source={{ uri: image }}
                            style={styles.image}
                        />
                    ))}
                </ScrollView>

                {/* Package Info */}
                <View style={styles.content}>
                    <View style={styles.header}>
                        <View style={styles.agencyBadge}>
                            <Text style={styles.agencyIcon}>{packageData.agency.logo}</Text>
                            <Text style={styles.agencyName}>{packageData.agency.name}</Text>
                            {packageData.agency.verified && (
                                <Text style={styles.verifiedBadge}>✓</Text>
                            )}
                        </View>
                    </View>

                    <Text style={styles.title}>{packageData.title}</Text>
                    <Text style={styles.destination}>
                        {packageData.destination}, {packageData.country}
                    </Text>

                    <View style={styles.ratingRow}>
                        <View style={styles.ratingContainer}>
                            <Text style={styles.ratingIcon}>⭐</Text>
                            <Text style={styles.ratingText}>{packageData.rating}</Text>
                            <Text style={styles.reviewCount}>
                                ({packageData.reviewCount} avaliações)
                            </Text>
                        </View>
                        <Text style={styles.duration}>📅 {packageData.duration} dias</Text>
                    </View>

                    {/* Price */}
                    <View style={styles.priceCard}>
                        <Text style={styles.priceLabel}>A partir de</Text>
                        <Text style={styles.price}>
                            R$ {packageData.price.min.toLocaleString('pt-BR')}
                        </Text>
                        <Text style={styles.priceNote}>por pessoa</Text>
                    </View>

                    {/* Description */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Sobre este pacote</Text>
                        <Text style={styles.description}>{packageData.description}</Text>
                    </View>

                    {/* Highlights */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Destaques</Text>
                        {packageData.highlights.map((highlight, index) => (
                            <View key={index} style={styles.listItem}>
                                <Text style={styles.bullet}>✨</Text>
                                <Text style={styles.listText}>{highlight}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Includes */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>O que está incluído</Text>
                        {packageData.includes.map((item, index) => (
                            <View key={index} style={styles.listItem}>
                                <Text style={styles.bullet}>✓</Text>
                                <Text style={styles.listText}>{item}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Contact Agency Button */}
                    <TouchableOpacity
                        style={styles.contactButton}
                        onPress={() => Alert.alert(
                            `📞 Contato`,
                            `Deseja entrar em contato com ${packageData.agency.name}?`,
                            [
                                { text: 'Cancelar', style: 'cancel' },
                                { text: 'Ligar', onPress: () => Linking.openURL('tel:+5511999999999') },
                                { text: 'WhatsApp', onPress: () => Linking.openURL(`https://wa.me/5511999999999?text=Olá! Vi o pacote "${packageData.title}" no VAMO e gostaria de mais informações.`) }
                            ]
                        )}
                    >
                        <Text style={styles.contactButtonText}>
                            Entrar em contato com {packageData.agency.name}
                        </Text>
                    </TouchableOpacity>

                    {/* Agency Info */}
                    <View style={styles.agencyInfo}>
                        <Text style={styles.agencyInfoText}>
                            Este pacote é oferecido por {packageData.agency.name}.
                        </Text>
                        <Text style={styles.agencyInfoText}>
                            O VAMO conecta você diretamente com a agência.
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
    backButton: {
        paddingTop: 50,
        paddingHorizontal: theme.spacing.md,
        paddingBottom: theme.spacing.sm,
        backgroundColor: theme.colors.background,
    },
    backButtonText: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.primary,
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
    agencyBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.borderRadius.full,
        alignSelf: 'flex-start',
        gap: theme.spacing.sm,
    },
    agencyIcon: {
        fontSize: 16,
    },
    agencyName: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    verifiedBadge: {
        fontSize: 12,
        color: theme.colors.success,
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
        color: theme.colors.primary,
        marginBottom: 4,
    },
    priceNote: {
        fontSize: 12,
        color: theme.colors.text.secondary,
    },
    section: {
        marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
        fontSize: theme.typography.sizes.heading,
        fontWeight: theme.typography.weights.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.md,
    },
    description: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.text.secondary,
        lineHeight: 24,
    },
    listItem: {
        flexDirection: 'row',
        marginBottom: theme.spacing.sm,
        gap: theme.spacing.sm,
    },
    bullet: {
        fontSize: 16,
        color: theme.colors.primary,
    },
    listText: {
        flex: 1,
        fontSize: 15,
        color: theme.colors.text.primary,
        lineHeight: 22,
    },
    contactButton: {
        backgroundColor: theme.colors.primary,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.borderRadius.full,
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    contactButtonText: {
        color: theme.colors.text.inverse,
        fontSize: 16,
        fontWeight: '600',
    },
    agencyInfo: {
        backgroundColor: theme.colors.surfaceLight,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        gap: theme.spacing.xs,
    },
    agencyInfoText: {
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

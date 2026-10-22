/**
 * PurchaseBenefitsCard — seção única "O que você recebe" da tela pública de
 * detalhes do roteiro.
 *
 * Antes existiam DOIS cards consecutivos dizendo praticamente a mesma coisa
 * ("Após a compra, organize tudo dentro da VAMO" + este componente) —
 * consolidados aqui numa única superfície: cabeçalho > lista de benefícios >
 * aviso de produto digital (separado por divisor). O antigo
 * `PostPurchaseConversionBox` (InteractiveExperienceSection.tsx) foi
 * removido — conteúdo incorporado aqui.
 *
 * Sem regra de negócio — só apresentação. Um único padrão de ícone e um
 * único padrão de check (círculo teal) em toda a seção.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Icon } from '../common/Icons';
import { theme } from '../../theme/theme';

const BENEFITS = [
    'Instant access to the digital itinerary',
    'The original itinerary and your personalized version in My Itineraries',
    'Documents, tickets and bookings organized in one place',
    'Your own checklist to track trip preparation',
];

export function PurchaseBenefitsCard() {
    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <View style={styles.headerIcon}>
                    <Icon name="map" size={18} color={theme.colors.primaryDark} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.title}>What you get</Text>
                    <Text style={styles.subtitle}>
                        Buy once, access it on VAMO and organize your own version of the trip in My Itineraries.
                    </Text>
                </View>
            </View>

            <View style={styles.list}>
                {BENEFITS.map((text) => (
                    <View key={text} style={styles.item}>
                        <View style={styles.check}>
                            <Ionicons name="checkmark" size={12} color="#fff" />
                        </View>
                        <Text style={styles.itemText}>{text}</Text>
                    </View>
                ))}
            </View>

            <View style={styles.footerRow}>
                <Icon name="info" size={14} color={theme.colors.text.tertiary} />
                <Text style={styles.footer}>
                    Digital product: payment is for the itinerary's informational content — tips,
                    information and travel planning. It doesn't include flights, lodging, bookings or
                    other tourism services.
                </Text>
            </View>
        </View>
    );
}

export default PurchaseBenefitsCard;

const styles = StyleSheet.create({
    card: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        ...theme.shadows.small,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 14,
    },
    headerIcon: {
        width: 36,
        height: 36,
        borderRadius: theme.borderRadius.sm,
        backgroundColor: 'rgba(40, 201, 191, 0.12)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 17,
        fontWeight: '800',
        color: theme.colors.text.primary,
        marginBottom: 3,
    },
    subtitle: {
        fontSize: 13,
        color: theme.colors.text.secondary,
        lineHeight: 18,
    },
    list: {
        gap: 11,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    check: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemText: {
        flex: 1,
        fontSize: 14,
        color: theme.colors.text.primary,
        fontWeight: '500',
    },
    footerRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        marginTop: 14,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: theme.colors.borderLight,
    },
    footer: {
        flex: 1,
        fontSize: 11,
        lineHeight: 15,
        color: theme.colors.text.tertiary,
    },
});

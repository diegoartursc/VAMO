/**
 * BudgetStyleGuideSheet — bottom-sheet de ajuda que explica os critérios da
 * VAMO para Econômico / Moderado / Luxo.
 *
 * Reutilizado na CRIAÇÃO de roteiro (ícone "?" ao lado do título) e no
 * DETALHE do roteiro ("Como a VAMO define isso?"). Conteúdo vem de
 * `BUDGET_STYLE_GUIDE` em @vamo/shared — fonte única.
 *
 * `highlightKey` realça o card da opção atualmente selecionada (quando aberto
 * a partir de um roteiro que já tem estilo).
 */

import React from 'react';
import {
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
    BUDGET_STYLE_GUIDE,
    BUDGET_STYLE_GENERAL_NOTE,
    BUDGET_STYLE_KEYS,
    type BudgetStyleKey,
} from '@vamo/shared/itinerary';
import { theme } from '../../theme/theme';

const ICON_BY_KEY: Record<BudgetStyleKey, React.ComponentProps<typeof Ionicons>['name']> = {
    economico: 'wallet-outline',
    moderado: 'bar-chart-outline',
    luxo: 'diamond-outline',
};

export interface BudgetStyleGuideSheetProps {
    visible: boolean;
    onClose: () => void;
    /** Realça o card desta key (estilo já escolhido), se houver. */
    highlightKey?: string | null;
}

export default function BudgetStyleGuideSheet({
    visible,
    onClose,
    highlightKey,
}: BudgetStyleGuideSheetProps) {
    const insets = useSafeAreaInsets();

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <Pressable style={styles.backdrop} onPress={onClose} />
            <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom + 12, 20) }]}>
                <View style={styles.handle} />
                <View style={styles.header}>
                    <Text style={styles.title}>Estilo de orçamento</Text>
                    <TouchableOpacity
                        onPress={onClose}
                        hitSlop={8}
                        accessibilityLabel="Fechar"
                        style={styles.closeBtn}
                    >
                        <Ionicons name="close" size={22} color={theme.colors.text.secondary} />
                    </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 460 }}>
                    {BUDGET_STYLE_KEYS.map((key) => {
                        const g = BUDGET_STYLE_GUIDE[key];
                        const highlighted = highlightKey === key;
                        return (
                            <View
                                key={key}
                                style={[styles.card, highlighted && styles.cardHighlighted]}
                            >
                                <View style={styles.cardHeader}>
                                    <View style={[styles.cardIcon, highlighted && styles.cardIconHi]}>
                                        <Ionicons
                                            name={ICON_BY_KEY[key]}
                                            size={16}
                                            color={highlighted ? '#fff' : theme.colors.primary}
                                        />
                                    </View>
                                    <Text style={styles.cardLabel}>{g.label}</Text>
                                    {highlighted ? (
                                        <View style={styles.selectedPill}>
                                            <Text style={styles.selectedPillText}>Selecionado</Text>
                                        </View>
                                    ) : null}
                                </View>
                                <Text style={styles.cardDesc}>{g.buyerDescription}</Text>
                            </View>
                        );
                    })}

                    <View style={styles.note}>
                        <Ionicons
                            name="information-circle-outline"
                            size={15}
                            color={theme.colors.text.secondary}
                            style={{ marginTop: 1 }}
                        />
                        <Text style={styles.noteText}>{BUDGET_STYLE_GENERAL_NOTE}</Text>
                    </View>
                </ScrollView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(16, 32, 64, 0.5)',
    },
    sheet: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 10,
        paddingHorizontal: 18,
        ...(Platform.OS === 'web' ? ({ position: 'fixed' as any } as any) : null),
    },
    handle: {
        width: 36,
        height: 4,
        borderRadius: 999,
        backgroundColor: '#CBD5E1',
        alignSelf: 'center',
        marginBottom: 12,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    title: {
        flex: 1,
        fontSize: 17,
        fontWeight: '800',
        color: theme.colors.secondary,
    },
    closeBtn: { padding: 2 },
    card: {
        backgroundColor: theme.colors.surfaceLight,
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    cardHighlighted: {
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.primary + '0E',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6,
    },
    cardIcon: {
        width: 30,
        height: 30,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.primary + '18',
    },
    cardIconHi: { backgroundColor: theme.colors.primary },
    cardLabel: {
        flex: 1,
        fontSize: 15,
        fontWeight: '800',
        color: theme.colors.text.primary,
    },
    selectedPill: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 999,
    },
    selectedPillText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 0.3,
    },
    cardDesc: {
        fontSize: 13,
        lineHeight: 19,
        color: theme.colors.text.secondary,
    },
    note: {
        flexDirection: 'row',
        gap: 8,
        backgroundColor: theme.colors.surfaceLight,
        borderRadius: 12,
        padding: 12,
        marginTop: 2,
        marginBottom: 8,
    },
    noteText: {
        flex: 1,
        fontSize: 12,
        lineHeight: 17,
        color: theme.colors.text.secondary,
    },
});

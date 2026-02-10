import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Animated,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme/theme';
import { PriceSlider } from './PriceSlider';
import { DurationSlider } from './DurationSlider';
import { SearchFilters } from '../../contexts/SearchContext';
import { CATEGORIES, INTENT_CATEGORIES, INTENT_FEEDBACK } from '../../constants/categories';
import { useSearch } from '../../hooks/useSearch';

const { height } = Dimensions.get('window');

interface SearchModalProps {
    visible: boolean;
    onClose: () => void;
    onSearch: (filters: SearchFilters) => void;
    context: 'home' | 'packages' | 'itineraries';
    initialFilters?: Partial<SearchFilters>;
}

export function SearchModal({
    visible,
    onClose,
    onSearch,
    context,
    initialFilters,
}: SearchModalProps) {
    const [slideAnim] = useState(new Animated.Value(height));
    const [backdropAnim] = useState(new Animated.Value(0));
    const { travelIntent, setTravelIntent } = useSearch();

    // Filtros locais (estado do modal)
    const [destination, setDestination] = useState(initialFilters?.destination || '');
    const [duration, setDuration] = useState<number>(initialFilters?.duration || 7);
    const [priceRange, setPriceRange] = useState<[number, number]>([
        initialFilters?.priceMin || 0,
        initialFilters?.priceMax || 50000,
    ]);

    // Títulos por contexto
    const contextTitles = {
        home: 'Buscar Viagens',
        packages: 'Buscar Pacotes',
        itineraries: 'Buscar Roteiros',
    };

    useEffect(() => {
        if (visible) {
            // Animação de entrada
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(backdropAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            // Animação de saída
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: height,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.timing(backdropAnim, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

    const handleClearFilters = () => {
        setDestination('');
        setDuration(7);
        setPriceRange([0, 50000]);
        setTravelIntent(null);
    };

    const handleApplyFilters = () => {
        const filters: SearchFilters = {
            destination,
            duration,
            priceMin: priceRange[0],
            priceMax: priceRange[1],
        };
        onSearch(filters);
        onClose();
    };

    const handleIntentSelect = (intentId: string) => {
        setTravelIntent(travelIntent === intentId ? null : intentId);
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onClose}
        >
            {/* Backdrop */}
            <Animated.View
                style={[
                    styles.backdrop,
                    { opacity: backdropAnim },
                ]}
            >
                <TouchableOpacity
                    style={StyleSheet.absoluteFill}
                    activeOpacity={1}
                    onPress={onClose}
                />
            </Animated.View>

            {/* Modal Content */}
            <Animated.View
                style={[
                    styles.container,
                    { transform: [{ translateY: slideAnim }] },
                ]}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.handle} />
                    <View style={styles.headerContent}>
                        <Text style={styles.title}>{contextTitles[context]}</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Text style={styles.closeIcon}>✕</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Filters */}
                <ScrollView
                    style={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Category Pills */}
                    <View style={styles.filterSection}>
                        <Text style={styles.filterLabel}>Categorias</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.categoriesScroll}
                        >
                            {CATEGORIES.map((cat) => (
                                <TouchableOpacity
                                    key={cat.id}
                                    style={styles.categoryPill}
                                    onPress={() => {
                                        // Set destination filter as category for now
                                        setDestination(cat.label);
                                    }}
                                >
                                    <Text style={styles.categoryIcon}>{cat.icon}</Text>
                                    <Text style={styles.categoryLabel}>{cat.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Intent Toggles - Luxo / Custo-benefício */}
                    <View style={styles.filterSection}>
                        <Text style={styles.filterLabel}>Como você quer viajar?</Text>
                        <View style={styles.intentToggleRow}>
                            {INTENT_CATEGORIES.map((intent) => {
                                const isSelected = travelIntent === intent.id;
                                return (
                                    <TouchableOpacity
                                        key={intent.id}
                                        style={[
                                            styles.intentToggleCard,
                                            isSelected
                                                ? styles.intentToggleCardActive
                                                : styles.intentToggleCardInactive
                                        ]}
                                        onPress={() => handleIntentSelect(intent.id)}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={styles.intentToggleEmoji}>{intent.emoji}</Text>
                                        <Text style={[
                                            styles.intentToggleLabel,
                                            isSelected
                                                ? styles.intentToggleLabelActive
                                                : styles.intentToggleLabelInactive
                                        ]}>
                                            {intent.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                        {/* Feedback textual */}
                        {travelIntent && (
                            <View style={styles.intentFeedback}>
                                <Text style={styles.intentFeedbackText}>
                                    {INTENT_FEEDBACK[travelIntent]}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Destino */}
                    <View style={styles.filterSection}>
                        <Text style={styles.filterLabel}>Destino</Text>
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputIcon}>🌍</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Para onde você quer ir?"
                                placeholderTextColor={theme.colors.text.secondary}
                                value={destination}
                                onChangeText={setDestination}
                            />
                        </View>
                    </View>

                    {/* Duração */}
                    <DurationSlider
                        value={duration}
                        onChange={setDuration}
                        min={1}
                        max={30}
                        step={1}
                    />

                    {/* Preço */}
                    <PriceSlider
                        min={0}
                        max={50000}
                        value={priceRange}
                        onChange={setPriceRange}
                        step={500}
                    />
                </ScrollView>

                {/* Actions */}
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={styles.clearButton}
                        onPress={handleClearFilters}
                    >
                        <Text style={styles.clearButtonText}>Limpar Filtros</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.searchButton}
                        onPress={handleApplyFilters}
                    >
                        <LinearGradient
                            colors={[theme.colors.primary, theme.colors.secondary]}
                            style={styles.searchButtonGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Text style={styles.searchButtonText}>🔍 Buscar</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: height * 0.85,
        backgroundColor: theme.colors.background,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    header: {
        paddingTop: 12,
        paddingHorizontal: theme.spacing.lg,
        paddingBottom: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: theme.colors.border,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: theme.spacing.md,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.colors.text.primary,
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: theme.colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeIcon: {
        fontSize: 18,
        color: theme.colors.text.secondary,
    },
    content: {
        flex: 1,
        paddingHorizontal: theme.spacing.lg,
        paddingTop: theme.spacing.lg,
    },
    filterSection: {
        marginBottom: theme.spacing.lg,
    },
    filterLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.md,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 12,
        paddingHorizontal: theme.spacing.md,
        height: 56,
    },
    inputIcon: {
        fontSize: 24,
        marginRight: theme.spacing.sm,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: theme.colors.text.primary,
    },

    // Category Pills
    categoriesScroll: {
        gap: theme.spacing.sm,
    },
    categoryPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.borderRadius.full,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    categoryIcon: {
        fontSize: 16,
    },
    categoryLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: theme.colors.text.primary,
    },

    // Intent Toggles
    intentToggleRow: {
        flexDirection: 'row',
        gap: 12,
    },
    intentToggleCard: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 20,
        borderRadius: theme.borderRadius.lg,
        borderWidth: 2,
    },
    intentToggleCardActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    intentToggleCardInactive: {
        backgroundColor: theme.colors.background,
        borderColor: theme.colors.border,
    },
    intentToggleEmoji: {
        fontSize: 28,
        marginBottom: 8,
    },
    intentToggleLabel: {
        fontSize: 14,
        fontWeight: '600',
    },
    intentToggleLabelActive: {
        color: '#FFFFFF',
    },
    intentToggleLabelInactive: {
        color: theme.colors.primary,
    },
    intentFeedback: {
        marginTop: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        backgroundColor: theme.colors.surfaceLight,
        borderRadius: theme.borderRadius.md,
        borderLeftWidth: 3,
        borderLeftColor: theme.colors.primary,
    },
    intentFeedbackText: {
        fontSize: 13,
        color: theme.colors.text.secondary,
        lineHeight: 18,
    },

    // Actions
    actions: {
        flexDirection: 'row',
        gap: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.lg,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        backgroundColor: theme.colors.background,
    },
    clearButton: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    clearButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.primary,
    },
    searchButton: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        overflow: 'hidden',
    },
    searchButtonGradient: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    searchButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});

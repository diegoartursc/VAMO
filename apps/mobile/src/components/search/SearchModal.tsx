import React, { useState, useEffect, useMemo } from 'react';
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
import Slider from '@react-native-community/slider';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme/theme';
import { SearchFilters } from '../../contexts/SearchContext';
import { CATEGORIES, INTENT_CATEGORIES, INTENT_FEEDBACK, DURATION_CHIPS } from '../../constants/categories';
import { useSearch } from '../../hooks/useSearch';
import { Icon, IconName } from '../common/Icons';

const { height } = Dimensions.get('window');

interface SearchModalProps {
    visible: boolean;
    onClose: () => void;
    onSearch: (filters: SearchFilters) => void;
    context: 'home' | 'itineraries';
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
    const [clearAnim] = useState(new Animated.Value(0));
    const {
        travelIntent, setTravelIntent,
        selectedCategories, toggleSelectedCategory, setSelectedCategory,
        filteredItineraries,
    } = useSearch();

    // Filtros locais (estado do modal)
    const [destination, setDestination] = useState(initialFilters?.destination || '');
    const [duration, setDuration] = useState<number | undefined>(initialFilters?.duration);
    const [activeDurationChip, setActiveDurationChip] = useState<number | null>(null);

    // Títulos por contexto
    const contextTitles = {
        home: 'Buscar Roteiros',
        itineraries: 'Buscar Roteiros',
    };

    // Contagem dinâmica de resultados
    const resultCount = useMemo(() => {
        if (context === 'itineraries') return filteredItineraries.length;
        return filteredItineraries.length;
    }, [context, filteredItineraries]);

    const resultLabel = useMemo(() => {
        if (context === 'itineraries') return 'roteiro';
        return 'roteiro';
    }, [context]);

    // Contagem de filtros locais ativos
    const localActiveCount = useMemo(() => {
        let count = 0;
        if (destination) count++;
        if (duration !== undefined) count++;
        if (travelIntent) count++;
        if (selectedCategories.length > 0) count++;
        return count;
    }, [destination, duration, travelIntent, selectedCategories]);

    useEffect(() => {
        if (visible) {
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

    // Animate clear button when filters are active
    useEffect(() => {
        Animated.timing(clearAnim, {
            toValue: localActiveCount > 0 ? 1 : 0,
            duration: 200,
            useNativeDriver: false,
        }).start();
    }, [localActiveCount]);

    const handleClearFilters = () => {
        setDestination('');
        setDuration(undefined);
        setActiveDurationChip(0); // Select 'Qualquer' by default when clearing
        setTravelIntent(null);
        setSelectedCategory(null);
    };

    const handleApplyFilters = () => {
        const filters: SearchFilters = {
            destination,
            duration,
        };
        onSearch(filters);
        onClose();
    };

    const handleIntentSelect = (intentId: string) => {
        setTravelIntent(travelIntent === intentId ? null : intentId);
    };

    const handleDurationChip = (index: number, min: number, max: number) => {
        if (index === 0) {
            // "Qualquer" selected
            setActiveDurationChip(0);
            setDuration(undefined);
            return;
        }
        
        if (activeDurationChip === index) {
            setActiveDurationChip(0);
            setDuration(undefined);
        } else {
            setActiveDurationChip(index);
            setDuration(min === max ? min : Math.round((min + max) / 2));
        }
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
                        <View>
                            <Text style={styles.title}>{contextTitles[context]}</Text>
                            <Text style={styles.microcopy}>
                                Use apenas os filtros que quiser para refinar sua busca.
                            </Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Icon name="close" size={18} color={theme.colors.text.secondary} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Filters */}
                <ScrollView
                    style={styles.content}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 24 }}
                >
                    {/* ── 1. DESTINO ── */}
                    <View style={styles.filterSection}>
                        <View style={styles.filterLabelWithIcon}>
                            <Icon name="location" size={16} color={theme.colors.primary} />
                            <Text style={styles.filterLabel}>Destino</Text>
                        </View>
                        <View style={styles.inputContainer}>
                            <Icon name="globe" size={20} color={theme.colors.text.tertiary} style={{ marginRight: 10 }} />
                            <TextInput
                                style={styles.input}
                                placeholder="Para onde você quer ir?"
                                placeholderTextColor={theme.colors.text.secondary}
                                value={destination}
                                onChangeText={setDestination}
                            />
                        </View>
                    </View>

                    {/* ── 2. DURAÇÃO DA VIAGEM ── */}
                    <View style={styles.filterSection}>
                        <View style={styles.filterLabelRow}>
                            <View style={styles.filterLabelWithIcon}>
                                <Icon name="calendar" size={16} color={theme.colors.primary} />
                                <Text style={styles.filterLabel}>Duração da Viagem</Text>
                            </View>
                            <Text style={styles.filterValue}>
                                {duration === undefined ? 'Qualquer' : duration === 1 ? '1 dia' : `${duration} dias`}
                            </Text>
                        </View>

                        {/* Quick chips */}
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.durationChipsScroll}
                        >
                            {DURATION_CHIPS.map((chip, index) => {
                                const isActive = activeDurationChip === index;
                                return (
                                    <TouchableOpacity
                                        key={index}
                                        style={[
                                            styles.durationChip,
                                            isActive && styles.durationChipActive,
                                        ]}
                                        onPress={() => handleDurationChip(index, chip.min, chip.max)}
                                    >
                                        <Text style={[
                                            styles.durationChipText,
                                            isActive && styles.durationChipTextActive,
                                        ]}>
                                            {chip.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>

                        {/* Slider */}
                        <Slider
                            style={styles.slider}
                            minimumValue={1}
                            maximumValue={30}
                            value={duration || 1} // Fallback to 1 if undefined for slider display
                            onValueChange={(val: number) => {
                                setDuration(Math.round(val));
                                setActiveDurationChip(null);
                            }}
                            minimumTrackTintColor={theme.colors.primary}
                            maximumTrackTintColor={theme.colors.border}
                            thumbTintColor={theme.colors.primary}
                            step={1}
                        />
                        <View style={styles.sliderRange}>
                            <Text style={styles.sliderRangeText}>1 dia</Text>
                            <Text style={styles.sliderRangeText}>30 dias</Text>
                        </View>
                    </View>

                    {/* ── 3. COMO VOCÊ QUER VIAJAR? ── */}
                    <View style={styles.filterSection}>
                        <View style={styles.filterLabelWithIcon}>
                            <Icon name="compass" size={16} color={theme.colors.primary} />
                            <Text style={styles.filterLabel}>Como você quer viajar?</Text>
                        </View>
                        <View style={styles.intentGrid}>
                            {INTENT_CATEGORIES.map((intent) => {
                                const isSelected = travelIntent === intent.id;
                                return (
                                    <TouchableOpacity
                                        key={intent.id}
                                        style={[
                                            styles.intentCard,
                                            isSelected && styles.intentCardActive,
                                        ]}
                                        onPress={() => handleIntentSelect(intent.id)}
                                        activeOpacity={0.8}
                                    >
                                        <Icon
                                            name={intent.icon as IconName}
                                            size={28}
                                            color={isSelected ? theme.colors.primary : theme.colors.text.secondary}
                                            strokeWidth={isSelected ? 2 : 1.5}
                                        />
                                        <Text style={[
                                            styles.intentLabel,
                                            isSelected && styles.intentLabelActive,
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

                    {/* ── 4. CATEGORIAS ── */}
                    <View style={styles.filterSection}>
                        <View style={styles.filterLabelWithIcon}>
                            <Icon name="filter" size={16} color={theme.colors.primary} />
                            <Text style={styles.filterLabel}>Categorias</Text>
                        </View>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.categoriesScroll}
                        >
                            {CATEGORIES.map((cat) => {
                                const isActive = selectedCategories.includes(cat.id);
                                return (
                                    <TouchableOpacity
                                        key={cat.id}
                                        style={[
                                            styles.categoryPill,
                                            isActive && styles.categoryPillActive,
                                        ]}
                                        onPress={() => toggleSelectedCategory(cat.id)}
                                    >
                                        <Icon
                                            name={cat.icon as IconName}
                                            size={16}
                                            color={isActive ? '#FFFFFF' : theme.colors.text.primary}
                                        />
                                        <Text style={[
                                            styles.categoryLabel,
                                            isActive && styles.categoryLabelActive,
                                        ]}>
                                            {cat.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>

                    {/* Filtro de Faixa de Preço REMOVIDO — preço segue exibido
                        nos cards/checkout, mas não é mais critério de filtro. */}
                </ScrollView>

                {/* Result Counter + Actions */}
                <View style={styles.footer}>
                    {/* Dynamic result counter */}
                    <View style={styles.resultCounter}>
                        {localActiveCount > 0 ? (
                            <Text style={styles.resultCounterText}>
                                <Text style={styles.resultCounterBold}>{resultCount}</Text>
                                {' '}{resultLabel}{resultCount !== 1 ? 's' : ''} encontrado{resultCount !== 1 ? 's' : ''}
                            </Text>
                        ) : (
                            <Text style={styles.resultCounterText}>
                                Mostrando todos os {resultLabel}s disponíveis
                            </Text>
                        )}
                    </View>

                    {/* Actions */}
                    <View style={styles.actions}>
                        <Animated.View style={[
                            styles.clearButtonWrapper,
                            {
                                borderColor: clearAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [theme.colors.border, theme.colors.primary],
                                }),
                            },
                        ]}>
                            <TouchableOpacity
                                style={styles.clearButton}
                                onPress={handleClearFilters}
                            >
                                <Text style={[
                                    styles.clearButtonText,
                                    localActiveCount > 0 && styles.clearButtonTextActive,
                                ]}>
                                    Limpar{localActiveCount > 0 ? ` (${localActiveCount})` : ''}
                                </Text>
                            </TouchableOpacity>
                        </Animated.View>

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
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <Icon name="search" size={18} color="#FFFFFF" strokeWidth={2.5} />
                                    <Text style={styles.searchButtonText}>Buscar</Text>
                                </View>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
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
        height: height * 0.9,
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
        alignItems: 'flex-start',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.colors.text.primary,
    },
    microcopy: {
        fontSize: 12,
        color: theme.colors.text.tertiary,
        marginTop: 4,
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: theme.colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 2,
    },
    closeIcon: {
        fontSize: 18,
        color: theme.colors.text.secondary,
    },
    filterLabelWithIcon: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    content: {
        flex: 1,
        paddingHorizontal: theme.spacing.lg,
        paddingTop: theme.spacing.lg,
    },
    filterSection: {
        marginBottom: 28,
    },
    filterLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.md,
    },
    filterLabelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    filterValue: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.primary,
    },

    // Input
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 14,
        paddingHorizontal: theme.spacing.md,
        height: 56,
    },
    inputIcon: {
        marginRight: theme.spacing.sm,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: theme.colors.text.primary,
    },

    // Duration Chips
    durationChipsScroll: {
        gap: 8,
        marginBottom: 14,
    },
    durationChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    durationChipActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    durationChipText: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    durationChipTextActive: {
        color: '#FFFFFF',
    },

    // Slider (shared by duration & price)
    slider: {
        width: '100%',
        height: 40,
    },
    sliderRange: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: -6,
    },
    sliderRangeText: {
        fontSize: 12,
        color: theme.colors.text.secondary,
    },

    // Intent / Travel Style
    intentGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    intentCard: {
        width: '31%',
        alignItems: 'center',
        paddingVertical: 16,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.background,
    },
    intentCardActive: {
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.primary + '0D',
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 3,
    },
    intentIconContainer: {
        marginBottom: 8,
    },
    intentLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    intentLabelActive: {
        color: theme.colors.primary,
        fontWeight: '700',
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

    // Category Pills
    categoriesScroll: {
        gap: theme.spacing.sm,
    },
    categoryPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: theme.borderRadius.full,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    categoryIcon: {
        // Lucide icon, no font size needed
    },
    categoryLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: theme.colors.text.primary,
    },
    categoryPillActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    categoryLabelActive: {
        color: '#FFFFFF',
    },

    // Footer
    footer: {
        paddingHorizontal: theme.spacing.lg,
        paddingTop: 10,
        paddingBottom: theme.spacing.lg,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        backgroundColor: theme.colors.background,
    },
    resultCounter: {
        alignItems: 'center',
        marginBottom: 12,
    },
    resultCounterText: {
        fontSize: 13,
        color: theme.colors.text.secondary,
    },
    resultCounterBold: {
        fontWeight: '700',
        color: theme.colors.primary,
        fontSize: 14,
    },

    // Actions
    actions: {
        flexDirection: 'row',
        gap: theme.spacing.md,
    },
    clearButtonWrapper: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        borderWidth: 2,
        overflow: 'hidden',
    },
    clearButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    clearButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.text.secondary,
    },
    clearButtonTextActive: {
        color: theme.colors.primary,
        fontWeight: '700',
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

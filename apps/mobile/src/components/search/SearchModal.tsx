import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ScrollView,
    Animated,
    useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme/theme';
import { SearchFilters } from '../../contexts/SearchContext';
import { CATEGORIES, INTENT_CATEGORIES, INTENT_FEEDBACK } from '../../constants/categories';
import {
    DURATION_PRESETS,
    DurationPresetId,
    DEFAULT_DURATION_PRESET,
    getDurationRange,
    resolveDurationPresetFromRange,
} from '../../constants/durationPresets';
import { useSearch } from '../../hooks/useSearch';
import { Icon, IconName } from '../common/Icons';
import { DestinationAutocomplete } from './DestinationAutocomplete';
import { countMatchingItineraries, DestinationSuggestion } from '../../utils/searchUtils';

/**
 * Distância inicial da animação de entrada. Só o ponto de partida: a altura
 * real vem de `useWindowDimensions` dentro do componente.
 *
 * ⚠️ O valor era lido de `Dimensions.get('window')` no escopo do módulo — na
 * web esse read acontece antes do layout e devolvia 0, deixando o modal com
 * `height: 0` e todo o conteúdo abaixo da dobra (filtros invisíveis).
 */
const INITIAL_SLIDE_OFFSET = 900;

/** Cabeçalho padrão de seção — ícone em wrapper de tamanho fixo + rótulo. */
function FilterHeader({ icon, label }: { icon: IconName; label: string }) {
    return (
        <View style={styles.filterHeader}>
            <View style={styles.filterHeaderIcon}>
                <Icon name={icon} size={FILTER_HEADER_ICON_SIZE} color={theme.colors.primary} strokeWidth={2} />
            </View>
            <Text style={styles.filterHeaderLabel}>{label}</Text>
        </View>
    );
}

/** Tamanho único dos ícones de cabeçalho — nada de ícone maior que o outro. */
const FILTER_HEADER_ICON_SIZE = 18;

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
    const { height: windowHeight } = useWindowDimensions();
    const [slideAnim] = useState(new Animated.Value(INITIAL_SLIDE_OFFSET));
    const [backdropAnim] = useState(new Animated.Value(0));
    const [clearAnim] = useState(new Animated.Value(0));
    const {
        travelIntent: appliedIntent, setTravelIntent,
        selectedCategories: appliedCategories, setSelectedCategories,
        allItineraries,
        destinationSuggestions,
    } = useSearch();

    // ── Filtros LOCAIS ────────────────────────────────────────────────────
    // Nada aqui toca o SearchContext até o usuário apertar "Buscar": é o que
    // permite a contagem do rodapé reagir na hora sem alterar a listagem por
    // trás do modal (e faz o "Limpar" não deixar filtro invisível aplicado).
    const [destination, setDestination] = useState('');
    const [durationPreset, setDurationPreset] = useState<DurationPresetId>(DEFAULT_DURATION_PRESET);
    const [travelIntent, setLocalIntent] = useState<string | null>(null);
    const [selectedCategories, setLocalCategories] = useState<string[]>([]);

    // Títulos por contexto
    const contextTitles = {
        home: 'Buscar Roteiros',
        itineraries: 'Buscar Roteiros',
    };

    const resultLabel = 'roteiro';

    /**
     * Hidrata o estado local a cada abertura, a partir do que está realmente
     * aplicado. Reabrir o modal mostra os filtros vigentes marcados.
     */
    useEffect(() => {
        if (!visible) return;
        setDestination(initialFilters?.destination || '');
        setDurationPreset(
            initialFilters?.durationPreset
            ?? resolveDurationPresetFromRange(initialFilters?.durationMin, initialFilters?.durationMax)
            ?? DEFAULT_DURATION_PRESET,
        );
        setLocalIntent(appliedIntent);
        setLocalCategories(appliedCategories);
    }, [visible]);

    /** Faixa derivada do preset — única fonte de durationMin/durationMax. */
    const durationRange = useMemo(() => getDurationRange(durationPreset), [durationPreset]);

    /**
     * Prévia de resultados: mesma função pura da listagem, alimentada pelos
     * filtros LOCAIS. Por isso o número muda antes de tocar em "Buscar".
     */
    const resultCount = useMemo(() => countMatchingItineraries(allItineraries, {
        destination,
        durationMin: durationRange.durationMin,
        durationMax: durationRange.durationMax,
        selectedCategories,
        travelIntent,
    }), [allItineraries, destination, durationRange, selectedCategories, travelIntent]);

    // Contagem de filtros locais ativos
    const localActiveCount = useMemo(() => {
        let count = 0;
        if (destination) count++;
        if (durationPreset !== DEFAULT_DURATION_PRESET) count++;
        if (travelIntent) count++;
        if (selectedCategories.length > 0) count++;
        return count;
    }, [destination, durationPreset, travelIntent, selectedCategories]);

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
                    toValue: windowHeight || INITIAL_SLIDE_OFFSET,
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
        setDurationPreset(DEFAULT_DURATION_PRESET); // "Qualquer" volta a ficar aceso
        setLocalIntent(null);
        setLocalCategories([]);
    };

    const handleApplyFilters = () => {
        // Intenção e categorias vivem em outro pedaço do contexto — precisam ser
        // empurradas junto para o estado aplicado bater com o que o modal mostra.
        setTravelIntent(travelIntent);
        setSelectedCategories(selectedCategories);
        const filters: SearchFilters = { destination, ...durationRange };
        onSearch(filters);
        onClose();
    };

    const handleIntentSelect = (intentId: string) => {
        setLocalIntent(prev => (prev === intentId ? null : intentId));
    };

    const handleToggleCategory = (categoryId: string) => {
        setLocalCategories(prev =>
            prev.includes(categoryId)
                ? prev.filter(item => item !== categoryId)
                : [...prev, categoryId],
        );
    };

    /** Seleção única e sempre definida: reapertar o chip ativo volta a "Qualquer". */
    const handleDurationPreset = (presetId: DurationPresetId) => {
        setDurationPreset(prev => (prev === presetId ? DEFAULT_DURATION_PRESET : presetId));
    };

    const handleSelectDestination = (suggestion: DestinationSuggestion) => {
        // Grava o termo buscável ("Tóquio"), nunca um label composto.
        setDestination(suggestion.searchValue);
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
                    // Sem isso o primeiro toque numa sugestão só fecha o teclado.
                    keyboardShouldPersistTaps="handled"
                >
                    {/* ── 1. DESTINO ── */}
                    <View style={styles.filterSection}>
                        <FilterHeader icon="location" label="Destino" />
                        <DestinationAutocomplete
                            value={destination}
                            suggestions={destinationSuggestions}
                            onChangeText={setDestination}
                            onSelect={handleSelectDestination}
                        />
                    </View>

                    {/* ── 2. DURAÇÃO DA VIAGEM ── */}
                    <View style={styles.filterSection}>
                        <FilterHeader icon="calendar" label="Duração da viagem" />
                        <View style={styles.durationChips}>
                            {DURATION_PRESETS.map((preset) => {
                                const isActive = durationPreset === preset.id;
                                return (
                                    <TouchableOpacity
                                        key={preset.id}
                                        style={[
                                            styles.durationChip,
                                            isActive && styles.durationChipActive,
                                        ]}
                                        onPress={() => handleDurationPreset(preset.id)}
                                        activeOpacity={0.8}
                                        accessibilityRole="button"
                                        accessibilityState={{ selected: isActive }}
                                        accessibilityLabel={preset.accessibilityLabel}
                                        testID={`duration-preset-${preset.id}`}
                                    >
                                        <Text
                                            style={[
                                                styles.durationChipText,
                                                isActive && styles.durationChipTextActive,
                                            ]}
                                            numberOfLines={1}
                                        >
                                            {preset.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* ── 3. COMO VOCÊ QUER VIAJAR? ── */}
                    <View style={styles.filterSection}>
                        <FilterHeader icon="compass" label="Como você quer viajar?" />
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
                                        accessibilityRole="button"
                                        accessibilityState={{ selected: isSelected }}
                                        accessibilityLabel={`Filtrar roteiros de estilo ${intent.label}`}
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
                        <FilterHeader icon="filter" label="Categorias" />
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.categoriesScroll}
                            keyboardShouldPersistTaps="handled"
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
                                        onPress={() => handleToggleCategory(cat.id)}
                                        accessibilityRole="button"
                                        accessibilityState={{ selected: isActive }}
                                        accessibilityLabel={`Filtrar roteiros da categoria ${cat.label}`}
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
        // Percentual (não pixel calculado no import): correto em qualquer
        // viewport, sobrevive a rotação/resize e não depende de medir a janela
        // antes do primeiro layout.
        height: '90%',
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
    content: {
        flex: 1,
        paddingHorizontal: theme.spacing.lg,
        paddingTop: theme.spacing.lg,
    },
    filterSection: {
        marginBottom: 28,
    },

    // Cabeçalho de seção — mesma estrutura em TODAS as seções, para os ícones
    // ficarem do mesmo tamanho e na mesma linha de base do texto.
    filterHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: theme.spacing.md,
    },
    filterHeaderIcon: {
        // Caixa fixa: o ícone nunca herda largura do flex nem estica quando o
        // título é longo.
        width: FILTER_HEADER_ICON_SIZE,
        height: FILTER_HEADER_ICON_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    filterHeaderLabel: {
        flexShrink: 1,
        fontSize: 16,
        lineHeight: FILTER_HEADER_ICON_SIZE,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },

    // Duration chips — em wrap, nada escondido em rolagem horizontal.
    durationChips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    durationChip: {
        minHeight: 44,
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: theme.borderRadius.full,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    durationChipActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    durationChipText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    durationChipTextActive: {
        color: '#FFFFFF',
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

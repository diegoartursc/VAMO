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
import { DateRangePicker } from './DateRangePicker';
import { DurationSlider } from './DurationSlider';
import { SearchFilters } from '../../contexts/SearchContext';

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

    // Filtros locais (estado do modal)
    const [destination, setDestination] = useState(initialFilters?.destination || '');
    const [startDate, setStartDate] = useState<Date | undefined>(initialFilters?.startDate);
    const [endDate, setEndDate] = useState<Date | undefined>(initialFilters?.endDate);
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
        setStartDate(undefined);
        setEndDate(undefined);
        setDuration(7);
        setPriceRange([0, 50000]);
    };

    const handleApplyFilters = () => {
        const filters: SearchFilters = {
            destination,
            startDate: context === 'itineraries' ? undefined : startDate,
            endDate: context === 'itineraries' ? undefined : endDate,
            duration: context === 'itineraries' ? duration : undefined,
            priceMin: priceRange[0],
            priceMax: priceRange[1],
        };
        onSearch(filters);
        onClose();
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

                    {/* Datas ou Duração (dependendo do contexto) */}
                    {context === 'itineraries' ? (
                        <DurationSlider
                            value={duration}
                            onChange={setDuration}
                            min={1}
                            max={30}
                            step={1}
                        />
                    ) : (
                        <DateRangePicker
                            startDate={startDate}
                            endDate={endDate}
                            onStartDateChange={setStartDate}
                            onEndDateChange={setEndDate}
                        />
                    )}

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

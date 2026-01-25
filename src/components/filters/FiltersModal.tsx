import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
    ScrollView,
    Pressable,
} from 'react-native';
import { theme } from '../../theme/theme';

export interface FilterState {
    budget: {
        min: number;
        max: number;
    };
    duration: {
        short: boolean;
        medium: boolean;
        long: boolean;
    };
    minRating: number;
    includesFlight: boolean | null;
    categories: string[];
}

const DEFAULT_FILTERS: FilterState = {
    budget: { min: 0, max: 50000 },
    duration: { short: false, medium: false, long: false },
    minRating: 0,
    includesFlight: null,
    categories: [],
};

interface FiltersModalProps {
    visible: boolean;
    onClose: () => void;
    onApply: (filters: FilterState) => void;
    currentFilters: FilterState;
}

const CATEGORIES = [
    { id: 'beach', label: 'Praia', icon: '🏖️' },
    { id: 'adventure', label: 'Aventura', icon: '🏔️' },
    { id: 'cultural', label: 'Cultural', icon: '🏛️' },
    { id: 'romantic', label: 'Romântico', icon: '💕' },
    { id: 'relaxation', label: 'Relaxamento', icon: '🧘' },
    { id: 'family', label: 'Família', icon: '👨‍👩‍👧‍👦' },
];

const BUDGET_OPTIONS = [
    { label: 'Até R$ 5.000', min: 0, max: 5000 },
    { label: 'R$ 5.000 - R$ 10.000', min: 5000, max: 10000 },
    { label: 'R$ 10.000 - R$ 20.000', min: 10000, max: 20000 },
    { label: 'Acima de R$ 20.000', min: 20000, max: 100000 },
    { label: 'Qualquer valor', min: 0, max: 100000 },
];

export function FiltersModal({ visible, onClose, onApply, currentFilters }: FiltersModalProps) {
    const [filters, setFilters] = useState<FilterState>(currentFilters);

    const handleCategoryToggle = (categoryId: string) => {
        setFilters(prev => ({
            ...prev,
            categories: prev.categories.includes(categoryId)
                ? prev.categories.filter(c => c !== categoryId)
                : [...prev.categories, categoryId],
        }));
    };

    const handleDurationToggle = (key: 'short' | 'medium' | 'long') => {
        setFilters(prev => ({
            ...prev,
            duration: {
                ...prev.duration,
                [key]: !prev.duration[key],
            },
        }));
    };

    const handleBudgetSelect = (min: number, max: number) => {
        setFilters(prev => ({
            ...prev,
            budget: { min, max },
        }));
    };

    const handleRatingSelect = (rating: number) => {
        setFilters(prev => ({
            ...prev,
            minRating: prev.minRating === rating ? 0 : rating,
        }));
    };

    const handleReset = () => {
        setFilters(DEFAULT_FILTERS);
    };

    const handleApply = () => {
        onApply(filters);
        onClose();
    };

    const getActiveFiltersCount = (): number => {
        let count = 0;
        if (filters.budget.min > 0 || filters.budget.max < 50000) count++;
        if (filters.duration.short || filters.duration.medium || filters.duration.long) count++;
        if (filters.minRating > 0) count++;
        if (filters.categories.length > 0) count++;
        if (filters.includesFlight !== null) count++;
        return count;
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <Pressable style={styles.overlay} onPress={onClose}>
                <Pressable style={styles.modal} onPress={() => { }}>
                    <View style={styles.handle} />

                    <View style={styles.header}>
                        <Text style={styles.title}>Filtros</Text>
                        <TouchableOpacity onPress={handleReset}>
                            <Text style={styles.resetButton}>Limpar tudo</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        {/* Budget Section */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>💰 Orçamento</Text>
                            <View style={styles.optionsGrid}>
                                {BUDGET_OPTIONS.map((option, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={[
                                            styles.optionButton,
                                            filters.budget.min === option.min && filters.budget.max === option.max && styles.optionButtonActive,
                                        ]}
                                        onPress={() => handleBudgetSelect(option.min, option.max)}
                                    >
                                        <Text
                                            style={[
                                                styles.optionButtonText,
                                                filters.budget.min === option.min && filters.budget.max === option.max && styles.optionButtonTextActive,
                                            ]}
                                        >
                                            {option.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Duration Section */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>📅 Duração</Text>
                            <View style={styles.optionsRow}>
                                <TouchableOpacity
                                    style={[styles.durationButton, filters.duration.short && styles.durationButtonActive]}
                                    onPress={() => handleDurationToggle('short')}
                                >
                                    <Text style={[styles.durationText, filters.duration.short && styles.durationTextActive]}>
                                        3-5 dias
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.durationButton, filters.duration.medium && styles.durationButtonActive]}
                                    onPress={() => handleDurationToggle('medium')}
                                >
                                    <Text style={[styles.durationText, filters.duration.medium && styles.durationTextActive]}>
                                        6-10 dias
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.durationButton, filters.duration.long && styles.durationButtonActive]}
                                    onPress={() => handleDurationToggle('long')}
                                >
                                    <Text style={[styles.durationText, filters.duration.long && styles.durationTextActive]}>
                                        11+ dias
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Rating Section */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>⭐ Avaliação mínima</Text>
                            <View style={styles.ratingRow}>
                                {[4.5, 4.0, 3.5, 3.0].map((rating) => (
                                    <TouchableOpacity
                                        key={rating}
                                        style={[styles.ratingButton, filters.minRating === rating && styles.ratingButtonActive]}
                                        onPress={() => handleRatingSelect(rating)}
                                    >
                                        <Text style={styles.ratingIcon}>⭐</Text>
                                        <Text style={[styles.ratingText, filters.minRating === rating && styles.ratingTextActive]}>
                                            {rating}+
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Categories Section */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>🎯 Categoria</Text>
                            <View style={styles.categoriesGrid}>
                                {CATEGORIES.map((category) => (
                                    <TouchableOpacity
                                        key={category.id}
                                        style={[
                                            styles.categoryButton,
                                            filters.categories.includes(category.id) && styles.categoryButtonActive,
                                        ]}
                                        onPress={() => handleCategoryToggle(category.id)}
                                    >
                                        <Text style={styles.categoryIcon}>{category.icon}</Text>
                                        <Text
                                            style={[
                                                styles.categoryText,
                                                filters.categories.includes(category.id) && styles.categoryTextActive,
                                            ]}
                                        >
                                            {category.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </ScrollView>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                            <Text style={styles.cancelButtonText}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
                            <Text style={styles.applyButtonText}>
                                Aplicar {getActiveFiltersCount() > 0 ? `(${getActiveFiltersCount()})` : ''}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modal: {
        backgroundColor: theme.colors.background,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '85%',
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: theme.colors.border,
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: theme.spacing.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.colors.text.primary,
    },
    resetButton: {
        fontSize: 14,
        color: theme.colors.primary,
        fontWeight: '500',
    },
    content: {
        paddingHorizontal: theme.spacing.lg,
    },
    section: {
        paddingVertical: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.md,
    },
    optionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    optionButton: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: theme.borderRadius.full,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    optionButtonActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    optionButtonText: {
        fontSize: 13,
        color: theme.colors.text.primary,
    },
    optionButtonTextActive: {
        color: theme.colors.text.inverse,
    },
    optionsRow: {
        flexDirection: 'row',
        gap: 8,
    },
    durationButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: theme.borderRadius.md,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        alignItems: 'center',
    },
    durationButtonActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    durationText: {
        fontSize: 14,
        fontWeight: '500',
        color: theme.colors.text.primary,
    },
    durationTextActive: {
        color: theme.colors.text.inverse,
    },
    ratingRow: {
        flexDirection: 'row',
        gap: 8,
    },
    ratingButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: theme.borderRadius.md,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        gap: 4,
    },
    ratingButtonActive: {
        backgroundColor: theme.colors.secondary,
        borderColor: theme.colors.secondary,
    },
    ratingIcon: {
        fontSize: 14,
    },
    ratingText: {
        fontSize: 14,
        fontWeight: '500',
        color: theme.colors.text.primary,
    },
    ratingTextActive: {
        fontWeight: '600',
    },
    categoriesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    categoryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: theme.borderRadius.full,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        gap: 6,
    },
    categoryButtonActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    categoryIcon: {
        fontSize: 16,
    },
    categoryText: {
        fontSize: 13,
        color: theme.colors.text.primary,
    },
    categoryTextActive: {
        color: theme.colors.text.inverse,
    },
    footer: {
        flexDirection: 'row',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.lg,
        paddingBottom: 34,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: theme.colors.borderLight,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: theme.borderRadius.full,
        backgroundColor: theme.colors.surface,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    applyButton: {
        flex: 2,
        paddingVertical: 14,
        borderRadius: theme.borderRadius.full,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
    },
    applyButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.text.inverse,
    },
});

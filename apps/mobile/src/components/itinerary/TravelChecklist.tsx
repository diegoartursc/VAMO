import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { ChecklistItem } from '../../data/mockPurchasedItineraries';

interface TravelChecklistProps {
    items: ChecklistItem[];
    onToggleItem?: (itemId: string) => void;
    onAddCustomItem?: (text: string, category: ChecklistItem['category']) => void;
    onDeleteItem?: (itemId: string) => void;
}

export function TravelChecklist({
    items,
    onToggleItem,
    onAddCustomItem,
    onDeleteItem,
}: TravelChecklistProps) {
    const [isAddingItem, setIsAddingItem] = useState(false);
    const [newItemText, setNewItemText] = useState('');
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
        new Set(['documents', 'packing', 'pre-trip'])
    );

    const categories = [
        { id: 'documents', label: 'Documentos', icon: '📄' },
        { id: 'packing', label: 'Bagagem', icon: '🎒' },
        { id: 'pre-trip', label: 'Pré-Viagem', icon: '✅' },
        { id: 'custom', label: 'Personalizado', icon: '📝' },
    ];

    const toggleCategory = (categoryId: string) => {
        const newExpanded = new Set(expandedCategories);
        if (newExpanded.has(categoryId)) {
            newExpanded.delete(categoryId);
        } else {
            newExpanded.add(categoryId);
        }
        setExpandedCategories(newExpanded);
    };

    const getItemsByCategory = (categoryId: string) => {
        return items.filter(item => item.category === categoryId);
    };

    const getCategoryProgress = (categoryId: string) => {
        const categoryItems = getItemsByCategory(categoryId);
        if (categoryItems.length === 0) return 0;
        const completed = categoryItems.filter(item => item.completed).length;
        return Math.round((completed / categoryItems.length) * 100);
    };

    const handleAddItem = () => {
        if (newItemText.trim() && onAddCustomItem) {
            onAddCustomItem(newItemText.trim(), 'custom');
            setNewItemText('');
            setIsAddingItem(false);
        }
    };

    const totalItems = items.length;
    const completedItems = items.filter(item => item.completed).length;
    const overallProgress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Checklist de Viagem</Text>
                    <Text style={styles.subtitle}>
                        {completedItems} de {totalItems} itens completos
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => setIsAddingItem(!isAddingItem)}
                >
                    <Ionicons
                        name={isAddingItem ? 'close' : 'add'}
                        size={24}
                        color={theme.colors.primary}
                    />
                </TouchableOpacity>
            </View>

            {/* Overall Progress */}
            <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${overallProgress}%` }]} />
                </View>
                <Text style={styles.progressText}>{overallProgress}%</Text>
            </View>

            {/* Add Item Form */}
            {isAddingItem && (
                <View style={styles.addItemForm}>
                    <TextInput
                        style={styles.addItemInput}
                        value={newItemText}
                        onChangeText={setNewItemText}
                        placeholder="Adicionar item personalizado..."
                        placeholderTextColor={theme.colors.text.tertiary}
                        autoFocus
                    />
                    <TouchableOpacity style={styles.addItemButton} onPress={handleAddItem}>
                        <Text style={styles.addItemButtonText}>Adicionar</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Categories */}
            {categories.map(category => {
                const categoryItems = getItemsByCategory(category.id);
                if (categoryItems.length === 0 && category.id !== 'custom') return null;

                const isExpanded = expandedCategories.has(category.id);
                const progress = getCategoryProgress(category.id);

                return (
                    <View key={category.id} style={styles.categoryContainer}>
                        {/* Category Header */}
                        <TouchableOpacity
                            style={styles.categoryHeader}
                            onPress={() => toggleCategory(category.id)}
                        >
                            <View style={styles.categoryHeaderLeft}>
                                <Text style={styles.categoryIcon}>{category.icon}</Text>
                                <View>
                                    <Text style={styles.categoryLabel}>{category.label}</Text>
                                    <Text style={styles.categoryCount}>
                                        {categoryItems.filter(i => i.completed).length}/{categoryItems.length}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.categoryHeaderRight}>
                                <View style={styles.categoryProgressBadge}>
                                    <Text style={styles.categoryProgressText}>{progress}%</Text>
                                </View>
                                <Ionicons
                                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                                    size={20}
                                    color={theme.colors.text.secondary}
                                />
                            </View>
                        </TouchableOpacity>

                        {/* Category Items */}
                        {isExpanded && (
                            <View style={styles.itemsContainer}>
                                {categoryItems.map(item => (
                                    <View key={item.id} style={styles.itemRow}>
                                        <TouchableOpacity
                                            style={styles.checkboxContainer}
                                            onPress={() => onToggleItem?.(item.id)}
                                        >
                                            <Ionicons
                                                name={item.completed ? 'checkbox' : 'square-outline'}
                                                size={24}
                                                color={
                                                    item.completed
                                                        ? theme.colors.success
                                                        : theme.colors.border
                                                }
                                            />
                                            <Text
                                                style={[
                                                    styles.itemText,
                                                    item.completed && styles.itemTextCompleted,
                                                ]}
                                            >
                                                {item.text}
                                            </Text>
                                        </TouchableOpacity>
                                        {item.category === 'custom' && onDeleteItem && (
                                            <TouchableOpacity
                                                style={styles.deleteButton}
                                                onPress={() => onDeleteItem(item.id)}
                                            >
                                                <Ionicons
                                                    name="trash-outline"
                                                    size={18}
                                                    color={theme.colors.error}
                                                />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.lg,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        ...theme.shadows.small,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 13,
        color: theme.colors.text.secondary,
    },
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: theme.spacing.md,
    },
    progressBar: {
        flex: 1,
        height: 8,
        backgroundColor: theme.colors.surfaceLight,
        borderRadius: theme.borderRadius.full,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: theme.colors.success,
        borderRadius: theme.borderRadius.full,
    },
    progressText: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.success,
        minWidth: 40,
        textAlign: 'right',
    },
    addItemForm: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: theme.spacing.md,
    },
    addItemInput: {
        flex: 1,
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.md,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: theme.colors.text.primary,
    },
    addItemButton: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: theme.borderRadius.md,
        justifyContent: 'center',
    },
    addItemButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text.onPrimary,
    },
    categoryContainer: {
        marginBottom: theme.spacing.sm,
    },
    categoryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: theme.colors.surfaceLight,
        padding: theme.spacing.sm,
        borderRadius: theme.borderRadius.md,
    },
    categoryHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    categoryIcon: {
        fontSize: 24,
    },
    categoryLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    categoryCount: {
        fontSize: 12,
        color: theme.colors.text.tertiary,
    },
    categoryHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    categoryProgressBadge: {
        backgroundColor: theme.colors.background,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: theme.borderRadius.sm,
    },
    categoryProgressText: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.text.secondary,
    },
    itemsContainer: {
        paddingTop: theme.spacing.sm,
        paddingLeft: theme.spacing.md,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    checkboxContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    itemText: {
        flex: 1,
        fontSize: 14,
        color: theme.colors.text.primary,
    },
    itemTextCompleted: {
        textDecorationLine: 'line-through',
        color: theme.colors.text.tertiary,
    },
    deleteButton: {
        padding: 8,
    },
});

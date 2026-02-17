import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';

interface EditableListProps {
    items: string[];
    onItemsChange: (items: string[]) => void;
    placeholder?: string;
    label?: string;
    maxItems?: number;
    emptyMessage?: string;
}

export default function EditableList({
    items,
    onItemsChange,
    placeholder = 'Adicionar item...',
    label,
    maxItems = 20,
    emptyMessage = 'Nenhum item adicionado',
}: EditableListProps) {
    const [newItem, setNewItem] = useState('');

    const addItem = () => {
        const trimmed = newItem.trim();
        if (trimmed && items.length < maxItems) {
            onItemsChange([...items, trimmed]);
            setNewItem('');
        }
    };

    const removeItem = (index: number) => {
        onItemsChange(items.filter((_, i) => i !== index));
    };

    const moveItem = (fromIndex: number, direction: 'up' | 'down') => {
        const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
        if (toIndex < 0 || toIndex >= items.length) return;
        const newItems = [...items];
        [newItems[fromIndex], newItems[toIndex]] = [newItems[toIndex], newItems[fromIndex]];
        onItemsChange(newItems);
    };

    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}

            {items.length === 0 && (
                <Text style={styles.emptyText}>{emptyMessage}</Text>
            )}

            {items.map((item, index) => (
                <View key={index} style={styles.itemRow}>
                    <View style={styles.itemContent}>
                        <Text style={styles.itemNumber}>{index + 1}.</Text>
                        <Text style={styles.itemText}>{item}</Text>
                    </View>
                    <View style={styles.itemActions}>
                        {index > 0 && (
                            <TouchableOpacity
                                onPress={() => moveItem(index, 'up')}
                                style={styles.actionBtn}
                            >
                                <Ionicons name="chevron-up" size={16} color={theme.colors.text.tertiary} />
                            </TouchableOpacity>
                        )}
                        {index < items.length - 1 && (
                            <TouchableOpacity
                                onPress={() => moveItem(index, 'down')}
                                style={styles.actionBtn}
                            >
                                <Ionicons name="chevron-down" size={16} color={theme.colors.text.tertiary} />
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            onPress={() => removeItem(index)}
                            style={styles.actionBtn}
                        >
                            <Ionicons name="close-circle" size={18} color={theme.colors.error} />
                        </TouchableOpacity>
                    </View>
                </View>
            ))}

            {items.length < maxItems && (
                <View style={styles.addRow}>
                    <TextInput
                        style={styles.addInput}
                        value={newItem}
                        onChangeText={setNewItem}
                        placeholder={placeholder}
                        placeholderTextColor={theme.colors.text.disabled}
                        onSubmitEditing={addItem}
                        returnKeyType="done"
                    />
                    <TouchableOpacity
                        style={[styles.addButton, !newItem.trim() && styles.addButtonDisabled]}
                        onPress={addItem}
                        disabled={!newItem.trim()}
                    >
                        <Ionicons name="add" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            )}

            {items.length > 0 && (
                <Text style={styles.countText}>{items.length}/{maxItems} itens</Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: 8,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.text.secondary,
        marginBottom: 4,
    },
    emptyText: {
        fontSize: 13,
        color: theme.colors.text.tertiary,
        fontStyle: 'italic',
        textAlign: 'center',
        paddingVertical: 12,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        padding: 10,
        borderRadius: 10,
        gap: 8,
    },
    itemContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 6,
    },
    itemNumber: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.text.tertiary,
        marginTop: 1,
    },
    itemText: {
        flex: 1,
        fontSize: 14,
        color: theme.colors.text.primary,
        lineHeight: 20,
    },
    itemActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    actionBtn: {
        padding: 4,
    },
    addRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 4,
    },
    addInput: {
        flex: 1,
        backgroundColor: theme.colors.surface,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 14,
        color: theme.colors.text.primary,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addButtonDisabled: {
        opacity: 0.4,
    },
    countText: {
        fontSize: 11,
        color: theme.colors.text.tertiary,
        textAlign: 'right',
    },
});

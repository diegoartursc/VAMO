import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import { FAQItem } from '../data/mockFAQ';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface FAQSectionProps {
    items: FAQItem[];
    creatorName?: string;
}

export default function FAQSection({ items, creatorName }: FAQSectionProps) {
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    const toggleItem = (index: number) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedIndex(expandedIndex === index ? null : index);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Ionicons name="help-circle" size={24} color={theme.colors.primary} />
                <Text style={styles.title}>Perguntas Frequentes</Text>
            </View>

            {creatorName && (
                <Text style={styles.subtitle}>
                    Respondidas por {creatorName}
                </Text>
            )}

            <View style={styles.list}>
                {items.map((item, index) => {
                    const isExpanded = expandedIndex === index;
                    return (
                        <TouchableOpacity
                            key={index}
                            style={[styles.item, isExpanded && styles.itemExpanded]}
                            onPress={() => toggleItem(index)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.questionRow}>
                                <Text style={[styles.questionText, isExpanded && styles.questionTextExpanded]}>
                                    {item.question}
                                </Text>
                                <Ionicons
                                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                                    size={20}
                                    color={isExpanded ? theme.colors.primary : theme.colors.text.secondary}
                                />
                            </View>
                            {isExpanded && (
                                <Text style={styles.answerText}>
                                    {item.answer}
                                </Text>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.md,
        ...Platform.select({
            web: {
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            },
            default: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.06,
                shadowRadius: 3,
                elevation: 1,
            },
        }),
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 4,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.colors.text.primary,
    },
    subtitle: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        marginBottom: 12,
        marginLeft: 34,
        fontStyle: 'italic',
    },
    list: {
        gap: 8,
        marginTop: 12,
    },
    item: {
        backgroundColor: theme.colors.surfaceLight || '#F8F9FA',
        borderRadius: theme.borderRadius.md,
        padding: 14,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    itemExpanded: {
        backgroundColor: '#F0F7FF',
        borderColor: theme.colors.primary + '30',
    },
    questionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
    },
    questionText: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.text.primary,
        flex: 1,
        lineHeight: 21,
    },
    questionTextExpanded: {
        color: theme.colors.primary,
    },
    answerText: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        lineHeight: 21,
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: theme.colors.primary + '15',
    },
});

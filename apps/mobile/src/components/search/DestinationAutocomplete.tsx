import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    Modal,
    Pressable,
} from 'react-native';
import { theme } from '../../theme/theme';
import { searchDestinations, getPopularDestinations, Destination } from '../../data/destinations';

interface DestinationAutocompleteProps {
    value: string;
    onSelect: (destination: Destination) => void;
    placeholder?: string;
}

export function DestinationAutocomplete({
    value,
    onSelect,
    placeholder = 'Para onde você vai?',
}: DestinationAutocompleteProps) {
    const [query, setQuery] = useState(value);
    const [showDropdown, setShowDropdown] = useState(false);
    const [results, setResults] = useState<Destination[]>(getPopularDestinations());

    const handleChangeText = (text: string) => {
        setQuery(text);
        const searchResults = searchDestinations(text);
        setResults(searchResults);
        setShowDropdown(true);
    };

    const handleSelect = (destination: Destination) => {
        setQuery(`${destination.name}, ${destination.country}`);
        setShowDropdown(false);
        onSelect(destination);
    };

    const handleFocus = () => {
        setResults(query ? searchDestinations(query) : getPopularDestinations());
        setShowDropdown(true);
    };

    const renderItem = ({ item }: { item: Destination }) => (
        <TouchableOpacity
            style={styles.resultItem}
            onPress={() => handleSelect(item)}
        >
            <Text style={styles.resultEmoji}>{item.emoji}</Text>
            <View style={styles.resultTextContainer}>
                <Text style={styles.resultName}>{item.name}</Text>
                <Text style={styles.resultCountry}>{item.country}</Text>
            </View>
            {item.popular && (
                <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>Popular</Text>
                </View>
            )}
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.inputContainer}>
                <Text style={styles.inputIcon}>📍</Text>
                <View style={styles.inputContent}>
                    <Text style={styles.inputLabel}>Destino</Text>
                    <TextInput
                        style={styles.input}
                        placeholder={placeholder}
                        value={query}
                        onChangeText={handleChangeText}
                        onFocus={handleFocus}
                        placeholderTextColor={theme.colors.text.disabled}
                    />
                </View>
                {query.length > 0 && (
                    <TouchableOpacity onPress={() => { setQuery(''); setResults(getPopularDestinations()); }}>
                        <Text style={styles.clearIcon}>✕</Text>
                    </TouchableOpacity>
                )}
            </View>

            {showDropdown && results.length > 0 && (
                <View style={styles.dropdown}>
                    <Text style={styles.dropdownTitle}>
                        {query ? 'Resultados' : '🔥 Destinos Populares'}
                    </Text>
                    <FlatList
                        data={results}
                        keyExtractor={(item) => item.id}
                        renderItem={renderItem}
                        style={styles.resultsList}
                        keyboardShouldPersistTaps="handled"
                    />
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => setShowDropdown(false)}
                    >
                        <Text style={styles.closeButtonText}>Fechar</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        zIndex: 100,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    inputIcon: {
        fontSize: 20,
        marginRight: theme.spacing.md,
    },
    inputContent: {
        flex: 1,
    },
    inputLabel: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        marginBottom: 4,
    },
    input: {
        fontSize: 15,
        color: theme.colors.text.primary,
        padding: 0,
    },
    clearIcon: {
        fontSize: 18,
        color: theme.colors.text.secondary,
        padding: theme.spacing.xs,
    },
    dropdown: {
        position: 'absolute',
        top: '100%',
        left: -theme.spacing.md,
        right: -theme.spacing.md,
        backgroundColor: theme.colors.background,
        borderRadius: theme.borderRadius.md,
        ...theme.shadows.large,
        maxHeight: 350,
        zIndex: 1000,
        marginTop: 4,
    },
    dropdownTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.text.secondary,
        paddingHorizontal: theme.spacing.md,
        paddingTop: theme.spacing.md,
        paddingBottom: theme.spacing.sm,
    },
    resultsList: {
        maxHeight: 250,
    },
    resultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        gap: theme.spacing.sm,
    },
    resultEmoji: {
        fontSize: 24,
        width: 36,
        textAlign: 'center',
    },
    resultTextContainer: {
        flex: 1,
    },
    resultName: {
        fontSize: 15,
        fontWeight: '500',
        color: theme.colors.text.primary,
    },
    resultCountry: {
        fontSize: 13,
        color: theme.colors.text.secondary,
    },
    popularBadge: {
        backgroundColor: theme.colors.secondary,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    popularText: {
        fontSize: 10,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    closeButton: {
        alignItems: 'center',
        paddingVertical: theme.spacing.sm,
        borderTopWidth: 1,
        borderTopColor: theme.colors.borderLight,
    },
    closeButtonText: {
        fontSize: 14,
        color: theme.colors.primary,
        fontWeight: '500',
    },
});

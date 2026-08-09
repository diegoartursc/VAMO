/**
 * DestinationAutocomplete — campo de destino com sugestões dos roteiros REAIS.
 *
 * Não conhece API nem contexto: recebe `suggestions` já prontas (memoizadas em
 * useSearch a partir dos roteiros carregados) e devolve a seleção. Zero request
 * por caractere.
 *
 * Decisões de layout:
 *  - Sem título "Destino" interno: o cabeçalho da seção é do SearchModal, para
 *    o rótulo não aparecer duplicado.
 *  - Dropdown renderizado NO FLUXO (não absoluto) com Views simples: dentro do
 *    ScrollView do modal, posição absoluta é cortada em algumas plataformas e
 *    FlatList aninhada em ScrollView vertical conflita. Como são no máximo 8
 *    itens, lista virtualizada não traz ganho nenhum.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Platform,
    NativeSyntheticEvent,
    TextInputKeyPressEventData,
} from 'react-native';
import { theme } from '../../theme/theme';
import { Icon } from '../common/Icons';
import {
    DestinationSuggestion,
    searchDestinationSuggestions,
    DESTINATION_SUGGESTION_LIMIT,
} from '../../utils/searchUtils';

interface DestinationAutocompleteProps {
    /** Texto atual do campo (controlado pelo pai). */
    value: string;
    /** Fonte das opções — já filtrada para roteiros disponíveis. */
    suggestions: DestinationSuggestion[];
    /** Digitação livre: o texto também vale como filtro. */
    onChangeText: (text: string) => void;
    /** Seleção de uma sugestão — grava `searchValue`, nunca o label composto. */
    onSelect: (suggestion: DestinationSuggestion) => void;
    placeholder?: string;
    /** Limite de itens exibidos. */
    limit?: number;
}

export function DestinationAutocomplete({
    value,
    suggestions,
    onChangeText,
    onSelect,
    placeholder = 'Para onde você quer ir?',
    limit = DESTINATION_SUGGESTION_LIMIT,
}: DestinationAutocompleteProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const inputRef = useRef<TextInput>(null);
    // Fechar no blur precisa esperar o toque na sugestão ser processado — em
    // web e Android o blur chega ANTES do press. O timer é cancelado assim que
    // uma sugestão é escolhida, então o toque nunca se perde.
    const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const cancelBlurClose = () => {
        if (blurTimer.current) {
            clearTimeout(blurTimer.current);
            blurTimer.current = null;
        }
    };

    useEffect(() => cancelBlurClose, []);

    const visibleSuggestions = useMemo(
        () => searchDestinationSuggestions(suggestions, value, limit),
        [suggestions, value, limit],
    );

    const showEmptyState = isOpen && value.trim().length > 0 && visibleSuggestions.length === 0;
    const showList = isOpen && visibleSuggestions.length > 0;

    const handleChangeText = (text: string) => {
        onChangeText(text);
        setHighlightedIndex(-1);
        setIsOpen(true);
    };

    const handleSelect = (suggestion: DestinationSuggestion) => {
        cancelBlurClose();
        onSelect(suggestion);
        setHighlightedIndex(-1);
        setIsOpen(false);
    };

    const handleBlur = () => {
        cancelBlurClose();
        blurTimer.current = setTimeout(() => setIsOpen(false), 150);
    };

    const handleClear = () => {
        onChangeText('');
        setHighlightedIndex(-1);
        setIsOpen(true);
        inputRef.current?.focus();
    };

    /**
     * Teclado no web: setas navegam, Enter confirma, Escape fecha. No nativo o
     * evento não traz essas teclas — o guard evita comportamento fantasma.
     */
    const handleKeyPress = (event: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
        if (Platform.OS !== 'web') return;
        const key = event.nativeEvent.key;

        if (key === 'Escape') {
            setIsOpen(false);
            setHighlightedIndex(-1);
            return;
        }
        if (key === 'ArrowDown' || key === 'ArrowUp') {
            (event as unknown as { preventDefault?: () => void }).preventDefault?.();
            if (visibleSuggestions.length === 0) return;
            setIsOpen(true);
            setHighlightedIndex(prev => {
                const next = key === 'ArrowDown' ? prev + 1 : prev - 1;
                if (next < 0) return visibleSuggestions.length - 1;
                if (next >= visibleSuggestions.length) return 0;
                return next;
            });
            return;
        }
        if (key === 'Enter') {
            const picked = visibleSuggestions[highlightedIndex] ?? visibleSuggestions[0];
            if (isOpen && picked) handleSelect(picked);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.inputContainer}>
                <Icon name="globe" size={20} color={theme.colors.text.tertiary} />
                <TextInput
                    ref={inputRef}
                    style={styles.input}
                    placeholder={placeholder}
                    placeholderTextColor={theme.colors.text.secondary}
                    value={value}
                    onChangeText={handleChangeText}
                    onFocus={() => { cancelBlurClose(); setIsOpen(true); }}
                    onBlur={handleBlur}
                    onKeyPress={handleKeyPress}
                    autoCorrect={false}
                    returnKeyType="search"
                    accessibilityLabel="Destino"
                    accessibilityHint="Digite para ver sugestões de destinos com roteiros disponíveis"
                    // Web: desliga o autocomplete do navegador pra não cobrir o nosso.
                    {...(Platform.OS === 'web' ? ({ autoComplete: 'off' } as object) : {})}
                />
                {value.length > 0 && (
                    <TouchableOpacity
                        onPress={handleClear}
                        style={styles.clearButton}
                        accessibilityRole="button"
                        accessibilityLabel="Limpar destino"
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Icon name="close" size={16} color={theme.colors.text.secondary} />
                    </TouchableOpacity>
                )}
            </View>

            {showList && (
                <View style={styles.dropdown} accessibilityRole="menu">
                    {!value.trim() && (
                        <Text style={styles.dropdownHint}>Destinos com roteiros disponíveis</Text>
                    )}
                    {visibleSuggestions.map((suggestion, index) => {
                        const highlighted = index === highlightedIndex;
                        return (
                            <TouchableOpacity
                                key={suggestion.id}
                                style={[styles.item, highlighted && styles.itemHighlighted]}
                                onPressIn={cancelBlurClose}
                                onPress={() => handleSelect(suggestion)}
                                accessibilityRole="menuitem"
                                accessibilityLabel={`${suggestion.label}, ${suggestion.itineraryCount} ${suggestion.itineraryCount === 1 ? 'roteiro' : 'roteiros'}`}
                                testID={`destination-suggestion-${suggestion.id}`}
                            >
                                <Icon
                                    name={suggestion.type === 'country' ? 'globe' : 'location'}
                                    size={16}
                                    color={theme.colors.primary}
                                />
                                <Text style={styles.itemLabel} numberOfLines={1}>
                                    {suggestion.label}
                                </Text>
                                <Text style={styles.itemCount}>
                                    {suggestion.itineraryCount} {suggestion.itineraryCount === 1 ? 'roteiro' : 'roteiros'}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            )}

            {showEmptyState && (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>
                        Nenhum destino encontrado com roteiros disponíveis.
                    </Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 14,
        paddingHorizontal: theme.spacing.md,
        height: 56,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: theme.colors.text.primary,
        // RNW desenha um contorno próprio no foco; o container já dá a moldura.
        ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {}),
    },
    clearButton: {
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dropdown: {
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 14,
        overflow: 'hidden',
    },
    dropdownHint: {
        fontSize: 12,
        color: theme.colors.text.tertiary,
        paddingHorizontal: 14,
        paddingTop: 10,
        paddingBottom: 4,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 14,
        minHeight: 44,
        paddingVertical: 10,
    },
    itemHighlighted: {
        backgroundColor: theme.colors.surfaceHighlight,
    },
    itemLabel: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
        color: theme.colors.text.primary,
    },
    itemCount: {
        fontSize: 12,
        color: theme.colors.text.tertiary,
    },
    emptyState: {
        paddingHorizontal: 14,
        paddingVertical: 12,
        backgroundColor: theme.colors.surfaceLight,
        borderRadius: 14,
    },
    emptyStateText: {
        fontSize: 13,
        color: theme.colors.text.secondary,
    },
});

export default DestinationAutocomplete;

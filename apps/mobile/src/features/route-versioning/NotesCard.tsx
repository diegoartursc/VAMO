/**
 * NotesCard — bloco de anotações pessoais do viajante (textarea com
 * debounce + contador).
 *
 * Estratégia:
 *  - Buffer local (`draft`) controla o TextInput; o backend só recebe
 *    via `onChange(draft)` depois de 500ms sem digitação. Isso evita
 *    spam de PUTs a cada tecla.
 *  - Quando o `value` externo mudar (ex: rollback de erro), resincroniza
 *    o draft — mas só se o input não estiver focado, para não apagar o
 *    que o usuário está escrevendo no momento.
 *
 * Comprimento máximo: 4000 chars (alinhado ao limite que o backend
 * tipicamente aplica em campos Text livres). Contador aparece a partir
 * de 50% do limite.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../../theme/theme';

export interface NotesCardProps {
    /** Valor canônico vindo do backend / customization. */
    value: string | null;
    /** Disparado após 500ms sem digitação com a string final. `null` se vazio. */
    onChange: (next: string | null) => void;
    /** Se true, exibe input em modo leitura (sem editar). */
    readOnly?: boolean;
    /** Caracteres máximos. Default 4000. */
    maxLength?: number;
}

const DEBOUNCE_MS = 500;

export default function NotesCard({
    value,
    onChange,
    readOnly,
    maxLength = 4000,
}: NotesCardProps) {
    const [draft, setDraft] = useState<string>(value ?? '');
    const focusedRef = useRef(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Resync quando valor externo muda (ex: rollback) — mas só se NÃO focado.
    useEffect(() => {
        if (focusedRef.current) return;
        setDraft(value ?? '');
    }, [value]);

    // Debounce: a cada mudança no draft, agenda um onChange 500ms depois.
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        // Se o draft for igual ao value canônico, não disparamos (evita
        // PUT redundante na primeira renderização).
        if ((draft || '') === (value || '')) return;
        debounceRef.current = setTimeout(() => {
            const trimmed = draft.trim();
            onChange(trimmed.length > 0 ? draft : null);
        }, DEBOUNCE_MS);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
        // `onChange` propositalmente fora — só dispara em mudança real do draft.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [draft]);

    const showCounter = draft.length > maxLength * 0.5;
    const nearLimit = draft.length > maxLength * 0.9;

    return (
        <View style={styles.card}>
            <View style={styles.headerRow}>
                <View style={styles.iconBubble}>
                    <Ionicons name="reader-outline" size={16} color={theme.colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.title}>Minhas anotações</Text>
                    <Text style={styles.subtitle}>
                        Visíveis só para você. Salva automaticamente.
                    </Text>
                </View>
            </View>

            <TextInput
                style={styles.input}
                value={draft}
                onChangeText={(text) => {
                    // Cap o input no limite máximo (sem warnings de TextInput).
                    if (text.length > maxLength) {
                        setDraft(text.slice(0, maxLength));
                    } else {
                        setDraft(text);
                    }
                }}
                onFocus={() => { focusedRef.current = true; }}
                onBlur={() => {
                    focusedRef.current = false;
                    // No blur, garante flush imediato (sem esperar debounce).
                    if (debounceRef.current) clearTimeout(debounceRef.current);
                    if ((draft || '') !== (value || '')) {
                        const trimmed = draft.trim();
                        onChange(trimmed.length > 0 ? draft : null);
                    }
                }}
                placeholder="Escreva lembretes, dicas pessoais, links..."
                placeholderTextColor={theme.colors.text.tertiary}
                multiline
                editable={!readOnly}
                maxLength={maxLength}
                textAlignVertical="top"
            />

            {showCounter ? (
                <Text style={[styles.counter, nearLimit && styles.counterWarn]}>
                    {draft.length}/{maxLength}
                </Text>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 14,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    headerRow: {
        flexDirection: 'row',
        gap: 10,
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    iconBubble: {
        width: 30,
        height: 30,
        borderRadius: 10,
        backgroundColor: theme.colors.primary + '18',
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 14,
        fontWeight: '800',
        color: theme.colors.text.primary,
    },
    subtitle: {
        fontSize: 11.5,
        color: theme.colors.text.tertiary,
        marginTop: 2,
    },
    input: {
        minHeight: 110,
        backgroundColor: theme.colors.surfaceLight,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: theme.colors.text.primary,
        lineHeight: 20,
        ...Platform.select({
            web: { outlineStyle: 'none' as any },
            default: {},
        }),
    },
    counter: {
        alignSelf: 'flex-end',
        marginTop: 6,
        fontSize: 11,
        color: theme.colors.text.tertiary,
        fontWeight: '600',
    },
    counterWarn: {
        color: theme.colors.warning,
    },
});

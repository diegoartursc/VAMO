/**
 * VAMO — Roteiro Editável Pós-Compra (PDF export sheet).
 *
 * Bottom sheet com 2 opções: "Exportar versão original" e "Exportar
 * minha versão". O componente é apresentacional — não decide o que
 * exportar: o caller passa `onSelect(variant)` e fica responsável por
 * juntar snapshot + customization e chamar `exportRoutePdf`.
 *
 * Por que separar do caller? O sheet vive perto da tela e precisa do
 * snapshot/customização carregados; deixar a lógica de export no caller
 * permite reaproveitar este componente em outros pontos (admin do
 * criador, e-mail, etc.) sem acoplar a state.
 *
 * Acessibilidade: cada opção tem accessibilityRole="button" e
 * accessibilityLabel descritivo.
 */

import React from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Pressable,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../../theme/theme';
import { haptics } from '../../services/haptics';
import type { PdfVariant } from './pdfTemplate';

export interface PdfExportSheetProps {
    visible: boolean;
    onClose: () => void;
    /** Disparado quando o usuário escolhe uma variante. O caller é
     * responsável por buscar snapshot/customization e chamar exportRoutePdf. */
    onSelect: (variant: PdfVariant) => void;
    /** Quando true, desabilita o botão "minha versão" (ex: sem customização salva). */
    personalizedDisabled?: boolean;
}

/**
 * Linha de opção dentro do sheet. Extraída para manter o JSX legível e
 * permitir tweak de hover/pressed state no futuro.
 */
function OptionRow({
    icon,
    title,
    subtitle,
    iconColor,
    onPress,
    disabled,
}: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle: string;
    iconColor: string;
    onPress: () => void;
    disabled?: boolean;
}) {
    return (
        <Pressable
            onPress={() => {
                if (disabled) return;
                haptics.selection();
                onPress();
            }}
            accessibilityRole="button"
            accessibilityLabel={title}
            accessibilityHint={subtitle}
            accessibilityState={{ disabled: !!disabled }}
            style={({ pressed }) => [
                styles.option,
                pressed && !disabled && styles.optionPressed,
                disabled && styles.optionDisabled,
            ]}
        >
            <View style={[styles.optionIcon, { backgroundColor: iconColor + '1A' }]}>
                <Ionicons name={icon} size={22} color={iconColor} />
            </View>
            <View style={styles.optionTextWrap}>
                <Text style={styles.optionTitle}>{title}</Text>
                <Text style={styles.optionSubtitle}>{subtitle}</Text>
            </View>
            <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.colors.text.tertiary}
            />
        </Pressable>
    );
}

export default function PdfExportSheet({
    visible,
    onClose,
    onSelect,
    personalizedDisabled,
}: PdfExportSheetProps) {
    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <Pressable style={styles.backdrop} onPress={onClose}>
                {/* Pressable interno consome o toque para não fechar quando
                    o usuário interage com o conteúdo do sheet. */}
                <Pressable style={styles.sheet} onPress={() => { /* eat touch */ }}>
                    <View style={styles.grabber} />

                    <View style={styles.header}>
                        <Text style={styles.title}>Exportar PDF</Text>
                        <TouchableOpacity
                            onPress={onClose}
                            accessibilityRole="button"
                            accessibilityLabel="Fechar"
                            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                        >
                            <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.description}>
                        Escolha qual versão do seu roteiro deseja salvar como PDF.
                    </Text>

                    <View style={styles.options}>
                        <OptionRow
                            icon="document-text-outline"
                            title="Exportar versão original"
                            subtitle="Roteiro completo do criador, como veio na compra."
                            iconColor={theme.colors.secondary}
                            onPress={() => {
                                onSelect('original');
                                onClose();
                            }}
                        />
                        <OptionRow
                            icon="sparkles-outline"
                            title="Exportar minha versão"
                            subtitle={personalizedDisabled
                                ? 'Sem personalizações ainda — edite seu roteiro primeiro.'
                                : 'Roteiro com suas notas, edições e adições.'}
                            iconColor={theme.colors.primary}
                            onPress={() => {
                                onSelect('personalized');
                                onClose();
                            }}
                            disabled={personalizedDisabled}
                        />
                    </View>

                    <Text style={styles.footnote}>
                        Seus arquivos aparecem como lista de referência na sua versão. Os anexos (fotos e documentos) não são incorporados ao PDF.
                    </Text>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: theme.colors.background,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 10,
        paddingHorizontal: 20,
        paddingBottom: Platform.OS === 'ios' ? 36 : 24,
        // Sombra suave acima do sheet.
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 12,
    },
    grabber: {
        alignSelf: 'center',
        width: 44,
        height: 5,
        borderRadius: 999,
        backgroundColor: theme.colors.border,
        marginBottom: 12,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.colors.text.primary,
    },
    description: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        marginBottom: 16,
        lineHeight: 20,
    },
    options: {
        gap: 10,
        marginBottom: 16,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 14,
        borderRadius: 14,
        backgroundColor: theme.colors.surfaceLight,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        gap: 12,
    },
    optionPressed: {
        backgroundColor: theme.colors.surfaceHighlight,
    },
    optionDisabled: {
        opacity: 0.5,
    },
    optionIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    optionTextWrap: {
        flex: 1,
    },
    optionTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.text.primary,
        marginBottom: 2,
    },
    optionSubtitle: {
        fontSize: 12.5,
        color: theme.colors.text.secondary,
        lineHeight: 17,
    },
    footnote: {
        fontSize: 11.5,
        color: theme.colors.text.tertiary,
        textAlign: 'center',
        marginTop: 4,
    },
});

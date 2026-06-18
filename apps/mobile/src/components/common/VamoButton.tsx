/**
 * VamoButton — botão reutilizável do app.
 *
 * Por que isso existe:
 *  - Texto SEMPRE centralizado horizontal e verticalmente, INCLUSIVE quando
 *    quebra em duas linhas (`textAlign: 'center'` + `justifyContent`).
 *  - Altura mínima confortável para mobile (44pt+).
 *  - Padding horizontal generoso pra texto não colar nas bordas.
 *  - Suporta ícone + texto sem desalinhar o centro.
 *  - Loading inline (spinner ocupando o lugar do texto, mesma altura).
 *  - 4 variantes (primary, secondary, danger, ghost) e 3 tamanhos (sm/md/lg)
 *    cobrindo modais, bottom sheets, formulários e CTAs.
 *
 * O padrão antigo (`<TouchableOpacity>` + `<Text>` solto com style ad-hoc)
 * deixou os botões inconsistentes — "Adicionar ao meu roteiro" do modal
 * AddItem ficava com texto alinhado à esquerda em duas linhas. Usar este
 * componente elimina esse tipo de bug.
 */

import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    type StyleProp,
    type TextStyle,
    type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../../theme/theme';

export type VamoButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type VamoButtonSize = 'sm' | 'md' | 'lg';

export interface VamoButtonProps {
    /** Texto principal. Multiline funciona — fica sempre centralizado. */
    label: string;
    onPress: () => void;
    variant?: VamoButtonVariant;
    size?: VamoButtonSize;
    /** Spinner inline; texto fica oculto e o botão fica disabled. */
    loading?: boolean;
    /** Visualmente apagado e ignorando toques. */
    disabled?: boolean;
    /** Faz o botão ocupar 100% da largura disponível. */
    fullWidth?: boolean;
    /** Limita quantas linhas o label pode ocupar. Default: 2 (multiline OK). */
    numberOfLines?: number;
    /** Ícone Ionicons opcional no lado esquerdo do texto. */
    iconStart?: React.ComponentProps<typeof Ionicons>['name'];
    /** Override pontual de estilos — use com moderação; o componente padroniza tudo. */
    style?: StyleProp<ViewStyle>;
    labelStyle?: StyleProp<TextStyle>;
    accessibilityLabel?: string;
    testID?: string;
}

export default function VamoButton({
    label,
    onPress,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    fullWidth = false,
    numberOfLines = 2,
    iconStart,
    style,
    labelStyle,
    accessibilityLabel,
    testID,
}: VamoButtonProps) {
    const palette = VARIANTS[variant];
    const sz = SIZES[size];
    const blocked = loading || disabled;

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={blocked}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel || label}
            accessibilityState={{ disabled: blocked, busy: loading }}
            testID={testID}
            style={[
                styles.base,
                {
                    minHeight: sz.minHeight,
                    paddingVertical: sz.padV,
                    paddingHorizontal: sz.padH,
                    borderRadius: sz.radius,
                    backgroundColor: palette.bg,
                    borderColor: palette.border,
                    borderWidth: palette.border ? 1 : 0,
                },
                fullWidth && styles.fullWidth,
                blocked && styles.blocked,
                style,
            ]}
        >
            {loading ? (
                <ActivityIndicator size="small" color={palette.fg} />
            ) : (
                <View style={styles.content}>
                    {iconStart ? (
                        <Ionicons name={iconStart} size={sz.icon} color={palette.fg} />
                    ) : null}
                    <Text
                        style={[
                            styles.label,
                            { color: palette.fg, fontSize: sz.font, lineHeight: sz.font + 4 },
                            labelStyle,
                        ]}
                        numberOfLines={numberOfLines}
                        // ellipsizeMode 'tail' só seria invocado se numberOfLines limitasse —
                        // como default é 2 e botão tem padding generoso, raramente acontece.
                        ellipsizeMode="tail"
                    >
                        {label}
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );
}

// ─── Tokens ────────────────────────────────────────────────────────

const VARIANTS: Record<VamoButtonVariant, { bg: string; fg: string; border: string | null }> = {
    primary:   { bg: theme.colors.primary,        fg: '#FFFFFF',                       border: null },
    secondary: { bg: theme.colors.borderLight,    fg: theme.colors.text.primary,       border: null },
    danger:    { bg: theme.colors.error,          fg: '#FFFFFF',                       border: null },
    ghost:     { bg: 'transparent',               fg: theme.colors.primary,            border: theme.colors.primary },
};

const SIZES: Record<VamoButtonSize, {
    minHeight: number;
    padV: number;
    padH: number;
    radius: number;
    font: number;
    icon: number;
}> = {
    // sm: ações leves em headers/chips. md: default modais/forms. lg: CTAs grandes.
    sm: { minHeight: 36, padV: 8,  padH: 14, radius: 10, font: 13, icon: 14 },
    md: { minHeight: 48, padV: 12, padH: 18, radius: 12, font: 15, icon: 16 },
    lg: { minHeight: 54, padV: 14, padH: 22, radius: 14, font: 16, icon: 18 },
};

const styles = StyleSheet.create({
    base: {
        alignItems: 'center',
        // justifyContent center + content flex-row central → mesmo com ícone, o
        // grupo (ícone+texto) fica centralizado. Sem isso, ícone empurra o texto.
        justifyContent: 'center',
        flexDirection: 'row',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        // O conteúdo nunca passa da área útil do botão; o texto pode quebrar em
        // 2 linhas porque o numberOfniciusLines do <Text> permite.
        flexShrink: 1,
    },
    label: {
        fontWeight: '700',
        // CHAVE do bug do print: sem textAlign center, label multiline ficava
        // alinhado à esquerda dentro do <Text>. Agora as duas linhas centram.
        textAlign: 'center',
        // flexShrink permite que o texto quebre em vez de empurrar pro overflow.
        flexShrink: 1,
        letterSpacing: 0.1,
    },
    fullWidth: {
        alignSelf: 'stretch',
    },
    blocked: {
        opacity: 0.55,
    },
});

/**
 * ItinerarySummaryPanel — resumo compacto do roteiro dentro do card.
 *
 * Substitui as duas linhas soltas de chips (que usavam flexWrap e faziam a
 * altura do card variar com a quantidade de categorias/módulos) por um painel
 * de DUAS LINHAS FIXAS:
 *
 *   Estilo   [Cultura] [Gastronomia] [+1]
 *   ─────────────────────────────────────
 *   Inclui   [Itinerário] [Passeios] [+3]
 *
 * Cada linha ocupa exatamente uma linha visual: a quantidade exibida é
 * calculada pela largura REAL medida (onLayout), não por Dimensions da janela
 * — o mesmo card aparece em lista full-width e em carrossel de 320px.
 *
 * "Estilo" e "Inclui" nunca se misturam: rótulo textual + tom de cor
 * diferentes (navy para tema, teal para conteúdo entregue). A diferenciação
 * não depende só da cor.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme/theme';
import { Icon, IconName } from '../common/Icons';
import { fitSummaryItems, buildSummaryAccessibilityLabel } from '../../utils/itineraryCardSummary';

export interface SummaryItem {
    key: string;
    label: string;
    icon: IconName;
}

export interface ItinerarySummaryPanelProps {
    /** Categorias temáticas (getCategoryChips). */
    categories: SummaryItem[];
    /** Módulos realmente entregues (getModuleBadges). */
    modules: SummaryItem[];
    /**
     * Largura interna disponível ao painel (o card já descontou o próprio
     * padding). O painel desconta o padding dele e a coluna do rótulo.
     */
    availableWidth: number;
    /** Máximo de estilos exibidos quando a largura permite. */
    maxCategories?: number;
    /** Máximo de inclusos exibidos quando a largura permite. */
    maxModules?: number;
}

const DEFAULT_MAX_CATEGORIES = 2;
const DEFAULT_MAX_MODULES = 3;

/** Padding horizontal do painel — precisa bater com `styles.panel`. */
export const PANEL_PADDING_HORIZONTAL = 10;
/** Coluna fixa do rótulo — mantém "Estilo" e "Inclui" alinhados verticalmente. */
const LABEL_COLUMN_WIDTH = 44;
const LABEL_GAP = 8;

export function ItinerarySummaryPanel({
    categories,
    modules,
    availableWidth,
    maxCategories = DEFAULT_MAX_CATEGORIES,
    maxModules = DEFAULT_MAX_MODULES,
}: ItinerarySummaryPanelProps) {
    const hasCategories = categories.length > 0;
    const hasModules = modules.length > 0;

    // Sem nenhum dos dois o painel inteiro não existe (nada de moldura vazia).
    if (!hasCategories && !hasModules) return null;

    // Largura que sobra para as cápsulas de cada linha.
    const itemsWidth = availableWidth - PANEL_PADDING_HORIZONTAL * 2 - LABEL_COLUMN_WIDTH - LABEL_GAP;

    return (
        <View
            style={styles.panel}
            accessible
            accessibilityLabel={buildSummaryAccessibilityLabel(categories, modules)}
        >
            {hasCategories && (
                <CompactInfoRow
                    label="Estilo"
                    items={categories}
                    itemsWidth={itemsWidth}
                    maxItems={maxCategories}
                    tone="category"
                />
            )}

            {hasCategories && hasModules && <View style={styles.divider} />}

            {hasModules && (
                <CompactInfoRow
                    label="Inclui"
                    items={modules}
                    itemsWidth={itemsWidth}
                    maxItems={maxModules}
                    tone="included"
                />
            )}
        </View>
    );
}

interface CompactInfoRowProps {
    label: string;
    items: SummaryItem[];
    itemsWidth: number;
    maxItems: number;
    tone: 'category' | 'included';
}

/**
 * Uma linha do painel: rótulo + pills que cabem + "+X".
 * Nunca quebra linha (sem flexWrap) e nunca rola horizontalmente.
 */
function CompactInfoRow({ label, items, itemsWidth, maxItems, tone }: CompactInfoRowProps) {
    const { visible, hidden } = fitSummaryItems(items, itemsWidth, maxItems);
    const isCategory = tone === 'category';

    return (
        // O painel já tem accessibilityLabel completo; as partes internas não
        // precisam ser anunciadas em separado (evita "mais 2" solto).
        <View style={styles.row} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <Text style={styles.rowLabel} numberOfLines={1}>{label}</Text>
            <View style={styles.rowItems}>
                {visible.map(item => (
                    <View
                        key={item.key}
                        style={[styles.pill, isCategory ? styles.pillCategory : styles.pillIncluded]}
                    >
                        <Icon
                            name={item.icon}
                            size={12}
                            color={isCategory ? theme.colors.secondary : theme.colors.primaryDark}
                        />
                        <Text
                            style={[styles.pillText, isCategory ? styles.pillTextCategory : styles.pillTextIncluded]}
                            numberOfLines={1}
                        >
                            {item.label}
                        </Text>
                    </View>
                ))}
                {hidden > 0 && (
                    <View style={[styles.pill, styles.pillOverflow, isCategory ? styles.pillCategory : styles.pillIncluded]}>
                        <Text
                            style={[styles.pillText, isCategory ? styles.pillTextCategory : styles.pillTextIncluded]}
                            numberOfLines={1}
                        >
                            +{hidden}
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    panel: {
        backgroundColor: theme.colors.surfaceLight,
        borderRadius: theme.borderRadius.md,
        paddingHorizontal: 10,
        paddingVertical: 8,
        gap: 7,
    },
    divider: {
        height: 1,
        backgroundColor: theme.colors.border,
        // Sangra até as bordas do painel para separar as duas linhas sem
        // parecer uma tabela.
        marginHorizontal: -10,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: LABEL_GAP,
    },
    rowLabel: {
        width: LABEL_COLUMN_WIDTH,
        flexShrink: 0,
        fontSize: 11,
        fontWeight: '700',
        // Title case (não caixa alta): "ESTILO" em maiúsculas não cabe na
        // coluna sem elipsar, e o rótulo precisa ser sempre legível.
        color: theme.colors.text.tertiary,
    },
    rowItems: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        // Sem flexWrap: a linha é sempre uma linha. O overflow hidden é a
        // rede de segurança caso a estimativa de largura erre por 1–2px.
        overflow: 'hidden',
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        height: 24,
        borderRadius: theme.borderRadius.sm,
        // flexShrink 1 é só rede de segurança: se a estimativa errar por
        // alguns px, o rótulo elipsa em vez de estourar a largura. Com a
        // medição correta da linha, não deve ser acionado.
        flexShrink: 1,
    },
    pillCategory: {
        backgroundColor: theme.colors.secondary + '12',
    },
    pillIncluded: {
        backgroundColor: theme.colors.primary + '18',
    },
    pillOverflow: {
        flexShrink: 0,
        paddingHorizontal: 7,
    },
    pillText: {
        fontSize: 11,
        fontWeight: '600',
        flexShrink: 1,
    },
    pillTextCategory: {
        color: theme.colors.secondary,
    },
    pillTextIncluded: {
        color: theme.colors.primaryDark,
    },
});

export default ItinerarySummaryPanel;

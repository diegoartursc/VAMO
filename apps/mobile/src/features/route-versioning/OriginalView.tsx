/**
 * OriginalView — versão "Original" (read-only) do roteiro comprado.
 *
 * Renderiza o snapshot congelado pela venda exatamente como o criador
 * o desenhou no momento da compra. Sem long-press, sem badges de origem
 * — é a referência imutável (a "verdade" para reembolso / DMCA).
 *
 * Estratégia:
 *  - Recebe `snapshot` (RouteSnapshot) já carregado pelo container.
 *  - Lê cada seção (accommodations, attractions, etc.) e renderiza via
 *    ItemCard com source forçada a 'original'.
 *  - Seções vazias somem (não exibimos card vazio).
 *  - Para os dias, mantemos o look "timeline" do `purchased-itinerary/[id].tsx`:
 *    cada dia tem cabeçalho colapsável + lista de atividades.
 */

import React, { useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { theme } from '../../theme/theme';
import { inferSectionKey } from '../../theme/sectionTheme';
import SectionHeader from '../../components/common/SectionHeader';
import { haptics } from '../../services/haptics';
import ItemCard from './ItemCard';
import type { MergedItem, ItemKind } from './mergeEngine';
import type { RouteSnapshot } from '../../services/routeCustomization';

export interface OriginalViewProps {
    snapshot: RouteSnapshot | null | undefined;
    itineraryId?: string;
    /**
     * Progresso pessoal do comprador sobre o checklist do criador
     * (`creatorChecklistProgress` do customization). Chave por item =
     * `id:<id>` ou `idx:<n>` (mesma convenção do ChecklistTab → o progresso
     * é UM só, compartilhado entre Original e Minha Versão após reload).
     */
    checklistProgress?: Record<string, boolean>;
    /** Habilita marcar/desmarcar (só comprador autenticado). Estrutura do
     * checklist continua imutável — só o progresso é interativo. */
    canToggleChecklist?: boolean;
    /** Bloqueia toques concorrentes enquanto o progresso está sendo salvo. */
    checklistPending?: boolean;
    /** Persiste o toggle de um item (recebe a key do item). */
    onToggleChecklist?: (key: string) => void;
}

/** Key estável de um item do checklist do criador (espelha ChecklistTab). */
function checklistKey(item: any, idx: number): string {
    return item && typeof item === 'object' && item.id ? `id:${item.id}` : `idx:${idx}`;
}

/**
 * Mesma convenção de chave usada por `ChecklistTab` para itens do criador:
 *  - se o item tem `id`, key = `id:<id>`
 *  - senão, key = `idx:<idx>`
 * Garante que o progresso marcado aqui sincroniza com a Central.
 */
// ─── Helpers de extração ─────────────────────────────────────

function isPlainObject(v: unknown): v is Record<string, any> {
    return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function safeArray<T>(v: unknown): T[] {
    return Array.isArray(v) ? (v as T[]) : [];
}

/**
 * Converte um item bruto do snapshot em `MergedItem` com source `'original'`.
 * Sem patch, sem `addedId` — só wrapper visual para o `ItemCard` (que
 * sabe renderizar a partir do shape "Merged").
 */
function asOriginal(kind: ItemKind, data: any, originalId?: string): MergedItem {
    return { kind, source: 'original', originalId, data };
}

// ─── Section header ───────────────────────────────────────────

function SectionTitle({ icon, label, subtitle }: { icon: string; label: string; subtitle?: string }) {
    // Identidade visual por seção: a chave é inferida pela própria label,
    // então todos os call sites existentes ganham acento/ícone sem mudança.
    return (
        <SectionHeader
            sectionKey={inferSectionKey(label)}
            icon={icon}
            label={label}
            subtitle={subtitle}
        />
    );
}

// ─── Componente principal ────────────────────────────────────

export default function OriginalView({
    snapshot,
    checklistProgress = {},
    canToggleChecklist = false,
    checklistPending = false,
    onToggleChecklist,
}: OriginalViewProps) {
    const [expandedDays, setExpandedDays] = useState<Set<number>>(() => new Set([1]));

    const sections = useMemo(() => {
        if (!isPlainObject(snapshot)) {
            return null;
        }
        return {
            accommodations: safeArray<any>(snapshot.accommodations),
            transports: safeArray<any>(snapshot.transports),
            attractions: safeArray<any>(snapshot.attractions),
            restaurants: safeArray<any>(snapshot.restaurants),
            generalTips: safeArray<any>(snapshot.generalTips),
            checklistItems: safeArray<any>(snapshot.checklists ?? snapshot.checklist),
            extraSpendingItems: safeArray<any>(snapshot.extraSpendingItems),
            flightOutbound: snapshot.flightInfo?.outbound ?? null,
            flightReturn: snapshot.flightInfo?.return ?? null,
            flightTotalPrice: snapshot.flightInfo?.totalPrice ?? null,
            flightCurrency: snapshot.flightInfo?.priceCurrency ?? null,
            flightTips: safeArray<string>(snapshot.flightInfo?.tips),
            days: safeArray<any>(snapshot.days),
            creatorName: snapshot?.creator?.name ?? null,
        };
    }, [snapshot]);

    if (!sections) {
        return (
            <View style={styles.emptyWrap}>
                <Ionicons name="documents-outline" size={28} color={theme.colors.text.tertiary} />
                <Text style={styles.emptyTitle}>Versão original indisponível</Text>
                <Text style={styles.emptyText}>
                    Não foi possível carregar o snapshot original deste roteiro. Tente novamente
                    em alguns segundos.
                </Text>
            </View>
        );
    }

    const toggleDay = (n: number) => {
        setExpandedDays((prev) => {
            const next = new Set(prev);
            if (next.has(n)) next.delete(n); else next.add(n);
            return next;
        });
    };

    return (
        <View>
            {/* ── Itinerário por Dia ── */}
            {sections.days.length > 0 ? (
                <View style={styles.block}>
                    <SectionTitle icon="map-outline" label="Itinerário por Dia" />
                    {sections.days.map((day: any) => {
                        const dayNumber = typeof day?.dayNumber === 'number' ? day.dayNumber : 0;
                        const expanded = expandedDays.has(dayNumber);
                        const activities = safeArray<any>(day?.activities);
                        return (
                            <View key={dayNumber} style={styles.dayCard}>
                                <TouchableOpacity
                                    style={styles.dayHeader}
                                    onPress={() => toggleDay(dayNumber)}
                                    activeOpacity={0.75}
                                >
                                    <LinearGradient
                                        colors={theme.colors.gradients.action as unknown as [string, string]}
                                        style={styles.dayBadge}
                                    >
                                        <Text style={styles.dayBadgeNum}>{dayNumber}</Text>
                                        <Text style={styles.dayBadgeLabel}>DIA</Text>
                                    </LinearGradient>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.dayTitle} numberOfLines={1}>
                                            {day?.title || `Dia ${dayNumber}`}
                                        </Text>
                                        {day?.summary ? (
                                            <Text style={styles.daySummary} numberOfLines={1}>
                                                {String(day.summary)}
                                            </Text>
                                        ) : null}
                                    </View>
                                    <View style={[styles.chevron, expanded && styles.chevronActive]}>
                                        <Ionicons
                                            name={expanded ? 'chevron-up' : 'chevron-down'}
                                            size={16}
                                            color={expanded ? '#fff' : theme.colors.text.tertiary}
                                        />
                                    </View>
                                </TouchableOpacity>

                                {expanded ? (
                                    <View style={styles.dayContent}>
                                        {activities.length === 0 ? (
                                            <Text style={styles.emptyDayText}>
                                                Nenhuma atividade para este dia.
                                            </Text>
                                        ) : (
                                            activities.map((act: any, idx: number) => (
                                                <ItemCard
                                                    key={act?.id ?? `${dayNumber}:${idx}`}
                                                    merged={asOriginal(
                                                        'dayActivity',
                                                        act,
                                                        `${dayNumber}:${idx}`,
                                                    )}
                                                    showBadge={false}
                                                />
                                            ))
                                        )}
                                    </View>
                                ) : null}
                            </View>
                        );
                    })}
                </View>
            ) : null}

            {/* ── Hospedagens ── */}
            {sections.accommodations.length > 0 ? (
                <View style={styles.block}>
                    <SectionTitle icon="home-outline" label="Onde Fiquei" />
                    {sections.accommodations.map((acc: any, i: number) => (
                        <ItemCard
                            key={acc?.id ?? `acc-${i}`}
                            merged={asOriginal('accommodations', acc)}
                            showBadge={false}
                        />
                    ))}
                </View>
            ) : null}

            {/* ── Voos ── */}
            {(sections.flightOutbound || sections.flightReturn) ? (
                <View style={styles.block}>
                    <SectionTitle icon="airplane-outline" label="Meu Voo" />
                    {sections.flightTotalPrice ? (
                        <View style={styles.flightTotalPill}>
                            <Ionicons name="cash-outline" size={14} color={theme.colors.success} />
                            <Text style={styles.flightTotalText}>
                                Ida + volta: {String(sections.flightTotalPrice)}
                                {sections.flightCurrency ? ` ${sections.flightCurrency}` : ''}
                            </Text>
                        </View>
                    ) : null}
                    {sections.flightOutbound ? (
                        <ItemCard
                            merged={asOriginal('flightOutbound', sections.flightOutbound)}
                            showBadge={false}
                        />
                    ) : null}
                    {sections.flightReturn ? (
                        <ItemCard
                            merged={asOriginal('flightReturn', sections.flightReturn)}
                            showBadge={false}
                        />
                    ) : null}
                    {sections.flightTips.length > 0 ? (
                        <View style={styles.tipsBox}>
                            <Text style={styles.tipsTitle}>💡 Dicas do viajante</Text>
                            {sections.flightTips.map((tip: string, i: number) => (
                                <View key={i} style={styles.tipRow}>
                                    <View style={styles.tipDot} />
                                    <Text style={styles.tipText}>{String(tip)}</Text>
                                </View>
                            ))}
                        </View>
                    ) : null}
                </View>
            ) : null}

            {/* ── Passeios ── */}
            {sections.attractions.length > 0 ? (
                <View style={styles.block}>
                    <SectionTitle
                        icon="camera-outline"
                        label="Passeios & Atrações"
                        subtitle={`${sections.attractions.length} atrações selecionadas pelo criador`}
                    />
                    {sections.attractions.map((att: any, i: number) => (
                        <ItemCard
                            key={att?.id ?? `att-${i}`}
                            merged={asOriginal('attractions', att)}
                            showBadge={false}
                        />
                    ))}
                </View>
            ) : null}

            {/* ── Transporte ── */}
            {sections.transports.length > 0 ? (
                <View style={styles.block}>
                    <SectionTitle icon="navigate-outline" label="Transporte" />
                    {sections.transports.map((t: any, i: number) => (
                        <ItemCard
                            key={t?.id ?? `tr-${i}`}
                            merged={asOriginal('transports', t)}
                            showBadge={false}
                        />
                    ))}
                </View>
            ) : null}

            {/* ── Restaurantes ── */}
            {sections.restaurants.length > 0 ? (
                <View style={styles.block}>
                    <SectionTitle icon="restaurant-outline" label="Restaurantes & Gastronomia" />
                    {sections.restaurants.map((r: any, i: number) => (
                        <ItemCard
                            key={r?.id ?? `rest-${i}`}
                            merged={asOriginal('restaurants', r)}
                            showBadge={false}
                        />
                    ))}
                </View>
            ) : null}

            {/* ── Dicas Gerais ── */}
            {sections.generalTips.length > 0 ? (
                <View style={styles.block}>
                    <SectionTitle
                        icon="bulb-outline"
                        label="Dicas do Viajante"
                        subtitle={sections.creatorName
                            ? `Recomendações de ${sections.creatorName}`
                            : undefined}
                    />
                    <View style={styles.tipsListCard}>
                        {sections.generalTips.map((tip: any, i: number) => (
                            <ItemCard
                                key={`tip-${i}`}
                                merged={asOriginal('generalTips', tip)}
                                showBadge={false}
                            />
                        ))}
                    </View>
                </View>
            ) : null}

            {/* ── Gastos Extras ── */}
            {sections.extraSpendingItems.length > 0 ? (
                <View style={styles.block}>
                    <SectionTitle
                        icon="wallet-outline"
                        label="Gastos Extras"
                        subtitle={`${sections.extraSpendingItems.length} ${sections.extraSpendingItems.length === 1 ? 'item' : 'itens'}`}
                    />
                    {sections.extraSpendingItems.map((e: any, i: number) => (
                        <ItemCard
                            key={e?.id ?? `extra-${i}`}
                            merged={asOriginal('extraSpendingItems', e)}
                            showBadge={false}
                        />
                    ))}
                </View>
            ) : null}

            {/* ── Checklist do roteiro ──
                Read-only ESTRUTURAL: o viajante NÃO pode editar texto,
                adicionar nem remover itens — esse é o checklist do
                criador, congelado pelo snapshot. Só o progresso pessoal
                (check/uncheck) é interativo, e fica sincronizado com a
                O progresso pessoal é controlado na Central da Viagem. */}
            {sections.checklistItems.length > 0 ? (
                <View style={styles.block}>
                    <SectionTitle
                        icon="checkmark-circle-outline"
                        label="Checklist do roteiro"
                        subtitle={canToggleChecklist
                            ? 'Marque o que já resolveu. Seu progresso é privado e não altera o roteiro do criador.'
                            : 'Versão comprada do checklist, preservada em modo somente leitura.'}
                    />
                    <View style={styles.checklistCard}>
                        {sections.checklistItems.map((c: any, i: number) => {
                            const text =
                                (typeof c === 'string' ? c : (c?.item || c?.text || c?.label || '')).toString();
                            const category = (typeof c === 'object' && c?.category) ? String(c.category) : '';
                            const key = checklistKey(c, i);
                            const done = !!checklistProgress[key];
                            // Estrutura imutável: o viajante NÃO edita/adiciona/remove
                            // itens aqui — só marca/desmarca (progresso pessoal).
                            const handlePress = () => {
                                if (!canToggleChecklist || checklistPending || !onToggleChecklist) return;
                                haptics.light();
                                onToggleChecklist(key);
                            };
                            return (
                                <TouchableOpacity
                                    key={c?.id ?? `chk-${i}`}
                                    style={[
                                        styles.checkRow,
                                        i < sections.checklistItems.length - 1 && styles.checkRowBorder,
                                    ]}
                                    onPress={handlePress}
                                    disabled={!canToggleChecklist || checklistPending}
                                    activeOpacity={0.7}
                                    accessibilityRole="checkbox"
                                    accessibilityState={{
                                        checked: done,
                                        disabled: !canToggleChecklist || checklistPending,
                                    }}
                                    accessibilityLabel={`${done ? 'Desmarcar' : 'Marcar'}: ${text}`}
                                >
                                    <View style={[styles.checkBox, done && styles.checkBoxActive]}>
                                        {done && <Ionicons name="checkmark" size={14} color="#fff" />}
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text
                                            style={[styles.checkText, done && styles.checkTextDone]}
                                            numberOfLines={3}
                                        >
                                            {text}
                                        </Text>
                                        {category ? (
                                            <Text style={styles.checkCategoryHint}>{category}</Text>
                                        ) : null}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            ) : null}
        </View>
    );
}

// ─── Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
    block: { marginBottom: 28 },

    sectionHeader: { marginBottom: 14 },
    sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    sectionIcon: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: theme.colors.primary + '18',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: theme.colors.text.primary,
        letterSpacing: -0.2,
    },
    sectionSubtitle: {
        fontSize: 12.5,
        color: theme.colors.text.tertiary,
        marginTop: 4,
        marginLeft: 42,
    },

    emptyWrap: {
        alignItems: 'center',
        paddingVertical: 36,
        paddingHorizontal: 24,
        gap: 8,
    },
    emptyTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.text.primary,
    },
    emptyText: {
        fontSize: 12.5,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        lineHeight: 18,
    },
    emptyDayText: {
        fontSize: 13,
        color: theme.colors.text.tertiary,
        fontStyle: 'italic',
    },

    // Day accordion
    dayCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        marginBottom: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    dayHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        gap: 12,
    },
    dayBadge: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dayBadgeNum: { fontSize: 18, fontWeight: '900', color: '#fff', lineHeight: 20 },
    dayBadgeLabel: { fontSize: 8, fontWeight: '700', color: 'rgba(255,255,255,0.75)', letterSpacing: 0.8 },
    dayTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.text.primary },
    daySummary: { fontSize: 12, color: theme.colors.text.secondary, marginTop: 2 },
    chevron: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surfaceLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    chevronActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    dayContent: {
        paddingHorizontal: 12,
        paddingBottom: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: theme.colors.borderLight,
    },

    // Flight totals
    flightTotalPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        alignSelf: 'flex-start',
        backgroundColor: theme.colors.success + '18',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        marginBottom: 12,
    },
    flightTotalText: { fontSize: 13, fontWeight: '700', color: theme.colors.success },

    tipsBox: {
        backgroundColor: '#CA8A04' + '0D',
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: '#CA8A04' + '22',
        borderLeftWidth: 3,
        borderLeftColor: '#CA8A04',
        gap: 8,
        marginTop: 4,
    },
    tipsTitle: { fontSize: 13, fontWeight: '700', color: theme.colors.text.primary, marginBottom: 4 },
    tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    tipDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: theme.colors.primary,
        marginTop: 7,
    },
    tipText: { fontSize: 13, color: theme.colors.text.secondary, lineHeight: 20, flex: 1 },

    tipsListCard: {
        backgroundColor: '#CA8A04' + '0D',
        borderRadius: 14,
        padding: 12,
        borderWidth: 1,
        borderColor: '#CA8A04' + '22',
        borderLeftWidth: 3,
        borderLeftColor: '#CA8A04',
    },

    checklistCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        padding: 6,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    checkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
        paddingHorizontal: 10,
    },
    checkRowBorder: {
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    checkBox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 1.5,
        borderColor: theme.colors.border,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkBoxActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    checkText: {
        fontSize: 14,
        color: theme.colors.text.primary,
        lineHeight: 19,
    },
    checkTextDone: {
        textDecorationLine: 'line-through',
        color: theme.colors.text.tertiary,
    },
    checkCategoryHint: {
        fontSize: 10.5,
        fontWeight: '700',
        color: theme.colors.primaryDark,
        textTransform: 'uppercase',
        letterSpacing: 0.4,
        marginTop: 4,
    },
});

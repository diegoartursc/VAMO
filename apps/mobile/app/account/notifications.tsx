/**
 * VAMO Mobile — Preferências de notificação.
 *
 * NOTA: ainda NÃO existe backend de preferências de notificação. Por isso
 * persistimos localmente no AsyncStorage, namespeado por travelerId (mesmo
 * padrão do carrinho/favoritos pra não vazar entre contas no mesmo device).
 *
 * TODO(backend): quando existir PATCH /api/.../notification-preferences,
 * trocar a persistência local por chamada autenticada e hidratar daqui.
 */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../../src/theme/theme';
import { haptics } from '../../src/services/haptics';
import { ScreenHeader } from '../../src/components/common/ScreenHeader';
import { useAuth } from '../../src/contexts/AuthContext';

const PREFS_KEY_PREFIX = '@vamo_notification_prefs';
const keyFor = (travelerId?: string | null) => travelerId ? `${PREFS_KEY_PREFIX}:${travelerId}` : null;

interface PrefItem {
    key: string;
    title: string;
    description: string;
    /** Só aparece para roteiristas. */
    creatorOnly?: boolean;
    default: boolean;
}

const PREF_ITEMS: PrefItem[] = [
    { key: 'purchases', title: 'Compras e pedidos', description: 'Avisos sobre compras, status e confirmações.', default: true },
    { key: 'purchasedUpdates', title: 'Atualizações de roteiros comprados', description: 'Quando um roteiro que você comprou for atualizado pelo criador.', default: true },
    { key: 'questionAnswers', title: 'Respostas às suas perguntas', description: 'Quando um roteirista responder uma dúvida sua.', default: true },
    { key: 'promotions', title: 'Promoções e novidades', description: 'Ofertas, lançamentos e novidades da VAMO.', default: false },
    { key: 'creatorSales', title: 'Vendas dos seus roteiros', description: 'Avisos quando você vender um roteiro publicado.', creatorOnly: true, default: true },
    { key: 'creatorReviews', title: 'Avaliações recebidas', description: 'Quando alguém avaliar um roteiro seu.', creatorOnly: true, default: true },
];

export default function NotificationsScreen() {
    const { user, isAuthenticated, isLoading } = useAuth();
    const isCreator = !!user?.creatorId;

    const visibleItems = PREF_ITEMS.filter((i) => !i.creatorOnly || isCreator);

    const [prefs, setPrefs] = useState<Record<string, boolean>>({});
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        const defaults: Record<string, boolean> = {};
        PREF_ITEMS.forEach((i) => { defaults[i.key] = i.default; });

        const key = keyFor(user?.travelerId);
        if (!key) { setPrefs(defaults); setHydrated(true); return; }
        let alive = true;
        AsyncStorage.getItem(key)
            .then((raw) => {
                if (!alive) return;
                if (raw) {
                    try {
                        const saved = JSON.parse(raw);
                        setPrefs({ ...defaults, ...saved });
                        return;
                    } catch { /* fallback abaixo */ }
                }
                setPrefs(defaults);
            })
            .catch(() => setPrefs(defaults))
            .finally(() => { if (alive) setHydrated(true); });
        return () => { alive = false; };
    }, [user?.travelerId]);

    const toggle = (itemKey: string) => {
        haptics.selection();
        setPrefs((prev) => {
            const next = { ...prev, [itemKey]: !prev[itemKey] };
            const storageKey = keyFor(user?.travelerId);
            if (storageKey) AsyncStorage.setItem(storageKey, JSON.stringify(next)).catch(() => {});
            return next;
        });
    };

    return (
        <View style={s.container}>
            <ScreenHeader title="Notificações" subtitle="Escolha o que você quer receber da VAMO." />
            <ScrollView contentContainerStyle={s.scroll}>
                {!hydrated ? (
                    <View style={s.center}><ActivityIndicator color={theme.colors.primary} /></View>
                ) : !isAuthenticated && !isLoading ? (
                    <Text style={s.notice}>Entre na sua conta para configurar as notificações.</Text>
                ) : (
                    <>
                        <View style={s.card}>
                            {visibleItems.map((item, idx) => (
                                <View
                                    key={item.key}
                                    style={[s.row, idx === visibleItems.length - 1 && s.rowLast]}
                                >
                                    <View style={s.rowText}>
                                        <Text style={s.rowTitle}>{item.title}</Text>
                                        <Text style={s.rowDesc}>{item.description}</Text>
                                    </View>
                                    <Switch
                                        value={!!prefs[item.key]}
                                        onValueChange={() => toggle(item.key)}
                                        trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                                        thumbColor="#fff"
                                    />
                                </View>
                            ))}
                        </View>
                        <Text style={s.footnote}>
                            Suas preferências ficam salvas neste dispositivo. Em breve elas serão
                            sincronizadas com a sua conta.
                        </Text>
                    </>
                )}
            </ScrollView>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.surfaceLight },
    scroll: { padding: 20, paddingBottom: 60 },
    center: { paddingVertical: 60, alignItems: 'center' },
    notice: { fontSize: 14, color: theme.colors.text.secondary, textAlign: 'center', paddingVertical: 40 },
    card: {
        backgroundColor: theme.colors.background,
        borderRadius: 16, overflow: 'hidden',
        borderWidth: 1, borderColor: theme.colors.borderLight,
    },
    row: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
        paddingHorizontal: 16, paddingVertical: 16,
        borderBottomWidth: 1, borderBottomColor: theme.colors.borderLight,
    },
    rowLast: { borderBottomWidth: 0 },
    rowText: { flex: 1 },
    rowTitle: { fontSize: 15, fontWeight: '600', color: theme.colors.text.primary },
    rowDesc: { fontSize: 12.5, color: theme.colors.text.secondary, marginTop: 3, lineHeight: 17 },
    footnote: { fontSize: 12, color: theme.colors.text.tertiary, marginTop: 16, lineHeight: 17, paddingHorizontal: 4 },
});

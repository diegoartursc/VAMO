/**
 * Seções do Portal do Roteirista (/created-itineraries) que vieram do antigo
 * CreatorDashboard do Perfil: hero azul institucional com saudação, card de
 * "Total recebido" e card "Dica Pro".
 *
 * Mantidos aqui (separados do CreatorPortalEntryCard, que é só o card de
 * ENTRADA no Perfil) para o Perfil não renderizar o dashboard completo.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../theme/theme';
import { formatMoney } from '@vamo/shared/itinerary';

/** Hero azul institucional do portal: saudação + CTAs. */
export function CreatorPortalHero({
    userName,
    isWide,
    onCreate,
    onSeeList,
}: {
    userName?: string;
    isWide: boolean;
    onCreate: () => void;
    onSeeList: () => void;
}) {
    return (
        <LinearGradient
            colors={['#1A3263', '#162A55']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.hero}
        >
            <Text style={s.heroEyebrow}>PORTAL DO ROTEIRISTA</Text>
            <Text style={s.heroTitle}>{userName ? `Olá, ${userName}` : 'Portal do Roteirista'}</Text>
            <Text style={s.heroSubtitle}>
                Gerencie seus roteiros, acompanhe vendas e veja o desempenho das suas experiências.
            </Text>
            <View style={[s.heroCtas, isWide ? s.heroCtasWide : s.heroCtasNarrow]}>
                <TouchableOpacity style={[s.heroBtn, s.heroPrimary]} onPress={onCreate} activeOpacity={0.85}>
                    <Ionicons name="add-circle-outline" size={16} color={theme.colors.secondary} />
                    <Text style={s.heroPrimaryText}>Novo roteiro</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.heroBtn, s.heroSecondary]} onPress={onSeeList} activeOpacity={0.85}>
                    <Ionicons name="albums-outline" size={16} color="#fff" />
                    <Text style={s.heroSecondaryText}>Meus roteiros</Text>
                </TouchableOpacity>
            </View>
        </LinearGradient>
    );
}

/** Card "Total recebido" — destaque de receita acumulada. Tappable → ganhos. */
export function CreatorRevenueCard({
    totalRevenue,
    totalSales,
    onPress,
}: {
    totalRevenue: number;
    totalSales: number;
    onPress?: () => void;
}) {
    const body = (
        <>
            <View style={{ flex: 1 }}>
                <Text style={s.revLabel}>Total recebido</Text>
                <Text style={s.revValue}>{formatMoney(Math.round(totalRevenue))}</Text>
                <Text style={s.revSub}>
                    {totalSales > 0
                        ? `${totalSales} venda${totalSales === 1 ? '' : 's'} concluída${totalSales === 1 ? '' : 's'}`
                        : 'Aguardando sua primeira venda'}
                </Text>
            </View>
            <View style={s.revIcon}>
                <Ionicons name="cash-outline" size={22} color={theme.colors.primary} />
            </View>
            {onPress && <Ionicons name="chevron-forward" size={18} color={theme.colors.text.tertiary} style={{ marginLeft: 4 }} />}
        </>
    );
    if (!onPress) return <View style={s.revCard}>{body}</View>;
    return <TouchableOpacity style={s.revCard} onPress={onPress} activeOpacity={0.85}>{body}</TouchableOpacity>;
}

/** Card "Dica Pro". */
export function CreatorProTipCard() {
    return (
        <View style={s.tipCard}>
            <View style={s.tipHeader}>
                <Ionicons name="flash" size={18} color={theme.colors.primary} />
                <Text style={s.tipTitle}>DICA PRO</Text>
            </View>
            <Text style={s.tipBody}>
                Roteiros com pontuação acima de <Text style={s.tipHighlight}>80%</Text> são aprovados mais
                facilmente pelos revisores e podem ganhar mais visibilidade no app.
            </Text>
        </View>
    );
}

const s = StyleSheet.create({
    hero: { borderRadius: 20, padding: 20, ...theme.shadows.large },
    heroEyebrow: { fontSize: 11, fontWeight: '700', color: '#28C9BF', letterSpacing: 1 },
    heroTitle: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5, marginTop: 2 },
    heroSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.78)', lineHeight: 19, marginTop: 6, maxWidth: 520 },
    heroCtas: { gap: 10, marginTop: 16 },
    heroCtasWide: { flexDirection: 'row', alignItems: 'center' },
    heroCtasNarrow: { flexDirection: 'column' },
    heroBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 18 },
    heroPrimary: { backgroundColor: '#FFFFFF' },
    heroPrimaryText: { fontSize: 14, fontWeight: '800', color: theme.colors.secondary },
    heroSecondary: { backgroundColor: 'rgba(255,255,255,0.16)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)' },
    heroSecondaryText: { fontSize: 14, fontWeight: '700', color: '#fff' },

    revCard: {
        flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12,
        backgroundColor: theme.colors.primary + '0D', borderWidth: 1, borderColor: theme.colors.primary + '26',
        borderRadius: 16, padding: 16,
    },
    revLabel: { fontSize: 12, fontWeight: '700', color: theme.colors.text.secondary, textTransform: 'uppercase', letterSpacing: 0.4 },
    revValue: { fontSize: 26, fontWeight: '800', color: theme.colors.text.primary, letterSpacing: -0.5, marginTop: 3 },
    revSub: { fontSize: 12.5, color: theme.colors.text.tertiary, marginTop: 2 },
    revIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.primary + '15', alignItems: 'center', justifyContent: 'center' },

    tipCard: {
        marginTop: 12, backgroundColor: theme.colors.secondary + '0A',
        borderWidth: 1, borderColor: theme.colors.secondary + '1A', borderRadius: 16, padding: 16,
    },
    tipHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 6 },
    tipTitle: { fontSize: 12, fontWeight: '800', color: theme.colors.primary, letterSpacing: 0.6 },
    tipBody: { fontSize: 13, color: theme.colors.text.secondary, lineHeight: 19 },
    tipHighlight: { fontWeight: '800', color: theme.colors.primary },
});

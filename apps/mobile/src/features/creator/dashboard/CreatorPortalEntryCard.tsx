/**
 * Card único "Central do Roteirista" exibido na aba Perfil.
 *
 * É o ÚNICO ponto de entrada para criação/administração de roteiros dentro do
 * Perfil — substitui o antigo seletor Viajante/Roteirista, o banner "Torne-se
 * roteirista" e a seção "Ferramentas do roteirista". O dashboard completo vive
 * em /created-itineraries (Portal do Roteirista), NÃO aqui.
 *
 * - Não-criador: incentiva criar o primeiro roteiro (onboarding).
 * - Criador: leva ao portal + micro-resumo opcional (sem dashboard completo).
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../theme/theme';
import { formatMoney } from '@vamo/shared/itinerary';

export interface CreatorEntryMicroStats {
    totalItineraries: number;
    totalSales: number;
    totalRevenue: number;
}

export function CreatorPortalEntryCard({
    isCreator,
    stats,
    onEnterPortal,
    onCreate,
}: {
    isCreator: boolean;
    stats?: CreatorEntryMicroStats | null;
    /** Abre o Portal do Roteirista (/created-itineraries). */
    onEnterPortal: () => void;
    /** Cria roteiro: onboarding (/become-creator) p/ novo, ou /new-itinerary p/ criador. */
    onCreate: () => void;
}) {
    const hasMicro = isCreator && !!stats && stats.totalItineraries > 0;

    return (
        <View style={s.wrap}>
            <LinearGradient
                colors={['#1A3263', '#28C9BF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.card}
            >
                <Text style={s.eyebrow}>CENTRAL DO ROTEIRISTA</Text>
                <Text style={s.title}>Central do Roteirista</Text>
                <Text style={s.subtitle}>
                    {isCreator
                        ? 'Gerencie seus roteiros, vendas, avaliações e desempenho em um só lugar.'
                        : 'Crie roteiros, compartilhe sua experiência e acompanhe seus resultados em um só lugar.'}
                </Text>

                {hasMicro && (
                    <View style={s.microRow}>
                        <View style={s.microItem}>
                            <Text style={s.microValue}>{stats!.totalItineraries}</Text>
                            <Text style={s.microLabel}>{stats!.totalItineraries === 1 ? 'roteiro' : 'roteiros'}</Text>
                        </View>
                        <View style={s.microDivider} />
                        <View style={s.microItem}>
                            <Text style={s.microValue}>{stats!.totalSales}</Text>
                            <Text style={s.microLabel}>{stats!.totalSales === 1 ? 'venda' : 'vendas'}</Text>
                        </View>
                        <View style={s.microDivider} />
                        <View style={s.microItem}>
                            <Text style={s.microValue}>{formatMoney(Math.round(stats!.totalRevenue))}</Text>
                            <Text style={s.microLabel}>recebido</Text>
                        </View>
                    </View>
                )}

                <View style={s.ctaRow}>
                    {isCreator ? (
                        <>
                            <TouchableOpacity style={[s.cta, s.ctaPrimary]} onPress={onEnterPortal} activeOpacity={0.85}>
                                <Ionicons name="grid-outline" size={16} color={theme.colors.secondary} />
                                <Text style={s.ctaPrimaryText}>Entrar no portal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[s.cta, s.ctaSecondary]} onPress={onCreate} activeOpacity={0.85}>
                                <Ionicons name="add" size={16} color="#fff" />
                                <Text style={s.ctaSecondaryText}>Novo roteiro</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <TouchableOpacity style={[s.cta, s.ctaPrimary]} onPress={onCreate} activeOpacity={0.85}>
                                <Ionicons name="add-circle-outline" size={16} color={theme.colors.secondary} />
                                <Text style={s.ctaPrimaryText}>Criar primeiro roteiro</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[s.cta, s.ctaSecondary]} onPress={onEnterPortal} activeOpacity={0.85}>
                                <Text style={s.ctaSecondaryText}>Conhecer a central</Text>
                                <Ionicons name="arrow-forward" size={15} color="#fff" />
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </LinearGradient>
        </View>
    );
}

const s = StyleSheet.create({
    wrap: { marginHorizontal: 20, marginTop: 24 },
    card: { borderRadius: 20, padding: 20, ...theme.shadows.large },
    eyebrow: { fontSize: 11, fontWeight: '700', color: '#9FE9E2', letterSpacing: 1 },
    title: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.4, marginTop: 3 },
    subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.82)', lineHeight: 19, marginTop: 6 },

    microRow: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 14,
        paddingVertical: 12, marginTop: 16,
    },
    microItem: { flex: 1, alignItems: 'center' },
    microValue: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
    microLabel: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
    microDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.2)' },

    ctaRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
    cta: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
        borderRadius: 12, paddingVertical: 12, paddingHorizontal: 10,
    },
    ctaPrimary: { backgroundColor: '#FFFFFF' },
    ctaPrimaryText: { fontSize: 13.5, fontWeight: '800', color: theme.colors.secondary },
    ctaSecondary: { backgroundColor: 'rgba(255,255,255,0.16)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)' },
    ctaSecondaryText: { fontSize: 13.5, fontWeight: '700', color: '#fff' },
});

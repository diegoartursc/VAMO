/**
 * VAMO Mobile — "Configurações" do roteirista.
 * Primeira versão: identidade do criador (nome/avatar/verificação), atalhos
 * para recebimentos, verificação e perguntas, e orientações de recebimento.
 * Sem dados mockados — usa o usuário autenticado (useAuth).
 *
 * TODO: quando houver tela dedicada de edição de perfil de roteirista e
 * onboarding de pagamentos (Stripe Connect), apontar os atalhos para elas.
 */
import React from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    StatusBar, useWindowDimensions,
} from 'react-native';
import { CreatorAvatar } from '../src/components/common/CreatorAvatar';
import { useRouter } from 'expo-router';
import { safeBack } from '../src/utils/navigation';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../src/theme/theme';
import { haptics } from '../src/services/haptics';
import { useAuth } from '../src/contexts/AuthContext';
import { CreatorSubHeader } from '../src/features/creator/dashboard/CreatorDashboardHeader';
import { CreatorEmptyState } from '../src/features/creator/dashboard/CreatorEmptyState';
import { DASHBOARD_MAX_WIDTH } from '../src/features/creator/dashboard/types';

const VERIFICATION_LABEL: Record<string, { label: string; color: string }> = {
    BASIC:    { label: 'Roteirista Básico',     color: theme.colors.text.secondary },
    VERIFIED: { label: 'Roteirista Verificado', color: theme.colors.primary },
    PREMIUM:  { label: 'Roteirista Premium',    color: theme.colors.warning },
    EXPERT:   { label: 'Roteirista Expert',     color: theme.colors.success },
};

function Row({ icon, title, hint, onPress, tone }: { icon: string; title: string; hint: string; onPress: () => void; tone?: string }) {
    const color = tone ?? theme.colors.primary;
    return (
        <TouchableOpacity style={s.row} activeOpacity={0.8} onPress={onPress}>
            <View style={[s.rowIcon, { backgroundColor: color + '12' }]}>
                <Ionicons name={icon as any} size={20} color={color} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={s.rowTitle}>{title}</Text>
                <Text style={s.rowHint}>{hint}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.text.tertiary} />
        </TouchableOpacity>
    );
}

export default function CreatorSettingsScreen() {
    const router = useRouter();
    const { user, isAuthenticated, isLoading } = useAuth();
    const { width } = useWindowDimensions();
    void width; void DASHBOARD_MAX_WIDTH;

    const header = (
        <CreatorSubHeader
            title="Configurações"
            subtitle="Gerencie dados do perfil, recebimentos e preferências de roteirista."
            onBack={() => safeBack(router, '/created-itineraries')}
        />
    );

    if (!isLoading && !isAuthenticated) {
        return (
            <View style={s.container}>
                {header}
                <View style={s.center}>
                    <CreatorEmptyState icon="lock-closed-outline" title="Login necessário" text="Faça login para acessar as configurações." ctaLabel="Entrar" onCta={() => router.push({ pathname: '/login' as any, params: { next: '/creator-settings' } })} />
                </View>
            </View>
        );
    }

    const level = (user?.verificationLevel || 'BASIC').toUpperCase();
    const verif = VERIFICATION_LABEL[level] ?? VERIFICATION_LABEL.BASIC;

    return (
        <View style={s.container}>
            <StatusBar barStyle="dark-content" />
            {header}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
                <View style={s.maxWidth}>
                    {/* Identidade do criador */}
                    <View style={s.profileCard}>
                        <CreatorAvatar avatar={user?.avatar} name={user?.name} size={56} />
                        <View style={{ flex: 1 }}>
                            <Text style={s.profileName}>{user?.name || 'Roteirista'}</Text>
                            {!!user?.email && <Text style={s.profileEmail}>{user.email}</Text>}
                            <View style={[s.verifBadge, { backgroundColor: verif.color + '15' }]}>
                                <Ionicons name="shield-checkmark-outline" size={12} color={verif.color} />
                                <Text style={[s.verifText, { color: verif.color }]}>{verif.label}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Conta & perfil */}
                    <Text style={s.sectionLabel}>Conta & perfil</Text>
                    <Row icon="person-circle-outline" title="Editar perfil" hint="Nome e foto de perfil" onPress={() => { haptics.light(); router.push('/(tabs)/profile' as any); }} />
                    <Row icon="shield-checkmark-outline" title="Nível de verificação" hint={`Atual: ${verif.label}`} onPress={() => { haptics.light(); router.push('/verification-explained'); }} tone={verif.color} />

                    {/* Recebimentos */}
                    <Text style={s.sectionLabel}>Recebimentos</Text>
                    <Row icon="card-outline" title="Recebimentos e saldo" hint="Saldo, transações e pagamentos" onPress={() => { haptics.light(); router.push('/creator-earnings'); }} tone={theme.colors.success} />
                    <View style={s.infoCard}>
                        <Ionicons name="information-circle-outline" size={18} color={theme.colors.primary} />
                        <Text style={s.infoText}>
                            Os valores das suas vendas ficam disponíveis para saque após a confirmação da compra. A configuração de conta para recebimento estará disponível em breve.
                        </Text>
                    </View>

                    {/* Interação */}
                    <Text style={s.sectionLabel}>Interação com viajantes</Text>
                    <Row icon="chatbubbles-outline" title="Perguntas dos viajantes" hint="Responda dúvidas sobre seus roteiros" onPress={() => { haptics.light(); router.push('/creator-questions'); }} tone={theme.colors.secondary} />

                    <TouchableOpacity style={s.backBtn} activeOpacity={0.85} onPress={() => { haptics.light(); router.push('/(tabs)/profile' as any); }}>
                        <Ionicons name="arrow-back-outline" size={18} color={theme.colors.primary} />
                        <Text style={s.backBtnText}>Voltar ao perfil</Text>
                    </TouchableOpacity>

                    <View style={{ height: 40 }} />
                </View>
            </ScrollView>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scroll: { paddingHorizontal: 16, paddingTop: 6 },
    maxWidth: { width: '100%', maxWidth: DASHBOARD_MAX_WIDTH, alignSelf: 'center' },

    profileCard: {
        flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 8,
        backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border,
        borderRadius: 16, padding: 16, ...theme.shadows.small,
    },
    avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: theme.colors.primary + '15', alignItems: 'center', justifyContent: 'center' },
    avatarImg: { width: 56, height: 56, borderRadius: 28, backgroundColor: theme.colors.surfaceLight },
    avatarText: { fontSize: 22, fontWeight: '800', color: theme.colors.primary },
    profileName: { fontSize: 17, fontWeight: '800', color: theme.colors.text.primary },
    profileEmail: { fontSize: 13, color: theme.colors.text.secondary, marginTop: 1 },
    verifBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4, marginTop: 8 },
    verifText: { fontSize: 11.5, fontWeight: '700' },

    sectionLabel: { fontSize: 12, fontWeight: '800', color: theme.colors.text.tertiary, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 20, marginBottom: 10 },

    row: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border,
        borderRadius: 14, padding: 13, marginBottom: 8,
    },
    rowIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    rowTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.text.primary },
    rowHint: { fontSize: 12, color: theme.colors.text.tertiary, marginTop: 2 },

    infoCard: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 8,
        backgroundColor: theme.colors.primary + '0D', borderRadius: 12, padding: 12, marginBottom: 4,
    },
    infoText: { flex: 1, fontSize: 12.5, color: theme.colors.text.secondary, lineHeight: 18 },

    backBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        borderWidth: 1.5, borderColor: theme.colors.primary, borderRadius: 14, paddingVertical: 14, marginTop: 18,
    },
    backBtnText: { fontSize: 15, fontWeight: '700', color: theme.colors.primary },
});

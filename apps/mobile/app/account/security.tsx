/**
 * VAMO Mobile — Segurança da conta.
 *
 * Tela informativa/honesta: não há (ainda) fluxo de troca de senha, 2FA ou
 * "sair de todos os dispositivos" no backend, então NÃO exibimos botões
 * falsos. Mostramos o método de login da conta, o e-mail e orientação de
 * suporte. O único botão real é "Sair da conta" (logout local) e o atalho
 * para a Central de Ajuda.
 *
 * TODO(backend): quando existirem endpoints de alteração de senha / sessões,
 * adicionar as ações reais aqui.
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../src/theme/theme';
import { haptics } from '../../src/services/haptics';
import { Icon, IconName } from '../../src/components/common/Icons';
import { ScreenHeader } from '../../src/components/common/ScreenHeader';
import { useAuth } from '../../src/contexts/AuthContext';

function InfoCard({ icon, title, children }: { icon: IconName; title: string; children: React.ReactNode }) {
    return (
        <View style={s.card}>
            <View style={s.cardHead}>
                <View style={s.cardIcon}>
                    <Icon name={icon} size={18} color={theme.colors.primary} />
                </View>
                <Text style={s.cardTitle}>{title}</Text>
            </View>
            {children}
        </View>
    );
}

export default function SecurityScreen() {
    const router = useRouter();
    const { user } = useAuth();

    return (
        <View style={s.container}>
            <ScreenHeader title="Segurança" subtitle="Recursos de proteção e acesso da sua conta." />
            <ScrollView contentContainerStyle={s.scroll}>
                {/* E-mail da conta */}
                <InfoCard icon="circle-user" title="Conta">
                    <Text style={s.cardLabel}>E-mail de acesso</Text>
                    <Text style={s.cardValue}>{user?.email || '—'}</Text>
                </InfoCard>

                {/* Login / senha */}
                <InfoCard icon="shield-check" title="Login e senha">
                    <Text style={s.cardText}>
                        Sua conta é protegida pelo método de login usado no cadastro. Mantenha
                        seu e-mail seguro — ele é a chave de acesso à sua conta VAMO.
                    </Text>
                </InfoCard>

                {/* Alteração de senha — honesto, sem botão falso */}
                <InfoCard icon="lock" title="Alteração de senha">
                    <Text style={s.cardText}>
                        A alteração de senha no app estará disponível em breve. Se você
                        precisar redefinir o acesso agora, fale com o suporte pela Central de
                        Ajuda.
                    </Text>
                    <TouchableOpacity
                        style={s.linkBtn}
                        onPress={() => { haptics.light(); router.push('/help'); }}
                    >
                        <Icon name="message-circle" size={16} color={theme.colors.primary} />
                        <Text style={s.linkBtnText}>Ir para a Central de ajuda</Text>
                    </TouchableOpacity>
                </InfoCard>

                {/* Acesso indevido */}
                <InfoCard icon="info" title="Acesso indevido?">
                    <Text style={s.cardText}>
                        Se você suspeitar de acesso não autorizado à sua conta, saia da conta
                        e entre em contato com o suporte imediatamente.
                    </Text>
                </InfoCard>
            </ScrollView>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.surfaceLight },
    scroll: { padding: 20, paddingBottom: 60, gap: 14 },
    card: {
        backgroundColor: theme.colors.background,
        borderRadius: 16, padding: 16,
        borderWidth: 1, borderColor: theme.colors.borderLight,
    },
    cardHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
    cardIcon: {
        width: 34, height: 34, borderRadius: 17,
        backgroundColor: theme.colors.primary + '14',
        alignItems: 'center', justifyContent: 'center',
    },
    cardTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.text.primary },
    cardLabel: { fontSize: 12, color: theme.colors.text.tertiary, marginBottom: 2 },
    cardValue: { fontSize: 15, fontWeight: '600', color: theme.colors.text.primary },
    cardText: { fontSize: 13.5, color: theme.colors.text.secondary, lineHeight: 20 },
    linkBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
    linkBtnText: { fontSize: 14, fontWeight: '600', color: theme.colors.primary },
});

/**
 * VAMO Mobile — Segurança da conta.
 *
 * Tela honesta: não há 2FA no backend, então NÃO exibimos botões falsos. A
 * troca de senha usa o fluxo de redefinição por e-mail (/forgot-password). A
 * exclusão de conta é real (POST /auth/traveler/delete-account, com senha).
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../src/theme/theme';
import { haptics } from '../../src/services/haptics';
import { Icon, IconName } from '../../src/components/common/Icons';
import { ScreenHeader } from '../../src/components/common/ScreenHeader';
import { useAuth } from '../../src/contexts/AuthContext';
import VamoButton from '../../src/components/common/VamoButton';
import { confirm } from '../../src/utils/confirm';
import { notify } from '../../src/utils/notify';
import { deleteAccount } from '../../src/services/auth';

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
    const { user, accessToken, logout } = useAuth();
    const [password, setPassword] = useState('');
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    async function handleDelete() {
        setDeleteError(null);
        if (!password) {
            setDeleteError('Enter your password to confirm.');
            return;
        }
        const ok = await confirm({
            title: 'Delete account?',
            message: 'This is permanent. Your profile, saved items and trip files will be deleted. Purchase records are kept without your name or email, as required for accounting.',
            confirmText: 'Delete account',
            action: 'deleteAccount',
        });
        if (!ok || !accessToken) return;
        setDeleting(true);
        const result = await deleteAccount(accessToken, password);
        setDeleting(false);
        if (!result.ok) {
            setDeleteError(result.error);
            return;
        }
        haptics.success();
        await logout();
        notify({ title: 'Account deleted', message: 'Your account and personal data were deleted.', variant: 'success' });
        router.replace('/(tabs)/profile');
    }

    return (
        <View style={s.container}>
            <ScreenHeader title="Security" subtitle="Protection and access features for your account." />
            <ScrollView contentContainerStyle={s.scroll}>
                {/* E-mail da conta */}
                <InfoCard icon="circle-user" title="Account">
                    <Text style={s.cardLabel}>Sign-in email</Text>
                    <Text style={s.cardValue}>{user?.email || '—'}</Text>
                </InfoCard>

                {/* Login / senha */}
                <InfoCard icon="shield-check" title="Sign-in and password">
                    <Text style={s.cardText}>
                        Your account is protected by the sign-in method you used to register. Keep
                        your email secure — it's the key to your VAMO account.
                    </Text>
                </InfoCard>

                {/* Alteração de senha — honesto, sem botão falso */}
                <InfoCard icon="lock" title="Change password">
                    <Text style={s.cardText}>
                        To change your password, we send a reset link to your
                        email. The link is valid for 1 hour.
                    </Text>
                    <TouchableOpacity
                        style={s.linkBtn}
                        onPress={() => {
                            haptics.light();
                            router.push({ pathname: '/forgot-password', params: user?.email ? { email: user.email } : {} });
                        }}
                    >
                        <Icon name="lock" size={16} color={theme.colors.primary} />
                        <Text style={s.linkBtnText}>Reset password by email</Text>
                    </TouchableOpacity>
                </InfoCard>

                {/* Excluir conta (real, com senha) */}
                <InfoCard icon="trash" title="Delete account">
                    <Text style={s.cardText}>
                        Deletes your profile and personal data. Purchase records are kept
                        without your name or email. Creator accounts are closed by our support team.
                    </Text>
                    <TextInput
                        style={s.input}
                        placeholder="Your password"
                        placeholderTextColor={theme.colors.text.tertiary}
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                        editable={!deleting}
                        accessibilityLabel="Password to confirm account deletion"
                    />
                    {deleteError ? <Text style={s.errorText}>{deleteError}</Text> : null}
                    <View style={{ marginTop: 12 }}>
                        <VamoButton label="Delete my account" variant="danger" onPress={handleDelete} loading={deleting} />
                    </View>
                </InfoCard>

                {/* Acesso indevido */}
                <InfoCard icon="info" title="Unauthorized access?">
                    <Text style={s.cardText}>
                        If you suspect unauthorized access to your account, sign out
                        and contact support right away.
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
    input: {
        marginTop: 12, height: 46, borderRadius: 12, borderWidth: 1.5,
        borderColor: theme.colors.borderLight, backgroundColor: theme.colors.surfaceLight,
        paddingHorizontal: 14, fontSize: 15, color: theme.colors.text.primary,
    },
    errorText: { marginTop: 8, fontSize: 13, color: theme.colors.error },
});

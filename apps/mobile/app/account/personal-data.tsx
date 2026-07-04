/**
 * VAMO Mobile — Dados pessoais.
 * Visualizar e editar dados básicos do usuário logado (nome, telefone).
 * E-mail é read-only (não há fluxo de troca de e-mail confirmado).
 * Persiste via PATCH /api/auth/traveler/me e atualiza o AuthContext.
 */
import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
    ActivityIndicator, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../src/theme/theme';
import { haptics } from '../../src/services/haptics';
import { Icon } from '../../src/components/common/Icons';
import { ScreenHeader } from '../../src/components/common/ScreenHeader';
import { useAuth } from '../../src/contexts/AuthContext';
import { getMyProfile, updateMyProfile } from '../../src/services/api';
import { notify } from '../../src/utils/notify';

export default function PersonalDataScreen() {
    const router = useRouter();
    const { user, accessToken, isAuthenticated, isLoading, updateUser } = useAuth();

    const [name, setName] = useState(user?.name ?? '');
    const [phone, setPhone] = useState(user?.phone ?? '');
    const [initialName, setInitialName] = useState(user?.name ?? '');
    const [initialPhone, setInitialPhone] = useState(user?.phone ?? '');
    const [hydrating, setHydrating] = useState(true);
    const [saving, setSaving] = useState(false);

    // Hidrata os campos com o backend (phone vem de TravelerPersonalData, que
    // não está no payload de login — só em GET /me).
    useEffect(() => {
        if (!accessToken) { setHydrating(false); return; }
        let alive = true;
        getMyProfile(accessToken)
            .then((me) => {
                if (!alive) return;
                setName(me.name ?? '');
                setPhone(me.phone ?? '');
                setInitialName(me.name ?? '');
                setInitialPhone(me.phone ?? '');
            })
            .catch(() => { /* mantém valores do contexto */ })
            .finally(() => { if (alive) setHydrating(false); });
        return () => { alive = false; };
    }, [accessToken]);

    const trimmedName = name.trim();
    const nameValid = trimmedName.length >= 2;
    const dirty = trimmedName !== initialName.trim() || phone.trim() !== initialPhone.trim();
    const canSave = nameValid && dirty && !saving;

    const handleSave = async () => {
        if (!accessToken || !canSave) return;
        haptics.light();
        setSaving(true);
        try {
            const updated = await updateMyProfile(
                { name: trimmedName, phone: phone.trim() || null },
                accessToken,
            );
            updateUser({ name: updated.name, phone: updated.phone });
            setInitialName(updated.name ?? '');
            setInitialPhone(updated.phone ?? '');
            haptics.success();
            notify({ title: 'Dados atualizados', message: 'Suas informações foram salvas.', variant: 'success' });
        } catch (err: any) {
            haptics.error?.();
            notify({
                title: 'Não foi possível salvar',
                message: typeof err?.message === 'string' ? err.message : 'Tente novamente em instantes.',
                variant: 'error',
            });
        } finally {
            setSaving(false);
        }
    };

    if (!isLoading && !isAuthenticated) {
        return (
            <View style={s.container}>
                <ScreenHeader title="Dados pessoais" />
                <View style={s.center}>
                    <Icon name="lock" size={40} color={theme.colors.text.tertiary} />
                    <Text style={s.emptyTitle}>Login necessário</Text>
                    <Text style={s.emptyText}>Entre na sua conta para ver e editar seus dados.</Text>
                    <TouchableOpacity style={s.primaryBtn} onPress={() => router.push('/login')}>
                        <Text style={s.primaryBtnText}>Entrar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={s.container}>
            <ScreenHeader title="Dados pessoais" subtitle="Veja e edite suas informações de conta." />
            <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
                {hydrating ? (
                    <View style={s.center}><ActivityIndicator color={theme.colors.primary} /></View>
                ) : (
                    <>
                        {/* Nome */}
                        <Text style={s.label}>Nome</Text>
                        <TextInput
                            style={s.input}
                            value={name}
                            onChangeText={setName}
                            placeholder="Seu nome"
                            placeholderTextColor={theme.colors.text.tertiary}
                            autoCapitalize="words"
                            maxLength={80}
                        />
                        {!nameValid && name.length > 0 && (
                            <Text style={s.errorHint}>O nome precisa ter pelo menos 2 caracteres.</Text>
                        )}

                        {/* E-mail (read-only) */}
                        <Text style={s.label}>E-mail</Text>
                        <View style={[s.input, s.inputReadonly]}>
                            <Text style={s.readonlyValue} numberOfLines={1}>{user?.email || '—'}</Text>
                            <Icon name="lock" size={16} color={theme.colors.text.tertiary} />
                        </View>
                        <Text style={s.hint}>O e-mail da conta não pode ser alterado por aqui.</Text>

                        {/* Telefone */}
                        <Text style={s.label}>Telefone</Text>
                        <TextInput
                            style={s.input}
                            value={phone}
                            onChangeText={setPhone}
                            placeholder="(opcional)"
                            placeholderTextColor={theme.colors.text.tertiary}
                            keyboardType={Platform.OS === 'web' ? 'default' : 'phone-pad'}
                            maxLength={40}
                        />

                        {/* Foto: aponta para o Perfil, onde já existe o editor. */}
                        <TouchableOpacity
                            style={s.linkRow}
                            onPress={() => { haptics.light(); router.push('/(tabs)/profile'); }}
                        >
                            <Icon name="camera" size={18} color={theme.colors.primary} />
                            <Text style={s.linkText}>Alterar foto de perfil e capa</Text>
                            <Icon name="chevron-right" size={18} color={theme.colors.text.tertiary} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[s.saveBtn, !canSave && s.saveBtnDisabled]}
                            onPress={handleSave}
                            disabled={!canSave}
                        >
                            {saving
                                ? <ActivityIndicator color="#fff" />
                                : <Text style={s.saveBtnText}>Salvar alterações</Text>}
                        </TouchableOpacity>
                    </>
                )}
            </ScrollView>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.surfaceLight },
    scroll: { padding: 20, paddingBottom: 60 },
    center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
    label: {
        fontSize: 13, fontWeight: '700', color: theme.colors.text.secondary,
        marginTop: 18, marginBottom: 8, marginLeft: 2,
    },
    input: {
        backgroundColor: theme.colors.background,
        borderWidth: 1, borderColor: theme.colors.border,
        borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14,
        fontSize: 15, color: theme.colors.text.primary,
    },
    inputReadonly: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: theme.colors.surfaceHighlight,
    },
    readonlyValue: { fontSize: 15, color: theme.colors.text.secondary, flex: 1 },
    hint: { fontSize: 12, color: theme.colors.text.tertiary, marginTop: 6, marginLeft: 2 },
    errorHint: { fontSize: 12, color: theme.colors.error, marginTop: 6, marginLeft: 2 },
    linkRow: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: theme.colors.background,
        borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12,
        paddingHorizontal: 14, paddingVertical: 14, marginTop: 24,
    },
    linkText: { flex: 1, fontSize: 15, fontWeight: '500', color: theme.colors.text.primary },
    saveBtn: {
        backgroundColor: theme.colors.primary, borderRadius: 14,
        paddingVertical: 16, alignItems: 'center', marginTop: 28,
    },
    saveBtnDisabled: { opacity: 0.45 },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    emptyTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.text.primary },
    emptyText: { fontSize: 14, color: theme.colors.text.secondary, textAlign: 'center', paddingHorizontal: 24 },
    primaryBtn: { backgroundColor: theme.colors.primary, borderRadius: 14, paddingHorizontal: 32, paddingVertical: 14, marginTop: 8 },
    primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

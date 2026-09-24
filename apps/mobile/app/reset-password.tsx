/**
 * VAMO — Redefinir senha
 * Aberta pelo link do e-mail: /reset-password?token=...
 * Não faz login automático: o usuário entra depois com a senha nova.
 */

import React, { useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../src/theme/theme';
import { haptics } from '../src/services/haptics';
import { resetPassword } from '../src/services/auth';
import VamoButton from '../src/components/common/VamoButton';
import AuthScreenShell, { authStyles as s } from '../src/components/auth/AuthScreenShell';

const MIN_PASSWORD_LENGTH = 6;

type Status = 'form' | 'success' | 'invalid';

function PasswordField(props: {
    label: string;
    value: string;
    onChangeText: (v: string) => void;
    editable: boolean;
    returnKeyType: 'next' | 'done';
    onSubmitEditing: () => void;
    inputRef?: React.RefObject<TextInput | null>;
}) {
    const [visible, setVisible] = useState(false);
    return (
        <View style={s.field}>
            <Text style={s.label}>{props.label}</Text>
            <View style={s.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={18} color={theme.colors.text.tertiary} style={s.inputIcon} />
                <TextInput
                    ref={props.inputRef}
                    style={s.input}
                    placeholder="••••••••"
                    placeholderTextColor={theme.colors.text.tertiary}
                    secureTextEntry={!visible}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="new-password"
                    textContentType="newPassword"
                    value={props.value}
                    onChangeText={props.onChangeText}
                    returnKeyType={props.returnKeyType}
                    onSubmitEditing={props.onSubmitEditing}
                    editable={props.editable}
                />
                <TouchableOpacity
                    onPress={() => setVisible((v) => !v)}
                    style={s.eyeButton}
                    accessibilityLabel={visible ? 'Esconder senha' : 'Mostrar senha'}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={18} color={theme.colors.text.tertiary} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

export default function ResetPasswordScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ token?: string | string[] }>();
    const token = ((Array.isArray(params.token) ? params.token[0] : params.token) ?? '').trim();

    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<Status>(token ? 'form' : 'invalid');
    const confirmRef = useRef<TextInput | null>(null);

    const submit = async () => {
        if (loading) return;
        setError(null);
        if (password.length < MIN_PASSWORD_LENGTH) {
            setError(`A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`);
            return;
        }
        if (password !== confirm) {
            setError('As senhas não coincidem.');
            return;
        }
        haptics.light();
        setLoading(true);
        try {
            await resetPassword(token, password);
            haptics.success();
            setStatus('success');
        } catch (err: any) {
            haptics.error?.();
            if (err?.status === 400) {
                setStatus('invalid');
            } else {
                setError(err?.message || 'Não foi possível redefinir a senha. Tente novamente.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (status === 'success') {
        return (
            <AuthScreenShell>
                <View style={[s.stateIcon, { backgroundColor: 'rgba(40,201,191,0.12)' }]}>
                    <Ionicons name="checkmark-circle-outline" size={34} color={theme.colors.primary} />
                </View>
                <Text style={s.stateTitle}>Senha alterada com sucesso</Text>
                <Text style={[s.stateText, { marginBottom: 24 }]}>
                    Você já pode entrar no VAMO com sua nova senha.
                </Text>
                <VamoButton label="Entrar" onPress={() => router.replace('/login')} size="lg" fullWidth iconStart="log-in-outline" />
            </AuthScreenShell>
        );
    }

    if (status === 'invalid') {
        return (
            <AuthScreenShell>
                <View style={[s.stateIcon, { backgroundColor: '#FEF2F2' }]}>
                    <Ionicons name="link-outline" size={30} color="#EF4444" />
                </View>
                <Text style={s.stateTitle}>Este link é inválido ou expirou.</Text>
                <Text style={[s.stateText, { marginBottom: 24 }]}>
                    Os links de redefinição valem por 1 hora e só podem ser usados uma vez. Peça um novo link para continuar.
                </Text>
                <VamoButton label="Solicitar novo link" onPress={() => router.replace('/forgot-password')} size="lg" fullWidth />
                <TouchableOpacity style={s.linkButton} onPress={() => router.replace('/login')}>
                    <Text style={s.linkText}>Voltar para entrar</Text>
                </TouchableOpacity>
            </AuthScreenShell>
        );
    }

    return (
        <AuthScreenShell>
            <Text style={s.title}>Criar nova senha</Text>
            <Text style={s.subtitle}>Escolha uma senha nova para a sua conta VAMO.</Text>

            {error && (
                <View style={s.errorBox}>
                    <Ionicons name="alert-circle" size={16} color="#EF4444" />
                    <Text style={s.errorText}>{error}</Text>
                </View>
            )}

            <PasswordField
                label="Nova senha"
                value={password}
                onChangeText={setPassword}
                editable={!loading}
                returnKeyType="next"
                onSubmitEditing={() => confirmRef.current?.focus()}
            />
            <Text style={[s.hint, { marginTop: -12, marginBottom: 18 }]}>Mínimo de {MIN_PASSWORD_LENGTH} caracteres.</Text>
            <PasswordField
                label="Confirmar nova senha"
                value={confirm}
                onChangeText={setConfirm}
                editable={!loading}
                returnKeyType="done"
                onSubmitEditing={submit}
                inputRef={confirmRef}
            />

            <VamoButton
                label="Redefinir senha"
                onPress={submit}
                size="lg"
                fullWidth
                loading={loading}
                disabled={loading}
                style={{ marginTop: 8 }}
            />

            <TouchableOpacity style={s.linkButton} onPress={() => router.replace('/login')} disabled={loading}>
                <Text style={s.linkText}>Voltar para entrar</Text>
            </TouchableOpacity>
        </AuthScreenShell>
    );
}

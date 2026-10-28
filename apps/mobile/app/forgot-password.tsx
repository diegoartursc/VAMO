/**
 * VAMO — "Esqueci minha senha"
 * Pede o link de redefinição. A resposta é sempre neutra: nunca revela se o
 * e-mail tem conta.
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../src/theme/theme';
import { haptics } from '../src/services/haptics';
import { requestPasswordReset } from '../src/services/auth';
import VamoButton from '../src/components/common/VamoButton';
import AuthScreenShell, { authStyles as s } from '../src/components/auth/AuthScreenShell';

const RESEND_COOLDOWN_SECONDS = 60;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ email?: string | string[] }>();
    const initialEmail = (Array.isArray(params.email) ? params.email[0] : params.email) ?? '';

    const [email, setEmail] = useState(initialEmail);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sentTo, setSentTo] = useState<string | null>(null);
    const [cooldown, setCooldown] = useState(0);
    const timer = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

    const startCooldown = () => {
        setCooldown(RESEND_COOLDOWN_SECONDS);
        if (timer.current) clearInterval(timer.current);
        timer.current = setInterval(() => {
            setCooldown((c) => {
                if (c <= 1 && timer.current) { clearInterval(timer.current); timer.current = null; }
                return Math.max(0, c - 1);
            });
        }, 1000);
    };

    const submit = async (target: string) => {
        if (loading) return;
        setError(null);
        const normalized = target.trim().toLowerCase();
        if (!EMAIL_RE.test(normalized)) {
            setError('Enter a valid email address.');
            return;
        }
        haptics.light();
        setLoading(true);
        try {
            await requestPasswordReset(normalized);
            haptics.success();
            setSentTo(normalized);
            startCooldown();
        } catch (err: any) {
            haptics.error?.();
            setError(err?.message || 'We couldn\'t send it right now. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const goToLogin = () => router.replace('/login');

    if (sentTo) {
        return (
            <AuthScreenShell>
                <View style={[s.stateIcon, { backgroundColor: 'rgba(40,201,191,0.12)' }]}>
                    <Ionicons name="mail-unread-outline" size={30} color={theme.colors.primary} />
                </View>
                <Text style={s.stateTitle}>Check your email</Text>
                <Text style={s.stateText}>
                    If an account exists for <Text style={s.stateEmphasis}>{sentTo}</Text>, we'll send a link to
                    reset your password.
                </Text>
                <Text style={[s.stateText, { marginBottom: 24 }]}>
                    The link is valid for 1 hour. Can't find it? Check your spam folder too.
                </Text>

                {error && (
                    <View style={s.errorBox}>
                        <Ionicons name="alert-circle" size={16} color="#EF4444" />
                        <Text style={s.errorText}>{error}</Text>
                    </View>
                )}

                <VamoButton label="Back to sign in" onPress={goToLogin} size="lg" fullWidth />
                <VamoButton
                    label={cooldown > 0 ? `Resend link in ${cooldown}s` : 'Resend link'}
                    onPress={() => submit(sentTo)}
                    variant="ghost"
                    size="md"
                    fullWidth
                    loading={loading}
                    disabled={cooldown > 0 || loading}
                    style={{ marginTop: 8 }}
                />
                <TouchableOpacity
                    style={s.linkButton}
                    onPress={() => { setSentTo(null); setError(null); }}
                    disabled={loading}
                >
                    <Text style={s.linkText}>Use a different email</Text>
                </TouchableOpacity>
            </AuthScreenShell>
        );
    }

    return (
        <AuthScreenShell>
            <Text style={s.title}>Forgot your password?</Text>
            <Text style={s.subtitle}>
                Enter your account email and we'll send you a link to create a new password.
            </Text>

            {error && (
                <View style={s.errorBox}>
                    <Ionicons name="alert-circle" size={16} color="#EF4444" />
                    <Text style={s.errorText}>{error}</Text>
                </View>
            )}

            <View style={s.field}>
                <Text style={s.label}>Email</Text>
                <View style={s.inputWrapper}>
                    <Ionicons name="mail-outline" size={18} color={theme.colors.text.tertiary} style={s.inputIcon} />
                    <TextInput
                        style={s.input}
                        placeholder="you@email.com"
                        placeholderTextColor={theme.colors.text.tertiary}
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="email-address"
                        autoComplete="email"
                        textContentType="emailAddress"
                        value={email}
                        onChangeText={setEmail}
                        returnKeyType="send"
                        onSubmitEditing={() => submit(email)}
                        editable={!loading}
                        autoFocus={!initialEmail}
                    />
                </View>
            </View>

            <VamoButton
                label="Send reset link"
                onPress={() => submit(email)}
                size="lg"
                fullWidth
                loading={loading}
                disabled={loading}
                style={{ marginTop: 8 }}
            />

            <TouchableOpacity style={s.linkButton} onPress={goToLogin} disabled={loading}>
                <Text style={s.linkText}>Back to sign in</Text>
            </TouchableOpacity>
        </AuthScreenShell>
    );
}

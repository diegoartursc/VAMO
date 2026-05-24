/**
 * VAMO Mobile — Tela de Login real
 * Conecta com /api/auth/traveler/login via AuthContext.
 */

import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../src/theme/theme';
import { useAuth } from '../src/contexts/AuthContext';
import { haptics } from '../src/services/haptics';
import VamoLogo from '../src/components/common/VamoLogo';

export default function LoginScreen() {
    const router = useRouter();
    const { login } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async () => {
        setError(null);
        if (!email.trim() || !password.trim()) {
            setError('Preencha e-mail e senha.');
            return;
        }

        haptics.light();
        setLoading(true);

        try {
            await login(email.trim().toLowerCase(), password);
            console.log('[login screen] login ok — redirecionando');
            haptics.success();
            router.replace('/(tabs)/profile');
        } catch (err: any) {
            haptics.error?.();
            const msg = err?.message || 'Erro ao fazer login. Verifique e-mail e senha.';
            setError(msg);
            console.warn('[login screen] erro:', msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.root}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                {/* Header gradiente */}
                <LinearGradient
                    colors={['#1A3263', '#28C9BF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.header}
                >
                    <VamoLogo size={160} />
                    <Text style={styles.tagline}>Roteiros criados por quem já esteve lá</Text>
                </LinearGradient>

                <View style={styles.card}>
                    <Text style={styles.title}>Entrar na conta</Text>
                    <Text style={styles.subtitle}>Acesse seus roteiros, favoritos e perfil</Text>

                    {/* Erro */}
                    {error && (
                        <View style={styles.errorBox}>
                            <Ionicons name="alert-circle" size={16} color="#EF4444" />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    )}

                    {/* E-mail */}
                    <View style={styles.field}>
                        <Text style={styles.label}>E-mail</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="mail-outline" size={18} color={theme.colors.text.tertiary} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="seu@email.com"
                                placeholderTextColor={theme.colors.text.tertiary}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                autoComplete="email"
                                value={email}
                                onChangeText={setEmail}
                                returnKeyType="next"
                                editable={!loading}
                            />
                        </View>
                    </View>

                    {/* Senha */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Senha</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="lock-closed-outline" size={18} color={theme.colors.text.tertiary} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, styles.inputPassword]}
                                placeholder="••••••••"
                                placeholderTextColor={theme.colors.text.tertiary}
                                secureTextEntry={!showPassword}
                                autoComplete="password"
                                value={password}
                                onChangeText={setPassword}
                                returnKeyType="done"
                                onSubmitEditing={handleLogin}
                                editable={!loading}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.eyeButton}>
                                <Ionicons
                                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                    size={18}
                                    color={theme.colors.text.tertiary}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Botão entrar */}
                    <TouchableOpacity
                        style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                        activeOpacity={0.85}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <>
                                <Text style={styles.loginButtonText}>Entrar</Text>
                                <Ionicons name="arrow-forward" size={18} color="#fff" />
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Divider */}
                    <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>ou</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    {/* Criar conta */}
                    <TouchableOpacity
                        style={styles.registerButton}
                        onPress={() => router.push('/register')}
                        disabled={loading}
                    >
                        <Text style={styles.registerButtonText}>Criar conta grátis</Text>
                    </TouchableOpacity>

                    {/* Continuar sem login */}
                    <TouchableOpacity
                        style={styles.skipButton}
                        onPress={() => router.replace('/(tabs)')}
                        disabled={loading}
                    >
                        <Text style={styles.skipText}>Continuar sem login →</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    scroll: {
        flexGrow: 1,
    },
    header: {
        paddingTop: Platform.OS === 'ios' ? 80 : 60,
        paddingBottom: 48,
        paddingHorizontal: 28,
        alignItems: 'center',
    },
    logoImage: {
        width: 180,
        height: 72,
        marginBottom: 8,
    },
    tagline: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
    },
    card: {
        flex: 1,
        backgroundColor: theme.colors.background,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        marginTop: -20,
        padding: 28,
        paddingTop: 32,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: theme.colors.text.primary,
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        marginBottom: 24,
    },
    errorBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#FEF2F2',
        borderRadius: 10,
        padding: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    errorText: {
        flex: 1,
        fontSize: 13,
        color: '#EF4444',
    },
    field: {
        marginBottom: 18,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.text.primary,
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: theme.colors.borderLight,
        borderRadius: 12,
        backgroundColor: theme.colors.surfaceLight,
        paddingHorizontal: 14,
        height: 50,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: theme.colors.text.primary,
        height: '100%',
    },
    inputPassword: {
        flex: 1,
    },
    eyeButton: {
        padding: 4,
    },
    loginButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: theme.colors.primary,
        borderRadius: 14,
        height: 52,
        marginTop: 8,
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    loginButtonDisabled: {
        opacity: 0.7,
    },
    loginButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginVertical: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: theme.colors.borderLight,
    },
    dividerText: {
        fontSize: 13,
        color: theme.colors.text.tertiary,
    },
    registerButton: {
        borderWidth: 1.5,
        borderColor: theme.colors.primary,
        borderRadius: 14,
        height: 52,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    registerButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.colors.primary,
    },
    skipButton: {
        alignItems: 'center',
        paddingVertical: 8,
    },
    skipText: {
        fontSize: 13,
        color: theme.colors.text.tertiary,
    },
});

/**
 * VAMO Mobile — Tela de Cadastro real
 */

import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../src/theme/theme';
import { useAuth } from '../src/contexts/AuthContext';
import { haptics } from '../src/services/haptics';
import VamoLogo from '../src/components/common/VamoLogo';

export default function RegisterScreen() {
    const router = useRouter();
    const { register } = useAuth();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleRegister = async () => {
        setError(null);

        if (!name.trim() || !email.trim() || !password.trim()) {
            setError('Preencha todos os campos obrigatórios.');
            return;
        }
        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }
        if (password.length < 6) {
            setError('A senha deve ter no mínimo 6 caracteres.');
            return;
        }

        haptics.light();
        setLoading(true);

        try {
            await register({
                name: name.trim(),
                email: email.trim().toLowerCase(),
                password,
            });
            haptics.success();
            router.replace('/(tabs)/profile');
        } catch (err: any) {
            const msg = err?.message || 'Erro ao criar conta.';
            setError(msg);
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
                <LinearGradient
                    colors={['#1A3263', '#28C9BF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.header}
                >
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={22} color="#fff" />
                    </TouchableOpacity>
                    <VamoLogo size={160} />
                    <Text style={styles.tagline}>Crie sua conta e comece a explorar</Text>
                </LinearGradient>

                <View style={styles.card}>
                    <Text style={styles.title}>Criar conta</Text>

                    {error && (
                        <View style={styles.errorBox}>
                            <Ionicons name="alert-circle" size={16} color="#EF4444" />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    )}

                    {/* Nome */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Nome completo</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="person-outline" size={18} color={theme.colors.text.tertiary} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Seu nome"
                                placeholderTextColor={theme.colors.text.tertiary}
                                value={name}
                                onChangeText={setName}
                                editable={!loading}
                            />
                        </View>
                    </View>

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
                                value={email}
                                onChangeText={setEmail}
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
                                style={styles.input}
                                placeholder="Mínimo 6 caracteres"
                                placeholderTextColor={theme.colors.text.tertiary}
                                secureTextEntry={!showPassword}
                                value={password}
                                onChangeText={setPassword}
                                editable={!loading}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(v => !v)}>
                                <Ionicons
                                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                    size={18}
                                    color={theme.colors.text.tertiary}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Confirmar senha */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Confirmar senha</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="lock-closed-outline" size={18} color={theme.colors.text.tertiary} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Repita a senha"
                                placeholderTextColor={theme.colors.text.tertiary}
                                secureTextEntry={!showPassword}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                onSubmitEditing={handleRegister}
                                editable={!loading}
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleRegister}
                        disabled={loading}
                        activeOpacity={0.85}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <Text style={styles.buttonText}>Criar conta grátis</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.loginLink}
                        onPress={() => router.push('/login')}
                        disabled={loading}
                    >
                        <Text style={styles.loginLinkText}>Já tenho conta → Entrar</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.colors.background },
    scroll: { flexGrow: 1 },
    header: {
        paddingTop: Platform.OS === 'ios' ? 70 : 50,
        paddingBottom: 40,
        paddingHorizontal: 28,
        alignItems: 'center',
    },
    backBtn: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 40,
        left: 20,
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoImage: { width: 180, height: 72, marginBottom: 8 },
    tagline: { fontSize: 13, color: 'rgba(255,255,255,0.8)', textAlign: 'center' },
    card: {
        flex: 1,
        backgroundColor: theme.colors.background,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        marginTop: -20,
        padding: 28,
        paddingTop: 32,
    },
    title: { fontSize: 22, fontWeight: '800', color: theme.colors.text.primary, marginBottom: 20 },
    errorBox: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: '#FEF2F2', borderRadius: 10, padding: 12,
        marginBottom: 16, borderWidth: 1, borderColor: '#FECACA',
    },
    errorText: { flex: 1, fontSize: 13, color: '#EF4444' },
    field: { marginBottom: 16 },
    label: { fontSize: 13, fontWeight: '600', color: theme.colors.text.primary, marginBottom: 8 },
    inputWrapper: {
        flexDirection: 'row', alignItems: 'center',
        borderWidth: 1.5, borderColor: theme.colors.borderLight,
        borderRadius: 12, backgroundColor: theme.colors.surfaceLight,
        paddingHorizontal: 14, height: 50,
    },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, fontSize: 15, color: theme.colors.text.primary, height: '100%' },
    button: {
        backgroundColor: theme.colors.primary, borderRadius: 14, height: 52,
        alignItems: 'center', justifyContent: 'center', marginTop: 8,
        shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    },
    buttonDisabled: { opacity: 0.7 },
    buttonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
    loginLink: { alignItems: 'center', paddingVertical: 16 },
    loginLinkText: { fontSize: 14, color: theme.colors.primary, fontWeight: '600' },
});

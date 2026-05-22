/**
 * VAMO Mobile — Tela "Aguardando Revisão"
 * Exibida após o roteiro ser enviado para análise (status: PENDING_REVIEW).
 */

import React, { useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    Platform, StatusBar, Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../src/theme/theme';
import { haptics } from '../src/services/haptics';

const STEPS = [
    { icon: 'checkmark-circle' as const, label: 'Roteiro enviado', done: true, active: false },
    { icon: 'search' as const, label: 'Em análise pela equipe', done: false, active: true },
    { icon: 'rocket' as const, label: 'Publicado no marketplace', done: false, active: false },
];

export default function AwaitReviewScreen() {
    const router = useRouter();
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        haptics.success();
        // Animação de entrada
        Animated.sequence([
            Animated.spring(scaleAnim, {
                toValue: 1,
                useNativeDriver: true,
                tension: 50,
                friction: 7,
            }),
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return (
        <View style={s.root}>
            <StatusBar barStyle="light-content" />

            <LinearGradient
                colors={['#1A3263', '#1E4D8C', '#28C9BF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.gradient}
            >
                {/* Ícone animado */}
                <Animated.View style={[s.iconCircle, { transform: [{ scale: scaleAnim }] }]}>
                    <Ionicons name="checkmark" size={52} color={theme.colors.primary} />
                </Animated.View>

                <Animated.View style={[s.heroText, { opacity: fadeAnim }]}>
                    <Text style={s.title}>Roteiro enviado! 🎉</Text>
                    <Text style={s.subtitle}>
                        Nossa equipe vai analisar seu roteiro em até 48 horas.{'\n'}
                        Você receberá uma notificação assim que for aprovado.
                    </Text>
                </Animated.View>
            </LinearGradient>

            {/* Status tracker */}
            <Animated.View style={[s.tracker, { opacity: fadeAnim }]}>
                <Text style={s.trackerTitle}>Acompanhe o status</Text>
                {STEPS.map((step, i) => (
                    <View key={i} style={s.trackerRow}>
                        <View style={[
                            s.trackerIcon,
                            step.done && s.trackerIconDone,
                            step.active && s.trackerIconActive,
                        ]}>
                            <Ionicons
                                name={step.icon}
                                size={16}
                                color={step.done ? '#fff' : step.active ? theme.colors.primary : theme.colors.text.tertiary}
                            />
                        </View>
                        {i < STEPS.length - 1 && (
                            <View style={[s.trackerLine, step.done && s.trackerLineDone]} />
                        )}
                        <Text style={[
                            s.trackerLabel,
                            step.active && s.trackerLabelActive,
                            !step.done && !step.active && s.trackerLabelInactive,
                        ]}>
                            {step.label}
                        </Text>
                    </View>
                ))}
            </Animated.View>

            {/* Info box */}
            <Animated.View style={[s.infoBox, { opacity: fadeAnim }]}>
                <Ionicons name="information-circle-outline" size={18} color={theme.colors.info} />
                <Text style={s.infoText}>
                    Após aprovado, seu roteiro aparece automaticamente no marketplace para compra.
                </Text>
            </Animated.View>

            {/* CTAs */}
            <Animated.View style={[s.ctas, { opacity: fadeAnim }]}>
                <TouchableOpacity
                    style={s.primaryCta}
                    onPress={() => { haptics.light(); router.replace('/created-itineraries'); }}
                    activeOpacity={0.85}
                >
                    <Text style={s.primaryCtaText}>Ver meus roteiros</Text>
                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={s.secondaryCta}
                    onPress={() => { haptics.light(); router.replace('/(tabs)/profile'); }}
                >
                    <Text style={s.secondaryCtaText}>Voltar ao perfil</Text>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.colors.background },
    gradient: {
        paddingTop: Platform.OS === 'ios' ? 80 : 60,
        paddingBottom: 48,
        paddingHorizontal: 28,
        alignItems: 'center',
    },
    iconCircle: {
        width: 100, height: 100, borderRadius: 50,
        backgroundColor: '#fff',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 24,
        shadowColor: '#28C9BF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    heroText: { alignItems: 'center' },
    title: { fontSize: 26, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 12 },
    subtitle: {
        fontSize: 15, color: 'rgba(255,255,255,0.85)',
        textAlign: 'center', lineHeight: 22,
    },

    // Tracker
    tracker: {
        marginHorizontal: 24, marginTop: 28,
        backgroundColor: theme.colors.surfaceLight,
        borderRadius: 16, padding: 20, gap: 0,
    },
    trackerTitle: {
        fontSize: 14, fontWeight: '700', color: theme.colors.text.primary,
        marginBottom: 16,
    },
    trackerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 0 },
    trackerIcon: {
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: theme.colors.border,
        alignItems: 'center', justifyContent: 'center',
    },
    trackerIconDone: { backgroundColor: theme.colors.success },
    trackerIconActive: {
        backgroundColor: theme.colors.primary + '20',
        borderWidth: 2, borderColor: theme.colors.primary,
    },
    trackerLine: {
        position: 'absolute', left: 15, top: 32,
        width: 2, height: 20, backgroundColor: theme.colors.borderLight,
    },
    trackerLineDone: { backgroundColor: theme.colors.success },
    trackerLabel: { fontSize: 14, color: theme.colors.text.primary, fontWeight: '500', flex: 1 },
    trackerLabelActive: { color: theme.colors.primary, fontWeight: '700' },
    trackerLabelInactive: { color: theme.colors.text.tertiary },

    // Info
    infoBox: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 10,
        marginHorizontal: 24, marginTop: 16,
        backgroundColor: theme.colors.info + '12',
        borderRadius: 12, padding: 14,
    },
    infoText: { flex: 1, fontSize: 13, color: theme.colors.info, lineHeight: 18 },

    // CTAs
    ctas: {
        paddingHorizontal: 24,
        paddingBottom: Platform.OS === 'ios' ? 48 : 28,
        marginTop: 24, gap: 12,
    },
    primaryCta: {
        backgroundColor: theme.colors.primary, borderRadius: 14, height: 52,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    },
    primaryCtaText: { fontSize: 16, fontWeight: '700', color: '#fff' },
    secondaryCta: { alignItems: 'center', paddingVertical: 12 },
    secondaryCtaText: { fontSize: 14, color: theme.colors.text.tertiary, fontWeight: '500' },
});

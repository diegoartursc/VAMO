/**
 * VAMO Mobile — Onboarding "Torne-se um Roteirista"
 * 4 steps premium com design refinado, animações e ícones consistentes.
 */

import React, { useState, useCallback, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    Platform, StatusBar, ActivityIndicator,
    Animated, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { safeBack } from '../src/utils/navigation';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../src/theme/theme';
import { haptics } from '../src/services/haptics';
import { useAuth } from '../src/contexts/AuthContext';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

// ─── Slide data ────────────────────────────────────────────────
const SLIDES = [
    {
        key: 'earn',
        bg: 'gradient' as const,
        icon: 'earth' as IoniconName,
        title: 'Ganhe dinheiro\ncom suas viagens',
        subtitle: 'Transforme experiências reais em roteiros digitais que outros viajantes podem comprar.',
        checks: [
            'Venda roteiros de viagens que você já fez',
            'Compartilhe dicas, custos e atalhos reais',
            'Ajude viajantes a planejar com mais confiança',
        ],
        cta: 'Começar',
    },
    {
        key: 'why',
        bg: 'white' as const,
        icon: 'star' as IoniconName,
        title: 'Por que ser Roteirista VAMO?',
        subtitle: 'Use sua experiência para gerar renda, reputação e impacto.',
        benefits: [
            { icon: 'wallet-outline' as IoniconName, title: 'Renda com conteúdo', text: 'Seu roteiro pode continuar vendendo mesmo depois da viagem.' },
            { icon: 'globe-outline' as IoniconName, title: 'Alcance viajantes', text: 'Seu conhecimento ajuda pessoas a escolherem melhor.' },
            { icon: 'star-outline' as IoniconName, title: 'Credibilidade', text: 'Roteiros bem avaliados fortalecem sua reputação.' },
            { icon: 'shield-checkmark-outline' as IoniconName, title: 'Apoio da VAMO', text: 'Nossa equipe analisa os roteiros antes da publicação.' },
        ],
        cta: 'Continuar',
    },
    {
        key: 'how',
        bg: 'white' as const,
        icon: 'map' as IoniconName,
        title: 'Como funciona?',
        subtitle: 'Você cria, a VAMO revisa e os viajantes compram.',
        steps: [
            { icon: 'create-outline' as IoniconName, num: 1, title: 'Criar roteiro', text: 'Preencha destino, módulos, fotos, custos e dicas reais.' },
            { icon: 'search-outline' as IoniconName, num: 2, title: 'Enviar para análise', text: 'A VAMO revisa a qualidade e a autenticidade do conteúdo.' },
            { icon: 'storefront-outline' as IoniconName, num: 3, title: 'Publicar e vender', text: 'Após aprovado, seu roteiro aparece para viajantes comprarem.' },
        ],
        cta: 'Continuar',
    },
    {
        key: 'ready',
        bg: 'gradient' as const,
        icon: 'rocket' as IoniconName,
        title: 'Pronto para criar\nseu primeiro roteiro?',
        subtitle: 'Capriche nas informações, fotos e custos. Roteiros completos têm mais chance de aprovação e destaque.',
        tip: 'Roteiros com score acima de 80% tendem a ter mais destaque no app.',
        cta: 'Criar meu primeiro roteiro',
        ctaSecondary: 'Agora não',
    },
];

// ─── Progress Dots ─────────────────────────────────────────────
function ProgressDots({ current, total, bg }: { current: number; total: number; bg: 'gradient' | 'white' }) {
    const activeColor = bg === 'gradient' ? '#fff' : theme.colors.primary;
    const inactiveColor = bg === 'gradient' ? 'rgba(255,255,255,0.28)' : theme.colors.border;
    const labelColor = bg === 'gradient' ? 'rgba(255,255,255,0.55)' : theme.colors.text.tertiary;

    return (
        <View style={pd.row}>
            {Array.from({ length: total }).map((_, i) => (
                <View
                    key={i}
                    style={[
                        pd.dot,
                        { backgroundColor: i === current ? activeColor : inactiveColor },
                        i === current && pd.dotActive,
                    ]}
                />
            ))}
            <Text style={[pd.label, { color: labelColor }]}>{current + 1} de {total}</Text>
        </View>
    );
}

const pd = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', marginBottom: 14 },
    dot: { height: 6, borderRadius: 3, width: 6 },
    dotActive: { width: 22 },
    label: { marginLeft: 2, fontSize: 12, fontWeight: '500' },
});

// ─── Benefit Card ──────────────────────────────────────────────
function BenefitCard({ icon, title, text }: { icon: IoniconName; title: string; text: string }) {
    return (
        <View style={bc.card}>
            <View style={bc.iconWrap}>
                <Ionicons name={icon} size={22} color={theme.colors.primary} />
            </View>
            <View style={bc.body}>
                <Text style={bc.title}>{title}</Text>
                <Text style={bc.text}>{text}</Text>
            </View>
        </View>
    );
}

const bc = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: theme.colors.surface,
        borderRadius: 14,
        padding: 14,
        gap: 12,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        ...theme.shadows.xs,
    },
    iconWrap: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(40,201,191,0.10)',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    body: { flex: 1 },
    title: { fontSize: 14, fontWeight: '700', color: theme.colors.text.primary, marginBottom: 3 },
    text: { fontSize: 13, color: theme.colors.text.secondary, lineHeight: 18 },
});

// ─── Step Row ──────────────────────────────────────────────────
function StepRow({ icon, num, title, text, isLast }: {
    icon: IoniconName; num: number; title: string; text: string; isLast: boolean;
}) {
    return (
        <View style={st.row}>
            {/* Timeline column */}
            <View style={st.timeline}>
                <View style={st.circle}>
                    <Text style={st.num}>{num}</Text>
                </View>
                {!isLast && <View style={st.line} />}
            </View>
            {/* Content */}
            <View style={[st.content, !isLast && { paddingBottom: 20 }]}>
                <View style={st.titleRow}>
                    <Ionicons name={icon} size={16} color={theme.colors.primary} style={{ marginRight: 6 }} />
                    <Text style={st.title}>{title}</Text>
                </View>
                <Text style={st.text}>{text}</Text>
            </View>
        </View>
    );
}

const st = StyleSheet.create({
    row: { flexDirection: 'row', gap: 14 },
    timeline: { alignItems: 'center', width: 32 },
    circle: {
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: theme.colors.primary,
        alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
    },
    num: { fontSize: 14, fontWeight: '800', color: '#fff' },
    line: { flex: 1, width: 2, backgroundColor: 'rgba(40,201,191,0.20)', marginTop: 4, minHeight: 20 },
    content: { flex: 1, paddingTop: 6 },
    titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    title: { fontSize: 15, fontWeight: '700', color: theme.colors.text.primary },
    text: { fontSize: 13, color: theme.colors.text.secondary, lineHeight: 19 },
});

// ─── Tip Card (último slide) ───────────────────────────────────
function TipCard({ text }: { text: string }) {
    return (
        <View style={tip.card}>
            <View style={tip.badge}>
                <Ionicons name="sparkles" size={13} color={theme.colors.primary} />
                <Text style={tip.badgeText}>Dica PRO</Text>
            </View>
            <Text style={tip.text}>{text}</Text>
        </View>
    );
}

const tip = StyleSheet.create({
    card: {
        backgroundColor: 'rgba(255,255,255,0.13)',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.20)',
        marginTop: 20,
        width: '100%',
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: '#fff',
        alignSelf: 'flex-start',
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 4,
        marginBottom: 10,
    },
    badgeText: { fontSize: 11, fontWeight: '800', color: theme.colors.primary },
    text: { fontSize: 14, color: 'rgba(255,255,255,0.88)', lineHeight: 20 },
});

// ─── Slide: Gradient ───────────────────────────────────────────
function GradientSlide({ slide, onNext, onSkip, isLast, current, total, insets }: {
    slide: typeof SLIDES[number];
    onNext: () => void;
    onSkip: () => void;
    isLast: boolean;
    current: number;
    total: number;
    insets: { top: number; bottom: number };
}) {
    const hasTip = 'tip' in slide;
    const hasChecks = 'checks' in slide;
    const hasSecondary = 'ctaSecondary' in slide;

    return (
        <LinearGradient
            colors={['#1A3263', '#1E4D8C', '#28C9BF']}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={gs.fill}
        >
            <ScrollView
                contentContainerStyle={[gs.content, { paddingTop: insets.top + 72, paddingBottom: 8 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Icon */}
                <View style={gs.iconCircle}>
                    <Ionicons name={slide.icon} size={42} color="#fff" />
                </View>

                {/* Title */}
                <Text style={gs.title}>{slide.title}</Text>

                {/* Subtitle */}
                {'subtitle' in slide && (
                    <Text style={gs.subtitle}>{(slide as any).subtitle}</Text>
                )}

                {/* Checks */}
                {hasChecks && (
                    <View style={gs.checks}>
                        {(slide as any).checks.map((c: string, i: number) => (
                            <View key={i} style={gs.checkRow}>
                                <View style={gs.checkCircle}>
                                    <Ionicons name="checkmark" size={13} color="#fff" />
                                </View>
                                <Text style={gs.checkText}>{c}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Tip card */}
                {hasTip && <TipCard text={(slide as any).tip} />}
            </ScrollView>

            {/* Footer */}
            <View style={[gs.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
                <ProgressDots current={current} total={total} bg="gradient" />
                <TouchableOpacity style={gs.cta} onPress={onNext} activeOpacity={0.85}>
                    <Text style={gs.ctaText}>{slide.cta}</Text>
                    {isLast && <Ionicons name="arrow-forward" size={17} color={theme.colors.primary} style={{ marginLeft: 6 }} />}
                </TouchableOpacity>
                {hasSecondary && (
                    <TouchableOpacity onPress={onSkip} style={gs.secondaryBtn} activeOpacity={0.7}>
                        <Text style={gs.secondaryText}>{(slide as any).ctaSecondary}</Text>
                    </TouchableOpacity>
                )}
            </View>
        </LinearGradient>
    );
}

const gs = StyleSheet.create({
    fill: { flex: 1 },
    content: { alignItems: 'center', paddingHorizontal: 28 },
    iconCircle: {
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.20)',
    },
    title: {
        fontSize: 32, fontWeight: '800', color: '#fff',
        textAlign: 'center', lineHeight: 38, marginBottom: 12,
    },
    subtitle: {
        fontSize: 16, color: 'rgba(255,255,255,0.80)',
        textAlign: 'center', lineHeight: 24, marginBottom: 28,
    },
    checks: { width: '100%', gap: 12 },
    checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    checkCircle: {
        width: 22, height: 22, borderRadius: 11,
        backgroundColor: 'rgba(255,255,255,0.18)',
        alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, marginTop: 1,
    },
    checkText: { flex: 1, fontSize: 15, color: 'rgba(255,255,255,0.90)', lineHeight: 22 },
    footer: { paddingHorizontal: 24, paddingTop: 16 },
    cta: {
        backgroundColor: '#fff',
        borderRadius: 16, height: 54,
        alignItems: 'center', justifyContent: 'center',
        flexDirection: 'row',
        ...theme.shadows.button,
    },
    ctaText: { fontSize: 16, fontWeight: '800', color: theme.colors.primary },
    secondaryBtn: { alignItems: 'center', paddingVertical: 14 },
    secondaryText: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.65)' },
});

// ─── Slide: White ──────────────────────────────────────────────
function WhiteSlide({ slide, onNext, onSkip, isLast, current, total, insets }: {
    slide: typeof SLIDES[number];
    onNext: () => void;
    onSkip: () => void;
    isLast: boolean;
    current: number;
    total: number;
    insets: { top: number; bottom: number };
}) {
    const hasBenefits = 'benefits' in slide;
    const hasSteps = 'steps' in slide;

    return (
        <View style={ws.fill}>
            {/* Accent strip */}
            <LinearGradient
                colors={['#1A3263', '#1E4D8C']}
                style={[ws.strip, { paddingTop: insets.top + 56, paddingBottom: 24 }]}
            >
                <View style={ws.iconRow}>
                    <View style={ws.iconWrap}>
                        <Ionicons name={slide.icon} size={20} color="#fff" />
                    </View>
                </View>
                <Text style={ws.title}>{slide.title}</Text>
                {'subtitle' in slide && (
                    <Text style={ws.subtitle}>{(slide as any).subtitle}</Text>
                )}
            </LinearGradient>

            {/* Scrollable content */}
            <ScrollView
                style={ws.scroll}
                contentContainerStyle={ws.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {hasBenefits && (
                    <View style={ws.list}>
                        {(slide as any).benefits.map((b: any, i: number) => (
                            <BenefitCard key={i} {...b} />
                        ))}
                    </View>
                )}

                {hasSteps && (
                    <View style={ws.list}>
                        {(slide as any).steps.map((s: any, i: number, arr: any[]) => (
                            <StepRow key={i} {...s} isLast={i === arr.length - 1} />
                        ))}
                    </View>
                )}
            </ScrollView>

            {/* Footer */}
            <View style={[ws.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                <ProgressDots current={current} total={total} bg="white" />
                <TouchableOpacity
                    style={ws.cta}
                    onPress={onNext}
                    activeOpacity={0.85}
                >
                    <LinearGradient
                        colors={[theme.colors.primary, theme.colors.primaryDark]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={ws.ctaGradient}
                    >
                        <Text style={ws.ctaText}>{slide.cta}</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const ws = StyleSheet.create({
    fill: { flex: 1, backgroundColor: theme.colors.surfaceLight },
    strip: {
        paddingHorizontal: 24,
    },
    iconRow: { marginBottom: 12 },
    iconWrap: {
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.20)',
    },
    title: { fontSize: 26, fontWeight: '800', color: '#fff', lineHeight: 32, marginBottom: 6 },
    subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 20 },
    scroll: { flex: 1 },
    scrollContent: { padding: 20, paddingTop: 16, paddingBottom: 8 },
    list: { gap: 10 },
    footer: {
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: theme.colors.borderLight,
    },
    cta: {
        borderRadius: 16,
        overflow: 'hidden',
        height: 52,
        ...theme.shadows.button,
    },
    ctaGradient: { flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
    ctaText: { fontSize: 16, fontWeight: '800', color: '#fff' },
});

// ─── Main screen ───────────────────────────────────────────────
export default function BecomeCreatorScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { isAuthenticated, isLoading } = useAuth();
    const [currentIndex, setCurrentIndex] = useState(0);

    const fadeAnim = useRef(new Animated.Value(1)).current;
    const slideYAnim = useRef(new Animated.Value(0)).current;

    const animateTransition = useCallback((toIndex: number) => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 0, duration: 140, useNativeDriver: true }),
            Animated.timing(slideYAnim, { toValue: -12, duration: 140, useNativeDriver: true }),
        ]).start(() => {
            setCurrentIndex(toIndex);
            slideYAnim.setValue(16);
            Animated.parallel([
                Animated.timing(fadeAnim, { toValue: 1, duration: 260, useNativeDriver: true }),
                Animated.timing(slideYAnim, { toValue: 0, duration: 260, useNativeDriver: true }),
            ]).start();
        });
    }, [fadeAnim, slideYAnim]);

    const goToNext = useCallback(() => {
        haptics.light();
        if (currentIndex < SLIDES.length - 1) {
            animateTransition(currentIndex + 1);
        } else {
            router.replace('/new-itinerary');
        }
    }, [currentIndex, animateTransition, router]);

    const handleSkip = useCallback(() => {
        haptics.light();
        safeBack(router, '/(tabs)/profile');
    }, [router]);

    const handleClose = useCallback(() => {
        haptics.light();
        safeBack(router, '/(tabs)/profile');
    }, [router]);

    // ── Loading ─────────────────────────────────────────────────
    if (isLoading) {
        return (
            <View style={s.loadRoot}>
                <ActivityIndicator size="large" color="#fff" />
            </View>
        );
    }

    // ── Não autenticado ─────────────────────────────────────────
    if (!isAuthenticated) {
        return (
            <LinearGradient colors={['#1A3263', '#28C9BF']} style={s.loadRoot}>
                <StatusBar barStyle="light-content" />
                <TouchableOpacity style={[s.closeBtn, { top: insets.top + 12 }]} onPress={handleClose}>
                    <Ionicons name="close" size={20} color="#fff" />
                </TouchableOpacity>
                <View style={s.authIconWrap}>
                    <Ionicons name="lock-closed-outline" size={36} color="#fff" />
                </View>
                <Text style={s.authTitle}>Entre para criar roteiros</Text>
                <Text style={s.authText}>
                    Sua conta protege seus rascunhos, envios para análise, vendas e receita de criador.
                </Text>
                <TouchableOpacity
                    style={s.authBtn}
                    onPress={() => router.replace({ pathname: '/login' as any, params: { next: '/become-creator' } })}
                    activeOpacity={0.85}
                >
                    <Text style={s.authBtnText}>Entrar na conta</Text>
                </TouchableOpacity>
            </LinearGradient>
        );
    }

    const currentSlide = SLIDES[currentIndex];
    const isLast = currentIndex === SLIDES.length - 1;
    const isGradient = currentSlide.bg === 'gradient';

    return (
        <View style={s.root}>
            <StatusBar barStyle="light-content" />

            {/* Slide com animação */}
            <Animated.View style={[s.slideWrap, { opacity: fadeAnim, transform: [{ translateY: slideYAnim }] }]}>
                {isGradient ? (
                    <GradientSlide
                        slide={currentSlide}
                        onNext={goToNext}
                        onSkip={handleSkip}
                        isLast={isLast}
                        current={currentIndex}
                        total={SLIDES.length}
                        insets={insets}
                    />
                ) : (
                    <WhiteSlide
                        slide={currentSlide}
                        onNext={goToNext}
                        onSkip={handleSkip}
                        isLast={isLast}
                        current={currentIndex}
                        total={SLIDES.length}
                        insets={insets}
                    />
                )}
            </Animated.View>

            {/* Close button — sempre visível */}
            <TouchableOpacity
                style={[s.closeBtn, { top: insets.top + 12 }]}
                onPress={handleClose}
                activeOpacity={0.75}
            >
                <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>

            {/* Pular — só aparece se não for último slide e não for slide final com secondary */}
            {!isLast && (
                <TouchableOpacity
                    style={[s.skipBtn, { top: insets.top + 12 }]}
                    onPress={handleSkip}
                    activeOpacity={0.7}
                >
                    <Text style={[s.skipText, !isGradient && s.skipTextDark]}>Pular</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#1A3263' },
    loadRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
    slideWrap: { flex: 1 },
    closeBtn: {
        position: 'absolute',
        left: 18,
        zIndex: 100,
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: 'rgba(0,0,0,0.28)',
        alignItems: 'center', justifyContent: 'center',
    },
    skipBtn: {
        position: 'absolute',
        right: 18,
        zIndex: 100,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    skipText: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.75)' },
    skipTextDark: { color: theme.colors.text.tertiary },
    authIconWrap: {
        width: 72, height: 72, borderRadius: 36,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 20,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    },
    authTitle: { fontSize: 24, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 10 },
    authText: { fontSize: 15, lineHeight: 22, color: 'rgba(255,255,255,0.80)', textAlign: 'center', marginBottom: 28 },
    authBtn: {
        backgroundColor: '#fff',
        borderRadius: 16, paddingHorizontal: 28, paddingVertical: 15,
        ...theme.shadows.button,
    },
    authBtnText: { fontSize: 15, fontWeight: '800', color: theme.colors.primary },
});

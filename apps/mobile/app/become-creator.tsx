/**
 * VAMO Mobile — Tela de Onboarding "Torne-se um Roteirista"
 * 4 slides swipáveis (Airbnb-style), sem obrigação de preencher nada.
 * Ao concluir, navega para /new-itinerary.
 */

import React, { useRef, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, FlatList,
    Dimensions, Platform, StatusBar, Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../src/theme/theme';
import { haptics } from '../src/services/haptics';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ─── Slides ────────────────────────────────────────────────────
const SLIDES = [
    {
        key: 'hero',
        emoji: '🌍',
        title: 'Ganhe viajando',
        subtitle: 'Transforme suas experiências reais em roteiros vendáveis para viajantes do mundo todo.',
        bg: 'gradient',
        cta: 'Começar',
    },
    {
        key: 'why',
        emoji: '✈️',
        title: 'Por que ser Roteirista VAMO?',
        bullets: [
            { icon: '💰', text: 'Renda passiva: seu roteiro vende enquanto você viaja' },
            { icon: '🌐', text: 'Alcance global: viajantes de todo o Brasil' },
            { icon: '🛡️', text: 'Suporte: nossa equipe analisa e aprova cada roteiro' },
            { icon: '⭐', text: 'Reputação: avaliações constroem sua marca pessoal' },
        ],
        bg: 'white',
        cta: 'Continuar',
    },
    {
        key: 'how',
        emoji: '🗺️',
        title: 'Como funciona?',
        steps: [
            { num: '1', text: 'Crie seu roteiro no app, passo a passo' },
            { num: '2', text: 'Nossa equipe analisa em até 48h' },
            { num: '3', text: 'Aprovado, seu roteiro vai ao marketplace' },
            { num: '4', text: 'Cada compra cai direto na sua conta' },
        ],
        bg: 'white',
        cta: 'Continuar',
    },
    {
        key: 'ready',
        emoji: '🚀',
        title: 'Tudo pronto!',
        subtitle: 'Você está a um passo de publicar seu primeiro roteiro. É rápido, gratuito e sem burocracia.',
        bg: 'gradient',
        cta: 'Criar meu primeiro roteiro',
    },
];

// ─── Dots indicator ────────────────────────────────────────────
function Dots({ current, total }: { current: number; total: number }) {
    return (
        <View style={dots.row}>
            {Array.from({ length: total }).map((_, i) => (
                <View
                    key={i}
                    style={[dots.dot, i === current && dots.dotActive]}
                />
            ))}
        </View>
    );
}

const dots = StyleSheet.create({
    row: { flexDirection: 'row', gap: 6, justifyContent: 'center', marginBottom: 12 },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.35)' },
    dotActive: { width: 18, backgroundColor: '#fff' },
});

// ─── Slide content ─────────────────────────────────────────────
function SlideContent({ slide, isLast, onNext, onSkip }: {
    slide: typeof SLIDES[number];
    isLast: boolean;
    onNext: () => void;
    onSkip: () => void;
}) {
    const isGradient = slide.bg === 'gradient';

    const inner = (
        <View style={[slide_s.inner, !isGradient && slide_s.innerWhite]}>
            {/* Skip */}
            {!isLast && (
                <TouchableOpacity style={slide_s.skipBtn} onPress={onSkip}>
                    <Text style={[slide_s.skipText, !isGradient && slide_s.skipTextDark]}>
                        Pular
                    </Text>
                </TouchableOpacity>
            )}

            {/* Emoji */}
            <Text style={slide_s.emoji}>{slide.emoji}</Text>

            {/* Title */}
            <Text style={[slide_s.title, !isGradient && slide_s.titleDark]}>
                {slide.title}
            </Text>

            {/* Subtitle */}
            {'subtitle' in slide && (
                <Text style={[slide_s.subtitle, !isGradient && slide_s.subtitleDark]}>
                    {slide.subtitle}
                </Text>
            )}

            {/* Bullets */}
            {'bullets' in slide && Array.isArray((slide as any).bullets) && (
                <View style={slide_s.list}>
                    {((slide as any).bullets as Array<{ icon: string; text: string }>).map((b, i) => (
                        <View key={i} style={slide_s.listRow}>
                            <Text style={slide_s.listIcon}>{b.icon}</Text>
                            <Text style={slide_s.listText}>{b.text}</Text>
                        </View>
                    ))}
                </View>
            )}

            {/* Steps */}
            {'steps' in slide && Array.isArray((slide as any).steps) && (
                <View style={slide_s.list}>
                    {((slide as any).steps as Array<{ num: string; text: string }>).map((st, i) => (
                        <View key={i} style={slide_s.listRow}>
                            <View style={slide_s.stepNum}>
                                <Text style={slide_s.stepNumText}>{st.num}</Text>
                            </View>
                            <Text style={slide_s.listText}>{st.text}</Text>
                        </View>
                    ))}
                </View>
            )}

            {/* CTA */}
            <TouchableOpacity
                style={[slide_s.cta, isGradient && slide_s.ctaWhite]}
                onPress={onNext}
                activeOpacity={0.85}
            >
                <Text style={[slide_s.ctaText, isGradient && slide_s.ctaTextDark]}>
                    {slide.cta}
                </Text>
                {isLast && (
                    <Ionicons
                        name="arrow-forward"
                        size={18}
                        color={isGradient ? theme.colors.primary : '#fff'}
                        style={{ marginLeft: 6 }}
                    />
                )}
            </TouchableOpacity>
        </View>
    );

    if (isGradient) {
        return (
            <LinearGradient
                colors={['#1A3263', '#28C9BF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={slide_s.container}
            >
                {inner}
            </LinearGradient>
        );
    }

    return <View style={[slide_s.container, { backgroundColor: theme.colors.background }]}>{inner}</View>;
}

const slide_s = StyleSheet.create({
    container: { width: SCREEN_W, flex: 1 },
    inner: {
        flex: 1,
        paddingTop: Platform.OS === 'ios' ? 80 : 60,
        paddingBottom: 48,
        paddingHorizontal: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    innerWhite: { alignItems: 'flex-start', justifyContent: 'center' },
    skipBtn: { position: 'absolute', top: Platform.OS === 'ios' ? 60 : 40, right: 24, padding: 8 },
    skipText: { fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
    skipTextDark: { color: theme.colors.text.tertiary },
    emoji: { fontSize: 72, marginBottom: 24 },
    title: { fontSize: 28, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 16, lineHeight: 34 },
    titleDark: { color: theme.colors.text.primary, textAlign: 'left' },
    subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 24, marginBottom: 40 },
    subtitleDark: { color: theme.colors.text.secondary, textAlign: 'left' },
    list: { width: '100%', gap: 16, marginBottom: 40, marginTop: 8 },
    listRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
    listIcon: { fontSize: 22, width: 28, textAlign: 'center' },
    listText: { flex: 1, fontSize: 15, color: theme.colors.text.primary, lineHeight: 22 },
    stepNum: {
        width: 28, height: 28, borderRadius: 14,
        backgroundColor: theme.colors.primary,
        alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
    },
    stepNumText: { fontSize: 13, fontWeight: '800', color: '#fff' },
    cta: {
        backgroundColor: theme.colors.primary,
        borderRadius: 14, height: 54,
        paddingHorizontal: 32,
        alignItems: 'center', justifyContent: 'center',
        flexDirection: 'row',
        alignSelf: 'stretch',
        marginTop: 8,
        ...theme.shadows.button,
    },
    ctaWhite: { backgroundColor: '#fff' },
    ctaText: { fontSize: 16, fontWeight: '700', color: '#fff' },
    ctaTextDark: { color: theme.colors.primary },
});

// ─── Main screen ───────────────────────────────────────────────
export default function BecomeCreatorScreen() {
    const router = useRouter();
    const flatRef = useRef<FlatList>(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    const goToNext = useCallback(() => {
        haptics.light();
        if (currentIndex < SLIDES.length - 1) {
            flatRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
        } else {
            // Último slide → ir para criação
            router.replace('/new-itinerary');
        }
    }, [currentIndex, router]);

    const handleSkip = useCallback(() => {
        haptics.light();
        router.replace('/new-itinerary');
    }, [router]);

    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index ?? 0);
        }
    }).current;

    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" />

            {/* Close button */}
            <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => { haptics.light(); router.back(); }}
            >
                <Ionicons name="close" size={22} color="#fff" />
            </TouchableOpacity>

            {/* Slides */}
            <FlatList
                ref={flatRef}
                data={SLIDES}
                keyExtractor={item => item.key}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                bounces={false}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
                renderItem={({ item, index }) => (
                    <SlideContent
                        slide={item}
                        isLast={index === SLIDES.length - 1}
                        onNext={goToNext}
                        onSkip={handleSkip}
                    />
                )}
                style={{ flex: 1 }}
            />

            {/* Dots */}
            <View style={styles.footer}>
                <Dots current={currentIndex} total={SLIDES.length} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#1A3263' },
    closeBtn: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 56 : 36,
        left: 20,
        zIndex: 99,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0,0,0,0.25)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    footer: {
        paddingBottom: Platform.OS === 'ios' ? 48 : 28,
        paddingTop: 16,
        backgroundColor: '#1A3263',
        alignItems: 'center',
    },
});

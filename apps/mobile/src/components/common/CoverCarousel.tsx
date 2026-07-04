import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import {
    View,
    Image,
    Animated,
    Easing,
    StyleSheet,
    Text,
    useWindowDimensions,
    Platform,
    AccessibilityInfo,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { prefetchImages } from '../../utils/imageCache';

interface FocalPoint {
    x: number;
    y: number;
}

interface CoverCarouselProps {
    images: string[];
    /** Altura fixa em px. Use APENAS em hero/contextos onde a altura é
     *  conhecida. Para cards/listas, prefira aspectRatio — evita "faixinhas"
     *  e distorções em telas com largura variável. */
    height?: number;
    /** Proporção largura/altura (ex.: 4/3, 3/2, 16/9). Tem precedência
     *  sobre height. Recomendado para cards e listas. */
    aspectRatio?: number;
    borderRadius?: number;
    width?: number;
    /** Distância dos dots ao fundo. Útil pra empurrá-los acima de badges sobrepostos. */
    dotsBottom?: number;
    /** Enquadramento da capa: {x, y} ∈ [0,1]. Default centro (0.5/0.5).
     *  Aplicado via objectPosition na web. No native, RN Image ainda não
     *  expõe focal-point — fica como TODO (provavelmente via expo-image
     *  contentPosition quando migrarmos). */
    focalPoint?: FocalPoint;
    /** Modo de redimensionamento. Default cover. */
    resizeMode?: 'cover' | 'contain';
    /** Liga o pan/zoom suave (Ken Burns) durante a exibição de cada slide.
     *  Default true. Desligue em hero/fullscreen onde estabilidade > movimento. */
    panEnabled?: boolean;
    /**
     * Estratégia de enquadramento. Default 'cover'.
     *
     *  - 'cover'                  → imagem preenche o container, pode cortar.
     *  - 'contain'                → imagem inteira, pode mostrar fundo.
     *  - 'containWithBlurredBg'   → imagem inteira (contain) em cima, mesma
     *                                foto cover+blur por baixo preenchendo
     *                                as sobras. Usado pelos cards de vitrine.
     */
    coverMode?: 'cover' | 'contain' | 'containWithBlurredBg';
    /** Mostra o badge "1/3" de contagem de fotos. Default true (mantém
     *  compatibilidade). Cards que já têm outro badge no canto inferior
     *  direito (ex.: duração) devem passar false para evitar sobreposição. */
    showCounter?: boolean;
}

// ── Timing ──
// Cada slide fica 4s no ar (era 3s — agora dá mais tempo pra o Ken Burns
// e pro crossfade respirarem). Crossfade dura 700ms; Ken Burns ocupa
// praticamente toda a janela visível (3.5s).
const AUTO_PLAY_INTERVAL_MS = 4000;
const CROSSFADE_DURATION_MS = 700;
const KEN_BURNS_DURATION_MS = 3500;

// ── Ken Burns ──
// Modo 'cover': scale 1.08 + translate ±3% (legado/hero).
// Modo 'containWithBlurredBg' foreground: scale 1.0→1.04, SEM translate
//   (preserva o enquadramento da contain).
// Modo 'containWithBlurredBg' background: scale 1.08 + translate ±3%
//   (o fundo blurred aguenta movimento mais expressivo sem incomodar).
const PAN_SCALE = 1.08;
const PAN_AMPLITUDE_FRACTION = 0.03;
const FG_ZOOM_MIN = 1.0;
const FG_ZOOM_MAX = 1.04;

// ── Fundo blurred ──
const BG_BLUR_RADIUS = 18;
const BG_DARKEN_OPACITY = 0.18;

// ─────────────────────────────────────────────
// KenBurnsImage — um slide (UMA imagem) com seu próprio Ken Burns
// ─────────────────────────────────────────────

interface KenBurnsImageProps {
    uri: string;
    height: number;
    webImagePositionStyle: Record<string, any>;
    resizeMode: 'cover' | 'contain';
    panActive: boolean;
    panAmplitude: number;
    /** ltr = vai esquerda→direita / zoom-in; rtl = inverso / zoom-out. */
    direction: 'ltr' | 'rtl';
    /** Slide visível agora? Quando vira true, reseta e dispara o Ken Burns. */
    isActive: boolean;
    /** Loop ida-e-volta (usado quando há só 1 imagem — não há próxima pra disparar reset). */
    loop: boolean;
    onError: (url: string) => void;
    coverMode?: 'cover' | 'contain' | 'containWithBlurredBg';
}

const KenBurnsImage = memo(({
    uri,
    height,
    webImagePositionStyle,
    resizeMode,
    panActive,
    panAmplitude,
    direction,
    isActive,
    loop,
    onError,
    coverMode = 'cover',
}: KenBurnsImageProps) => {
    // Progress normalizado em [-1, 1]. Direção 'ltr' começa em -1 e vai +1.
    const progress = useRef(new Animated.Value(direction === 'ltr' ? -1 : 1)).current;

    useEffect(() => {
        if (!panActive || !isActive) return;
        const from = direction === 'ltr' ? -1 : 1;
        const to = -from;
        progress.setValue(from);
        const forward = Animated.timing(progress, {
            toValue: to,
            duration: KEN_BURNS_DURATION_MS,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
        });
        const runner: Animated.CompositeAnimation = loop
            ? Animated.loop(
                  Animated.sequence([
                      forward,
                      Animated.timing(progress, {
                          toValue: from,
                          duration: KEN_BURNS_DURATION_MS,
                          easing: Easing.inOut(Easing.ease),
                          useNativeDriver: true,
                      }),
                  ]),
              )
            : forward;
        runner.start();
        return () => runner.stop();
    }, [panActive, isActive, direction, loop, progress]);

    // ── Modo híbrido: contain por cima, cover+blur por baixo ──
    if (coverMode === 'containWithBlurredBg') {
        // Foreground: zoom sutil 1.0→1.04, sem translate (preserva enquadramento).
        const fgScale = panActive
            ? progress.interpolate({
                  inputRange: [-1, 1],
                  outputRange: [FG_ZOOM_MIN, FG_ZOOM_MAX],
              })
            : null;
        // Background: pan + scale 1.08, mais expressivo (não incomoda, está blurred).
        const bgTranslateX = progress.interpolate({
            inputRange: [-1, 1],
            outputRange: [-panAmplitude, panAmplitude],
        });
        const bgTransform = panActive
            ? [{ scale: PAN_SCALE }, { translateX: bgTranslateX }]
            : [{ scale: PAN_SCALE }];
        const fgTransform = fgScale ? [{ scale: fgScale }] : undefined;

        return (
            <View style={[styles.layeredContainer, { height }]}>
                <Animated.Image
                    source={{ uri }}
                    style={[
                        styles.layeredBg,
                        Platform.OS === 'web' ? { objectFit: 'cover' as any } : null,
                        { transform: bgTransform },
                    ]}
                    resizeMode="cover"
                    blurRadius={BG_BLUR_RADIUS}
                    onError={() => onError(uri)}
                />
                <View style={[styles.layeredOverlay, { opacity: BG_DARKEN_OPACITY }]} />
                <Animated.Image
                    source={{ uri }}
                    style={[
                        styles.layeredFg,
                        Platform.OS === 'web' ? { objectFit: 'contain' as any } : null,
                        fgTransform ? { transform: fgTransform } : null,
                    ]}
                    resizeMode="contain"
                    onError={() => onError(uri)}
                />
            </View>
        );
    }

    // ── Modo cover/contain simples (hero/legado/galeria) ──
    const effectiveResize: 'cover' | 'contain' =
        coverMode === 'contain' ? 'contain' : resizeMode;
    const translateX = progress.interpolate({
        inputRange: [-1, 1],
        outputRange: [-panAmplitude, panAmplitude],
    });
    // Em 'contain' puro evitamos translate (mostraria fundo). Só zoom sutil.
    const transform = panActive
        ? coverMode === 'contain'
            ? [{ scale: progress.interpolate({ inputRange: [-1, 1], outputRange: [FG_ZOOM_MIN, FG_ZOOM_MAX] }) }]
            : [{ scale: PAN_SCALE }, { translateX }]
        : undefined;

    return (
        <Animated.Image
            source={{ uri }}
            style={[
                styles.image,
                { height },
                webImagePositionStyle,
                transform ? { transform } : null,
            ]}
            resizeMode={effectiveResize}
            onError={() => onError(uri)}
        />
    );
});

// ─────────────────────────────────────────────
// CoverCarousel — crossfade entre slides
// ─────────────────────────────────────────────

/**
 * Empilha todos os slides absolutos e troca por crossfade (opacity).
 * Sem swipe horizontal automático — a transição entre fotos é fade in/out.
 * Auto-rotação a cada AUTO_PLAY_INTERVAL_MS; cada slide ativo roda seu
 * próprio Ken Burns enquanto está visível.
 */
const CoverCarouselInner = ({
    images,
    height,
    aspectRatio,
    borderRadius = 0,
    width,
    dotsBottom = 10,
    focalPoint,
    resizeMode = 'cover',
    panEnabled = true,
    coverMode = 'cover',
    showCounter = true,
}: CoverCarouselProps) => {
    const { width: windowWidth } = useWindowDimensions();
    const [activeIndex, setActiveIndex] = useState(0);
    const [failedUrls, setFailedUrls] = useState<Set<string>>(new Set());
    const containerWidth = width || windowWidth;

    const resolvedHeight = aspectRatio
        ? containerWidth / aspectRatio
        : (height ?? 200);
    const fx = focalPoint?.x ?? 0.5;
    const fy = focalPoint?.y ?? 0.5;
    const webImagePositionStyle = React.useMemo(
        () =>
            Platform.OS === 'web'
                ? {
                      objectFit: resizeMode as any,
                      objectPosition: `${fx * 100}% ${fy * 100}%`,
                  }
                : {},
        [resizeMode, fx, fy],
    );

    // Reduzir movimento — desliga Ken Burns (mas mantém crossfade, que é
    // suave e curto e ajuda mais do que atrapalha).
    const [reduceMotion, setReduceMotion] = useState(false);
    useEffect(() => {
        let mounted = true;
        AccessibilityInfo.isReduceMotionEnabled?.()
            .then((v: boolean) => { if (mounted) setReduceMotion(!!v); })
            .catch(() => {});
        const sub = AccessibilityInfo.addEventListener?.(
            'reduceMotionChanged',
            (v: boolean) => setReduceMotion(!!v),
        );
        return () => {
            mounted = false;
            sub?.remove?.();
        };
    }, []);

    const panActive = panEnabled && !reduceMotion;
    const panAmplitude = containerWidth * PAN_AMPLITUDE_FRACTION;

    const validImages = React.useMemo(
        () =>
            (images || []).filter(
                (u): u is string =>
                    typeof u === 'string' && u.length > 0 && !failedUrls.has(u),
            ),
        [images, failedUrls],
    );

    const handleImageError = useCallback((url: string) => {
        setFailedUrls(prev => {
            if (prev.has(url)) return prev;
            const next = new Set(prev);
            next.add(url);
            return next;
        });
    }, []);

    // Opacities por slide. Recriadas quando o número de slides muda.
    // Slide 0 começa em 1, demais em 0.
    const slideCount = validImages.length;
    const opacities = React.useMemo(
        () =>
            Array.from(
                { length: slideCount },
                (_, i) => new Animated.Value(i === 0 ? 1 : 0),
            ),
        [slideCount],
    );

    // Reset do activeIndex quando o conjunto de slides muda.
    useEffect(() => {
        setActiveIndex(0);
    }, [slideCount]);

    // Prefetch
    useEffect(() => {
        if (validImages.length > 0) prefetchImages(validImages);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [images]);

    // Auto-rotate
    useEffect(() => {
        if (validImages.length <= 1) return;
        const interval = setInterval(() => {
            setActiveIndex(prev => (prev + 1) % validImages.length);
        }, AUTO_PLAY_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [validImages.length]);

    // Crossfade quando activeIndex muda
    useEffect(() => {
        if (opacities.length === 0) return;
        const anims = opacities.map((op, i) =>
            Animated.timing(op, {
                toValue: i === activeIndex ? 1 : 0,
                duration: CROSSFADE_DURATION_MS,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true,
            }),
        );
        Animated.parallel(anims).start();
    }, [activeIndex, opacities]);

    // ── Fallback ──
    if (validImages.length === 0) {
        return (
            <LinearGradient
                colors={['#1A3263', '#28C9BF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.placeholder, { height: resolvedHeight, borderRadius }]}
            >
                <Ionicons name="images-outline" size={36} color="rgba(255,255,255,0.6)" />
                <Text style={styles.placeholderText}>Imagem indisponível</Text>
            </LinearGradient>
        );
    }

    return (
        <View
            style={[
                styles.container,
                { height: resolvedHeight, borderRadius, overflow: 'hidden' },
            ]}
        >
            {validImages.map((uri, i) => {
                const opacity = opacities[i];
                const isActive = i === activeIndex;
                return (
                    <Animated.View
                        key={`${uri}-${i}`}
                        pointerEvents="none"
                        style={[styles.slide, opacity ? { opacity } : null]}
                    >
                        <KenBurnsImage
                            uri={uri}
                            height={resolvedHeight}
                            webImagePositionStyle={webImagePositionStyle}
                            resizeMode={resizeMode}
                            coverMode={coverMode}
                            panActive={panActive}
                            panAmplitude={panAmplitude}
                            direction={i % 2 === 0 ? 'ltr' : 'rtl'}
                            isActive={isActive}
                            // Slide único usa loop pra não ficar travado num só extremo.
                            loop={validImages.length === 1}
                            onError={handleImageError}
                        />
                    </Animated.View>
                );
            })}

            {validImages.length > 1 && (
                <>
                    {/* Photo Counter Badge */}
                    {showCounter && (
                        <View style={styles.counterBadge}>
                            <View style={styles.counterInner}>
                                <Image
                                    source={{
                                        uri:
                                            'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgZmlsbD0id2hpdGUiIHZpZXdCb3g9IjAgMCAxNiAxNiI+PHBhdGggZD0iTTEwLjUgOC41YTIuNSAyLjUgMCAxIDEtNSAwIDIuNSAyLjUgMCAwIDEgNSAweiIvPjxwYXRoIGQ9Ik0yIDRhMiAyIDAgMCAwLTIgMnY2YTIgMiAwIDAgMCAyIDJoMTJhMiAyIDAgMCAwIDItMlY2YTIgMiAwIDAgMC0yLTJoLTEuMTcyYTIgMiAwIDAgMS0xLjQxNC0uNTg2bC0uODI4LS44MjhBMiAyIDAgMCAwIDkuMTcyIDJINi44MjhhMiAyIDAgMCAwLTEuNDE0LjU4NmwtLjgyOC44MjhBMiAyIDAgMCAxIDMuMTcyIDRIMnoiLz48L3N2Zz4=',
                                    }}
                                    style={styles.cameraIcon}
                                />
                                <View style={styles.counterTextContainer}>
                                    <CounterText
                                        current={activeIndex + 1}
                                        total={validImages.length}
                                    />
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Pagination Dots */}
                    {validImages.length <= 6 && (
                        <View style={[styles.dotsContainer, { bottom: dotsBottom }]}>
                            {validImages.map((_, idx) => (
                                <View
                                    key={idx}
                                    style={[
                                        styles.dot,
                                        idx === activeIndex
                                            ? styles.dotActive
                                            : styles.dotInactive,
                                    ]}
                                />
                            ))}
                        </View>
                    )}
                </>
            )}
        </View>
    );
};

const CounterText = memo(({ current, total }: { current: number; total: number }) => {
    return (
        <Text style={styles.counterText}>
            {current}/{total}
        </Text>
    );
});

export const CoverCarousel = memo(CoverCarouselInner);

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        width: '100%',
        backgroundColor: '#000',
    },
    slide: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    image: {
        width: '100%',
    },
    // ── Modo containWithBlurredBg ──
    layeredContainer: {
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#000',
    },
    layeredBg: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
    },
    layeredOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#000',
    },
    layeredFg: {
        width: '100%',
        height: '100%',
    },
    placeholder: {
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    placeholderText: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.85)',
        fontWeight: '600',
        letterSpacing: 0.3,
    },
    counterBadge: {
        position: 'absolute',
        bottom: 10,
        right: 10,
    },
    counterInner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 14,
        gap: 5,
    },
    cameraIcon: {
        width: 14,
        height: 14,
        tintColor: '#FFFFFF',
    },
    counterTextContainer: {
        justifyContent: 'center',
    },
    counterText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '600',
    },
    dotsContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 6,
    },
    dot: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
    },
    dotActive: {
        backgroundColor: '#FFFFFF',
        width: 22,
        borderRadius: 4,
    },
    dotInactive: {
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
    },
});

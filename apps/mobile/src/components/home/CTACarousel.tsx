import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    useWindowDimensions,
    LayoutChangeEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { theme } from '../../theme/theme';
import { Icon, IconName } from '../common/Icons';

const AUTO_SCROLL_INTERVAL = 3500;
// Padding lateral da seção (igual nas duas pontas — card ativo cabe inteiro).
const HORIZONTAL_PADDING = 16;
// Gap entre slides — sem isso os dois encostam.
const CARD_GAP = 12;

// Limites de texto. Ficam em constantes porque a área reservada do título é
// derivada deles (lineHeight × nº de linhas) — mudar um sem o outro
// desalinharia os cards.
const TITLE_MAX_LINES = 2;
const TITLE_LINE_HEIGHT = 28;
const SUBTITLE_MAX_LINES = 3;
const SUBTITLE_LINE_HEIGHT = 22;

interface CTASlide {
    id: number;
    iconName: IconName;
    title: string;
    subtitle: string;
    gradientColors: [string, string];
    targetTab?: 'home' | 'itineraries' | 'profile';
}

const slides: CTASlide[] = [
    {
        id: 1,
        iconName: 'map',
        title: 'Conheça os roteiros dos viajantes',
        subtitle: 'Explore experiências autênticas compartilhadas pela comunidade',
        gradientColors: ['#667eea', '#764ba2'],
        targetTab: 'itineraries',
    },
    {
        id: 2,
        iconName: 'briefcase',
        title: 'Quer vender seus roteiros?',
        subtitle: 'Já viajou bastante? Transforme sua experiência em renda extra',
        gradientColors: ['#f093fb', '#f5576c'],
        targetTab: 'profile',
    },
];

export const CTACarousel: React.FC = () => {
    // useWindowDimensions é só o fallback ANTES do primeiro onLayout medir o
    // container real. O carrossel pode estar dentro de uma section com
    // padding próprio (itineraries.tsx) ou colado na tela (Home) — usar
    // screenWidth como fonte de verdade da largura do card causa overflow
    // sempre que o pai tiver padding lateral. containerWidth (medido) é a
    // única fonte confiável.
    const { width: screenWidth } = useWindowDimensions();
    const [containerWidth, setContainerWidth] = useState(0);
    const hasMeasured = containerWidth > 0;
    const availableWidth = hasMeasured ? containerWidth : screenWidth;
    const cardWidth = Math.max(0, availableWidth - HORIZONTAL_PADDING * 2);
    // O snap salta de slide em slide: cardWidth + gap. Nunca <= 0 (evita
    // snapToInterval inválido / divisão por zero no cálculo do índice).
    const snapInterval = cardWidth > 0 ? cardWidth + CARD_GAP : 0;

    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollViewRef = useRef<ScrollView>(null);
    const router = useRouter();
    const isTouchingRef = useRef(false);

    const handleContainerLayout = useCallback((e: LayoutChangeEvent) => {
        const w = e.nativeEvent.layout.width;
        setContainerWidth((prev) => (Math.abs(prev - w) > 0.5 ? w : prev));
    }, []);

    // Ao medir/remedir o container (ex.: rotação de tela, resize no web),
    // realinha o scroll pro índice atual usando o snapInterval novo — sem
    // isso o carrossel fica "preso" entre dois cards com a largura antiga.
    useEffect(() => {
        if (snapInterval <= 0) return;
        scrollViewRef.current?.scrollTo({ x: currentIndex * snapInterval, animated: false });
        // Só quando o snapInterval muda (containerWidth mudou) — não a cada
        // troca de currentIndex, que já tem seu próprio scroll no autoplay/touch.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [snapInterval]);

    // Auto-scroll. Pausa quando o usuário tá tocando (caso esteja arrastando).
    // Não roda com largura não-medida — evitaria scrollar para um x errado.
    useEffect(() => {
        if (snapInterval <= 0) return;
        const interval = setInterval(() => {
            if (isTouchingRef.current) return;
            const nextIndex = (currentIndex + 1) % slides.length;
            scrollViewRef.current?.scrollTo({
                x: nextIndex * snapInterval,
                animated: true,
            });
            setCurrentIndex(nextIndex);
        }, AUTO_SCROLL_INTERVAL);

        return () => clearInterval(interval);
    }, [currentIndex, snapInterval]);

    const handleScroll = (event: any) => {
        if (snapInterval <= 0) return;
        const offsetX = event.nativeEvent.contentOffset.x;
        // Arredonda pelo passo de snap (não pela cardWidth), senão drift acumula.
        const index = Math.max(0, Math.min(slides.length - 1, Math.round(offsetX / snapInterval)));
        if (index !== currentIndex) setCurrentIndex(index);
    };

    const handleCardPress = (targetTab?: string) => {
        if (targetTab === 'itineraries') {
            router.push('/(tabs)/itineraries');
        } else if (targetTab === 'profile') {
            router.push('/(tabs)/profile');
        }
    };

    return (
        <View style={styles.container} onLayout={handleContainerLayout}>
            <ScrollView
                ref={scrollViewRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                // pagingEnabled SEM snapToInterval custom: paginava em múltiplos
                // da viewport (screenWidth), não do cardWidth — causava drift e
                // cortava o card. Usar snapToInterval=cardWidth+gap é o caminho.
                decelerationRate="fast"
                snapToInterval={snapInterval > 0 ? snapInterval : undefined}
                snapToAlignment="start"
                // alignItems:'stretch' explícito — é o que faz TODOS os slides
                // receberem a altura do mais alto da linha. Não confiar no
                // default do Yoga: qualquer alteração futura no estilo do
                // contentContainer poderia sobrescrevê-lo em silêncio.
                contentContainerStyle={styles.scrollContent}
                onTouchStart={() => { isTouchingRef.current = true; }}
                onTouchEnd={() => { isTouchingRef.current = false; }}
                // Enquanto o container ainda não foi medido, some (opacity) mas
                // mantém a altura (minHeight do card) — evita "piscar" com o
                // card no tamanho errado no primeiro frame.
                style={{ opacity: hasMeasured ? 1 : 0 }}
            >
                {slides.map((slide, idx) => (
                    <TouchableOpacity
                        key={slide.id}
                        onPress={() => handleCardPress(slide.targetTab)}
                        activeOpacity={0.9}
                        accessibilityRole="button"
                        accessibilityLabel={`${slide.title}. ${slide.subtitle}. Explorar.`}
                        style={[
                            styles.slideWrapper,
                            {
                                width: cardWidth,
                                // Gap só ENTRE slides — último não tem.
                                marginRight: idx === slides.length - 1 ? 0 : CARD_GAP,
                            },
                        ]}
                    >
                        <LinearGradient
                            colors={slide.gradientColors}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.card}
                        >
                            <View style={styles.iconContainer}>
                                <Icon name={slide.iconName} size={28} color="#fff" strokeWidth={1.5} />
                            </View>
                            {/* Área de texto flexível: absorve a folga de altura
                                do slide mais alto, mantendo o CTA no rodapé. */}
                            <View style={styles.textContent}>
                                <Text style={styles.title} numberOfLines={TITLE_MAX_LINES} ellipsizeMode="tail">
                                    {slide.title}
                                </Text>
                                <Text style={styles.subtitle} numberOfLines={SUBTITLE_MAX_LINES} ellipsizeMode="tail">
                                    {slide.subtitle}
                                </Text>
                            </View>
                            <View style={styles.ctaRow}>
                                <Text style={styles.ctaText}>Explorar</Text>
                                <Icon name="chevron-right" size={16} color="rgba(255,255,255,0.9)" />
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Pagination Dots */}
            <View style={styles.pagination}>
                {slides.map((_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.dot,
                            currentIndex === index && styles.activeDot,
                        ]}
                    />
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
    },

    // ── Equalização de altura ────────────────────────────────────────────
    // Regra única para TODOS os slides (atuais e futuros), sem medição, sem
    // estado e sem nada indexado por id: o contentContainer estica a linha
    // (stretch), o wrapper aceita a altura da linha e o gradiente PREENCHE o
    // wrapper (flex: 1).
    //
    // Era exatamente o elo que faltava: os wrappers já ficavam com a mesma
    // altura, mas o LinearGradient — o card visível — parava no tamanho do
    // próprio conteúdo (243px vs 269px), então o card com menos texto
    // aparecia menor e com o "Explorar" mais alto.
    scrollContent: {
        paddingHorizontal: HORIZONTAL_PADDING,
        alignItems: 'stretch',
    },
    slideWrapper: {
        alignSelf: 'stretch',
    },
    card: {
        // Preenche a altura que o wrapper recebeu do slide mais alto.
        flex: 1,
        borderRadius: 20,
        padding: 28,
        // Piso de segurança: se algum ambiente não esticar a linha, o card
        // ainda tem altura utilizável em vez de colapsar com flex: 1.
        minHeight: 200,
        alignItems: 'center',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    textContent: {
        flex: 1,
        justifyContent: 'center',
        alignSelf: 'stretch',
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 22,
        lineHeight: TITLE_LINE_HEIGHT,
        // Área reservada de 2 linhas: o subtítulo começa na mesma altura em
        // todos os cards, tenha o título 1 ou 2 linhas.
        minHeight: TITLE_LINE_HEIGHT * TITLE_MAX_LINES,
        fontWeight: '700',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'center',
        lineHeight: SUBTITLE_LINE_HEIGHT,
    },
    ctaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        // Ancorado no rodapé do card: com textContent flexível, o "Explorar"
        // fica na MESMA altura em todos os slides.
        marginTop: 'auto',
        paddingTop: 16,
    },
    ctaText: {
        fontSize: 14,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.9)',
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
        gap: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#D1D5DB',
    },
    activeDot: {
        width: 24,
        backgroundColor: theme.colors.primary,
    },
});

import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { theme } from '../../theme/theme';
import { Icon, IconName } from '../common/Icons';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 48; // 24px margin on each side
const AUTO_SCROLL_INTERVAL = 3500; // 3.5 seconds

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
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollViewRef = useRef<ScrollView>(null);
    const router = useRouter();

    // Auto-scroll effect
    useEffect(() => {
        const interval = setInterval(() => {
            const nextIndex = (currentIndex + 1) % slides.length;
            scrollViewRef.current?.scrollTo({
                x: nextIndex * CARD_WIDTH,
                animated: true,
            });
            setCurrentIndex(nextIndex);
        }, AUTO_SCROLL_INTERVAL);

        return () => clearInterval(interval);
    }, [currentIndex]);

    const handleScroll = (event: any) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / CARD_WIDTH);
        setCurrentIndex(index);
    };

    const handleCardPress = (targetTab?: string) => {
        if (targetTab === 'itineraries') {
            router.push('/(tabs)/itineraries');
        } else if (targetTab === 'profile') {
            router.push('/(tabs)/profile');
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView
                ref={scrollViewRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                decelerationRate="fast"
                snapToInterval={CARD_WIDTH}
                snapToAlignment="center"
                contentContainerStyle={styles.scrollContent}
            >
                {slides.map((slide) => (
                    <TouchableOpacity
                        key={slide.id}
                        onPress={() => handleCardPress(slide.targetTab)}
                        activeOpacity={0.9}
                        style={styles.slideWrapper}
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
                            <Text style={styles.title}>{slide.title}</Text>
                            <Text style={styles.subtitle}>{slide.subtitle}</Text>
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
    scrollContent: {
        paddingHorizontal: 24,
    },
    slideWrapper: {
        width: CARD_WIDTH,
        marginRight: 0,
    },
    card: {
        borderRadius: 20,
        padding: 36,
        minHeight: 200,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
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
        fontWeight: '700',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'center',
        lineHeight: 22,
    },
    ctaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 16,
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

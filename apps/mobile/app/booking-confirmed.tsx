import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,
    StatusBar,
    Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../src/theme/theme';
import { getPackageById } from '../src/services/api';
import { haptics } from '../src/services/haptics';
import { analytics } from '../src/services/analytics';

const { width } = Dimensions.get('window');

export default function BookingConfirmedScreen() {
    const router = useRouter();
    const {
        packageId,
        bookingId,
        fullName,
        email,
        totalPrice,
        date,
        adults,
        children,
        paymentMethod,
    } = useLocalSearchParams();
    const [packageData, setPackageData] = useState<any>(null);

    useEffect(() => {
        if (packageId) {
            getPackageById(packageId as string).then(setPackageData).catch(console.error);
        }
        haptics.bookingConfirmed();
        if (bookingId && packageId) {
            analytics.bookingCompleted(
                bookingId as string,
                packageId as string,
                parseFloat(totalPrice as string) || 0
            );
        }
    }, [packageId, bookingId, totalPrice]);

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        });
    };

    const travelersText = () => {
        const a = parseInt(adults as string) || 2;
        const c = parseInt(children as string) || 0;
        let text = `${a} adulto${a > 1 ? 's' : ''}`;
        if (c > 0) text += ` + ${c} criança${c > 1 ? 's' : ''}`;
        return text;
    };

    const paymentLabel = () => {
        const method = paymentMethod as string;
        if (method === 'apple') return ' Pay';
        if (method === 'pix') return 'PIX';
        if (method === 'card') return 'Cartão de crédito';
        return method || 'Cartão de crédito';
    };

    if (!packageData) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Carregando...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Hero Image */}
                <View style={styles.heroContainer}>
                    <Image
                        source={{ uri: packageData.images[0] }}
                        style={styles.heroImage}
                    />
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.8)']}
                        style={styles.heroGradient}
                    />

                    {/* Success Badge */}
                    <View style={styles.successBadgeContainer}>
                        <View style={styles.successCircle}>
                            <Ionicons name="checkmark" size={40} color="#fff" />
                        </View>
                    </View>

                    {/* Hero Text */}
                    <View style={styles.heroTextContainer}>
                        <Text style={styles.heroTitle}>Sua viagem está confirmada!</Text>
                        <Text style={styles.heroSubtitle}>{packageData.title}</Text>
                        {date && (
                            <Text style={styles.heroDate}>{formatDate(date as string)}</Text>
                        )}
                    </View>
                </View>

                {/* Content */}
                <View style={styles.contentSheet}>
                    {/* Booking Summary Card */}
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryTitle}>Resumo da Reserva</Text>

                        <View style={styles.summaryRow}>
                            <View style={styles.summaryIcon}>
                                <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                            </View>
                            <View style={styles.summaryContent}>
                                <Text style={styles.summaryLabel}>Status</Text>
                                <Text style={[styles.summaryValue, { color: theme.colors.success }]}>Confirmado</Text>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.summaryRow}>
                            <View style={styles.summaryIcon}>
                                <Ionicons name="calendar" size={20} color={theme.colors.primary} />
                            </View>
                            <View style={styles.summaryContent}>
                                <Text style={styles.summaryLabel}>Datas</Text>
                                <Text style={styles.summaryValue}>
                                    {date ? formatDate(date as string) : 'A confirmar'}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.summaryRow}>
                            <View style={styles.summaryIcon}>
                                <Ionicons name="people" size={20} color={theme.colors.primary} />
                            </View>
                            <View style={styles.summaryContent}>
                                <Text style={styles.summaryLabel}>Viajantes</Text>
                                <Text style={styles.summaryValue}>{travelersText()}</Text>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.summaryRow}>
                            <View style={styles.summaryIcon}>
                                <Ionicons name="card" size={20} color={theme.colors.primary} />
                            </View>
                            <View style={styles.summaryContent}>
                                <Text style={styles.summaryLabel}>Forma de pagamento</Text>
                                <Text style={styles.summaryValue}>{paymentLabel()}</Text>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.summaryRow}>
                            <View style={styles.summaryIcon}>
                                <Ionicons name="ticket" size={20} color={theme.colors.primary} />
                            </View>
                            <View style={styles.summaryContent}>
                                <Text style={styles.summaryLabel}>Código da reserva</Text>
                                <Text style={[styles.summaryValue, styles.bookingCode]}>
                                    #{bookingId || 'VAMO-2026'}
                                </Text>
                            </View>
                        </View>

                        {/* Total */}
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Total pago</Text>
                            <Text style={styles.totalValue}>
                                R$ {parseFloat(totalPrice as string || '0').toLocaleString('pt-BR')}
                            </Text>
                        </View>
                    </View>

                    {/* Notifications Section */}
                    <View style={styles.notificationStack}>
                        <View style={styles.emailNotice}>
                            <Ionicons name="mail" size={20} color={theme.colors.primary} />
                            <Text style={styles.emailNoticeText}>
                                E-mail de confirmação enviado para{' '}
                                <Text style={styles.emailHighlight}>{email}</Text>
                            </Text>
                        </View>

                        <View style={[styles.emailNotice, { backgroundColor: '#25D36615', borderColor: '#25D36630' }]}>
                            <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
                            <Text style={styles.emailNoticeText}>
                                Voucher enviado para o WhatsApp{' '}
                                <Text style={styles.whatsappHighlight}>vinculado ao seu perfil</Text>
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => {
                            haptics.light();
                            router.push({
                                pathname: `/purchased-package/${packageId}` as any,
                            });
                        }}
                    >
                        <Ionicons name="airplane" size={22} color="#fff" />
                        <Text style={styles.primaryButtonText}>Ver minha viagem</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.whatsappButton}
                        onPress={() => {
                            haptics.light();
                            Alert.alert('Suporte', 'Conectando ao WhatsApp da agência...');
                        }}
                    >
                        <Ionicons name="logo-whatsapp" size={20} color="#fff" />
                        <Text style={styles.whatsappButtonText}>Falar com a agência</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={() => {
                            haptics.light();
                            Alert.alert(
                                '📄 Comprovante',
                                'O comprovante foi enviado para seu e-mail. Em breve estará disponível para download no app.',
                                [{ text: 'OK' }]
                            );
                        }}
                    >
                        <Ionicons name="download" size={20} color={theme.colors.primary} />
                        <Text style={styles.secondaryButtonText}>Baixar comprovante</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.tertiaryButton}
                        onPress={() => {
                            haptics.light();
                            Alert.alert(
                                '📅 Calendário',
                                'A viagem foi adicionada ao seu calendário!',
                                [{ text: 'OK' }]
                            );
                        }}
                    >
                        <Ionicons name="calendar-outline" size={20} color={theme.colors.text.secondary} />
                        <Text style={styles.tertiaryButtonText}>Adicionar ao calendário</Text>
                    </TouchableOpacity>

                    <View style={{ height: 40 }} />
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    heroContainer: {
        width: '100%',
        height: width * 0.65,
        position: 'relative',
    },
    heroImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    heroGradient: {
        ...StyleSheet.absoluteFillObject,
    },
    successBadgeContainer: {
        position: 'absolute',
        top: 60,
        alignSelf: 'center',
    },
    successCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 12,
    },
    heroTextContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        paddingBottom: 24,
        alignItems: 'center',
    },
    heroTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 8,
    },
    heroSubtitle: {
        fontSize: 17,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
    },
    heroDate: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
        marginTop: 4,
    },
    contentSheet: {
        backgroundColor: theme.colors.background,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        marginTop: -20,
        paddingHorizontal: 20,
        paddingTop: 28,
    },
    summaryCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    summaryTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 20,
    },
    summaryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingVertical: 4,
    },
    summaryIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: `${theme.colors.primary}15`,
        alignItems: 'center',
        justifyContent: 'center',
    },
    summaryContent: {
        flex: 1,
    },
    summaryLabel: {
        fontSize: 12,
        color: theme.colors.text.tertiary,
        fontWeight: '500',
        marginBottom: 2,
    },
    summaryValue: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    bookingCode: {
        fontFamily: 'monospace',
        color: theme.colors.primary,
        letterSpacing: 0.5,
    },
    divider: {
        height: 1,
        backgroundColor: theme.colors.border,
        marginVertical: 12,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 2,
        borderTopColor: theme.colors.primary,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    totalValue: {
        fontSize: 22,
        fontWeight: '800',
        color: theme.colors.primary,
    },
    notificationStack: {
        marginBottom: 24,
        gap: 12,
    },
    emailNotice: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: `${theme.colors.primary}10`,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: `${theme.colors.primary}20`,
    },
    emailNoticeText: {
        flex: 1,
        fontSize: 13,
        color: theme.colors.text.secondary,
        lineHeight: 18,
    },
    emailHighlight: {
        color: theme.colors.primary,
        fontWeight: '700',
    },
    whatsappHighlight: {
        color: '#25D366',
        fontWeight: '700',
    },
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: theme.colors.primary,
        paddingVertical: 16,
        borderRadius: 16,
        marginBottom: 12,
        ...theme.shadows.button,
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '800',
    },
    whatsappButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: '#25D366',
        paddingVertical: 16,
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: '#25D366',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    whatsappButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    secondaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: theme.colors.surfaceLight,
        paddingVertical: 16,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1.5,
        borderColor: theme.colors.border,
    },
    secondaryButtonText: {
        color: theme.colors.text.primary,
        fontSize: 16,
        fontWeight: '700',
    },
    tertiaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 14,
        borderRadius: 16,
    },
    tertiaryButtonText: {
        color: theme.colors.text.tertiary,
        fontSize: 15,
        fontWeight: '600',
    },
    errorText: {
        color: theme.colors.text.secondary,
        fontSize: 16,
        textAlign: 'center',
        marginTop: 40,
    },
});

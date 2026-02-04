import React, { useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getPackageById } from '../src/data/mockPackages';
import { haptics } from '../src/services/haptics';
import { analytics } from '../src/services/analytics';
import { shareService } from '../src/services/sharing';

export default function BookingConfirmedScreen() {
    const router = useRouter();
    const { packageId, bookingId, fullName, email, totalPrice } = useLocalSearchParams();
    const packageData = getPackageById(packageId as string);

    // Haptic and analytics on mount
    useEffect(() => {
        haptics.bookingConfirmed();
        analytics.bookingCompleted(
            bookingId as string,
            packageId as string,
            parseFloat(totalPrice as string) || 0
        );
    }, []);

    const handleWhatsAppContact = () => {
        haptics.medium();
        const agencyPhone = '5548999999999'; // Mock
        const message = `Olá! Minha reserva ${bookingId} foi confirmada. Gostaria de mais informações.`;
        shareService.openWhatsApp(agencyPhone, message);
    };

    const handleShareBooking = async () => {
        haptics.light();
        if (packageData) {
            await shareService.shareBookingConfirmation(
                bookingId as string,
                packageData.title,
                new Date().toLocaleDateString('pt-BR')
            );
        }
    };

    if (!packageData) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Pacote não encontrado</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Success Icon */}
                <View style={styles.iconContainer}>
                    <View style={styles.checkmarkCircle}>
                        <Ionicons name="checkmark" size={60} color="#fff" />
                    </View>
                </View>

                {/* Title */}
                <Text style={styles.title}>Reserva Confirmada!</Text>
                <Text style={styles.subtitle}>
                    Você receberá um e-mail de confirmação em{'\n'}
                    <Text style={styles.highlightedEmail}>{email}</Text>
                </Text>

                {/* Booking Card */}
                <View style={styles.bookingCard}>
                    <View style={styles.imageContainer}>
                        <Text style={styles.imageEmoji}>🎉</Text>
                    </View>

                    <View style={styles.bookingDetails}>
                        <Text style={styles.packageTitle}>{packageData.title}</Text>

                        <View style={styles.detailRow}>
                            <Ionicons name="person-outline" size={18} color="#999" />
                            <Text style={styles.detailText}>{fullName}</Text>
                        </View>

                        <View style={styles.detailRow}>
                            <Ionicons name="ticket-outline" size={18} color="#999" />
                            <Text style={styles.detailText}>Código da reserva: #{bookingId}</Text>
                        </View>

                        <View style={styles.statusBadge}>
                            <Ionicons name="checkmark-circle" size={16} color="#14b8a6" />
                            <Text style={styles.statusText}>Confirmado</Text>
                        </View>
                    </View>
                </View>

                {/* Next Steps */}
                <View style={styles.stepsSection}>
                    <Text style={styles.stepsTitle}>Próximos passos</Text>

                    <View style={styles.step}>
                        <View style={styles.stepIcon}>
                            <Text style={styles.stepNumber}>1</Text>
                        </View>
                        <View style={styles.stepContent}>
                            <Text style={styles.stepTitle}>Verifique seu e-mail</Text>
                            <Text style={styles.stepDescription}>
                                Enviamos todos os detalhes da sua reserva para {email}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.step}>
                        <View style={styles.stepIcon}>
                            <Text style={styles.stepNumber}>2</Text>
                        </View>
                        <View style={styles.stepContent}>
                            <Text style={styles.stepTitle}>Aguarde o contato da agência</Text>
                            <Text style={styles.stepDescription}>
                                {packageData.agency.name} entrará em contato para confirmar detalhes
                            </Text>
                        </View>
                    </View>

                    <View style={styles.step}>
                        <View style={styles.stepIcon}>
                            <Text style={styles.stepNumber}>3</Text>
                        </View>
                        <View style={styles.stepContent}>
                            <Text style={styles.stepTitle}>Prepare-se para a aventura!</Text>
                            <Text style={styles.stepDescription}>
                                Siga as instruções enviadas por email antes da data da viagem
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Actions */}
                <View style={styles.actionsSection}>
                    <TouchableOpacity style={styles.whatsappButton} onPress={handleWhatsAppContact}>
                        <Ionicons name="logo-whatsapp" size={24} color="#fff" />
                        <Text style={styles.whatsappButtonText}>
                            Falar com {packageData.agency.name}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.shareButton} onPress={handleShareBooking}>
                        <Ionicons name="share-outline" size={24} color="#fff" />
                        <Text style={styles.shareButtonText}>Compartilhar minha viagem</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.bookingsButton}
                        onPress={() => {
                            haptics.light();
                            router.push('/(tabs)/profile');
                        }}
                    >
                        <Text style={styles.bookingsButtonText}>Ver minhas reservas</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.homeButton}
                        onPress={() => {
                            haptics.light();
                            router.push('/(tabs)');
                        }}
                    >
                        <Text style={styles.homeButtonText}>Voltar para início</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a1a',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 40,
    },
    iconContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    checkmarkCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#14b8a6',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#14b8a6',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 8,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 15,
        color: '#999',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 22,
    },
    highlightedEmail: {
        color: '#14b8a6',
        fontWeight: '600',
    },
    bookingCard: {
        backgroundColor: '#2a2a2a',
        borderRadius: 16,
        padding: 20,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: '#3a3a3a',
    },
    imageContainer: {
        width: '100%',
        height: 100,
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        marginBottom: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    imageEmoji: {
        fontSize: 48,
    },
    bookingDetails: {
        gap: 12,
    },
    packageTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 8,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    detailText: {
        fontSize: 15,
        color: '#ccc',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 8,
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(20, 184, 166, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#14b8a6',
    },
    stepsSection: {
        marginBottom: 32,
    },
    stepsTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 20,
    },
    step: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 24,
    },
    stepIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#14b8a6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepNumber: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
    },
    stepContent: {
        flex: 1,
        paddingTop: 2,
    },
    stepTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 6,
    },
    stepDescription: {
        fontSize: 14,
        color: '#999',
        lineHeight: 20,
    },
    actionsSection: {
        gap: 12,
    },
    whatsappButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: '#25D366',
        paddingVertical: 16,
        borderRadius: 12,
    },
    whatsappButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
    },
    shareButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: '#6366f1',
        paddingVertical: 16,
        borderRadius: 12,
    },
    shareButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    bookingsButton: {
        backgroundColor: '#14b8a6',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    bookingsButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    homeButton: {
        backgroundColor: 'transparent',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#3a3a3a',
    },
    homeButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    errorText: {
        color: '#fff',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 40,
    },
});

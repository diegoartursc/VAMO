import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Animated,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme/theme';
import { haptics } from '../../services/haptics';

const { width } = Dimensions.get('window');

interface PurchaseSuccessModalProps {
    visible: boolean;
    onClose: () => void;
    onGoToMyTrips: () => void;
    onViewItinerary: () => void;
    itineraryTitle: string;
}

export function PurchaseSuccessModal({
    visible,
    onClose,
    onGoToMyTrips,
    onViewItinerary,
    itineraryTitle,
}: PurchaseSuccessModalProps) {
    const [scaleAnim] = useState(new Animated.Value(0));
    const [fadeAnim] = useState(new Animated.Value(0));
    const [checkAnim] = useState(new Animated.Value(0));

    useEffect(() => {
        if (visible) {
            haptics.success();
            // Animate entrance
            Animated.sequence([
                Animated.parallel([
                    Animated.spring(scaleAnim, {
                        toValue: 1,
                        tension: 50,
                        friction: 7,
                        useNativeDriver: true,
                    }),
                    Animated.timing(fadeAnim, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                ]),
                Animated.spring(checkAnim, {
                    toValue: 1,
                    tension: 50,
                    friction: 7,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            // Reset animations
            scaleAnim.setValue(0);
            fadeAnim.setValue(0);
            checkAnim.setValue(0);
        }
    }, [visible]);

    const handleClose = () => {
        haptics.light();
        onClose();
    };

    const handleGoToMyTrips = () => {
        haptics.light();
        onGoToMyTrips();
    };

    const handleViewItinerary = () => {
        haptics.light();
        onViewItinerary();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={handleClose}
        >
            {/* Backdrop */}
            <Animated.View
                style={[
                    styles.backdrop,
                    { opacity: fadeAnim },
                ]}
            >
                <TouchableOpacity
                    style={StyleSheet.absoluteFill}
                    activeOpacity={1}
                    onPress={handleClose}
                />
            </Animated.View>

            {/* Modal Content */}
            <View style={styles.centeredView}>
                <Animated.View
                    style={[
                        styles.modalView,
                        {
                            opacity: fadeAnim,
                            transform: [{ scale: scaleAnim }],
                        },
                    ]}
                >
                    {/* Success Icon */}
                    <Animated.View
                        style={[
                            styles.iconContainer,
                            {
                                transform: [{ scale: checkAnim }],
                            },
                        ]}
                    >
                        <LinearGradient
                            colors={[theme.colors.success, '#10B981']}
                            style={styles.iconGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Ionicons name="checkmark-circle" size={64} color="#fff" />
                        </LinearGradient>
                    </Animated.View>

                    {/* Title */}
                    <Text style={styles.title}>Pagamento confirmado!</Text>

                    {/* Message */}
                    <Text style={styles.message}>
                        Seu roteiro digital já está disponível no app:
                    </Text>
                    <Text style={styles.itineraryTitle} numberOfLines={2}>
                        {itineraryTitle}
                    </Text>

                    {/* Info Box */}
                    <View style={styles.infoBox}>
                        <Ionicons name="information-circle" size={20} color={theme.colors.primary} />
                        <Text style={styles.infoText}>
                            Acesse agora o roteiro liberado ou encontre a compra sempre em <Text style={styles.infoTextBold}>Meus Roteiros</Text>.
                        </Text>
                    </View>

                    {/* Actions */}
                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={handleViewItinerary}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={[theme.colors.primary, theme.colors.secondary]}
                                style={styles.primaryButtonGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Ionicons name="map" size={20} color="#fff" />
                                <Text style={styles.primaryButtonText}>Ver roteiro</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={handleGoToMyTrips}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="library-outline" size={18} color={theme.colors.primary} />
                            <Text style={styles.secondaryButtonText}>Ir para Meus Roteiros</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.tertiaryButton}
                            onPress={handleClose}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.tertiaryButtonText}>Continuar explorando</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    modalView: {
        width: width - 40,
        maxWidth: 400,
        backgroundColor: theme.colors.background,
        borderRadius: 24,
        padding: 28,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 10,
    },
    iconContainer: {
        marginBottom: 20,
    },
    iconGradient: {
        width: 96,
        height: 96,
        borderRadius: 48,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: theme.colors.success,
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 12,
        textAlign: 'center',
    },
    message: {
        fontSize: 15,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        marginBottom: 8,
        lineHeight: 22,
    },
    itineraryTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: theme.colors.primary,
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 24,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        backgroundColor: theme.colors.primaryLight,
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
        borderLeftWidth: 3,
        borderLeftColor: theme.colors.primary,
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        color: theme.colors.text.secondary,
        lineHeight: 20,
    },
    infoTextBold: {
        fontWeight: '700',
        color: theme.colors.primary,
    },
    actions: {
        width: '100%',
        gap: 12,
    },
    primaryButton: {
        width: '100%',
        height: 52,
        borderRadius: 16,
        overflow: 'hidden',
        ...theme.shadows.button,
    },
    primaryButtonGradient: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    primaryButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    secondaryButton: {
        width: '100%',
        height: 48,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: theme.colors.surfaceLight,
    },
    secondaryButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.primary,
    },
    tertiaryButton: {
        width: '100%',
        minHeight: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tertiaryButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text.secondary,
    },
});

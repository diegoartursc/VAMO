import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getCheckoutSessionStatus } from '../../src/services/api';
import { theme } from '../../src/theme/theme';
import { useAuth } from '../../src/contexts/AuthContext';
import { useCart } from '../../src/hooks/useCart';

const getParam = (value: string | string[] | undefined): string => {
    if (Array.isArray(value)) return value[0] || '';
    return value || '';
};

// O Stripe pode redirecionar de volta uma fração de segundo antes do
// pagamento constar como "paid" — tentamos algumas vezes antes de desistir.
const MAX_ATTEMPTS = 5;
const RETRY_DELAY_MS = 1500;

type ConfirmState = 'checking' | 'canceled' | 'pending' | 'error';

export default function ItineraryConfirmScreen() {
    const router = useRouter();
    const { accessToken, isAuthenticated, isLoading: authLoading } = useAuth();
    const { removeFromCart } = useCart();
    const params = useLocalSearchParams();
    const sessionId = getParam(params.session_id as string | string[] | undefined);
    const itineraryId = getParam(params.itineraryId as string | string[] | undefined);
    const source = getParam(params.source as string | string[] | undefined);
    const canceled = getParam(params.canceled as string | string[] | undefined) === 'true';

    const [state, setState] = useState<ConfirmState>(canceled ? 'canceled' : 'checking');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    // Evita confirmar duas vezes em re-renders (StrictMode/web).
    const confirmingRef = useRef(false);
    // removeFromCart é recriada a cada render do CartProvider — se entrasse
    // nas deps do efeito de polling, o cleanup cancelaria o loop após a
    // primeira tentativa. Ref mantém a versão atual sem reexecutar o efeito.
    const removeFromCartRef = useRef(removeFromCart);
    removeFromCartRef.current = removeFromCart;

    useEffect(() => {
        if (authLoading || canceled) return;
        if (!isAuthenticated) {
            router.replace({
                pathname: '/login' as any,
                params: {
                    next: '/checkout/itinerary-confirm',
                    ...(sessionId ? { session_id: sessionId } : {}),
                    ...(itineraryId ? { itineraryId } : {}),
                    ...(source ? { source } : {}),
                },
            });
        }
    }, [authLoading, isAuthenticated, canceled, sessionId, itineraryId, source, router]);

    useEffect(() => {
        if (canceled || authLoading || !isAuthenticated || !sessionId) return;
        if (confirmingRef.current) return;
        confirmingRef.current = true;

        let mounted = true;

        const confirmPayment = async () => {
            for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
                try {
                    const result = await getCheckoutSessionStatus(sessionId, accessToken);
                    if (!mounted) return;

                    if (result.status === 'paid') {
                        if (source === 'cart' && result.itineraryId) {
                            await removeFromCartRef.current(result.itineraryId);
                        }
                        router.replace({
                            pathname: `/itinerary/${result.itineraryId || itineraryId}` as any,
                            params: { showSuccess: 'true' },
                        });
                        return;
                    }
                } catch (err: any) {
                    if (!mounted) return;
                    if (attempt === MAX_ATTEMPTS) {
                        setErrorMessage(err?.message || 'Não foi possível confirmar o pagamento.');
                        setState('error');
                        return;
                    }
                }
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
                if (!mounted) return;
            }
            if (mounted) setState('pending');
        };

        confirmPayment();
        return () => { mounted = false; };
        // Só primitivas estáveis: funções (removeFromCart/router) entram via
        // ref/closure para o cleanup não matar o polling no meio.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canceled, authLoading, isAuthenticated, sessionId, accessToken, source, itineraryId]);

    const retryCheckout = () => {
        if (itineraryId) {
            router.replace({
                pathname: '/checkout/itinerary-contact' as any,
                params: { itineraryId, ...(source ? { source } : {}) },
            });
        } else {
            router.replace('/(tabs)/cart' as any);
        }
    };

    const backToItinerary = () => {
        if (itineraryId) {
            router.replace(`/itinerary/${itineraryId}` as any);
        } else {
            router.replace('/(tabs)/itineraries' as any);
        }
    };

    if (state === 'canceled') {
        return (
            <View style={styles.container}>
                <Ionicons name="close-circle-outline" size={48} color={theme.colors.text.tertiary} />
                <Text style={styles.title}>Pagamento cancelado</Text>
                <Text style={styles.text}>
                    Nenhuma cobrança foi realizada. Você pode tentar novamente quando quiser.
                </Text>
                <TouchableOpacity style={styles.primaryButton} onPress={retryCheckout}>
                    <Text style={styles.primaryButtonText}>Tentar novamente</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryButton} onPress={backToItinerary}>
                    <Text style={styles.secondaryButtonText}>Voltar ao roteiro</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (state === 'pending' || state === 'error') {
        return (
            <View style={styles.container}>
                <Ionicons name="time-outline" size={48} color={theme.colors.text.tertiary} />
                <Text style={styles.title}>
                    {state === 'error' ? 'Não foi possível confirmar' : 'Pagamento em processamento'}
                </Text>
                <Text style={styles.text}>
                    {errorMessage
                        || 'Seu pagamento ainda não foi confirmado pelo Stripe. Se você concluiu a compra, o roteiro será liberado em instantes em Meus Roteiros.'}
                </Text>
                <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => {
                        confirmingRef.current = false;
                        setErrorMessage(null);
                        setState('checking');
                    }}
                >
                    <Text style={styles.primaryButtonText}>Verificar novamente</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryButton} onPress={backToItinerary}>
                    <Text style={styles.secondaryButtonText}>Voltar ao roteiro</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.title}>Confirmando pagamento...</Text>
            <Text style={styles.text}>
                Estamos validando sua compra com o Stripe. Isso leva só alguns segundos.
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 28,
        backgroundColor: theme.colors.background,
    },
    title: {
        marginTop: 14,
        fontSize: 18,
        fontWeight: '800',
        color: theme.colors.text.primary,
        textAlign: 'center',
    },
    text: {
        marginTop: 8,
        fontSize: 14,
        lineHeight: 20,
        color: theme.colors.text.secondary,
        textAlign: 'center',
    },
    primaryButton: {
        marginTop: 22,
        minHeight: 44,
        paddingHorizontal: 22,
        borderRadius: 999,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryButtonText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#fff',
    },
    secondaryButton: {
        marginTop: 12,
        minHeight: 44,
        paddingHorizontal: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.primary,
    },
});

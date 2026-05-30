import React, { useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    TextInput,
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getItineraryById } from '../../src/services/api';
import { theme } from '../../src/theme/theme';
import { useAuth } from '../../src/contexts/AuthContext';
import { getCoverImages } from '../../src/utils/itineraryMedia';
import { formatMoney } from '@vamo/shared/itinerary';

// Formata telefone BR (xx) xxxxx-xxxx; demais países: agrupa em blocos.
function formatPhone(digits: string, countryCode: string): string {
    const d = digits.replace(/\D/g, '').slice(0, 13);
    if (countryCode === '+55') {
        if (d.length <= 2) return d.length ? `(${d}` : '';
        if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
        if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
        return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
    }
    return d.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

function digitsOnly(s: string) {
    return (s || '').replace(/\D/g, '');
}

export default function ItineraryContactScreen() {
    const router = useRouter();
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();

    const params = useLocalSearchParams<{ itineraryId: string; price: string; source?: string }>();
    const itineraryId = Array.isArray(params.itineraryId) ? params.itineraryId[0] : params.itineraryId;
    const receivedPrice = Array.isArray(params.price) ? params.price[0] : params.price;
    const source = Array.isArray(params.source) ? params.source[0] : params.source;

    // ─── Auth gate: usuário precisa estar logado para comprar ──────
    useEffect(() => {
        if (authLoading) return;
        if (!isAuthenticated) {
            router.replace({
                pathname: '/login' as any,
                params: {
                    next: '/checkout/itinerary-contact',
                    ...(itineraryId ? { itineraryId } : {}),
                    ...(receivedPrice ? { price: receivedPrice } : {}),
                    ...(source === 'cart' ? { source } : {}),
                },
            });
        }
    }, [authLoading, isAuthenticated, itineraryId, receivedPrice, router, source]);

    // ─── Carregamento do roteiro ───────────────────────────────────
    const [itinerary, setItinerary] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            if (!itineraryId) {
                setLoadError('Roteiro inválido.');
                setLoading(false);
                return;
            }
            setLoading(true);
            setLoadError(null);
            try {
                const data = await getItineraryById(itineraryId);
                if (!mounted) return;
                if (!data) {
                    setItinerary(null);
                    setLoadError('Roteiro não encontrado ou indisponível.');
                    return;
                }
                setItinerary(data);
            } catch (error) {
                console.error('Error loading checkout itinerary:', error);
                if (!mounted) return;
                setItinerary(null);
                setLoadError('Não foi possível carregar o resumo da compra.');
            } finally {
                if (mounted) setLoading(false);
            }
        };
        load();
        return () => { mounted = false; };
    }, [itineraryId]);

    // ─── Form state ────────────────────────────────────────────────
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [countryCode, setCountryCode] = useState('+55');
    const [phone, setPhone] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [hydrated, setHydrated] = useState(false);

    // Pré-preenche com dados do usuário logado (editável)
    useEffect(() => {
        if (hydrated || !user) return;
        if (user.name) setFullName(user.name);
        if (user.email) setEmail(user.email);
        if (user.phone) {
            // Heurística: se phone começa com +, separa código de país; senão assume +55
            const raw = user.phone.trim();
            if (raw.startsWith('+')) {
                // separa +<1-3 dígitos> do resto
                const match = raw.match(/^\+(\d{1,3})\D*(.*)$/);
                if (match) {
                    setCountryCode(`+${match[1]}`);
                    setPhone(formatPhone(match[2], `+${match[1]}`));
                } else {
                    setPhone(formatPhone(raw, countryCode));
                }
            } else {
                setPhone(formatPhone(raw, countryCode));
            }
        }
        setHydrated(true);
    }, [user, hydrated, countryCode]);

    // ─── Cálculos derivados ────────────────────────────────────────
    const itineraryPrice = Number(itinerary?.price);
    const routePrice = Number(receivedPrice);
    const checkoutPrice =
        Number.isFinite(itineraryPrice) && itineraryPrice >= 0
            ? itineraryPrice
            : Number.isFinite(routePrice) && routePrice >= 0
            ? routePrice
            : 0;

    const destinationLabel = useMemo(() => {
        return [itinerary?.destination, itinerary?.country].filter(Boolean).join(', ') || 'Destino a confirmar';
    }, [itinerary]);

    const duration = Number(itinerary?.duration) || 0;
    const creatorName = itinerary?.creator?.name || 'Criador VAMO';

    const formattedPrice = checkoutPrice > 0
        ? formatMoney(checkoutPrice)
        : 'Grátis';

    const installment = checkoutPrice > 0
        ? `12x de ${formatMoney(checkoutPrice / 12)}`
        : null;

    const coverImage = useMemo(() => {
        if (!itinerary) return null;
        try {
            const covers = getCoverImages(itinerary);
            return covers?.[0] ?? null;
        } catch {
            return null;
        }
    }, [itinerary]);

    // ─── Validação ─────────────────────────────────────────────────
    const validateForm = () => {
        const nextErrors: Record<string, string> = {};
        const cleanName = fullName.trim().replace(/\s+/g, ' ');
        const cleanEmail = email.trim().toLowerCase();
        const phoneDigits = digitsOnly(phone);
        const countryDigits = digitsOnly(countryCode);

        if (cleanName.length < 5 || cleanName.split(' ').length < 2) {
            nextErrors.fullName = 'Informe nome e sobrenome.';
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail)) {
            nextErrors.email = 'Digite um e-mail válido.';
        }
        if (!countryDigits || countryDigits.length < 1 || countryDigits.length > 4) {
            nextErrors.countryCode = 'Código inválido.';
        }
        if (phoneDigits.length < 8) {
            nextErrors.phone = 'Informe um telefone válido.';
        }

        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return null;

        return {
            fullName: cleanName,
            email: cleanEmail,
            countryCode: countryCode.startsWith('+') ? countryCode : `+${countryDigits}`,
            phone: phoneDigits,
        };
    };

    const handleContinue = () => {
        if (submitting) return;
        const validated = validateForm();
        if (!validated || !itineraryId || !itinerary) return;

        setSubmitting(true);
        // Pequena espera pra dar feedback visual; o navegador remove a tela.
        router.push({
            pathname: `/checkout/itinerary-payment` as any,
            params: {
                itineraryId,
                price: checkoutPrice.toString(),
                fullName: validated.fullName,
                email: validated.email,
                countryCode: validated.countryCode,
                phone: validated.phone,
                ...(source === 'cart' ? { source } : {}),
            },
        });
        // garante reset caso o usuário volte
        setTimeout(() => setSubmitting(false), 600);
    };

    const cycleCountryCode = () => {
        // Toggle simples entre os códigos mais comuns. Sem modal extra agora.
        const cycle = ['+55', '+1', '+44', '+34', '+351', '+54'];
        const idx = cycle.indexOf(countryCode);
        const nextCC = cycle[(idx + 1) % cycle.length];
        setCountryCode(nextCC);
        // Re-formata o telefone com o novo país
        setPhone(formatPhone(digitsOnly(phone), nextCC));
        if (errors.countryCode) setErrors((prev) => ({ ...prev, countryCode: '' }));
    };

    // ─── Loading / error states ────────────────────────────────────
    if (authLoading || (!isAuthenticated && !user)) {
        return (
            <View style={styles.stateContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    if (loading) {
        return (
            <View style={styles.stateContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.stateTitle}>Carregando checkout...</Text>
                <Text style={styles.stateText}>Buscando os dados do roteiro escolhido.</Text>
            </View>
        );
    }

    if (!itinerary) {
        return (
            <View style={styles.stateContainer}>
                <Ionicons name="alert-circle-outline" size={42} color={theme.colors.text.tertiary} />
                <Text style={styles.stateTitle}>{loadError || 'Roteiro indisponível'}</Text>
                <Text style={styles.stateText}>
                    Não foi possível continuar a compra sem um roteiro válido.
                </Text>
                <TouchableOpacity style={styles.stateButton} onPress={() => router.replace('/(tabs)/itineraries' as any)}>
                    <Text style={styles.stateButtonText}>Explorar roteiros</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
                    <Ionicons name="chevron-back" size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>Compra de Roteiro</Text>
                    <Text style={styles.headerSubtitle}>Etapa 1 de 2 · Dados</Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={{ paddingBottom: 140 }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Stepper compacto */}
                    <View style={styles.stepper}>
                        <View style={[styles.stepPill, styles.stepPillActive]}>
                            <View style={[styles.stepDot, styles.stepDotActive]}>
                                <Text style={styles.stepDotTextActive}>1</Text>
                            </View>
                            <Text style={styles.stepPillTextActive}>Dados</Text>
                        </View>
                        <View style={styles.stepConnector} />
                        <View style={styles.stepPill}>
                            <View style={styles.stepDot}>
                                <Text style={styles.stepDotText}>2</Text>
                            </View>
                            <Text style={styles.stepPillText}>Pagamento</Text>
                        </View>
                    </View>

                    {/* Card resumo do roteiro */}
                    <View style={styles.productCard}>
                        <View style={styles.productCover}>
                            {coverImage ? (
                                <Image source={{ uri: coverImage }} style={styles.productCoverImage} />
                            ) : (
                                <View style={[styles.productCoverImage, styles.productCoverFallback]}>
                                    <Ionicons name="image-outline" size={28} color={theme.colors.text.tertiary} />
                                </View>
                            )}
                        </View>
                        <View style={styles.productInfo}>
                            <View style={styles.digitalChip}>
                                <Ionicons name="cloud-download-outline" size={11} color={theme.colors.primaryDark} />
                                <Text style={styles.digitalChipText}>Produto digital</Text>
                            </View>
                            <Text style={styles.productTitle} numberOfLines={2}>
                                {itinerary.title}
                            </Text>
                            <Text style={styles.productCreator} numberOfLines={1}>por {creatorName}</Text>
                            <View style={styles.productMetaRow}>
                                <View style={styles.productMetaItem}>
                                    <Ionicons name="location-outline" size={12} color={theme.colors.text.secondary} />
                                    <Text style={styles.productMetaText} numberOfLines={1}>{destinationLabel}</Text>
                                </View>
                                {duration > 0 && (
                                    <View style={styles.productMetaItem}>
                                        <Ionicons name="calendar-outline" size={12} color={theme.colors.text.secondary} />
                                        <Text style={styles.productMetaText}>{duration} dias</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={styles.productPrice}>{formattedPrice}</Text>
                        </View>
                    </View>

                    {/* Aviso produto digital */}
                    <View style={styles.digitalBadge}>
                        <View style={styles.digitalBadgeIcon}>
                            <Ionicons name="lock-closed-outline" size={16} color={theme.colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.digitalBadgeTitle}>Acesso imediato após confirmação</Text>
                            <Text style={styles.digitalBadgeDesc}>
                                O roteiro fica disponível em <Text style={{ fontWeight: '700' }}>Meus Roteiros</Text> assim que o pagamento for aprovado.
                            </Text>
                        </View>
                    </View>

                    {/* Formulário */}
                    <View style={styles.formCard}>
                        <Text style={styles.formTitle}>Dados para liberação</Text>
                        <Text style={styles.formSubtitle}>
                            Usamos seus dados apenas para identificar a compra e liberar o roteiro.
                        </Text>

                        {/* Nome */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Nome completo</Text>
                            <View style={[styles.inputWrapper, Boolean(errors.fullName) && styles.inputWrapperError]}>
                                <Ionicons name="person-outline" size={18} color={theme.colors.text.tertiary} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Seu nome completo"
                                    placeholderTextColor={theme.colors.text.tertiary}
                                    value={fullName}
                                    onChangeText={(value) => {
                                        setFullName(value);
                                        if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: '' }));
                                    }}
                                    autoCapitalize="words"
                                    textContentType="name"
                                />
                            </View>
                            {errors.fullName ? <Text style={styles.errorMessage}>{errors.fullName}</Text> : null}
                        </View>

                        {/* Email */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>E-mail</Text>
                            <View style={[styles.inputWrapper, Boolean(errors.email) && styles.inputWrapperError]}>
                                <Ionicons name="mail-outline" size={18} color={theme.colors.text.tertiary} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="seu@email.com"
                                    placeholderTextColor={theme.colors.text.tertiary}
                                    value={email}
                                    onChangeText={(value) => {
                                        setEmail(value);
                                        if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                                    }}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    textContentType="emailAddress"
                                />
                            </View>
                            {errors.email ? (
                                <Text style={styles.errorMessage}>{errors.email}</Text>
                            ) : (
                                <Text style={styles.inputHint}>Enviamos a confirmação e o recibo para este e-mail.</Text>
                            )}
                        </View>

                        {/* Telefone (código + número) */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Telefone</Text>
                            <View style={styles.phoneRow}>
                                <TouchableOpacity
                                    style={[styles.countrySelector, Boolean(errors.countryCode) && styles.inputWrapperError]}
                                    onPress={cycleCountryCode}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.countryFlag}>{countryCode === '+55' ? '🇧🇷' : countryCode === '+1' ? '🇺🇸' : countryCode === '+44' ? '🇬🇧' : countryCode === '+34' ? '🇪🇸' : countryCode === '+351' ? '🇵🇹' : countryCode === '+54' ? '🇦🇷' : '🌎'}</Text>
                                    <Text style={styles.countryCodeText}>{countryCode}</Text>
                                    <Ionicons name="chevron-down" size={14} color={theme.colors.text.secondary} />
                                </TouchableOpacity>
                                <View style={[styles.phoneInputWrapper, Boolean(errors.phone) && styles.inputWrapperError]}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder={countryCode === '+55' ? '(48) 99999-9999' : 'Número'}
                                        placeholderTextColor={theme.colors.text.tertiary}
                                        value={phone}
                                        onChangeText={(value) => {
                                            setPhone(formatPhone(value, countryCode));
                                            if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
                                        }}
                                        keyboardType="phone-pad"
                                        textContentType="telephoneNumber"
                                    />
                                </View>
                            </View>
                            {(errors.phone || errors.countryCode) ? (
                                <Text style={styles.errorMessage}>{errors.phone || errors.countryCode}</Text>
                            ) : null}
                        </View>
                    </View>

                    {/* Aviso sobre escopo do que está sendo comprado */}
                    <View style={styles.scopeNotice}>
                        <Ionicons name="information-circle-outline" size={14} color={theme.colors.text.secondary} />
                        <Text style={styles.scopeNoticeText}>
                            Este valor é referente ao roteiro digital. Não inclui passagens, hospedagens, passeios ou reservas — gastos de viagem mostrados no roteiro são apenas referências informativas.
                        </Text>
                    </View>
                </ScrollView>

                {/* Rodapé fixo */}
                <View style={styles.footer}>
                    <View style={styles.footerInfo}>
                        <Text style={styles.footerLabel}>Total</Text>
                        <Text style={styles.footerPrice}>{formattedPrice}</Text>
                        {installment ? <Text style={styles.footerInstallment}>{installment} sem juros</Text> : null}
                    </View>
                    <TouchableOpacity
                        style={[styles.continueButton, submitting && styles.continueButtonDisabled]}
                        onPress={handleContinue}
                        activeOpacity={0.85}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <Text style={styles.continueButtonText}>Ir para pagamento</Text>
                                <Ionicons name="arrow-forward" size={18} color="#fff" />
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingTop: 4,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.text.primary,
    },
    headerSubtitle: {
        fontSize: 11,
        color: theme.colors.text.secondary,
        marginTop: 2,
    },
    scrollView: {
        flex: 1,
    },

    // Stepper
    stepper: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        gap: 8,
    },
    stepPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: theme.colors.surfaceLight,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    stepPillActive: {
        backgroundColor: `${theme.colors.primary}14`,
        borderColor: `${theme.colors.primary}55`,
    },
    stepDot: {
        width: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.border,
    },
    stepDotActive: {
        backgroundColor: theme.colors.primary,
    },
    stepDotText: {
        fontSize: 11,
        fontWeight: '700',
        color: theme.colors.text.secondary,
    },
    stepDotTextActive: {
        fontSize: 11,
        fontWeight: '700',
        color: '#fff',
    },
    stepPillText: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.text.secondary,
    },
    stepPillTextActive: {
        fontSize: 13,
        fontWeight: '700',
        color: theme.colors.primaryDark,
    },
    stepConnector: {
        width: 16,
        height: 1.5,
        backgroundColor: theme.colors.border,
    },

    // Product card
    productCard: {
        flexDirection: 'row',
        marginHorizontal: 16,
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        padding: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 1,
    },
    productCover: {
        width: 92,
        height: 92,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: theme.colors.surfaceLight,
        marginRight: 12,
    },
    productCoverImage: {
        width: '100%',
        height: '100%',
    },
    productCoverFallback: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    productInfo: {
        flex: 1,
        minWidth: 0,
    },
    digitalChip: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 999,
        backgroundColor: `${theme.colors.primary}1A`,
        marginBottom: 6,
    },
    digitalChipText: {
        fontSize: 10,
        fontWeight: '700',
        color: theme.colors.primaryDark,
        letterSpacing: 0.2,
    },
    productTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 2,
    },
    productCreator: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        marginBottom: 6,
    },
    productMetaRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 6,
    },
    productMetaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    productMetaText: {
        fontSize: 11,
        color: theme.colors.text.secondary,
    },
    productPrice: {
        fontSize: 16,
        fontWeight: '800',
        color: theme.colors.text.primary,
        marginTop: 2,
    },

    // Digital badge
    digitalBadge: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 12,
        backgroundColor: `${theme.colors.primary}0F`,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: `${theme.colors.primary}33`,
    },
    digitalBadgeIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
    },
    digitalBadgeTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 2,
    },
    digitalBadgeDesc: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        lineHeight: 17,
    },

    // Form
    formCard: {
        marginHorizontal: 16,
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        padding: 16,
        marginBottom: 14,
    },
    formTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 4,
    },
    formSubtitle: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        marginBottom: 16,
        lineHeight: 17,
    },
    inputGroup: {
        marginBottom: 14,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.text.primary,
        marginBottom: 6,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surfaceLight,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: theme.colors.borderLight,
        paddingHorizontal: 12,
        height: 48,
    },
    inputWrapperError: {
        borderColor: theme.colors.error,
        backgroundColor: `${theme.colors.error}08`,
    },
    inputIcon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: theme.colors.text.primary,
        height: '100%',
        paddingVertical: 0,
    },
    inputHint: {
        marginTop: 5,
        fontSize: 11,
        color: theme.colors.text.tertiary,
    },
    errorMessage: {
        marginTop: 5,
        fontSize: 11.5,
        color: theme.colors.error,
        fontWeight: '600',
    },

    // Phone
    phoneRow: {
        flexDirection: 'row',
        gap: 8,
    },
    countrySelector: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        height: 48,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: theme.colors.borderLight,
        backgroundColor: theme.colors.surfaceLight,
    },
    countryFlag: {
        fontSize: 16,
    },
    countryCodeText: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.text.primary,
    },
    phoneInputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surfaceLight,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: theme.colors.borderLight,
        paddingHorizontal: 12,
        height: 48,
    },

    // Scope notice
    scopeNotice: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 6,
        marginHorizontal: 16,
        paddingHorizontal: 4,
        marginBottom: 8,
    },
    scopeNoticeText: {
        flex: 1,
        fontSize: 11,
        color: theme.colors.text.secondary,
        lineHeight: 15,
    },

    // Footer
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: Platform.OS === 'ios' ? 24 : 14,
        backgroundColor: theme.colors.surface,
        borderTopWidth: 1,
        borderTopColor: theme.colors.borderLight,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 6,
    },
    footerInfo: {
        flex: 1,
        minWidth: 0,
    },
    footerLabel: {
        fontSize: 11,
        color: theme.colors.text.secondary,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.4,
    },
    footerPrice: {
        fontSize: 22,
        fontWeight: '800',
        color: theme.colors.text.primary,
        marginTop: 1,
    },
    footerInstallment: {
        fontSize: 11,
        color: theme.colors.primaryDark,
        marginTop: 2,
        fontWeight: '600',
    },
    continueButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 22,
        height: 52,
        borderRadius: 14,
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
        minWidth: 170,
    },
    continueButtonDisabled: {
        opacity: 0.7,
    },
    continueButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },

    // State screens
    stateContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 28,
        backgroundColor: theme.colors.background,
    },
    stateTitle: {
        marginTop: 14,
        fontSize: 18,
        fontWeight: '800',
        color: theme.colors.text.primary,
        textAlign: 'center',
    },
    stateText: {
        marginTop: 8,
        fontSize: 14,
        lineHeight: 20,
        color: theme.colors.text.secondary,
        textAlign: 'center',
    },
    stateButton: {
        marginTop: 22,
        minHeight: 44,
        paddingHorizontal: 18,
        borderRadius: 999,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stateButtonText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#fff',
    },
});

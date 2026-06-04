import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Platform,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../theme/theme';
import { Icon } from '../../../components/common/Icons';
import { haptics } from '../../../services/haptics';
import { notify } from '../../../utils/notify';
import { EarningsBalanceCard } from './components/EarningsBalanceCard';
import { EarningsMetricCard } from './components/EarningsMetricCard';
import { PayoutSetupCard } from './components/PayoutSetupCard';
import { PayoutExplanationCard } from './components/PayoutExplanationCard';
import { EarningsTransactionItem } from './components/EarningsTransactionItem';
import { EarningsEmptyState } from './components/EarningsEmptyState';
import {
    mockCreatorEarningTransactions,
    mockCreatorEarningsSummary,
} from './mockData';
import type {
    CreatorEarningTransaction,
    CreatorEarningsSummary,
} from './types';
import { formatCurrencyAUD, formatShortDate } from './utils';

type LoadState = 'idle' | 'loading' | 'ready' | 'error';

// Placeholder for future Stripe Connect Express onboarding.
//
// Future integration:
// 1. Call backend endpoint to create or retrieve Stripe connected account
//    POST /api/creator/stripe/onboarding-link
// 2. Create Stripe onboarding link
// 3. Redirect creator to Stripe-hosted onboarding (in-app browser)
// 4. Refresh payout account status after return
//    GET /api/creator/stripe/account-status
function handleStartPayoutSetup() {
    notify({
        title: 'Payout setup',
        message: 'Payout setup will be available soon.',
    });
}

export default function EarningsScreen() {
    const router = useRouter();

    const [state, setState] = useState<LoadState>('loading');
    const [summary, setSummary] = useState<CreatorEarningsSummary | null>(null);
    const [transactions, setTransactions] = useState<CreatorEarningTransaction[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    // Simulates async fetch. Swap this block for real API calls when ready:
    //   GET /api/creator/earnings/summary
    //   GET /api/creator/earnings/transactions
    const loadEarnings = useCallback(async () => {
        try {
            await new Promise((resolve) => setTimeout(resolve, 350));
            setSummary(mockCreatorEarningsSummary);
            setTransactions(mockCreatorEarningTransactions);
            setState('ready');
        } catch {
            setState('error');
        }
    }, []);

    useEffect(() => {
        loadEarnings();
    }, [loadEarnings]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        haptics.light();
        await loadEarnings();
        setRefreshing(false);
    }, [loadEarnings]);

    const onRetry = useCallback(() => {
        setState('loading');
        loadEarnings();
    }, [loadEarnings]);

    const onPayoutSetup = useCallback(() => {
        haptics.medium();
        handleStartPayoutSetup();
    }, []);

    const onManagePayouts = useCallback(() => {
        haptics.light();
        handleStartPayoutSetup();
    }, []);

    const sortedTransactions = useMemo(
        () =>
            [...transactions].sort(
                (a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime(),
            ),
        [transactions],
    );

    const isLoading = state === 'loading' && !summary;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <Header onBack={() => router.back()} />

            {state === 'error' ? (
                <ErrorState onRetry={onRetry} />
            ) : isLoading ? (
                <LoadingState />
            ) : (
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={theme.colors.primary}
                            colors={[theme.colors.primary]}
                        />
                    }
                >
                    {/* 1. Hero balance */}
                    {summary && (
                        <View style={styles.heroWrap}>
                            <EarningsBalanceCard
                                availableBalance={summary.availableBalance}
                                onManagePayouts={onManagePayouts}
                            />
                        </View>
                    )}

                    {/* 2. Secondary metrics */}
                    {summary && (
                        <View style={styles.metricsRow}>
                            <EarningsMetricCard
                                icon="clock"
                                iconColor="#A16207"
                                iconBg="#F59E0B1F"
                                label="Pending balance"
                                value={formatCurrencyAUD(summary.pendingBalance)}
                                subtext="Sales under review or still within the protection period."
                            />
                            <EarningsMetricCard
                                icon="calendar"
                                iconColor={theme.colors.info}
                                iconBg={theme.colors.info + '14'}
                                label="Next payout"
                                value={formatShortDate(summary.nextPayoutDate)}
                                subtext="Estimated bank payout date."
                            />
                        </View>
                    )}

                    {summary && (
                        <View style={[styles.metricsRow, { marginTop: 12 }]}>
                            <EarningsMetricCard
                                icon="trophy"
                                iconColor="#15803D"
                                iconBg="#22C55E1F"
                                label="Total earned"
                                value={formatCurrencyAUD(summary.totalEarned)}
                                subtext="Since joining VAMO."
                            />
                            <EarningsMetricCard
                                icon="briefcase"
                                iconColor={theme.colors.primary}
                                label="Sales"
                                value={String(transactions.length)}
                                subtext={transactions.length === 1 ? '1 recorded sale.' : `${transactions.length} recorded sales.`}
                            />
                        </View>
                    )}

                    {/* 3. Payout setup */}
                    {summary && (
                        <View style={styles.section}>
                            <PayoutSetupCard
                                status={summary.payoutAccountStatus}
                                onPress={onPayoutSetup}
                            />
                        </View>
                    )}

                    {/* 4. Recent sales */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Recent sales</Text>
                            {transactions.length > 0 && (
                                <Text style={styles.sectionMeta}>
                                    {transactions.length} total
                                </Text>
                            )}
                        </View>

                        <View style={styles.salesCard}>
                            {sortedTransactions.length === 0 ? (
                                <EarningsEmptyState
                                    onViewItineraries={() => {
                                        haptics.light();
                                        router.push('/created-itineraries');
                                    }}
                                />
                            ) : (
                                sortedTransactions.map((tx, idx) => (
                                    <EarningsTransactionItem
                                        key={tx.id}
                                        transaction={tx}
                                        isLast={idx === sortedTransactions.length - 1}
                                    />
                                ))
                            )}
                        </View>
                    </View>

                    {/* 5. How payouts work */}
                    <View style={styles.section}>
                        <PayoutExplanationCard />
                    </View>

                    <View style={{ height: 32 }} />
                </ScrollView>
            )}
        </View>
    );
}

function Header({ onBack }: { onBack: () => void }) {
    return (
        <LinearGradient
            colors={['#1A3263', '#162A55']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
        >
            <View style={styles.headerTopRow}>
                <TouchableOpacity
                    onPress={onBack}
                    style={styles.backButton}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="Go back"
                    hitSlop={8}
                >
                    <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={styles.poweredByBadge}>
                    <Icon name="shield-check" size={11} color="#28C9BF" />
                    <Text style={styles.poweredByText}>Powered by Stripe</Text>
                </View>
            </View>

            <Text style={styles.headerTitle}>My Earnings</Text>
            <Text style={styles.headerSubtitle}>
                Track your itinerary sales, pending balance and upcoming payouts.
            </Text>
        </LinearGradient>
    );
}

function LoadingState() {
    return (
        <View style={styles.centerFill}>
            <ActivityIndicator color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading your earnings…</Text>
        </View>
    );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
    return (
        <View style={styles.centerFill}>
            <View style={styles.errorIcon}>
                <Icon name="info" size={26} color={theme.colors.error} />
            </View>
            <Text style={styles.errorTitle}>We couldn’t load your earnings right now.</Text>
            <Text style={styles.errorText}>Please check your connection and try again.</Text>
            <TouchableOpacity
                style={styles.retryCta}
                onPress={onRetry}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Try again"
            >
                <Text style={styles.retryCtaText}>Try again</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.surfaceLight,
    },
    header: {
        paddingTop: Platform.OS === 'ios' ? 56 : 36,
        paddingBottom: 24,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
    },
    backButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.12)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    poweredByBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 999,
        backgroundColor: 'rgba(40,201,191,0.16)',
        borderWidth: 1,
        borderColor: 'rgba(40,201,191,0.35)',
    },
    poweredByText: {
        fontSize: 10.5,
        fontWeight: '700',
        color: '#A7F0EB',
        letterSpacing: 0.4,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 13.5,
        color: 'rgba(255,255,255,0.75)',
        lineHeight: 19,
        marginTop: 6,
    },

    scrollContent: {
        paddingTop: 16,
        paddingBottom: 24,
    },
    heroWrap: {
        paddingHorizontal: 20,
    },
    metricsRow: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 20,
        marginTop: 16,
    },
    section: {
        marginTop: 22,
        paddingHorizontal: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        marginBottom: 10,
        paddingHorizontal: 4,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.text.tertiary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    sectionMeta: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.text.tertiary,
    },
    salesCard: {
        backgroundColor: theme.colors.background,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        overflow: 'hidden',
        ...theme.shadows.small,
    },

    centerFill: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
        gap: 12,
    },
    loadingText: {
        fontSize: 13,
        color: theme.colors.text.secondary,
    },
    errorIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: theme.colors.error + '14',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    errorTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: theme.colors.text.primary,
        textAlign: 'center',
    },
    errorText: {
        fontSize: 13,
        color: theme.colors.text.secondary,
        textAlign: 'center',
    },
    retryCta: {
        marginTop: 6,
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 22,
        paddingVertical: 12,
        borderRadius: 999,
        ...theme.shadows.button,
    },
    retryCtaText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
    },
});

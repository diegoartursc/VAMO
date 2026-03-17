import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Animated,
    Dimensions,
    Alert,
    ActivityIndicator,
    Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { theme } from '../../src/theme/theme';
import {
    getDaysUntil,
    formatMonthYear,
    formatDate,
    BookedPackage,
    PurchasedItineraryItem,
    SavedItem,
    BookingStatus,
} from '../../src/data/mockMyTrips';
import { getMyTrips } from '../../src/services/api';
import { Icon, IconName } from '../../src/components/common/Icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Tab definitions ────────────────────────────────────

type TabKey = 'upcoming' | 'past' | 'itineraries' | 'saved';

interface TabDef {
    key: TabKey;
    label: string;
    icon: string;
}

const TABS: TabDef[] = [
    { key: 'upcoming', label: 'Meus Pacotes', icon: 'briefcase' },
    { key: 'itineraries', label: 'Meus Roteiros', icon: 'book-open' },
    { key: 'saved', label: 'Salvos', icon: 'heart' },
    { key: 'past', label: 'Realizados', icon: 'trips' },
];

// ─── Status helpers ─────────────────────────────────────

const STATUS_CONFIG: Record<BookingStatus, { label: string; color: string; bg: string }> = {
    confirmed: { label: 'Confirmado', color: '#16A34A', bg: '#DCFCE7' },
    pending_payment: { label: 'Aguardando pagamento', color: '#D97706', bg: '#FEF3C7' },
    cancelled: { label: 'Cancelado', color: '#DC2626', bg: '#FEE2E2' },
};

// ─── Main Component ─────────────────────────────────────

const TRAVELER_ID = 'trav-diego'; // Hardcoded until auth is implemented

export default function MyTripsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const [activeTab, setActiveTab] = useState<TabKey>('upcoming');
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<{
        upcomingPackages: BookedPackage[];
        pastPackages: BookedPackage[];
        purchasedItineraries: PurchasedItineraryItem[];
        savedItems: SavedItem[];
    }>({ upcomingPackages: [], pastPackages: [], purchasedItineraries: [], savedItems: [] });

    useEffect(() => {
        if (params.tab && TABS.some(t => t.key === params.tab)) {
            setActiveTab(params.tab as TabKey);
        }
    }, [params.tab]);

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        getMyTrips(TRAVELER_ID).then((result) => {
            if (mounted) {
                setData(result);
                setLoading(false);
            }
        });
        return () => { mounted = false; };
    }, []);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Minhas Viagens</Text>
                <Text style={styles.headerSubtitle}>
                    Suas viagens, roteiros e favoritos
                </Text>
            </View>

            {/* Tab Bar */}
            <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Content */}
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {loading ? (
                    <View style={styles.emptyState}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                    </View>
                ) : (
                    <>
                        {activeTab === 'upcoming' && <UpcomingTab items={data.upcomingPackages} />}
                        {activeTab === 'itineraries' && <ItinerariesTab items={data.purchasedItineraries} />}
                        {activeTab === 'saved' && <SavedTab items={data.savedItems} />}
                        {activeTab === 'past' && <PastTab items={data.pastPackages} />}
                    </>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

// ─── Tab Bar ────────────────────────────────────────────

function TabBar({ activeTab, onTabChange }: { activeTab: TabKey; onTabChange: (t: TabKey) => void }) {
    return (
        <View style={styles.tabBarContainer}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tabBarScroll}
            >
                {TABS.map((tab) => {
                    const isActive = activeTab === tab.key;
                    return (
                        <TouchableOpacity
                            key={tab.key}
                            style={[styles.tabItem, isActive && styles.tabItemActive]}
                            onPress={() => onTabChange(tab.key)}
                            activeOpacity={0.7}
                        >
                            <Icon name={tab.icon as IconName} size={14} color={isActive ? theme.colors.primary : theme.colors.text.tertiary} />
                            <Text
                                style={[
                                    styles.tabLabel,
                                    isActive && styles.tabLabelActive,
                                ]}
                            >
                                {tab.label}
                            </Text>
                            {isActive && <View style={styles.tabUnderline} />}
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
}

// ─── Empty State Component ──────────────────────────────

function EmptyState({
    icon,
    title,
    message,
    ctaLabel,
    onCtaPress,
}: {
    icon: string;
    title: string;
    message: string;
    ctaLabel?: string;
    onCtaPress?: () => void;
}) {
    return (
        <View style={styles.emptyState}>
            <Icon name={icon as IconName} size={40} color={theme.colors.text.tertiary} />
            <Text style={styles.emptyTitle}>{title}</Text>
            <Text style={styles.emptyText}>{message}</Text>
            {ctaLabel && onCtaPress && (
                <TouchableOpacity style={styles.emptyButton} onPress={onCtaPress}>
                    <Text style={styles.emptyButtonText}>{ctaLabel}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

// ─── Section Header (Month Grouping) ────────────────────

function SectionHeader({ title }: { title: string }) {
    return (
        <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLine} />
            <Text style={styles.sectionHeaderText}>{title.toUpperCase()}</Text>
            <View style={styles.sectionHeaderLine} />
        </View>
    );
}

// ─── Status Badge ───────────────────────────────────────

function StatusBadge({ status }: { status: BookingStatus }) {
    const config = STATUS_CONFIG[status];
    return (
        <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: config.color }]} />
            <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
        </View>
    );
}

// ─── Countdown Badge ────────────────────────────────────

function CountdownBadge({ days }: { days: number }) {
    if (days <= 0) return null;
    const isUrgent = days <= 7;
    return (
        <View style={[styles.countdownBadge, isUrgent && styles.countdownBadgeUrgent]}>
            <Icon
                name="clock"
                size={12}
                color={isUrgent ? '#DC2626' : theme.colors.primary}
            />
            <Text style={[styles.countdownText, isUrgent && styles.countdownTextUrgent]}>
                {days === 1 ? 'Amanhã!' : `Faltam ${days} dias`}
            </Text>
        </View>
    );
}

// ─── Action Button ──────────────────────────────────────

function ActionButton({
    label,
    icon,
    onPress,
    variant = 'outline',
}: {
    label: string;
    icon: string;
    onPress: () => void;
    variant?: 'primary' | 'outline';
}) {
    return (
        <TouchableOpacity
            style={[
                styles.actionButton,
                variant === 'primary' && styles.actionButtonPrimary,
            ]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <Icon
                name={icon as IconName}
                size={14}
                color={variant === 'primary' ? '#FFF' : theme.colors.primary}
            />
            <Text
                style={[
                    styles.actionButtonText,
                    variant === 'primary' && styles.actionButtonTextPrimary,
                ]}
            >
                {label}
            </Text>
        </TouchableOpacity>
    );
}

// ─── TAB: Próximas ──────────────────────────────────────

function UpcomingTab({ items }: { items: BookedPackage[] }) {
    const router = useRouter();

    if (items.length === 0) {
        return (
            <EmptyState
                icon="plane"
                title="Você ainda não tem viagens agendadas"
                message="Que tal planejar a sua próxima aventura?"
                ctaLabel="Explorar pacotes"
                onCtaPress={() => router.push('/(tabs)/packages')}
            />
        );
    }

    // Group by month/year
    const grouped = useMemo(() => {
        const map = new Map<string, BookedPackage[]>();
        items
            .sort((a, b) => new Date(a.travelDate).getTime() - new Date(b.travelDate).getTime())
            .forEach((pkg) => {
                const key = formatMonthYear(pkg.travelDate);
                if (!map.has(key)) map.set(key, []);
                map.get(key)!.push(pkg);
            });
        return Array.from(map.entries());
    }, [items]);

    return (
        <>
            {grouped.map(([month, packages]) => (
                <View key={month}>
                    <SectionHeader title={month} />
                    {packages.map((pkg) => (
                        <UpcomingCard
                            key={pkg.id}
                            pkg={pkg}
                            onPress={() => router.push(`/purchased-package/${pkg.id}`)}
                        />
                    ))}
                </View>
            ))}
        </>
    );
}

function UpcomingCard({ pkg, onPress }: { pkg: BookedPackage; onPress: () => void }) {
    const days = getDaysUntil(pkg.travelDate);

    return (
        <TouchableOpacity style={styles.upcomingCard} onPress={onPress} activeOpacity={0.7}>
            <Image source={{ uri: pkg.image }} style={styles.upcomingImage} />
            <View style={styles.upcomingContent}>
                <View style={styles.upcomingTop}>
                    <Text style={styles.upcomingTitle} numberOfLines={1}>{pkg.title}</Text>
                    <Text style={styles.upcomingDestination} numberOfLines={1}>
                        {pkg.destination}, {pkg.country}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Icon name="calendar" size={11} color={theme.colors.text.tertiary} />
                        <Text style={styles.upcomingDate}>
                            {formatDate(pkg.travelDate)}
                        </Text>
                    </View>
                </View>

                <View style={styles.upcomingBottom}>
                    <StatusBadge status={pkg.status} />
                    {days > 0 && <CountdownBadge days={days} />}
                </View>

                <View style={[styles.upcomingActions, { flexWrap: 'wrap' }]}>
                    <ActionButton
                        label="Detalhes"
                        icon="eye"
                        onPress={onPress}
                        variant="primary"
                    />
                    {pkg.voucherUrl && (
                        <ActionButton
                            label="Voucher"
                            icon="download"
                            onPress={() => Linking.openURL(pkg.voucherUrl!)}
                        />
                    )}
                    {pkg.eticketUrl && (
                        <ActionButton
                            label="Passagens"
                            icon="file-text"
                            onPress={() => Linking.openURL(pkg.eticketUrl!)}
                        />
                    )}
                    {pkg.autoMessage && (
                        <ActionButton
                            label="Aviso"
                            icon="message-circle"
                            onPress={() => Alert.alert('Mensagem da Agência', pkg.autoMessage)}
                        />
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
}

// ─── TAB: Realizadas ────────────────────────────────────

function PastTab({ items }: { items: BookedPackage[] }) {
    const router = useRouter();

    if (items.length === 0) {
        return (
            <EmptyState
                icon="briefcase"
                title="Nenhuma viagem realizada"
                message="Suas viagens concluídas aparecerão aqui."
            />
        );
    }

    return (
        <>
            {items.map((pkg) => (
                <PastCard key={pkg.id} pkg={pkg} />
            ))}
        </>
    );
}

function PastCard({ pkg }: { pkg: BookedPackage }) {
    const router = useRouter();

    return (
        <TouchableOpacity
            style={styles.pastCard}
            onPress={() => router.push(`/purchased-package/${pkg.id}`)}
            activeOpacity={0.7}
        >
            <Image source={{ uri: pkg.image }} style={styles.pastImage} />
            <View style={styles.pastContent}>
                <Text style={styles.pastTitle} numberOfLines={1}>{pkg.title}</Text>
                <Text style={styles.pastDestination} numberOfLines={1}>
                    {pkg.destination}, {pkg.country}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Icon name="calendar" size={11} color={theme.colors.text.tertiary} />
                    <Text style={styles.pastDate}>
                        {formatDate(pkg.travelDate)}
                    </Text>
                </View>

                <View style={styles.pastActions}>
                    <ActionButton
                        label="Avaliar"
                        icon="star"
                        onPress={() => Alert.alert('Avaliação', 'Em breve você poderá avaliar!')}
                        variant="primary"
                    />
                    <ActionButton
                        label="Detalhes"
                        icon="eye"
                        onPress={() => router.push(`/purchased-package/${pkg.id}`)}
                    />
                    <ActionButton
                        label="Repetir"
                        icon="refresh"
                        onPress={() => router.push(`/purchased-package/${pkg.id}`)}
                    />
                </View>
            </View>
        </TouchableOpacity>
    );
}

// ─── TAB: Meus Roteiros ─────────────────────────────────

function ItinerariesTab({ items }: { items: PurchasedItineraryItem[] }) {
    const router = useRouter();

    if (items.length === 0) {
        return (
            <EmptyState
                icon="book-open"
                title="Você ainda não comprou nenhum roteiro"
                message="Descubra roteiros criados por viajantes experientes."
                ctaLabel="Explorar roteiros"
                onCtaPress={() => router.push('/(tabs)/itineraries')}
            />
        );
    }

    return (
        <>
            {items.map((itin) => (
                <ItineraryCard key={itin.id} itin={itin} />
            ))}
        </>
    );
}

function ItineraryCard({ itin }: { itin: PurchasedItineraryItem }) {
    const router = useRouter();

    return (
        <TouchableOpacity
            style={styles.itineraryCard}
            onPress={() => router.push(`/purchased-itinerary/${itin.id}`)}
            activeOpacity={0.7}
        >
            <View style={styles.itineraryLeft}>
                <Image source={{ uri: itin.image }} style={styles.itineraryImage} />
            </View>
            <View style={styles.itineraryContent}>
                <Text style={styles.itineraryTitle} numberOfLines={1}>{itin.title}</Text>
                <Text style={styles.itineraryDestination} numberOfLines={1}>
                    {itin.destination}, {itin.country}
                </Text>
                <View style={styles.itineraryCreatorRow}>
                    <Icon name="circle-user" size={16} color={theme.colors.text.secondary} />
                    <Text style={styles.itineraryCreatorName}>{itin.creatorName}</Text>
                </View>
                <Text style={styles.itineraryPurchaseDate}>
                    Comprado em {formatDate(itin.purchaseDate)}
                </Text>
            </View>
            <View style={styles.itineraryAction}>
                <Icon name="chevron-right" size={20} color={theme.colors.text.tertiary} />
            </View>
        </TouchableOpacity>
    );
}

// ─── TAB: Salvos ────────────────────────────────────────

function SavedTab({ items }: { items: SavedItem[] }) {
    const router = useRouter();

    if (items.length === 0) {
        return (
            <EmptyState
                icon="heart"
                title="Você ainda não salvou nenhuma viagem"
                message="Explore nossos pacotes e roteiros e salve seus favoritos!"
                ctaLabel="Explorar"
                onCtaPress={() => router.push('/(tabs)/packages')}
            />
        );
    }

    return (
        <>
            {items.map((item) => (
                <SavedCard key={item.id} item={item} />
            ))}
        </>
    );
}

function SavedCard({ item }: { item: SavedItem }) {
    const router = useRouter();
    const isPackage = item.type === 'package';

    return (
        <TouchableOpacity
            style={styles.savedCard}
            onPress={() =>
                router.push(isPackage ? `/package/${item.id}` : `/itinerary/${item.id}`)
            }
            activeOpacity={0.7}
        >
            <View style={styles.savedImageContainer}>
                <Image source={{ uri: item.image }} style={styles.savedImage} />
                <View style={[styles.savedTypeBadge, isPackage ? styles.savedTypePkg : styles.savedTypeItin]}>
                    <Text style={styles.savedTypeBadgeText}>
                        {isPackage ? 'Pacote' : 'Roteiro'}
                    </Text>
                </View>
            </View>
            <View style={styles.savedContent}>
                <Text style={styles.savedTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.savedDestination} numberOfLines={1}>
                    {item.destination}, {item.country}
                </Text>
                <Text style={styles.savedPrice}>
                    {isPackage
                        ? `A partir de R$ ${item.price.toLocaleString('pt-BR')}`
                        : `R$ ${item.price.toFixed(2).replace('.', ',')}`
                    }
                </Text>
            </View>
            <View style={styles.savedAction}>
                <Icon name="chevron-right" size={20} color={theme.colors.text.tertiary} />
            </View>
        </TouchableOpacity>
    );
}

// ─── Styles ─────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },

    // ── Header ──
    header: {
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 16,
        backgroundColor: theme.colors.background,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: theme.colors.text.tertiary,
    },

    // ── Tab Bar ──
    tabBarContainer: {
        backgroundColor: theme.colors.background,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    tabBarScroll: {
        paddingHorizontal: 16,
        gap: 4,
    },
    tabItem: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        position: 'relative',
    },
    tabItemActive: {},
    tabIcon: {
        fontSize: 14,
    },
    tabLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: theme.colors.text.tertiary,
    },
    tabLabelActive: {
        color: theme.colors.primary,
        fontWeight: '700',
    },
    tabUnderline: {
        position: 'absolute',
        bottom: 0,
        left: 8,
        right: 8,
        height: 3,
        backgroundColor: theme.colors.primary,
        borderTopLeftRadius: 3,
        borderTopRightRadius: 3,
    },

    // ── Content ──
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 16,
    },

    // ── Section Header ──
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 16,
        gap: 12,
    },
    sectionHeaderLine: {
        flex: 1,
        height: 1,
        backgroundColor: theme.colors.borderLight,
    },
    sectionHeaderText: {
        fontSize: 11,
        fontWeight: '700',
        color: theme.colors.text.tertiary,
        letterSpacing: 1.5,
    },

    // ── Status Badge ──
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 100,
        gap: 4,
        alignSelf: 'flex-start',
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '600',
    },

    // ── Countdown Badge ──
    countdownBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 100,
        backgroundColor: 'rgba(40, 201, 191, 0.1)',
        alignSelf: 'flex-start',
    },
    countdownBadgeUrgent: {
        backgroundColor: '#FEE2E2',
    },
    countdownText: {
        fontSize: 10,
        fontWeight: '600',
        color: theme.colors.primary,
    },
    countdownTextUrgent: {
        color: '#DC2626',
    },

    // ── Action Button ──
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    actionButtonPrimary: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    actionButtonText: {
        fontSize: 11,
        fontWeight: '600',
        color: theme.colors.primary,
    },
    actionButtonTextPrimary: {
        color: '#FFF',
    },

    // ── Upcoming Card ──
    upcomingCard: {
        flexDirection: 'row',
        backgroundColor: theme.colors.background,
        borderRadius: 16,
        marginBottom: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        ...theme.shadows.small,
    },
    upcomingImage: {
        width: 96,
        height: 'auto',
        minHeight: 140,
        backgroundColor: theme.colors.surfaceLight,
    },
    upcomingContent: {
        flex: 1,
        padding: 12,
        justifyContent: 'space-between',
    },
    upcomingTop: {
        marginBottom: 8,
    },
    upcomingTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 2,
    },
    upcomingDestination: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        marginBottom: 2,
    },
    upcomingDate: {
        fontSize: 11,
        color: theme.colors.text.tertiary,
    },
    upcomingBottom: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
        flexWrap: 'wrap',
    },
    upcomingActions: {
        flexDirection: 'row',
        gap: 8,
    },

    // ── Past Card ──
    pastCard: {
        flexDirection: 'row',
        backgroundColor: theme.colors.background,
        borderRadius: 16,
        marginBottom: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        ...theme.shadows.small,
    },
    pastImage: {
        width: 96,
        height: 'auto',
        minHeight: 140,
        backgroundColor: theme.colors.surfaceLight,
    },
    pastContent: {
        flex: 1,
        padding: 12,
        justifyContent: 'center',
    },
    pastTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 2,
    },
    pastDestination: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        marginBottom: 2,
    },
    pastDate: {
        fontSize: 11,
        color: theme.colors.text.tertiary,
        marginBottom: 10,
    },
    pastActions: {
        flexDirection: 'row',
        gap: 6,
        flexWrap: 'wrap',
    },

    // ── Itinerary Card ──
    itineraryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
        borderRadius: 14,
        marginBottom: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        ...theme.shadows.xs,
    },
    itineraryLeft: {
        marginRight: 12,
    },
    itineraryImage: {
        width: 56,
        height: 56,
        borderRadius: 12,
        backgroundColor: theme.colors.surfaceLight,
    },
    itineraryContent: {
        flex: 1,
    },
    itineraryTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text.primary,
        marginBottom: 2,
    },
    itineraryDestination: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        marginBottom: 4,
    },
    itineraryCreatorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 2,
    },
    itineraryCreatorAvatar: {
        fontSize: 12,
    },
    itineraryCreatorName: {
        fontSize: 11,
        color: theme.colors.text.tertiary,
        fontWeight: '500',
    },
    itineraryPurchaseDate: {
        fontSize: 10,
        color: theme.colors.text.tertiary,
    },
    itineraryAction: {
        paddingLeft: 8,
    },

    // ── Saved Card ──
    savedCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
        borderRadius: 14,
        marginBottom: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        ...theme.shadows.xs,
    },
    savedImageContainer: {
        position: 'relative',
    },
    savedImage: {
        width: 80,
        height: 80,
        backgroundColor: theme.colors.surfaceLight,
    },
    savedTypeBadge: {
        position: 'absolute',
        top: 4,
        left: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    savedTypePkg: {
        backgroundColor: 'rgba(40, 201, 191, 0.9)',
    },
    savedTypeItin: {
        backgroundColor: 'rgba(26, 50, 99, 0.85)',
    },
    savedTypeBadgeText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#FFF',
    },
    savedContent: {
        flex: 1,
        padding: 12,
    },
    savedTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text.primary,
        marginBottom: 2,
    },
    savedDestination: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        marginBottom: 4,
    },
    savedPrice: {
        fontSize: 13,
        fontWeight: '700',
        color: theme.colors.primary,
    },
    savedAction: {
        paddingRight: 12,
    },

    // ── Empty State ──
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
        paddingHorizontal: 40,
    },
    emptyIcon: {
        fontSize: 56,
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 8,
        textAlign: 'center',
    },
    emptyText: {
        fontSize: 14,
        color: theme.colors.text.tertiary,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    emptyButton: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 28,
        paddingVertical: 14,
        borderRadius: 100,
        ...theme.shadows.button,
    },
    emptyButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFF',
    },
});

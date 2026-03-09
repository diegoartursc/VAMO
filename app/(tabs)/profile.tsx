import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Modal, Linking, Platform, Alert, Dimensions, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { theme } from '../../src/theme/theme';
import { haptics } from '../../src/services/haptics';
import { Icon, IconName } from '../../src/components/common/Icons';

const { width } = Dimensions.get('window');

const CURRENCIES = ['(€) Euro', '(R$) Real', '($) Dólar', '(£) Libra'];
const LANGUAGES = ['português', 'english', 'español'];
const APPEARANCES = ['Predefinida pelo sistema', 'Claro', 'Escuro'];

const TRAVEL_TYPES = ['Luxo', 'Econômico', 'Mochilão', 'Família', 'Romântico', 'Aventura'];
const BUDGET_RANGES = ['Até R$ 2.000', 'R$ 2.000 – 5.000', 'R$ 5.000 – 10.000', 'R$ 10.000+'];
const INTEREST_OPTIONS = [
    { id: 'natureza', icon: 'trees' as IconName, label: 'Natureza' },
    { id: 'cultura', icon: 'landmark' as IconName, label: 'Cultura' },
    { id: 'gastronomia', icon: 'utensils' as IconName, label: 'Gastronomia' },
    { id: 'aventura', icon: 'mountain' as IconName, label: 'Aventura' },
    { id: 'praia', icon: 'compass' as IconName, label: 'Praia' },
    { id: 'compras', icon: 'briefcase' as IconName, label: 'Compras' },
    { id: 'vida_noturna', icon: 'star' as IconName, label: 'Vida Noturna' },
    { id: 'religiao', icon: 'landmark' as IconName, label: 'Religião' },
];

// Mock user data — will be replaced by auth context
const USER = {
    name: 'Usuário',
    email: 'usuario@email.com',
    avatar: 'circle-user',
    since: '2026',
    stats: { trips: 3, itineraries: 2, saved: 7 },
    destinations: 3,
    createdItineraries: 2,
    nextTrip: {
        destination: 'Paris',
        date: '15 Mar 2026',
        status: 'Confirmado',
    } as { destination: string; date: string; status: string } | null,
};

// Milestones for "Sua Jornada"
const MILESTONES = [
    { id: 'first_trip', label: 'Primeira viagem realizada', done: USER.stats.trips > 0 },
    { id: 'first_itinerary', label: 'Primeiro roteiro criado', done: USER.stats.itineraries > 0 },
    { id: 'five_destinations', label: '5 destinos visitados', done: USER.destinations >= 5 },
    { id: 'first_review', label: 'Primeira avaliação', done: true },
    { id: 'ten_saved', label: '10 viagens salvas', done: USER.stats.saved >= 10 },
];

export default function ProfileScreen() {
    const router = useRouter();
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const [currency, setCurrency] = useState('(R$) Real');
    const [language, setLanguage] = useState('português');
    const [appearance, setAppearance] = useState('Predefinida pelo sistema');
    const [travelType, setTravelType] = useState('Aventura');
    const [budget, setBudget] = useState('R$ 2.000 – 5.000');
    const [selectedInterests, setSelectedInterests] = useState<string[]>(['cultura', 'gastronomia']);

    // Modal states
    const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
    const [showLanguagePicker, setShowLanguagePicker] = useState(false);
    const [showAppearancePicker, setShowAppearancePicker] = useState(false);
    const [showTravelTypePicker, setShowTravelTypePicker] = useState(false);
    const [showBudgetPicker, setShowBudgetPicker] = useState(false);
    const [showInterestsPicker, setShowInterestsPicker] = useState(false);
    const [showAboutModal, setShowAboutModal] = useState(false);
    const [showHowItWorksModal, setShowHowItWorksModal] = useState(false);

    // Fade in on mount
    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
        }).start();
    }, []);

    const handleRateApp = () => {
        haptics.success();
        const storeUrl = Platform.OS === 'ios'
            ? 'https://apps.apple.com/app/id1234567890'
            : 'https://play.google.com/store/apps/details?id=com.vamo';
        Linking.openURL(storeUrl);
    };

    const handleLogout = () => {
        haptics.warning();
        Alert.alert('Sair da conta', 'Tem certeza que deseja sair?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Sair', style: 'destructive',
                onPress: () => { haptics.success(); Alert.alert('Pronto', 'Você saiu da sua conta.'); },
            },
        ]);
    };

    const handleStatPress = (type: 'trips' | 'itineraries' | 'saved') => {
        haptics.light();
        if (USER.stats[type] === 0) {
            const messages: Record<string, string> = {
                trips: 'Você ainda não realizou nenhuma viagem.',
                itineraries: 'Você ainda não criou nenhum roteiro.',
                saved: 'Você ainda não salvou nenhum item.',
            };
            Alert.alert('Nada aqui ainda', messages[type], [
                { text: 'Explorar', onPress: () => router.push('/(tabs)/packages') },
                { text: 'OK' },
            ]);
        } else {
            router.push('/(tabs)/my-trips');
        }
    };

    const toggleInterest = (id: string) => {
        setSelectedInterests(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const completedMilestones = MILESTONES.filter(m => m.done).length;

    return (
        <View style={styles.container}>
            <Animated.ScrollView
                showsVerticalScrollIndicator={false}
                style={{ opacity: fadeAnim }}
            >
                {/* ══════════ 1. GRADIENT HEADER ══════════ */}
                <LinearGradient
                    colors={theme.colors.gradients.institutional as unknown as [string, string]}
                    style={styles.header}
                >
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatarCircle}>
                            <Icon name={USER.avatar as IconName} size={40} color="#FFFFFF" />
                        </View>
                        <TouchableOpacity style={styles.editAvatarButton} onPress={() => {
                            haptics.light();
                            Alert.alert('📸 Foto de perfil', 'A personalização da foto de perfil estará disponível em breve!');
                        }}>
                            <Icon name="edit" size={12} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.userName}>{USER.name}</Text>
                    <Text style={styles.userEmail}>{USER.email}</Text>
                    <View style={styles.sinceBadge}>
                        <Icon name="calendar" size={12} color="rgba(255,255,255,0.8)" />
                        <Text style={styles.sinceText}>Viajante desde {USER.since}</Text>
                    </View>

                    {/* Traveler Identity Line */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8 }}>
                        <Icon name="globe" size={13} color="rgba(255,255,255,0.7)" />
                        <Text style={styles.identityLine}>
                            {USER.destinations} destinos visitados
                        </Text>
                        <Text style={{ color: 'rgba(255,255,255,0.5)' }}>•</Text>
                        <Icon name="map" size={13} color="rgba(255,255,255,0.7)" />
                        <Text style={styles.identityLine}>
                            {USER.createdItineraries} roteiros criados
                        </Text>
                    </View>
                </LinearGradient>

                {/* ══════════ 2. QUICK STATS ══════════ */}
                <View style={styles.statsRow}>
                    <TouchableOpacity style={styles.statCard} onPress={() => handleStatPress('trips')}>
                        <Icon name="briefcase" size={22} color={theme.colors.primary} />
                        <Text style={styles.statValue}>{USER.stats.trips}</Text>
                        <Text style={styles.statLabel}>Meus Pacotes</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.statCard} onPress={() => handleStatPress('itineraries')}>
                        <Icon name="book-open" size={22} color={theme.colors.primary} />
                        <Text style={styles.statValue}>{USER.stats.itineraries}</Text>
                        <Text style={styles.statLabel}>Meus Roteiros</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.statCard} onPress={() => handleStatPress('saved')}>
                        <Icon name="heart" size={22} color={theme.colors.primary} />
                        <Text style={styles.statValue}>{USER.stats.saved}</Text>
                        <Text style={styles.statLabel}>Salvos</Text>
                    </TouchableOpacity>
                </View>

                {/* ══════════ 8. PRÓXIMA VIAGEM ══════════ */}
                <View style={styles.sectionSpaced}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Icon name="plane" size={16} color={theme.colors.primary} />
                        <Text style={styles.sectionTitle}>Próxima Viagem</Text>
                    </View>
                    <View style={styles.sectionCard}>
                        {USER.nextTrip ? (
                            <TouchableOpacity
                                style={styles.nextTripContent}
                                onPress={() => router.push('/(tabs)/my-trips')}
                                activeOpacity={0.7}
                            >
                                <View style={styles.nextTripLeft}>
                                    <Text style={styles.nextTripDestination}>{USER.nextTrip.destination}</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                        <Icon name="calendar" size={11} color={theme.colors.text.tertiary} />
                                        <Text style={styles.nextTripDate}>{USER.nextTrip.date}</Text>
                                    </View>
                                </View>
                                <View style={styles.nextTripStatusBadge}>
                                    <View style={styles.statusDot} />
                                    <Text style={styles.nextTripStatus}>{USER.nextTrip.status}</Text>
                                </View>
                                <Icon name="chevron-right" size={18} color={theme.colors.text.tertiary} />
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.nextTripEmpty}>
                                <Icon name="plane" size={28} color={theme.colors.text.tertiary} />
                                <Text style={styles.nextTripEmptyText}>Você ainda não tem viagens programadas.</Text>
                                <TouchableOpacity
                                    style={styles.nextTripExploreCta}
                                    onPress={() => router.push('/(tabs)/packages')}
                                >
                                    <Text style={styles.nextTripExploreText}>Explorar pacotes →</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>

                {/* ══════════ 3. SUA JORNADA NO VAMO ══════════ */}
                <View style={styles.sectionSpaced}>
                    <View style={styles.sectionTitleRow}>
                        <Icon name="globe" size={16} color={theme.colors.primary} />
                        <Text style={styles.sectionTitle}>Sua Jornada no VAMO</Text>
                        <Text style={styles.journeyProgress}>{completedMilestones}/{MILESTONES.length}</Text>
                    </View>
                    <View style={styles.sectionCard}>
                        {/* Progress bar */}
                        <View style={styles.progressBarContainer}>
                            <View style={[styles.progressBarFill, { width: `${(completedMilestones / MILESTONES.length) * 100}%` }]} />
                        </View>
                        {MILESTONES.map((milestone, idx) => (
                            <View
                                key={milestone.id}
                                style={[
                                    styles.milestoneRow,
                                    idx === MILESTONES.length - 1 && styles.milestoneRowLast,
                                ]}
                            >
                                {milestone.done ? (
                                    <Icon name="verified" size={20} color={theme.colors.success} />
                                ) : (
                                    <Icon name="lock" size={18} color={theme.colors.text.tertiary} />
                                )}
                                <Text style={[
                                    styles.milestoneLabel,
                                    !milestone.done && styles.milestoneLabelLocked,
                                ]}>
                                    {milestone.label}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* ══════════ SHORTCUTS ══════════ */}
                <View style={styles.shortcutsRow}>
                    <TouchableOpacity
                        style={styles.shortcutButton}
                        onPress={() => router.push('/(tabs)/itineraries')}
                    >
                        <Icon name="map" size={20} color={theme.colors.primary} />
                        <Text style={styles.shortcutText}>Meus Roteiros</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.shortcutButton}
                        onPress={() => router.push('/(tabs)/my-trips')}
                    >
                        <Icon name="heart" size={20} color={theme.colors.primary} />
                        <Text style={styles.shortcutText}>Favoritos</Text>
                    </TouchableOpacity>
                </View>

                {/* ══════════ 4. CONTA ══════════ */}
                <View style={styles.sectionSpaced}>
                    <Text style={styles.sectionTitle}>Conta</Text>
                    <View style={styles.sectionCard}>
                        <SettingItem icon="circle-user" title="Dados pessoais" onPress={() => {
                            haptics.light();
                            Alert.alert('Dados Pessoais', `Nome: ${USER.name}\nEmail: ${USER.email}\n\nA edição de dados pessoais estará disponível em breve.`, [{ text: 'OK' }]);
                        }} />
                        <SettingItem icon="bell" title="Notificações" onPress={() => {
                            haptics.light(); Linking.openSettings();
                        }} />
                        <SettingItem icon="shield-check" title="Segurança" onPress={() => {
                            haptics.light();
                            Alert.alert('Segurança', 'Alteração de senha e autenticação em dois fatores estarão disponíveis em breve.', [{ text: 'OK' }]);
                        }} />
                        <SettingItem icon="card" title="Métodos de pagamento" onPress={() => {
                            haptics.light();
                            Alert.alert('Pagamento', 'Gerenciamento de métodos de pagamento estará disponível em breve.', [{ text: 'OK' }]);
                        }} isLast />
                    </View>
                </View>

                {/* ══════════ CRIAR ROTEIROS ══════════ */}
                <View style={styles.sectionSpaced}>
                    <Text style={styles.sectionTitle}>Criar Roteiros</Text>
                    <View style={styles.sectionCard}>
                        <TouchableOpacity
                            style={styles.storeItem}
                            onPress={() => {
                                haptics.light();
                                Linking.openURL('https://vamo.app/criadores');
                            }}
                            activeOpacity={0.7}
                        >
                            <View style={styles.storeLeft}>
                                <View style={styles.storeIconCircle}>
                                    <Icon name="globe" size={22} color={theme.colors.primary} />
                                </View>
                                <View>
                                    <Text style={styles.storeTitle}>Portal do Criador</Text>
                                    <Text style={styles.storeSubtitle}>Crie roteiros pelo site vamo.app</Text>
                                </View>
                            </View>
                            <Icon name="chevron-right" size={18} color={theme.colors.text.tertiary} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ══════════ 5. PREFERÊNCIAS ══════════ */}
                <View style={styles.sectionSpaced}>
                    <Text style={styles.sectionTitle}>Preferências</Text>
                    <View style={styles.sectionCard}>
                        <SettingItem icon="wallet" title="Moeda" value={currency} onPress={() => {
                            haptics.selection(); setShowCurrencyPicker(true);
                        }} />
                        <SettingItem icon="globe" title="Idioma" value={language} onPress={() => {
                            haptics.selection(); setShowLanguagePicker(true);
                        }} />
                        <SettingItem icon="palette" title="Aparência" value={appearance} onPress={() => {
                            haptics.selection(); setShowAppearancePicker(true);
                        }} />
                        <SettingItem icon="plane" title="Tipo de viagem preferido" value={travelType} onPress={() => {
                            haptics.selection(); setShowTravelTypePicker(true);
                        }} />
                        <SettingItem icon="wallet" title="Orçamento médio" value={budget} onPress={() => {
                            haptics.selection(); setShowBudgetPicker(true);
                        }} />
                        <SettingItem icon="star" title="Interesses" value={`${selectedInterests.length} selecionados`} onPress={() => {
                            haptics.selection(); setShowInterestsPicker(true);
                        }} isLast />
                    </View>
                </View>

                {/* ══════════ 6. SOBRE ══════════ */}
                <View style={styles.sectionSpaced}>
                    <Text style={styles.sectionTitle}>Sobre</Text>
                    <View style={styles.sectionCard}>
                        <SettingItem icon="help" title="Como funciona" onPress={() => {
                            haptics.light(); setShowHowItWorksModal(true);
                        }} />
                        <SettingItem icon="info" title="Sobre o VAMO" onPress={() => {
                            haptics.light(); setShowAboutModal(true);
                        }} />
                        <SettingItem icon="message-circle" title="Central de Ajuda" onPress={() => {
                            haptics.light(); Linking.openURL('https://vamo.app/ajuda');
                        }} />
                        <SettingItem icon="phone" title="Falar com suporte" iconColor="#25D366" onPress={() => {
                            haptics.light(); Linking.openURL('https://wa.me/5511999999999?text=Olá! Preciso de ajuda no VAMO.');
                        }} />
                        <SettingItem icon="clipboard-list" title="Minhas solicitações" onPress={() => {
                            haptics.light();
                            Alert.alert('Solicitações', 'Você não possui solicitações abertas no momento.', [{ text: 'OK' }]);
                        }} isLast />
                    </View>
                </View>

                {/* ══════════ AVALIAÇÃO ══════════ */}
                <View style={styles.sectionSpaced}>
                    <Text style={styles.sectionTitle}>Avaliação</Text>
                    <View style={styles.sectionCard}>
                        <SettingItem icon="star" title="Avaliar o aplicativo" onPress={handleRateApp} />
                        <SettingItem icon="share" title="Compartilhar com amigos" onPress={() => {
                            haptics.light();
                            Alert.alert('Compartilhar', 'Funcionalidade disponível em breve!');
                        }} isLast />
                    </View>
                </View>

                {/* ══════════ 7. LEGAL ══════════ */}
                <View style={styles.sectionSpaced}>
                    <Text style={styles.sectionTitle}>Legal</Text>
                    <View style={styles.sectionCard}>
                        <SettingItem icon="file" title="Termos de Uso" onPress={() => {
                            haptics.light(); Linking.openURL('https://vamo.app/termos');
                        }} />
                        <SettingItem icon="shield-check" title="Política de Privacidade" onPress={() => {
                            haptics.light(); Linking.openURL('https://vamo.app/privacidade');
                        }} />
                        <SettingItem icon="trash" title="Excluir minha conta" titleColor={theme.colors.error} onPress={() => {
                            haptics.warning();
                            Alert.alert('Excluir Conta', 'Esta ação é irreversível. Todos os seus dados serão apagados permanentemente.', [
                                { text: 'Cancelar', style: 'cancel' },
                                { text: 'Excluir', style: 'destructive', onPress: () => Alert.alert('Solicitação enviada', 'Sua conta será excluída em até 30 dias.') },
                            ]);
                        }} isLast />
                    </View>
                </View>

                {/* ══════════ SIGN OUT (less prominent than Delete) ══════════ */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Icon name="logout" size={18} color={theme.colors.text.tertiary} />
                    <Text style={styles.logoutText}>Sair da conta</Text>
                </TouchableOpacity>

                {/* Version */}
                <Text style={styles.versionText}>VAMO v1.0.0</Text>

                <View style={{ height: 40 }} />
            </Animated.ScrollView>

            {/* ══════════ MODALS ══════════ */}
            <PickerModal visible={showCurrencyPicker} title="Selecione a moeda" options={CURRENCIES} selected={currency}
                onSelect={(v) => { setCurrency(v); haptics.success(); }} onClose={() => setShowCurrencyPicker(false)} />
            <PickerModal visible={showLanguagePicker} title="Selecione o idioma" options={LANGUAGES} selected={language}
                onSelect={(v) => { setLanguage(v); haptics.success(); }} onClose={() => setShowLanguagePicker(false)} />
            <PickerModal visible={showAppearancePicker} title="Selecione o tema" options={APPEARANCES} selected={appearance}
                onSelect={(v) => { setAppearance(v); haptics.success(); }} onClose={() => setShowAppearancePicker(false)} />
            <PickerModal visible={showTravelTypePicker} title="Tipo de viagem" options={TRAVEL_TYPES} selected={travelType}
                onSelect={(v) => { setTravelType(v); haptics.success(); }} onClose={() => setShowTravelTypePicker(false)} />
            <PickerModal visible={showBudgetPicker} title="Orçamento médio" options={BUDGET_RANGES} selected={budget}
                onSelect={(v) => { setBudget(v); haptics.success(); }} onClose={() => setShowBudgetPicker(false)} />

            {/* Interests Multi-Select Modal */}
            <Modal visible={showInterestsPicker} animationType="slide" transparent>
                <View style={modalStyles.overlay}>
                    <View style={modalStyles.container}>
                        <View style={modalStyles.handle} />
                        <View style={modalStyles.header}>
                            <Text style={modalStyles.title}>Seus Interesses</Text>
                            <TouchableOpacity onPress={() => setShowInterestsPicker(false)} style={modalStyles.closeButton}>
                                <Icon name="close" size={20} color={theme.colors.text.secondary} />
                            </TouchableOpacity>
                        </View>
                        <Text style={modalStyles.interestsSubtitle}>
                            Selecione seus interesses para recomendações personalizadas
                        </Text>
                        <View style={modalStyles.interestsGrid}>
                            {INTEREST_OPTIONS.map((interest) => {
                                const isActive = selectedInterests.includes(interest.id);
                                return (
                                    <TouchableOpacity
                                        key={interest.id}
                                        style={[modalStyles.interestChip, isActive && modalStyles.interestChipActive]}
                                        onPress={() => { toggleInterest(interest.id); haptics.selection(); }}
                                    >
                                        <Icon name={interest.icon} size={20} color={isActive ? theme.colors.primary : theme.colors.text.secondary} />
                                        <Text style={[modalStyles.interestLabel, isActive && modalStyles.interestLabelActive]}>
                                            {interest.label}
                                        </Text>
                                        {isActive && <Icon name="verified" size={16} color={theme.colors.primary} />}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                        <TouchableOpacity
                            style={modalStyles.doneButton}
                            onPress={() => { setShowInterestsPicker(false); haptics.success(); }}
                        >
                            <Text style={modalStyles.doneButtonText}>Salvar ({selectedInterests.length})</Text>
                        </TouchableOpacity>
                        <View style={{ height: 16 }} />
                    </View>
                </View>
            </Modal>

            <InfoModal visible={showAboutModal} title="Sobre o VAMO"
                content={`VAMO — Sua plataforma de viagens\n\nVersão 1.0.0\n\nDescubra experiências únicas e pacotes de viagem personalizados. Conectamos você às melhores agências e criadores de roteiros.\n\n© 2026 VAMO. Todos os direitos reservados.`}
                onClose={() => setShowAboutModal(false)} />
            <InfoModal visible={showHowItWorksModal} title="Como funciona"
                content={`1. Explore\nNavegue por pacotes de viagem e roteiros de viajantes experientes.\n\n2. Escolha\nSelecione a experiência perfeita para você e verifique a disponibilidade.\n\n3. Reserve\nComplete seu cadastro e finalize a reserva com segurança.\n\n4. Viaje!\nReceba todas as informações por email e aproveite sua aventura.`}
                onClose={() => setShowHowItWorksModal(false)} />
        </View>
    );
}

// ── Setting Item ────────────────────────────────────────
function SettingItem({
    icon, title, value, onPress, isLast = false, titleColor, iconColor,
}: {
    icon: string; title: string; value?: string; onPress?: () => void;
    isLast?: boolean; titleColor?: string; iconColor?: string;
}) {
    return (
        <TouchableOpacity
            style={[styles.settingItem, isLast && styles.settingItemLast]}
            onPress={onPress}
            activeOpacity={0.6}
        >
            <View style={styles.settingLeft}>
                <Icon
                    name={icon as IconName}
                    size={20}
                    color={iconColor || titleColor || theme.colors.text.secondary}
                />
                <Text style={[styles.settingTitle, titleColor && { color: titleColor }]}>{title}</Text>
            </View>
            <View style={styles.settingRight}>
                {value && <Text style={styles.settingValue} numberOfLines={1}>{value}</Text>}
                <Icon name="chevron-right" size={18} color={theme.colors.text.tertiary} />
            </View>
        </TouchableOpacity>
    );
}

// ── Picker Modal ────────────────────────────────────────
function PickerModal({
    visible, title, options, selected, onSelect, onClose,
}: {
    visible: boolean; title: string; options: string[];
    selected: string; onSelect: (value: string) => void; onClose: () => void;
}) {
    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={modalStyles.overlay}>
                <View style={modalStyles.container}>
                    <View style={modalStyles.handle} />
                    <View style={modalStyles.header}>
                        <Text style={modalStyles.title}>{title}</Text>
                        <TouchableOpacity onPress={onClose} style={modalStyles.closeButton}>
                            <Icon name="close" size={20} color={theme.colors.text.secondary} />
                        </TouchableOpacity>
                    </View>
                    {options.map((option) => (
                        <TouchableOpacity
                            key={option}
                            style={[modalStyles.option, selected === option && modalStyles.optionSelected]}
                            onPress={() => { onSelect(option); onClose(); }}
                        >
                            <Text style={[modalStyles.optionText, selected === option && modalStyles.optionTextSelected]}>
                                {option}
                            </Text>
                            {selected === option && <Icon name="verified" size={22} color={theme.colors.primary} />}
                        </TouchableOpacity>
                    ))}
                    <View style={{ height: 20 }} />
                </View>
            </View>
        </Modal>
    );
}

// ── Info Modal ──────────────────────────────────────────
function InfoModal({
    visible, title, content, onClose,
}: {
    visible: boolean; title: string; content: string; onClose: () => void;
}) {
    return (
        <Modal visible={visible} animationType="fade" transparent>
            <View style={modalStyles.overlay}>
                <View style={modalStyles.container}>
                    <View style={modalStyles.handle} />
                    <View style={modalStyles.header}>
                        <Text style={modalStyles.title}>{title}</Text>
                        <TouchableOpacity onPress={onClose} style={modalStyles.closeButton}>
                            <Icon name="close" size={20} color={theme.colors.text.secondary} />
                        </TouchableOpacity>
                    </View>
                    <Text style={modalStyles.infoContent}>{content}</Text>
                    <TouchableOpacity style={modalStyles.doneButton} onPress={onClose}>
                        <Text style={modalStyles.doneButtonText}>Entendi</Text>
                    </TouchableOpacity>
                    <View style={{ height: 16 }} />
                </View>
            </View>
        </Modal>
    );
}

// ── Modal Styles ────────────────────────────────────────
const modalStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: theme.colors.background,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: 34,
    },
    handle: {
        width: 40, height: 4,
        backgroundColor: theme.colors.border,
        borderRadius: 2, alignSelf: 'center',
        marginTop: 12, marginBottom: 8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20, paddingVertical: 14,
        borderBottomWidth: 1, borderBottomColor: theme.colors.borderLight,
    },
    title: {
        fontSize: 18, fontWeight: '700',
        color: theme.colors.text.primary,
    },
    closeButton: {
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: theme.colors.surface,
        alignItems: 'center', justifyContent: 'center',
    },
    option: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20,
        borderBottomWidth: 1, borderBottomColor: theme.colors.borderLight,
    },
    optionSelected: {
        backgroundColor: theme.colors.primary + '0D',
    },
    optionText: {
        fontSize: 16, color: theme.colors.text.primary,
    },
    optionTextSelected: {
        color: theme.colors.primary, fontWeight: '600',
    },
    infoContent: {
        paddingHorizontal: 20, paddingVertical: 16,
        fontSize: 15, color: theme.colors.text.secondary, lineHeight: 24,
    },
    doneButton: {
        marginHorizontal: 20, backgroundColor: theme.colors.primary,
        paddingVertical: 14, borderRadius: 14, alignItems: 'center',
    },
    doneButtonText: {
        color: '#FFFFFF', fontSize: 16, fontWeight: '700',
    },
    // Interests modal
    interestsSubtitle: {
        fontSize: 13, color: theme.colors.text.secondary,
        paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4,
    },
    interestsGrid: {
        flexDirection: 'row', flexWrap: 'wrap',
        gap: 10, paddingHorizontal: 20, paddingVertical: 12,
    },
    interestChip: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 14, paddingVertical: 10,
        borderRadius: 24, backgroundColor: theme.colors.surface,
        borderWidth: 1.5, borderColor: theme.colors.border,
    },
    interestChipActive: {
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.primary + '0D',
    },
    interestEmoji: { fontSize: 18 },
    interestLabel: {
        fontSize: 14, fontWeight: '500', color: theme.colors.text.primary,
    },
    interestLabelActive: {
        color: theme.colors.primary, fontWeight: '600',
    },
});

// ── Main Styles ─────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.surface,
    },

    // Header
    header: {
        paddingTop: 60, paddingBottom: 28,
        alignItems: 'center',
        borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
    },
    avatarContainer: { position: 'relative', marginBottom: 12 },
    avatarCircle: {
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.25)',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)',
    },
    avatarEmoji: { fontSize: 40 },
    editAvatarButton: {
        position: 'absolute', bottom: 0, right: -4,
        width: 26, height: 26, borderRadius: 13,
        backgroundColor: theme.colors.primary,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 2, borderColor: '#FFF',
    },
    userName: {
        fontSize: 22, fontWeight: '700', color: '#FFFFFF', marginBottom: 4,
    },
    userEmail: {
        fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 10,
    },
    sinceBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    },
    sinceText: {
        fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: '600',
    },
    identityLine: {
        fontSize: 13, color: 'rgba(255,255,255,0.7)',
        marginTop: 10, textAlign: 'center',
    },

    // Stats
    statsRow: {
        flexDirection: 'row', marginTop: -20, marginHorizontal: 20, gap: 10,
    },
    statCard: {
        flex: 1, backgroundColor: theme.colors.background,
        borderRadius: 16, paddingVertical: 16, alignItems: 'center',
        ...theme.shadows.medium,
    },
    statIcon: { fontSize: 24, marginBottom: 6 },
    statValue: { fontSize: 22, fontWeight: '800', color: theme.colors.text.primary },
    statLabel: { fontSize: 12, color: theme.colors.text.secondary, marginTop: 2 },

    // Next Trip
    nextTripContent: {
        flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12,
    },
    nextTripLeft: { flex: 1 },
    nextTripDestination: {
        fontSize: 17, fontWeight: '700', color: theme.colors.text.primary, marginBottom: 4,
    },
    nextTripDate: { fontSize: 13, color: theme.colors.text.secondary },
    nextTripStatusBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: theme.colors.success + '15',
        paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12,
    },
    statusDot: {
        width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.success,
    },
    nextTripStatus: {
        fontSize: 12, fontWeight: '600', color: theme.colors.success,
    },
    nextTripEmpty: {
        alignItems: 'center', padding: 24, gap: 8,
    },
    nextTripEmptyText: {
        fontSize: 14, color: theme.colors.text.secondary, textAlign: 'center',
    },
    nextTripExploreCta: {
        marginTop: 4,
    },
    nextTripExploreText: {
        fontSize: 14, fontWeight: '600', color: theme.colors.primary,
    },

    // Journey / Milestones
    sectionTitleRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 4, marginBottom: 10,
    },
    journeyProgress: {
        fontSize: 13, fontWeight: '700', color: theme.colors.primary,
    },
    progressBarContainer: {
        height: 4, backgroundColor: theme.colors.borderLight,
        borderRadius: 2, marginHorizontal: 16, marginTop: 14, marginBottom: 8,
    },
    progressBarFill: {
        height: 4, backgroundColor: theme.colors.primary, borderRadius: 2,
    },
    milestoneRow: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingVertical: 12, paddingHorizontal: 16,
        borderBottomWidth: 1, borderBottomColor: theme.colors.borderLight,
    },
    milestoneRowLast: { borderBottomWidth: 0 },
    milestoneLabel: {
        fontSize: 14, fontWeight: '500', color: theme.colors.text.primary,
    },
    milestoneLabelLocked: {
        color: theme.colors.text.tertiary,
    },

    // Shortcuts
    shortcutsRow: {
        flexDirection: 'row', marginHorizontal: 20, marginTop: 20, gap: 10,
    },
    shortcutButton: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, backgroundColor: theme.colors.background,
        paddingVertical: 14, borderRadius: 14,
        borderWidth: 1.5, borderColor: theme.colors.primary + '40',
    },
    shortcutText: {
        fontSize: 14, fontWeight: '600', color: theme.colors.primary,
    },

    // Sections
    sectionSpaced: {
        marginTop: 28, paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 14, fontWeight: '700', color: theme.colors.text.tertiary,
        textTransform: 'uppercase', letterSpacing: 0.5,
        marginBottom: 10, marginLeft: 4,
    },
    sectionCard: {
        backgroundColor: theme.colors.background,
        borderRadius: 16, overflow: 'hidden',
        ...theme.shadows.small,
    },

    // Setting Items
    settingItem: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16,
        borderBottomWidth: 1, borderBottomColor: theme.colors.borderLight,
    },
    settingItemLast: { borderBottomWidth: 0 },
    settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    settingIconStyle: { width: 24 },
    settingTitle: {
        fontSize: 15, fontWeight: '500', color: theme.colors.text.primary,
    },
    settingRight: {
        flexDirection: 'row', alignItems: 'center', gap: 6, maxWidth: 160,
    },
    settingValue: {
        fontSize: 14, color: theme.colors.text.tertiary,
    },

    // Minha Loja
    storeItem: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', padding: 16,
    },
    storeLeft: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
    },
    storeIconCircle: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: theme.colors.primary + '12',
        alignItems: 'center', justifyContent: 'center',
    },
    storeTitle: {
        fontSize: 15, fontWeight: '600', color: theme.colors.text.primary,
    },
    storeSubtitle: {
        fontSize: 12, color: theme.colors.text.secondary, marginTop: 2,
    },

    // Logout (less prominent than delete)
    logoutButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 6, marginHorizontal: 20, marginTop: 28,
        paddingVertical: 12, borderRadius: 12,
    },
    logoutText: {
        fontSize: 14, fontWeight: '500', color: theme.colors.text.tertiary,
    },

    // Version
    versionText: {
        textAlign: 'center', fontSize: 12,
        color: theme.colors.text.tertiary, marginTop: 12,
    },
});

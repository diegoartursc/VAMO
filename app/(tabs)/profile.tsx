import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Modal, Linking, Platform
} from 'react-native';
import { theme } from '../../src/theme/theme';
import { haptics } from '../../src/services/haptics';

const CURRENCIES = ['(€) Euro', '(R$) Real', '($) Dólar', '(£) Libra'];
const LANGUAGES = ['português', 'english', 'español'];
const APPEARANCES = ['Predefinida pelo sistema', 'Claro', 'Escuro'];

export default function ProfileScreen() {
    const [currency, setCurrency] = useState('(€) Euro');
    const [language, setLanguage] = useState('português');
    const [appearance, setAppearance] = useState('Predefinida pelo sistema');

    // Modal states
    const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
    const [showLanguagePicker, setShowLanguagePicker] = useState(false);
    const [showAppearancePicker, setShowAppearancePicker] = useState(false);
    const [showAboutModal, setShowAboutModal] = useState(false);
    const [showHowItWorksModal, setShowHowItWorksModal] = useState(false);

    const handleRateApp = () => {
        haptics.success();
        const storeUrl = Platform.OS === 'ios'
            ? 'https://apps.apple.com/app/id1234567890' // Replace with real ID
            : 'https://play.google.com/store/apps/details?id=com.vamo';
        Linking.openURL(storeUrl);
    };

    const handleHelpCenter = () => {
        haptics.light();
        Linking.openURL('https://vamo.app/ajuda');
    };

    return (
        <View style={styles.container}>
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* User Info Header */}
                <View style={styles.userHeader}>
                    <Text style={styles.greeting}>👋 Olá Usuário</Text>
                    <Text style={styles.email}>usuario@email.com</Text>
                </View>

                {/* Configurações Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Configurações</Text>

                    <SettingItem
                        title="Dados pessoais"
                        onPress={() => {
                            haptics.light();
                            // TODO: Navigate to profile edit screen
                        }}
                    />

                    <SettingItem
                        title="Moeda"
                        value={currency}
                        onPress={() => {
                            haptics.selection();
                            setShowCurrencyPicker(true);
                        }}
                    />

                    <SettingItem
                        title="Idioma"
                        value={language}
                        onPress={() => {
                            haptics.selection();
                            setShowLanguagePicker(true);
                        }}
                    />

                    <SettingItem
                        title="Aparência"
                        value={appearance}
                        onPress={() => {
                            haptics.selection();
                            setShowAppearancePicker(true);
                        }}
                    />

                    <SettingItem
                        title="Notificações"
                        onPress={() => {
                            haptics.light();
                            Linking.openSettings();
                        }}
                    />
                </View>

                {/* Suporte Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Suporte</Text>

                    <SettingItem
                        title="Como funciona"
                        onPress={() => {
                            haptics.light();
                            setShowHowItWorksModal(true);
                        }}
                    />

                    <SettingItem
                        title="Sobre o VAMO"
                        onPress={() => {
                            haptics.light();
                            setShowAboutModal(true);
                        }}
                    />

                    <SettingItem
                        title="Central de Ajuda"
                        onPress={handleHelpCenter}
                    />
                </View>

                {/* Feedback Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Feedback</Text>

                    <SettingItem
                        title="Avaliar o aplicativo"
                        onPress={handleRateApp}
                        isLast={true}
                    />
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Currency Picker Modal */}
            <PickerModal
                visible={showCurrencyPicker}
                title="Selecione a moeda"
                options={CURRENCIES}
                selected={currency}
                onSelect={(value) => {
                    setCurrency(value);
                    haptics.success();
                }}
                onClose={() => setShowCurrencyPicker(false)}
            />

            {/* Language Picker Modal */}
            <PickerModal
                visible={showLanguagePicker}
                title="Selecione o idioma"
                options={LANGUAGES}
                selected={language}
                onSelect={(value) => {
                    setLanguage(value);
                    haptics.success();
                }}
                onClose={() => setShowLanguagePicker(false)}
            />

            {/* Appearance Picker Modal */}
            <PickerModal
                visible={showAppearancePicker}
                title="Selecione o tema"
                options={APPEARANCES}
                selected={appearance}
                onSelect={(value) => {
                    setAppearance(value);
                    haptics.success();
                }}
                onClose={() => setShowAppearancePicker(false)}
            />

            {/* About Modal */}
            <InfoModal
                visible={showAboutModal}
                title="Sobre o VAMO"
                content={`VAMO - Sua plataforma de viagens\n\nVersão 1.0.0\n\nDescubra experiências únicas e pacotes de viagem personalizados. Conectamos você às melhores agências e criadores de roteiros.\n\n© 2026 VAMO. Todos os direitos reservados.`}
                onClose={() => setShowAboutModal(false)}
            />

            {/* How it Works Modal */}
            <InfoModal
                visible={showHowItWorksModal}
                title="Como funciona"
                content={`1️⃣ Explore\nNavegue por pacotes de viagem e roteiros de viajantes experientes.\n\n2️⃣ Escolha\nSelecione a experiência perfeita para você e verifique a disponibilidade.\n\n3️⃣ Reserve\nComplete seu cadastro e finalize a reserva com segurança.\n\n4️⃣ Viaje!\nReceba todas as informações por email e aproveite sua aventura.`}
                onClose={() => setShowHowItWorksModal(false)}
            />
        </View>
    );
}

function SettingItem({
    title,
    value,
    onPress,
    isLast = false
}: {
    title: string;
    value?: string;
    onPress?: () => void;
    isLast?: boolean;
}) {
    return (
        <TouchableOpacity
            style={[styles.settingItem, isLast && styles.settingItemLast]}
            onPress={onPress}
        >
            <Text style={styles.settingTitle}>{title}</Text>
            <View style={styles.settingRight}>
                {value && <Text style={styles.settingValue}>{value}</Text>}
                <Text style={styles.chevron}>›</Text>
            </View>
        </TouchableOpacity>
    );
}

function PickerModal({
    visible,
    title,
    options,
    selected,
    onSelect,
    onClose,
}: {
    visible: boolean;
    title: string;
    options: string[];
    selected: string;
    onSelect: (value: string) => void;
    onClose: () => void;
}) {
    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={pickerStyles.overlay}>
                <View style={pickerStyles.container}>
                    <View style={pickerStyles.header}>
                        <Text style={pickerStyles.title}>{title}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={pickerStyles.closeButton}>✕</Text>
                        </TouchableOpacity>
                    </View>
                    {options.map((option) => (
                        <TouchableOpacity
                            key={option}
                            style={[
                                pickerStyles.option,
                                selected === option && pickerStyles.optionSelected,
                            ]}
                            onPress={() => {
                                onSelect(option);
                                onClose();
                            }}
                        >
                            <Text
                                style={[
                                    pickerStyles.optionText,
                                    selected === option && pickerStyles.optionTextSelected,
                                ]}
                            >
                                {option}
                            </Text>
                            {selected === option && (
                                <Text style={pickerStyles.checkmark}>✓</Text>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </Modal>
    );
}

function InfoModal({
    visible,
    title,
    content,
    onClose,
}: {
    visible: boolean;
    title: string;
    content: string;
    onClose: () => void;
}) {
    return (
        <Modal visible={visible} animationType="fade" transparent>
            <View style={pickerStyles.overlay}>
                <View style={pickerStyles.container}>
                    <View style={pickerStyles.header}>
                        <Text style={pickerStyles.title}>{title}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={pickerStyles.closeButton}>✕</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={pickerStyles.infoContent}>{content}</Text>
                    <TouchableOpacity style={pickerStyles.doneButton} onPress={onClose}>
                        <Text style={pickerStyles.doneButtonText}>Entendi</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const pickerStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: '#2a2a2a',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#3a3a3a',
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
    },
    closeButton: {
        fontSize: 20,
        color: '#999',
    },
    option: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#3a3a3a',
    },
    optionSelected: {
        backgroundColor: 'rgba(20, 184, 166, 0.1)',
    },
    optionText: {
        fontSize: 16,
        color: '#fff',
    },
    optionTextSelected: {
        color: '#14b8a6',
        fontWeight: '600',
    },
    checkmark: {
        fontSize: 18,
        color: '#14b8a6',
    },
    infoContent: {
        padding: 20,
        fontSize: 15,
        color: '#ccc',
        lineHeight: 24,
    },
    doneButton: {
        marginHorizontal: 20,
        backgroundColor: '#14b8a6',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    doneButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a1a', // Dark background like reference
    },
    content: {
        flex: 1,
    },
    userHeader: {
        paddingHorizontal: theme.spacing.md,
        paddingTop: 60,
        paddingBottom: theme.spacing.lg,
    },
    greeting: {
        fontSize: 28,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    email: {
        fontSize: 14,
        color: '#999999',
    },
    section: {
        marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
        paddingHorizontal: theme.spacing.md,
        marginBottom: theme.spacing.md,
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: '#333333',
    },
    settingItemLast: {
        borderBottomWidth: 0,
    },
    settingTitle: {
        fontSize: 15,
        color: '#FFFFFF',
        fontWeight: '400',
    },
    settingRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    settingValue: {
        fontSize: 15,
        color: '#999999',
    },
    chevron: {
        fontSize: 24,
        color: '#666666',
    },
});

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { theme } from '../../src/theme/theme';

export default function ProfileScreen() {
    const [currency, setCurrency] = useState('(€) Euro');
    const [language, setLanguage] = useState('português');
    const [appearance, setAppearance] = useState('Predefinida pelo sistema');

    return (
        <View style={styles.container}>
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* User Info Header */}
                <View style={styles.userHeader}>
                    <Text style={styles.greeting}>👋 Olá Ana</Text>
                    <Text style={styles.email}>anapaula_beckencamp@hotmail.com</Text>
                </View>

                {/* Configurações Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Configurações</Text>

                    <SettingItem
                        title="Dados pessoais"
                        onPress={() => Alert.alert('Dados pessoais', 'Página de dados pessoais em breve')}
                    />

                    <SettingItem
                        title="Moeda"
                        value={currency}
                        onPress={() => Alert.alert('Moeda', 'Seleção de moeda em breve')}
                    />

                    <SettingItem
                        title="Idioma"
                        value={language}
                        onPress={() => Alert.alert('Idioma', 'Seleção de idioma em breve')}
                    />

                    <SettingItem
                        title="Aparência"
                        value={appearance}
                        onPress={() => Alert.alert('Aparência', 'Configuração de tema em breve')}
                    />

                    <SettingItem
                        title="Notificações"
                        onPress={() => Alert.alert('Notificações', 'Configuração de notificações em breve')}
                    />
                </View>

                {/* Suporte Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Suporte</Text>

                    <SettingItem
                        title="Sobre o GetYourGuide"
                        onPress={() => Alert.alert('Sobre', 'Informações sobre o VAMO')}
                    />

                    <SettingItem
                        title="Central de Ajuda"
                        onPress={() => Alert.alert('Ajuda', 'Central de ajuda em breve')}
                    />
                </View>

                {/* Feedback Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Feedback</Text>

                    <SettingItem
                        title="Avaliar o aplicativo"
                        onPress={() => Alert.alert('Avaliação', 'Obrigado! Sistema de avaliação em breve')}
                        isLast={true}
                    />
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
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

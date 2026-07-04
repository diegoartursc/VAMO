/**
 * VAMO Mobile — Falar com o suporte.
 *
 * NÃO existe (ainda) backend de tickets de suporte. Em vez de fingir um
 * envio, montamos a solicitação e abrimos o cliente de e-mail do usuário
 * (mailto) já preenchido. Isso é honesto e funcional em mobile e web.
 *
 * TODO(produto): confirmar o e-mail oficial de suporte. Usamos
 * `suporte@vamo.app` por consistência com o domínio vamo.app já usado no
 * app (vamo.app/help, /support, /terms). Se a empresa definir outro
 * endereço, trocar SUPPORT_EMAIL.
 * TODO(backend): quando houver POST /api/support/requests, enviar por lá.
 */
import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Platform,
} from 'react-native';
import * as Linking from 'expo-linking';
import { theme } from '../../src/theme/theme';
import { haptics } from '../../src/services/haptics';
import { Icon } from '../../src/components/common/Icons';
import { ScreenHeader } from '../../src/components/common/ScreenHeader';
import { useAuth } from '../../src/contexts/AuthContext';
import { notify } from '../../src/utils/notify';

const SUPPORT_EMAIL = 'suporte@vamo.app';

const CATEGORIES = [
    'Conta', 'Compra', 'Roteiro comprado', 'Roteirista', 'Pagamento', 'Problema técnico', 'Outro',
];

export default function ContactSupportScreen() {
    const { user } = useAuth();

    const [category, setCategory] = useState<string>(CATEGORIES[0]);
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [contactEmail, setContactEmail] = useState(user?.email ?? '');

    const canSend = subject.trim().length >= 3 && message.trim().length >= 10;

    const handleSend = async () => {
        if (!canSend) return;
        haptics.light();

        const body = [
            `Categoria: ${category}`,
            `E-mail de contato: ${contactEmail || '—'}`,
            '',
            message.trim(),
            '',
            '—',
            `Enviado pelo app VAMO${user?.travelerId ? ` (id: ${user.travelerId})` : ''}`,
        ].join('\n');

        const mailto = `mailto:${SUPPORT_EMAIL}`
            + `?subject=${encodeURIComponent(`[${category}] ${subject.trim()}`)}`
            + `&body=${encodeURIComponent(body)}`;

        try {
            if (Platform.OS === 'web' && typeof window !== 'undefined') {
                window.location.href = mailto;
            } else {
                await Linking.openURL(mailto);
            }
        } catch {
            notify({
                title: 'Não foi possível abrir o e-mail',
                message: `Envie sua solicitação para ${SUPPORT_EMAIL}.`,
                variant: 'warning',
            });
        }
    };

    return (
        <View style={s.container}>
            <ScreenHeader title="Falar com o suporte" subtitle="Conte o que aconteceu e nossa equipe vai ajudar." fallback="/help" />
            <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
                {/* Categoria */}
                <Text style={s.label}>Categoria</Text>
                <View style={s.chips}>
                    {CATEGORIES.map((cat) => {
                        const active = cat === category;
                        return (
                            <TouchableOpacity
                                key={cat}
                                style={[s.chip, active && s.chipActive]}
                                onPress={() => { haptics.selection(); setCategory(cat); }}
                            >
                                <Text style={[s.chipText, active && s.chipTextActive]}>{cat}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Assunto */}
                <Text style={s.label}>Assunto</Text>
                <TextInput
                    style={s.input}
                    value={subject}
                    onChangeText={setSubject}
                    placeholder="Resuma o seu problema"
                    placeholderTextColor={theme.colors.text.tertiary}
                    maxLength={120}
                />

                {/* Mensagem */}
                <Text style={s.label}>Mensagem</Text>
                <TextInput
                    style={[s.input, s.textarea]}
                    value={message}
                    onChangeText={setMessage}
                    placeholder="Descreva com detalhes o que aconteceu."
                    placeholderTextColor={theme.colors.text.tertiary}
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                    maxLength={2000}
                />

                {/* E-mail de contato */}
                <Text style={s.label}>E-mail para resposta</Text>
                <TextInput
                    style={s.input}
                    value={contactEmail}
                    onChangeText={setContactEmail}
                    placeholder="seu@email.com"
                    placeholderTextColor={theme.colors.text.tertiary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />

                <TouchableOpacity
                    style={[s.sendBtn, !canSend && s.sendBtnDisabled]}
                    onPress={handleSend}
                    disabled={!canSend}
                >
                    <Icon name="message-circle" size={18} color="#fff" />
                    <Text style={s.sendBtnText}>Enviar solicitação</Text>
                </TouchableOpacity>

                <Text style={s.footnote}>
                    Ao enviar, abrimos seu app de e-mail com a mensagem pronta para
                    {' '}{SUPPORT_EMAIL}. Você confirma o envio por lá.
                </Text>
            </ScrollView>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.surfaceLight },
    scroll: { padding: 20, paddingBottom: 60 },
    label: {
        fontSize: 13, fontWeight: '700', color: theme.colors.text.secondary,
        marginTop: 18, marginBottom: 8, marginLeft: 2,
    },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
        backgroundColor: theme.colors.background,
        borderWidth: 1, borderColor: theme.colors.border,
    },
    chipActive: { backgroundColor: theme.colors.primary + '14', borderColor: theme.colors.primary },
    chipText: { fontSize: 13, fontWeight: '500', color: theme.colors.text.secondary },
    chipTextActive: { color: theme.colors.primary, fontWeight: '700' },
    input: {
        backgroundColor: theme.colors.background,
        borderWidth: 1, borderColor: theme.colors.border,
        borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14,
        fontSize: 15, color: theme.colors.text.primary,
    },
    textarea: { minHeight: 130 },
    sendBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: theme.colors.primary, borderRadius: 14,
        paddingVertical: 16, marginTop: 28,
    },
    sendBtnDisabled: { opacity: 0.45 },
    sendBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    footnote: { fontSize: 12, color: theme.colors.text.tertiary, marginTop: 14, lineHeight: 17, paddingHorizontal: 4 },
});

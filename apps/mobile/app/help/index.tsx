/**
 * VAMO Mobile — Central de ajuda.
 * FAQ por categorias (acordeão) + acesso ao suporte (movido pra cá, saiu do
 * Perfil). Conteúdo estático; perguntas expandem inline.
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../src/theme/theme';
import { haptics } from '../../src/services/haptics';
import { Icon, IconName } from '../../src/components/common/Icons';
import { ScreenHeader } from '../../src/components/common/ScreenHeader';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Faq { q: string; a: string; }
interface Category { icon: IconName; title: string; faqs: Faq[]; }

const CATEGORIES: Category[] = [
    {
        icon: 'circle-user', title: 'Conta e acesso',
        faqs: [
            { q: 'Como altero meus dados pessoais?', a: 'No Perfil, toque em Conta → Dados pessoais. Edite seu nome e telefone e toque em "Salvar alterações".' },
            { q: 'Como edito minha foto de perfil?', a: 'No Perfil, toque no ícone de edição sobre o avatar para a foto de perfil, ou em "Trocar capa" para a foto de capa.' },
            { q: 'Esqueci meu acesso. O que faço?', a: 'O acesso é feito pelo e-mail cadastrado. Se você não consegue entrar, fale com o suporte por esta Central de ajuda.' },
        ],
    },
    {
        icon: 'book-open', title: 'Compras e roteiros',
        faqs: [
            { q: 'Onde vejo os roteiros que comprei?', a: 'Na aba "Meus Roteiros" da barra inferior. Todos os roteiros comprados ficam salvos na sua conta.' },
            { q: 'Posso personalizar um roteiro comprado?', a: 'Sim. Ao abrir um roteiro comprado, você pode criar a "Minha versão" com ajustes pessoais, mantendo o original intacto.' },
            { q: 'Como funciona o acesso ao roteiro após a compra?', a: 'O acesso é imediato e vitalício: o roteiro fica disponível na sua conta para consultar quando quiser.' },
        ],
    },
    {
        icon: 'compass', title: 'Roteiristas',
        faqs: [
            { q: 'Como publico um roteiro?', a: 'No Perfil, entre na Central do Roteirista e toque em "Novo roteiro". Preencha as etapas e envie para análise.' },
            { q: 'Como acompanho minhas vendas?', a: 'Na Central do Roteirista, acesse "Minhas vendas" para ver vendas e receita por roteiro.' },
            { q: 'Como funciona a aprovação de roteiros?', a: 'Após o envio, a equipe VAMO revisa o roteiro (até 48h). Você é avisado quando ele é aprovado ou precisa de ajustes.' },
            { q: 'Como melhorar o Quality Score?', a: 'Preencha todos os módulos com detalhes: itinerário diário, hospedagem, transporte, dicas, fotos de capa e estimativa de gastos.' },
        ],
    },
    {
        icon: 'card', title: 'Pagamentos e reembolsos',
        faqs: [
            { q: 'Quais formas de pagamento são aceitas?', a: 'O pagamento é processado com segurança no checkout. As formas disponíveis aparecem na hora da compra.' },
            { q: 'Como funciona o pagamento de roteiros?', a: 'Você paga uma vez pelo roteiro digital e tem acesso vitalício a ele na sua conta.' },
            { q: 'Quando posso pedir suporte sobre uma compra?', a: 'Sempre que tiver dúvida ou problema com uma compra, fale com o suporte por esta Central de ajuda.' },
        ],
    },
    {
        icon: 'star', title: 'Avaliações e comunidade',
        faqs: [
            { q: 'Como avalio um roteiro?', a: 'Após comprar, abra o roteiro e toque em avaliar. Dê uma nota e escreva sua experiência.' },
            { q: 'Posso adicionar fotos na avaliação?', a: 'Sim. Ao escrever a avaliação, você pode anexar fotos da sua viagem.' },
            { q: 'Como faço uma pergunta sobre um roteiro?', a: 'Na página do roteiro há uma seção de perguntas. Envie sua dúvida e o roteirista poderá responder.' },
        ],
    },
];

function FaqRow({ faq }: { faq: Faq }) {
    const [open, setOpen] = useState(false);
    return (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
                haptics.selection();
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setOpen((o) => !o);
            }}
            style={s.faq}
        >
            <View style={s.faqHead}>
                <Text style={s.faqQ}>{faq.q}</Text>
                <Icon name={open ? 'chevron-down' : 'chevron-right'} size={18} color={theme.colors.text.tertiary} />
            </View>
            {open && <Text style={s.faqA}>{faq.a}</Text>}
        </TouchableOpacity>
    );
}

export default function HelpCenterScreen() {
    const router = useRouter();
    return (
        <View style={s.container}>
            <ScreenHeader title="Central de ajuda" subtitle="Encontre respostas rápidas ou fale com o suporte da VAMO." />
            <ScrollView contentContainerStyle={s.scroll}>
                {CATEGORIES.map((cat) => (
                    <View key={cat.title} style={s.section}>
                        <View style={s.sectionHead}>
                            <View style={s.sectionIcon}>
                                <Icon name={cat.icon} size={18} color={theme.colors.primary} />
                            </View>
                            <Text style={s.sectionTitle}>{cat.title}</Text>
                        </View>
                        <View style={s.card}>
                            {cat.faqs.map((faq, idx) => (
                                <View key={faq.q} style={idx < cat.faqs.length - 1 ? s.faqDivider : undefined}>
                                    <FaqRow faq={faq} />
                                </View>
                            ))}
                        </View>
                    </View>
                ))}

                {/* Suporte — agora vive aqui, não no Perfil. */}
                <View style={s.supportCard}>
                    <View style={s.sectionIcon}>
                        <Icon name="message-circle" size={18} color={theme.colors.primary} />
                    </View>
                    <Text style={s.supportTitle}>Não encontrou o que procurava?</Text>
                    <Text style={s.supportText}>Nossa equipe pode ajudar com qualquer dúvida ou problema.</Text>
                    <TouchableOpacity
                        style={s.supportBtn}
                        onPress={() => { haptics.light(); router.push('/help/contact-support'); }}
                    >
                        <Icon name="message-circle" size={16} color="#fff" />
                        <Text style={s.supportBtnText}>Falar com o suporte</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.surfaceLight },
    scroll: { padding: 20, paddingBottom: 60 },
    section: { marginBottom: 22 },
    sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
    sectionIcon: {
        width: 34, height: 34, borderRadius: 17,
        backgroundColor: theme.colors.primary + '14',
        alignItems: 'center', justifyContent: 'center',
    },
    sectionTitle: { fontSize: 15, fontWeight: '800', color: theme.colors.text.primary },
    card: {
        backgroundColor: theme.colors.background,
        borderRadius: 16, overflow: 'hidden',
        borderWidth: 1, borderColor: theme.colors.borderLight,
    },
    faqDivider: { borderBottomWidth: 1, borderBottomColor: theme.colors.borderLight },
    faq: { paddingHorizontal: 16, paddingVertical: 15 },
    faqHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
    faqQ: { flex: 1, fontSize: 14.5, fontWeight: '600', color: theme.colors.text.primary },
    faqA: { fontSize: 13.5, color: theme.colors.text.secondary, lineHeight: 20, marginTop: 10 },
    supportCard: {
        backgroundColor: theme.colors.background,
        borderRadius: 16, padding: 20, alignItems: 'center',
        borderWidth: 1, borderColor: theme.colors.borderLight,
        marginTop: 4,
    },
    supportTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text.primary, marginTop: 10, textAlign: 'center' },
    supportText: { fontSize: 13.5, color: theme.colors.text.secondary, textAlign: 'center', marginTop: 6, lineHeight: 19 },
    supportBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: theme.colors.primary, borderRadius: 14,
        paddingHorizontal: 24, paddingVertical: 13, marginTop: 16,
    },
    supportBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { theme } from '../../src/theme/theme';

export default function ProfileScreen() {
    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>👤</Text>
                </View>
                <Text style={styles.headerTitle}>Bem-vindo ao VAMO!</Text>
                <Text style={styles.headerSubtitle}>
                    Faça login para acessar todos os recursos
                </Text>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Login Card */}
                <View style={styles.loginCard}>
                    <Text style={styles.loginTitle}>Entre ou cadastre-se</Text>
                    <Text style={styles.loginText}>
                        Acesse sua conta para salvar pacotes favoritos, comprar roteiros e muito mais.
                    </Text>

                    <TouchableOpacity
                        style={styles.loginButton}
                        onPress={() => Alert.alert(
                            '🔐 Login',
                            'Função de login será implementada em breve. Por enquanto, explore o app!',
                            [{ text: 'Ok', style: 'default' }]
                        )}
                    >
                        <Text style={styles.loginButtonText}>Fazer Login</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.signupButton}
                        onPress={() => Alert.alert(
                            '✨ Criar Conta',
                            'Cadastro de usuários será implementado em breve. Por enquanto, explore o app!',
                            [{ text: 'Ok', style: 'default' }]
                        )}
                    >
                        <Text style={styles.signupButtonText}>Criar Conta</Text>
                    </TouchableOpacity>
                </View>

                {/* Features */}
                <View style={styles.featuresSection}>
                    <Text style={styles.sectionTitle}>Com sua conta você pode:</Text>

                    <FeatureCard
                        icon="❤️"
                        title="Salvar Favoritos"
                        description="Marque pacotes e roteiros para ver depois"
                    />

                    <FeatureCard
                        icon="🔔"
                        title="Alertas de Preço"
                        description="Receba notificações quando o preço baixar"
                    />

                    <FeatureCard
                        icon="📝"
                        title="Histórico de Buscas"
                        description="Acesse suas pesquisas anteriores facilmente"
                    />

                    <FeatureCard
                        icon="💬"
                        title="Avaliações"
                        description="Compartilhe suas experiências de viagem"
                    />

                    <FeatureCard
                        icon="💰"
                        title="Venda Roteiros"
                        description="Transforme suas viagens em renda extra"
                    />
                </View>

                {/* About Section */}
                <View style={styles.aboutSection}>
                    <Text style={styles.sectionTitle}>Sobre o VAMO</Text>
                    <Text style={styles.aboutText}>
                        O VAMO é sua plataforma completa para planejar viagens. Conectamos você com agências confiáveis e viajantes experientes.
                    </Text>
                    <Text style={styles.aboutText}>
                        Encontre pacotes de agências renomadas ou compre roteiros detalhados de quem já viajou. Tudo em um só lugar!
                    </Text>
                </View>

                {/* Quick Links */}
                <View style={styles.linksSection}>
                    <LinkItem
                        icon="📧"
                        title="Contato"
                        onPress={() => Linking.openURL('mailto:contato@vamo.com.br')}
                    />
                    <LinkItem
                        icon="❓"
                        title="Ajuda e Suporte"
                        onPress={() => Alert.alert('Ajuda', 'Central de ajuda em breve!')}
                    />
                    <LinkItem
                        icon="📄"
                        title="Termos de Uso"
                        onPress={() => Alert.alert('Termos de Uso', 'Os termos de uso serão exibidos aqui.')}
                    />
                    <LinkItem
                        icon="🔒"
                        title="Política de Privacidade"
                        onPress={() => Alert.alert('Privacidade', 'Nossa política de privacidade será exibida aqui.')}
                    />
                    <LinkItem
                        icon="ℹ️"
                        title="Sobre Nós"
                        onPress={() => Alert.alert('Sobre o VAMO', 'O VAMO é sua plataforma completa para planejar viagens inesquecíveis. Conectamos você com agências confiáveis e viajantes experientes.')}
                    />
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>VAMO v1.0.0</Text>
                    <Text style={styles.footerText}>© 2026 VAMO. Todos os direitos reservados.</Text>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
    return (
        <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>{icon}</Text>
            <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{title}</Text>
                <Text style={styles.featureDescription}>{description}</Text>
            </View>
        </View>
    );
}

function LinkItem({ icon, title, onPress }: { icon: string; title: string; onPress?: () => void }) {
    return (
        <TouchableOpacity style={styles.linkItem} onPress={onPress}>
            <View style={styles.linkLeft}>
                <Text style={styles.linkIcon}>{icon}</Text>
                <Text style={styles.linkTitle}>{title}</Text>
            </View>
            <Text style={styles.linkArrow}>›</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        paddingHorizontal: theme.spacing.md,
        paddingTop: 60,
        paddingBottom: theme.spacing.xl,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: theme.colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: theme.spacing.md,
    },
    avatarText: {
        fontSize: 40,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: theme.colors.text.inverse,
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: theme.colors.text.inverse,
        opacity: 0.9,
        textAlign: 'center',
    },
    content: {
        flex: 1,
    },
    loginCard: {
        margin: theme.spacing.md,
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.background,
        borderRadius: theme.borderRadius.lg,
        ...theme.shadows.medium,
        alignItems: 'center',
    },
    loginTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.sm,
    },
    loginText: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        marginBottom: theme.spacing.lg,
        lineHeight: 20,
    },
    loginButton: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.borderRadius.full,
        width: '100%',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    loginButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text.inverse,
    },
    signupButton: {
        backgroundColor: theme.colors.background,
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.borderRadius.full,
        width: '100%',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: theme.colors.primary,
    },
    signupButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.primary,
    },
    featuresSection: {
        paddingHorizontal: theme.spacing.md,
        marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.md,
    },
    featureCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surfaceLight,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        marginBottom: theme.spacing.sm,
        gap: theme.spacing.md,
    },
    featureIcon: {
        fontSize: 28,
    },
    featureContent: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.text.primary,
        marginBottom: 2,
    },
    featureDescription: {
        fontSize: 13,
        color: theme.colors.text.secondary,
        lineHeight: 18,
    },
    aboutSection: {
        paddingHorizontal: theme.spacing.md,
        marginBottom: theme.spacing.lg,
    },
    aboutText: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        lineHeight: 22,
        marginBottom: theme.spacing.sm,
    },
    linksSection: {
        paddingHorizontal: theme.spacing.md,
        marginBottom: theme.spacing.lg,
    },
    linkItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    linkLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
    },
    linkIcon: {
        fontSize: 20,
    },
    linkTitle: {
        fontSize: 15,
        color: theme.colors.text.primary,
    },
    linkArrow: {
        fontSize: 24,
        color: theme.colors.text.disabled,
    },
    footer: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.lg,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        color: theme.colors.text.disabled,
        marginBottom: 4,
    },
});

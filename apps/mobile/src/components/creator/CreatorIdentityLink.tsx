/**
 * CreatorIdentityLink — bloco compacto de identidade do roteirista (avatar,
 * nome, selo, avaliação e vendas) que abre o PERFIL PÚBLICO do criador.
 *
 * Regras:
 *  - O bloco INTEIRO é a área clicável (avatar, nome, selo, stats e o espaço
 *    vazio interno do card). Nada de "só o nome é link".
 *  - O href vem de utils/creatorProfile (`getCreatorProfileHref`) — nunca
 *    montado na mão. Sem id válido, o bloco continua renderizando os mesmos
 *    dados, só que inerte (sem CTA, sem cursor, sem foco).
 *  - Usa `Link` do expo-router com `asChild`: na web vira uma âncora `<a>` de
 *    verdade (foco por teclado, Enter, abrir em nova aba), no nativo cai no
 *    onPress normal do Pressable.
 *  - A linha "Como verificamos os criadores" NÃO entra aqui: é outra ação e
 *    fica fora deste componente, na tela.
 *
 * Atenção ao usar: o estilo passado ao Pressable precisa ser um OBJETO plano
 * (o Slot do expo-router faz spread do style ao mesclar com o filho — array ou
 * função seriam perdidos). Por isso o StyleSheet.flatten abaixo.
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, StyleProp, ViewStyle } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { Icon } from '../common/Icons';
import { CreatorAvatar } from '../common/CreatorAvatar';
import { VerifiedBadge } from './VerifiedBadge';

export interface CreatorIdentityLinkProps {
    /** Objeto creator do roteiro (usado para avatar/selo). */
    creator?: { avatar?: string | null; avatarUrl?: string | null; profileImageUrl?: string | null; name?: string | null; verificationLevel?: string | null } | null;
    /** Nome exibido (já com fallback resolvido pela tela). */
    name: string;
    /** Nota média exibida ao lado da estrela. */
    rating: number;
    /** Vendas exibidas ao lado da nota. */
    salesCount: number;
    /** Rota do perfil público, ou `null` quando não há id de criador. */
    href: string | null;
    /** Disparado no toque/clique, antes da navegação (analytics). */
    onOpen?: () => void;
    style?: StyleProp<ViewStyle>;
    testID?: string;
}

export function CreatorIdentityLink({
    creator,
    name,
    rating,
    salesCount,
    href,
    onOpen,
    style,
    testID = 'creator-identity-link',
}: CreatorIdentityLinkProps) {
    const [hovered, setHovered] = useState(false);
    const [pressed, setPressed] = useState(false);
    const [focused, setFocused] = useState(false);

    const content = (
        <>
            <CreatorAvatar creator={creator} name={name} size={40} style={styles.avatar} />
            <View style={styles.identity}>
                <View style={styles.nameRow}>
                    <Text style={styles.name} numberOfLines={1}>{name}</Text>
                    <VerifiedBadge level={(creator?.verificationLevel as any) || 'basic'} size="small" showLabel={false} />
                </View>
                <View style={styles.statsRow}>
                    <Icon name="star" size={11} color="#F59E0B" strokeWidth={2.5} />
                    <Text style={styles.stats}>
                        {rating.toFixed(1)} · {salesCount.toLocaleString('pt-BR')} vendas
                    </Text>
                </View>
            </View>
            {!!href && (
                <View style={styles.cta} pointerEvents="none">
                    <Text style={styles.ctaText}>Ver perfil</Text>
                    <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
                </View>
            )}
        </>
    );

    // Sem id de criador: mesmo layout, sem interação (nada de /creator/undefined).
    if (!href) {
        return (
            <View style={[styles.card, style]} testID={`${testID}-static`}>
                {content}
            </View>
        );
    }

    // Objeto plano — ver nota no topo do arquivo sobre o Slot do expo-router.
    const flatStyle = StyleSheet.flatten([
        styles.card,
        (hovered || pressed) && styles.cardActive,
        focused && styles.cardFocused,
        style,
    ]);

    return (
        // `push` (e não o `navigate` padrão do Link): detalhes do roteiro e
        // perfil do criador são irmãos dentro de (tabs); sem push o histórico
        // seria SUBSTITUÍDO e o "voltar" pularia a tela de detalhes.
        <Link href={href as any} push asChild>
            <Pressable
                testID={testID}
                style={flatStyle}
                onPress={onOpen}
                onHoverIn={() => setHovered(true)}
                onHoverOut={() => setHovered(false)}
                onPressIn={() => setPressed(true)}
                onPressOut={() => setPressed(false)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                accessibilityRole="link"
                accessibilityLabel={`Ver perfil de ${name}`}
                accessibilityHint="Abre o perfil público do roteirista"
            >
                {content}
            </Pressable>
        </Link>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16,
        minHeight: 44,
        gap: 12,
        // Borda transparente por padrão: o anel de foco só troca a COR, então
        // não há salto de layout entre foco e repouso.
        borderWidth: 1,
        borderColor: 'transparent',
        ...theme.shadows.small,
        ...Platform.select({ web: { cursor: 'pointer', transitionDuration: '150ms' } as object, default: {} }),
    },
    cardActive: {
        backgroundColor: theme.colors.surfaceHighlight,
    },
    cardFocused: {
        borderColor: theme.colors.primary,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: theme.colors.primary + '15',
        alignItems: 'center',
        justifyContent: 'center',
    },
    identity: {
        flexShrink: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    name: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.text.primary,
        flexShrink: 1,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2,
    },
    stats: {
        fontSize: 12,
        color: theme.colors.text.secondary,
    },
    cta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        marginLeft: 'auto',
        paddingLeft: 8,
    },
    ctaText: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.primary,
    },
});

export default CreatorIdentityLink;

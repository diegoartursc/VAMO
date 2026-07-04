/**
 * CreatorAvatar — avatar circular único para criador/usuário em todo o app.
 *
 * Renderiza a foto real quando existe (resolveCreatorAvatar), senão cai num
 * fallback consistente: iniciais do nome (quando houver) ou o ícone
 * circle-user. Centraliza a regra para nenhum card "esquecer" de ler a foto.
 *
 * Uso:
 *   <CreatorAvatar creator={itinerary.creator} size={36} />
 *   <CreatorAvatar avatar={review.user.avatar} name={review.user.name} size={40} />
 */
import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, StyleProp, ViewStyle, ImageStyle } from 'react-native';
import { theme } from '../../theme/theme';
import { Icon } from './Icons';
import { resolveAvatarUrl, resolveCreatorAvatar, initialsFromName } from '../../utils/avatar';

export interface CreatorAvatarProps {
    /** Objeto creator-like ({ avatar, avatarUrl, profileImageUrl }). */
    creator?: { avatar?: string | null; avatarUrl?: string | null; profileImageUrl?: string | null; name?: string | null } | null;
    /** Ou passe o avatar diretamente (ex.: review.user.avatar). */
    avatar?: string | null;
    /** Nome usado para gerar iniciais no fallback. */
    name?: string | null;
    /** Diâmetro em px (default 36). */
    size?: number;
    /** Cor de fundo do círculo de fallback. */
    backgroundColor?: string;
    /** Cor do ícone/iniciais de fallback. */
    tint?: string;
    style?: StyleProp<ViewStyle>;
}

export const CreatorAvatar: React.FC<CreatorAvatarProps> = ({
    creator,
    avatar,
    name,
    size = 36,
    backgroundColor,
    tint = theme.colors.primary,
    style,
}) => {
    const url = avatar !== undefined
        ? resolveAvatarUrl(avatar)
        : resolveCreatorAvatar(creator);
    const displayName = name ?? creator?.name ?? null;
    const initials = initialsFromName(displayName);

    // onError marca falha de carregamento → cai no fallback. Reseta quando a
    // URL muda (novo upload), para não "lembrar" erro de uma URL antiga.
    const [errored, setErrored] = useState(false);
    useEffect(() => { setErrored(false); }, [url]);

    const dimension = { width: size, height: size, borderRadius: size / 2 };
    const bg = backgroundColor ?? theme.colors.primary + '15';

    if (url && !errored) {
        return (
            <Image
                source={{ uri: url }}
                style={[dimension, styles.image, style as StyleProp<ImageStyle>]}
                resizeMode="cover"
                onError={() => setErrored(true)}
                accessibilityLabel={displayName ? `Foto de ${displayName}` : 'Foto de perfil'}
            />
        );
    }

    return (
        <View style={[dimension, styles.fallback, { backgroundColor: bg }, style]}>
            {initials ? (
                <Text style={[styles.initials, { color: tint, fontSize: size * 0.4 }]}>{initials}</Text>
            ) : (
                <Icon name="circle-user" size={size * 0.56} color={tint} />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    image: { backgroundColor: theme.colors.surfaceLight },
    fallback: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    initials: { fontWeight: '800' },
});

export default CreatorAvatar;

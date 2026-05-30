import { Alert, Platform } from 'react-native';
import * as Linking from 'expo-linking';

type OpenExternalUrlOptions = {
    invalidMessage?: string;
    fallbackMessage?: string;
};

export function normalizeExternalUrl(url?: string | null): string | null {
    const value = typeof url === 'string' ? url.trim() : '';
    if (!value || !/^https?:\/\//i.test(value)) return null;
    return value;
}

export async function openExternalUrl(
    url?: string | null,
    options: OpenExternalUrlOptions = {},
): Promise<boolean> {
    const value = normalizeExternalUrl(url);
    const invalidMessage = options.invalidMessage || 'Este link não está em um formato válido.';
    const fallbackMessage = options.fallbackMessage || 'Não foi possível abrir este link agora.';

    if (!value) {
        Alert.alert('Link indisponível', invalidMessage);
        return false;
    }

    try {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
            window.open(value, '_blank', 'noopener,noreferrer');
            return true;
        }

        const canOpen = await Linking.canOpenURL(value);
        if (!canOpen) {
            Alert.alert('Link indisponível', fallbackMessage);
            return false;
        }

        await Linking.openURL(value);
        return true;
    } catch {
        Alert.alert('Link indisponível', fallbackMessage);
        return false;
    }
}

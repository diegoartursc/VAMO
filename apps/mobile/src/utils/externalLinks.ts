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
    const invalidMessage = options.invalidMessage || 'This link isn\'t in a valid format.';
    const fallbackMessage = options.fallbackMessage || 'We couldn\'t open this link right now.';

    if (!value) {
        Alert.alert('Link unavailable', invalidMessage);
        return false;
    }

    try {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
            window.open(value, '_blank', 'noopener,noreferrer');
            return true;
        }

        const canOpen = await Linking.canOpenURL(value);
        if (!canOpen) {
            Alert.alert('Link unavailable', fallbackMessage);
            return false;
        }

        await Linking.openURL(value);
        return true;
    } catch {
        Alert.alert('Link unavailable', fallbackMessage);
        return false;
    }
}

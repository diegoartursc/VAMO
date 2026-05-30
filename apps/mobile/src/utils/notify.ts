import { Alert, Platform } from 'react-native';

interface NotifyOptions {
    title: string;
    message?: string;
    onDismiss?: () => void;
}

/**
 * Alerta informativo cross-platform (info/sucesso/erro — botão único "OK").
 *
 * `Alert.alert` do react-native é um NO-OP no React Native Web — nenhum
 * diálogo aparece. Isso quebra silenciosamente toda mensagem de erro,
 * validação ou sucesso quando o app roda no navegador (Expo Web).
 *
 * No web usamos `window.alert` (síncrono e bloqueante, mas funcional);
 * no nativo, `Alert.alert` com um botão "OK". O callback `onDismiss`
 * dispara depois do usuário fechar o diálogo (web ou nativo).
 *
 * Use este helper para validações, mensagens de erro e confirmações de
 * sucesso. Para confirmações "sim/não", use `confirm()` em `./confirm.ts`.
 */
export function notify({ title, message, onDismiss }: NotifyOptions): void {
    if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && typeof window.alert === 'function') {
            const text = message ? `${title}\n\n${message}` : title;
            window.alert(text);
        }
        onDismiss?.();
        return;
    }

    Alert.alert(title, message, [{ text: 'OK', onPress: onDismiss }]);
}

export default notify;

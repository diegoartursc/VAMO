import { Alert, Platform } from 'react-native';

interface ConfirmOptions {
    title: string;
    message?: string;
    /** Rótulo do botão de confirmação (nativo). No web o navegador usa "OK". */
    confirmText?: string;
    /** Rótulo do botão de cancelar (nativo). No web o navegador usa "Cancelar". */
    cancelText?: string;
    /** Estiliza o botão de confirmação como destrutivo (vermelho) no iOS. */
    destructive?: boolean;
}

/**
 * Confirmação cross-platform.
 *
 * `Alert.alert` do react-native é um NO-OP no React Native Web — nenhum
 * diálogo aparece e o `onPress` dos botões nunca dispara. Isso quebra
 * silenciosamente qualquer confirmação (remover do carrinho, limpar, etc.)
 * quando o app roda no navegador.
 *
 * Aqui usamos `window.confirm` no web (síncrono e bloqueante, mas funcional)
 * e o `Alert.alert` nativo nas plataformas mobile. Retorna `true` quando o
 * usuário confirma.
 */
export function confirm({
    title,
    message,
    confirmText = 'OK',
    cancelText = 'Cancelar',
    destructive = false,
}: ConfirmOptions): Promise<boolean> {
    if (Platform.OS === 'web') {
        if (typeof window === 'undefined' || typeof window.confirm !== 'function') {
            return Promise.resolve(true);
        }
        const text = message ? `${title}\n\n${message}` : title;
        return Promise.resolve(window.confirm(text));
    }

    return new Promise((resolve) => {
        Alert.alert(title, message, [
            { text: cancelText, style: 'cancel', onPress: () => resolve(false) },
            {
                text: confirmText,
                style: destructive ? 'destructive' : 'default',
                onPress: () => resolve(true),
            },
        ]);
    });
}

export default confirm;

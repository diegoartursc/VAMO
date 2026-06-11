import { Alert, Platform } from 'react-native';

export type NotifyVariant = 'info' | 'success' | 'error' | 'warning';

export interface NotifyOptions {
    title: string;
    message?: string;
    onDismiss?: () => void;
    /** Variante visual do modal VAMO (cor do ícone/realce). Default 'info'. */
    variant?: NotifyVariant;
    /** Ícone Ionicons custom. Se ausente, escolhido pela variante. */
    icon?: string;
    /** Rótulo do botão único. Default 'OK'. */
    okText?: string;
}

/**
 * Implementação real injetada pelo `VamoConfirmHost`. Fallback nativo
 * (`window.alert` / `Alert.alert`) só roda se o host ainda não montou.
 */
type NotifyImpl = (opts: NotifyOptions) => Promise<void>;
let _impl: NotifyImpl | null = null;

/** Chamado pelo VamoConfirmHost no mount/unmount. Uso interno. */
export function _registerNotifyImpl(impl: NotifyImpl | null): void {
    _impl = impl;
}

/**
 * Alerta informativo (info/sucesso/erro — botão único) com identidade VAMO.
 *
 * Quando o `VamoConfirmHost` está montado, abre o modal premium da VAMO.
 * Caso contrário, fallback nativo — nunca silencia validações/erros.
 *
 * Use para validações, mensagens de erro e confirmações de sucesso. Para
 * confirmações "sim/não", use `confirm()` em `./confirm.ts`.
 */
export function notify(opts: NotifyOptions): void {
    if (_impl) {
        void _impl(opts).then(() => opts.onDismiss?.());
        return;
    }

    // ── Fallback nativo (host ausente) ──
    const { title, message, onDismiss } = opts;
    if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && typeof window.alert === 'function') {
            const text = message ? `${title}\n\n${message}` : title;
            window.alert(text);
        }
        onDismiss?.();
        return;
    }
    Alert.alert(title, message, [{ text: opts.okText ?? 'OK', onPress: onDismiss }]);
}

export default notify;

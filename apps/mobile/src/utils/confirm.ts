import { Alert, Platform } from 'react-native';

export type ConfirmVariant = 'danger' | 'warning' | 'info' | 'success';

export interface ConfirmOptions {
    title: string;
    message?: string;
    /** Rótulo do botão de confirmação. */
    confirmText?: string;
    /** Rótulo do botão de cancelar. */
    cancelText?: string;
    /** Atalho histórico: `true` → variante 'danger'. Continua aceito. */
    destructive?: boolean;
    /** Variante visual do modal VAMO. Default: 'danger' quando destructive, senão 'info'. */
    variant?: ConfirmVariant;
    /** Ícone Ionicons custom no topo. Se ausente, escolhido pela variante. */
    icon?: string;
    /** Permite fechar tocando no backdrop (cancela). Default true; passe false em ações críticas. */
    closeOnBackdrop?: boolean;
}

/**
 * Implementação real injetada pelo `VamoConfirmHost` (modal com identidade
 * VAMO, montado uma vez na raiz do app). Enquanto o host não registra,
 * caímos no fallback nativo — garante que confirmações nunca silenciem
 * (render fora do app, testes, ou ordem de mount).
 */
type ConfirmImpl = (opts: ConfirmOptions) => Promise<boolean>;
let _impl: ConfirmImpl | null = null;

/** Chamado pelo VamoConfirmHost no mount/unmount. Uso interno. */
export function _registerConfirmImpl(impl: ConfirmImpl | null): void {
    _impl = impl;
}

/**
 * Confirmação sim/não com identidade visual VAMO.
 *
 * Quando o `VamoConfirmHost` está montado (sempre, em produção), abre o
 * modal premium da VAMO. Fallback nativo (`window.confirm` no web,
 * `Alert.alert` no nativo) só é usado se o host ainda não registrou —
 * nunca deixa a confirmação virar no-op silencioso.
 *
 * Retorna `true` quando o usuário confirma.
 */
export function confirm(opts: ConfirmOptions): Promise<boolean> {
    if (_impl) return _impl(opts);

    // ── Fallback nativo (host ausente) ──
    const { title, message, confirmText = 'OK', cancelText = 'Cancelar', destructive = false } = opts;
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

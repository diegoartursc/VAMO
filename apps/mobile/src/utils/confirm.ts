import { Alert, Platform } from 'react-native';

export type ConfirmVariant = 'danger' | 'warning' | 'info' | 'success';

/**
 * Ação semântica do diálogo — resolve ícone + variante a partir de um mapa
 * central no `VamoConfirmHost` (CONFIRM_ACTION_CONFIG). Evita lixeira em
 * tudo que é "destructive" e mantém o tom visual VAMO coerente.
 *
 * Se você passar `action`, NÃO precisa passar `icon`/`variant`/`destructive`.
 * Mas se passar, os explícitos vencem (escape hatch para casos especiais).
 */
export type ConfirmAction =
    | 'delete'           // excluir/deletar/apagar permanentemente — lixeira, danger
    | 'remove'           // remover item genérico — lixeira, danger
    | 'logout'           // sair da conta — porta/seta, info
    | 'discard'          // descartar alterações — alerta, warning
    | 'archive'          // arquivar — caixa, warning
    | 'submit'           // enviar para análise — paper plane, info
    | 'publish'          // publicar — globo/foguete, success
    | 'clearCart'        // limpar carrinho — carrinho-X, danger
    | 'removeFromCart'   // remover item do carrinho — carrinho-X, danger
    | 'removeFile'       // remover arquivo — documento-X, danger
    | 'removeFavorite'   // remover favorito — coração quebrado, warning
    | 'restore'          // restaurar original — refresh, info
    | 'hide'             // ocultar item da Minha versão — olho-fechado, warning
    | 'cancelUpload'     // cancelar upload — nuvem-X, warning
    | 'payment'          // confirmar pagamento — cartão, success
    | 'purchase'         // confirmar compra — carrinho-check, info
    | 'deleteAccount'    // excluir conta — usuário-X, danger
    | 'checklistRemove'  // remover item do checklist — lixeira, danger
    ;

export interface ConfirmOptions {
    title: string;
    message?: string;
    /** Rótulo do botão de confirmação. */
    confirmText?: string;
    /** Rótulo do botão de cancelar. */
    cancelText?: string;
    /**
     * Ação semântica — resolve icon+variant via CONFIRM_ACTION_CONFIG.
     * Preferir isso a passar icon/variant manualmente. icon/variant explícitos
     * (ou `destructive: true`) ainda vencem se passados juntos.
     */
    action?: ConfirmAction;
    /** Atalho histórico: `true` → variante 'danger'. Continua aceito. */
    destructive?: boolean;
    /** Variante visual do modal VAMO. Default: vem de `action`; senão 'danger' quando destructive, senão 'info'. */
    variant?: ConfirmVariant;
    /** Ícone Ionicons custom no topo. Se ausente, vem de `action` ou da variante. */
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

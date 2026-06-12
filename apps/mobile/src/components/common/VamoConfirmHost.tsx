/**
 * VamoConfirmHost — host único (montado na raiz) do modal de confirmação/aviso
 * com identidade visual VAMO. Substitui window.confirm / window.alert /
 * Alert.alert por um bottom-sheet (mobile) / card centralizado (telas largas)
 * premium, coerente com o design system.
 *
 * Arquitetura:
 *   - Registra implementações imperativas em `utils/confirm` e `utils/notify`
 *     no mount. Assim, TODO call-site que já usa `confirm({...})` / `notify({...})`
 *     passa a abrir este modal — zero mudança nas telas.
 *   - Fila de 1 diálogo por vez (requests concorrentes enfileiram).
 *   - `useVamoConfirm()` expõe o mesmo `confirm` para quem preferir hook.
 *
 * Padrão optimista: ao confirmar, o modal fecha e a Promise resolve `true`;
 * o caller faz a ação assíncrona (com seu próprio loading/rollback), como já
 * é o padrão do app. Erros são comunicados pelo caller via `notify`.
 */

import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Easing,
    Pressable,
    useWindowDimensions,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../../theme/theme';
import { haptics } from '../../services/haptics';
import {
    _registerConfirmImpl,
    type ConfirmOptions,
    type ConfirmVariant,
} from '../../utils/confirm';
import {
    _registerNotifyImpl,
    type NotifyOptions,
    type NotifyVariant,
} from '../../utils/notify';

type Variant = ConfirmVariant | NotifyVariant;

type ConfirmRequest = { kind: 'confirm'; opts: ConfirmOptions; resolve: (v: boolean) => void };
type NotifyRequest = { kind: 'notify'; opts: NotifyOptions; resolve: () => void };
type Request = ConfirmRequest | NotifyRequest;

/** Cor de realce (ícone + botão principal) por variante. */
const ACCENT: Record<Variant, string> = {
    danger: theme.colors.error,
    error: theme.colors.error,
    warning: theme.colors.warning,
    info: theme.colors.primary,
    success: theme.colors.success,
};

/** Ícone default por variante (caller pode sobrescrever via `icon`). */
const DEFAULT_ICON: Record<Variant, string> = {
    danger: 'trash-outline',
    error: 'alert-circle-outline',
    warning: 'alert-circle-outline',
    info: 'help-circle-outline',
    success: 'checkmark-circle-outline',
};

/**
 * `info` significa coisas diferentes por tipo de diálogo:
 *  - confirm: é uma PERGUNTA ("Sair da conta?") → interrogação.
 *  - notify: é um AVISO ("Data ajustada") → ícone de informação.
 * Sem essa distinção, todo aviso informativo saía com "?" — semanticamente
 * errado e a maior fonte de ícone inadequado nos popups.
 */
function defaultIconFor(req: Request, variant: Variant): string {
    if (req.kind === 'notify' && variant === 'info') return 'information-circle-outline';
    return DEFAULT_ICON[variant];
}

function resolveVariant(req: Request): Variant {
    if (req.kind === 'confirm') {
        return req.opts.variant ?? (req.opts.destructive ? 'danger' : 'info');
    }
    return req.opts.variant ?? 'info';
}

const ConfirmContext = createContext<{ confirm: (o: ConfirmOptions) => Promise<boolean> } | null>(null);

/** Hook opcional — mesma função imperativa de `utils/confirm`, via contexto. */
export function useVamoConfirm() {
    const ctx = useContext(ConfirmContext);
    if (!ctx) throw new Error('useVamoConfirm precisa do <VamoConfirmHost /> montado na raiz.');
    return ctx;
}

export function VamoConfirmHost({ children }: { children?: React.ReactNode }) {
    const { width, height } = useWindowDimensions();
    const isWide = width >= 600;

    const [current, setCurrent] = useState<Request | null>(null);
    const queueRef = useRef<Request[]>([]);
    const anim = useRef(new Animated.Value(0)).current;

    // ── Registro das implementações imperativas (confirm/notify) ──
    useEffect(() => {
        const enqueue = (req: Request) => {
            queueRef.current.push(req);
            // Se nada está aberto, puxa já; senão entra na fila.
            setCurrent((cur) => cur ?? queueRef.current.shift() ?? null);
        };
        _registerConfirmImpl(
            (opts) => new Promise<boolean>((resolve) => enqueue({ kind: 'confirm', opts, resolve })),
        );
        _registerNotifyImpl(
            (opts) => new Promise<void>((resolve) => enqueue({ kind: 'notify', opts, resolve })),
        );
        return () => {
            _registerConfirmImpl(null);
            _registerNotifyImpl(null);
        };
    }, []);

    // ── Anima entrada quando há diálogo ──
    useEffect(() => {
        if (current) {
            anim.setValue(0);
            Animated.timing(anim, {
                toValue: 1,
                duration: 220,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }).start();
        }
    }, [current, anim]);

    // ── Após fechar, puxa o próximo da fila ──
    const advanceQueue = useCallback(() => {
        setCurrent(queueRef.current.shift() ?? null);
    }, []);

    const close = useCallback(
        (result: boolean) => {
            const req = current;
            Animated.timing(anim, {
                toValue: 0,
                duration: 160,
                easing: Easing.in(Easing.cubic),
                useNativeDriver: true,
            }).start(() => {
                if (req) {
                    if (req.kind === 'confirm') req.resolve(result);
                    else req.resolve();
                }
                advanceQueue();
            });
        },
        [current, anim, advanceQueue],
    );

    // Imperativo via contexto (paridade com utils/confirm).
    const ctxValue = useRef({
        confirm: (opts: ConfirmOptions) =>
            new Promise<boolean>((resolve) => {
                queueRef.current.push({ kind: 'confirm', opts, resolve });
                setCurrent((cur) => cur ?? queueRef.current.shift() ?? null);
            }),
    }).current;

    const variant = current ? resolveVariant(current) : 'info';
    const accent = ACCENT[variant];
    const isConfirm = current?.kind === 'confirm';
    const opts = current?.opts as (ConfirmOptions & NotifyOptions) | undefined;
    const iconName = (opts?.icon ?? (current ? defaultIconFor(current, variant) : DEFAULT_ICON[variant])) as any;
    const closeOnBackdrop = current?.kind === 'confirm' ? current.opts.closeOnBackdrop !== false : true;

    const backdropOpacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
    const sheetTranslate = anim.interpolate({ inputRange: [0, 1], outputRange: [isWide ? 16 : 40, 0] });
    const sheetScale = anim.interpolate({ inputRange: [0, 1], outputRange: [isWide ? 0.96 : 1, 1] });

    return (
        <ConfirmContext.Provider value={ctxValue}>
            {children}
            {current && (
                <View style={[StyleSheet.absoluteFill, styles.root, isWide && styles.rootCentered]} pointerEvents="box-none">
                    <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: backdropOpacity }]}>
                        <Pressable
                            style={StyleSheet.absoluteFill}
                            disabled={!closeOnBackdrop}
                            onPress={() => closeOnBackdrop && close(false)}
                            accessibilityLabel="Fechar"
                        />
                    </Animated.View>

                    <Animated.View
                        accessibilityRole={Platform.OS === 'web' ? ('dialog' as any) : undefined}
                        accessibilityViewIsModal
                        style={[
                            styles.sheet,
                            isWide ? styles.sheetCentered : styles.sheetBottom,
                            { opacity: anim, transform: [{ translateY: sheetTranslate }, { scale: sheetScale }] },
                            { maxHeight: height * 0.85 },
                        ]}
                    >
                        <View style={[styles.iconCircle, { backgroundColor: accent + '18' }]}>
                            <Ionicons name={iconName} size={26} color={accent} />
                        </View>

                        <Text style={styles.title}>{opts?.title}</Text>
                        {opts?.message ? <Text style={styles.message}>{opts.message}</Text> : null}

                        <View style={[styles.actions, isWide && styles.actionsWide]}>
                            {isConfirm && (
                                <TouchableOpacity
                                    style={[styles.btn, styles.btnSecondary]}
                                    onPress={() => { haptics.selection(); close(false); }}
                                    activeOpacity={0.85}
                                    accessibilityRole="button"
                                    accessibilityLabel={(current as ConfirmRequest).opts.cancelText ?? 'Cancelar'}
                                >
                                    <Text style={styles.btnSecondaryLabel}>
                                        {(current as ConfirmRequest).opts.cancelText ?? 'Cancelar'}
                                    </Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                style={[styles.btn, { backgroundColor: accent }]}
                                onPress={() => {
                                    if (isConfirm) { haptics.medium(); close(true); }
                                    else { haptics.light(); close(false); }
                                }}
                                activeOpacity={0.85}
                                accessibilityRole="button"
                                accessibilityLabel={
                                    isConfirm
                                        ? ((current as ConfirmRequest).opts.confirmText ?? 'Confirmar')
                                        : ((current as NotifyRequest).opts.okText ?? 'OK')
                                }
                            >
                                <Text style={styles.btnPrimaryLabel}>
                                    {isConfirm
                                        ? ((current as ConfirmRequest).opts.confirmText ?? 'Confirmar')
                                        : ((current as NotifyRequest).opts.okText ?? 'OK')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </View>
            )}
        </ConfirmContext.Provider>
    );
}

export default VamoConfirmHost;

const styles = StyleSheet.create({
    root: {
        justifyContent: 'flex-end',
        zIndex: 9999,
        ...(Platform.OS === 'web' ? ({ position: 'fixed' as any } as any) : null),
    },
    rootCentered: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    backdrop: {
        backgroundColor: 'rgba(16, 32, 64, 0.55)',
    },
    sheet: {
        backgroundColor: theme.colors.surface,
        paddingHorizontal: 22,
        paddingTop: 22,
        alignItems: 'center',
        ...theme.shadows.large,
    },
    sheetBottom: {
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingBottom: 34, // safe-area-ish para a navbar/gestos
        width: '100%',
    },
    sheetCentered: {
        borderRadius: 24,
        paddingBottom: 24,
        width: '100%',
        maxWidth: 420,
    },
    iconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
    },
    title: {
        fontSize: 19,
        fontWeight: '800',
        color: theme.colors.secondary,
        textAlign: 'center',
        marginBottom: 8,
    },
    message: {
        fontSize: 14.5,
        lineHeight: 21,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        marginBottom: 4,
        paddingHorizontal: 4,
    },
    actions: {
        flexDirection: 'column-reverse',
        gap: 10,
        alignSelf: 'stretch',
        marginTop: 22,
    },
    actionsWide: {
        flexDirection: 'row',
    },
    btn: {
        flex: 1,
        minHeight: 50,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 18,
    },
    btnSecondary: {
        backgroundColor: theme.colors.surfaceLight,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    btnSecondaryLabel: {
        fontSize: 15.5,
        fontWeight: '700',
        color: theme.colors.secondary,
    },
    btnPrimaryLabel: {
        fontSize: 15.5,
        fontWeight: '800',
        color: '#fff',
    },
});

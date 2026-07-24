import React, {
    useState,
    useEffect,
    useCallback,
    useMemo,
    useRef,
    createContext,
    useContext,
    ReactNode,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { getItineraryById, getMyTrips } from '../services/api';
import { evaluateItineraryAvailability } from '../utils/availability';

// Carrinho é por-usuário. A chave inclui o travelerId para evitar vazamento
// entre contas no mesmo dispositivo (mesma armadilha já corrigida em useFavorites).
// Usuário anônimo opera em memória — nada persiste e nada migra ao logar.
const KEY_PREFIX = '@vamo_cart';
const LEGACY_GLOBAL_KEY = '@vamo_cart';
const keyFor = (travelerId: string | null | undefined) =>
    travelerId ? `${KEY_PREFIX}:${travelerId}` : null;

export const normalizeCartItemIds = (value: unknown): string[] => {
    if (!Array.isArray(value)) return [];
    const seen = new Set<string>();
    const ids: string[] = [];
    value.forEach((item) => {
        if (typeof item !== 'string') return;
        const id = item.trim();
        if (!id || seen.has(id)) return;
        seen.add(id);
        ids.push(id);
    });
    return ids;
};

// 'checking_error' é o ÚNICO estado "não disponível" que sobrevive no
// estado do carrinho — e é transiente (falha de rede/5xx ao confirmar o
// item). Roteiros que o backend confirma como não-públicos (404) e
// roteiros já comprados são removidos do carrinho automaticamente, nunca
// renderizados como card "indisponível"/"já comprado".
export type CartItemStatus = 'loading' | 'available' | 'checking_error';

export interface CartItemMeta {
    id: string;
    status: CartItemStatus;
    itinerary?: any;
    price?: number;
}

interface CartContextType {
    cartItems: string[];
    itemsMeta: Record<string, CartItemMeta>;
    isInCart: (id: string) => boolean;
    isOwned: (id: string) => boolean;
    addToCart: (id: string) => Promise<void>;
    removeFromCart: (id: string) => Promise<void>;
    clearCart: () => Promise<void>;
    reloadAvailability: () => Promise<void>;
    totalCount: number;
    availableCount: number;
    checkingErrorCount: number;
    /** Roteiros realmente compráveis agora. Fonte ÚNICA do badge da tab. */
    cartCount: number;
    isLoading: boolean;
    isResolving: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
    children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
    const { user, accessToken } = useAuth();
    const travelerId = user?.travelerId ?? null;

    const [cartItems, setCartItems] = useState<string[]>([]);
    const [itemsMeta, setItemsMeta] = useState<Record<string, CartItemMeta>>({});
    const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [isResolving, setIsResolving] = useState(false);

    // Migration one-shot: chave global (pré-namespacing) podia vazar entre usuários.
    const legacyWiped = useRef(false);
    useEffect(() => {
        if (legacyWiped.current) return;
        legacyWiped.current = true;
        AsyncStorage.removeItem(LEGACY_GLOBAL_KEY).catch(() => {});
    }, []);

    // Hidrata carrinho do storage quando o usuário muda.
    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setIsLoading(true);
            const key = keyFor(travelerId);
            if (!key) {
                if (!cancelled) {
                    setCartItems([]);
                    setItemsMeta({});
                    setOwnedIds(new Set());
                    setIsLoading(false);
                }
                return;
            }
            try {
                const stored = await AsyncStorage.getItem(key);
                if (cancelled) return;
                if (stored) {
                    const normalized = normalizeCartItemIds(JSON.parse(stored));
                    setCartItems(normalized);
                    if (stored !== JSON.stringify(normalized)) {
                        await AsyncStorage.setItem(key, JSON.stringify(normalized));
                    }
                } else {
                    setCartItems([]);
                }
            } catch (error) {
                console.error('Error loading cart:', error);
                if (!cancelled) setCartItems([]);
                AsyncStorage.removeItem(key).catch(() => {});
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, [travelerId]);

    // Carrega ids já comprados (para bloquear duplicata + flag "owned").
    useEffect(() => {
        let cancelled = false;
        if (!accessToken || !travelerId) {
            setOwnedIds(new Set());
            return;
        }
        getMyTrips(accessToken)
            .then((res) => {
                if (cancelled) return;
                const ids = new Set<string>();
                (res?.purchasedItineraries || []).forEach((p: any) => {
                    if (p?.id) ids.add(String(p.id));
                });
                setOwnedIds(ids);
            })
            .catch(() => {
                if (!cancelled) setOwnedIds(new Set());
            });
        return () => { cancelled = true; };
    }, [accessToken, travelerId]);

    const persist = useCallback(async (items: string[]) => {
        const key = keyFor(travelerId);
        if (!key) return; // anônimo: só memória
        try {
            await AsyncStorage.setItem(key, JSON.stringify(items));
        } catch (error) {
            console.error('Error saving cart:', error);
        }
    }, [travelerId]);

    const saveCart = useCallback(async (items: string[]) => {
        const normalized = normalizeCartItemIds(items);
        setCartItems(normalized);
        await persist(normalized);
    }, [persist]);

    // Refs para o reload sempre ler o estado mais recente sem precisar
    // recriar a função (e sem disparar loops via dependências mutantes).
    const cartItemsRef = useRef(cartItems);
    cartItemsRef.current = cartItems;
    const ownedIdsRef = useRef(ownedIds);
    ownedIdsRef.current = ownedIds;
    const itemsMetaRef = useRef(itemsMeta);
    itemsMetaRef.current = itemsMeta;

    // Resolve cada id contra a API. Três desfechos possíveis por item:
    //  1. 404 confirmado (fulfilled com null) OU já comprado → o id é
    //     REMOVIDO do carrinho (storage + estado) silenciosamente. Nunca
    //     vira um card "indisponível"/"já comprado".
    //  2. Falha de rede/5xx → o id É MANTIDO, status vira 'checking_error'
    //     (preserva os últimos dados conhecidos do item, se houver).
    //  3. Disponível → status 'available'.
    const reloadAvailability = useCallback(async () => {
        const ids = cartItemsRef.current;
        if (ids.length === 0) {
            setItemsMeta({});
            setIsResolving(false);
            return;
        }
        setIsResolving(true);
        setItemsMeta((prev) => {
            const next: Record<string, CartItemMeta> = {};
            ids.forEach((id) => {
                next[id] = prev[id] && prev[id].status !== 'loading'
                    ? prev[id]
                    : { id, status: 'loading' };
            });
            return next;
        });
        const results = await Promise.allSettled(ids.map((id) => getItineraryById(id)));

        const toRemove: string[] = [];
        const next: Record<string, CartItemMeta> = {};
        ids.forEach((id, i) => {
            if (ownedIdsRef.current.has(id)) {
                // Já comprado: só pertence a "Meus Roteiros" a partir daqui.
                toRemove.push(id);
                return;
            }
            const r = results[i];
            const itinerary = r.status === 'fulfilled' ? r.value : undefined;
            if (r.status === 'fulfilled' && !itinerary) {
                // 404 confirmado pelo backend (não é mais público/existente).
                toRemove.push(id);
                return;
            }
            if (r.status === 'fulfilled' && itinerary) {
                const avail = evaluateItineraryAvailability(itinerary);
                if (!avail.ok) {
                    // Defensivo: o payload trouxe um status não-público
                    // (não deveria acontecer, já que o backend só retorna
                    // ACTIVE publicamente, mas não confiamos cegamente).
                    toRemove.push(id);
                    return;
                }
                next[id] = { id, status: 'available', itinerary, price: Number(itinerary.price) };
                return;
            }
            // Rejeitado = falha de rede/timeout/5xx. Mantém o item, preserva
            // o último payload conhecido (se houver) pra não "sumir" o card.
            const previous = itemsMetaRef.current[id];
            next[id] = previous && previous.status === 'available'
                ? { ...previous, status: 'checking_error' }
                : { id, status: 'checking_error' };
        });

        setItemsMeta(next);
        setIsResolving(false);

        if (toRemove.length) {
            const surviving = cartItemsRef.current.filter((id) => !toRemove.includes(id));
            await saveCart(surviving);
        }
    }, [saveCart]);

    // Roda sempre que cartItems ou ownedIds mudam (inclui a remoção automática acima).
    useEffect(() => {
        reloadAvailability();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cartItems, ownedIds]);

    // Revalida ao app voltar para primeiro plano — cobre o caso do roteiro
    // ser pausado enquanto o app estava em background.
    useEffect(() => {
        const onChange = (state: AppStateStatus) => {
            if (state === 'active') reloadAvailability();
        };
        const sub = AppState.addEventListener('change', onChange);
        return () => sub.remove();
    }, [reloadAvailability]);

    const isInCart = useCallback(
        (id: string) => typeof id === 'string' && cartItems.includes(id.trim()),
        [cartItems],
    );

    const isOwned = useCallback(
        (id: string) => typeof id === 'string' && ownedIds.has(id.trim()),
        [ownedIds],
    );

    const addToCart = useCallback(async (id: string) => {
        const normalizedId = typeof id === 'string' ? id.trim() : '';
        if (!normalizedId) return;
        // Não adiciona algo que o usuário já comprou — silencioso para o caller
        // que já mostrou toast/CTA "Ver roteiro" no lugar.
        if (ownedIds.has(normalizedId)) return;
        if (!cartItems.includes(normalizedId)) {
            await saveCart([...cartItems, normalizedId]);
        }
    }, [cartItems, ownedIds, saveCart]);

    const removeFromCart = useCallback(async (id: string) => {
        const normalizedId = typeof id === 'string' ? id.trim() : '';
        await saveCart(cartItems.filter((i) => i !== normalizedId));
    }, [cartItems, saveCart]);

    const clearCart = useCallback(async () => {
        await saveCart([]);
    }, [saveCart]);

    const counts = useMemo(() => {
        let available = 0;
        let checkingError = 0;
        cartItems.forEach((id) => {
            const m = itemsMeta[id];
            if (!m) return;
            if (m.status === 'available') available += 1;
            else if (m.status === 'checking_error') checkingError += 1;
        });
        return { available, checkingError };
    }, [cartItems, itemsMeta]);

    const value: CartContextType = {
        cartItems,
        itemsMeta,
        isInCart,
        isOwned,
        addToCart,
        removeFromCart,
        clearCart,
        reloadAvailability,
        totalCount: cartItems.length,
        availableCount: counts.available,
        checkingErrorCount: counts.checkingError,
        // Badge da tab: SÓ disponíveis. Indisponíveis nunca ficam "presos"
        // no carrinho (são removidos automaticamente), então não há
        // divergência com o botão "Comprar X roteiros" da tela do carrinho.
        cartCount: counts.available,
        isLoading,
        isResolving,
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) throw new Error('useCart must be used within a CartProvider');
    return context;
};

export default useCart;

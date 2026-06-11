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

export type CartItemStatus = 'loading' | 'available' | 'unavailable' | 'owned';

export interface CartItemMeta {
    id: string;
    status: CartItemStatus;
    itinerary?: any;
    price?: number;
    unavailableReason?: string;
}

interface CartContextType {
    cartItems: string[];
    itemsMeta: Record<string, CartItemMeta>;
    isInCart: (id: string) => boolean;
    isOwned: (id: string) => boolean;
    addToCart: (id: string) => Promise<void>;
    removeFromCart: (id: string) => Promise<void>;
    clearCart: () => Promise<void>;
    clearUnavailable: () => Promise<void>;
    reloadAvailability: () => Promise<void>;
    totalCount: number;
    availableCount: number;
    unavailableCount: number;
    ownedCount: number;
    /** Roteiros realmente compráveis agora. Fonte ÚNICA do badge da tab.
     *  Indisponíveis e já-comprados ficam de fora — só conta o que dá pra fechar. */
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

    // Resolve cada id contra a API e o set "owned" → única fonte da verdade
    // de disponibilidade. Consumido pelo badge da tab E pela tela do carrinho.
    const reloadAvailability = useCallback(async () => {
        if (cartItems.length === 0) {
            setItemsMeta({});
            setIsResolving(false);
            return;
        }
        setIsResolving(true);
        setItemsMeta((prev) => {
            const next: Record<string, CartItemMeta> = {};
            cartItems.forEach((id) => {
                next[id] = prev[id] && prev[id].status !== 'loading'
                    ? prev[id]
                    : { id, status: 'loading' };
            });
            return next;
        });
        const results = await Promise.allSettled(
            cartItems.map((id) => getItineraryById(id)),
        );
        const next: Record<string, CartItemMeta> = {};
        cartItems.forEach((id, i) => {
            const r = results[i];
            const itinerary = r.status === 'fulfilled' ? r.value : null;
            if (ownedIds.has(id)) {
                next[id] = {
                    id,
                    status: 'owned',
                    itinerary,
                    unavailableReason: 'Você já comprou este roteiro',
                };
                return;
            }
            if (r.status === 'rejected' || !itinerary) {
                // 404 real (fulfilled com null) = removido. Rejeição agora é
                // falha de rede/5xx — não afirmar que o roteiro sumiu.
                next[id] = {
                    id,
                    status: 'unavailable',
                    unavailableReason: r.status === 'rejected'
                        ? 'Não foi possível verificar este roteiro agora. Tente novamente.'
                        : 'Roteiro removido ou não encontrado',
                };
                return;
            }
            const avail = evaluateItineraryAvailability(itinerary);
            if (avail.ok) {
                next[id] = {
                    id,
                    status: 'available',
                    itinerary,
                    price: Number(itinerary.price),
                };
            } else {
                next[id] = {
                    id,
                    status: 'unavailable',
                    itinerary,
                    unavailableReason: avail.reason,
                };
            }
        });
        setItemsMeta(next);
        setIsResolving(false);
    }, [cartItems, ownedIds]);

    // Roda sempre que cartItems ou ownedIds mudam.
    useEffect(() => {
        reloadAvailability();
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

    const clearUnavailable = useCallback(async () => {
        const surviving = cartItems.filter((id) => itemsMeta[id]?.status === 'available');
        if (surviving.length === cartItems.length) return;
        await saveCart(surviving);
    }, [cartItems, itemsMeta, saveCart]);

    const counts = useMemo(() => {
        let available = 0;
        let unavailable = 0;
        let owned = 0;
        cartItems.forEach((id) => {
            const m = itemsMeta[id];
            if (!m) return;
            if (m.status === 'available') available += 1;
            else if (m.status === 'unavailable') unavailable += 1;
            else if (m.status === 'owned') owned += 1;
        });
        return { available, unavailable, owned };
    }, [cartItems, itemsMeta]);

    const value: CartContextType = {
        cartItems,
        itemsMeta,
        isInCart,
        isOwned,
        addToCart,
        removeFromCart,
        clearCart,
        clearUnavailable,
        reloadAvailability,
        totalCount: cartItems.length,
        availableCount: counts.available,
        unavailableCount: counts.unavailable,
        ownedCount: counts.owned,
        // Badge da tab: SÓ disponíveis. Já-comprados + indisponíveis ficam fora.
        // Assim o número no menu sempre bate com o botão "Comprar X roteiros" da
        // tela do carrinho — sem divergência.
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

import React, { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CART_KEY = '@vamo_cart';

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

interface CartContextType {
    cartItems: string[];
    isInCart: (id: string) => boolean;
    addToCart: (id: string) => Promise<void>;
    removeFromCart: (id: string) => Promise<void>;
    clearCart: () => Promise<void>;
    cartCount: number;
    isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
    children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
    const [cartItems, setCartItems] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadCart();
    }, []);

    const loadCart = async () => {
        try {
            const stored = await AsyncStorage.getItem(CART_KEY);
            if (stored) {
                const normalized = normalizeCartItemIds(JSON.parse(stored));
                setCartItems(normalized);
                if (stored !== JSON.stringify(normalized)) {
                    await AsyncStorage.setItem(CART_KEY, JSON.stringify(normalized));
                }
            }
        } catch (error) {
            console.error('Error loading cart:', error);
            await AsyncStorage.removeItem(CART_KEY);
            setCartItems([]);
        } finally {
            setIsLoading(false);
        }
    };

    const saveCart = async (items: string[]) => {
        const normalized = normalizeCartItemIds(items);
        try {
            setCartItems(normalized);
            await AsyncStorage.setItem(CART_KEY, JSON.stringify(normalized));
        } catch (error) {
            console.error('Error saving cart:', error);
        }
    };

    const isInCart = useCallback((id: string) => {
        return typeof id === 'string' && cartItems.includes(id.trim());
    }, [cartItems]);

    const addToCart = useCallback(async (id: string) => {
        const normalizedId = typeof id === 'string' ? id.trim() : '';
        if (!normalizedId) return;
        if (!cartItems.includes(normalizedId)) await saveCart([...cartItems, normalizedId]);
    }, [cartItems]);

    const removeFromCart = useCallback(async (id: string) => {
        const normalizedId = typeof id === 'string' ? id.trim() : '';
        await saveCart(cartItems.filter(i => i !== normalizedId));
    }, [cartItems]);

    const clearCart = useCallback(async () => {
        await saveCart([]);
    }, []);

    return (
        <CartContext.Provider value={{
            cartItems,
            isInCart,
            addToCart,
            removeFromCart,
            clearCart,
            cartCount: cartItems.length,
            isLoading,
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) throw new Error('useCart must be used within a CartProvider');
    return context;
};

export default useCart;

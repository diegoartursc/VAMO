import React, { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CART_KEY = '@vamo_cart';

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
            if (stored) setCartItems(JSON.parse(stored));
        } catch (error) {
            console.error('Error loading cart:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const saveCart = async (items: string[]) => {
        try {
            await AsyncStorage.setItem(CART_KEY, JSON.stringify(items));
            setCartItems(items);
        } catch (error) {
            console.error('Error saving cart:', error);
        }
    };

    const isInCart = useCallback((id: string) => cartItems.includes(id), [cartItems]);

    const addToCart = useCallback(async (id: string) => {
        if (!cartItems.includes(id)) await saveCart([...cartItems, id]);
    }, [cartItems]);

    const removeFromCart = useCallback(async (id: string) => {
        await saveCart(cartItems.filter(i => i !== id));
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

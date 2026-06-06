import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { FavoriteAnimationProvider } from '../src/components/providers/FavoriteAnimationProvider';
import { NotificationProvider } from '../src/components/providers/NotificationProvider';
import { FavoritesProvider } from '../src/hooks/useFavorites';
import { CartProvider } from '../src/hooks/useCart';
import { AuthProvider } from '../src/contexts/AuthContext';

/**
 * CSS global injetado apenas no Web. Hoje cobre:
 *   - foco visível em pickers de data/hora (acessibilidade por teclado).
 *
 * Os inputs HTML nativos dentro dos pickers ficam invisíveis (opacity 0)
 * para que o botão visual seja a UI principal. Mas usuários de teclado
 * precisam de feedback de foco — :focus-within no wrapper desenha o
 * anel teal no botão visível.
 */
const WebGlobalStyles = Platform.OS === 'web' ? (
    // @ts-ignore — <style> é HTML válido no Expo Web
    <style>{`
        .vamo-picker-focus-ring:focus-within {
            outline: 2px solid #28C9BF;
            outline-offset: 2px;
        }
    `}</style>
) : null;

export default function RootLayout() {
    return (
        <AuthProvider>
            <FavoritesProvider>
                <CartProvider>
                    <NotificationProvider>
                        <FavoriteAnimationProvider>
                            {WebGlobalStyles}
                            <StatusBar style="dark" />
                            <Stack screenOptions={{ headerShown: false }}>
                                <Stack.Screen name="(tabs)" />
                                <Stack.Screen name="login" />
                                <Stack.Screen name="register" />
                                <Stack.Screen name="become-creator" />
                                <Stack.Screen name="new-itinerary" />
                                <Stack.Screen name="await-review" />
                                <Stack.Screen name="creator-itinerary/[id]" />
                                <Stack.Screen name="created-itineraries" />
                                <Stack.Screen name="my-reviews" />
                                <Stack.Screen name="my-questions" />
                                <Stack.Screen name="creator-questions" />
                                <Stack.Screen name="creator-earnings" />
                            </Stack>
                        </FavoriteAnimationProvider>
                    </NotificationProvider>
                </CartProvider>
            </FavoritesProvider>
        </AuthProvider>
    );
}

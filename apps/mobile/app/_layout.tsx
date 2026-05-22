import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { FavoriteAnimationProvider } from '../src/components/providers/FavoriteAnimationProvider';
import { NotificationProvider } from '../src/components/providers/NotificationProvider';
import { FavoritesProvider } from '../src/hooks/useFavorites';
import { CartProvider } from '../src/hooks/useCart';
import { AuthProvider } from '../src/contexts/AuthContext';

export default function RootLayout() {
    return (
        <AuthProvider>
            <FavoritesProvider>
                <CartProvider>
                    <NotificationProvider>
                        <FavoriteAnimationProvider>
                            <StatusBar style="dark" />
                            <Stack screenOptions={{ headerShown: false }}>
                                <Stack.Screen name="(tabs)" />
                                <Stack.Screen name="login" />
                                <Stack.Screen name="register" />
                                <Stack.Screen name="become-creator" />
                                <Stack.Screen name="new-itinerary" />
                                <Stack.Screen name="await-review" />
                                <Stack.Screen name="creator-itinerary/[id]" />
                                <Stack.Screen name="my-reviews" />
                                <Stack.Screen name="my-questions" />
                            </Stack>
                        </FavoriteAnimationProvider>
                    </NotificationProvider>
                </CartProvider>
            </FavoritesProvider>
        </AuthProvider>
    );
}

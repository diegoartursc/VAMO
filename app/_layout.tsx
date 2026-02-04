import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { FavoriteAnimationProvider } from '../src/components/providers/FavoriteAnimationProvider';
import { NotificationProvider } from '../src/components/providers/NotificationProvider';
import { FavoritesProvider } from '../src/hooks/useFavorites';

export default function RootLayout() {
    return (
        <FavoritesProvider>
            <NotificationProvider>
                <FavoriteAnimationProvider>
                    <StatusBar style="dark" />
                    <Stack screenOptions={{ headerShown: false }}>
                        <Stack.Screen name="(tabs)" />
                        <Stack.Screen
                            name="package/[id]"
                            options={{
                                headerShown: true,
                                headerTitle: 'Detalhes do Pacote',
                                headerBackTitle: 'Voltar',
                            }}
                        />
                        <Stack.Screen
                            name="itinerary/[id]"
                            options={{
                                headerShown: true,
                                headerTitle: 'Detalhes do Roteiro',
                                headerBackTitle: 'Voltar',
                            }}
                        />
                        <Stack.Screen
                            name="creator/[id]"
                            options={{
                                headerShown: true,
                                headerTitle: 'Perfil do Criador',
                                headerBackTitle: 'Voltar',
                            }}
                        />
                    </Stack>
                </FavoriteAnimationProvider>
            </NotificationProvider>
        </FavoritesProvider>
    );
}

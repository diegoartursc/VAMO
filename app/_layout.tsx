import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { FavoriteAnimationProvider } from '../src/components/FavoriteAnimationProvider';

export default function RootLayout() {
    return (
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
    );
}

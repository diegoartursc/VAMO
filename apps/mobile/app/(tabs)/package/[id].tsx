import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { theme } from '../../../src/theme/theme';

export default function LegacyPackageDetailRedirect() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id?: string }>();

    useEffect(() => {
        if (id) {
            router.replace(`/(tabs)/itinerary/${id}` as any);
            return;
        }

        router.replace('/(tabs)/itineraries');
    }, [id, router]);

    return (
        <View style={styles.container}>
            <ActivityIndicator color={theme.colors.primary} />
            <Text style={styles.text}>Abrindo roteiro digital...</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.background,
        padding: 24,
    },
    text: {
        marginTop: 12,
        fontSize: 14,
        color: theme.colors.text.secondary,
        textAlign: 'center',
    },
});

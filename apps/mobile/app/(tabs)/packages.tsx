import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../src/theme/theme';

export default function LegacyPackagesRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/(tabs)/itineraries');
    }, [router]);

    return (
        <View style={styles.container}>
            <ActivityIndicator color={theme.colors.primary} />
            <Text style={styles.text}>Abrindo roteiros digitais...</Text>
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

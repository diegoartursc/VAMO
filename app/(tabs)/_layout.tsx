import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../src/theme/theme';
import { SearchProvider } from '../../src/contexts/SearchContext';

export default function TabsLayout() {
    return (
        <SearchProvider>
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarActiveTintColor: theme.colors.primary,
                    tabBarInactiveTintColor: theme.colors.text.secondary,
                    tabBarStyle: styles.tabBar,
                    tabBarItemStyle: styles.tabBarItem,
                    tabBarLabelStyle: styles.tabBarLabel,
                }}
            >

                <Tabs.Screen
                    name="index"
                    options={{
                        title: 'Início',
                        tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
                    }}
                />
                <Tabs.Screen
                    name="packages"
                    options={{
                        title: 'Pacotes',
                        tabBarIcon: ({ focused }) => <TabIcon name="package" focused={focused} />,
                    }}
                />
                <Tabs.Screen
                    name="itineraries"
                    options={{
                        title: 'Roteiros',
                        tabBarIcon: ({ focused }) => <TabIcon name="map" focused={focused} />,
                    }}
                />
                <Tabs.Screen
                    name="my-trips"
                    options={{
                        title: 'Minhas Viagens',
                        tabBarIcon: ({ focused }) => <TabIcon name="trips" focused={focused} />,
                    }}
                />
                <Tabs.Screen
                    name="profile"
                    options={{
                        title: 'Perfil',
                        tabBarIcon: ({ focused }) => <TabIcon name="user" focused={focused} />,
                    }}
                />
            </Tabs>
        </SearchProvider>
    );
}

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
    const icons: Record<string, { active: string; inactive: string }> = {
        home: { active: '🏠', inactive: '🏡' },
        package: { active: '✈️', inactive: '✈️' },
        map: { active: '🗺️', inactive: '🗺️' },
        trips: { active: '🧳', inactive: '🧳' },
        user: { active: '👤', inactive: '👤' },
    };

    return (
        <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
            <Text style={[styles.icon, focused && styles.iconActive]}>
                {icons[name]?.active || '•'}
            </Text>
        </View>
    );
}


const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: theme.colors.background,
        borderTopColor: theme.colors.borderLight,
        borderTopWidth: 1,
        height: 94,
        paddingTop: 12,
        paddingBottom: 20, // Space for home indicator
    },
    tabBarItem: {
        height: 'auto', // Allow item to take necessary natural height
        paddingVertical: 4,
    },
    tabBarLabel: {
        fontSize: 11,
        fontWeight: '600',
        marginTop: 4,
        // No marginBottom to prevent pushing out
    },
    iconContainer: {
        width: 40,
        height: 28,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 14,
    },
    iconContainerActive: {
        backgroundColor: '#E6FAF8', // Light Teal
    },
    icon: {
        fontSize: 18,
        opacity: 0.5,
    },
    iconActive: {
        opacity: 1,
    },
});

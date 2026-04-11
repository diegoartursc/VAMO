import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { theme } from '../../src/theme/theme';
import { SearchProvider } from '../../src/contexts/SearchContext';
import { Icon, IconName } from '../../src/components/common/Icons';

export default function TabsLayout() {
    return (
        <SearchProvider>
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarActiveTintColor: theme.colors.primary,
                    tabBarInactiveTintColor: theme.colors.text.tertiary,
                    tabBarStyle: styles.tabBar,
                    tabBarItemStyle: styles.tabBarItem,
                    tabBarLabelStyle: styles.tabBarLabel,
                    tabBarBackground: () => <View style={styles.tabBarBackground} />,
                }}
            >
                <Tabs.Screen
                    name="index"
                    options={{
                        title: 'Busca',
                        tabBarIcon: ({ focused, color }) => <TabIcon name="search" focused={focused} color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="saved"
                    options={{
                        href: '/saved',
                        title: 'Favoritos',
                        tabBarIcon: ({ focused, color }) => <TabIcon name="heart" focused={focused} color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="cart"
                    options={{
                        href: '/cart',
                        title: 'Carrinho',
                        tabBarIcon: ({ focused, color }) => <TabIcon name="shopping-bag" focused={focused} color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="profile"
                    options={{
                        title: 'Perfil',
                        tabBarIcon: ({ focused, color }) => <TabIcon name="user" focused={focused} color={color} />,
                    }}
                />

                {/* Hidden screens - acessíveis por navegação interna */}
                <Tabs.Screen
                    name="itineraries"
                    options={{
                        href: null,
                        title: 'Roteiros',
                    }}
                />
                <Tabs.Screen
                    name="my-trips"
                    options={{
                        href: null,
                        title: 'Minhas Viagens',
                    }}
                />
                <Tabs.Screen
                    name="packages"
                    options={{
                        href: null,
                        title: 'Pacotes',
                    }}
                />
            </Tabs>
        </SearchProvider>
    );
}

function TabIcon({ name, focused, color }: { name: IconName; focused: boolean; color: string }) {
    return (
        <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
            <Icon
                name={name}
                size={24}
                color={color}
                strokeWidth={focused ? 2.5 : 1.5}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: theme.colors.background,
        borderTopColor: theme.colors.borderLight,
        borderTopWidth: 1,
        height: Platform.OS === 'ios' ? 90 : 76,
        paddingTop: 8,
        paddingBottom: Platform.OS === 'ios' ? 28 : 14,
        elevation: 0,
        shadowOpacity: 0,
    },
    tabBarBackground: {
        flex: 1,
        backgroundColor: theme.colors.background,
        borderTopWidth: 1,
        borderTopColor: theme.colors.borderLight,
    },
    tabBarItem: {
        height: 'auto',
        justifyContent: 'center',
    },
    tabBarLabel: {
        fontSize: 10,
        fontWeight: '500',
        marginTop: 4,
        letterSpacing: 0.2,
    },
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 44,
        height: 32,
        borderRadius: 16,
    },
    iconContainerActive: {
        // Optional: subtle background for active state if desired, keeping clear for VAMO 2.0 clean look
        // backgroundColor: theme.colors.primary + '15', 
    }
});

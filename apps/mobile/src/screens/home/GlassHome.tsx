import React from 'react';
import { ScrollView, StyleSheet, View, Text } from 'react-native';
import { HeroSection } from '../../components/home/HeroSection';
import { theme } from '../../theme/theme';

export default function GlassHomeScreen() {
    return (
        <ScrollView style={styles.container}>
            <HeroSection
                image="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=1000"
                title="Your next adventure starts here."
                subtitle="Discover digital itineraries created by experienced travelers."
                badge="Futuristic"
            />
            <View style={styles.content}>
                <Text style={styles.sectionTitle}>Explore Destinations</Text>
                <Text style={styles.placeholder}>Content coming soon...</Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A', // Darker for Glass
    },
    content: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#FFFFFF',
    },
    placeholder: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 16,
    }
});

import React from 'react';
import { ScrollView, StyleSheet, View, Text } from 'react-native';
import { HeroSection } from '../../components/home/HeroSection';
import { theme } from '../../theme/theme';

export default function GlassHomeScreen() {
    return (
        <ScrollView style={styles.container}>
            <HeroSection
                image="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=1000"
                title="Sua próxima aventura começa aqui."
                subtitle="Descubra pacotes incríveis e roteiros criados por viajantes experientes."
                badge="Futurista"
            />
            <View style={styles.content}>
                <Text style={styles.sectionTitle}>Explorar Destinos</Text>
                <Text style={styles.placeholder}>Conteúdo em breve...</Text>
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

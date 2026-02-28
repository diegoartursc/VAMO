import React from 'react';
import { ScrollView, StyleSheet, View, Text } from 'react-native';
import { HeroSection } from '../../components/home/HeroSection';
import { theme } from '../../theme/theme';

export default function ClassicHomeScreen() {
    return (
        <ScrollView style={styles.container}>
            <HeroSection
                image="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=1000"
                title="Sua próxima aventura começa aqui."
                subtitle="Descubra pacotes incríveis e roteiros criados por viajantes experientes."
                badge="Premium"
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
        backgroundColor: '#FFFFFF',
    },
    content: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#1e293b',
    },
    placeholder: {
        color: '#64748b',
        fontSize: 16,
    }
});

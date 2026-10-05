import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { toHotelStars } from '@vamo/shared/itinerary';
import { theme } from '../../theme/theme';

const STAR_COLOR = '#FFC107';

/** Seletor de 0–5 estrelas (classificação do hotel). Tocar na estrela atual zera. */
export function HotelStarsInput({ label = 'Classificação (estrelas)', value, onChange }: {
    label?: string;
    value: unknown;
    onChange: (stars: string) => void;
}) {
    const current = toHotelStars(value);
    return (
        <View style={st.field}>
            <Text style={st.label}>{label}</Text>
            <View style={st.row} accessibilityRole="adjustable" accessibilityLabel={`${label}: ${current} de 5`}>
                {[1, 2, 3, 4, 5].map(n => (
                    <TouchableOpacity
                        key={n}
                        onPress={() => onChange(String(n === current ? 0 : n))}
                        hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                        accessibilityLabel={`${n} estrela${n > 1 ? 's' : ''}`}
                    >
                        <Ionicons name={n <= current ? 'star' : 'star-outline'} size={28} color={n <= current ? STAR_COLOR : theme.colors.text.tertiary} />
                    </TouchableOpacity>
                ))}
                <Text style={st.hint}>{current ? `${current} de 5` : 'Sem classificação'}</Text>
            </View>
        </View>
    );
}

/** Exibição compacta "★★★★☆". Não renderiza nada sem classificação. */
export function HotelStarsDisplay({ value, size = 13 }: { value: unknown; size?: number }) {
    const stars = toHotelStars(value);
    if (!stars) return null;
    return (
        <View style={st.displayRow} accessibilityLabel={`Hotel ${stars} estrelas`}>
            {[1, 2, 3, 4, 5].map(n => (
                <Ionicons key={n} name={n <= stars ? 'star' : 'star-outline'} size={size} color={STAR_COLOR} />
            ))}
        </View>
    );
}

const st = StyleSheet.create({
    field: { marginBottom: 14 },
    label: { fontSize: 13, fontWeight: '600', color: theme.colors.text.primary, marginBottom: 8 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    hint: { marginLeft: 8, fontSize: 12, color: theme.colors.text.tertiary },
    displayRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
});

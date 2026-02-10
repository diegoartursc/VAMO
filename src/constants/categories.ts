// Categorias de viagem - usadas em toda a aplicação
export const CATEGORIES = [
    { id: 'cultura', icon: '🏛️', label: 'Cultura' },
    { id: 'gastronomia', icon: '🍽️', label: 'Gastronomia' },
    { id: 'natureza', icon: '🌳', label: 'Natureza' },
    { id: 'esportes', icon: '⚽', label: 'Esportes' },
    { id: 'cruzeiros', icon: '🚢', label: 'Cruzeiros' },
    { id: 'eurotrip', icon: '🌍', label: 'Eurotrip' },
    { id: 'relax', icon: '🧘', label: 'Relax' },
    { id: 'familia', icon: '👨‍👩‍👧‍👦', label: 'Família' },
    { id: 'aventura', icon: '🏔️', label: 'Aventura' },
] as const;

export type CategoryId = typeof CATEGORIES[number]['id'];

// Intent categories for travel style filter (Luxo / Custo-benefício)
export const INTENT_CATEGORIES = [
    { id: 'luxo', emoji: '💎', label: 'Luxo' },
    { id: 'custo-beneficio', emoji: '💰', label: 'Melhor custo-benefício' },
] as const;

export const INTENT_FEEDBACK: Record<string, string> = {
    'luxo': 'Mostrando viagens com foco em conforto e exclusividade',
    'custo-beneficio': 'Mostrando viagens com melhor custo-benefício',
};

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

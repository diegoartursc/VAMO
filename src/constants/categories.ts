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

// Intent categories for travel style filter
export const INTENT_CATEGORIES = [
    { id: 'luxo', emoji: '💎', label: 'Luxo' },
    { id: 'economico', emoji: '💰', label: 'Econômico' },
    { id: 'mochilao', emoji: '🎒', label: 'Mochilão' },
    { id: 'familia', emoji: '👨‍👩‍👧', label: 'Família' },
    { id: 'romantico', emoji: '❤️', label: 'Romântico' },
    { id: 'aventura', emoji: '🌎', label: 'Aventura' },
] as const;

export const INTENT_FEEDBACK: Record<string, string> = {
    'luxo': 'Mostrando viagens com foco em conforto e exclusividade',
    'economico': 'Mostrando viagens com melhor custo-benefício',
    'mochilao': 'Mostrando viagens para quem curte viajar com pouco e explorar bastante',
    'familia': 'Mostrando viagens perfeitas para curtir com a família',
    'romantico': 'Mostrando viagens românticas para casais',
    'aventura': 'Mostrando viagens repletas de aventura e adrenalina',
};

// Duration quick chips
export const DURATION_CHIPS = [
    { label: 'Fim de semana', min: 2, max: 3 },
    { label: '7 dias', min: 7, max: 7 },
    { label: '15 dias', min: 15, max: 15 },
    { label: '+20 dias', min: 20, max: 30 },
] as const;

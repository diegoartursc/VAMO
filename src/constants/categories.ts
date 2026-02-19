// Categorias de viagem - usadas em toda a aplicação
// VAMO 2.0: Emojis replaced by Lucide icon names (IconName type)
export const CATEGORIES = [
    { id: 'cultura', icon: 'landmark', label: 'Cultura' },
    { id: 'gastronomia', icon: 'utensils', label: 'Gastronomia' },
    { id: 'natureza', icon: 'trees', label: 'Natureza' },
    { id: 'esportes', icon: 'trophy', label: 'Esportes' },
    { id: 'cruzeiros', icon: 'ship', label: 'Cruzeiros' },
    { id: 'eurotrip', icon: 'globe', label: 'Eurotrip' },
    { id: 'relax', icon: 'heart-pulse', label: 'Relax' },
    { id: 'familia', icon: 'users', label: 'Família' },
    { id: 'aventura', icon: 'mountain', label: 'Aventura' },
] as const;

export type CategoryId = typeof CATEGORIES[number]['id'];

// Intent categories for travel style filter
// VAMO 2.0: field renamed from 'emoji' → 'icon'
export const INTENT_CATEGORIES = [
    { id: 'luxo', icon: 'gem', label: 'Luxo' },
    { id: 'economico', icon: 'piggy-bank', label: 'Econômico' },
    { id: 'mochilao', icon: 'backpack', label: 'Mochilão' },
    { id: 'familia', icon: 'users', label: 'Família' },
    { id: 'romantico', icon: 'heart', label: 'Romântico' },
    { id: 'aventura', icon: 'globe', label: 'Aventura' },
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

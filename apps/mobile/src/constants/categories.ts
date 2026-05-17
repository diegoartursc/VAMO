// Categorias de viagem - usadas em toda a aplicação
// VAMO 2.0: Emojis replaced by Lucide icon names (IconName type)
export const CATEGORIES = [
    { id: 'cultura', icon: 'landmark', label: 'Cultura' },
    { id: 'gastronomia', icon: 'utensils', label: 'Gastronomia' },
    { id: 'natureza', icon: 'trees', label: 'Natureza' },
    { id: 'esportes', icon: 'trophy', label: 'Esportes' },
    { id: 'cruzeiros', icon: 'ship', label: 'Cruzeiros' },
    { id: 'eurotrip', icon: 'globe', label: 'Eurotrip' },
    { id: 'relax', icon: 'coffee', label: 'Relax' },
    { id: 'praia', icon: 'sun', label: 'Praia' },
    { id: 'historico', icon: 'book-open', label: 'Histórico' },
    { id: 'festivais', icon: 'party-popper', label: 'Festivais' },
    { id: 'mochilao', icon: 'backpack', label: 'Mochilão' },
    { id: 'familia', icon: 'users', label: 'Família' },
    { id: 'romantico', icon: 'heart', label: 'Romântico' },
    { id: 'aventura', icon: 'mountain', label: 'Aventura' },
] as const;

export type CategoryId = typeof CATEGORIES[number]['id'];

// Intent categories — budget/style filter (financial focus only)
// VAMO 2.0: field renamed from 'emoji' → 'icon'
export const INTENT_CATEGORIES = [
    { id: 'economico', icon: 'piggy-bank', label: 'Econômico' },
    { id: 'moderado', icon: 'wallet', label: 'Moderado' },
    { id: 'luxo', icon: 'gem', label: 'Luxo' },
] as const;

export const INTENT_FEEDBACK: Record<string, string> = {
    'economico': 'Mostrando viagens com melhor custo-benefício',
    'moderado': 'Mostrando viagens com equilíbrio entre custo e conforto',
    'luxo': 'Mostrando viagens com foco em conforto e exclusividade',
};

// Duration quick chips
export const DURATION_CHIPS = [
    { label: 'Qualquer', min: 0, max: 0 },
    { label: 'Fim de semana', min: 2, max: 3 },
    { label: '7 dias', min: 7, max: 7 },
    { label: '15 dias', min: 15, max: 15 },
    { label: '+20 dias', min: 20, max: 30 },
] as const;

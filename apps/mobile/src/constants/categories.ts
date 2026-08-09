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

// As faixas de duração da busca ficam em `constants/durationPresets.ts`.
// O antigo DURATION_CHIPS (min/max colapsados em um único número pelo modal,
// com "+20 dias" limitado a 30) foi removido junto com o slider.

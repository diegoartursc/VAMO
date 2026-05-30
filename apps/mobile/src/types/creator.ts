// Creator verification levels and types

export type VerificationLevel = 'basic' | 'trusted' | 'expert' | 'ambassador';

export interface CreatorStats {
    itinerariesCount: number;
    totalSales: number;
    averageRating: number;
    responseTime: string;
    tripsCompleted: number;
}

export interface Creator {
    id: string;
    name: string;
    avatar: string;
    verificationLevel: VerificationLevel;
    stats: CreatorStats;
    bio: string;
    destinations: string[];
    memberSince: string;
    languages: string[];
    socialLinks?: {
        instagram?: string;
        youtube?: string;
        blog?: string;
    };
}

export interface VerificationBadgeConfig {
    level: VerificationLevel;
    icon: string;
    label: string;
    color: string;
    bgColor: string;
    description: string;
}

/**
 * Trilha do Roteirista — labels visíveis de reputação/confiança.
 *
 * O tipo técnico `VerificationLevel` (basic/trusted/expert/ambassador) é
 * mantido por compatibilidade com o backend, mas o conteúdo visível segue a
 * nova nomenclatura. NÃO usar "Expert"/"Especialista Local" na UI.
 * A camada semântica de 5 níveis (incl. "Top Roteirista") vive em
 * src/gamification/creatorLevels.ts.
 */
export const VERIFICATION_CONFIGS: Record<VerificationLevel, VerificationBadgeConfig> = {
    basic: {
        level: 'basic',
        icon: '🛡️',
        label: 'Roteirista Verificado',
        color: '#1A3263',         // VAMO Navy
        bgColor: '#EEF1F8',
        description: 'Identidade confirmada e perfil aprovado',
    },
    trusted: {
        level: 'trusted',
        icon: '⭐',
        label: 'Roteirista Recomendado',
        color: '#B8860B',
        bgColor: '#FBF4E1',
        description: 'Bons roteiros, avaliações positivas e histórico consistente',
    },
    expert: {
        level: 'expert',
        icon: '🧭',
        label: 'Curador de Viagens',
        color: '#0E7C74',         // Deep Teal — sofisticado e temático
        bgColor: '#E6FAF8',
        description: 'Cria roteiros consistentes, bem avaliados e úteis para outros viajantes',
    },
    ambassador: {
        level: 'ambassador',
        icon: '💎',
        label: 'Embaixador VAMO',
        color: '#28C9BF',         // VAMO Teal
        bgColor: '#E6FAF8',       // Light Teal
        description: 'Selecionado pela equipe VAMO como referência da comunidade',
    },
};

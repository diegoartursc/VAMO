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
        label: 'Verified Creator',
        color: '#1A3263',         // VAMO Navy
        bgColor: '#EEF1F8',
        description: 'Identity confirmed and profile approved',
    },
    trusted: {
        level: 'trusted',
        icon: '⭐',
        label: 'Recommended Creator',
        color: '#B8860B',
        bgColor: '#FBF4E1',
        description: 'Good itineraries, positive reviews and a consistent track record',
    },
    expert: {
        level: 'expert',
        icon: '🧭',
        label: 'Travel Curator',
        color: '#0E7C74',         // Deep Teal — sofisticado e temático
        bgColor: '#E6FAF8',
        description: 'Creates consistent, well-reviewed itineraries that help other travelers',
    },
    ambassador: {
        level: 'ambassador',
        icon: '💎',
        label: 'VAMO Ambassador',
        color: '#28C9BF',         // VAMO Teal
        bgColor: '#E6FAF8',       // Light Teal
        description: 'Selected by the VAMO team as a community reference',
    },
};

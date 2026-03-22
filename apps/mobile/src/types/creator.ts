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

export const VERIFICATION_CONFIGS: Record<VerificationLevel, VerificationBadgeConfig> = {
    basic: {
        level: 'basic',
        icon: '🥉',
        label: 'Verificado',
        color: '#8B4513',
        bgColor: '#FFF8DC',
        description: 'Identidade confirmada',
    },
    trusted: {
        level: 'trusted',
        icon: '🥈',
        label: 'Confiável',
        color: '#708090',
        bgColor: '#F5F5F5',
        description: '5+ roteiros, 4.5+ média',
    },
    expert: {
        level: 'expert',
        icon: '🥇',
        label: 'Expert',
        color: '#B8860B',
        bgColor: '#FFFACD',
        description: '20+ roteiros, 4.8+ média, 50+ vendas',
    },
    ambassador: {
        level: 'ambassador',
        icon: '💎',
        label: 'Embaixador',
        color: '#28C9BF',         // VAMO Teal
        bgColor: '#E6FAF8',       // Light Teal
        description: 'Selecionado pela equipe VAMO',
    },
};

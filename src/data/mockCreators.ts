import { Creator } from '../types/creator';

export const mockCreators: Creator[] = [
    {
        id: 'diego-viajante',
        name: 'Diego Artur',
        avatar: '👨‍✈️',
        verificationLevel: 'ambassador',
        stats: {
            itinerariesCount: 47,
            totalSales: 1234,
            averageRating: 4.9,
            responseTime: '< 1h',
            tripsCompleted: 89,
        },
        bio: 'Viajante profissional há 10 anos. Especialista em viagens econômicas para Europa e América Latina. Já visitei 45 países e criei roteiros que economizam até 40% comparado a pacotes tradicionais.',
        destinations: ['Paris', 'Roma', 'Barcelona', 'Buenos Aires', 'Cusco'],
        memberSince: '2020',
        languages: ['Português', 'Inglês', 'Espanhol'],
        socialLinks: {
            instagram: '@diegoviaja',
            youtube: 'DiegoArturViagens',
        },
    },
    {
        id: 'ana-explorer',
        name: 'Ana Carolina',
        avatar: '👩‍🎨',
        verificationLevel: 'expert',
        stats: {
            itinerariesCount: 28,
            totalSales: 456,
            averageRating: 4.8,
            responseTime: '< 2h',
            tripsCompleted: 52,
        },
        bio: 'Arquiteta de formação, viajante por paixão. Especialista em roteiros culturais e gastronômicos. Meus roteiros incluem dicas de restaurantes locais e pontos fotogênicos.',
        destinations: ['Tóquio', 'Kyoto', 'Bangkok', 'Singapura'],
        memberSince: '2021',
        languages: ['Português', 'Inglês', 'Japonês básico'],
    },
    {
        id: 'pedro-aventura',
        name: 'Pedro Henrique',
        avatar: '🧗',
        verificationLevel: 'trusted',
        stats: {
            itinerariesCount: 12,
            totalSales: 89,
            averageRating: 4.7,
            responseTime: '< 4h',
            tripsCompleted: 34,
        },
        bio: 'Aventureiro e praticante de esportes radicais. Meus roteiros incluem trilhas, escaladas e experiências de adrenalina. Perfeito para quem quer sair da zona de conforto.',
        destinations: ['Patagônia', 'Nepal', 'Nova Zelândia', 'Costa Rica'],
        memberSince: '2022',
        languages: ['Português', 'Inglês'],
    },
    {
        id: 'julia-familia',
        name: 'Júlia Santos',
        avatar: '👩‍👧‍👦',
        verificationLevel: 'trusted',
        stats: {
            itinerariesCount: 8,
            totalSales: 67,
            averageRating: 4.6,
            responseTime: '< 6h',
            tripsCompleted: 23,
        },
        bio: 'Mãe de 2 e especialista em viagens em família. Meus roteiros consideram crianças: atrações kid-friendly, horários flexíveis e dicas de restaurantes com menu infantil.',
        destinations: ['Orlando', 'Cancún', 'Lisboa', 'Gramado'],
        memberSince: '2023',
        languages: ['Português'],
    },
    {
        id: 'marcos-iniciante',
        name: 'Marcos Lima',
        avatar: '🎒',
        verificationLevel: 'basic',
        stats: {
            itinerariesCount: 3,
            totalSales: 12,
            averageRating: 4.4,
            responseTime: 'até 24h',
            tripsCompleted: 8,
        },
        bio: 'Novo por aqui! Compartilhando minhas experiências de viagens recentes. Roteiros honestos e econômicos para quem está começando a viajar.',
        destinations: ['Buenos Aires', 'Montevidéu'],
        memberSince: '2024',
        languages: ['Português', 'Espanhol básico'],
    },
];

export const getCreatorById = (id: string): Creator | undefined =>
    mockCreators.find(c => c.id === id);

export const getCreatorsByLevel = (level: Creator['verificationLevel']): Creator[] =>
    mockCreators.filter(c => c.verificationLevel === level);

export const getFeaturedCreators = (): Creator[] =>
    mockCreators.filter(c => c.verificationLevel === 'expert' || c.verificationLevel === 'ambassador');

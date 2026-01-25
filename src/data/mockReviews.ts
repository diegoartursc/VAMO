export interface Review {
    id: string;
    packageId: string;
    user: {
        name: string;
        location: string;
        avatar: string; // color for avatar background
        initial: string;
    };
    rating: number;
    date: string;
    verified: boolean;
    text: string;
    photos?: string[];
    language?: string; // for "Traduzir" feature
}

const MOCK_REVIEWS: Review[] = [
    {
        id: '1',
        packageId: '1',
        user: {
            name: 'Salomé',
            location: 'Portugal',
            avatar: '#4A90E2',
            initial: 'S',
        },
        rating: 5,
        date: '13 de março de 2025',
        verified: true,
        text: 'A experiência é surreal, andamos cerca de uma hora de trenó com os cães e passamos por paisagens lindíssimas. Achei no entanto que no final estávamos a ser despachados porque entretanto já estavam a chegar mais dois grupos. Devido ao preço da atividade acho que nos poderiam dar mais tempo a confraternizar com os cães que são tão doces e meigos.',
        photos: [
            'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400',
            'https://images.unsplash.com/photo-1487014679447-9f8336841d58?w=400',
            'https://images.unsplash.com/photo-1515343480029-43cdfe6b6268?w=400',
            'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400',
        ],
        language: 'pt',
    },
    {
        id: '2',
        packageId: '1',
        user: {
            name: 'William',
            location: 'Brasil',
            avatar: '#E74C3C',
            initial: 'W',
        },
        rating: 5,
        date: '12 de março de 2025',
        verified: true,
        text: 'Recomendo muito a experiência, simplesmente inesquecível! Guia, transporte e equipamentos nota 10. Passeio incrível pela natureza.',
        language: 'pt',
    },
    {
        id: '3',
        packageId: '1',
        user: {
            name: 'Ana Clara',
            location: 'Brasil',
            avatar: '#9B59B6',
            initial: 'A',
        },
        rating: 4,
        date: '10 de março de 2025',
        verified: true,
        text: 'Experiência maravilhosa! Os guias foram muito atenciosos e o local é lindo. Único ponto negativo foi o tempo um pouco corrido, mas valeu muito a pena!',
        photos: [
            'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400',
            'https://images.unsplash.com/photo-1484417894907-623942c8ee29?w=400',
        ],
    },
    {
        id: '4',
        packageId: '2',
        user: {
            name: 'Carlos',
            location: 'México',
            avatar: '#F39C12',
            initial: 'C',
        },
        rating: 5,
        date: '5 de março de 2025',
        verified: true,
        text: 'Increíble experiencia! La comida estuvo deliciosa y el tour muy bien organizado. Los guías fueron muy amables y conocedores.',
        language: 'es',
    },
    {
        id: '5',
        packageId: '2',
        user: {
            name: 'Marina',
            location: 'Espanha',
            avatar: '#1ABC9C',
            initial: 'M',
        },
        rating: 5,
        date: '1 de março de 2025',
        verified: true,
        text: '¡Perfecto! Todo estuvo maravilloso desde el principio hasta el final. Definitivamente lo recomendaría a todos mis amigos.',
        photos: [
            'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=400',
        ],
        language: 'es',
    },
];

export function getReviewsByPackageId(packageId: string): Review[] {
    return MOCK_REVIEWS.filter(review => review.packageId === packageId);
}

export function getReviewCount(packageId: string): number {
    return getReviewsByPackageId(packageId).length;
}

export function getAverageRating(packageId: string): number {
    const reviews = getReviewsByPackageId(packageId);
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return Number((sum / reviews.length).toFixed(1));
}

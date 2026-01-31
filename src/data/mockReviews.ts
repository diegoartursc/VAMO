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
        text: 'A experiência foi surreal! A visita à Torre Eiffel com acesso prioritário foi incrível, as vistas de Paris são de tirar o fôlego. O guia foi muito atencioso e nos levou pelos melhores pontos da cidade. O único ponto a melhorar seria dar mais tempo livre para explorar Montmartre, que é simplesmente encantador.',
        photos: [
            'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400',
            'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=400',
            'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=400',
            'https://images.unsplash.com/photo-1549144511-f099e773c147?w=400',
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
            'https://images.unsplash.com/photo-1549144511-f099e773c147?w=400',
            'https://images.unsplash.com/photo-1431274172761-fca41d930114?w=400',
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
            'https://images.unsplash.com/photo-1568402102990-bc541580b59f?w=400',
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

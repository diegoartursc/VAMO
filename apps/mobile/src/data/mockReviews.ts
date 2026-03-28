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
    response?: {
        date: string;
        text: string;
    };
}

const MOCK_REVIEWS: Review[] = [
    {
        id: '1',
        packageId: 'pkg-1',
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
        response: {
            date: '27 de janeiro de 2026',
            text: 'Thank you for your lovely review! We are delighted to hear you had a brilliant adventure with Fabien and Cris and enjoyed the amazing views. We hope to welcome you again soon!',
        },
    },
    {
        id: '2',
        packageId: 'pkg-1',
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
        packageId: 'pkg-1',
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
        packageId: 'pkg-2',
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
        packageId: 'pkg-2',
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
    },
    // Itinerary Reviews
    {
        id: '6',
        packageId: 'itinerary-1', // Paris Econômica
        user: {
            name: 'Roberta',
            location: 'Brasil',
            avatar: '#E91E63',
            initial: 'R',
        },
        rating: 5,
        date: '20 de fevereiro de 2025',
        verified: true,
        text: 'Roteiro perfeito! Consegui fazer Paris gastando muito menos do que imaginava. As dicas de restaurantes baratos e os horários para evitar filas foram essenciais. Diego Artur montou tudo com muito carinho!',
        photos: [
            'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400',
            'https://images.unsplash.com/photo-1549144511-f099e773c147?w=400',
        ],
    },
    {
        id: '7',
        packageId: 'itinerary-1',
        user: {
            name: 'Felipe',
            location: 'Portugal',
            avatar: '#3F51B5',
            initial: 'F',
        },
        rating: 5,
        date: '15 de fevereiro de 2025',
        verified: true,
        text: 'Comprei o roteiro e valeu cada centavo! Todas as informações estavam detalhadas: voos, hotéis acessíveis, como usar o metrô, restaurantes bons e baratos. Segui tudo à risca e economizei muito.',
        response: {
            date: '16 de fevereiro de 2025',
            text: 'Muito obrigado pelo feedback, Felipe! Fico feliz que tenha aproveitado bem Paris. Qualquer dúvida, estou à disposição! 🗼',
        },
    },
    {
        id: '8',
        packageId: 'itinerary-1',
        user: {
            name: 'Camila',
            location: 'Brasil',
            avatar: '#FF5722',
            initial: 'C',
        },
        rating: 4,
        date: '10 de fevereiro de 2025',
        verified: true,
        text: 'Roteiro muito bom e completo. As dicas de locomoção e os melhores horários para visitar os pontos turísticos me ajudaram muito. Só senti falta de mais opções veganas de restaurantes, mas no geral, super recomendo!',
        photos: [
            'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=400',
        ],
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

export function getCategoryRatings(packageId: string) {
    const avgRating = getAverageRating(packageId);
    // Simulating category-specific ratings with small variations
    return {
        guide: Math.min(5, Number((avgRating + 0.1).toFixed(1))),
        transport: avgRating,
        value: Math.max(4, Number((avgRating - 0.2).toFixed(1))),
    };
}

export function getCommunityPhotos(packageId: string): string[] {
    const reviews = getReviewsByPackageId(packageId);
    return reviews
        .filter(review => review.photos && review.photos.length > 0)
        .flatMap(review => review.photos || []);
}

// Category labels mapping
const categoryLabels: Record<string, string> = {
    guide: 'o guia',
    transport: 'o transporte',
    value: 'o custo-benefício',
    organization: 'a organização do roteiro',
};

export function getTopRatedCategoriesText(packageId: string): string {
    const categoryRatings = getCategoryRatings(packageId);

    // Convert to array and filter categories with rating >= 4.5
    const topCategories = Object.entries(categoryRatings)
        .filter(([_, rating]) => rating >= 4.5)
        .sort(([_, ratingA], [__, ratingB]) => ratingB - ratingA)
        .map(([category, _]) => categoryLabels[category] || category);

    // Generate natural language text
    if (topCategories.length === 0) {
        return 'Viajantes elogiam principalmente a qualidade da experiência';
    } else if (topCategories.length === 1) {
        return `Viajantes elogiam principalmente ${topCategories[0]}`;
    } else if (topCategories.length === 2) {
        return `Viajantes elogiam principalmente ${topCategories[0]} e ${topCategories[1]}`;
    } else {
        const lastCategory = topCategories[topCategories.length - 1];
        const otherCategories = topCategories.slice(0, -1).join(', ');
        return `Viajantes elogiam principalmente ${otherCategories} e ${lastCategory}`;
    }
}

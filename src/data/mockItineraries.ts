import { Creator } from '../types/creator';

export interface Itinerary {
    id: string;
    title: string;
    destination: string;
    country: string;
    creator: {
        id: string;
        name: string;
        avatar: string;
        verificationLevel: 'basic' | 'trusted' | 'expert' | 'ambassador';
        rating: number;
        salesCount: number;
    };
    description: string;
    price: number;
    currency: string;
    images: string[];
    rating: number;
    reviewCount: number;
    inclusions: string[];
    duration: number;
    featured: boolean;
}

export const mockItineraries: Itinerary[] = [
    {
        id: '1',
        title: 'Paris Econômica - 10 dias por R$ 6.000',
        destination: 'Paris',
        country: 'França',
        creator: {
            id: 'diego',
            name: 'Diego Artur',
            avatar: '👨‍✈️',
            verificationLevel: 'ambassador',
            rating: 4.9,
            salesCount: 1234,
        },
        description: 'Roteiro completo com planilha de gastos, hospedagens baratas, restaurantes locais e atrações gratuitas.',
        price: 49.90,
        currency: 'BRL',
        images: [
            'https://images.unsplash.com/photo-1543349689-9a4d426bee8e?w=800',
            'https://images.unsplash.com/photo-1431274172761-fca41d930114?w=800',
            'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800',
        ],
        rating: 4.9,
        reviewCount: 456,
        inclusions: ['Planilha', 'Mapa', 'Suporte'],
        duration: 10,
        featured: true,
    },
    {
        id: '2',
        title: 'Tóquio Autêntica - 15 dias de Cultura',
        destination: 'Tóquio',
        country: 'Japão',
        creator: {
            id: 'mariana',
            name: 'Mariana Silva',
            avatar: '👩‍🦰',
            verificationLevel: 'expert',
            rating: 4.8,
            salesCount: 892,
        },
        description: 'Descubra o Japão além dos pontos turísticos: templos escondidos, mercados locais e experiências únicas.',
        price: 79.90,
        currency: 'BRL',
        images: [
            'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800',
            'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800',
            'https://images.unsplash.com/photo-1526481280693-3bfa7568e0f3?w=800',
        ],
        rating: 4.8,
        reviewCount: 312,
        inclusions: ['Planilha', 'Mapa', 'Guia de Frases', 'Suporte'],
        duration: 15,
        featured: true,
    },
    {
        id: '3',
        title: 'Nova York: Roteiro Completo 7 dias',
        destination: 'Nova York',
        country: 'Estados Unidos',
        creator: {
            id: 'carlos',
            name: 'Carlos Mendes',
            avatar: '👨‍💼',
            verificationLevel: 'trusted',
            rating: 4.7,
            salesCount: 567,
        },
        description: 'De Manhattan ao Brooklyn, explore NYC como um morador local. Inclui dicas de transporte e economia.',
        price: 59.90,
        currency: 'BRL',
        images: [
            'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800',
            'https://images.unsplash.com/photo-1518391846015-55a9cc003b25?w=800',
            'https://images.unsplash.com/photo-1519121785383-3229633bb75b?w=800',
        ],
        rating: 4.7,
        reviewCount: 234,
        inclusions: ['Planilha', 'Mapa', 'Suporte'],
        duration: 7,
        featured: true,
    },
    {
        id: '4',
        title: 'Londres Histórica - 5 dias Essenciais',
        destination: 'Londres',
        country: 'Reino Unido',
        creator: {
            id: 'julia',
            name: 'Julia Costa',
            avatar: '👩‍🎓',
            verificationLevel: 'expert',
            rating: 4.8,
            salesCount: 723,
        },
        description: 'Roteiro focado em história, museus gratuitos, pubs tradicionais e os melhores mirantes da cidade.',
        price: 44.90,
        currency: 'BRL',
        images: [
            'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800',
            'https://images.unsplash.com/photo-1486299267070-83823f5448dd?w=800',
            'https://images.unsplash.com/photo-1505761671935-60b3a7427bad?w=800',
        ],
        rating: 4.8,
        reviewCount: 189,
        inclusions: ['Planilha', 'Mapa', 'Guia de Museus', 'Suporte'],
        duration: 5,
        featured: false,
    },
    {
        id: '5',
        title: 'Barcelona e Praias - 12 dias de Sol',
        destination: 'Barcelona',
        country: 'Espanha',
        creator: {
            id: 'pedro',
            name: 'Pedro Oliveira',
            avatar: '👨‍🎨',
            verificationLevel: 'ambassador',
            rating: 4.9,
            salesCount: 1089,
        },
        description: 'Combine cultura, arquitetura de Gaudí e praias paradisíacas. Inclui roteiro de tapas e vinhos.',
        price: 69.90,
        currency: 'BRL',
        images: [
            'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800',
            'https://images.unsplash.com/photo-1558642084-fd07fae5282e?w=800',
            'https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=800',
        ],
        rating: 4.9,
        reviewCount: 421,
        inclusions: ['Planilha', 'Mapa', 'Guia de Restaurantes', 'Suporte'],
        duration: 12,
        featured: true,
    },
    {
        id: '6',
        title: 'Roma Imperial - 8 dias entre Ruínas e Gelatos',
        destination: 'Roma',
        country: 'Itália',
        creator: {
            id: 'ana',
            name: 'Ana Beatriz',
            avatar: '👩‍🍳',
            verificationLevel: 'expert',
            rating: 4.8,
            salesCount: 645,
        },
        description: 'Do Coliseu ao Vaticano, passando por trattorias escondidas e os melhores gelatos de Roma. Inclui bate-voltas para Pompeia e Tivoli.',
        price: 59.90,
        currency: 'BRL',
        images: [
            'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800',
            'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=800',
            'https://images.unsplash.com/photo-1529260830199-42c24126f198?w=800',
        ],
        rating: 4.8,
        reviewCount: 278,
        inclusions: ['Planilha', 'Mapa', 'Guia de Restaurantes', 'Suporte'],
        duration: 8,
        featured: true,
    },
    {
        id: '7',
        title: 'Machu Picchu e Vale Sagrado - 9 dias',
        destination: 'Cusco',
        country: 'Peru',
        creator: {
            id: 'rafael',
            name: 'Rafael Torres',
            avatar: '🧑‍🏫',
            verificationLevel: 'trusted',
            rating: 4.7,
            salesCount: 398,
        },
        description: 'Trilha Inca, aclimatação em Cusco, Vale Sagrado e a cidadela sagrada. Dicas essenciais para altitude e o que levar.',
        price: 54.90,
        currency: 'BRL',
        images: [
            'https://images.unsplash.com/photo-1587595431973-160d0d163571?w=800',
            'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800',
            'https://images.unsplash.com/photo-1580619305218-8423a7ef79b4?w=800',
        ],
        rating: 4.7,
        reviewCount: 167,
        inclusions: ['Planilha', 'Mapa', 'Guia de Trilha', 'Suporte'],
        duration: 9,
        featured: true,
    },
    {
        id: '8',
        title: 'Bali Espiritual - 14 dias de Paz',
        destination: 'Bali',
        country: 'Indonésia',
        creator: {
            id: 'camila',
            name: 'Camila Reis',
            avatar: '🧘‍♀️',
            verificationLevel: 'ambassador',
            rating: 4.9,
            salesCount: 912,
        },
        description: 'Templos milenares, arrozais de Tegallalang, praias de Uluwatu e retiros de yoga. Experiência transformadora com orçamento controlado.',
        price: 74.90,
        currency: 'BRL',
        images: [
            'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800',
            'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=800',
            'https://images.unsplash.com/photo-1573790387438-4da905039392?w=800',
        ],
        rating: 4.9,
        reviewCount: 389,
        inclusions: ['Planilha', 'Mapa', 'Guia de Templos', 'Suporte'],
        duration: 14,
        featured: true,
    },
    {
        id: '9',
        title: 'Buenos Aires: Tango, Carne e Cultura - 6 dias',
        destination: 'Buenos Aires',
        country: 'Argentina',
        creator: {
            id: 'lucas',
            name: 'Lucas Ferreira',
            avatar: '👨‍🎤',
            verificationLevel: 'trusted',
            rating: 4.6,
            salesCount: 321,
        },
        description: 'San Telmo, La Boca, Recoleta e as melhores parrillas. Inclui show de tango e passeio por livrarias históricas.',
        price: 39.90,
        currency: 'BRL',
        images: [
            'https://images.unsplash.com/photo-1612294037637-ec328d0e075e?w=800',
            'https://images.unsplash.com/photo-1589909202802-8f4aadce1849?w=800',
            'https://images.unsplash.com/photo-1587595431973-160d0d163571?w=800',
        ],
        rating: 4.6,
        reviewCount: 145,
        inclusions: ['Planilha', 'Mapa', 'Guia de Restaurantes', 'Suporte'],
        duration: 6,
        featured: false,
    },
];

// Calculate relevance score (same formula as packages)
export const calculateRelevance = (rating: number, reviewCount: number): number => {
    return rating * Math.log(reviewCount + 1);
};

export const getItinerariesByRelevance = () => {
    return [...mockItineraries].sort((a, b) => {
        const relevanceA = calculateRelevance(a.rating, a.reviewCount);
        const relevanceB = calculateRelevance(b.rating, b.reviewCount);
        return relevanceB - relevanceA; // Highest first
    });
};

export const getFeaturedItineraries = () => mockItineraries.filter(i => i.featured);

export const getItineraryById = (id: string) => mockItineraries.find(i => i.id === id);

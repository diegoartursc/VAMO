import { Package, Agency } from '../types';

const agencies: Agency[] = [
    {
        id: 'cvc',
        name: 'CVC',
        logo: '🏖️',
        verified: true,
        contactUrl: 'https://www.cvc.com.br',
        whatsapp: '+5511999999999',
    },
    {
        id: 'decolar',
        name: 'Decolar',
        logo: '✈️',
        verified: true,
        contactUrl: 'https://www.decolar.com',
    },
    {
        id: 'hurb',
        name: 'Hurb',
        logo: '🌴',
        verified: true,
        contactUrl: 'https://www.hurb.com',
    },
    {
        id: 'azul-viagens',
        name: 'Azul Viagens',
        logo: '🛫',
        verified: true,
        contactUrl: 'https://www.azulviagens.com.br',
    },
];

export const mockPackages: Package[] = [
    {
        id: '1',
        title: 'Paris Romântica - 7 Dias Inesquecíveis',
        destination: 'Paris',
        country: 'França',
        agency: agencies[0],
        price: {
            min: 8500,
            max: 12000,
            currency: 'BRL',
        },
        images: [
            'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=800',
            'https://images.unsplash.com/photo-1431274172761-fca41d930114?w=800',
        ],
        duration: 7,
        includes: [
            'Passagens aéreas ida e volta',
            'Hotel 4 estrelas no centro',
            'Café da manhã incluído',
            'Transfer aeroporto-hotel',
            'City tour pela cidade',
            'Ingresso Torre Eiffel',
        ],
        rating: 4.8,
        reviewCount: 234,
        featured: true,
        description: 'Descubra a cidade luz em um pacote completo com os principais pontos turísticos e experiências inesquecíveis.',
        highlights: [
            'Torre Eiffel com acesso prioritário',
            'Cruzeiro pelo Rio Sena',
            'Visita ao Museu do Louvre',
            'Passeio por Montmartre',
        ],
        badge: 'bestseller',
        inclusions: {
            flight: true,
            hotel: { stars: 4, meals: ['Café da manhã'] },
            tours: ['Torre Eiffel', 'Cruzeiro Sena', 'City tour'],
            extras: ['Transfer aeroporto'],
        },
        categories: ['cultural', 'romantic'],
        hasFreeCancellation: true,
        isAllInclusive: false,
        recentPurchases: 24,
        priceComparison: 'below',
        priceDiscount: 15,
        itinerary: {
            mainStop: 'Torre Eiffel',
            pickupLocations: [
                'Louvre', 'Champs-Élysées', 'Montmartre', 'Notre-Dame',
                'Arc de Triomphe', 'Musée d\'Orsay', 'Sacré-Cœur', 'Latin Quarter'
            ],
            transport: {
                type: 'Ônibus panorâmico',
                duration: '20 minutos'
            },
            mainActivity: {
                location: 'Torre Eiffel',
                activity: 'Visita guiada com acesso ao topo',
                duration: '4h',
                comfortIndicators: {
                    freeTimeForPhotos: true,
                    strategicRestStops: true,
                },
            },
            returnLocations: [
                'Louvre', 'Champs-Élysées', 'Montmartre', 'Notre-Dame',
                'Arc de Triomphe', 'Musée d\'Orsay', 'Sacré-Cœur', 'Latin Quarter'
            ],
            mapImageUrl: 'https://images.unsplash.com/photo-1524396309943-e03f5249f002?w=800'
        },
        fullDescription: 'Viva a experiência completa na Cidade Luz com este pacote exclusivo de 7 dias. Explore os monumentos mais icônicos, passeie pelos charmosos bairros parisienses, saboreie a gastronomia francesa e mergulhe na rica história e cultura da capital francesa. Nosso roteiro cuidadosamente planejado equilibra visitas guiadas aos principais pontos turísticos com tempo livre para você descobrir seus próprios tesouros escondidos. Acomodação central em hotel 4 estrelas garante conforto e praticidade para explorar a cidade a pé ou de metrô.',
        includedItems: [
            'Passagens aéreas internacionais (ida e volta)',
            'Transfer privativo aeroporto-hotel-aeroporto',
            'Hospedagem em hotel 4 estrelas no centro de Paris',
            'Café da manhã buffet todos os dias',
            'Ingresso para Torre Eiffel com acesso prioritário',
            'Cruzeiro turístico no Rio Sena (1 hora)',
            'City tour guiado em português (dia inteiro)',
            'Visita ao Museu do Louvre com guia',
            'Seguro viagem internacional',
            'Kit de boas-vindas e material informativo',
            'Assistência 24h em português',
        ],
        notRecommendedFor: [
            'Pessoas com dificuldade de locomoção (muitas escadas e caminhadas)',
            'Menores de 5 anos (roteiro intenso)',
            'Pessoas que não gostam de ambientes com muitos turistas',
        ],
        importantInfo: [
            'Passaporte com validade mínima de 6 meses',
            'Visto não é necessário para brasileiros (permanência até 90 dias)',
            'Recomendamos contratar seguro viagem com cobertura mínima de €30.000',
            'Clima: leve roupas para temperaturas entre 5°C e 25°C conforme a estação',
            'Alguns museus fecham às terças-feiras',
            'Reserve com antecedência para garantir melhores tarifas aéreas',
        ],
    },
    {
        id: '2',
        title: 'Caribe All Inclusive - Cancún',
        destination: 'Cancún',
        country: 'México',
        agency: agencies[1],
        price: {
            min: 6500,
            max: 9500,
            currency: 'BRL',
        },
        images: [
            'https://images.unsplash.com/photo-1568402102990-bc541580b59f?w=800',
            'https://images.unsplash.com/photo-1512813498716-3e640fed3f39?w=800',
        ],
        duration: 5,
        includes: [
            'Voo direto São Paulo - Cancún',
            'Resort All Inclusive 5 estrelas',
            'Todas as refeições e bebidas',
            'Atividades aquáticas',
            'Transfer incluso',
        ],
        rating: 4.9,
        reviewCount: 567,
        featured: true,
        description: 'Relaxe nas praias paradisíacas do Caribe mexicano com tudo incluído em resort de luxo.',
        highlights: [
            'Praias de areia branca',
            'Snorkeling em recifes de coral',
            'Piscinas com bar molhado',
            'Entretenimento noturno',
        ],
        badge: 'value',
        inclusions: {
            flight: true,
            hotel: { stars: 5, meals: ['Café', 'Almoço', 'Jantar', 'Bebidas'] },
            tours: ['Snorkeling'],
            extras: ['All Inclusive', 'Transfer'],
        },
        categories: ['beach', 'relaxation'],
        hasFreeCancellation: false,
        isAllInclusive: true,
        recentPurchases: 67,
        priceComparison: 'below',
        priceDiscount: 20,
        fullDescription: 'Desfrute do paraíso caribenho em um resort all-inclusive de categoria superior. Aproveite praias de águas cristalinas, piscinas infinitas, gastronomia internacional e atividades aquáticas ilimitadas. Este pacote oferece a combinação perfeita entre relaxamento total e diversão para toda a família, com estrutura completa de entretenimento diurno e noturno.',
        includedItems: [
            'Voo direto São Paulo - Cancún (ida e volta)',
            'Transfer exclusivo aeroporto-resort-aeroporto',
            'Hospedagem em resort all-inclusive 5 estrelas',
            'Todas as refeições (café, almoço, jantar e lanches)',
            'Bebidas nacionais e internacionais ilimitadas',
            'Atividades aquáticas não motorizadas (caiaque, stand-up paddle)',
            'Snorkeling com equipamento incluso',
            'Entretenimento e shows noturnos',
            'Acesso a todas as piscinas e áreas de lazer',
            'Academia e aulas de fitness',
            'Wi-Fi em todo o resort',
        ],
        notRecommendedFor: [
            'Pessoas que buscam experiências culturais intensas',
            'Viajantes que preferem explorar destinos por conta própria',
            'Quem procura ambiente tranquilo e isolado',
        ],
        importantInfo: [
            'Passaporte com validade mínima de 6 meses obrigatório',
            'Visto não é necessário para permanência de até 180 dias',
            'Taxa de turismo mexicana (aproximadamente USD 35) paga na chegada',
            'Protetor solar reef-safe obrigatório nas áreas de snorkeling',
            'Temperatura média entre 25°C e 32°C durante todo o ano',
            'Check-in no resort: 15h | Check-out: 12h',
        ],
    },
    {
        id: '3',
        title: 'Europa Clássica - 15 Dias',
        destination: 'Multi-destinos',
        country: 'Europa',
        agency: agencies[0],
        price: {
            min: 15000,
            max: 22000,
            currency: 'BRL',
        },
        images: [
            'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=800',
            'https://images.unsplash.com/photo-1520986606214-8b456906c813?w=800',
        ],
        duration: 15,
        includes: [
            'Passagens aéreas internacionais',
            'Hotéis 4 estrelas',
            'Café da manhã diário',
            'Trem entre cidades',
            'Guia em português',
            'Seguro viagem',
        ],
        rating: 4.7,
        reviewCount: 189,
        featured: true,
        description: 'Conheça as principais capitais europeias: Paris, Roma, Barcelona, Amsterdam e Londres.',
        highlights: [
            '5 países em uma viagem',
            'Principais pontos turísticos',
            'Tempo livre para explorar',
            'Grupo pequeno (máx 20 pessoas)',
        ],
    },
    {
        id: '4',
        title: 'Fernando de Noronha Completo',
        destination: 'Fernando de Noronha',
        country: 'Brasil',
        agency: agencies[2],
        price: {
            min: 4500,
            max: 7000,
            currency: 'BRL',
        },
        images: [
            'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=800',
            'https://images.unsplash.com/photo-1606146485303-b7e66e6b2e93?w=800',
        ],
        duration: 5,
        includes: [
            'Voo Recife - Noronha ida e volta',
            'Pousada com café da manhã',
            'Taxa de preservação',
            'Passeio de barco',
            'Mergulho com snorkel',
        ],
        rating: 4.9,
        reviewCount: 423,
        featured: false,
        description: 'Explore o paraíso brasileiro com praias cristalinas e vida marinha exuberante.',
        highlights: [
            'Baía do Sancho',
            'Mergulho com tartarugas',
            'Pôr do sol no Forte',
            'Trilhas ecológicas',
        ],
    },
    {
        id: '5',
        title: 'Nova York - A Cidade que Nunca Dorme',
        destination: 'Nova York',
        country: 'Estados Unidos',
        agency: agencies[3],
        price: {
            min: 7500,
            max: 11000,
            currency: 'BRL',
        },
        images: [
            'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800',
            'https://images.unsplash.com/photo-1518391846015-55a9cc003b25?w=800',
        ],
        duration: 6,
        includes: [
            'Passagens aéreas',
            'Hotel em Manhattan',
            'City Pass (principais atrações)',
            'Transfer aeroporto',
            'Chip de internet',
        ],
        rating: 4.6,
        reviewCount: 312,
        featured: false,
        description: 'Viva a experiência completa da Big Apple com os principais pontos turísticos incluídos.',
        highlights: [
            'Estátua da Liberdade',
            'Empire State Building',
            'Central Park',
            'Times Square',
        ],
    },
    {
        id: '6',
        title: 'Machu Picchu e Cusco Místico',
        destination: 'Cusco',
        country: 'Peru',
        agency: agencies[1],
        price: {
            min: 5500,
            max: 8000,
            currency: 'BRL',
        },
        images: [
            'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=800',
            'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800',
        ],
        duration: 6,
        includes: [
            'Voo São Paulo - Lima - Cusco',
            'Hotel em Cusco',
            'Trem para Machu Picchu',
            'Ingresso Machu Picchu',
            'Guia em português',
            'Vale Sagrado tour',
        ],
        rating: 4.8,
        reviewCount: 278,
        featured: true,
        description: 'Descubra a magia dos Incas em uma jornada inesquecível pelas montanhas do Peru.',
        highlights: [
            'Machu Picchu guiado',
            'Vale Sagrado dos Incas',
            'Mercado de Cusco',
            'Aclimatação incluída',
        ],
    },
    {
        id: '7',
        title: 'Dubai Luxo e Tradição',
        destination: 'Dubai',
        country: 'Emirados Árabes',
        agency: agencies[2],
        price: {
            min: 9500,
            max: 15000,
            currency: 'BRL',
        },
        images: [
            'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800',
            'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=800',
        ],
        duration: 7,
        includes: [
            'Passagens aéreas',
            'Hotel 5 estrelas',
            'Safari no deserto',
            'Burj Khalifa ingresso',
            'City tour',
            'Jantar em cruzeiro',
        ],
        rating: 4.7,
        reviewCount: 198,
        featured: false,
        description: 'Experimente o luxo e a cultura árabe na cidade mais moderna do Oriente Médio.',
        highlights: [
            'Burj Khalifa observatório',
            'Safari com jantar beduíno',
            'Dubai Mall',
            'Mesquita de Jumeirah',
        ],
    },
    {
        id: '8',
        title: 'Patagônia Argentina Aventura',
        destination: 'El Calafate',
        country: 'Argentina',
        agency: agencies[0],
        price: {
            min: 8000,
            max: 12500,
            currency: 'BRL',
        },
        images: [
            'https://images.unsplash.com/photo-1531065208531-4036c0dba3ca?w=800',
            'https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=800',
        ],
        duration: 8,
        includes: [
            'Voos internacionais e domésticos',
            'Hotéis com café da manhã',
            'Glaciar Perito Moreno tour',
            'El Chaltén trekking',
            'Transfer inclusos',
        ],
        rating: 4.9,
        reviewCount: 156,
        featured: false,
        description: 'Aventure-se pelos glaciares e montanhas da Patagônia em uma experiência única.',
        highlights: [
            'Glaciar Perito Moreno',
            'Trekking Laguna de los Tres',
            'Fauna patagônica',
            'Paisagens de tirar o fôlego',
        ],
    },
    {
        id: '9',
        title: 'Paris Essencial - Weekend Perfeito',
        destination: 'Paris',
        country: 'França',
        agency: agencies[1],
        price: {
            min: 5500,
            max: 8000,
            currency: 'BRL',
        },
        images: [
            'https://images.unsplash.com/photo-1502809737437-1d85c70dd2ca?w=800',
            'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800',
        ],
        duration: 4,
        includes: [
            'Passagens aéreas',
            'Hotel 3 estrelas',
            'Café da manhã',
            'City tour',
        ],
        rating: 4.6,
        reviewCount: 145,
        featured: false,
        description: 'Descubra Paris em 4 dias com roteiro otimizado pelos principais pontos turísticos.',
        highlights: [
            'Torre Eiffel',
            'Louvre',
            'Arco do Triunfo',
            'Champs-Élysées',
        ],
        badge: 'value',
    },
    {
        id: '10',
        title: 'Paris Completa - Experiência de Luxo',
        destination: 'Paris',
        country: 'França',
        agency: agencies[2],
        price: {
            min: 12000,
            max: 18000,
            currency: 'BRL',
        },
        images: [
            'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800',
            'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=800',
        ],
        duration: 10,
        includes: [
            'Passagens em classe executiva',
            'Hotel 5 estrelas',
            'Todas as refeições',
            'Tours privativos',
            'Transfer VIP',
        ],
        rating: 4.9,
        reviewCount: 89,
        featured: true,
        description: 'Experiência premium em Paris com acomodação de luxo e tours exclusivos.',
        highlights: [
            'Versailles com guia privado',
            'Jantar na Torre Eiffel',
            'Champagne em Reims',
            'Shopping with personal stylist',
        ],
        badge: 'luxury',
    },
];


export const getFeaturedPackages = () => mockPackages.filter(p => p.featured);

export const getPackageById = (id: string) => mockPackages.find(p => p.id === id);

export const getPackagesByDestination = (destination: string) =>
    mockPackages.filter(p =>
        p.destination.toLowerCase().includes(destination.toLowerCase()) ||
        p.country.toLowerCase().includes(destination.toLowerCase())
    );

// Calculate relevance score for sorting (rating * log(reviews + 1))
export const calculateRelevance = (rating: number, reviewCount: number): number => {
    return rating * Math.log(reviewCount + 1);
};

export const getPackagesByRelevance = () => {
    return [...mockPackages].sort((a, b) => {
        const relevanceA = calculateRelevance(a.rating, a.reviewCount);
        const relevanceB = calculateRelevance(b.rating, b.reviewCount);
        return relevanceB - relevanceA; // Highest first
    });
};

// Get related packages from the same destination (excluding the current package)
export const getRelatedPackages = (currentPackageId: string, limit: number = 4): Package[] => {
    const currentPackage = getPackageById(currentPackageId);
    if (!currentPackage) return [];

    return mockPackages
        .filter(pkg =>
            pkg.id !== currentPackageId &&
            (pkg.destination === currentPackage.destination || pkg.country === currentPackage.country)
        )
        .sort((a, b) => {
            const relevanceA = calculateRelevance(a.rating, a.reviewCount);
            const relevanceB = calculateRelevance(b.rating, b.reviewCount);
            return relevanceB - relevanceA;
        })
        .slice(0, limit);
};

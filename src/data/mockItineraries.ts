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
    highlights?: string[];
    estimatedSpending?: {
        min: number;
        max: number;
        currency: string;
        breakdown?: {
            category: string;
            amount: string;
            description: string;
        }[];
    };
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
            'https://images.unsplash.com/photo-1543349689-9a4d426bee8e?w=1600',
            'https://images.unsplash.com/photo-1431274172761-fca41d930114?w=1600',
            'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=1600',
        ],
        rating: 4.9,
        reviewCount: 456,
        inclusions: ['Planilha', 'Mapa'],
        duration: 10,
        featured: true,
        highlights: [
            'Visita à Torre Eiffel com subida ao topo',
            'Passeio pelo Museu do Louvre e Mona Lisa',
            'Cruzeiro noturno pelo Rio Sena',
            'Exploração de Montmartre e Sacré-Cœur',
            'Dia em Versailles e seus jardins',
            'Degustação de vinhos e queijos franceses',
            'Passeio pela Champs-Élysées e Arco do Triunfo',
        ],
        estimatedSpending: {
            min: 5500,
            max: 7000,
            currency: 'BRL',
            breakdown: [
                {
                    category: '🏨 Hospedagem',
                    amount: 'R$ 2.000 - 2.800',
                    description: 'Hostels e hotéis econômicos'
                },
                {
                    category: '🍽️ Alimentação',
                    amount: 'R$ 1.500 - 2.000',
                    description: 'Mercados locais e bistrôs'
                },
                {
                    category: '🚇 Transporte',
                    amount: 'R$ 800 - 1.000',
                    description: 'Passe de metrô e caminhadas'
                },
                {
                    category: '🎭 Atrações',
                    amount: 'R$ 1.200 - 1.200',
                    description: 'Museus e pontos turísticos'
                }
            ]
        },
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
            'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1600',
            'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1600',
            'https://images.unsplash.com/photo-1526481280693-3bfa7568e0f3?w=1600',
        ],
        rating: 4.8,
        reviewCount: 312,
        inclusions: ['Planilha', 'Mapa', 'Guia de Frases'],
        duration: 15,
        featured: true,
        highlights: [
            'Exploração dos templos de Asakusa e Meiji',
            'Travessia do cruzamento de Shibuya',
            'Dia completo em Akihabara e cultura otaku',
            'Visita ao Monte Fuji e região dos 5 Lagos',
            'Experiência em onsen tradicional',
            'Passeio pelo mercado de Tsukiji',
            'Excursão a Kyoto e seus templos dourados',
        ],
        estimatedSpending: {
            min: 12000,
            max: 18000,
            currency: 'BRL',
            breakdown: [
                {
                    category: '🏨 Hospedagem',
                    amount: 'R$ 4.500 - 7.000',
                    description: 'Hostels, capsule hotels e ryokans'
                },
                {
                    category: '🍽️ Alimentação',
                    amount: 'R$ 3.000 - 4.500',
                    description: 'Ramen, izakayas e konbinis'
                },
                {
                    category: '🚇 Transporte',
                    amount: 'R$ 2.500 - 3.500',
                    description: 'JR Pass e metrô local'
                },
                {
                    category: '🎭 Atrações',
                    amount: 'R$ 2.000 - 3.000',
                    description: 'Templos, museus e experiências'
                }
            ]
        },
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
            'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1600',
            'https://images.unsplash.com/photo-1518391846015-55a9cc003b25?w=1600',
            'https://images.unsplash.com/photo-1519121785383-3229633bb75b?w=1600',
        ],
        rating: 4.7,
        reviewCount: 234,
        inclusions: ['Planilha', 'Mapa'],
        duration: 7,
        featured: true,
        highlights: [
            'Caminhada pela Brooklyn Bridge ao pôr do sol',
            'Visita ao topo do Empire State Building',
            'Passeio pelo Central Park e seus pontos icônicos',
            'Explorar o Metropolitan Museum of Art',
            'Caminhar por Times Square à noite',
            'Ferry gratuito para Staten Island com vista da Estátua da Liberdade',
            'Comida de rua no Chelsea Market',
        ],
        estimatedSpending: {
            min: 8000,
            max: 14000,
            currency: 'BRL',
            breakdown: [
                {
                    category: '🏨 Hospedagem',
                    amount: 'R$ 3.500 - 6.000',
                    description: 'Hostels em Manhattan e Brooklyn'
                },
                {
                    category: '🍽️ Alimentação',
                    amount: 'R$ 2.000 - 3.500',
                    description: 'Food trucks, delis e pizza'
                },
                {
                    category: '🚇 Transporte',
                    amount: 'R$ 800 - 1.500',
                    description: 'MetroCard semanal e caminhadas'
                },
                {
                    category: '🎭 Atrações',
                    amount: 'R$ 1.700 - 3.000',
                    description: 'Museus, observatórios e shows'
                }
            ]
        },
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
            'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1600',
            'https://images.unsplash.com/photo-1486299267070-83823f5448dd?w=1600',
            'https://images.unsplash.com/photo-1505761671935-60b3a7427bad?w=1600',
        ],
        rating: 4.8,
        reviewCount: 189,
        inclusions: ['Planilha', 'Mapa', 'Guia de Museus'],
        duration: 5,
        featured: false,
        highlights: [
            'Visita à Torre de Londres e Joias da Coroa',
            'Troca da Guarda no Buckingham Palace',
            'British Museum e Natural History Museum (gratuitos)',
            'Passeio pelo South Bank e London Eye',
            'Explorar Camden Market e Notting Hill',
            'Pub crawl tradicional em Soho',
            'Vista panorâmica do The Shard',
        ],
        estimatedSpending: {
            min: 6000,
            max: 10000,
            currency: 'BRL',
            breakdown: [
                {
                    category: '🏨 Hospedagem',
                    amount: 'R$ 2.500 - 4.500',
                    description: 'Hostels e B&Bs em zonas 1-2'
                },
                {
                    category: '🍽️ Alimentação',
                    amount: 'R$ 1.500 - 2.500',
                    description: 'Pubs, mercados e fish & chips'
                },
                {
                    category: '🚇 Transporte',
                    amount: 'R$ 800 - 1.200',
                    description: 'Oyster Card e ônibus'
                },
                {
                    category: '🎭 Atrações',
                    amount: 'R$ 1.200 - 1.800',
                    description: 'Atrações pagas e shows no West End'
                }
            ]
        },
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
            'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1600',
            'https://images.unsplash.com/photo-1558642084-fd07fae5282e?w=1600',
            'https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=1600',
        ],
        rating: 4.9,
        reviewCount: 421,
        inclusions: ['Planilha', 'Mapa', 'Guia de Restaurantes'],
        duration: 12,
        featured: true,
        highlights: [
            'Visita à Sagrada Família e Park Güell',
            'Passeio pelas Ramblas e Mercado de la Boqueria',
            'Dia de praia na Barceloneta',
            'Excursão a Montserrat',
            'Tour de tapas pelo Barri Gòtic',
            'Pôr do sol no Bunkers del Carmel',
            'Experiência de flamenco no El Tablao',
        ],
        estimatedSpending: {
            min: 9000,
            max: 14000,
            currency: 'BRL',
            breakdown: [
                {
                    category: '🏨 Hospedagem',
                    amount: 'R$ 3.500 - 5.500',
                    description: 'Hostels e apartamentos no centro'
                },
                {
                    category: '🍽️ Alimentação',
                    amount: 'R$ 2.500 - 4.000',
                    description: 'Tapas, mercados e restaurantes locais'
                },
                {
                    category: '🚇 Transporte',
                    amount: 'R$ 1.000 - 1.500',
                    description: 'T-Casual e trens locais'
                },
                {
                    category: '🎭 Atrações',
                    amount: 'R$ 2.000 - 3.000',
                    description: 'Monumentos de Gaudí e excursões'
                }
            ]
        },
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
            'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1600',
            'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=1600',
            'https://images.unsplash.com/photo-1529260830199-42c24126f198?w=1600',
        ],
        rating: 4.8,
        reviewCount: 278,
        inclusions: ['Planilha', 'Mapa', 'Guia de Restaurantes'],
        duration: 8,
        featured: true,
        highlights: [
            'Tour pelo Coliseu e Fórum Romano',
            'Visita à Basílica de São Pedro e Capela Sistina',
            'Fontana di Trevi e Piazza Navona',
            'Aula de fazer pasta com chef local',
            'Bate-volta a Pompeia',
            'Degustação de gelato artesanal em Trastevere',
            'Passear pelo Panteão ao entardecer',
        ],
        estimatedSpending: {
            min: 7000,
            max: 11000,
            currency: 'BRL',
            breakdown: [
                {
                    category: '🏨 Hospedagem',
                    amount: 'R$ 2.800 - 4.500',
                    description: 'B&Bs e hotéis próximos ao centro'
                },
                {
                    category: '🍽️ Alimentação',
                    amount: 'R$ 2.000 - 3.000',
                    description: 'Trattorias, pizza al taglio e mercados'
                },
                {
                    category: '🚇 Transporte',
                    amount: 'R$ 600 - 1.000',
                    description: 'Roma Pass e caminhadas'
                },
                {
                    category: '🎭 Atrações',
                    amount: 'R$ 1.600 - 2.500',
                    description: 'Museus do Vaticano, Coliseu e Pompeia'
                }
            ]
        },
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
            'https://images.unsplash.com/photo-1587595431973-160d0d163571?w=1600',
            'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=1600',
            'https://images.unsplash.com/photo-1580619305218-8423a7ef79b4?w=1600',
        ],
        rating: 4.7,
        reviewCount: 167,
        inclusions: ['Planilha', 'Mapa', 'Guia de Trilha'],
        duration: 9,
        featured: true,
        highlights: [
            'Trilha Inca de 4 dias com acampamento',
            'Nascer do sol em Machu Picchu',
            'Exploração do Vale Sagrado e Ollantaytambo',
            'Mercado de San Pedro em Cusco',
            'Salineras de Maras e Moray',
            'Degustação de ceviche e pisco sour',
            'Aclimatação com caminhadas em Cusco',
        ],
        estimatedSpending: {
            min: 5000,
            max: 8500,
            currency: 'BRL',
            breakdown: [
                {
                    category: '🏨 Hospedagem',
                    amount: 'R$ 1.800 - 3.000',
                    description: 'Hostels em Cusco e lodges no vale'
                },
                {
                    category: '🍽️ Alimentação',
                    amount: 'R$ 1.200 - 2.000',
                    description: 'Restaurantes locais e mercados'
                },
                {
                    category: '🚇 Transporte',
                    amount: 'R$ 800 - 1.500',
                    description: 'Trem para Aguas Calientes e vans'
                },
                {
                    category: '🎭 Atrações',
                    amount: 'R$ 1.200 - 2.000',
                    description: 'Trilha Inca, boleto turístico e guias'
                }
            ]
        },
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
            'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1600',
            'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=1600',
            'https://images.unsplash.com/photo-1573790387438-4da905039392?w=1600',
        ],
        rating: 4.9,
        reviewCount: 389,
        inclusions: ['Planilha', 'Mapa', 'Guia de Templos'],
        duration: 14,
        featured: true,
        highlights: [
            'Terraços de arroz de Tegallalang',
            'Nascer do sol no Monte Batur',
            'Templo de Uluwatu com dança Kecak',
            'Retiro de yoga em Ubud',
            'Snorkeling nas Nusa Islands',
            'Cerimônia de purificação em Tirta Empul',
            'Pôr do sol no Tanah Lot',
        ],
        estimatedSpending: {
            min: 6000,
            max: 9500,
            currency: 'BRL',
            breakdown: [
                {
                    category: '🏨 Hospedagem',
                    amount: 'R$ 2.000 - 3.500',
                    description: 'Guesthouses e villas com piscina'
                },
                {
                    category: '🍽️ Alimentação',
                    amount: 'R$ 1.500 - 2.500',
                    description: 'Warungs locais e cafés em Ubud'
                },
                {
                    category: '🚇 Transporte',
                    amount: 'R$ 1.000 - 1.500',
                    description: 'Moto alugada e transfers'
                },
                {
                    category: '🎭 Atrações',
                    amount: 'R$ 1.500 - 2.000',
                    description: 'Templos, retiros e excursões'
                }
            ]
        },
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
            'https://images.unsplash.com/photo-1612294037637-ec328d0e075e?w=1600',
            'https://images.unsplash.com/photo-1589909202802-8f4aadce1849?w=1600',
            'https://images.unsplash.com/photo-1587595431973-160d0d163571?w=1600',
        ],
        rating: 4.6,
        reviewCount: 145,
        inclusions: ['Planilha', 'Mapa', 'Guia de Restaurantes'],
        duration: 6,
        featured: false,
        highlights: [
            'Tour pelo bairro de La Boca e Caminito',
            'Show de tango em San Telmo',
            'Parrilla autêntica em Puerto Madero',
            'Cemitério da Recoleta e túmulo de Evita',
            'Livraria Ateneo Grand Splendid',
            'Passeio pelo Jardín Japonés',
            'Feira de antiguidades de San Telmo no domingo',
        ],
        estimatedSpending: {
            min: 3500,
            max: 6000,
            currency: 'BRL',
            breakdown: [
                {
                    category: '🏨 Hospedagem',
                    amount: 'R$ 1.200 - 2.200',
                    description: 'Hostels em Palermo e San Telmo'
                },
                {
                    category: '🍽️ Alimentação',
                    amount: 'R$ 1.000 - 1.800',
                    description: 'Parrillas, empanadas e cafés'
                },
                {
                    category: '🚇 Transporte',
                    amount: 'R$ 400 - 700',
                    description: 'SUBE card e subte'
                },
                {
                    category: '🎭 Atrações',
                    amount: 'R$ 900 - 1.300',
                    description: 'Shows de tango e passeios'
                }
            ]
        },
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

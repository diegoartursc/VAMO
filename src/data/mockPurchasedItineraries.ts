import { Itinerary } from './mockItineraries';

export interface DayActivity {
    id: string;
    time: string;
    duration: string;
    title: string;
    location: string;
    description: string;
    images: string[];
    tips: string[];
    mapLink?: string;
    completed?: boolean;
    notes?: string;
    type: 'transport' | 'activity' | 'meal' | 'rest';
    icon: string;
}

export interface ItineraryDay {
    dayNumber: number;
    date?: string;
    title: string;
    summary: string;
    activities: DayActivity[];
    estimatedCost?: {
        min: number;
        max: number;
        currency: string;
    };
}

export interface AccommodationInfo {
    name: string;
    address: string;
    phone: string;
    checkIn: string;
    checkOut: string;
    confirmationNumber?: string;
    mapLink?: string;
    images: string[];
}

export interface EmergencyContact {
    type: string;
    name: string;
    phone: string;
    available: string;
}

export interface ChecklistItem {
    id: string;
    category: 'documents' | 'packing' | 'pre-trip' | 'custom';
    text: string;
    completed: boolean;
}

export interface SpendingProfile {
    id: 'economico' | 'conforto' | 'luxo';
    label: string;
    icon: string;
    dailyCost: number; // base cost per person per day in BRL
    breakdown: {
        category: string;
        amount: number;
    }[];
}

export interface TransportInfo {
    mainMode: string;
    description: string;
    passes: {
        name: string;
        price: string;
        description: string;
    }[];
    tips: string[];
}

export interface AccommodationOption {
    id: string;
    name: string;
    tier: 'economico' | 'medio' | 'luxo';
    tierLabel: string;
    priceRange: string;
    location: string;
    description: string;
    rating?: number;
}

export interface ReceiveItem {
    icon: string;
    label: string;
}

export interface PurchasedItinerary extends Itinerary {
    purchaseDate: string;
    tripStartDate: string;
    tripEndDate: string;
    days: ItineraryDay[];
    accommodation?: AccommodationInfo[];
    emergencyContacts: EmergencyContact[];
    checklist: ChecklistItem[];
    importantInfo: string[];
    weatherInfo?: {
        temperature: string;
        conditions: string;
        recommendation: string;
    };
    spendingProfiles?: SpendingProfile[];
    transport?: TransportInfo;
    accommodationOptions?: AccommodationOption[];
    receiveList?: ReceiveItem[];
}

export const mockPurchasedItineraries: PurchasedItinerary[] = [
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
        inclusions: ['Planilha', 'Mapa'],
        duration: 10,
        featured: true,
        purchaseDate: '2026-01-15',
        tripStartDate: '2026-03-10',
        tripEndDate: '2026-03-20',
        highlights: [
            'Visita à Torre Eiffel com subida ao topo',
            'Passeio pelo Museu do Louvre e Mona Lisa',
            'Cruzeiro noturno pelo Rio Sena',
        ],
        days: [
            {
                dayNumber: 1,
                date: '2026-03-10',
                title: 'Chegada e Primeira Impressão',
                summary: 'Chegada em Paris, check-in no hotel e primeira exploração do bairro',
                activities: [
                    {
                        id: 'day1-1',
                        time: '14:00',
                        duration: '1h',
                        title: 'Check-in no Hotel',
                        location: 'Hotel Le Marais',
                        description: 'Faça o check-in e deixe suas malas. O hotel fica no charmoso bairro Le Marais, próximo ao metrô.',
                        images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'],
                        tips: [
                            'Peça um mapa do bairro na recepção',
                            'Guarde seus documentos no cofre do quarto',
                            'Pergunte sobre horários de café da manhã',
                        ],
                        type: 'rest',
                        icon: '🏨',
                    },
                    {
                        id: 'day1-2',
                        time: '15:30',
                        duration: '2h',
                        title: 'Caminhada pelo Le Marais',
                        location: 'Bairro Le Marais',
                        description: 'Explore as ruas medievais, galerias de arte e cafés charmosos. Visite a Place des Vosges, a praça mais antiga de Paris.',
                        images: [
                            'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800',
                            'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=800',
                        ],
                        tips: [
                            'Use sapatos confortáveis - as ruas são de paralelepípedo',
                            'Pare no L\'As du Fallafel para um lanche rápido',
                            'Visite a livraria Shakespeare and Company',
                        ],
                        mapLink: 'https://maps.google.com/?q=Le+Marais+Paris',
                        type: 'activity',
                        icon: '🚶',
                    },
                    {
                        id: 'day1-3',
                        time: '18:00',
                        duration: '1.5h',
                        title: 'Jantar em Bistrô Local',
                        location: 'Chez Janou',
                        description: 'Jantar tradicional francês em um bistrô autêntico. Experimente o confit de canard ou steak frites.',
                        images: ['https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800'],
                        tips: [
                            'Reserve com antecedência pelo telefone',
                            'Peça a sugestão do chef',
                            'Experimente o vinho da casa',
                        ],
                        type: 'meal',
                        icon: '🍽️',
                    },
                    {
                        id: 'day1-4',
                        time: '20:00',
                        duration: '1h',
                        title: 'Caminhada Noturna pelo Sena',
                        location: 'Rio Sena',
                        description: 'Passeio relaxante pelas margens do Sena com vista para a Torre Eiffel iluminada.',
                        images: ['https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=800'],
                        tips: [
                            'A Torre Eiffel acende às 21h',
                            'Leve uma jaqueta - pode esfriar à noite',
                            'Aproveite para tirar fotos incríveis',
                        ],
                        type: 'activity',
                        icon: '🌙',
                    },
                ],
                estimatedCost: {
                    min: 150,
                    max: 200,
                    currency: 'BRL',
                },
            },
            {
                dayNumber: 2,
                date: '2026-03-11',
                title: 'Torre Eiffel e Trocadéro',
                summary: 'Dia dedicado ao símbolo de Paris e seus arredores',
                activities: [
                    {
                        id: 'day2-1',
                        time: '08:00',
                        duration: '1h',
                        title: 'Café da Manhã no Hotel',
                        location: 'Hotel Le Marais',
                        description: 'Café da manhã continental incluído na diária.',
                        images: [],
                        tips: ['Chegue cedo para evitar filas', 'Leve frutas para o passeio'],
                        type: 'meal',
                        icon: '☕',
                    },
                    {
                        id: 'day2-2',
                        time: '09:30',
                        duration: '30min',
                        title: 'Metrô até Trocadéro',
                        location: 'Estação Trocadéro',
                        description: 'Pegue a linha 6 até Trocadéro para a melhor vista da Torre Eiffel.',
                        images: [],
                        tips: [
                            'Compre um passe de 10 viagens (carnet) para economizar',
                            'Guarde o ticket até sair da estação',
                        ],
                        type: 'transport',
                        icon: '🚇',
                    },
                    {
                        id: 'day2-3',
                        time: '10:00',
                        duration: '3h',
                        title: 'Visita à Torre Eiffel',
                        location: 'Torre Eiffel',
                        description: 'Suba até o topo da Torre Eiffel e aprecie a vista panorâmica de Paris. Reserve seu ingresso online com antecedência.',
                        images: [
                            'https://images.unsplash.com/photo-1543349689-9a4d426bee8e?w=800',
                            'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=800',
                        ],
                        tips: [
                            'Reserve ingressos online para evitar filas de 2-3 horas',
                            'Vá cedo pela manhã ou no final da tarde',
                            'Leve água e lanches - é caro lá dentro',
                            'Use o banheiro antes de subir',
                        ],
                        mapLink: 'https://maps.google.com/?q=Torre+Eiffel+Paris',
                        type: 'activity',
                        icon: '🗼',
                    },
                    {
                        id: 'day2-4',
                        time: '13:30',
                        duration: '1.5h',
                        title: 'Almoço com Vista',
                        location: 'Café du Trocadéro',
                        description: 'Almoço leve com vista privilegiada da Torre Eiffel.',
                        images: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800'],
                        tips: [
                            'Peça uma mesa na varanda',
                            'Experimente o croque monsieur',
                        ],
                        type: 'meal',
                        icon: '🥐',
                    },
                    {
                        id: 'day2-5',
                        time: '15:30',
                        duration: '2h',
                        title: 'Jardins do Trocadéro',
                        location: 'Jardins do Trocadéro',
                        description: 'Relaxe nos jardins, tire fotos e aproveite a vista da Torre Eiffel.',
                        images: ['https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800'],
                        tips: [
                            'Ótimo lugar para piquenique',
                            'Cuidado com vendedores ambulantes',
                        ],
                        type: 'activity',
                        icon: '🌳',
                    },
                ],
                estimatedCost: {
                    min: 200,
                    max: 280,
                    currency: 'BRL',
                },
            },
            {
                dayNumber: 3,
                date: '2026-03-12',
                title: 'Museu do Louvre',
                summary: 'Dia completo explorando o maior museu do mundo',
                activities: [
                    {
                        id: 'day3-1',
                        time: '09:00',
                        duration: '5h',
                        title: 'Museu do Louvre',
                        location: 'Museu do Louvre',
                        description: 'Visite as principais obras: Mona Lisa, Vênus de Milo, Vitória de Samotrácia. Reserve ingresso online.',
                        images: [
                            'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800',
                            'https://images.unsplash.com/photo-1564399579883-451a5d44ec08?w=800',
                        ],
                        tips: [
                            'Chegue quando abrir às 9h para evitar multidões',
                            'Use a entrada pela estação de metrô para pular filas',
                            'Foque nas principais obras - é impossível ver tudo',
                            'Use o app do Louvre para navegação',
                            'Leve água e lanches',
                        ],
                        mapLink: 'https://maps.google.com/?q=Museu+do+Louvre+Paris',
                        type: 'activity',
                        icon: '🎨',
                    },
                ],
                estimatedCost: {
                    min: 180,
                    max: 250,
                    currency: 'BRL',
                },
            },
        ],
        accommodation: [
            {
                name: 'Hotel Le Marais',
                address: 'Rue des Archives, 75004 Paris',
                phone: '+33 1 42 72 31 52',
                checkIn: '2026-03-10 14:00',
                checkOut: '2026-03-20 11:00',
                confirmationNumber: 'HLM-2026-001234',
                mapLink: 'https://maps.google.com/?q=Hotel+Le+Marais+Paris',
                images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'],
            },
        ],
        emergencyContacts: [
            {
                type: 'Criador do Roteiro',
                name: 'Diego Artur',
                phone: '+55 11 98765-4321',
                available: '24/7',
            },
            {
                type: 'Emergência França',
                name: 'SAMU (Ambulância)',
                phone: '15',
                available: '24/7',
            },
            {
                type: 'Polícia',
                name: 'Police Nationale',
                phone: '17',
                available: '24/7',
            },
            {
                type: 'Embaixada do Brasil',
                name: 'Embaixada do Brasil em Paris',
                phone: '+33 1 45 61 63 00',
                available: 'Seg-Sex 9h-17h',
            },
        ],
        checklist: [
            { id: 'doc-1', category: 'documents', text: 'Passaporte válido', completed: true },
            { id: 'doc-2', category: 'documents', text: 'Seguro viagem', completed: true },
            { id: 'doc-3', category: 'documents', text: 'Comprovante de hospedagem', completed: false },
            { id: 'doc-4', category: 'documents', text: 'Cartão de crédito internacional', completed: true },
            { id: 'pack-1', category: 'packing', text: 'Roupas de frio (março ainda é frio)', completed: false },
            { id: 'pack-2', category: 'packing', text: 'Sapatos confortáveis para caminhar', completed: false },
            { id: 'pack-3', category: 'packing', text: 'Adaptador de tomada europeu', completed: false },
            { id: 'pack-4', category: 'packing', text: 'Medicamentos pessoais', completed: false },
            { id: 'pre-1', category: 'pre-trip', text: 'Reservar ingressos Torre Eiffel', completed: false },
            { id: 'pre-2', category: 'pre-trip', text: 'Reservar ingressos Louvre', completed: false },
            { id: 'pre-3', category: 'pre-trip', text: 'Comprar chip de internet ou eSIM', completed: false },
            { id: 'pre-4', category: 'pre-trip', text: 'Avisar banco sobre viagem internacional', completed: false },
        ],
        importantInfo: [
            '🔌 Voltagem: 220V - Leve adaptador tipo C/E',
            '💶 Moeda: Euro (EUR) - Troque em casas de câmbio ou use cartão',
            '🕐 Fuso horário: GMT+1 (4h a mais que Brasília)',
            '🗣️ Idioma: Francês - Baixe o Google Tradutor offline',
            '📱 Internet: Compre chip ou eSIM antes de viajar',
            '🚇 Transporte: Compre Paris Visite Pass para metrô ilimitado',
        ],
        weatherInfo: {
            temperature: '8°C - 15°C',
            conditions: 'Parcialmente nublado com possibilidade de chuva',
            recommendation: 'Leve casaco, guarda-chuva e roupas em camadas',
        },
        spendingProfiles: [
            {
                id: 'economico',
                label: 'Econômico',
                icon: '💰',
                dailyCost: 350,
                breakdown: [
                    { category: 'Hospedagem', amount: 120 },
                    { category: 'Alimentação', amount: 100 },
                    { category: 'Transporte', amount: 30 },
                    { category: 'Atrações', amount: 50 },
                    { category: 'Extras', amount: 50 },
                ],
            },
            {
                id: 'conforto',
                label: 'Conforto',
                icon: '✨',
                dailyCost: 650,
                breakdown: [
                    { category: 'Hospedagem', amount: 280 },
                    { category: 'Alimentação', amount: 180 },
                    { category: 'Transporte', amount: 50 },
                    { category: 'Atrações', amount: 80 },
                    { category: 'Extras', amount: 60 },
                ],
            },
            {
                id: 'luxo',
                label: 'Luxo',
                icon: '👑',
                dailyCost: 1200,
                breakdown: [
                    { category: 'Hospedagem', amount: 550 },
                    { category: 'Alimentação', amount: 300 },
                    { category: 'Transporte', amount: 100 },
                    { category: 'Atrações', amount: 150 },
                    { category: 'Extras', amount: 100 },
                ],
            },
        ],
        transport: {
            mainMode: 'Metrô + Caminhada',
            description: 'Paris é uma cidade muito bem servida de transporte público. O metrô cobre praticamente toda a cidade e é a forma mais eficiente de se locomover.',
            passes: [
                {
                    name: 'Paris Visite Pass',
                    price: '€13,95/dia (zonas 1-3)',
                    description: 'Passe ilimitado para metrô, ônibus e RER dentro de Paris.',
                },
                {
                    name: 'Carnet de 10 viagens',
                    price: '€16,90',
                    description: 'Pacote com 10 tickets avulsos para metrô. Mais barato que comprar individual.',
                },
                {
                    name: 'Navigo Easy',
                    price: '€2 (cartão) + recargas',
                    description: 'Cartão recarregável para metrô, ideal para estadias mais longas.',
                },
            ],
            tips: [
                'O metrô funciona das 5h30 à 1h15 (até 2h15 sextas e sábados)',
                'Guarde o ticket até sair da estação — há fiscalização',
                'Uber e táxis são caros, evite para economia',
                'Para Versalhes, use o RER C (incluso no Paris Visite Pass zonas 1-5)',
                'Muitos pontos turísticos são acessíveis a pé',
            ],
        },
        accommodationOptions: [
            {
                id: 'acc-1',
                name: 'Generator Paris',
                tier: 'economico',
                tierLabel: '💰 Econômico',
                priceRange: 'R$ 120-180/noite',
                location: 'Próximo à Gare du Nord (10ème)',
                description: 'Hostel moderno e jovem, ideal para viajantes solo ou casais econômicos.',
                rating: 4.2,
            },
            {
                id: 'acc-2',
                name: 'St Christopher\'s Inn',
                tier: 'economico',
                tierLabel: '💰 Econômico',
                priceRange: 'R$ 100-160/noite',
                location: 'Gare du Nord (10ème)',
                description: 'Hostel com bar e área social. Boa localização para metrô.',
                rating: 4.0,
            },
            {
                id: 'acc-3',
                name: 'Hotel Le Marais',
                tier: 'medio',
                tierLabel: '✨ Conforto',
                priceRange: 'R$ 280-400/noite',
                location: 'Le Marais (4ème)',
                description: 'Hotel boutique no bairro mais charmoso de Paris. Perto de restaurantes e metrô.',
                rating: 4.6,
            },
            {
                id: 'acc-4',
                name: 'Hotel Bastille de Launay',
                tier: 'medio',
                tierLabel: '✨ Conforto',
                priceRange: 'R$ 320-450/noite',
                location: 'Bastille (11ème)',
                description: 'Hotel acolhedor com excelente café da manhã. Bairro vibrante.',
                rating: 4.5,
            },
            {
                id: 'acc-5',
                name: 'Hôtel Plaza Athénée',
                tier: 'luxo',
                tierLabel: '👑 Luxo',
                priceRange: 'R$ 2.500-5.000/noite',
                location: 'Avenue Montaigne (8ème)',
                description: 'Palácio 5 estrelas com vista para a Torre Eiffel. Restaurante Alain Ducasse.',
                rating: 4.9,
            },
            {
                id: 'acc-6',
                name: 'Le Meurice',
                tier: 'luxo',
                tierLabel: '👑 Luxo',
                priceRange: 'R$ 3.000-6.000/noite',
                location: 'Rue de Rivoli (1er)',
                description: 'Palácio histórico em frente ao Jardim das Tuileries. Vista para o Louvre.',
                rating: 4.8,
            },
        ],
        receiveList: [
            { icon: '📋', label: 'Itinerário completo dia a dia' },
            { icon: '🏨', label: 'Hospedagens recomendadas por faixa' },
            { icon: '🗺️', label: 'Mapa com pontos marcados' },
            { icon: '🚇', label: 'Guia de locomoção local' },
            { icon: '💡', label: 'Dicas exclusivas do criador' },
            { icon: '🍽️', label: 'Restaurantes selecionados' },
            { icon: '💰', label: 'Estimativa de gastos interativa' },
            { icon: '✅', label: 'Checklist de planejamento' },
        ],
    },
    // ─── Tóquio Completo ────────────────────────────────────
    {
        id: '2',
        title: 'Tóquio Completo - 14 dias',
        destination: 'Tóquio',
        country: 'Japão',
        creator: {
            id: 'ana',
            name: 'Ana Viajante',
            avatar: '🌸',
            verificationLevel: 'expert' as const,
            rating: 4.9,
            salesCount: 312,
        },
        description: 'Roteiro completo com gastronomia, templos, bairros modernos e dicas locais.',
        price: 59.90,
        currency: 'BRL',
        images: [
            'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800',
            'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800',
        ],
        rating: 4.9,
        reviewCount: 89,
        inclusions: ['Planilha', 'Mapa'],
        duration: 14,
        featured: false,
        purchaseDate: '2026-02-01',
        tripStartDate: '2026-04-05',
        tripEndDate: '2026-04-19',
        highlights: [
            'Templo Senso-ji em Asakusa',
            'Travessia de Shibuya Crossing',
            'Comida de rua em Omoide Yokocho',
        ],
        days: [
            {
                dayNumber: 1,
                date: '2026-04-05',
                title: 'Chegada + Shinjuku',
                summary: 'Chegada em Tóquio, check-in e exploração de Shinjuku.',
                activities: [
                    {
                        id: 'tk-d1-1',
                        time: '14:00',
                        duration: '1h',
                        title: 'Check-in no Hotel em Shinjuku',
                        location: 'Shinjuku, Tóquio',
                        description: 'Região central com fácil acesso ao metrô.',
                        images: [],
                        tips: ['Compre um Suica card na estação JR'],
                        type: 'rest',
                        icon: '🏨',
                    },
                    {
                        id: 'tk-d1-2',
                        time: '16:00',
                        duration: '2h',
                        title: 'Kabukicho & Golden Gai',
                        location: 'Golden Gai, Shinjuku',
                        description: 'Explore os bares minúsculos do Golden Gai.',
                        images: [],
                        tips: [],
                        type: 'activity',
                        icon: '🍻',
                    },
                    {
                        id: 'tk-d1-3',
                        time: '19:00',
                        duration: '1h30',
                        title: 'Jantar em Omoide Yokocho',
                        location: 'Omoide Yokocho, Shinjuku',
                        description: 'Rua de yakitori e ramen autêntico.',
                        images: [],
                        tips: ['Prove o yakitori de pele de frango'],
                        type: 'meal',
                        icon: '🍜',
                    },
                ],
            },
            {
                dayNumber: 2,
                date: '2026-04-06',
                title: 'Templos & Tradição',
                summary: 'Dia de imersão cultural em Asakusa e Akihabara.',
                activities: [
                    {
                        id: 'tk-d2-1',
                        time: '08:00',
                        duration: '2h',
                        title: 'Templo Senso-ji (Asakusa)',
                        location: 'Asakusa, Tóquio',
                        description: 'O templo mais antigo de Tóquio.',
                        images: [],
                        tips: ['Chegue cedo para fotos sem multidão'],
                        type: 'activity',
                        icon: '⛩️',
                    },
                    {
                        id: 'tk-d2-2',
                        time: '11:00',
                        duration: '1h30',
                        title: 'Nakamise-dori Shopping',
                        location: 'Asakusa, Tóquio',
                        description: 'Rua de souvenirs tradicionais.',
                        images: [],
                        tips: [],
                        type: 'activity',
                        icon: '🛍️',
                    },
                    {
                        id: 'tk-d2-3',
                        time: '14:00',
                        duration: '2h',
                        title: 'Akihabara',
                        location: 'Akihabara, Tóquio',
                        description: 'Bairro eletrônico e cultura otaku.',
                        images: [],
                        tips: [],
                        type: 'activity',
                        icon: '🎮',
                    },
                    {
                        id: 'tk-d2-4',
                        time: '19:00',
                        duration: '1h30',
                        title: 'Jantar de Sushi no Tsukiji',
                        location: 'Tsukiji Outer Market',
                        description: 'Sushi fresco dos melhores fornecedores.',
                        images: [],
                        tips: [],
                        type: 'meal',
                        icon: '🍣',
                    },
                ],
            },
            {
                dayNumber: 3,
                date: '2026-04-07',
                title: 'Shibuya & Harajuku',
                summary: 'Dia moderno com moda, cultura pop e o famoso cruzamento.',
                activities: [
                    {
                        id: 'tk-d3-1',
                        time: '09:00',
                        duration: '1h30',
                        title: 'Meiji Jingu',
                        location: 'Harajuku, Tóquio',
                        description: 'Santuário xintoísta no meio da cidade.',
                        images: [],
                        tips: [],
                        type: 'activity',
                        icon: '⛩️',
                    },
                    {
                        id: 'tk-d3-2',
                        time: '12:00',
                        duration: '2h',
                        title: 'Takeshita-dori (Harajuku)',
                        location: 'Harajuku, Tóquio',
                        description: 'Moda excêntrica e crepes kawaii.',
                        images: [],
                        tips: [],
                        type: 'activity',
                        icon: '🎀',
                    },
                    {
                        id: 'tk-d3-3',
                        time: '15:00',
                        duration: '1h',
                        title: 'Shibuya Crossing',
                        location: 'Shibuya, Tóquio',
                        description: 'O cruzamento mais famoso do mundo.',
                        images: [],
                        tips: ['O Starbucks do 2º andar tem a melhor vista'],
                        type: 'activity',
                        icon: '🚶',
                    },
                ],
            },
        ],
        emergencyContacts: [
            { type: 'Embaixada do Brasil', name: 'Embaixada em Tóquio', phone: '+81-3-3404-5211', available: 'Seg-Sex 9h-17h' },
        ],
        checklist: [
            { id: 'tk-doc-1', category: 'documents', text: 'Passaporte válido (mín 6 meses)', completed: true },
            { id: 'tk-doc-2', category: 'documents', text: 'Seguro viagem Ásia', completed: false },
            { id: 'tk-doc-3', category: 'documents', text: 'JR Pass ativado', completed: false },
            { id: 'tk-pack-1', category: 'packing', text: 'Sapatos confortáveis', completed: false },
            { id: 'tk-pack-2', category: 'packing', text: 'Guarda-chuva compacto', completed: false },
            { id: 'tk-pack-3', category: 'packing', text: 'Adaptador tipo A/B', completed: false },
            { id: 'tk-pre-1', category: 'pre-trip', text: 'Reservar TeamLab Borderless', completed: false },
            { id: 'tk-pre-2', category: 'pre-trip', text: 'Comprar Suica Card online', completed: false },
            { id: 'tk-pre-3', category: 'pre-trip', text: 'Baixar Google Translate offline (japonês)', completed: false },
        ],
        importantInfo: [
            '🔌 Voltagem: 100V — Leve adaptador tipo A/B',
            '💴 Moeda: Iene (JPY) — Muitos lugares só aceitam dinheiro',
            '🕐 Fuso horário: GMT+9 (12h a mais que Brasília)',
            '🗣️ Idioma: Japonês — Google Translate com câmera é essencial',
            '📱 Internet: eSIM ou Pocket WiFi recomendado',
        ],
        spendingProfiles: [
            {
                id: 'economico',
                label: 'Econômico',
                icon: '💴',
                dailyCost: 250,
                breakdown: [
                    { category: 'Hospedagem', amount: 100 },
                    { category: 'Alimentação', amount: 60 },
                    { category: 'Transporte', amount: 40 },
                    { category: 'Atrações', amount: 30 },
                    { category: 'Extras', amount: 20 },
                ],
            },
            {
                id: 'conforto',
                label: 'Conforto',
                icon: '🏯',
                dailyCost: 500,
                breakdown: [
                    { category: 'Hospedagem', amount: 220 },
                    { category: 'Alimentação', amount: 120 },
                    { category: 'Transporte', amount: 60 },
                    { category: 'Atrações', amount: 60 },
                    { category: 'Extras', amount: 40 },
                ],
            },
            {
                id: 'luxo',
                label: 'Luxo',
                icon: '🎌',
                dailyCost: 900,
                breakdown: [
                    { category: 'Hospedagem', amount: 450 },
                    { category: 'Alimentação', amount: 200 },
                    { category: 'Transporte', amount: 80 },
                    { category: 'Atrações', amount: 100 },
                    { category: 'Extras', amount: 70 },
                ],
            },
        ],
        transport: {
            mainMode: 'Metrô + Shinkansen',
            description: 'Tóquio tem uma das redes de transporte mais eficientes do mundo. O Suica card funciona em trens, metrôs e até lojas de conveniência.',
            passes: [
                { name: 'JR Pass 14 dias', price: '¥50.000 (~R$ 1.700)', description: 'Acesso ilimitado a trens JR e Shinkansen.' },
                { name: 'Suica Card', price: '¥2.000 (~R$ 70)', description: 'Cartão recarregável para metrô e lojas.' },
            ],
            tips: [
                'Evite táxi — metrô é mais rápido e barato.',
                'JR Pass vale muito se sair de Tóquio.',
                'Última composição de metrô é por volta da meia-noite.',
            ],
        },
        accommodationOptions: [
            {
                id: 'tk-acc-1',
                name: 'Hostel Cápsula Shinjuku',
                tier: 'economico',
                tierLabel: '💴 Econômico',
                priceRange: 'R$ 100-150/noite',
                location: 'Shinjuku, Tóquio',
                description: 'Hostel cápsula moderno perto da estação.',
                rating: 4.3,
            },
            {
                id: 'tk-acc-2',
                name: 'Hotel Gracery Shinjuku',
                tier: 'medio',
                tierLabel: '🏯 Conforto',
                priceRange: 'R$ 400-600/noite',
                location: 'Kabukicho, Shinjuku',
                description: 'Hotel temático com Godzilla na cobertura.',
                rating: 4.6,
            },
            {
                id: 'tk-acc-3',
                name: 'Park Hyatt Tokyo',
                tier: 'luxo',
                tierLabel: '🎌 Luxo',
                priceRange: 'R$ 2.500-4.000/noite',
                location: 'Nishi-Shinjuku',
                description: 'O hotel do filme Lost in Translation. Vista panorâmica.',
                rating: 4.9,
            },
        ],
        receiveList: [
            { icon: '📋', label: 'Itinerário completo dia a dia' },
            { icon: '🏨', label: 'Hospedagens recomendadas por faixa' },
            { icon: '🗺️', label: 'Mapa com pontos marcados' },
            { icon: '🚇', label: 'Guia de transporte e passes' },
            { icon: '💡', label: 'Dicas exclusivas da criadora' },
            { icon: '🍣', label: 'Restaurantes selecionados' },
            { icon: '💰', label: 'Estimativa de gastos interativa' },
            { icon: '✅', label: 'Checklist de planejamento' },
        ],
    },
    // ─── Bali & Tailândia ───────────────────────────────────
    {
        id: '3',
        title: 'Bali & Tailândia - 21 dias',
        destination: 'Bali',
        country: 'Indonésia',
        creator: {
            id: 'marco',
            name: 'Marco Explorer',
            avatar: '🧭',
            verificationLevel: 'trusted' as const,
            rating: 4.7,
            salesCount: 198,
        },
        description: 'Guia completo de mochilão por Bali e Tailândia com dicas de economia e experiências autênticas.',
        price: 69.90,
        currency: 'BRL',
        images: [
            'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800',
            'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800',
        ],
        rating: 4.7,
        reviewCount: 64,
        inclusions: ['Planilha', 'Mapa'],
        duration: 21,
        featured: false,
        purchaseDate: '2026-02-10',
        tripStartDate: '2026-05-01',
        tripEndDate: '2026-05-22',
        highlights: [
            'Terraços de arroz em Tegallalang',
            'Templo de água Tirta Empul',
            'Sunset no Rock Bar Ayana',
        ],
        days: [
            {
                dayNumber: 1,
                date: '2026-05-01',
                title: 'Chegada em Bali (Ubud)',
                summary: 'Chegada, instalação e primeira exploração de Ubud.',
                activities: [
                    {
                        id: 'bl-d1-1',
                        time: '15:00',
                        duration: '1h',
                        title: 'Check-in em Ubud',
                        location: 'Ubud, Bali',
                        description: 'Vila com vista para os arrozais.',
                        images: [],
                        tips: ['Negocie transfer do aeroporto antes de chegar'],
                        type: 'rest',
                        icon: '🏨',
                    },
                    {
                        id: 'bl-d1-2',
                        time: '17:00',
                        duration: '2h',
                        title: 'Tegallalang Rice Terraces',
                        location: 'Tegallalang, Ubud',
                        description: 'Terraços de arroz mais famosos de Bali.',
                        images: [],
                        tips: [],
                        type: 'activity',
                        icon: '🌾',
                    },
                    {
                        id: 'bl-d1-3',
                        time: '19:30',
                        duration: '1h30',
                        title: 'Jantar em Warung Local',
                        location: 'Ubud center',
                        description: 'Nasi goreng e mie goreng autênticos.',
                        images: [],
                        tips: ['Peça o nasi campur — prato misto tradicional'],
                        type: 'meal',
                        icon: '🍛',
                    },
                ],
            },
            {
                dayNumber: 2,
                date: '2026-05-02',
                title: 'Templos & Cachoeiras',
                summary: 'Dia de espiritualidade e natureza impressionante.',
                activities: [
                    {
                        id: 'bl-d2-1',
                        time: '07:00',
                        duration: '2h',
                        title: 'Tirta Empul (Templo de Água)',
                        location: 'Tampaksiring, Bali',
                        description: 'Ritual de purificação nas fontes sagradas.',
                        images: [],
                        tips: ['Use sarong — obrigatório no templo'],
                        type: 'activity',
                        icon: '🛕',
                    },
                    {
                        id: 'bl-d2-2',
                        time: '10:00',
                        duration: '1h30',
                        title: 'Tegenungan Waterfall',
                        location: 'Gianyar, Bali',
                        description: 'Cachoeira acessível perto de Ubud.',
                        images: [],
                        tips: [],
                        type: 'activity',
                        icon: '💧',
                    },
                    {
                        id: 'bl-d2-3',
                        time: '14:00',
                        duration: '2h',
                        title: 'Monkey Forest Ubud',
                        location: 'Ubud, Bali',
                        description: 'Santuário natural com macacos e templos.',
                        images: [],
                        tips: ['Guarde celular e óculos — macacos roubam!'],
                        type: 'activity',
                        icon: '🐒',
                    },
                ],
            },
            {
                dayNumber: 3,
                date: '2026-05-03',
                title: 'Praias do Sul',
                summary: 'Transfer para região de praias, surf e sunset bar.',
                activities: [
                    {
                        id: 'bl-d3-1',
                        time: '09:00',
                        duration: '2h',
                        title: 'Transfer para Seminyak',
                        location: 'Ubud → Seminyak',
                        description: 'Região de praias e vida noturna.',
                        images: [],
                        tips: [],
                        type: 'transport',
                        icon: '🚗',
                    },
                    {
                        id: 'bl-d3-2',
                        time: '12:00',
                        duration: '3h',
                        title: 'Praia de Kuta',
                        location: 'Kuta, Bali',
                        description: 'Surf e pôr do sol espetacular.',
                        images: [],
                        tips: [],
                        type: 'activity',
                        icon: '🏄',
                    },
                    {
                        id: 'bl-d3-3',
                        time: '18:00',
                        duration: '2h',
                        title: 'Sunset no Rock Bar (Ayana)',
                        location: 'Ayana Resort, Jimbaran',
                        description: 'Bar sobre as rochas com vista para o oceano.',
                        images: [],
                        tips: ['Reserve com antecedência — lota rápido'],
                        type: 'meal',
                        icon: '🌅',
                    },
                ],
            },
        ],
        emergencyContacts: [
            { type: 'Embaixada do Brasil', name: 'Consulado em Bali', phone: '+62-361-123456', available: 'Seg-Sex 9h-16h' },
        ],
        checklist: [
            { id: 'bl-doc-1', category: 'documents', text: 'Passaporte válido (mín 6 meses)', completed: true },
            { id: 'bl-doc-2', category: 'documents', text: 'Visa on Arrival (Indonésia)', completed: false },
            { id: 'bl-doc-3', category: 'documents', text: 'Seguro viagem com cobertura médica', completed: false },
            { id: 'bl-pack-1', category: 'packing', text: 'Protetor solar forte (SPF 50+)', completed: false },
            { id: 'bl-pack-2', category: 'packing', text: 'Repelente tropical', completed: false },
            { id: 'bl-pack-3', category: 'packing', text: 'Sarong / lenço para templos', completed: false },
            { id: 'bl-pack-4', category: 'packing', text: 'Roupas leves e sandálias', completed: false },
            { id: 'bl-pre-1', category: 'pre-trip', text: 'Reservar scooter em Bali', completed: false },
            { id: 'bl-pre-2', category: 'pre-trip', text: 'Comprar chip local (Telkomsel)', completed: false },
        ],
        importantInfo: [
            '🔌 Voltagem: 230V — Leve adaptador tipo C',
            '💵 Moeda: Rúpia Indonésia (IDR) — R$1 ≈ 3.000 IDR',
            '🕐 Fuso horário: GMT+8 (11h a mais que Brasília)',
            '🗣️ Idioma: Bahasa Indonesia — Inglês funciona em áreas turísticas',
            '📱 Internet: Chip Telkomsel disponível no aeroporto',
        ],
        spendingProfiles: [
            {
                id: 'economico',
                label: 'Econômico',
                icon: '🌴',
                dailyCost: 120,
                breakdown: [
                    { category: 'Hospedagem', amount: 40 },
                    { category: 'Alimentação', amount: 30 },
                    { category: 'Transporte', amount: 20 },
                    { category: 'Atrações', amount: 20 },
                    { category: 'Extras', amount: 10 },
                ],
            },
            {
                id: 'conforto',
                label: 'Conforto',
                icon: '🏖️',
                dailyCost: 300,
                breakdown: [
                    { category: 'Hospedagem', amount: 130 },
                    { category: 'Alimentação', amount: 70 },
                    { category: 'Transporte', amount: 40 },
                    { category: 'Atrações', amount: 40 },
                    { category: 'Extras', amount: 20 },
                ],
            },
            {
                id: 'luxo',
                label: 'Luxo',
                icon: '✨',
                dailyCost: 700,
                breakdown: [
                    { category: 'Hospedagem', amount: 400 },
                    { category: 'Alimentação', amount: 120 },
                    { category: 'Transporte', amount: 60 },
                    { category: 'Atrações', amount: 80 },
                    { category: 'Extras', amount: 40 },
                ],
            },
        ],
        transport: {
            mainMode: 'Scooter + Grab',
            description: 'Em Bali, scooter é o principal meio de transporte. Grab e Gojek são apps seguros e baratos para corridas.',
            passes: [
                { name: 'Aluguel Scooter', price: 'R$ 25/dia', description: 'Scooter automática 110cc com capacete.' },
                { name: 'Driver Particular (dia)', price: 'R$ 150/dia', description: 'Motorista + carro com AC o dia inteiro.' },
            ],
            tips: [
                'Sempre negocie preço antes de subir.',
                'Grab é mais barato que táxi convencional.',
                'Carteira de motorista internacional é exigida para scooter.',
            ],
        },
        accommodationOptions: [
            {
                id: 'bl-acc-1',
                name: 'Puri Garden Hostel',
                tier: 'economico',
                tierLabel: '🌴 Econômico',
                priceRange: 'R$ 40-70/noite',
                location: 'Ubud, Bali',
                description: 'Hostel com piscina e café da manhã incluso.',
                rating: 4.4,
            },
            {
                id: 'bl-acc-2',
                name: 'The Udaya Resort & Spa',
                tier: 'medio',
                tierLabel: '🏖️ Conforto',
                priceRange: 'R$ 300-500/noite',
                location: 'Ubud, Bali',
                description: 'Resort com vista para arrozais e spa balinês.',
                rating: 4.7,
            },
            {
                id: 'bl-acc-3',
                name: 'Four Seasons Sayan',
                tier: 'luxo',
                tierLabel: '✨ Luxo',
                priceRange: 'R$ 2.500-4.000/noite',
                location: 'Sayan, Ubud',
                description: 'Resort de luxo no vale do rio Ayung.',
                rating: 4.9,
            },
        ],
        receiveList: [
            { icon: '📋', label: 'Itinerário completo dia a dia' },
            { icon: '🏨', label: 'Hospedagens recomendadas por faixa' },
            { icon: '🗺️', label: 'Mapa com pontos marcados' },
            { icon: '🛵', label: 'Guia de transporte local' },
            { icon: '💡', label: 'Dicas exclusivas do criador' },
            { icon: '🍜', label: 'Restaurantes selecionados' },
            { icon: '💰', label: 'Estimativa de gastos interativa' },
            { icon: '✅', label: 'Checklist de planejamento' },
        ],
    },
];

export const getPurchasedItineraryById = (id: string): PurchasedItinerary | undefined => {
    return mockPurchasedItineraries.find(i => i.id === id);
};

export const getAllPurchasedItineraries = (): PurchasedItinerary[] => {
    return mockPurchasedItineraries;
};

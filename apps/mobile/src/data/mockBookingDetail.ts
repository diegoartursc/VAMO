/**
 * Rich booking detail data for the Trip Central (Central da Viagem) screen.
 * Provides all information needed for success confirmation + trip dashboard.
 */

// ─── Types ──────────────────────────────────────────────

export type TimelineStepStatus = 'completed' | 'in_progress' | 'pending';

export interface TimelineStep {
    id: string;
    title: string;
    description: string;
    status: TimelineStepStatus;
    icon: string; // Ionicons name
    completedDate?: string;
}

export interface TripDocument {
    id: string;
    title: string;
    description: string;
    icon: string; // Ionicons name
    type: 'voucher' | 'ticket' | 'policy' | 'info';
    available: boolean;
}

export interface TripInclusion {
    id: string;
    icon: string;
    label: string;
    detail: string;
}

export interface PreparationItem {
    id: string;
    icon: string;
    title: string;
    items: string[];
}

export interface ItineraryActivity {
    id: string;
    time: string;
    title: string;
    description: string;
    icon?: string;
    location?: string;
    tips?: string;
    isHighlight?: boolean;
}

export interface ItineraryDay {
    day: number;
    title: string;
    date?: string; // Optional, calculated dynamically usually
    activities: ItineraryActivity[];
}

export type UploadStatus = 'pending' | 'uploading' | 'reviewing' | 'approved' | 'rejected';

export interface RequiredDocItem {
    id: string;
    name: string;      // Ex: "Passaporte", "Visto Americano"
    description: string;
    required: boolean;
}

export interface BookingDetail {
    id: string;
    packageId: string;
    bookingCode: string;
    title: string;
    destination: string;
    country: string;
    image: string;
    travelDate: string;
    travelEndDate: string;
    status: 'confirmed' | 'pending_payment' | 'cancelled';
    agencyName: string;
    agencyLogo: string;
    price: number;
    currency: string;
    travelers: {
        adults: number;
        children: number;
    };
    paymentMethod: string;
    contactName: string;
    contactEmail: string;
    checkedBags: number;
    timeline: TimelineStep[];
    documents: TripDocument[];
    inclusions: TripInclusion[];
    preparation: PreparationItem[];
    detailedItinerary?: ItineraryDay[];
    /** Documents the agency requires the traveler to upload */
    requiredDocuments?: RequiredDocItem[];
}

// ─── Helpers ────────────────────────────────────────────

export function getDaysUntilTrip(dateString: string): number {
    const now = new Date();
    const target = new Date(dateString);
    const diff = target.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function isPostTrip(endDateString: string): boolean {
    return new Date(endDateString) < new Date();
}

export function formatTripDates(start: string, end: string): string {
    const s = new Date(start);
    const e = new Date(end);
    const opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short' };
    return `${s.toLocaleDateString('pt-BR', opts)} – ${e.toLocaleDateString('pt-BR', { ...opts, year: 'numeric' })}`;
}

export function formatFullDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });
}

// ─── Mock Data ──────────────────────────────────────────

export const mockBookings: BookingDetail[] = [
    {
        id: 'pkg-1',
        packageId: '1',
        bookingCode: 'VAMO-2026-PAR-7842',
        title: 'Paris Romântica',
        destination: 'Paris',
        country: 'França',
        image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1600',
        travelDate: '2026-03-15',
        travelEndDate: '2026-03-22',
        status: 'confirmed',
        agencyName: 'CVC',
        agencyLogo: '🏖️',
        price: 8500,
        currency: 'BRL',
        travelers: { adults: 2, children: 0 },
        paymentMethod: 'Cartão de crédito •••• 4532',
        contactName: 'Diego Artur',
        contactEmail: 'diego@email.com',
        checkedBags: 2,
        timeline: [
            {
                id: 'tl-1',
                title: 'Pagamento confirmado',
                description: 'Transação recebida com sucesso',
                status: 'completed',
                icon: 'checkmark-circle',
                completedDate: '2026-02-14',
            },
            {
                id: 'tl-2',
                title: 'Envio de Documentos',
                description: 'Aguardando seus passaportes/RG para emissão',
                status: 'in_progress',
                icon: 'id-card',
            },
            {
                id: 'tl-3',
                title: 'Emissão de Passagens e Hotel',
                description: 'Agência reservando e emitindo bilhetes',
                status: 'pending',
                icon: 'airplane',
            },
            {
                id: 'tl-4',
                title: 'Viagem Liberada',
                description: 'Todos os vouchers disponíveis na Central',
                status: 'pending',
                icon: 'bag-check',
            },
        ],
        documents: [
            {
                id: 'doc-1',
                title: 'Voucher',
                description: 'Voucher de confirmação da reserva',
                icon: 'document-text',
                type: 'voucher',
                available: true,
            },
            {
                id: 'doc-2',
                title: 'Bilhetes Aéreos',
                description: 'E-tickets do voo',
                icon: 'airplane',
                type: 'ticket',
                available: false,
            },
            {
                id: 'doc-3',
                title: 'Política de Cancelamento',
                description: 'Termos e condições',
                icon: 'shield-checkmark',
                type: 'policy',
                available: true,
            },
            {
                id: 'doc-4',
                title: 'Informações Importantes',
                description: 'Detalhes sobre a viagem',
                icon: 'information-circle',
                type: 'info',
                available: true,
            },
        ],
        inclusions: [
            { id: 'inc-1', icon: '✈️', label: 'Voo ida e volta', detail: 'São Paulo (GRU) → Paris (CDG)' },
            { id: 'inc-2', icon: '🏨', label: 'Hotel 4 estrelas', detail: 'Hôtel Le Marais — 7 noites' },
            { id: 'inc-3', icon: '🍽️', label: 'Café da manhã', detail: 'Incluso diariamente' },
            { id: 'inc-4', icon: '🚐', label: 'Transfer', detail: 'Aeroporto ↔ Hotel' },
            { id: 'inc-5', icon: '🗣️', label: 'Guia local', detail: 'Guia bilíngue nos passeios' },
        ],
        preparation: [
            {
                id: 'prep-1',
                icon: '📄',
                title: 'Documentos necessários',
                items: [
                    'Passaporte válido (6+ meses)',
                    'Seguro viagem obrigatório',
                    'Comprovante de vacinação COVID',
                    'Reserva de hotel impressa',
                ],
            },
            {
                id: 'prep-2',
                icon: '🌤️',
                title: 'Clima na época',
                items: [
                    'Temperatura: 5°C a 13°C',
                    'Possibilidade de chuva leve',
                    'Leve casacos e roupas em camadas',
                ],
            },
            {
                id: 'prep-3',
                icon: '💶',
                title: 'Moeda local',
                items: [
                    'Euro (EUR)',
                    'Cotação aproximada: R$ 6,20',
                    'Cartões aceitos na maioria dos locais',
                ],
            },
            {
                id: 'prep-4',
                icon: '💡',
                title: 'Dicas importantes',
                items: [
                    'Adaptador de tomada tipo C/E',
                    'Metrô é o melhor transporte',
                    'Gorjetas não são obrigatórias',
                    'Leve calçados confortáveis',
                ],
            },
        ],
        detailedItinerary: [
            {
                day: 1,
                title: 'Chegada em Paris e Primeiras Impressões',
                activities: [
                    {
                        id: 'd1-a1',
                        time: '14:00',
                        title: 'Check-in no Hotel',
                        description: 'Chegada ao Hôtel Le Marais e acomodação.',
                        icon: 'bed',
                        location: 'Hôtel Le Marais, 4e Arrondissement',
                    },
                    {
                        id: 'd1-a2',
                        time: '16:30',
                        title: 'Caminhada pelo Rio Sena',
                        description: 'Passeio relaxante pelas margens do Sena para entrar no clima parisiense.',
                        icon: 'walk',
                        isHighlight: true,
                    },
                    {
                        id: 'd1-a3',
                        time: '19:30',
                        title: 'Jantar de Boas-vindas',
                        description: 'Jantar em bistrô tradicional no Marais.',
                        icon: 'restaurant',
                        tips: 'Experimente o Boeuf Bourguignon.',
                    },
                ],
            },
            {
                day: 2,
                title: 'A Dama de Ferro e Arte Moderna',
                activities: [
                    {
                        id: 'd2-a1',
                        time: '09:00',
                        title: 'Torre Eiffel',
                        description: 'Subida ao topo da Torre Eiffel com acesso prioritário.',
                        icon: 'flag',
                        location: 'Champ de Mars, 5 Avenue Anatole France',
                        tips: 'Chegue 15 min antes do horário agendado.',
                        isHighlight: true,
                    },
                    {
                        id: 'd2-a2',
                        time: '12:00',
                        title: 'Almoço no Trocadéro',
                        description: 'Vista panorâmica da torre durante o almoço.',
                        icon: 'restaurant',
                    },
                    {
                        id: 'd2-a3',
                        time: '14:30',
                        title: 'Museu de Arte Moderna',
                        description: 'Visita guiada ao Palais de Tokyo.',
                        icon: 'color-palette',
                    },
                ],
            },
            {
                day: 3,
                title: 'O Coração Histórico: Louvre e Notre-Dame',
                activities: [
                    {
                        id: 'd3-a1',
                        time: '09:30',
                        title: 'Museu do Louvre',
                        description: 'Excursão guiada para ver a Mona Lisa e a Vênus de Milo.',
                        icon: 'easel',
                        location: 'Museu do Louvre',
                        tips: 'Mochilas grandes não são permitidas.',
                        isHighlight: true,
                    },
                    {
                        id: 'd3-a2',
                        time: '13:00',
                        title: 'Almoço no Jardin des Tuileries',
                        description: 'Piquenique ou quiosques no jardim.',
                        icon: 'nutrition',
                    },
                    {
                        id: 'd3-a3',
                        time: '15:00',
                        title: 'Catedral de Notre-Dame (Exterior) e Île de la Cité',
                        description: 'Caminhada pelo centro histórico e Sainte-Chapelle.',
                        icon: 'camera',
                    },
                ],
            },
            {
                day: 4,
                title: 'Versalhes: A Grandeza Real',
                activities: [
                    {
                        id: 'd4-a1',
                        time: '08:00',
                        title: 'Saída para Versalhes',
                        description: 'Transfer de ônibus privativo partindo do hotel.',
                        icon: 'bus',
                    },
                    {
                        id: 'd4-a2',
                        time: '10:00',
                        title: 'Palácio de Versalhes',
                        description: 'Visita aos Aposentos Reais e Galeria dos Espelhos.',
                        icon: 'key',
                        isHighlight: true,
                    },
                    {
                        id: 'd4-a3',
                        time: '12:30',
                        title: 'Jardins de Versalhes',
                        description: 'Tempo livre para explorar os jardins.',
                        icon: 'leaf',
                    },
                ],
            },
            {
                day: 5,
                title: 'Montmartre e o Sagrado Coração',
                activities: [
                    {
                        id: 'd5-a1',
                        time: '10:00',
                        title: 'Basílica de Sacré-Cœur',
                        description: 'Vista panorâmica de Paris.',
                        icon: 'eye',
                        location: 'Butte Montmartre',
                    },
                    {
                        id: 'd5-a2',
                        time: '11:30',
                        title: 'Place du Tertre',
                        description: 'Praça dos artistas e pintores.',
                        icon: 'brush',
                    },
                    {
                        id: 'd5-a3',
                        time: '20:00',
                        title: 'Show no Moulin Rouge',
                        description: 'Espetáculo opcional (necessita reserva prévia).',
                        icon: 'musical-notes',
                        tips: 'Traje esporte fino obrigatório.',
                    },
                ],
            },
            {
                day: 6,
                title: 'Compras e Champs-Élysées',
                activities: [
                    {
                        id: 'd6-a1',
                        time: '10:00',
                        title: 'Arco do Triunfo',
                        description: 'Visita ao monumento e terraço.',
                        icon: 'ribbon',
                    },
                    {
                        id: 'd6-a2',
                        time: '13:00',
                        title: 'Almoço na Champs-Élysées',
                        description: 'Tempo livre para almoço e compras.',
                        icon: 'bag',
                    },
                    {
                        id: 'd6-a3',
                        time: '16:00',
                        title: 'Galeries Lafayette',
                        description: 'Visita à famosa loja de departamentos e seu domo.',
                        icon: 'gift',
                    },
                ],
            },
            {
                day: 7,
                title: 'Despedida de Paris',
                activities: [
                    {
                        id: 'd7-a1',
                        time: '09:00',
                        title: 'Café da manhã de despedida',
                        description: 'Último croissant em café parisiense.',
                        icon: 'cafe',
                    },
                    {
                        id: 'd7-a2',
                        time: '11:00',
                        title: 'Check-out',
                        description: 'Saída do hotel e preparação para o transfer.',
                        icon: 'exit',
                    },
                    {
                        id: 'd7-a3',
                        time: '14:00',
                        title: 'Transfer para Aeroporto',
                        description: 'Partida rumo ao Aeroporto Charles de Gaulle (CDG).',
                        icon: 'airplane',
                    },
                ],
            },
        ],
        requiredDocuments: [
            { id: 'req-1', name: 'Passaporte', description: 'Foto da página de dados (válido +6 meses)', required: true },
            { id: 'req-2', name: 'Seguro Viagem', description: 'Apólice cobrindo o período da viagem', required: true },
            { id: 'req-3', name: 'Vacina Febre Amarela', description: 'Comprovante de vacinação (se aplicável)', required: false },
        ],
    },
    {
        id: 'pkg-2',
        packageId: '2',
        bookingCode: 'VAMO-2026-CAN-3195',
        title: 'Caribe All Inclusive',
        destination: 'Cancún',
        country: 'México',
        image: 'https://images.unsplash.com/photo-1568402102990-bc541580b59f?w=1600',
        travelDate: '2026-07-10',
        travelEndDate: '2026-07-17',
        status: 'confirmed',
        agencyName: 'Decolar',
        agencyLogo: '✈️',
        price: 6500,
        currency: 'BRL',
        travelers: { adults: 2, children: 1 },
        paymentMethod: 'PIX',
        contactName: 'Diego Artur',
        contactEmail: 'diego@email.com',
        checkedBags: 1,
        timeline: [
            {
                id: 'tl-1',
                title: 'Pagamento confirmado',
                description: 'Pagamento via PIX confirmado',
                status: 'completed',
                icon: 'checkmark-circle',
                completedDate: '2026-02-10',
            },
            {
                id: 'tl-2',
                title: 'Emissão das passagens',
                description: 'Bilhetes serão emitidos 30 dias antes',
                status: 'pending',
                icon: 'airplane',
            },
            {
                id: 'tl-3',
                title: 'Voucher do hotel',
                description: 'Confirmação do resort',
                status: 'pending',
                icon: 'bed',
            },
            {
                id: 'tl-4',
                title: 'Check-in disponível',
                description: 'Disponível 48h antes do embarque',
                status: 'pending',
                icon: 'log-in',
            },
        ],
        documents: [
            { id: 'doc-1', title: 'Voucher', description: 'Voucher de confirmação', icon: 'document-text', type: 'voucher', available: true },
            { id: 'doc-2', title: 'Bilhetes Aéreos', description: 'E-tickets', icon: 'airplane', type: 'ticket', available: false },
            { id: 'doc-3', title: 'Política de Cancelamento', description: 'Termos', icon: 'shield-checkmark', type: 'policy', available: true },
            { id: 'doc-4', title: 'Informações Importantes', description: 'Detalhes', icon: 'information-circle', type: 'info', available: true },
        ],
        inclusions: [
            { id: 'inc-1', icon: '✈️', label: 'Voo ida e volta', detail: 'São Paulo (GRU) → Cancún (CUN)' },
            { id: 'inc-2', icon: '🏨', label: 'Resort 5 estrelas', detail: 'All Inclusive — 7 noites' },
            { id: 'inc-3', icon: '🍽️', label: 'All Inclusive', detail: 'Todas as refeições e drinks' },
            { id: 'inc-4', icon: '🚐', label: 'Transfer', detail: 'Aeroporto ↔ Resort' },
        ],
        preparation: [
            {
                id: 'prep-1', icon: '📄', title: 'Documentos necessários',
                items: ['Passaporte válido', 'Seguro viagem', 'Formulário migratório México'],
            },
            {
                id: 'prep-2', icon: '🌤️', title: 'Clima na época',
                items: ['Temperatura: 28°C a 35°C', 'Época de chuvas rápidas', 'Protetor solar fator 50+'],
            },
            {
                id: 'prep-3', icon: '💶', title: 'Moeda local',
                items: ['Peso Mexicano (MXN)', 'Dólar aceito em zonas turísticas', 'Gorjetas em pesos'],
            },
            {
                id: 'prep-4', icon: '💡', title: 'Dicas importantes',
                items: ['Não beba água da torneira', 'Resort tem tudo incluso', 'Excursões opcionais no local'],
            },
        ],
        requiredDocuments: [
            { id: 'req-1', name: 'Passaporte', description: 'Foto da página de dados (válido)', required: true },
            { id: 'req-2', name: 'Seguro Viagem', description: 'Apólice com cobertura internacional', required: true },
            { id: 'req-3', name: 'Formulário Migratório México', description: 'Preenchido online antes do embarque', required: true },
        ],
    },
    {
        id: 'pkg-3',
        packageId: '3',
        bookingCode: 'VAMO-2026-MAL-5021',
        title: 'Maldivas Luxo',
        destination: 'Malé',
        country: 'Maldivas',
        image: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1600',
        travelDate: '2026-12-20',
        travelEndDate: '2026-12-30',
        status: 'pending_payment',
        agencyName: 'Hurb',
        agencyLogo: '🌴',
        price: 22000,
        currency: 'BRL',
        travelers: { adults: 2, children: 0 },
        paymentMethod: 'Cartão — parcela 1/12',
        contactName: 'Diego Artur',
        contactEmail: 'diego@email.com',
        checkedBags: 0,
        timeline: [
            {
                id: 'tl-1',
                title: 'Pagamento confirmado',
                description: 'Aguardando confirmação da 1ª parcela',
                status: 'in_progress',
                icon: 'checkmark-circle',
            },
            { id: 'tl-2', title: 'Emissão das passagens', description: 'Aguardando pagamento', status: 'pending', icon: 'airplane' },
            { id: 'tl-3', title: 'Voucher do hotel', description: 'Aguardando pagamento', status: 'pending', icon: 'bed' },
            { id: 'tl-4', title: 'Check-in disponível', description: 'Aguardando pagamento', status: 'pending', icon: 'log-in' },
        ],
        documents: [
            { id: 'doc-1', title: 'Voucher', description: 'Disponível após pagamento', icon: 'document-text', type: 'voucher', available: false },
            { id: 'doc-2', title: 'Bilhetes Aéreos', description: 'Disponível após pagamento', icon: 'airplane', type: 'ticket', available: false },
            { id: 'doc-3', title: 'Política de Cancelamento', description: 'Termos', icon: 'shield-checkmark', type: 'policy', available: true },
            { id: 'doc-4', title: 'Informações Importantes', description: 'Detalhes', icon: 'information-circle', type: 'info', available: true },
        ],
        inclusions: [
            { id: 'inc-1', icon: '✈️', label: 'Voo ida e volta', detail: 'São Paulo → Malé (com escala)' },
            { id: 'inc-2', icon: '🏨', label: 'Villa sobre água', detail: 'Overwater Bungalow — 10 noites' },
            { id: 'inc-3', icon: '🍽️', label: 'Meia-pensão', detail: 'Café da manhã e jantar' },
            { id: 'inc-4', icon: '🚤', label: 'Speedboat', detail: 'Transfer Malé ↔ Resort' },
            { id: 'inc-5', icon: '🤿', label: 'Snorkeling', detail: '2 excursões inclusas' },
        ],
        preparation: [
            {
                id: 'prep-1', icon: '📄', title: 'Documentos necessários',
                items: ['Passaporte válido (6+ meses)', 'Seguro viagem obrigatório', 'Visto não é necessário para brasileiros (até 30 dias)'],
            },
            {
                id: 'prep-2', icon: '🌤️', title: 'Clima na época',
                items: ['Temperatura: 26°C a 31°C', 'Dezembro: estação seca', 'Ideal para mergulho'],
            },
            {
                id: 'prep-3', icon: '💶', title: 'Moeda local',
                items: ['Rufiyaa maldiviana (MVR)', 'Dólar aceito no resort', 'Tudo no resort é em dólar'],
            },
            {
                id: 'prep-4', icon: '💡', title: 'Dicas importantes',
                items: ['Leve roupas leves e protetor solar', 'Álcool só dentro do resort', 'Wi-Fi pode ser limitado', 'Leve dinheiro para gorjetas'],
            },
        ],
    },
    // Past trips (for post-trip section testing)
    {
        id: 'pkg-past-1',
        packageId: 'past-1',
        bookingCode: 'VAMO-2025-ROM-1234',
        title: 'Toscana & Amalfi',
        destination: 'Roma',
        country: 'Itália',
        image: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=1600',
        travelDate: '2025-09-05',
        travelEndDate: '2025-09-15',
        status: 'confirmed',
        agencyName: 'CVC',
        agencyLogo: '🏖️',
        price: 12000,
        currency: 'BRL',
        travelers: { adults: 2, children: 0 },
        paymentMethod: 'Cartão de crédito •••• 8821',
        contactName: 'Diego Artur',
        contactEmail: 'diego@email.com',
        checkedBags: 2,
        timeline: [
            { id: 'tl-1', title: 'Pagamento confirmado', description: 'Concluído', status: 'completed', icon: 'checkmark-circle', completedDate: '2025-07-01' },
            { id: 'tl-2', title: 'Emissão das passagens', description: 'Concluído', status: 'completed', icon: 'airplane', completedDate: '2025-08-05' },
            { id: 'tl-3', title: 'Voucher do hotel', description: 'Concluído', status: 'completed', icon: 'bed', completedDate: '2025-08-20' },
            { id: 'tl-4', title: 'Check-in disponível', description: 'Concluído', status: 'completed', icon: 'log-in', completedDate: '2025-09-03' },
        ],
        documents: [
            { id: 'doc-1', title: 'Voucher', description: 'Voucher da viagem', icon: 'document-text', type: 'voucher', available: true },
            { id: 'doc-2', title: 'Bilhetes Aéreos', description: 'E-tickets', icon: 'airplane', type: 'ticket', available: true },
            { id: 'doc-3', title: 'Política de Cancelamento', description: 'Termos', icon: 'shield-checkmark', type: 'policy', available: true },
            { id: 'doc-4', title: 'Informações Importantes', description: 'Detalhes', icon: 'information-circle', type: 'info', available: true },
        ],
        inclusions: [
            { id: 'inc-1', icon: '✈️', label: 'Voo ida e volta', detail: 'São Paulo (GRU) → Roma (FCO)' },
            { id: 'inc-2', icon: '🏨', label: 'Hotel 4 estrelas', detail: 'Roma + Costa Amalfitana — 10 noites' },
            { id: 'inc-3', icon: '🍽️', label: 'Café da manhã', detail: 'Incluso diariamente' },
            { id: 'inc-4', icon: '🚐', label: 'Transfer', detail: 'Todos os transfers inclusos' },
            { id: 'inc-5', icon: '🗣️', label: 'Guia', detail: 'Guia em português nos passeios' },
        ],
        preparation: [
            { id: 'prep-1', icon: '📄', title: 'Documentos necessários', items: ['Passaporte válido', 'Seguro viagem'] },
            { id: 'prep-2', icon: '🌤️', title: 'Clima na época', items: ['Temperatura: 20°C a 28°C', 'Ensolarado'] },
            { id: 'prep-3', icon: '💶', title: 'Moeda local', items: ['Euro (EUR)'] },
            { id: 'prep-4', icon: '💡', title: 'Dicas importantes', items: ['Calçados confortáveis', 'Protetor solar'] },
        ],
    },
    // ─── Dubai Luxo e Tradição (Aguardando Pagamento) ────
    {
        id: 'pkg-7',
        packageId: '7',
        bookingCode: 'VAMO-2026-DXB-3901',
        title: 'Dubai Luxo e Tradição',
        destination: 'Dubai',
        country: 'Emirados Árabes',
        image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1600',
        travelDate: '2026-12-20',
        travelEndDate: '2026-12-27',
        status: 'pending_payment',
        agencyName: 'Hurb',
        agencyLogo: '🌴',
        price: 10000,
        currency: 'BRL',
        travelers: { adults: 2, children: 0 },
        paymentMethod: '',
        contactName: 'Diego Artur',
        contactEmail: 'diego@email.com',
        checkedBags: 2,
        timeline: [
            { id: 'tl-1', title: 'Solicitação enviada', description: 'Pedido recebido pela agência', status: 'completed', icon: 'checkmark-circle', completedDate: '2026-03-10' },
            { id: 'tl-2', title: 'Cotação aérea', description: 'Agência cotou os voos', status: 'completed', icon: 'airplane', completedDate: '2026-03-15' },
            { id: 'tl-3', title: 'Aguardando pagamento', description: 'Proposta pronta — efetue o pagamento', status: 'in_progress', icon: 'card' },
            { id: 'tl-4', title: 'Confirmação', description: 'Viagem confirmada após pagamento', status: 'pending', icon: 'bag-check' },
        ],
        documents: [
            { id: 'doc-1', title: 'Voucher', description: 'Disponível após pagamento', icon: 'document-text', type: 'voucher', available: false },
            { id: 'doc-2', title: 'Bilhetes Aéreos', description: 'Disponível após pagamento', icon: 'airplane', type: 'ticket', available: false },
            { id: 'doc-3', title: 'Política de Cancelamento', description: 'Termos e condições', icon: 'shield-checkmark', type: 'policy', available: true },
            { id: 'doc-4', title: 'Informações Importantes', description: 'Detalhes sobre a viagem', icon: 'information-circle', type: 'info', available: true },
        ],
        inclusions: [
            { id: 'inc-1', icon: '✈️', label: 'Voo ida e volta', detail: 'São Paulo (GRU) → Dubai (DXB)' },
            { id: 'inc-2', icon: '🏨', label: 'Hotel 5 estrelas', detail: 'Atlantis The Palm — 7 noites' },
            { id: 'inc-3', icon: '🍽️', label: 'Café da manhã', detail: 'Incluso diariamente' },
            { id: 'inc-4', icon: '🚐', label: 'Transfer', detail: 'Aeroporto ↔ Hotel' },
            { id: 'inc-5', icon: '🏜️', label: 'Safari no deserto', detail: '1 dia com jantar beduíno' },
        ],
        preparation: [
            { id: 'prep-1', icon: '📄', title: 'Documentos necessários', items: ['Passaporte válido (6+ meses)', 'Seguro viagem'] },
            { id: 'prep-2', icon: '🌤️', title: 'Clima na época', items: ['Temperatura: 18°C a 26°C', 'Seco e ensolarado'] },
            { id: 'prep-3', icon: '💰', title: 'Moeda local', items: ['Dirham (AED)', 'Cotação aprox: R$ 1,40'] },
            { id: 'prep-4', icon: '💡', title: 'Dicas importantes', items: ['Roupas modestas em público', 'Álcool só em locais licenciados'] },
        ],
    },
    // ─── Cusco e Machu Picchu (Aguardando Pagamento) ─────
    {
        id: 'pkg-mock-quote2',
        packageId: 'mock-quote2',
        bookingCode: 'VAMO-2026-CUZ-5520',
        title: 'Cusco e Machu Picchu',
        destination: 'Cusco',
        country: 'Peru',
        image: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=1600',
        travelDate: '2026-10-15',
        travelEndDate: '2026-10-22',
        status: 'pending_payment',
        agencyName: 'VAMO Expeditions',
        agencyLogo: '🦙',
        price: 4500,
        currency: 'BRL',
        travelers: { adults: 1, children: 0 },
        paymentMethod: '',
        contactName: 'Diego Artur',
        contactEmail: 'diego@email.com',
        checkedBags: 0,
        timeline: [
            { id: 'tl-1', title: 'Solicitação enviada', description: 'Pedido recebido pela agência', status: 'completed', icon: 'checkmark-circle', completedDate: '2026-03-08' },
            { id: 'tl-2', title: 'Cotação aérea', description: 'Agência cotou os voos', status: 'completed', icon: 'airplane', completedDate: '2026-03-12' },
            { id: 'tl-3', title: 'Aguardando pagamento', description: 'Proposta pronta — efetue o pagamento', status: 'in_progress', icon: 'card' },
            { id: 'tl-4', title: 'Confirmação', description: 'Viagem confirmada após pagamento', status: 'pending', icon: 'bag-check' },
        ],
        documents: [
            { id: 'doc-1', title: 'Voucher', description: 'Disponível após pagamento', icon: 'document-text', type: 'voucher', available: false },
            { id: 'doc-2', title: 'Bilhetes Aéreos', description: 'Disponível após pagamento', icon: 'airplane', type: 'ticket', available: false },
            { id: 'doc-3', title: 'Política de Cancelamento', description: 'Termos e condições', icon: 'shield-checkmark', type: 'policy', available: true },
        ],
        inclusions: [
            { id: 'inc-1', icon: '✈️', label: 'Voo ida e volta', detail: 'Florianópolis (FLN) → Cusco (CUZ)' },
            { id: 'inc-2', icon: '🏨', label: 'Hotel 3 estrelas', detail: 'Hotel Cusco Plaza — 7 noites' },
            { id: 'inc-3', icon: '🚂', label: 'Trem para Machu Picchu', detail: 'PeruRail Vistadome ida e volta' },
            { id: 'inc-4', icon: '🗣️', label: 'Guia local', detail: 'Guia bilíngue nos passeios' },
        ],
        preparation: [
            { id: 'prep-1', icon: '📄', title: 'Documentos necessários', items: ['Passaporte válido ou RG', 'Seguro viagem'] },
            { id: 'prep-2', icon: '🌤️', title: 'Clima na época', items: ['Temperatura: 5°C a 18°C', 'Início da estação seca'] },
            { id: 'prep-3', icon: '💰', title: 'Moeda local', items: ['Sol Peruano (PEN)', 'Cotação aprox: R$ 1,50'] },
            { id: 'prep-4', icon: '💡', title: 'Dicas importantes', items: ['Aclimatação de altitude', 'Chá de coca contra o soroche'] },
        ],
    },
    // ─── Santorini Dream (Aguardando Cotação) ────────────
    {
        id: 'pkg-mock-quote1',
        packageId: 'mock-quote1',
        bookingCode: 'VAMO-2026-JTR-9981',
        title: 'Santorini Dream',
        destination: 'Santorini',
        country: 'Grécia',
        image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1600',
        travelDate: '2026-09-01',
        travelEndDate: '2026-09-10',
        status: 'pending_payment',
        agencyName: 'VAMO Global Travel',
        agencyLogo: '✈️',
        price: 9200,
        currency: 'BRL',
        travelers: { adults: 2, children: 0 },
        paymentMethod: '',
        contactName: 'Diego Artur',
        contactEmail: 'diego@email.com',
        checkedBags: 1,
        timeline: [
            { id: 'tl-1', title: 'Solicitação enviada', description: 'Pedido recebido pela agência', status: 'completed', icon: 'checkmark-circle', completedDate: '2026-03-05' },
            { id: 'tl-2', title: 'Buscando melhor voo', description: 'Agência cotando passagens de Florianópolis', status: 'in_progress', icon: 'search' },
            { id: 'tl-3', title: 'Proposta e pagamento', description: 'Aguardando cotação para envio', status: 'pending', icon: 'card' },
            { id: 'tl-4', title: 'Confirmação', description: 'Viagem confirmada após pagamento', status: 'pending', icon: 'bag-check' },
        ],
        documents: [
            { id: 'doc-1', title: 'Voucher', description: 'Disponível após confirmação', icon: 'document-text', type: 'voucher', available: false },
            { id: 'doc-2', title: 'Bilhetes Aéreos', description: 'Disponível após confirmação', icon: 'airplane', type: 'ticket', available: false },
        ],
        inclusions: [
            { id: 'inc-1', icon: '✈️', label: 'Voo ida e volta', detail: 'Florianópolis (FLN) → Santorini (JTR)' },
            { id: 'inc-2', icon: '🏨', label: 'Hotel boutique', detail: 'Cave hotel em Oia — 9 noites' },
            { id: 'inc-3', icon: '🍽️', label: 'Café da manhã', detail: 'Incluso diariamente' },
            { id: 'inc-4', icon: '⛵', label: 'Passeio de barco', detail: 'Sunset cruise pelo caldera' },
        ],
        preparation: [
            { id: 'prep-1', icon: '📄', title: 'Documentos necessários', items: ['Passaporte válido (6+ meses)', 'Seguro viagem obrigatório'] },
            { id: 'prep-2', icon: '🌤️', title: 'Clima na época', items: ['Temperatura: 22°C a 30°C', 'Ensolarado, seco'] },
            { id: 'prep-3', icon: '💶', title: 'Moeda local', items: ['Euro (EUR)', 'Cotação aprox: R$ 6,20'] },
            { id: 'prep-4', icon: '💡', title: 'Dicas importantes', items: ['Calçados confortáveis para escadarias', 'Protetor solar e chapéu'] },
        ],
    },
];

// ─── Getters ────────────────────────────────────────────

export function getBookingById(id: string): BookingDetail | undefined {
    return mockBookings.find(b => b.id === id);
}

export function getBookingByPackageId(packageId: string): BookingDetail | undefined {
    return mockBookings.find(b => b.packageId === packageId);
}

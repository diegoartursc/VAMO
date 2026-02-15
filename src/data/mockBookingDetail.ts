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
    timeline: TimelineStep[];
    documents: TripDocument[];
    inclusions: TripInclusion[];
    preparation: PreparationItem[];
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
        image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800',
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
        timeline: [
            {
                id: 'tl-1',
                title: 'Pagamento confirmado',
                description: 'Pagamento processado com sucesso',
                status: 'completed',
                icon: 'checkmark-circle',
                completedDate: '2026-02-14',
            },
            {
                id: 'tl-2',
                title: 'Emissão das passagens',
                description: 'Bilhetes aéreos em processamento',
                status: 'in_progress',
                icon: 'airplane',
            },
            {
                id: 'tl-3',
                title: 'Voucher do hotel',
                description: 'Confirmação da hospedagem',
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
    },
    {
        id: 'pkg-2',
        packageId: '2',
        bookingCode: 'VAMO-2026-CAN-3195',
        title: 'Caribe All Inclusive',
        destination: 'Cancún',
        country: 'México',
        image: 'https://images.unsplash.com/photo-1568402102990-bc541580b59f?w=800',
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
    },
    {
        id: 'pkg-3',
        packageId: '3',
        bookingCode: 'VAMO-2026-MAL-5021',
        title: 'Maldivas Luxo',
        destination: 'Malé',
        country: 'Maldivas',
        image: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800',
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
        image: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=800',
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
];

// ─── Getters ────────────────────────────────────────────

export function getBookingById(id: string): BookingDetail | undefined {
    return mockBookings.find(b => b.id === id);
}

export function getBookingByPackageId(packageId: string): BookingDetail | undefined {
    return mockBookings.find(b => b.packageId === packageId);
}

/**
 * Standard itinerary inclusion items displayed in cards and detail pages.
 * Each item has an icon (Ionicons name), background color, title and description.
 */

export interface ItineraryInclusion {
    id: string;
    icon: string;        // Ionicons name
    iconColor: string;
    bgColor: string;
    title: string;
    description: string;
}

export const ITINERARY_INCLUSIONS: ItineraryInclusion[] = [
    {
        id: 'daily',
        icon: 'calendar',
        iconColor: '#00BFA5',
        bgColor: '#E0F2F1',
        title: 'Diário de Viagem Detalhado',
        description: 'Programação completa dia a dia com horários, locais e dicas práticas para cada atividade',
    },
    {
        id: 'itinerary',
        icon: 'airplane',
        iconColor: '#2196F3',
        bgColor: '#E3F2FD',
        title: 'Itinerário Completo',
        description: 'Voos recomendados, horários, companhias aéreas e dicas para economizar',
    },
    {
        id: 'hotels',
        icon: 'bed',
        iconColor: '#FF9800',
        bgColor: '#FFF3E0',
        title: 'Hotéis & Hospedagens',
        description: 'Lista com os melhores lugares para se hospedar, faixa de preço e localização estratégica',
    },
    {
        id: 'attractions',
        icon: 'map',
        iconColor: '#9C27B0',
        bgColor: '#F3E5F5',
        title: 'Passeios & Atrações',
        description: 'Todas as atrações imperdíveis, preços de ingressos e como evitar filas',
    },
    {
        id: 'transport',
        icon: 'car',
        iconColor: '#4CAF50',
        bgColor: '#E8F5E9',
        title: 'Locomoção',
        description: 'Como se locomover na cidade: metrô, ônibus, táxi, apps e passes de transporte',
    },
    {
        id: 'tips',
        icon: 'bulb',
        iconColor: '#F9A825',
        bgColor: '#FFF9C4',
        title: 'Dicas Exclusivas',
        description: 'Truques de quem já foi: melhores horários, segredos locais e como economizar',
    },
    {
        id: 'food',
        icon: 'restaurant',
        iconColor: '#F44336',
        bgColor: '#FFEBEE',
        title: 'Restaurantes & Gastronomia',
        description: 'Onde comer bem, opções para todos os bolsos e pratos típicos que você não pode perder',
    },
    {
        id: 'checklist',
        icon: 'checkbox',
        iconColor: '#1B5E20',
        bgColor: '#E8F5E9',
        title: 'Checklist de Planejamento Interativo',
        description: 'Lista interativa com documentos, itens de mala e tarefas pré-viagem para você não esquecer nada',
    },
];

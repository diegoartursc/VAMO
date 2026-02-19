/**
 * Standard itinerary inclusion items displayed in cards and detail pages.
 * VAMO 2.0: Uses Lucide icon names with monochromatic Navy/Teal coloring.
 */

export interface ItineraryInclusion {
    id: string;
    icon: string;        // Lucide icon name (mapped via Icons.tsx)
    iconColor: string;
    bgColor: string;
    title: string;
    description: string;
}

export const ITINERARY_INCLUSIONS: ItineraryInclusion[] = [
    {
        id: 'daily',
        icon: 'calendar',
        iconColor: '#1A3263',
        bgColor: '#F0F4F8',
        title: 'Diário de Viagem Detalhado',
        description: 'Programação completa dia a dia com horários, locais e dicas práticas para cada atividade',
    },
    {
        id: 'itinerary',
        icon: 'plane',
        iconColor: '#28C9BF',
        bgColor: '#F0FAF9',
        title: 'Itinerário Completo',
        description: 'Voos recomendados, horários, companhias aéreas e dicas para economizar',
    },
    {
        id: 'hotels',
        icon: 'hotel',
        iconColor: '#1A3263',
        bgColor: '#F0F4F8',
        title: 'Hotéis & Hospedagens',
        description: 'Lista com os melhores lugares para se hospedar, faixa de preço e localização estratégica',
    },
    {
        id: 'attractions',
        icon: 'location',
        iconColor: '#28C9BF',
        bgColor: '#F0FAF9',
        title: 'Passeios & Atrações',
        description: 'Todas as atrações imperdíveis, preços de ingressos e como evitar filas',
    },
    {
        id: 'transport',
        icon: 'car',
        iconColor: '#1A3263',
        bgColor: '#F0F4F8',
        title: 'Locomoção',
        description: 'Como se locomover na cidade: metrô, ônibus, táxi, apps e passes de transporte',
    },
    {
        id: 'tips',
        icon: 'lightbulb',
        iconColor: '#28C9BF',
        bgColor: '#F0FAF9',
        title: 'Dicas Exclusivas',
        description: 'Truques de quem já foi: melhores horários, segredos locais e como economizar',
    },
    {
        id: 'food',
        icon: 'utensils',
        iconColor: '#1A3263',
        bgColor: '#F0F4F8',
        title: 'Restaurantes & Gastronomia',
        description: 'Onde comer bem, opções para todos os bolsos e pratos típicos que você não pode perder',
    },
    {
        id: 'checklist',
        icon: 'check-square',
        iconColor: '#28C9BF',
        bgColor: '#F0FAF9',
        title: 'Checklist de Planejamento Interativo',
        description: 'Lista interativa com documentos, itens de mala e tarefas pré-viagem para você não esquecer nada',
    },
];

import { Package } from '../types';

export interface Destination {
    id: string;
    name: string;
    country: string;
    emoji: string;
    popular: boolean;
}

export const POPULAR_DESTINATIONS: Destination[] = [
    { id: '1', name: 'Paris', country: 'França', emoji: '🗼', popular: true },
    { id: '2', name: 'Cancún', country: 'México', emoji: '🏖️', popular: true },
    { id: '3', name: 'Nova York', country: 'EUA', emoji: '🗽', popular: true },
    { id: '4', name: 'Roma', country: 'Itália', emoji: '🏛️', popular: true },
    { id: '5', name: 'Dubai', country: 'Emirados Árabes', emoji: '🏙️', popular: true },
    { id: '6', name: 'Fernando de Noronha', country: 'Brasil', emoji: '🐢', popular: true },
    { id: '7', name: 'Machu Picchu', country: 'Peru', emoji: '⛰️', popular: true },
    { id: '8', name: 'Cusco', country: 'Peru', emoji: '🦙', popular: false },
    { id: '9', name: 'Barcelona', country: 'Espanha', emoji: '⚽', popular: true },
    { id: '10', name: 'Londres', country: 'Reino Unido', emoji: '🎡', popular: true },
    { id: '11', name: 'Amsterdam', country: 'Holanda', emoji: '🌷', popular: false },
    { id: '12', name: 'Tóquio', country: 'Japão', emoji: '🗾', popular: true },
    { id: '13', name: 'Maldivas', country: 'Maldivas', emoji: '🏝️', popular: true },
    { id: '14', name: 'Santorini', country: 'Grécia', emoji: '🏘️', popular: true },
    { id: '15', name: 'El Calafate', country: 'Argentina', emoji: '🧊', popular: false },
    { id: '16', name: 'Rio de Janeiro', country: 'Brasil', emoji: '🏖️', popular: true },
    { id: '17', name: 'Salvador', country: 'Brasil', emoji: '🥁', popular: false },
    { id: '18', name: 'Gramado', country: 'Brasil', emoji: '🍫', popular: true },
    { id: '19', name: 'Florianópolis', country: 'Brasil', emoji: '🏄', popular: false },
    { id: '20', name: 'Jericoacoara', country: 'Brasil', emoji: '🌅', popular: true },
];

export function searchDestinations(query: string): Destination[] {
    if (!query.trim()) {
        return POPULAR_DESTINATIONS.filter(d => d.popular).slice(0, 6);
    }

    const lowerQuery = query.toLowerCase();
    return POPULAR_DESTINATIONS.filter(d =>
        d.name.toLowerCase().includes(lowerQuery) ||
        d.country.toLowerCase().includes(lowerQuery)
    ).slice(0, 8);
}

export function getPopularDestinations(): Destination[] {
    return POPULAR_DESTINATIONS.filter(d => d.popular).slice(0, 6);
}

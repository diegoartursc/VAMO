/**
 * Mock data for user-submitted questions on itinerary FAQ sections.
 * In production, these would come from the backend.
 */

export interface UserQuestion {
    id: string;
    userId: string;
    itineraryId: string;
    itineraryTitle: string;
    itineraryDestination: string;
    itineraryCountry: string;
    itineraryImage: string;
    creatorName: string;
    question: string;
    answer: string | null; // null = not yet answered
    questionDate: string;
    answerDate: string | null;
}

const MOCK_USER_QUESTIONS: UserQuestion[] = [
    {
        id: 'q-1',
        userId: 'trav-diego',
        itineraryId: '1',
        itineraryTitle: 'Paris Econômica - 10 dias por R$ 6.000',
        itineraryDestination: 'Paris',
        itineraryCountry: 'França',
        itineraryImage: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400',
        creatorName: 'Diego Artur',
        question: 'O roteiro inclui dicas de restaurantes veganos em Paris?',
        answer: 'Olá! Sim, na seção de cada dia tem opções de restaurantes, incluindo veganos. Recomendo especialmente o "Le Potager de Charlotte" no 9ème. Vou adicionar mais opções na próxima atualização!',
        questionDate: '2 de abril de 2026',
        answerDate: '3 de abril de 2026',
    },
    {
        id: 'q-2',
        userId: 'trav-diego',
        itineraryId: '1',
        itineraryTitle: 'Paris Econômica - 10 dias por R$ 6.000',
        itineraryDestination: 'Paris',
        itineraryCountry: 'França',
        itineraryImage: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400',
        creatorName: 'Diego Artur',
        question: 'Consigo usar o metrô de Paris facilmente sem falar francês?',
        answer: 'Com certeza! O metrô de Paris é super intuitivo. No roteiro tem um guia completo com mapa das linhas, como comprar o Navigo e dicas para não se perder. As placas são bem visuais.',
        questionDate: '28 de março de 2026',
        answerDate: '29 de março de 2026',
    },
    {
        id: 'q-3',
        userId: 'trav-diego',
        itineraryId: '2',
        itineraryTitle: 'Tóquio Autêntica - 15 dias de Cultura',
        itineraryDestination: 'Tóquio',
        itineraryCountry: 'Japão',
        itineraryImage: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400',
        creatorName: 'Mariana Silva',
        question: 'É melhor levar dinheiro em espécie ou usar cartão no Japão?',
        answer: null, // not answered yet
        questionDate: '10 de abril de 2026',
        answerDate: null,
    },
    {
        id: 'q-4',
        userId: 'trav-diego',
        itineraryId: '2',
        itineraryTitle: 'Tóquio Autêntica - 15 dias de Cultura',
        itineraryDestination: 'Tóquio',
        itineraryCountry: 'Japão',
        itineraryImage: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400',
        creatorName: 'Mariana Silva',
        question: 'Preciso comprar o Japan Rail Pass antes de ir ou posso comprar lá?',
        answer: 'Oi! Recomendo comprar antes pela internet, é mais barato. No roteiro eu coloquei os links e um passo a passo de como ativar quando chegar no Japão. Qualquer dúvida pode perguntar!',
        questionDate: '5 de abril de 2026',
        answerDate: '6 de abril de 2026',
    },
];

export function getUserQuestions(userId: string): UserQuestion[] {
    return MOCK_USER_QUESTIONS.filter(q => q.userId === userId);
}

export function getQuestionsByItinerary(itineraryId: string): UserQuestion[] {
    return MOCK_USER_QUESTIONS.filter(q => q.itineraryId === itineraryId);
}

export function addUserQuestion(question: Omit<UserQuestion, 'id'>): UserQuestion {
    const newQ: UserQuestion = {
        ...question,
        id: `q-${Date.now()}`,
    };
    MOCK_USER_QUESTIONS.push(newQ);
    return newQ;
}

export function getUnansweredCount(userId: string): number {
    return MOCK_USER_QUESTIONS.filter(q => q.userId === userId && q.answer === null).length;
}

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

const MOCK_USER_QUESTIONS: UserQuestion[] = [];

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

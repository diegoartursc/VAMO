import { Creator } from '../types/creator';

export const mockCreators: Creator[] = [];

export const getCreatorById = (id: string): Creator | undefined => undefined;

export const getCreatorsByLevel = (level: Creator['verificationLevel']): Creator[] => [];

export const getFeaturedCreators = (): Creator[] => [];

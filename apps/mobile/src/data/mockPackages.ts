import { Package, Agency } from '../types';

export const mockPackages: Package[] = [];


export const getFeaturedPackages = (): Package[] => [];

export const getPackageById = (id: string): Package | undefined => undefined;

export const getPackagesByDestination = (destination: string): Package[] => [];

// Calculate relevance score for sorting (rating * log(reviews + 1))
export const calculateRelevance = (rating: number, reviewCount: number): number => {
    return rating * Math.log(reviewCount + 1);
};

export const getPackagesByRelevance = (): Package[] => [];

// Get related packages from the same destination (excluding the current package)
export const getRelatedPackages = (currentPackageId: string, limit: number = 4): Package[] => [];

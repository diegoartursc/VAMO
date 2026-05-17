export interface Review {
    id: string;
    packageId: string;
    userId: string;
    user: {
        name: string;
        location: string;
        avatar: string; // color for avatar background
        initial: string;
    };
    rating: number;
    date: string;
    verified: boolean;
    text: string;
    photos?: string[];
    language?: string; // for "Traduzir" feature
    response?: {
        date: string;
        text: string;
    };
}

const MOCK_REVIEWS: Review[] = [];

export function getReviewsByPackageId(packageId: string): Review[] {
    return MOCK_REVIEWS.filter(review => review.packageId === packageId);
}

export function getReviewCount(packageId: string): number {
    return getReviewsByPackageId(packageId).length;
}

export function getAverageRating(packageId: string): number {
    const reviews = getReviewsByPackageId(packageId);
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return Number((sum / reviews.length).toFixed(1));
}

export function getCategoryRatings(packageId: string) {
    const avgRating = getAverageRating(packageId);
    // Simulating category-specific ratings with small variations
    return {
        guide: Math.min(5, Number((avgRating + 0.1).toFixed(1))),
        transport: avgRating,
        value: Math.max(4, Number((avgRating - 0.2).toFixed(1))),
    };
}

export function getCommunityPhotos(packageId: string): string[] {
    const reviews = getReviewsByPackageId(packageId);
    return reviews
        .filter(review => review.photos && review.photos.length > 0)
        .flatMap(review => review.photos || []);
}

// Category labels mapping
const categoryLabels: Record<string, string> = {
    guide: 'o guia',
    transport: 'o transporte',
    value: 'o custo-benefício',
    organization: 'a organização do roteiro',
};

export function getTopRatedCategoriesText(packageId: string): string {
    const categoryRatings = getCategoryRatings(packageId);

    // Convert to array and filter categories with rating >= 4.5
    const topCategories = Object.entries(categoryRatings)
        .filter(([_, rating]) => rating >= 4.5)
        .sort(([_, ratingA], [__, ratingB]) => ratingB - ratingA)
        .map(([category, _]) => categoryLabels[category] || category);

    // Generate natural language text
    if (topCategories.length === 0) {
        return 'Viajantes elogiam principalmente a qualidade da experiência';
    } else if (topCategories.length === 1) {
        return `Viajantes elogiam principalmente ${topCategories[0]}`;
    } else if (topCategories.length === 2) {
        return `Viajantes elogiam principalmente ${topCategories[0]} e ${topCategories[1]}`;
    } else {
        const lastCategory = topCategories[topCategories.length - 1];
        const otherCategories = topCategories.slice(0, -1).join(', ');
        return `Viajantes elogiam principalmente ${otherCategories} e ${lastCategory}`;
    }
}

// ─── User-scoped helpers ────────────────────────────────

export function getReviewsByUserId(userId: string): Review[] {
    return MOCK_REVIEWS.filter(review => review.userId === userId);
}

export function hasUserReviewed(userId: string, packageId: string): boolean {
    return MOCK_REVIEWS.some(r => r.userId === userId && r.packageId === packageId);
}

export function getUserReviewForPackage(userId: string, packageId: string): Review | undefined {
    return MOCK_REVIEWS.find(r => r.userId === userId && r.packageId === packageId);
}

export function addReview(review: Omit<Review, 'id'>): Review {
    const newReview: Review = {
        ...review,
        id: `review-${Date.now()}`,
    };
    MOCK_REVIEWS.push(newReview);
    return newReview;
}

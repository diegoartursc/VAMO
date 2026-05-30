import { z } from 'zod';

/**
 * Zod schemas for package validation
 * Used in POST /api/packages and PUT /api/packages/:id
 */

export const CreatePackageSchema = z.object({
    agencyId: z.string().min(1, 'agencyId is required'),
    title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title max 200 chars'),
    destination: z.string().min(2, 'Destination required'),
    country: z.string().min(2, 'Country required'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    fullDescription: z.string().optional(),
    emotionalIntro: z.string().optional(),
    duration: z.number().int().positive('Duration must be positive'),
    priceMin: z.number().positive('Price must be positive'),
    priceMax: z.number().positive('Price must be positive').optional(),
    currency: z.enum(['AUD', 'USD', 'EUR', 'GBP', 'BRL']).default('AUD'),
    continent: z.string().optional(),
    airport: z.string().optional(),
    multiDestination: z.boolean().default(false),
    additionalCities: z.array(z.string()).default([]),
    travelStyles: z.array(z.string()).max(3, 'Max 3 travel styles'),
    categories: z.array(z.string()).max(5, 'Max 5 categories'),
    includes: z.array(z.string()).default([]),
    inclusions: z.array(z.string()).default([]),
    includedItems: z.array(z.string()).default([]),
    routeDetails: z.any().optional(),
    highlights: z.array(z.string()).default([]),
    perfectFor: z.array(z.string()).default([]),
    notRecommendedFor: z.array(z.string()).default([]),
    importantInfo: z.array(z.string()).default([]),
    cancellationPolicy: z.string().optional(),
    hasFreeCancellation: z.boolean().default(false),
    isAllInclusive: z.boolean().default(false),
    featured: z.boolean().default(false),
    whatsappOfficial: z.string().optional(),
    autoMessage: z.string().optional(),
    voucherUrl: z.string().url().optional(),
    eticketUrl: z.string().url().optional(),
    requiredDocuments: z.array(z.string()).default([]),
    promoPrice: z.number().positive().optional(),
    installments: z.number().int().positive().optional(),
    status: z.enum(['ACTIVE', 'DRAFT', 'REJECTED']).default('ACTIVE'),
});

export const UpdatePackageSchema = CreatePackageSchema.partial();

export type CreatePackageInput = z.infer<typeof CreatePackageSchema>;
export type UpdatePackageInput = z.infer<typeof UpdatePackageSchema>;

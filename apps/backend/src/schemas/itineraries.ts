import { z } from 'zod';

/**
 * Zod schemas for itinerary validation
 * Used in POST /api/itineraries and PUT /api/itineraries/:id
 */

export const CreateItinerarySchema = z.object({
    creatorId: z.string().min(1, 'creatorId is required'),
    title: z.string().min(3, 'Title must be at least 3 characters').max(200),
    subtitle: z.string().max(200).optional(),
    destination: z.string().min(2, 'Destination required'),
    country: z.string().min(2, 'Country required'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    price: z.number().positive('Price must be positive'),
    currency: z.enum(['BRL', 'USD', 'EUR', 'GBP']).default('BRL'),
    duration: z.number().int().positive('Duration must be positive'),
    travelStyles: z.array(z.string()).max(3, 'Max 3 travel styles'),
    categories: z.array(z.string()).min(1, 'At least 1 category required').max(5),
    highlights: z.array(z.string()).default([]),
    inclusions: z.array(z.string()).default([]),
    activeModules: z.array(z.string()).default([]),
    productType: z.enum(['DIGITAL', 'PHYSICAL']).default('DIGITAL'),
    promoPrice: z.number().positive().optional(),
    installments: z.number().int().positive().optional(),
    immediateAccess: z.boolean().default(true),
    lifetimeAccess: z.boolean().default(true),
    offlineDownload: z.boolean().default(true),
    allowPdf: z.boolean().default(false),
    allowShare: z.boolean().default(true),
    featured: z.boolean().default(false),
    estimatedSpending: z.object({
        min: z.number().positive().optional(),
        max: z.number().positive().optional(),
        currency: z.string().default('BRL'),
        breakdown: z.array(z.object({
            category: z.string(),
            min: z.string(),
            max: z.string()
        })).default([])
    }).optional(),
    images: z.array(z.string().url()).default([]),
    status: z.enum(['PENDING_REVIEW', 'ACTIVE', 'REJECTED']).default('PENDING_REVIEW'),
});

export const UpdateItinerarySchema = CreateItinerarySchema.partial();

export type CreateItineraryInput = z.infer<typeof CreateItinerarySchema>;
export type UpdateItineraryInput = z.infer<typeof UpdateItinerarySchema>;

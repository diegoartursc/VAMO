import { z } from 'zod';

/**
 * Zod schemas for itinerary validation
 * Used in POST /api/itineraries and PUT /api/itineraries/:id
 */

/** Transparência graduada de custos por item (spending legacy + cost novo). */
export const CostDisclosureTypeSchema = z.enum(['not_informed', 'estimated', 'verified']);
export const CostProofStatusSchema = z.enum(['none', 'uploaded', 'pending_review', 'approved', 'rejected']);

export const CostProofFileSchema = z.object({
    url: z.string().min(1),
    name: z.string().optional(),
    mimeType: z.string().optional(),
    size: z.number().int().nonnegative().optional(),
    uploadedAt: z.string().optional(),
}).passthrough();

export const ModuleCostInfoSchema = z.object({
    amount: z.union([z.string(), z.number(), z.null()]).optional(),
    currency: z.string().optional(),
    disclosureType: CostDisclosureTypeSchema,
    /** Pessoas que dividiram esse gasto (1 = individual). Default 1
     *  no consumidor — não obrigatório no payload. */
    sharedByPeople: z.number().int().positive().max(99).optional(),
    notes: z.string().optional(),
    proofFiles: z.array(CostProofFileSchema).optional(),
    proofStatus: CostProofStatusSchema.optional(),
    updatedAt: z.string().optional(),
}).passthrough();

export const ModuleSpendingSchema = z.object({
    value: z.string(),
    currency: z.string(),
}).passthrough();

export const CreateItinerarySchema = z.object({
    creatorId: z.string().min(1, 'creatorId is required'),
    title: z.string().min(3, 'Title must be at least 3 characters').max(200),
    subtitle: z.string().max(200).optional(),
    destination: z.string().min(2, 'Destination required'),
    country: z.string().min(2, 'Country required'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    price: z.number().positive('Price must be positive'),
    currency: z.enum(['AUD', 'USD', 'EUR', 'GBP', 'BRL']).default('AUD'),
    duration: z.number().int().positive('Duration must be positive'),
    travelStyles: z.array(z.string()).max(3, 'Max 3 travel styles'),
    categories: z.array(z.string()).min(1, 'At least 1 category required').max(5),
    highlights: z.array(z.string()).default([]),
    inclusions: z.array(z.string()).default([]),
    activeModules: z.array(z.string()).default([]),
    productType: z.enum(['DIGITAL', 'PHYSICAL']).default('DIGITAL'),
    promoPrice: z.number().positive().optional(),
    immediateAccess: z.boolean().default(true),
    lifetimeAccess: z.boolean().default(true),
    offlineDownload: z.boolean().default(true),
    allowPdf: z.boolean().default(false),
    allowShare: z.boolean().default(true),
    featured: z.boolean().default(false),
    estimatedSpending: z.object({
        min: z.number().positive().optional(),
        max: z.number().positive().optional(),
        currency: z.string().default('AUD'),
        breakdown: z.array(z.object({
            category: z.string(),
            min: z.string(),
            max: z.string()
        })).default([])
    }).optional(),
    images: z.array(z.string().url()).default([]),
    // Capa marcada pelo criador (até 3). Limite documentado aqui; o mobile já
    // enforça via UI (slice(0,3) em new-itinerary.tsx). Tolerante a strings
    // não-URL pra não quebrar dados legados (uploads antigos sem schema URL).
    highlightPhotos: z.array(z.string()).max(3, 'Máximo 3 fotos de capa').default([]),
    // Fotos/vídeos adicionais ("Fotos e Vídeos da Viagem"). Limite alvo: 10.
    mediaUrls: z.array(z.string()).max(10, 'Máximo 10 mídias adicionais').default([]),
    /** URL do comprovante de viagem (passagem/seguro/boarding) — usado pela revisão admin. */
    travelProofUrl: z.string().optional(),
    status: z.enum(['PENDING_REVIEW', 'ACTIVE', 'REJECTED']).default('PENDING_REVIEW'),
});

export const UpdateItinerarySchema = CreateItinerarySchema.partial();

export type CreateItineraryInput = z.infer<typeof CreateItinerarySchema>;
export type UpdateItineraryInput = z.infer<typeof UpdateItinerarySchema>;

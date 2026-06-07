/**
 * Categorias canônicas dos arquivos da Minha Central da Viagem.
 *
 * Fonte única de verdade compartilhada por:
 *   - AddFileModal   (chips de escolha no upload)
 *   - FilesTab       (chips de filtro + lógica de filter)
 *   - FilePreviewModal (label/chip do preview)
 *
 * Regras:
 *   - "Todos" NUNCA é uma categoria salva — é só filtro visual.
 *   - Categoria salva sempre vem desta lista (FILE_CATEGORIES).
 *   - Se vier algo inválido do backend (legado), normalize() devolve "Outros".
 *
 * Mudou a lista? Reinicie o backend não é necessário — categoria é string
 * livre no schema (`String`, sem enum). Mas reveja FilePreviewModal e
 * qualquer ícone associado.
 */

/** Categorias salváveis (na ordem que aparecem nos chips). */
export const FILE_CATEGORIES = [
    'Voos',
    'Hospedagem',
    'Passeios e ingressos',
    'Documentos',
    'Seguro',
    'Recibos',
    'Transporte',
    'Outros',
] as const;

export type FileCategory = (typeof FILE_CATEGORIES)[number];

/** Sentinel especial para a UI de filtro. Nunca é salvo. */
export const ALL_FILTER = 'Todos' as const;

/** Lista de filtros do FilesTab (Todos + categorias canônicas). */
export const FILE_FILTERS = [ALL_FILTER, ...FILE_CATEGORIES] as const;
export type FileFilter = (typeof FILE_FILTERS)[number];

/**
 * Normaliza uma categoria vinda do backend / payload externo.
 * Aceita variações minúsculas, no plural antigo do schema
 * (`'voos' | 'hospedagem' | ...`) e cai em "Outros" se vier vazio
 * ou desconhecido. Nunca devolve "Todos".
 */
export function normalizeCategory(raw: unknown): FileCategory {
    if (typeof raw !== 'string') return 'Outros';
    const trimmed = raw.trim();
    if (!trimmed) return 'Outros';

    // Bate exato com a lista canônica primeiro (caso normal).
    if ((FILE_CATEGORIES as readonly string[]).includes(trimmed)) {
        return trimmed as FileCategory;
    }

    // Legado / variações: lowercase, sem acento, sem ingressos no final.
    const k = trimmed
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .trim();

    const legacy: Record<string, FileCategory> = {
        voos: 'Voos',
        voo: 'Voos',
        flights: 'Voos',
        flight: 'Voos',

        hospedagem: 'Hospedagem',
        hospedagens: 'Hospedagem',
        hotel: 'Hospedagem',
        accommodation: 'Hospedagem',
        accommodations: 'Hospedagem',

        passeios: 'Passeios e ingressos',
        'passeios e ingressos': 'Passeios e ingressos',
        tours: 'Passeios e ingressos',
        ingressos: 'Passeios e ingressos',
        attractions: 'Passeios e ingressos',

        documentos: 'Documentos',
        documento: 'Documentos',
        documents: 'Documentos',
        document: 'Documentos',

        seguro: 'Seguro',
        seguros: 'Seguro',
        insurance: 'Seguro',

        recibos: 'Recibos',
        recibo: 'Recibos',
        receipts: 'Recibos',
        receipt: 'Recibos',

        transporte: 'Transporte',
        transportes: 'Transporte',
        transport: 'Transporte',
        transportation: 'Transporte',

        outros: 'Outros',
        outro: 'Outros',
        others: 'Outros',
        other: 'Outros',
        general: 'Outros',
        geral: 'Outros',
    };

    return legacy[k] ?? 'Outros';
}

/** Ícone Ionicon associado a cada categoria — usado em chips e preview. */
export function iconForCategory(category: FileCategory): string {
    switch (category) {
        case 'Voos':                  return 'airplane';
        case 'Hospedagem':            return 'bed';
        case 'Passeios e ingressos':  return 'ticket';
        case 'Documentos':            return 'document-text';
        case 'Seguro':                return 'shield-checkmark';
        case 'Recibos':               return 'receipt';
        case 'Transporte':            return 'car';
        case 'Outros':                return 'folder';
    }
}

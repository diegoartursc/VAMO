/**
 * Public surface of the route-versioning feature.
 * Mantém os imports do consumidor enxutos (uma só linha).
 */

export { default as RouteVersioning } from './RouteVersioning';
export type { RouteVersioningProps } from './RouteVersioning';

export { default as VersionTabs } from './VersionTabs';
export type { VersionTabsProps, RouteVersionTab } from './VersionTabs';

export { default as OriginalView } from './OriginalView';
export type { OriginalViewProps } from './OriginalView';

export { default as MyRouteView } from './MyRouteView';
export type { MyRouteViewProps } from './MyRouteView';

export { default as ItemCard } from './ItemCard';
export type { ItemCardProps } from './ItemCard';

export { default as ItemFormModal } from './ItemFormModal';
export type { ItemFormModalProps } from './ItemFormModal';

export { default as EditItemModal } from './EditItemModal';
export type { EditItemModalProps } from './EditItemModal';

export { default as AddItemModal } from './AddItemModal';
export type { AddItemModalProps } from './AddItemModal';

export { default as NotesCard } from './NotesCard';
export type { NotesCardProps } from './NotesCard';

export { default as HiddenItemsSection } from './HiddenItemsSection';
export type { HiddenItemsSectionProps } from './HiddenItemsSection';

export { FIELDS_BY_KIND, KIND_TITLE } from './itemFields';
export type { FieldSpec, FieldType } from './itemFields';

export {
    mergeItineraryWithCustomization,
    applyPatch,
    originalIdOf,
    generateAddedId,
} from './mergeEngine';
export type {
    MergedItem,
    MergedDay,
    MergedItinerary,
    ItemSource,
} from './mergeEngine';

// ─── PDF export ─────────────────────────────────────────────────────

export { default as PdfExportSheet } from './PdfExportSheet';
export type { PdfExportSheetProps } from './PdfExportSheet';

export { buildPdfHtml } from './pdfTemplate';
export type { PdfBuildOpts, PdfVariant } from './pdfTemplate';

export { exportRoutePdf } from './pdfExport';
export type { ExportResult } from './pdfExport';

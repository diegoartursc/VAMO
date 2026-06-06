/**
 * Type shim para `expo-sharing` — mesmo motivo de `expo-print.d.ts`:
 * mantém o type-check verde até `pnpm install` puxar o pacote.
 *
 * Cobre apenas o subset usado em `pdfExport.ts`.
 */
declare module 'expo-sharing' {
    export interface SharingOptions {
        mimeType?: string;
        UTI?: string;
        dialogTitle?: string;
    }

    export function isAvailableAsync(): Promise<boolean>;
    export function shareAsync(uri: string, options?: SharingOptions): Promise<void>;
}

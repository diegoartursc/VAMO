/**
 * Type shim para `expo-print`.
 *
 * O módulo é adicionado ao package.json mas pode ainda não estar
 * instalado em todos os ambientes. Este shim deixa o type-check passar
 * até que `pnpm install` rode. Após instalação, os types reais do
 * pacote prevalecem (resolução de módulos prioriza `node_modules`
 * sobre declarações ambientes).
 *
 * Inclui apenas a superfície que usamos em `pdfExport.ts`. Quando o
 * pacote estiver instalado, considerar remover este arquivo.
 */
declare module 'expo-print' {
    export interface PrintToFileOptions {
        html: string;
        base64?: boolean;
        width?: number;
        height?: number;
        margins?: { left?: number; right?: number; top?: number; bottom?: number };
    }

    export interface PrintToFileResult {
        uri: string;
        numberOfPages?: number;
        base64?: string;
    }

    export function printToFileAsync(options: PrintToFileOptions): Promise<PrintToFileResult>;
    export function printAsync(options: { html?: string; uri?: string }): Promise<void>;
}

/**
 * VAMO — Roteiro Editável Pós-Compra (PDF export wrapper).
 *
 * Camada fina sobre `expo-print` + `expo-sharing` que produz o PDF a
 * partir de um `PdfBuildOpts` e dispara o share sheet nativo. Mantém o
 * `pdfTemplate` puro (só HTML) e o `PdfExportSheet` (UI) burro.
 *
 * Estratégia por plataforma:
 *  - Native (iOS/Android): `Print.printToFileAsync({ html })` → arquivo
 *    temporário → `Sharing.shareAsync(uri)` (com fallback silencioso se
 *    sharing indisponível — o arquivo continua acessível via URI).
 *  - Web: imprimir/baixar via janela do navegador. Abrimos uma nova
 *    janela com o HTML e disparamos `window.print()` — o usuário pode
 *    "Salvar como PDF" no diálogo do browser. Se a janela for bloqueada
 *    por popup-blocker, usamos um Blob como data URL no current window.
 *
 * Decisões:
 *  - `generatedAtISO` vem do CALLER (PdfExportSheet) — não geramos aqui.
 *    Garante consistência se o caller quiser logar/exibir a mesma data.
 *  - Arquivos do viajante NÃO entram no PDF (escopo): este wrapper só
 *    encaminha o HTML do template, que já omite uploads.
 *  - Imports dinâmicos para `expo-print`/`expo-sharing`: evitam que o
 *    bundle web quebre se os módulos não estiverem instalados/expostos
 *    no ambiente web. No native, são `require` direto.
 */

import { Platform } from 'react-native';

import { buildPdfHtml, type PdfBuildOpts } from './pdfTemplate';

/**
 * Resultado da exportação. `uri` só é relevante no native (caminho do
 * arquivo gerado). `shared` indica se o share sheet foi invocado.
 */
export interface ExportResult {
    uri?: string;
    shared: boolean;
}

/**
 * Sanitiza o título do roteiro para virar nome de arquivo. Remove
 * acentos, caracteres especiais e troca espaços por underscore.
 */
function sanitizeFilename(raw: string): string {
    const s = (raw ?? '').toString().trim() || 'roteiro';
    return s
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')      // remove acentos
        .replace(/[^a-zA-Z0-9\- ]/g, '')       // remove especiais
        .replace(/\s+/g, '_')
        .slice(0, 80) || 'roteiro';
}

/**
 * Exporta o roteiro como PDF e dispara o share sheet nativo (ou o
 * print do navegador no web). Idempotente — pode ser chamada
 * múltiplas vezes.
 *
 * @throws Quando o nativo não consegue gerar o arquivo. O caller deve
 *         decidir como exibir o erro (toast/alert).
 */
export async function exportRoutePdf(opts: PdfBuildOpts): Promise<ExportResult> {
    const html = buildPdfHtml(opts);
    const titleBase = sanitizeFilename(opts.itinerary?.title ?? 'roteiro');
    const variantSuffix = opts.variant === 'personalized' ? 'minha-versao' : 'original';
    const fileLabel = `${titleBase}_${variantSuffix}`;

    if (Platform.OS === 'web') {
        return exportWeb(html, fileLabel);
    }
    return exportNative(html, fileLabel);
}

// ─── Native (iOS/Android) ──────────────────────────────────────────

async function exportNative(html: string, _fileLabel: string): Promise<ExportResult> {
    // Imports dentro da função: no web esses módulos podem não estar
    // disponíveis e o `Platform.OS === 'web'` já bifurcou antes.
    let Print: typeof import('expo-print');
    let Sharing: typeof import('expo-sharing');
    try {
        Print = require('expo-print');
    } catch (err) {
        throw new Error('expo-print não está instalado. Rode `pnpm install` na raiz do monorepo.');
    }
    try {
        Sharing = require('expo-sharing');
    } catch {
        // Sharing é melhor-esforço — se faltar, apenas retornamos o uri.
        Sharing = null as any;
    }

    const { uri } = await Print.printToFileAsync({ html });

    // `expo-print` nomeia o arquivo com hash temporário. Renomeação para
    // um nome amigável fica para iteração futura — a maioria dos share
    // sheets já permite o usuário renomear no destino.
    let shared = false;
    if (Sharing) {
        try {
            const available = await Sharing.isAvailableAsync();
            if (available) {
                await Sharing.shareAsync(uri, {
                    mimeType: 'application/pdf',
                    UTI: 'com.adobe.pdf',
                    dialogTitle: 'Salvar / compartilhar roteiro',
                });
                shared = true;
            }
        } catch {
            // Falha no share não invalida o PDF: o arquivo está em uri.
        }
    }

    return { uri, shared };
}

// ─── Web ────────────────────────────────────────────────────────────

async function exportWeb(html: string, _fileLabel: string): Promise<ExportResult> {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
        // SSR / ambiente sem janela — não há o que fazer.
        return { shared: false };
    }

    // Tenta abrir popup com o HTML; usuário usa "Salvar como PDF" do
    // próprio navegador (Cmd/Ctrl + P → destino "Salvar como PDF").
    try {
        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const popup = window.open(url, '_blank');
        if (popup) {
            // Aguarda load para auto-disparar o print sem prender o thread.
            popup.addEventListener('load', () => {
                try { popup.print(); } catch { /* usuário usa Cmd+P manual */ }
            }, { once: true });
            return { uri: url, shared: true };
        }
        // Popup bloqueado — abre como download via anchor.
        const a = document.createElement('a');
        a.href = url;
        a.download = `${_fileLabel}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return { uri: url, shared: false };
    } catch {
        return { shared: false };
    }
}

/**
 * useShareItinerary — fluxo unificado de compartilhamento de roteiros.
 *
 * Comportamento:
 *  - Mobile (iOS/Android): abre o share-sheet nativo via `Share.share`.
 *  - Web: tenta `navigator.share`; se indisponível, copia o link para o
 *    clipboard e dispara um notify("Link copiado").
 *  - Sempre registra dois eventos no backend:
 *      1) "intent" no início (gera o shareUrl rastreável).
 *      2) "completed" / "cancelled" / "failed" no desfecho do share-sheet.
 *
 * Limitações técnicas conhecidas (documentadas no código):
 *  - O share-sheet nativo NÃO informa em qual app o usuário compartilhou (iOS
 *    devolve activityType às vezes; Android quase nunca). Reportamos `channel`
 *    como "native_share" e quando dá pra inferir, mapeamos.
 *  - Não há garantia de "envio publicado" na rede de destino. Tratamos
 *    `Share.share -> {action:'sharedAction'}` como `completed` (melhor proxy
 *    disponível), e `dismissedAction` como `cancelled`. Sem callback no web =
 *    `intent` (não dá pra saber).
 *
 * Privacidade:
 *  - NUNCA inclui dados pessoais, versão personalizada do comprador ou
 *    conteúdo pago no payload. A mensagem cita só título + destino + link
 *    rastreável (que aponta para a página pública do roteiro).
 *  - Se `allowShare === false`, o caller deve esconder o CTA antes de chamar.
 *    Por segurança, o backend também recusa (403).
 */

import { useCallback, useState } from 'react';
import { Platform, Share } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { notify } from '../utils/notify';
import {
    registerItineraryShare,
    type ShareSurface,
    type ShareChannel,
    type ShareActorRole,
    type ShareItineraryResponse,
} from '../services/api';

export interface UseShareItineraryParams {
    itineraryId: string;
    title: string;
    destination?: string | null;
    country?: string | null;
    allowShare?: boolean;
    /** Roteiro privado/arquivado: caller pode passar false para bloquear. */
    isShareable?: boolean;
    surface: ShareSurface;
    actorRole?: ShareActorRole;
    saleId?: string | null;
    /** Callback chamado quando o backend confirma XP/missão. */
    onShareCompleted?: (result: ShareItineraryResponse) => void;
}

export interface ShareItineraryAction {
    share: () => Promise<void>;
    /** true enquanto o share-sheet está aberto / aguardando backend. */
    isSharing: boolean;
}

/**
 * Copia uma string para o clipboard no navegador. Usa `navigator.clipboard`
 * quando disponível (requer HTTPS ou localhost) e cai para o truque do
 * <textarea> + document.execCommand('copy') em ambientes mais restritos.
 */
async function copyToClipboardWeb(text: string): Promise<void> {
    const g = globalThis as any;
    if (g?.navigator?.clipboard?.writeText) {
        await g.navigator.clipboard.writeText(text);
        return;
    }
    const doc = g?.document;
    if (!doc) throw new Error('Clipboard indisponível neste ambiente.');
    const el = doc.createElement('textarea');
    el.value = text;
    el.style.position = 'fixed';
    el.style.opacity = '0';
    doc.body.appendChild(el);
    el.select();
    try {
        const ok = doc.execCommand('copy');
        if (!ok) throw new Error('execCommand copy retornou false.');
    } finally {
        doc.body.removeChild(el);
    }
}

/**
 * Último recurso quando nem `navigator.share` nem o clipboard funcionam:
 * abre o prompt nativo do navegador com o link pré-selecionável, para o
 * usuário copiar manualmente (Cmd/Ctrl+C). Sem isso, o usuário fica sem
 * nenhuma forma de recuperar o link — exatamente o "nada acontece" que
 * este fluxo existe para evitar.
 */
function showManualLinkFallback(url: string): boolean {
    const g = globalThis as any;
    if (typeof g?.window?.prompt !== 'function') return false;
    g.window.prompt('Copie o link deste roteiro:', url);
    return true;
}

function buildMessage(params: { title: string; destination?: string | null; country?: string | null; url: string }): string {
    const dest = [params.destination, params.country].filter(Boolean).join(', ');
    const lead = dest
        ? `${params.title} — ${dest}`
        : params.title;
    return `Olha esse roteiro no VAMO: ${lead}. Achei que você poderia curtir: ${params.url}`;
}

export function useShareItinerary(params: UseShareItineraryParams): ShareItineraryAction {
    const { accessToken } = useAuth();
    const [isSharing, setIsSharing] = useState(false);

    const share = useCallback(async () => {
        if (isSharing) return;
        if (params.allowShare === false || params.isShareable === false) {
            notify({
                title: 'Compartilhamento indisponível',
                message: 'Este roteiro não pode ser compartilhado no momento.',
                variant: 'warning',
            });
            return;
        }

        setIsSharing(true);

        const baseInput = {
            surface: params.surface,
            actorRole: params.actorRole ?? 'traveler',
            saleId: params.saleId ?? null,
        };

        // 1) Registra "intent" e ganha o shareUrl rastreável.
        let intent: ShareItineraryResponse;
        try {
            intent = await registerItineraryShare(
                params.itineraryId,
                { ...baseInput, status: 'intent', channel: 'unknown' },
                accessToken,
            );
        } catch (err: any) {
            setIsSharing(false);
            const msg = typeof err?.message === 'string' ? err.message : 'Tente novamente em instantes.';
            notify({
                title: 'Não foi possível compartilhar',
                message: msg,
                variant: 'error',
            });
            return;
        }

        const message = buildMessage({
            title: params.title,
            destination: params.destination,
            country: params.country,
            url: intent.shareUrl,
        });

        // 2) Abre o share-sheet. O resultado por plataforma:
        //    - native: action === 'sharedAction' | 'dismissedAction'
        //    - web (navigator.share): resolve sem erro = completed; AbortError = cancelled
        //    - web sem navigator.share: copy-link fallback (completed por proxy).
        let nextStatus: 'completed' | 'cancelled' | 'failed' = 'failed';
        let nextChannel: ShareChannel = 'native_share';
        let didFallbackToClipboard = false;
        let didFallbackToManualLink = false;

        try {
            if (Platform.OS === 'web') {
                const nav = (globalThis as any).navigator;
                if (nav && typeof nav.share === 'function') {
                    try {
                        await nav.share({
                            title: params.title,
                            text: message,
                            url: intent.shareUrl,
                        });
                        nextStatus = 'completed';
                        nextChannel = 'native_share';
                    } catch (err: any) {
                        if (err?.name === 'AbortError') {
                            nextStatus = 'cancelled';
                        } else {
                            // navigator.share falhou (indisponível de fato, bloqueado
                            // pelo browser, etc.) — caímos pro clipboard.
                            try {
                                await copyToClipboardWeb(intent.shareUrl);
                                didFallbackToClipboard = true;
                                nextStatus = 'completed';
                                nextChannel = 'copy_link';
                            } catch {
                                // Clipboard também falhou — último recurso: prompt
                                // nativo com o link pra copiar manualmente.
                                didFallbackToManualLink = showManualLinkFallback(intent.shareUrl);
                                nextStatus = didFallbackToManualLink ? 'completed' : 'failed';
                                nextChannel = 'copy_link';
                            }
                        }
                    }
                } else {
                    // Sem Web Share API: copia o link.
                    try {
                        await copyToClipboardWeb(intent.shareUrl);
                        didFallbackToClipboard = true;
                        nextStatus = 'completed';
                        nextChannel = 'copy_link';
                    } catch {
                        didFallbackToManualLink = showManualLinkFallback(intent.shareUrl);
                        nextStatus = didFallbackToManualLink ? 'completed' : 'failed';
                        nextChannel = 'copy_link';
                    }
                }
            } else {
                const result = await Share.share({
                    title: params.title,
                    message,
                    url: intent.shareUrl,
                });
                if (result.action === Share.sharedAction) {
                    nextStatus = 'completed';
                    nextChannel = 'native_share';
                } else if (result.action === Share.dismissedAction) {
                    nextStatus = 'cancelled';
                } else {
                    nextStatus = 'failed';
                }
            }
        } catch {
            nextStatus = 'failed';
        }

        // 3) Reporta o desfecho (best-effort — falha silenciosa não derruba UX).
        try {
            const final = await registerItineraryShare(
                params.itineraryId,
                {
                    ...baseInput,
                    status: nextStatus,
                    channel: nextChannel,
                },
                accessToken,
            );

            if (nextStatus === 'completed') {
                if (didFallbackToManualLink) {
                    notify({
                        title: 'Copie o link exibido',
                        message: 'Não conseguimos copiar automaticamente — selecione e copie o link que aparece na tela.',
                        variant: 'info',
                    });
                } else if (didFallbackToClipboard) {
                    notify({
                        title: 'Link copiado',
                        message: 'Cole onde quiser para compartilhar este roteiro.',
                        variant: 'success',
                    });
                } else if (final.missionCompleted) {
                    notify({
                        title: 'Roteiro compartilhado!',
                        message: 'Missão concluída no Passaporte VAMO.',
                        variant: 'success',
                    });
                } else {
                    notify({
                        title: 'Roteiro compartilhado',
                        message: final.xpAwarded > 0
                            ? `+${final.xpAwarded} XP no Passaporte VAMO.`
                            : 'Obrigado por divulgar a VAMO!',
                        variant: 'success',
                    });
                }
                params.onShareCompleted?.(final);
            } else if (nextStatus === 'failed') {
                notify({
                    title: 'Não foi possível compartilhar',
                    message: 'Tente novamente em instantes.',
                    variant: 'error',
                });
            }
        } catch (err) {
            console.warn('[useShareItinerary] failed to report final status', err);
            // Mesmo se o registro do desfecho falhar, o usuário já viu o
            // resultado real da tentativa de compartilhar — mas se o próprio
            // share/clipboard tinha falhado, garante o aviso de erro mesmo
            // sem confirmação do backend.
            if (nextStatus === 'failed') {
                notify({
                    title: 'Não foi possível compartilhar',
                    message: 'Tente novamente em instantes.',
                    variant: 'error',
                });
            }
        } finally {
            setIsSharing(false);
        }
    }, [accessToken, isSharing, params]);

    return { share, isSharing };
}

/**
 * Variante imperativa do hook — útil em telas que precisam disparar share
 * para itens diferentes (ex.: lista de roteiros do criador). Aceita os mesmos
 * parâmetros do hook, mas é uma função pura que pode ser chamada por item.
 *
 * O caller é responsável por passar o accessToken (em geral via useAuth()).
 */
export async function shareItineraryImperative(
    params: UseShareItineraryParams & { accessToken?: string | null },
): Promise<void> {
    if (params.allowShare === false || params.isShareable === false) {
        notify({
            title: 'Compartilhamento indisponível',
            message: 'Este roteiro não pode ser compartilhado no momento.',
            variant: 'warning',
        });
        return;
    }

    const baseInput = {
        surface: params.surface,
        actorRole: params.actorRole ?? 'traveler',
        saleId: params.saleId ?? null,
    };

    let intent: ShareItineraryResponse;
    try {
        intent = await registerItineraryShare(
            params.itineraryId,
            { ...baseInput, status: 'intent', channel: 'unknown' },
            params.accessToken,
        );
    } catch (err: any) {
        notify({
            title: 'Não foi possível compartilhar',
            message: typeof err?.message === 'string' ? err.message : 'Tente novamente em instantes.',
            variant: 'error',
        });
        return;
    }

    const message = buildMessage({
        title: params.title,
        destination: params.destination,
        country: params.country,
        url: intent.shareUrl,
    });

    let nextStatus: 'completed' | 'cancelled' | 'failed' = 'failed';
    let nextChannel: ShareChannel = 'native_share';
    let didFallbackToClipboard = false;
    let didFallbackToManualLink = false;

    try {
        if (Platform.OS === 'web') {
            const nav = (globalThis as any).navigator;
            if (nav && typeof nav.share === 'function') {
                try {
                    await nav.share({ title: params.title, text: message, url: intent.shareUrl });
                    nextStatus = 'completed';
                } catch (err: any) {
                    if (err?.name === 'AbortError') {
                        nextStatus = 'cancelled';
                    } else {
                        try {
                            await copyToClipboardWeb(intent.shareUrl);
                            didFallbackToClipboard = true;
                            nextStatus = 'completed';
                            nextChannel = 'copy_link';
                        } catch {
                            didFallbackToManualLink = showManualLinkFallback(intent.shareUrl);
                            nextStatus = didFallbackToManualLink ? 'completed' : 'failed';
                            nextChannel = 'copy_link';
                        }
                    }
                }
            } else {
                try {
                    await copyToClipboardWeb(intent.shareUrl);
                    didFallbackToClipboard = true;
                    nextStatus = 'completed';
                    nextChannel = 'copy_link';
                } catch {
                    didFallbackToManualLink = showManualLinkFallback(intent.shareUrl);
                    nextStatus = didFallbackToManualLink ? 'completed' : 'failed';
                    nextChannel = 'copy_link';
                }
            }
        } else {
            const result = await Share.share({
                title: params.title,
                message,
                url: intent.shareUrl,
            });
            if (result.action === Share.sharedAction) {
                nextStatus = 'completed';
            } else if (result.action === Share.dismissedAction) {
                nextStatus = 'cancelled';
            }
        }
    } catch {
        nextStatus = 'failed';
    }

    try {
        const final = await registerItineraryShare(
            params.itineraryId,
            { ...baseInput, status: nextStatus, channel: nextChannel },
            params.accessToken,
        );
        if (nextStatus === 'completed') {
            if (didFallbackToManualLink) {
                notify({
                    title: 'Copie o link exibido',
                    message: 'Não conseguimos copiar automaticamente — selecione e copie o link que aparece na tela.',
                    variant: 'info',
                });
            } else if (didFallbackToClipboard) {
                notify({ title: 'Link copiado', message: 'Cole onde quiser para compartilhar este roteiro.', variant: 'success' });
            } else if (final.missionCompleted) {
                notify({ title: 'Roteiro compartilhado!', message: 'Missão concluída no Passaporte VAMO.', variant: 'success' });
            } else {
                notify({
                    title: 'Roteiro compartilhado',
                    message: final.xpAwarded > 0
                        ? `+${final.xpAwarded} XP no Passaporte VAMO.`
                        : 'Obrigado por divulgar a VAMO!',
                    variant: 'success',
                });
            }
            params.onShareCompleted?.(final);
        } else if (nextStatus === 'failed') {
            notify({ title: 'Não foi possível compartilhar', message: 'Tente novamente em instantes.', variant: 'error' });
        }
    } catch (err) {
        console.warn('[shareItineraryImperative] failed to report final status', err);
        if (nextStatus === 'failed') {
            notify({ title: 'Não foi possível compartilhar', message: 'Tente novamente em instantes.', variant: 'error' });
        }
    }
}

export default useShareItinerary;

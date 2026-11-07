import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

/**
 * Volta das páginas hospedadas da Stripe (Checkout e onboarding do Connect)
 * para o app Android/iOS.
 *
 * A Stripe só aceita URL https de retorno, então o caminho é:
 *   app nativo pede a sessão com `returnTo: 'app'`
 *   → backend acrescenta `app=1` nas URLs de retorno (site do app, Vercel)
 *   → a página web vê `app=1` e redireciona para `vamo://<mesma tela>?<mesmos params>`
 *   → a aba do navegador do app (openAuthSessionAsync) fecha e o app abre a tela.
 *
 * No web nada muda: sem `app=1`, a página segue o fluxo normal.
 */

export const APP_SCHEME = 'vamo';

/** `'app'` quando roda no Android/iOS; o backend usa para marcar as URLs de retorno. */
export const stripeReturnTarget: 'app' | undefined = Platform.OS === 'web' ? undefined : 'app';

/**
 * No web: se a página foi aberta pela volta da Stripe para o app (`app=1`),
 * devolve o link `vamo://` da mesma tela, com os mesmos parâmetros. Senão, null.
 */
export function nativeReturnUrlFromWeb(): string | null {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
    let url: URL;
    try {
        url = new URL(window.location.href);
    } catch {
        return null;
    }
    if (url.searchParams.get('app') !== '1') return null;
    url.searchParams.delete('app');
    const path = url.pathname.replace(/^\/+/, '');
    const query = url.searchParams.toString();
    return `${APP_SCHEME}://${path}${query ? `?${query}` : ''}`;
}

/**
 * No app nativo: abre a página da Stripe numa aba do navegador presa ao app.
 * Resolve quando a pessoa volta (redirect para `vamo://returnPath`) ou fecha a aba.
 * Devolve a URL `vamo://...` de retorno, ou null se a aba foi fechada sem voltar.
 */
export async function openStripePageInApp(url: string, returnPath: string): Promise<string | null> {
    const result = await WebBrowser.openAuthSessionAsync(url, `${APP_SCHEME}://${returnPath.replace(/^\/+/, '')}`);
    return result.type === 'success' ? result.url : null;
}

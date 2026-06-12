/**
 * Navegação segura — "voltar" que nunca é fantasma.
 *
 * No Expo Web, `router.back()` é NO-OP quando não há histórico — o que
 * acontece sempre que o usuário abre uma URL direto (deep link, refresh,
 * redirect pós-login no Vercel). O botão parece quebrado: clica e nada.
 *
 * `safeBack` resolve: volta quando há histórico; senão navega (replace)
 * para um destino de fallback que faz sentido para a tela — ex.: o
 * roteiro comprado cai em "Meus Roteiros", o checkout cai no Carrinho.
 *
 * Uso:
 *   const router = useRouter();
 *   <TouchableOpacity onPress={() => safeBack(router, '/(tabs)/my-trips')}>
 */
import type { Router } from 'expo-router';

export function safeBack(router: Router, fallback: string = '/(tabs)') {
    if (router.canGoBack()) {
        router.back();
    } else {
        // replace (não push): o fallback substitui a entrada atual para o
        // histórico não acumular telas "voltadas".
        router.replace(fallback as any);
    }
}

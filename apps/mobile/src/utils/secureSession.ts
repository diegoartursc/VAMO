/**
 * VAMO Mobile — secureSession
 *
 * Armazenamento da sessão de auth (TravelerSession):
 *   - iOS/Android → tokens no expo-secure-store (Keychain/Keystore)
 *   - Web        → AsyncStorage (SecureStore não existe no web)
 *
 * DECISÃO (limite de ~2048 bytes do SecureStore em alguns Androids):
 * a sessão guarda o objeto do traveler inteiro (nome, email, avatar URL,
 * phone, cpf) + creator + dois JWTs. Dois JWTs sozinhos já podem passar de
 * 1KB e a URL do avatar é arbitrariamente longa — o JSON completo PODE
 * estourar 2048 bytes. Por isso, no nativo só os TOKENS (sensíveis) vão
 * pro SecureStore; o perfil (não-sensível) fica no AsyncStorage e a sessão
 * é recomposta no get.
 *
 * Migração silenciosa: no primeiro get no nativo, se não houver sessão no
 * storage seguro mas existir a chave legada '@vamo_session' no AsyncStorage,
 * ela é movida (lê → grava no seguro → remove a legada). Ninguém é deslogado.
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import type { TravelerSession } from '../services/auth';

// Chave legada (sessão inteira em texto puro) — também é a chave usada no web.
const LEGACY_KEY = '@vamo_session';
// SecureStore só aceita [A-Za-z0-9._-] em chaves — sem '@'.
const SECURE_TOKENS_KEY = 'vamo_session_tokens';
// Perfil não-sensível (traveler + creator) no nativo.
const PROFILE_KEY = '@vamo_session_profile';

const isWeb = Platform.OS === 'web';

function safeParse<T>(raw: string | null): T | null {
    if (!raw) return null;
    try {
        return JSON.parse(raw) as T;
    } catch {
        return null;
    }
}

type StoredTokens = Pick<TravelerSession, 'accessToken' | 'refreshToken'>;
type StoredProfile = Pick<TravelerSession, 'traveler' | 'creator'>;

/**
 * Lê a sessão atual. No nativo, recompõe tokens (SecureStore) + perfil
 * (AsyncStorage); na primeira chamada migra a chave legada se existir.
 */
export async function getSession(): Promise<TravelerSession | null> {
    if (isWeb) {
        return safeParse<TravelerSession>(await AsyncStorage.getItem(LEGACY_KEY));
    }

    const tokens = safeParse<StoredTokens>(await SecureStore.getItemAsync(SECURE_TOKENS_KEY));
    if (tokens) {
        const profile = safeParse<StoredProfile>(await AsyncStorage.getItem(PROFILE_KEY));
        if (!tokens.accessToken || !tokens.refreshToken || !profile?.traveler) {
            // Estado inconsistente (ex.: Keychain sobreviveu a um reinstall mas
            // o AsyncStorage não) — limpa pra não devolver sessão pela metade.
            await removeSession();
            return null;
        }
        return {
            traveler: profile.traveler,
            creator: profile.creator ?? null,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
        };
    }

    // Migração silenciosa única: legado no AsyncStorage → storage seguro.
    const legacy = safeParse<TravelerSession>(await AsyncStorage.getItem(LEGACY_KEY));
    if (!legacy) return null;
    if (!legacy.accessToken || !legacy.refreshToken) {
        await AsyncStorage.removeItem(LEGACY_KEY);
        return null;
    }
    await setSession(legacy);
    await AsyncStorage.removeItem(LEGACY_KEY);
    console.log('[secureSession] sessão legada migrada para SecureStore');
    return legacy;
}

/** Persiste a sessão (tokens no SecureStore, perfil no AsyncStorage no nativo). */
export async function setSession(session: TravelerSession): Promise<void> {
    if (isWeb) {
        await AsyncStorage.setItem(LEGACY_KEY, JSON.stringify(session));
        return;
    }
    const { accessToken, refreshToken, traveler, creator } = session;
    await SecureStore.setItemAsync(
        SECURE_TOKENS_KEY,
        JSON.stringify({ accessToken, refreshToken } satisfies StoredTokens),
    );
    await AsyncStorage.setItem(
        PROFILE_KEY,
        JSON.stringify({ traveler, creator } satisfies StoredProfile),
    );
}

/** Remove a sessão de todos os storages (inclui a chave legada). */
export async function removeSession(): Promise<void> {
    if (isWeb) {
        await AsyncStorage.removeItem(LEGACY_KEY);
        return;
    }
    await Promise.all([
        SecureStore.deleteItemAsync(SECURE_TOKENS_KEY),
        AsyncStorage.removeItem(PROFILE_KEY),
        AsyncStorage.removeItem(LEGACY_KEY),
    ]);
}

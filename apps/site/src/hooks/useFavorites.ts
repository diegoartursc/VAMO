"use client";

import { useEffect, useState, useCallback } from "react";
import { getCurrentUser } from "../lib/auth";

const BASE_KEY = "@vamo_favorites";

function storageKey(userId: string | null | undefined): string {
    return userId ? `${BASE_KEY}:${userId}` : `${BASE_KEY}:anon`;
}

function read(key: string): string[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function write(key: string, ids: string[]) {
    if (typeof window === "undefined") return;
    localStorage.setItem(key, JSON.stringify(ids));
}

/**
 * Hook de favoritos escopado por usuário (localStorage).
 * - `loaded` indica que o estado já foi lido do localStorage (após hidratação).
 *   Evita o bug onde `requiresLogin` é `true` no primeiro render e redireciona
 *   o usuário logado para o login ao clicar no coração.
 * - Anônimos: chave `:anon`
 * - Logado: chave `:userId` (isolado por traveler)
 */
export function useFavorites() {
    const [userId, setUserId] = useState<string | null>(null);
    const [ids, setIds] = useState<string[]>([]);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        const u = getCurrentUser();
        const uid = u?.id ?? null;
        setUserId(uid);
        setIds(read(storageKey(uid)));
        setLoaded(true);

        const onStorage = (e: StorageEvent) => {
            if (e.key === storageKey(uid)) setIds(read(storageKey(uid)));
        };
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);

    const isFavorite = useCallback((id: string) => ids.includes(id), [ids]);

    /** Retorna true se o item ficou favoritado, false se foi removido. */
    const toggle = useCallback((id: string): boolean => {
        const key = storageKey(userId);
        const current = read(key);
        const next = current.includes(id)
            ? current.filter((x) => x !== id)
            : [...current, id];
        write(key, next);
        setIds(next);
        return next.includes(id);
    }, [userId]);

    return {
        ids,
        isFavorite,
        toggle,
        /** true após hidratação — use para evitar redirects prematuros */
        loaded,
        /** true somente quando carregado E não há usuário logado */
        requiresLogin: loaded && !userId,
    };
}

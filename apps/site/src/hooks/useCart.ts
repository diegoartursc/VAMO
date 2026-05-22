"use client";

import { useEffect, useState, useCallback } from "react";
import { getCurrentUser } from "../lib/auth";

const BASE_KEY = "@vamo_cart";

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
 * Hook de carrinho escopado por usuário (localStorage).
 * - `loaded` indica que o estado já foi lido do localStorage (após hidratação).
 *   Evita o bug onde `requiresLogin` é `true` no primeiro render.
 * - Não permite duplicidade
 * - Anônimos: chave `:anon`
 * - Logado: chave `:userId`
 */
export function useCart() {
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

    const isInCart = useCallback((id: string) => ids.includes(id), [ids]);
    const count = ids.length;

    /** Retorna true se adicionado, false se já estava no carrinho. */
    const add = useCallback((id: string): boolean => {
        const key = storageKey(userId);
        const current = read(key);
        if (current.includes(id)) return false; // já estava
        const next = [...current, id];
        write(key, next);
        setIds(next);
        return true;
    }, [userId]);

    const remove = useCallback((id: string) => {
        const key = storageKey(userId);
        const current = read(key);
        const next = current.filter((x) => x !== id);
        write(key, next);
        setIds(next);
    }, [userId]);

    const clear = useCallback(() => {
        const key = storageKey(userId);
        write(key, []);
        setIds([]);
    }, [userId]);

    return {
        ids,
        isInCart,
        count,
        add,
        remove,
        clear,
        /** true após hidratação */
        loaded,
        /** true somente quando carregado E não há usuário logado */
        requiresLogin: loaded && !userId,
    };
}

/**
 * useAutoResize
 * Attaches to a textarea ref and auto-expands its height as the user types.
 * Usage:
 *   const taRef = useAutoResize();
 *   <textarea ref={taRef} ... />
 */
import { useRef, useEffect, useCallback } from "react";

export function useAutoResize(maxHeight = 360) {
    const ref = useRef<HTMLTextAreaElement>(null);

    const resize = useCallback(() => {
        const el = ref.current;
        if (!el) return;
        el.style.height = "auto";
        const next = Math.min(el.scrollHeight, maxHeight);
        el.style.height = `${next}px`;
        el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
    }, [maxHeight]);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        el.style.resize = "none";
        el.style.overflowY = "hidden";
        el.style.transition = "height 0.2s ease";
        resize();
        el.addEventListener("input", resize);
        return () => el.removeEventListener("input", resize);
    }, [resize]);

    return ref;
}

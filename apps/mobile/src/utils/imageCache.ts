import { Image, Platform } from 'react-native';

/**
 * Simple image prefetch cache using React Native's built-in Image.prefetch.
 * On native platforms this downloads images to disk cache.
 * On web, this pre-loads images into the browser cache.
 */

const prefetchedUrls = new Set<string>();

/**
 * Prefetch a single image URL. No-ops if already prefetched.
 */
export const prefetchImage = async (url: string): Promise<void> => {
    if (!url || prefetchedUrls.has(url)) return;

    try {
        await Image.prefetch(url);
        prefetchedUrls.add(url);
    } catch {
        // Silently fail — image will load on-demand
    }
};

/**
 * Prefetch a batch of image URLs in parallel.
 */
export const prefetchImages = async (urls: string[]): Promise<void> => {
    const unCached = urls.filter((u) => u && !prefetchedUrls.has(u));
    if (unCached.length === 0) return;

    await Promise.allSettled(unCached.map(prefetchImage));
};

/**
 * Check if an image URL has been prefetched.
 */
export const isImageCached = (url: string): boolean => prefetchedUrls.has(url);

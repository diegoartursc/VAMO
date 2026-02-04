/**
 * Analytics Service
 * 
 * Abstraction layer for analytics tracking.
 * Currently uses console.log for development.
 * Replace implementation with actual analytics provider (Mixpanel, Amplitude, GA4, etc.)
 */

interface EventProperties {
    [key: string]: string | number | boolean | undefined;
}

interface UserProperties {
    userId?: string;
    email?: string;
    name?: string;
    [key: string]: string | number | boolean | undefined;
}

class AnalyticsService {
    private initialized = false;
    private userId: string | null = null;
    private debugMode = __DEV__;

    /**
     * Initialize analytics with optional user ID
     */
    initialize(userId?: string) {
        this.initialized = true;
        if (userId) {
            this.userId = userId;
        }
        this.log('Analytics initialized', { userId });

        // TODO: Initialize your analytics provider here
        // Example: Mixpanel.init(MIXPANEL_TOKEN);
        // Example: Analytics.setup(SEGMENT_KEY);
    }

    /**
     * Identify user for tracking
     */
    identify(userId: string, properties?: UserProperties) {
        this.userId = userId;
        this.log('User identified', { userId, ...properties });

        // TODO: Call your analytics provider
        // Example: Mixpanel.identify(userId);
        // Example: Analytics.identify(userId, properties);
    }

    /**
     * Track a custom event
     */
    track(eventName: string, properties?: EventProperties) {
        const eventData = {
            ...properties,
            userId: this.userId,
            timestamp: new Date().toISOString(),
        };

        this.log(`Event: ${eventName}`, eventData);

        // TODO: Call your analytics provider
        // Example: Mixpanel.track(eventName, eventData);
        // Example: Analytics.track(eventName, eventData);
    }

    /**
     * Track screen view
     */
    screen(screenName: string, properties?: EventProperties) {
        this.track('Screen Viewed', {
            screen_name: screenName,
            ...properties,
        });
    }

    // =========================================
    // Pre-defined Events for VAMO
    // =========================================

    /** User viewed a package */
    packageViewed(packageId: string, packageName: string, price: number) {
        this.track('Package Viewed', {
            package_id: packageId,
            package_name: packageName,
            price,
        });
    }

    /** User added package to favorites */
    favoriteAdded(packageId: string, packageName: string) {
        this.track('Favorite Added', {
            package_id: packageId,
            package_name: packageName,
        });
    }

    /** User removed package from favorites */
    favoriteRemoved(packageId: string) {
        this.track('Favorite Removed', {
            package_id: packageId,
        });
    }

    /** User selected a date for booking */
    dateSelected(packageId: string, date: string) {
        this.track('Date Selected', {
            package_id: packageId,
            selected_date: date,
        });
    }

    /** User selected participants */
    participantsSelected(adults: number, children: number) {
        this.track('Participants Selected', {
            adults,
            children,
            total: adults + children,
        });
    }

    /** User viewed availability options */
    availabilityViewed(packageId: string, optionsCount: number) {
        this.track('Availability Viewed', {
            package_id: packageId,
            options_count: optionsCount,
        });
    }

    /** User started checkout */
    checkoutStarted(packageId: string, totalPrice: number) {
        this.track('Checkout Started', {
            package_id: packageId,
            total_price: totalPrice,
        });
    }

    /** User completed booking */
    bookingCompleted(bookingId: string, packageId: string, totalPrice: number) {
        this.track('Booking Completed', {
            booking_id: bookingId,
            package_id: packageId,
            total_price: totalPrice,
        });
    }

    /** User abandoned checkout */
    checkoutAbandoned(packageId: string, step: string, totalPrice: number) {
        this.track('Checkout Abandoned', {
            package_id: packageId,
            abandoned_step: step,
            total_price: totalPrice,
        });
    }

    /** User used search */
    searchPerformed(query: string, resultsCount: number, filters?: EventProperties) {
        this.track('Search Performed', {
            query,
            results_count: resultsCount,
            ...filters,
        });
    }

    /** User shared a package */
    packageShared(packageId: string, method: string) {
        this.track('Package Shared', {
            package_id: packageId,
            share_method: method,
        });
    }

    // =========================================
    // Internal
    // =========================================

    private log(message: string, data?: object) {
        if (this.debugMode) {
            console.log(`[Analytics] ${message}`, data);
        }
    }
}

// Export singleton instance
export const analytics = new AnalyticsService();
export default analytics;

import * as Haptics from 'expo-haptics';

/**
 * Haptic Feedback Service
 * Provides consistent haptic feedback throughout the app
 */

export const haptics = {
    /**
     * Light impact - Use for subtle interactions like toggling switches
     */
    light: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },

    /**
     * Medium impact - Use for confirmations and button presses
     */
    medium: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    },

    /**
     * Heavy impact - Use for important actions like completing a purchase
     */
    heavy: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    },

    /**
     * Selection changed - Use for picker/scroll selection changes
     */
    selection: () => {
        Haptics.selectionAsync();
    },

    /**
     * Success notification - Use after successful operations
     */
    success: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },

    /**
     * Warning notification - Use for warnings/alerts
     */
    warning: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    },

    /**
     * Error notification - Use after failed operations
     */
    error: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },

    /**
     * Favorite action - Custom pattern for favoriting
     */
    favorite: async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setTimeout(() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }, 100);
    },

    /**
     * Booking confirmed - Custom pattern for booking success
     */
    bookingConfirmed: async () => {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }, 200);
    },
};

export default haptics;

import React, { createContext, useContext, useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Notification, NotificationProps } from '../common/Notification';

type NotificationConfig = Omit<NotificationProps, 'id' | 'onDismiss' | 'offset'>;

interface NotificationContextData {
    showNotification: (config: NotificationConfig) => void;
    dismissNotification: (id: string) => void;
    dismissAll: () => void;
}

const NotificationContext = createContext<NotificationContextData | undefined>(undefined);

const MAX_NOTIFICATIONS = 3;
const NOTIFICATION_OFFSET = 100; // Espaçamento vertical entre notificações

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<(NotificationProps & { offset: number })[]>([]);

    const showNotification = useCallback((config: NotificationConfig) => {
        const id = `notification-${Date.now()}-${Math.random()}`;

        setNotifications((prev) => {
            // Remove a mais antiga se exceder o máximo
            const current = prev.length >= MAX_NOTIFICATIONS ? prev.slice(1) : prev;

            // Calcula o offset para a nova notificação
            const offset = current.length * NOTIFICATION_OFFSET;

            // Adiciona a nova notificação
            return [...current, { ...config, id, offset }];
        });
    }, []);

    const dismissNotification = useCallback((id: string) => {
        setNotifications((prev) => {
            const filtered = prev.filter((n) => n.id !== id);

            // Recalcula os offsets
            return filtered.map((notification, index) => ({
                ...notification,
                offset: index * NOTIFICATION_OFFSET,
            }));
        });
    }, []);

    const dismissAll = useCallback(() => {
        setNotifications([]);
    }, []);

    return (
        <NotificationContext.Provider
            value={{ showNotification, dismissNotification, dismissAll }}
        >
            {children}

            {/* Renderiza todas as notificações ativas */}
            <View style={styles.notificationContainer} pointerEvents="box-none">
                {notifications.map((notification) => (
                    <Notification
                        key={notification.id}
                        {...notification}
                        onDismiss={() => dismissNotification(notification.id)}
                    />
                ))}
            </View>
        </NotificationContext.Provider>
    );
};

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

const styles = StyleSheet.create({
    notificationContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
    },
});

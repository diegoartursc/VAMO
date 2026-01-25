import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { theme } from '../../theme/theme';

interface ChatRoom {
    id: string;
    destination: string;
    emoji: string;
    type: 'general' | 'itinerary' | 'photos';
    membersCount: number;
    lastMessage: {
        author: string;
        content: string;
        timestamp: string;
        isCreator: boolean;
    };
    unreadCount?: number;
}

const mockChatRooms: ChatRoom[] = [
    {
        id: '1',
        destination: 'Paris',
        emoji: '🗼',
        type: 'general',
        membersCount: 234,
        lastMessage: {
            author: 'Diego Artur',
            content: 'Acabei de voltar! A Torre Eiffel à noite é imperdível...',
            timestamp: '10min',
            isCreator: true,
        },
        unreadCount: 5,
    },
    {
        id: '2',
        destination: 'Cancún',
        emoji: '🏖️',
        type: 'general',
        membersCount: 189,
        lastMessage: {
            author: 'Maria Clara',
            content: 'Alguém sabe qual a melhor época para ir?',
            timestamp: '25min',
            isCreator: false,
        },
        unreadCount: 2,
    },
    {
        id: '3',
        destination: 'Machu Picchu',
        emoji: '⛰️',
        type: 'itinerary',
        membersCount: 67,
        lastMessage: {
            author: 'Pedro Henrique',
            content: 'Lembrem de levar coca tea para altitude!',
            timestamp: '1h',
            isCreator: true,
        },
    },
    {
        id: '4',
        destination: 'Tóquio',
        emoji: '🗾',
        type: 'general',
        membersCount: 156,
        lastMessage: {
            author: 'Ana Carolina',
            content: 'O JR Pass mudou as regras, vou atualizar o roteiro...',
            timestamp: '2h',
            isCreator: true,
        },
    },
    {
        id: '5',
        destination: 'Orlando',
        emoji: '🏰',
        type: 'photos',
        membersCount: 312,
        lastMessage: {
            author: 'Júlia Santos',
            content: '📸 Compartilhou 3 fotos do Magic Kingdom',
            timestamp: '3h',
            isCreator: true,
        },
        unreadCount: 12,
    },
];

interface DestinationChatsProps {
    onChatPress?: (chat: ChatRoom) => void;
    limit?: number;
}

export function DestinationChats({ onChatPress, limit }: DestinationChatsProps) {
    const chats = limit ? mockChatRooms.slice(0, limit) : mockChatRooms;

    const renderChatRoom = ({ item }: { item: ChatRoom }) => (
        <TouchableOpacity
            style={styles.chatRoom}
            onPress={() => onChatPress?.(item)}
        >
            <View style={styles.chatIcon}>
                <Text style={styles.chatEmoji}>{item.emoji}</Text>
                {item.unreadCount && item.unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                        <Text style={styles.unreadText}>{item.unreadCount}</Text>
                    </View>
                )}
            </View>

            <View style={styles.chatContent}>
                <View style={styles.chatHeader}>
                    <Text style={styles.chatDestination}>{item.destination}</Text>
                    <Text style={styles.chatTime}>{item.lastMessage.timestamp}</Text>
                </View>

                <View style={styles.chatMeta}>
                    <Text style={styles.chatType}>
                        {item.type === 'general' ? '💬 Chat' :
                            item.type === 'photos' ? '📸 Fotos' : '🎫 Roteiro'}
                    </Text>
                    <Text style={styles.chatMembers}>👥 {item.membersCount}</Text>
                </View>

                <View style={styles.lastMessage}>
                    {item.lastMessage.isCreator && (
                        <View style={styles.creatorTag}>
                            <Text style={styles.creatorTagText}>✓ Criador</Text>
                        </View>
                    )}
                    <Text style={styles.messageAuthor}>
                        {item.lastMessage.author}:
                    </Text>
                    <Text style={styles.messageContent} numberOfLines={1}>
                        {item.lastMessage.content}
                    </Text>
                </View>
            </View>

            <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>💬 Comunidade</Text>
                <Text style={styles.subtitle}>Converse com viajantes reais</Text>
            </View>

            <FlatList
                data={chats}
                keyExtractor={(item) => item.id}
                renderItem={renderChatRoom}
                scrollEnabled={false}
            />

            {limit && mockChatRooms.length > limit && (
                <TouchableOpacity
                    style={styles.seeAllButton}
                    onPress={() => Alert.alert(
                        '🗺️ Destinos Disponíveis',
                        mockChatRooms.map(c => `${c.emoji} ${c.destination}`).join('\n'),
                        [{ text: 'Fechar', style: 'default' }]
                    )}
                >
                    <Text style={styles.seeAllText}>
                        Ver todos os {mockChatRooms.length} destinos →
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: theme.colors.background,
        borderRadius: theme.borderRadius.lg,
        ...theme.shadows.medium,
        overflow: 'hidden',
    },
    header: {
        padding: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.text.primary,
    },
    subtitle: {
        fontSize: 13,
        color: theme.colors.text.secondary,
        marginTop: 4,
    },
    chatRoom: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
        gap: theme.spacing.md,
    },
    chatIcon: {
        position: 'relative',
    },
    chatEmoji: {
        fontSize: 36,
    },
    unreadBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: theme.colors.error,
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
    },
    unreadText: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: '700',
    },
    chatContent: {
        flex: 1,
    },
    chatHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    chatDestination: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    chatTime: {
        fontSize: 12,
        color: theme.colors.text.secondary,
    },
    chatMeta: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
        marginTop: 2,
    },
    chatType: {
        fontSize: 12,
        color: theme.colors.text.secondary,
    },
    chatMembers: {
        fontSize: 12,
        color: theme.colors.text.secondary,
    },
    lastMessage: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
        gap: 6,
    },
    creatorTag: {
        backgroundColor: '#E6F3FF',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    creatorTagText: {
        fontSize: 10,
        color: theme.colors.primary,
        fontWeight: '600',
    },
    messageAuthor: {
        fontSize: 13,
        fontWeight: '500',
        color: theme.colors.text.primary,
    },
    messageContent: {
        fontSize: 13,
        color: theme.colors.text.secondary,
        flex: 1,
    },
    chevron: {
        fontSize: 24,
        color: theme.colors.text.secondary,
    },
    seeAllButton: {
        padding: theme.spacing.md,
        alignItems: 'center',
    },
    seeAllText: {
        fontSize: 14,
        color: theme.colors.primary,
        fontWeight: '500',
    },
});

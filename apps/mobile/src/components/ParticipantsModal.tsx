import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ParticipantsModalProps {
    visible: boolean;
    onClose: () => void;
    onApply: (adults: number, children: number) => void;
    initialAdults?: number;
    initialChildren?: number;
}

export default function ParticipantsModal({
    visible,
    onClose,
    onApply,
    initialAdults = 1,
    initialChildren = 0,
}: ParticipantsModalProps) {
    const [adults, setAdults] = useState(initialAdults);
    const [children, setChildren] = useState(initialChildren);

    const handleApply = () => {
        onApply(adults, children);
        onClose();
    };

    const incrementAdults = () => setAdults(prev => Math.min(prev + 1, 20));
    const decrementAdults = () => setAdults(prev => Math.max(prev - 1, 1));
    const incrementChildren = () => setChildren(prev => Math.min(prev + 1, 20));
    const decrementChildren = () => setChildren(prev => Math.max(prev - 1, 0));

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <SafeAreaView style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
                        <Text style={styles.cancelText}>Cancelar</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>Participantes</Text>
                    <View style={{ width: 70 }} />
                </View>

                {/* Content */}
                <View style={styles.content}>
                    {/* Adults */}
                    <View style={styles.row}>
                        <View style={styles.labelContainer}>
                            <Text style={styles.label}>Adultos</Text>
                            <Text style={styles.sublabel}>(Idade 13-99)</Text>
                        </View>
                        <View style={styles.counter}>
                            <TouchableOpacity
                                style={[styles.counterButton, adults <= 1 && styles.counterButtonDisabled]}
                                onPress={decrementAdults}
                                disabled={adults <= 1}
                            >
                                <Ionicons
                                    name="remove-circle-outline"
                                    size={32}
                                    color={adults <= 1 ? '#666' : '#fff'}
                                />
                            </TouchableOpacity>
                            <Text style={styles.counterValue}>{adults}</Text>
                            <TouchableOpacity
                                style={[styles.counterButton, adults >= 20 && styles.counterButtonDisabled]}
                                onPress={incrementAdults}
                                disabled={adults >= 20}
                            >
                                <Ionicons
                                    name="add-circle-outline"
                                    size={32}
                                    color={adults >= 20 ? '#666' : '#14b8a6'}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Children */}
                    <View style={styles.row}>
                        <View style={styles.labelContainer}>
                            <Text style={styles.label}>Crianças</Text>
                            <Text style={styles.sublabel}>(Até 12 anos)</Text>
                        </View>
                        <View style={styles.counter}>
                            <TouchableOpacity
                                style={[styles.counterButton, children <= 0 && styles.counterButtonDisabled]}
                                onPress={decrementChildren}
                                disabled={children <= 0}
                            >
                                <Ionicons
                                    name="remove-circle-outline"
                                    size={32}
                                    color={children <= 0 ? '#666' : '#fff'}
                                />
                            </TouchableOpacity>
                            <Text style={styles.counterValue}>{children}</Text>
                            <TouchableOpacity
                                style={[styles.counterButton, children >= 20 && styles.counterButtonDisabled]}
                                onPress={incrementChildren}
                                disabled={children >= 20}
                            >
                                <Ionicons
                                    name="add-circle-outline"
                                    size={32}
                                    color={children >= 20 ? '#666' : '#14b8a6'}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Apply Button */}
                <View style={styles.footer}>
                    <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
                        <Text style={styles.applyButtonText}>Aplicar</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a1a',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#3a3a3a',
    },
    cancelButton: {
        width: 70,
    },
    cancelText: {
        color: '#14b8a6',
        fontSize: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 24,
    },
    labelContainer: {
        flex: 1,
    },
    label: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 4,
    },
    sublabel: {
        fontSize: 14,
        color: '#999',
    },
    counter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
    },
    counterButton: {
        padding: 4,
    },
    counterButtonDisabled: {
        opacity: 0.3,
    },
    counterValue: {
        fontSize: 20,
        fontWeight: '600',
        color: '#fff',
        minWidth: 30,
        textAlign: 'center',
    },
    divider: {
        height: 1,
        backgroundColor: '#3a3a3a',
    },
    footer: {
        padding: 20,
        paddingBottom: 40,
    },
    applyButton: {
        backgroundColor: '#14b8a6',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    applyButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
    },
});

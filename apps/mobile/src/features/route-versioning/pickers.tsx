/**
 * pickers — DatePickerField e TimePickerField duplicados de
 * `app/new-itinerary.tsx` para uso nos modais de Editar/Adicionar
 * item do roteiro.
 *
 * Os originais não são exportáveis (componentes locais à tela), então
 * duplicamos com o mesmo comportamento cross-platform (web → input
 * HTML invisível; iOS → spinner em Modal; Android → dialog nativo).
 *
 * Pequenas diferenças vs original:
 *  - Estilos próprios (sem dependência do `s` de new-itinerary).
 *  - Sem suporte a `requiredAsterisk` complexo — usamos `*` simples.
 */

import React, { useRef, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    StyleSheet,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

import { theme } from '../../theme/theme';
import VamoTimePicker from '../../components/dashboard/VamoTimePicker';

// ─── Helpers ─────────────────────────────────────────────────

export function parseISODate(iso: string): Date | null {
    if (!iso) return null;
    const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return isNaN(d.getTime()) ? null : d;
}

export function toISODate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

export function formatDateBR(iso: string): string {
    const d = parseISODate(iso);
    if (!d) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}/${m}/${d.getFullYear()}`;
}

export function parseHHMM(hhmm: string): { h: number; m: number } | null {
    if (!hhmm) return null;
    const match = hhmm.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;
    const h = Number(match[1]);
    const m = Number(match[2]);
    if (h < 0 || h > 23 || m < 0 || m > 59) return null;
    return { h, m };
}

// ─── DatePickerField ─────────────────────────────────────────

export function DatePickerField({
    label,
    value,
    onChange,
    required,
    placeholder = 'Selecionar data',
}: {
    label: string;
    value: string;
    onChange: (iso: string) => void;
    required?: boolean;
    placeholder?: string;
}) {
    const [open, setOpen] = useState(false);
    const [tempDate, setTempDate] = useState<Date>(() => parseISODate(value) || new Date());
    const webInputRef = useRef<any>(null);
    const display = value ? formatDateBR(value) : '';

    function openPicker() {
        setTempDate(parseISODate(value) || new Date());
        setOpen(true);
    }

    function onPickerChange(event: DateTimePickerEvent, selected?: Date) {
        if (Platform.OS === 'android') {
            setOpen(false);
            if (event.type === 'set' && selected) {
                onChange(toISODate(selected));
            }
        } else if (selected) {
            setTempDate(selected);
        }
    }

    if (Platform.OS === 'web') {
        return (
            <View style={styles.wrap}>
                <Text style={styles.label}>
                    {label}
                    {required ? <Text style={styles.required}> *</Text> : null}
                </Text>
                <View style={styles.fieldRow}>
                    {/* @ts-ignore — div nativo no Expo Web */}
                    <div style={styles.webContainer}>
                        <View style={[styles.field, { flex: 1, position: 'relative' }]}>
                            <Ionicons name="calendar-outline" size={16} color={theme.colors.primary} />
                            <Text style={[styles.fieldText, !value && styles.placeholderText]}>
                                {display || placeholder}
                            </Text>
                            {/* @ts-ignore — input HTML nativo */}
                            <input
                                ref={webInputRef}
                                type="date"
                                aria-label={label}
                                value={value || ''}
                                onChange={(e: any) => onChange(e?.target?.value || '')}
                                onClick={() => { try { webInputRef.current?.showPicker?.(); } catch {} }}
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    opacity: 0,
                                    cursor: 'pointer',
                                    width: '100%',
                                    height: '100%',
                                    border: 'none',
                                    background: 'transparent',
                                }}
                            />
                        </View>
                    {/* @ts-ignore */}
                    </div>
                    {value ? (
                        <TouchableOpacity
                            style={styles.clearBtn}
                            onPress={() => onChange('')}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="close" size={16} color={theme.colors.text.tertiary} />
                        </TouchableOpacity>
                    ) : null}
                </View>
            </View>
        );
    }

    return (
        <View style={styles.wrap}>
            <Text style={styles.label}>
                {label}
                {required ? <Text style={styles.required}> *</Text> : null}
            </Text>
            <View style={styles.fieldRow}>
                <TouchableOpacity
                    style={[styles.field, { flex: 1 }]}
                    onPress={openPicker}
                    activeOpacity={0.75}
                >
                    <Ionicons name="calendar-outline" size={16} color={theme.colors.primary} />
                    <Text style={[styles.fieldText, !value && styles.placeholderText]}>
                        {display || placeholder}
                    </Text>
                </TouchableOpacity>
                {value ? (
                    <TouchableOpacity
                        style={styles.clearBtn}
                        onPress={() => onChange('')}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="close" size={16} color={theme.colors.text.tertiary} />
                    </TouchableOpacity>
                ) : null}
            </View>

            {open && Platform.OS === 'ios' ? (
                <Modal transparent animationType="fade" visible={open} onRequestClose={() => setOpen(false)}>
                    <TouchableOpacity style={styles.modalBg} activeOpacity={1} onPress={() => setOpen(false)}>
                        <TouchableOpacity activeOpacity={1} style={styles.modalCard}>
                            <Text style={styles.modalTitle}>{label}</Text>
                            <DateTimePicker
                                value={tempDate}
                                mode="date"
                                display="spinner"
                                onChange={onPickerChange}
                                themeVariant="light"
                                locale="pt-BR"
                            />
                            <View style={styles.modalActions}>
                                <TouchableOpacity style={styles.modalGhost} onPress={() => setOpen(false)}>
                                    <Text style={styles.modalGhostText}>Cancelar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.modalPrimary}
                                    onPress={() => { onChange(toISODate(tempDate)); setOpen(false); }}
                                >
                                    <Text style={styles.modalPrimaryText}>Confirmar</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </Modal>
            ) : null}

            {open && Platform.OS === 'android' ? (
                <DateTimePicker
                    value={tempDate}
                    mode="date"
                    display="default"
                    onChange={onPickerChange}
                />
            ) : null}
        </View>
    );
}

// ─── TimePickerField ─────────────────────────────────────────

export function TimePickerField(props: {
    label: string;
    value: string;
    onChange: (hhmm: string) => void;
    required?: boolean;
    placeholder?: string;
}) {
    return <VamoTimePicker {...props} minuteStep={5} />;
}

// ─── Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
    wrap: {
        marginBottom: 14,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.text.secondary,
        marginBottom: 6,
    },
    required: {
        color: theme.colors.error,
    },
    fieldRow: {
        flexDirection: 'row',
        alignItems: 'stretch',
        gap: 6,
    },
    webContainer: {
        flex: 1,
        position: 'relative',
        borderRadius: 12,
    } as any,
    field: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
        paddingHorizontal: 14,
        paddingVertical: 12,
        minHeight: 46,
    },
    fieldText: {
        fontSize: 15,
        color: theme.colors.text.primary,
        flex: 1,
    },
    placeholderText: {
        color: theme.colors.text.tertiary,
    },
    clearBtn: {
        width: 44,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },

    modalBg: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    modalCard: {
        width: '100%',
        maxWidth: 380,
        backgroundColor: '#fff',
        borderRadius: 18,
        padding: 16,
    },
    modalTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 8,
        textAlign: 'center',
    },
    modalActions: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 8,
    },
    modalGhost: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        backgroundColor: theme.colors.borderLight,
    },
    modalGhostText: {
        fontWeight: '700',
        color: theme.colors.text.primary,
    },
    modalPrimary: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        backgroundColor: theme.colors.primary,
    },
    modalPrimaryText: {
        fontWeight: '700',
        color: '#fff',
    },
});

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Clock, X } from 'lucide-react-native';
import { theme } from '../../theme/theme';
import { haptics } from '../../services/haptics';
import {
    to12HourParts,
    to24HourTime,
    to12HourTime,
    type Meridiem,
} from '@vamo/shared/itinerary';

export interface VamoTimePickerProps {
    label: string;
    value: string; // "HH:mm" 24h. Empty = unset.
    onChange: (hhmm: string) => void;
    required?: boolean;
    placeholder?: string;
    minuteStep?: number; // Default 5
}

type Mode = 'hours' | 'minutes';
// Conversão 12h↔24h centralizada em @vamo/shared/itinerary (time.ts).
type Period = Meridiem;

const CLOCK_DIAMETER = 280;
const NUMBER_SIZE = 40;
const RADIUS = (CLOCK_DIAMETER - NUMBER_SIZE) / 2;
const CENTER = CLOCK_DIAMETER / 2;

// Snap minute to nearest multiple of step
function snapMinute(minute: number, step: number): number {
    if (step <= 1) return minute;
    const snapped = Math.round(minute / step) * step;
    return snapped >= 60 ? 0 : snapped;
}

// 12h display, e.g. "9:30"
function formatDisplay(hour12: number, minute: number): { h: string; m: string } {
    return { h: String(hour12), m: String(minute).padStart(2, '0') };
}

export default function VamoTimePicker({
    label,
    value,
    onChange,
    required,
    placeholder = '9:00 AM',
    minuteStep = 5,
}: VamoTimePickerProps): React.ReactElement {
    const insets = useSafeAreaInsets();
    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState<Mode>('hours');
    const [hour12, setHour12] = useState<number>(9);
    const [minute, setMinute] = useState<number>(0);
    const [period, setPeriod] = useState<Period>('AM');

    const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (autoAdvanceTimer.current) {
                clearTimeout(autoAdvanceTimer.current);
                autoAdvanceTimer.current = null;
            }
        };
    }, []);

    const initFromValueOrNow = useCallback(() => {
        const parsed = to12HourParts(value);
        if (parsed) {
            setHour12(parsed.hour12);
            setMinute(snapMinute(parsed.minute, minuteStep));
            setPeriod(parsed.period);
        } else {
            const now = new Date();
            const h = now.getHours();
            const m = now.getMinutes();
            const p: Period = h >= 12 ? 'PM' : 'AM';
            let h12 = h % 12;
            if (h12 === 0) h12 = 12;
            setHour12(h12);
            setMinute(snapMinute(m, minuteStep));
            setPeriod(p);
        }
        setMode('hours');
    }, [value, minuteStep]);

    const handleOpen = useCallback(() => {
        initFromValueOrNow();
        setOpen(true);
        haptics.light();
    }, [initFromValueOrNow]);

    const handleClose = useCallback(() => {
        if (autoAdvanceTimer.current) {
            clearTimeout(autoAdvanceTimer.current);
            autoAdvanceTimer.current = null;
        }
        setOpen(false);
    }, []);

    const handleConfirm = useCallback(() => {
        const out = to24HourTime(hour12, minute, period);
        haptics.success();
        onChange(out);
        handleClose();
    }, [hour12, minute, period, onChange, handleClose]);

    const handleClear = useCallback(() => {
        haptics.light();
        onChange('');
    }, [onChange]);

    const pickHour = useCallback(
        (h: number) => {
            haptics.selection();
            setHour12(h);
            if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
            autoAdvanceTimer.current = setTimeout(() => {
                setMode('minutes');
            }, 250);
        },
        [],
    );

    const pickMinute = useCallback((m: number) => {
        haptics.selection();
        setMinute(m);
    }, []);

    const switchPeriod = useCallback((p: Period) => {
        haptics.light();
        setPeriod(p);
    }, []);

    const minuteValues = useMemo(() => {
        const step = Math.max(1, Math.min(30, Math.floor(minuteStep)));
        const arr: number[] = [];
        for (let m = 0; m < 60; m += step) arr.push(m);
        return arr;
    }, [minuteStep]);

    const hourValues = useMemo(() => {
        // Standard clock order: 12 at top (i=0), 1, 2, ... 11
        const arr: number[] = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
        return arr;
    }, []);

    const display = formatDisplay(hour12, minute);

    // Compute positions for any item index i out of total n
    const positionFor = useCallback((i: number, total: number) => {
        const angle = ((i * 360) / total - 90) * (Math.PI / 180);
        const x = CENTER + Math.cos(angle) * RADIUS;
        const y = CENTER + Math.sin(angle) * RADIUS;
        return {
            left: x - NUMBER_SIZE / 2,
            top: y - NUMBER_SIZE / 2,
        };
    }, []);

    // Compute hand endpoint (for the line from center)
    const handEndpoint = useMemo(() => {
        if (mode === 'hours') {
            // 12 at top, then 1..11 clockwise. Index of hour12 in [12,1,2..11]
            const idx = hour12 === 12 ? 0 : hour12;
            const angle = ((idx * 360) / 12 - 90) * (Math.PI / 180);
            const x = CENTER + Math.cos(angle) * RADIUS;
            const y = CENTER + Math.sin(angle) * RADIUS;
            return { x, y, angle };
        }
        const total = minuteValues.length;
        const idx = minuteValues.indexOf(minute);
        const safeIdx = idx < 0 ? 0 : idx;
        const angle = ((safeIdx * 360) / total - 90) * (Math.PI / 180);
        const x = CENTER + Math.cos(angle) * RADIUS;
        const y = CENTER + Math.sin(angle) * RADIUS;
        return { x, y, angle };
    }, [mode, hour12, minute, minuteValues]);

    // The "hand": a thin teal line from center to selected number using a rotated View
    const handLength = RADIUS - NUMBER_SIZE / 2;
    const handAngleDeg = (handEndpoint.angle * 180) / Math.PI;

    const hasValue = !!value && to12HourParts(value) !== null;
    const displayValue = hasValue ? to12HourTime(value) : placeholder;

    return (
        <View style={styles.wrap}>
            <Text style={styles.label}>
                {label}
                {required ? <Text style={styles.required}> *</Text> : null}
            </Text>
            <Pressable
                onPress={handleOpen}
                style={({ pressed }) => [styles.field, pressed && styles.fieldPressed]}
                accessibilityRole="button"
                accessibilityLabel={`${label}, ${displayValue}`}
            >
                <Clock size={18} color={theme.colors.text.secondary} />
                <Text style={hasValue ? styles.fieldText : styles.fieldPlaceholder}>
                    {displayValue}
                </Text>
                {hasValue ? (
                    <Pressable
                        onPress={handleClear}
                        hitSlop={8}
                        style={styles.clearBtn}
                        accessibilityRole="button"
                        accessibilityLabel="Limpar horário"
                    >
                        <X size={16} color={theme.colors.text.tertiary} />
                    </Pressable>
                ) : null}
            </Pressable>

            <Modal
                visible={open}
                transparent
                animationType="slide"
                onRequestClose={handleClose}
                statusBarTranslucent
            >
                <TouchableWithoutFeedback onPress={handleClose}>
                    <View style={styles.backdrop} />
                </TouchableWithoutFeedback>

                <View
                    style={[
                        styles.sheet,
                        { paddingBottom: Math.max(insets.bottom + 12, 24) },
                    ]}
                >
                    <View style={styles.handle} />
                    <Text style={styles.title}>Selecionar horário</Text>

                    {/* Time display */}
                    <View style={styles.timeDisplay}>
                        <Pressable
                            onPress={() => {
                                haptics.light();
                                setMode('hours');
                            }}
                            accessibilityRole="button"
                            accessibilityLabel="Editar hora"
                        >
                            <Text
                                style={[
                                    styles.timeDigit,
                                    mode === 'hours' && styles.timeDigitActive,
                                ]}
                            >
                                {display.h}
                            </Text>
                        </Pressable>
                        <Text style={styles.timeColon}>:</Text>
                        <Pressable
                            onPress={() => {
                                haptics.light();
                                setMode('minutes');
                            }}
                            accessibilityRole="button"
                            accessibilityLabel="Editar minutos"
                        >
                            <Text
                                style={[
                                    styles.timeDigit,
                                    mode === 'minutes' && styles.timeDigitActive,
                                ]}
                            >
                                {display.m}
                            </Text>
                        </Pressable>
                        <Text style={styles.timePeriod}>{period}</Text>
                    </View>

                    {/* Clock face */}
                    <View style={styles.clockWrap}>
                        <View style={styles.clockFace}>
                            {/* Hand line */}
                            <View
                                pointerEvents="none"
                                style={[
                                    styles.hand,
                                    {
                                        width: handLength,
                                        left: CENTER,
                                        top: CENTER - 1,
                                        transform: [
                                            { translateX: 0 },
                                            { rotate: `${handAngleDeg}deg` },
                                        ],
                                    },
                                ]}
                            />
                            {/* Center dot */}
                            <View pointerEvents="none" style={styles.centerDot} />

                            {mode === 'hours'
                                ? hourValues.map((h, i) => {
                                      const pos = positionFor(i, 12);
                                      const selected = h === hour12;
                                      return (
                                          <Pressable
                                              key={`h-${h}`}
                                              onPress={() => pickHour(h)}
                                              style={[
                                                  styles.numberCell,
                                                  pos,
                                                  selected && styles.numberCellSelected,
                                              ]}
                                              accessibilityRole="button"
                                              accessibilityLabel={`Hora ${h}`}
                                          >
                                              <Text
                                                  style={[
                                                      styles.numberText,
                                                      selected && styles.numberTextSelected,
                                                  ]}
                                              >
                                                  {h}
                                              </Text>
                                          </Pressable>
                                      );
                                  })
                                : minuteValues.map((m, i) => {
                                      const pos = positionFor(i, minuteValues.length);
                                      const selected = m === minute;
                                      return (
                                          <Pressable
                                              key={`m-${m}`}
                                              onPress={() => pickMinute(m)}
                                              style={[
                                                  styles.numberCell,
                                                  pos,
                                                  selected && styles.numberCellSelected,
                                              ]}
                                              accessibilityRole="button"
                                              accessibilityLabel={`Minuto ${m}`}
                                          >
                                              <Text
                                                  style={[
                                                      styles.numberText,
                                                      selected && styles.numberTextSelected,
                                                  ]}
                                              >
                                                  {String(m).padStart(2, '0')}
                                              </Text>
                                          </Pressable>
                                      );
                                  })}
                        </View>
                    </View>

                    {/* AM/PM toggle */}
                    <View style={styles.periodWrap}>
                        <Pressable
                            onPress={() => switchPeriod('AM')}
                            style={[
                                styles.periodBtn,
                                period === 'AM' && styles.periodBtnActive,
                            ]}
                            accessibilityRole="button"
                            accessibilityLabel="Definir AM"
                        >
                            <Text
                                style={[
                                    styles.periodText,
                                    period === 'AM' && styles.periodTextActive,
                                ]}
                            >
                                AM
                            </Text>
                        </Pressable>
                        <Pressable
                            onPress={() => switchPeriod('PM')}
                            style={[
                                styles.periodBtn,
                                period === 'PM' && styles.periodBtnActive,
                            ]}
                            accessibilityRole="button"
                            accessibilityLabel="Definir PM"
                        >
                            <Text
                                style={[
                                    styles.periodText,
                                    period === 'PM' && styles.periodTextActive,
                                ]}
                            >
                                PM
                            </Text>
                        </Pressable>
                    </View>

                    {/* Actions */}
                    <View style={styles.actions}>
                        <Pressable
                            onPress={handleClose}
                            style={styles.cancelBtn}
                            accessibilityRole="button"
                            accessibilityLabel="Cancelar"
                        >
                            <Text style={styles.cancelText}>Cancelar</Text>
                        </Pressable>
                        <Pressable
                            onPress={handleConfirm}
                            style={({ pressed }) => [
                                styles.confirmBtn,
                                pressed && { opacity: 0.9 },
                            ]}
                            accessibilityRole="button"
                            accessibilityLabel="Confirmar"
                        >
                            <Text style={styles.confirmText}>Confirmar</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        marginBottom: 12,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text.primary,
        marginBottom: 6,
    },
    required: {
        color: theme.colors.error,
        fontWeight: '700',
    },
    field: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        minHeight: 48,
        ...(Platform.OS === 'web'
            ? ({ cursor: 'pointer' } as object)
            : null),
    },
    fieldPressed: {
        backgroundColor: theme.colors.surfaceHighlight,
    },
    fieldText: {
        flex: 1,
        fontSize: 16,
        color: theme.colors.text.primary,
        fontWeight: '500',
    },
    fieldPlaceholder: {
        flex: 1,
        fontSize: 16,
        color: theme.colors.text.tertiary,
    },
    clearBtn: {
        padding: 4,
        borderRadius: 999,
    },

    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    sheet: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 10,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    handle: {
        width: 36,
        height: 4,
        borderRadius: 999,
        backgroundColor: '#CBD5E1',
        marginBottom: 12,
    },
    title: {
        fontSize: 17,
        fontWeight: '700',
        color: theme.colors.secondary,
        marginBottom: 14,
    },

    timeDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 18,
    },
    timeDigit: {
        fontSize: 44,
        fontWeight: '700',
        color: theme.colors.secondary,
        paddingHorizontal: 6,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    timeDigitActive: {
        color: theme.colors.primary,
        borderBottomColor: theme.colors.primary,
    },
    timeColon: {
        fontSize: 44,
        fontWeight: '700',
        color: theme.colors.secondary,
        marginHorizontal: 2,
    },
    timePeriod: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.text.secondary,
        marginLeft: 10,
    },

    clockWrap: {
        width: CLOCK_DIAMETER,
        height: CLOCK_DIAMETER,
        marginBottom: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    clockFace: {
        width: CLOCK_DIAMETER,
        height: CLOCK_DIAMETER,
        borderRadius: CLOCK_DIAMETER / 2,
        backgroundColor: theme.colors.surfaceLight,
        position: 'relative',
    },
    hand: {
        position: 'absolute',
        height: 2,
        backgroundColor: theme.colors.primary,
        transformOrigin: '0% 50%',
        // RN ignores transformOrigin on most platforms; we offset via left=CENTER and width=handLength
        // and rotate around the left edge by setting left to center.
        borderRadius: 1,
        opacity: 0.85,
    },
    centerDot: {
        position: 'absolute',
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: theme.colors.primary,
        left: CENTER - 4,
        top: CENTER - 4,
    },
    numberCell: {
        position: 'absolute',
        width: NUMBER_SIZE,
        height: NUMBER_SIZE,
        borderRadius: NUMBER_SIZE / 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    numberCellSelected: {
        backgroundColor: theme.colors.primary,
    },
    numberText: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.secondary,
    },
    numberTextSelected: {
        color: '#FFFFFF',
    },

    periodWrap: {
        flexDirection: 'row',
        backgroundColor: theme.colors.borderLight,
        padding: 4,
        borderRadius: 999,
        marginBottom: 18,
    },
    periodBtn: {
        paddingHorizontal: 28,
        paddingVertical: 10,
        borderRadius: 999,
    },
    periodBtnActive: {
        backgroundColor: theme.colors.primary,
    },
    periodText: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.colors.secondary,
        letterSpacing: 0.5,
    },
    periodTextActive: {
        color: '#FFFFFF',
    },

    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        width: '100%',
        marginTop: 4,
    },
    cancelBtn: {
        flex: 1,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
    },
    cancelText: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.secondary,
    },
    confirmBtn: {
        flex: 1,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 999,
        backgroundColor: theme.colors.primary,
    },
    confirmText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});

import React, { useState, useMemo } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Platform, StatusBar, Alert, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { theme } from '../../src/theme/theme';
import { haptics } from '../../src/services/haptics';
import {
    getCreatorItineraryById,
    EMPTY_ITINERARY_TEMPLATE,
} from '../../src/data/mockCreatorDashboard';
import {
    PurchasedItinerary,
    ItineraryDay,
    DayActivity,
    EmergencyContact,
    ChecklistItem,
    AccommodationOption,
} from '../../src/data/mockPurchasedItineraries';
import FormInput from '../../src/components/dashboard/FormInput';
import EditableList from '../../src/components/dashboard/EditableList';
import SectionCard from '../../src/components/dashboard/SectionCard';

// ── Activity type options ──────────────────────────────────
const ACTIVITY_TYPES: { value: DayActivity['type']; label: string; icon: string }[] = [
    { value: 'activity', label: 'Atividade', icon: '🎯' },
    { value: 'meal', label: 'Refeição', icon: '🍽️' },
    { value: 'transport', label: 'Transporte', icon: '🚇' },
    { value: 'rest', label: 'Descanso', icon: '😴' },
];

const CHECKLIST_CATEGORIES: { value: ChecklistItem['category']; label: string }[] = [
    { value: 'documents', label: '📄 Documentos' },
    { value: 'packing', label: '🧳 Bagagem' },
    { value: 'pre-trip', label: '✈️ Pré-viagem' },
    { value: 'custom', label: '📋 Outros' },
];

export default function EditItineraryScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const isNew = id === 'new';

    // Load data
    const existingData = isNew ? null : getCreatorItineraryById(id);
    const initialData = existingData?.itinerary || {
        ...EMPTY_ITINERARY_TEMPLATE,
        id: `itinerary-${Date.now()}`,
    };

    // ── FORM STATE ─────────────────────────────────────────
    // Basic
    const [title, setTitle] = useState(initialData.title);
    const [destination, setDestination] = useState(initialData.destination);
    const [country, setCountry] = useState(initialData.country);
    const [description, setDescription] = useState(initialData.description);
    const [price, setPrice] = useState(initialData.price.toString());
    const [duration, setDuration] = useState(initialData.duration.toString());
    const [images, setImages] = useState<string[]>(initialData.images);
    const [highlights, setHighlights] = useState<string[]>(initialData.highlights || []);
    const [inclusions, setInclusions] = useState<string[]>(initialData.inclusions || []);

    // Spending
    const [spendingMin, setSpendingMin] = useState(
        initialData.estimatedSpending?.min?.toString() || ''
    );
    const [spendingMax, setSpendingMax] = useState(
        initialData.estimatedSpending?.max?.toString() || ''
    );
    const [spendingCurrency, setSpendingCurrency] = useState(
        initialData.estimatedSpending?.currency || 'R$'
    );
    const [spendingBreakdown, setSpendingBreakdown] = useState<
        { category: string; amount: string; description: string }[]
    >(
        initialData.estimatedSpending?.breakdown?.map(b => ({
            category: b.category,
            amount: b.amount,
            description: b.description,
        })) || []
    );

    // Days & Activities
    const [days, setDays] = useState<ItineraryDay[]>(initialData.days || []);

    // Flight Info
    const [flightOutAirline, setFlightOutAirline] = useState(initialData.flightInfo?.outbound?.airline || '');
    const [flightOutRoute, setFlightOutRoute] = useState(initialData.flightInfo?.outbound?.route || '');
    const [flightOutDeparture, setFlightOutDeparture] = useState(initialData.flightInfo?.outbound?.departure || '');
    const [flightOutArrival, setFlightOutArrival] = useState(initialData.flightInfo?.outbound?.arrival || '');
    const [flightOutDuration, setFlightOutDuration] = useState(initialData.flightInfo?.outbound?.duration || '');
    const [flightOutStops, setFlightOutStops] = useState(initialData.flightInfo?.outbound?.stops?.toString() || '0');
    const [flightOutPrice, setFlightOutPrice] = useState(initialData.flightInfo?.outbound?.pricePaid || '');

    const [flightRetAirline, setFlightRetAirline] = useState(initialData.flightInfo?.return?.airline || '');
    const [flightRetRoute, setFlightRetRoute] = useState(initialData.flightInfo?.return?.route || '');
    const [flightRetDeparture, setFlightRetDeparture] = useState(initialData.flightInfo?.return?.departure || '');
    const [flightRetArrival, setFlightRetArrival] = useState(initialData.flightInfo?.return?.arrival || '');
    const [flightRetDuration, setFlightRetDuration] = useState(initialData.flightInfo?.return?.duration || '');
    const [flightRetStops, setFlightRetStops] = useState(initialData.flightInfo?.return?.stops?.toString() || '0');
    const [flightRetPrice, setFlightRetPrice] = useState(initialData.flightInfo?.return?.pricePaid || '');

    const [flightTips, setFlightTips] = useState<string[]>(initialData.flightInfo?.tips || []);

    // Accommodation Options
    const [accommodationOptions, setAccommodationOptions] = useState<AccommodationOption[]>(
        initialData.accommodationOptions || []
    );

    // Transport
    const [transportMainMode, setTransportMainMode] = useState(initialData.transport?.mainMode || '');
    const [transportDescription, setTransportDescription] = useState(initialData.transport?.description || '');
    const [transportPasses, setTransportPasses] = useState<{ name: string; price: string; description: string }[]>(
        initialData.transport?.passes || []
    );
    const [transportTips, setTransportTips] = useState<string[]>(initialData.transport?.tips || []);

    // Important Info
    const [importantInfo, setImportantInfo] = useState<string[]>(initialData.importantInfo || []);

    // Checklist
    const [checklist, setChecklist] = useState<ChecklistItem[]>(initialData.checklist || []);

    // Emergency Contacts
    const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>(
        initialData.emergencyContacts || []
    );

    // Receive list
    const [receiveList, setReceiveList] = useState<{ icon: string; label: string }[]>(
        initialData.receiveList || EMPTY_ITINERARY_TEMPLATE.receiveList || []
    );

    // ── HANDLERS ───────────────────────────────────────────
    const handleSave = () => {
        haptics.success();
        Alert.alert('✅ Salvo!', 'Rascunho salvo com sucesso.');
    };

    const handlePreview = () => {
        haptics.light();
        if (initialData.id && initialData.id !== '') {
            router.push(`/itinerary/${initialData.id}` as any);
        } else {
            Alert.alert('Preview', 'O preview estará disponível após salvar o roteiro.');
        }
    };

    // ── COMPLETION STATUS ──────────────────────────────────
    const getStatus = (filled: boolean) =>
        filled ? ('complete' as const) : ('empty' as const);

    // ── ADD DAY ────────────────────────────────────────────
    const addDay = () => {
        const newDay: ItineraryDay = {
            dayNumber: days.length + 1,
            title: `Dia ${days.length + 1}`,
            summary: '',
            activities: [],
        };
        setDays([...days, newDay]);
    };

    const removeDay = (index: number) => {
        const updated = days.filter((_, i) => i !== index).map((d, i) => ({
            ...d,
            dayNumber: i + 1,
            title: d.title.startsWith('Dia ') ? `Dia ${i + 1}` : d.title,
        }));
        setDays(updated);
    };

    const updateDay = (index: number, field: keyof ItineraryDay, value: any) => {
        const updated = [...days];
        (updated[index] as any)[field] = value;
        setDays(updated);
    };

    // ── ADD ACTIVITY ───────────────────────────────────────
    const addActivity = (dayIndex: number) => {
        const updated = [...days];
        const newActivity: DayActivity = {
            id: `act-${Date.now()}`,
            time: '',
            duration: '',
            title: '',
            location: '',
            description: '',
            images: [],
            tips: [],
            type: 'activity',
            icon: '🎯',
        };
        updated[dayIndex].activities.push(newActivity);
        setDays(updated);
    };

    const removeActivity = (dayIndex: number, actIndex: number) => {
        const updated = [...days];
        updated[dayIndex].activities = updated[dayIndex].activities.filter((_, i) => i !== actIndex);
        setDays(updated);
    };

    const updateActivity = (dayIndex: number, actIndex: number, field: keyof DayActivity, value: any) => {
        const updated = [...days];
        (updated[dayIndex].activities[actIndex] as any)[field] = value;
        setDays(updated);
    };

    // ── ADD SPENDING CATEGORY ──────────────────────────────
    const addSpendingCategory = () => {
        setSpendingBreakdown([...spendingBreakdown, { category: '', amount: '', description: '' }]);
    };

    const removeSpendingCategory = (index: number) => {
        setSpendingBreakdown(spendingBreakdown.filter((_, i) => i !== index));
    };

    const updateSpendingCategory = (index: number, field: string, value: string) => {
        const updated = [...spendingBreakdown];
        (updated[index] as any)[field] = value;
        setSpendingBreakdown(updated);
    };

    // ── ADD ACCOMMODATION OPTION ───────────────────────────
    const addAccommodation = () => {
        setAccommodationOptions([
            ...accommodationOptions,
            { id: `acc-${Date.now()}`, name: '', priceRange: '', location: '', description: '' },
        ]);
    };

    const removeAccommodation = (index: number) => {
        setAccommodationOptions(accommodationOptions.filter((_, i) => i !== index));
    };

    const updateAccommodation = (index: number, field: keyof AccommodationOption, value: any) => {
        const updated = [...accommodationOptions];
        (updated[index] as any)[field] = value;
        setAccommodationOptions(updated);
    };

    // ── TRANSPORT PASSES ───────────────────────────────────
    const addTransportPass = () => {
        setTransportPasses([...transportPasses, { name: '', price: '', description: '' }]);
    };

    const removeTransportPass = (index: number) => {
        setTransportPasses(transportPasses.filter((_, i) => i !== index));
    };

    const updateTransportPass = (index: number, field: string, value: string) => {
        const updated = [...transportPasses];
        (updated[index] as any)[field] = value;
        setTransportPasses(updated);
    };

    // ── CHECKLIST ──────────────────────────────────────────
    const addChecklistItem = (category: ChecklistItem['category']) => {
        setChecklist([
            ...checklist,
            { id: `chk-${Date.now()}`, category, text: '', completed: false },
        ]);
    };

    const removeChecklistItem = (index: number) => {
        setChecklist(checklist.filter((_, i) => i !== index));
    };

    const updateChecklistItem = (index: number, text: string) => {
        const updated = [...checklist];
        updated[index].text = text;
        setChecklist(updated);
    };

    // ── EMERGENCY CONTACTS ─────────────────────────────────
    const addEmergencyContact = () => {
        setEmergencyContacts([
            ...emergencyContacts,
            { type: '', name: '', phone: '', available: '' },
        ]);
    };

    const removeEmergencyContact = (index: number) => {
        setEmergencyContacts(emergencyContacts.filter((_, i) => i !== index));
    };

    const updateEmergencyContact = (index: number, field: keyof EmergencyContact, value: string) => {
        const updated = [...emergencyContacts];
        (updated[index] as any)[field] = value;
        setEmergencyContacts(updated);
    };

    // ── RECEIVE LIST ───────────────────────────────────────
    const addReceiveItem = () => {
        setReceiveList([...receiveList, { icon: '📋', label: '' }]);
    };

    const removeReceiveItem = (index: number) => {
        setReceiveList(receiveList.filter((_, i) => i !== index));
    };

    const updateReceiveItem = (index: number, field: 'icon' | 'label', value: string) => {
        const updated = [...receiveList];
        updated[index][field] = value;
        setReceiveList(updated);
    };

    // ── PROGRESS ───────────────────────────────────────────
    const sections = [
        { filled: title && destination && country },
        { filled: description.length > 10 },
        { filled: images.length > 0 },
        { filled: highlights.length > 0 },
        { filled: spendingBreakdown.length > 0 },
        { filled: days.length > 0 },
        { filled: !!flightOutAirline },
        { filled: accommodationOptions.length > 0 },
        { filled: !!transportMainMode },
        { filled: importantInfo.length > 0 },
        { filled: checklist.length > 0 },
        { filled: emergencyContacts.length > 0 },
    ];
    const filledCount = sections.filter(s => s.filled).length;
    const progress = Math.round((filledCount / sections.length) * 100);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* ═══ FIXED TOP BAR ═══ */}
            <LinearGradient
                colors={[theme.colors.gradientTop, theme.colors.gradientBottom]}
                style={styles.topBar}
            >
                <TouchableOpacity style={styles.topBarBtn} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={22} color="#fff" />
                </TouchableOpacity>

                <View style={styles.topBarCenter}>
                    <Text style={styles.topBarTitle} numberOfLines={1}>
                        {isNew ? 'Novo Roteiro' : 'Editar Roteiro'}
                    </Text>
                    <View style={styles.progressBarContainer}>
                        <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
                    </View>
                    <Text style={styles.progressText}>{progress}% completo</Text>
                </View>

                <View style={styles.topBarActions}>
                    <TouchableOpacity style={styles.topBarBtn} onPress={handlePreview}>
                        <Ionicons name="eye-outline" size={20} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                        <Text style={styles.saveBtnText}>Salvar</Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            {/* ═══ SCROLLABLE FORM ═══ */}
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
            >
                {/* ══ 1. INFORMAÇÕES BÁSICAS ══ */}
                <SectionCard
                    title="Informações Básicas"
                    icon="📋"
                    defaultExpanded={true}
                    completionStatus={getStatus(!!(title && destination && country))}
                    completionLabel={title && destination ? '✓' : 'Pendente'}
                >
                    <FormInput
                        label="Título do Roteiro"
                        required
                        value={title}
                        onChangeText={setTitle}
                        placeholder="Ex: Paris Econômica - 10 dias por R$ 6.000"
                    />
                    <View style={styles.row}>
                        <View style={styles.halfField}>
                            <FormInput
                                label="Destino"
                                required
                                value={destination}
                                onChangeText={setDestination}
                                placeholder="Ex: Paris"
                            />
                        </View>
                        <View style={styles.halfField}>
                            <FormInput
                                label="País"
                                required
                                value={country}
                                onChangeText={setCountry}
                                placeholder="Ex: França"
                            />
                        </View>
                    </View>
                    <View style={styles.row}>
                        <View style={styles.halfField}>
                            <FormInput
                                label="Preço"
                                required
                                value={price}
                                onChangeText={setPrice}
                                placeholder="49.90"
                                keyboardType="decimal-pad"
                                prefix="R$"
                            />
                        </View>
                        <View style={styles.halfField}>
                            <FormInput
                                label="Duração"
                                required
                                value={duration}
                                onChangeText={setDuration}
                                placeholder="10"
                                keyboardType="number-pad"
                                suffix="dias"
                            />
                        </View>
                    </View>
                    <FormInput
                        label="Descrição"
                        required
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Descreva o que o viajante encontrará neste roteiro..."
                        multiline
                        numberOfLines={4}
                    />
                </SectionCard>

                {/* ══ 2. IMAGENS ══ */}
                <SectionCard
                    title="Imagens"
                    icon="📷"
                    completionStatus={getStatus(images.length > 0)}
                    completionLabel={`${images.length} fotos`}
                >
                    <EditableList
                        items={images}
                        onItemsChange={setImages}
                        placeholder="Cole a URL da imagem..."
                        maxItems={10}
                        emptyMessage="Nenhuma imagem adicionada"
                    />
                    <Text style={styles.hint}>
                        Use URLs de imagens (Unsplash, etc.). Upload direto em breve!
                    </Text>
                </SectionCard>

                {/* ══ 3. DESTAQUES ══ */}
                <SectionCard
                    title="Destaques"
                    icon="⭐"
                    completionStatus={getStatus(highlights.length > 0)}
                    completionLabel={`${highlights.length} itens`}
                >
                    <EditableList
                        items={highlights}
                        onItemsChange={setHighlights}
                        placeholder="Ex: Visita à Torre Eiffel com subida ao topo"
                        maxItems={10}
                        emptyMessage="Adicione os pontos altos do roteiro"
                    />
                </SectionCard>

                {/* ══ 4. ESTIMATIVA DE GASTOS ══ */}
                <SectionCard
                    title="Estimativa de Gastos"
                    icon="💰"
                    completionStatus={getStatus(spendingBreakdown.length > 0)}
                    completionLabel={spendingBreakdown.length > 0 ? `${spendingBreakdown.length} categorias` : 'Pendente'}
                >
                    <View style={styles.row}>
                        <View style={styles.thirdField}>
                            <FormInput
                                label="Moeda"
                                value={spendingCurrency}
                                onChangeText={setSpendingCurrency}
                                placeholder="R$"
                            />
                        </View>
                        <View style={styles.thirdField}>
                            <FormInput
                                label="Mínimo"
                                value={spendingMin}
                                onChangeText={setSpendingMin}
                                placeholder="4000"
                                keyboardType="number-pad"
                            />
                        </View>
                        <View style={styles.thirdField}>
                            <FormInput
                                label="Máximo"
                                value={spendingMax}
                                onChangeText={setSpendingMax}
                                placeholder="8000"
                                keyboardType="number-pad"
                            />
                        </View>
                    </View>

                    <Text style={styles.subLabel}>Breakdown por Categoria</Text>
                    {spendingBreakdown.map((item, index) => (
                        <View key={index} style={styles.breakdownCard}>
                            <TouchableOpacity
                                style={styles.removeSmallBtn}
                                onPress={() => removeSpendingCategory(index)}
                            >
                                <Ionicons name="close-circle" size={18} color={theme.colors.error} />
                            </TouchableOpacity>
                            <FormInput
                                label="Categoria"
                                value={item.category}
                                onChangeText={(v) => updateSpendingCategory(index, 'category', v)}
                                placeholder="Ex: 🏨 Hospedagem"
                            />
                            <FormInput
                                label="Valor"
                                value={item.amount}
                                onChangeText={(v) => updateSpendingCategory(index, 'amount', v)}
                                placeholder="Ex: R$ 800–1.500"
                            />
                            <FormInput
                                label="Descrição"
                                value={item.description}
                                onChangeText={(v) => updateSpendingCategory(index, 'description', v)}
                                placeholder="Ex: Hostels e Airbnb no centro"
                            />
                        </View>
                    ))}
                    <TouchableOpacity style={styles.addBtn} onPress={addSpendingCategory}>
                        <Ionicons name="add-circle" size={20} color={theme.colors.primary} />
                        <Text style={styles.addBtnText}>Adicionar Categoria</Text>
                    </TouchableOpacity>
                </SectionCard>

                {/* ══ 5. ITINERÁRIO DIA-A-DIA ══ */}
                <SectionCard
                    title="Itinerário Dia-a-Dia"
                    icon="🗓️"
                    completionStatus={getStatus(days.length > 0)}
                    completionLabel={`${days.length} dias`}
                >
                    {days.map((day, dayIdx) => (
                        <View key={dayIdx} style={styles.dayCard}>
                            <View style={styles.dayHeader}>
                                <Text style={styles.dayNumber}>Dia {day.dayNumber}</Text>
                                <TouchableOpacity onPress={() => removeDay(dayIdx)}>
                                    <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
                                </TouchableOpacity>
                            </View>
                            <FormInput
                                label="Título do dia"
                                value={day.title}
                                onChangeText={(v) => updateDay(dayIdx, 'title', v)}
                                placeholder="Ex: Chegada e Montmartre"
                            />
                            <FormInput
                                label="Resumo"
                                value={day.summary}
                                onChangeText={(v) => updateDay(dayIdx, 'summary', v)}
                                placeholder="Breve resumo do dia..."
                                multiline
                            />

                            {/* Activities */}
                            <Text style={styles.subLabel}>Atividades</Text>
                            {day.activities.map((act, actIdx) => (
                                <View key={act.id} style={styles.activityCard}>
                                    <View style={styles.activityHeader}>
                                        <Text style={styles.activityIndex}>
                                            {act.icon || '🎯'} {actIdx + 1}.
                                        </Text>
                                        <TouchableOpacity onPress={() => removeActivity(dayIdx, actIdx)}>
                                            <Ionicons name="close-circle" size={18} color={theme.colors.error} />
                                        </TouchableOpacity>
                                    </View>
                                    <View style={styles.row}>
                                        <View style={styles.halfField}>
                                            <FormInput
                                                label="Horário"
                                                value={act.time}
                                                onChangeText={(v) => updateActivity(dayIdx, actIdx, 'time', v)}
                                                placeholder="09:00"
                                            />
                                        </View>
                                        <View style={styles.halfField}>
                                            <FormInput
                                                label="Duração"
                                                value={act.duration}
                                                onChangeText={(v) => updateActivity(dayIdx, actIdx, 'duration', v)}
                                                placeholder="2h"
                                            />
                                        </View>
                                    </View>
                                    <FormInput
                                        label="Título"
                                        value={act.title}
                                        onChangeText={(v) => updateActivity(dayIdx, actIdx, 'title', v)}
                                        placeholder="Ex: Tour pelo Louvre"
                                    />
                                    <FormInput
                                        label="Local"
                                        value={act.location}
                                        onChangeText={(v) => updateActivity(dayIdx, actIdx, 'location', v)}
                                        placeholder="Ex: Musée du Louvre"
                                    />
                                    <FormInput
                                        label="Descrição"
                                        value={act.description}
                                        onChangeText={(v) => updateActivity(dayIdx, actIdx, 'description', v)}
                                        placeholder="Detalhes da atividade..."
                                        multiline
                                    />

                                    {/* Type selector */}
                                    <Text style={styles.miniLabel}>Tipo</Text>
                                    <View style={styles.typeRow}>
                                        {ACTIVITY_TYPES.map((t) => (
                                            <TouchableOpacity
                                                key={t.value}
                                                style={[
                                                    styles.typeChip,
                                                    act.type === t.value && styles.typeChipActive,
                                                ]}
                                                onPress={() => {
                                                    updateActivity(dayIdx, actIdx, 'type', t.value);
                                                    updateActivity(dayIdx, actIdx, 'icon', t.icon);
                                                }}
                                            >
                                                <Text style={styles.typeIcon}>{t.icon}</Text>
                                                <Text style={[
                                                    styles.typeLabel,
                                                    act.type === t.value && styles.typeLabelActive,
                                                ]}>
                                                    {t.label}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    {/* Tips */}
                                    <EditableList
                                        label="Dicas"
                                        items={act.tips}
                                        onItemsChange={(tips) => updateActivity(dayIdx, actIdx, 'tips', tips)}
                                        placeholder="Adicionar dica..."
                                        maxItems={5}
                                    />
                                </View>
                            ))}

                            <TouchableOpacity
                                style={styles.addBtn}
                                onPress={() => addActivity(dayIdx)}
                            >
                                <Ionicons name="add-circle" size={18} color={theme.colors.primary} />
                                <Text style={styles.addBtnText}>Adicionar Atividade</Text>
                            </TouchableOpacity>
                        </View>
                    ))}

                    <TouchableOpacity style={styles.addDayBtn} onPress={addDay}>
                        <LinearGradient
                            colors={[theme.colors.primary + '15', theme.colors.primary + '08']}
                            style={styles.addDayBtnInner}
                        >
                            <Ionicons name="add-circle" size={22} color={theme.colors.primary} />
                            <Text style={styles.addDayBtnText}>Adicionar Dia {days.length + 1}</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </SectionCard>

                {/* ══ 6. INFORMAÇÕES DE VOO ══ */}
                <SectionCard
                    title="Informações de Voo"
                    icon="✈️"
                    completionStatus={getStatus(!!flightOutAirline)}
                    completionLabel={flightOutAirline ? '✓' : 'Opcional'}
                >
                    <Text style={styles.subLabel}>🛫 Ida</Text>
                    <View style={styles.row}>
                        <View style={styles.halfField}>
                            <FormInput label="Companhia" value={flightOutAirline} onChangeText={setFlightOutAirline} placeholder="Ex: LATAM" />
                        </View>
                        <View style={styles.halfField}>
                            <FormInput label="Rota" value={flightOutRoute} onChangeText={setFlightOutRoute} placeholder="GRU → CDG" />
                        </View>
                    </View>
                    <View style={styles.row}>
                        <View style={styles.halfField}>
                            <FormInput label="Saída" value={flightOutDeparture} onChangeText={setFlightOutDeparture} placeholder="22:30" />
                        </View>
                        <View style={styles.halfField}>
                            <FormInput label="Chegada" value={flightOutArrival} onChangeText={setFlightOutArrival} placeholder="14:30 +1" />
                        </View>
                    </View>
                    <View style={styles.row}>
                        <View style={styles.thirdField}>
                            <FormInput label="Duração" value={flightOutDuration} onChangeText={setFlightOutDuration} placeholder="11h" />
                        </View>
                        <View style={styles.thirdField}>
                            <FormInput label="Paradas" value={flightOutStops} onChangeText={setFlightOutStops} placeholder="0" keyboardType="number-pad" />
                        </View>
                        <View style={styles.thirdField}>
                            <FormInput label="Preço" value={flightOutPrice} onChangeText={setFlightOutPrice} placeholder="R$ 2.800" />
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <Text style={styles.subLabel}>🛬 Volta</Text>
                    <View style={styles.row}>
                        <View style={styles.halfField}>
                            <FormInput label="Companhia" value={flightRetAirline} onChangeText={setFlightRetAirline} placeholder="Ex: Air France" />
                        </View>
                        <View style={styles.halfField}>
                            <FormInput label="Rota" value={flightRetRoute} onChangeText={setFlightRetRoute} placeholder="CDG → GRU" />
                        </View>
                    </View>
                    <View style={styles.row}>
                        <View style={styles.halfField}>
                            <FormInput label="Saída" value={flightRetDeparture} onChangeText={setFlightRetDeparture} placeholder="10:15" />
                        </View>
                        <View style={styles.halfField}>
                            <FormInput label="Chegada" value={flightRetArrival} onChangeText={setFlightRetArrival} placeholder="17:45" />
                        </View>
                    </View>
                    <View style={styles.row}>
                        <View style={styles.thirdField}>
                            <FormInput label="Duração" value={flightRetDuration} onChangeText={setFlightRetDuration} placeholder="11h30" />
                        </View>
                        <View style={styles.thirdField}>
                            <FormInput label="Paradas" value={flightRetStops} onChangeText={setFlightRetStops} placeholder="0" keyboardType="number-pad" />
                        </View>
                        <View style={styles.thirdField}>
                            <FormInput label="Preço" value={flightRetPrice} onChangeText={setFlightRetPrice} placeholder="R$ 3.200" />
                        </View>
                    </View>

                    <View style={styles.divider} />
                    <EditableList
                        label="💡 Dicas de Voo"
                        items={flightTips}
                        onItemsChange={setFlightTips}
                        placeholder="Ex: Reserve com 3 meses de antecedência"
                        maxItems={10}
                    />
                </SectionCard>

                {/* ══ 7. HOSPEDAGEM ══ */}
                <SectionCard
                    title="Hospedagem"
                    icon="🏨"
                    completionStatus={getStatus(accommodationOptions.length > 0)}
                    completionLabel={`${accommodationOptions.length} opções`}
                >
                    {accommodationOptions.map((acc, index) => (
                        <View key={acc.id} style={styles.breakdownCard}>
                            <TouchableOpacity
                                style={styles.removeSmallBtn}
                                onPress={() => removeAccommodation(index)}
                            >
                                <Ionicons name="close-circle" size={18} color={theme.colors.error} />
                            </TouchableOpacity>
                            <FormInput
                                label="Nome"
                                value={acc.name}
                                onChangeText={(v) => updateAccommodation(index, 'name', v)}
                                placeholder="Ex: Generator Paris Hostel"
                            />
                            <View style={styles.row}>
                                <View style={styles.halfField}>
                                    <FormInput
                                        label="Faixa de Preço"
                                        value={acc.priceRange}
                                        onChangeText={(v) => updateAccommodation(index, 'priceRange', v)}
                                        placeholder="€30-50/noite"
                                    />
                                </View>
                                <View style={styles.halfField}>
                                    <FormInput
                                        label="Nota"
                                        value={acc.rating?.toString() || ''}
                                        onChangeText={(v) => updateAccommodation(index, 'rating', parseFloat(v) || 0)}
                                        placeholder="4.5"
                                        keyboardType="decimal-pad"
                                    />
                                </View>
                            </View>
                            <FormInput
                                label="Localização"
                                value={acc.location}
                                onChangeText={(v) => updateAccommodation(index, 'location', v)}
                                placeholder="Ex: 10ème arrondissement"
                            />
                            <FormInput
                                label="Descrição"
                                value={acc.description}
                                onChangeText={(v) => updateAccommodation(index, 'description', v)}
                                placeholder="Detalhe a hospedagem..."
                                multiline
                            />
                        </View>
                    ))}
                    <TouchableOpacity style={styles.addBtn} onPress={addAccommodation}>
                        <Ionicons name="add-circle" size={20} color={theme.colors.primary} />
                        <Text style={styles.addBtnText}>Adicionar Opção de Hospedagem</Text>
                    </TouchableOpacity>
                </SectionCard>

                {/* ══ 8. TRANSPORTE LOCAL ══ */}
                <SectionCard
                    title="Transporte Local"
                    icon="🚇"
                    completionStatus={getStatus(!!transportMainMode)}
                    completionLabel={transportMainMode || 'Pendente'}
                >
                    <FormInput
                        label="Modo Principal"
                        value={transportMainMode}
                        onChangeText={setTransportMainMode}
                        placeholder="Ex: Metrô + Ônibus"
                    />
                    <FormInput
                        label="Descrição"
                        value={transportDescription}
                        onChangeText={setTransportDescription}
                        placeholder="Informações gerais sobre locomoção..."
                        multiline
                    />

                    <Text style={styles.subLabel}>🎫 Passes e Bilhetes</Text>
                    {transportPasses.map((pass, index) => (
                        <View key={index} style={styles.breakdownCard}>
                            <TouchableOpacity
                                style={styles.removeSmallBtn}
                                onPress={() => removeTransportPass(index)}
                            >
                                <Ionicons name="close-circle" size={18} color={theme.colors.error} />
                            </TouchableOpacity>
                            <FormInput
                                label="Nome"
                                value={pass.name}
                                onChangeText={(v) => updateTransportPass(index, 'name', v)}
                                placeholder="Ex: Navigo Semaine"
                            />
                            <View style={styles.row}>
                                <View style={styles.halfField}>
                                    <FormInput
                                        label="Preço"
                                        value={pass.price}
                                        onChangeText={(v) => updateTransportPass(index, 'price', v)}
                                        placeholder="€30,75"
                                    />
                                </View>
                            </View>
                            <FormInput
                                label="Descrição"
                                value={pass.description}
                                onChangeText={(v) => updateTransportPass(index, 'description', v)}
                                placeholder="Detalhes do passe..."
                            />
                        </View>
                    ))}
                    <TouchableOpacity style={styles.addBtn} onPress={addTransportPass}>
                        <Ionicons name="add-circle" size={20} color={theme.colors.primary} />
                        <Text style={styles.addBtnText}>Adicionar Passe</Text>
                    </TouchableOpacity>

                    <View style={styles.divider} />
                    <EditableList
                        label="💡 Dicas de Transporte"
                        items={transportTips}
                        onItemsChange={setTransportTips}
                        placeholder="Ex: Evite o metrô nos horários de pico"
                        maxItems={10}
                    />
                </SectionCard>

                {/* ══ 9. INFORMAÇÕES IMPORTANTES ══ */}
                <SectionCard
                    title="Informações Importantes"
                    icon="ℹ️"
                    completionStatus={getStatus(importantInfo.length > 0)}
                    completionLabel={`${importantInfo.length} itens`}
                >
                    <EditableList
                        items={importantInfo}
                        onItemsChange={setImportantInfo}
                        placeholder="Ex: 🔌 Voltagem: 230V (tipo C/E)"
                        maxItems={15}
                        emptyMessage="Adicione informações úteis para o viajante (voltagem, moeda, fuso, etc.)"
                    />
                </SectionCard>

                {/* ══ 10. CHECKLIST PRÉ-VIAGEM ══ */}
                <SectionCard
                    title="Checklist Pré-Viagem"
                    icon="✅"
                    completionStatus={getStatus(checklist.length > 0)}
                    completionLabel={`${checklist.length} itens`}
                >
                    {CHECKLIST_CATEGORIES.map((cat) => {
                        const items = checklist.filter(c => c.category === cat.value);
                        return (
                            <View key={cat.value} style={styles.checklistCategory}>
                                <Text style={styles.subLabel}>{cat.label}</Text>
                                {items.map((item) => {
                                    const globalIdx = checklist.indexOf(item);
                                    return (
                                        <View key={item.id} style={styles.checklistRow}>
                                            <TextInput
                                                style={styles.checklistInput}
                                                value={item.text}
                                                onChangeText={(v) => updateChecklistItem(globalIdx, v)}
                                                placeholder="Descrição do item..."
                                                placeholderTextColor={theme.colors.text.disabled}
                                            />
                                            <TouchableOpacity onPress={() => removeChecklistItem(globalIdx)}>
                                                <Ionicons name="close-circle" size={18} color={theme.colors.error} />
                                            </TouchableOpacity>
                                        </View>
                                    );
                                })}
                                <TouchableOpacity
                                    style={styles.addSmallBtn}
                                    onPress={() => addChecklistItem(cat.value)}
                                >
                                    <Ionicons name="add" size={16} color={theme.colors.primary} />
                                    <Text style={styles.addSmallBtnText}>Adicionar</Text>
                                </TouchableOpacity>
                            </View>
                        );
                    })}
                </SectionCard>

                {/* ══ 11. CONTATOS DE EMERGÊNCIA ══ */}
                <SectionCard
                    title="Contatos de Emergência"
                    icon="🆘"
                    completionStatus={getStatus(emergencyContacts.length > 0)}
                    completionLabel={`${emergencyContacts.length} contatos`}
                >
                    {emergencyContacts.map((contact, index) => (
                        <View key={index} style={styles.breakdownCard}>
                            <TouchableOpacity
                                style={styles.removeSmallBtn}
                                onPress={() => removeEmergencyContact(index)}
                            >
                                <Ionicons name="close-circle" size={18} color={theme.colors.error} />
                            </TouchableOpacity>
                            <View style={styles.row}>
                                <View style={styles.halfField}>
                                    <FormInput
                                        label="Tipo"
                                        value={contact.type}
                                        onChangeText={(v) => updateEmergencyContact(index, 'type', v)}
                                        placeholder="Ex: 🏥 Hospital"
                                    />
                                </View>
                                <View style={styles.halfField}>
                                    <FormInput
                                        label="Nome"
                                        value={contact.name}
                                        onChangeText={(v) => updateEmergencyContact(index, 'name', v)}
                                        placeholder="Nome"
                                    />
                                </View>
                            </View>
                            <View style={styles.row}>
                                <View style={styles.halfField}>
                                    <FormInput
                                        label="Telefone"
                                        value={contact.phone}
                                        onChangeText={(v) => updateEmergencyContact(index, 'phone', v)}
                                        placeholder="+33 01 42..."
                                    />
                                </View>
                                <View style={styles.halfField}>
                                    <FormInput
                                        label="Disponibilidade"
                                        value={contact.available}
                                        onChangeText={(v) => updateEmergencyContact(index, 'available', v)}
                                        placeholder="24h"
                                    />
                                </View>
                            </View>
                        </View>
                    ))}
                    <TouchableOpacity style={styles.addBtn} onPress={addEmergencyContact}>
                        <Ionicons name="add-circle" size={20} color={theme.colors.primary} />
                        <Text style={styles.addBtnText}>Adicionar Contato</Text>
                    </TouchableOpacity>
                </SectionCard>

                {/* ══ 12. O QUE O VIAJANTE RECEBE ══ */}
                <SectionCard
                    title="O que o Viajante Recebe"
                    icon="🎁"
                    completionStatus={getStatus(receiveList.length > 0)}
                    completionLabel={`${receiveList.length} itens`}
                >
                    {receiveList.map((item, index) => (
                        <View key={index} style={styles.receiveRow}>
                            <TextInput
                                style={styles.receiveEmojiInput}
                                value={item.icon}
                                onChangeText={(v) => updateReceiveItem(index, 'icon', v)}
                                maxLength={4}
                            />
                            <TextInput
                                style={styles.receiveTextInput}
                                value={item.label}
                                onChangeText={(v) => updateReceiveItem(index, 'label', v)}
                                placeholder="Ex: Itinerário completo dia a dia"
                                placeholderTextColor={theme.colors.text.disabled}
                            />
                            <TouchableOpacity onPress={() => removeReceiveItem(index)}>
                                <Ionicons name="close-circle" size={18} color={theme.colors.error} />
                            </TouchableOpacity>
                        </View>
                    ))}
                    <TouchableOpacity style={styles.addBtn} onPress={addReceiveItem}>
                        <Ionicons name="add-circle" size={20} color={theme.colors.primary} />
                        <Text style={styles.addBtnText}>Adicionar Entregável</Text>
                    </TouchableOpacity>
                </SectionCard>

                {/* ══ 13. INCLUSÕES ══ */}
                <SectionCard
                    title="Tags de Inclusão"
                    icon="🏷️"
                    completionStatus={getStatus(inclusions.length > 0)}
                    completionLabel={`${inclusions.length} tags`}
                >
                    <EditableList
                        items={inclusions}
                        onItemsChange={setInclusions}
                        placeholder="Ex: Planilha, Mapa, Dicas..."
                        maxItems={10}
                        emptyMessage="Adicione tags como Planilha, Mapa, etc."
                    />
                </SectionCard>

            </ScrollView>
        </View>
    );
}

// ── STYLES ─────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.surface,
    },

    // Top Bar
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 54 : 38,
        paddingBottom: 14,
        paddingHorizontal: 16,
        gap: 10,
    },
    topBarBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    topBarCenter: {
        flex: 1,
    },
    topBarTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    progressBarContainer: {
        height: 3,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 2,
        marginTop: 6,
    },
    progressBarFill: {
        height: 3,
        backgroundColor: '#fff',
        borderRadius: 2,
    },
    progressText: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.7)',
        marginTop: 2,
    },
    topBarActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    saveBtn: {
        backgroundColor: 'rgba(255,255,255,0.25)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    saveBtnText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#fff',
    },

    // Scroll
    scrollView: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 16,
    },

    // Layout helpers
    row: {
        flexDirection: 'row',
        gap: 10,
    },
    halfField: {
        flex: 1,
    },
    thirdField: {
        flex: 1,
    },

    // Sub labels
    subLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: theme.colors.text.secondary,
        marginTop: 12,
        marginBottom: 8,
    },
    miniLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.text.tertiary,
        marginTop: 8,
        marginBottom: 6,
    },
    hint: {
        fontSize: 11,
        color: theme.colors.text.tertiary,
        fontStyle: 'italic',
        marginTop: 8,
    },

    // Day Card
    dayCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    dayHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    dayNumber: {
        fontSize: 16,
        fontWeight: '800',
        color: theme.colors.primary,
    },

    // Activity Card
    activityCard: {
        backgroundColor: theme.colors.background,
        borderRadius: 10,
        padding: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    activityHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    activityIndex: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.text.primary,
    },

    // Type selector
    typeRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
        flexWrap: 'wrap',
    },
    typeChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    typeChipActive: {
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.primary + '10',
    },
    typeIcon: {
        fontSize: 14,
    },
    typeLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: theme.colors.text.secondary,
    },
    typeLabelActive: {
        color: theme.colors.primary,
        fontWeight: '600',
    },

    // Breakdown / generic card
    breakdownCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: 10,
        padding: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    removeSmallBtn: {
        alignSelf: 'flex-end',
        marginBottom: 4,
    },

    // Add buttons
    addBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 10,
    },
    addBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.primary,
    },
    addDayBtn: {
        marginTop: 4,
        borderRadius: 12,
        overflow: 'hidden',
    },
    addDayBtnInner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: theme.colors.primary + '30',
    },
    addDayBtnText: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.colors.primary,
    },
    addSmallBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 6,
    },
    addSmallBtnText: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.primary,
    },

    // Checklist
    checklistCategory: {
        marginBottom: 12,
    },
    checklistRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    checklistInput: {
        flex: 1,
        backgroundColor: theme.colors.surface,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 14,
        color: theme.colors.text.primary,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },

    // Receive list
    receiveRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    receiveEmojiInput: {
        width: 44,
        textAlign: 'center',
        fontSize: 20,
        backgroundColor: theme.colors.surface,
        borderRadius: 8,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    receiveTextInput: {
        flex: 1,
        fontSize: 14,
        color: theme.colors.text.primary,
        backgroundColor: theme.colors.surface,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },

    // Divider
    divider: {
        height: 1,
        backgroundColor: theme.colors.borderLight,
        marginVertical: 16,
    },
});

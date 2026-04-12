"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useCallback, use } from "react";
import { getItineraryById, createItinerary, updateItinerary } from "../../../../lib/api";

/* ─── Constants ─── */
const COUNTRIES = ["Brasil", "Argentina", "Chile", "Colômbia", "Peru", "México", "EUA", "Canadá", "Portugal", "Espanha", "França", "Itália", "Alemanha", "Inglaterra", "Grécia", "Turquia", "Japão", "Tailândia", "Indonésia", "Austrália", "Egito", "Marrocos", "África do Sul"];
const STYLE_OPTIONS = [
    { key: "luxo", icon: "👑", label: "Luxo" },
    { key: "economico", icon: "💵", label: "Econômico" },
    { key: "mochilao", icon: "🎒", label: "Mochilão" },
    { key: "familia", icon: "👨‍👩‍👧‍👦", label: "Família" },
    { key: "romantico", icon: "💕", label: "Romântico" },
    { key: "aventura", icon: "🧗", label: "Aventura" },
    { key: "conforto", icon: "🛋️", label: "Conforto" },
];
const CATEGORY_OPTIONS = [
    { key: "cultura", icon: "🏛️", label: "Cultura" },
    { key: "gastronomia", icon: "🍽️", label: "Gastronomia" },
    { key: "natureza", icon: "🌿", label: "Natureza" },
    { key: "esportes", icon: "⚽", label: "Esportes" },
    { key: "relax", icon: "🧘", label: "Relax" },
    { key: "eurotrip", icon: "✈️", label: "Eurotrip" },
    { key: "praia", icon: "🏖️", label: "Praia" },
    { key: "montanha", icon: "⛰️", label: "Montanha" },
    { key: "urbano", icon: "🏙️", label: "Urbano" },
    { key: "historico", icon: "📜", label: "Histórico" },
];
const MODULE_OPTIONS = [
    { key: "itinerario", icon: "🗓️", label: "Itinerário por dia", desc: "Roteiro dia a dia completo" },
    { key: "mapa", icon: "🗺️", label: "Mapa integrado", desc: "Mapa com todos os pontos" },
    { key: "hospedagem", icon: "🏨", label: "Hospedagens", desc: "Hotéis e hospedagens sugeridas" },
    { key: "transporte", icon: "🚌", label: "Transporte", desc: "Dicas de locomoção" },
    { key: "gasto", icon: "💳", label: "Estimativa de gasto", desc: "Quanto você vai gastar" },
    { key: "restaurantes", icon: "🍴", label: "Restaurantes", desc: "Onde comer" },
    { key: "dicas", icon: "💡", label: "Dicas exclusivas", desc: "Dicas do criador" },
    { key: "checklist", icon: "✅", label: "Checklist interativo", desc: "O que levar e preparar" },
    { key: "voo", icon: "✈️", label: "Meu voo", desc: "Sugestões de voo" },
];
const CHECKLIST_CATS = ["documentos", "mala", "pre-viagem", "custom"];
type SectionKey = "identity" | "commerce" | "modules" | "itinerary" | "spending" | "flight" | "checklist" | "postpurchase";
interface SectionDef { key: SectionKey; icon: string; title: string; }
const SECTIONS: SectionDef[] = [
    { key: "identity", icon: "🎯", title: "Identidade e Indexação" },
    { key: "commerce", icon: "💰", title: "Estrutura Comercial" },
    { key: "modules", icon: "📦", title: "Módulos do Roteiro" },
    { key: "itinerary", icon: "🗓️", title: "Itinerário Estruturado" },
    { key: "spending", icon: "💳", title: "Estimativa de Gasto" },
    { key: "flight", icon: "✈️", title: "Meu Voo" },
    { key: "checklist", icon: "✅", title: "Checklist" },
    { key: "postpurchase", icon: "⚙️", title: "Configuração Pós-compra" },
];
/* Map: which module key activates which editor section */
const SECTION_MODULE_MAP: Partial<Record<SectionKey, string>> = {
    itinerary: "itinerario",
    spending: "gasto",
    flight: "voo",
    checklist: "checklist",
};

interface Activity { title: string; description: string; time: string; duration: string; location: string; type: string; icon: string; tips: string; latitude: string; longitude: string; category: string; }
interface Day { dayNumber: number; title: string; summary: string; description: string; activities: Activity[]; }
interface Accommodation { name: string; neighborhood: string; description: string; priceRange: string; rating: string; externalLink: string; }
interface Transport { description: string; passTypes: string; estimatedPrice: string; notes: string; }
interface ChecklistItem { category: string; item: string; isDefault: boolean; }
interface BreakdownItem { category: string; min: string; max: string; }
interface RestaurantItem { name: string; cuisine: string; location: string; description: string; priceRange: string; hours: string; externalLink: string; tips: string; }
interface FlightLeg { airline: string; route: string; departure: string; arrival: string; duration: string; stops: number; pricePaid: string; }
const EMPTY_FLIGHT_LEG: FlightLeg = { airline: "", route: "", departure: "", arrival: "", duration: "", stops: 0, pricePaid: "" };
const CUISINE_OPTIONS = ["Ramen", "Sushi", "Tempura", "Izakaya", "Yakitori", "Italiana", "Francesa", "Brasileira", "Mexicana", "Indiana", "Tailandesa", "Fast Food", "Café", "Padaria", "Bistrô", "Fine Dining", "Street Food", "Vegetariana", "Frutos do Mar", "Outro"];

const DEFAULT_CREATOR_ID = "creator-diego-001";
const SPENDING_CATS = ["🏨 Hospedagem", "🍽️ Alimentação", "🚌 Transporte", "🎫 Atrações", "🎁 Extras"];

function getDurationLabel(d: number) {
    if (d <= 3) return "Fim de semana";
    if (d <= 7) return "1 semana";
    if (d <= 15) return "15 dias";
    return "+20 dias";
}

function calcQuality(data: any): number {
    let s = 0;
    const c = (v: any, p: number) => { if (v && (typeof v !== "string" || v.trim())) s += p; };
    const a = (v: any[], p: number) => { if (v && v.length > 0) s += p; };
    c(data.title, 8); c(data.destination, 8); c(data.country, 5); c(data.description, 8);
    c(data.subtitle, 5); c(data.duration, 3); c(data.price, 10);
    a(data.travelStyles, 8); a(data.categories, 8);
    a(data.activeModules, 5); a(data.highlights, 5); a(data.inclusions, 5);
    a(data.days, 10);
    if (data.days && data.days.length >= 3) s += 5;
    if (data.spendingBreakdown && data.spendingBreakdown.length > 0) s += 5;
    c(data.productType, 2); c(data.promoPrice, 2);
    return Math.min(s, 100);
}

/* ═══════════════════════════════════════════ */
export default function RoteiroEditorPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const isNew = id === "new";
    const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const autoSaveRef = useRef<ReturnType<typeof setInterval> | null>(null);

    /* ─── UI state ─── */
    const [openSections, setOpenSections] = useState<Set<SectionKey>>(new Set(["identity"]));
    const [activeSection, setActiveSection] = useState<SectionKey>("identity");
    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
    const [dirty, setDirty] = useState(false);

    /* ─── Bloco 1: Identidade ─── */
    const [title, setTitle] = useState("");
    const [subtitle, setSubtitle] = useState("");
    const [destination, setDestination] = useState("");
    const [country, setCountry] = useState("");
    const [duration, setDuration] = useState(1);
    const [description, setDescription] = useState("");
    const [travelStyles, setTravelStyles] = useState<string[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [productType, setProductType] = useState("DIGITAL");

    /* ─── Bloco 2: Comercial ─── */
    const [price, setPrice] = useState(0);
    const [currency, setCurrency] = useState("BRL");
    const [promoPrice, setPromoPrice] = useState<number | null>(null);
    const [installments, setInstallments] = useState<number | null>(null);
    const [immediateAccess, setImmediateAccess] = useState(true);
    const [lifetimeAccess, setLifetimeAccess] = useState(true);
    const [offlineDownload, setOfflineDownload] = useState(true);
    const [featured, setFeatured] = useState(false);

    /* ─── Bloco 3: Módulos ─── */
    const [activeModules, setActiveModules] = useState<string[]>([]);

    /* ─── Bloco 4: Itinerário ─── */
    const [days, setDays] = useState<Day[]>([]);
    const [images, setImages] = useState<string[]>([""]);
    const [highlightItems, setHighlightItems] = useState<string[]>([]);
    const [newHighlight, setNewHighlight] = useState("");
    const [inclusionItems, setInclusionItems] = useState<string[]>([]);
    const [newInclusion, setNewInclusion] = useState("");

    /* ─── Bloco 5: Gasto ─── */
    const [spendingBreakdown, setSpendingBreakdown] = useState<BreakdownItem[]>([]);
    const [spendingCurrency, setSpendingCurrency] = useState("BRL");

    /* ─── Bloco 6: Meu Voo ─── */
    const [flightOutbound, setFlightOutbound] = useState<FlightLeg>({ ...EMPTY_FLIGHT_LEG });
    const [flightReturn, setFlightReturn] = useState<FlightLeg>({ ...EMPTY_FLIGHT_LEG });
    const [flightTips, setFlightTips] = useState<string[]>([]);
    const [newFlightTip, setNewFlightTip] = useState("");

    /* ─── Bloco 7: Checklist ─── */
    const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
    const [newCheckItem, setNewCheckItem] = useState("");
    const [newCheckCat, setNewCheckCat] = useState("documentos");

    /* ─── Bloco 8: Pós-compra ─── */
    const [allowPdf, setAllowPdf] = useState(false);
    const [allowShare, setAllowShare] = useState(true);

    /* ─── Hospedagem & Transporte ─── */
    const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
    const [transports, setTransports] = useState<Transport[]>([]);

    /* ─── Restaurantes & Dicas Gerais ─── */
    const [restaurants, setRestaurants] = useState<RestaurantItem[]>([]);
    const [generalTips, setGeneralTips] = useState<string[]>([]);
    const [newGeneralTip, setNewGeneralTip] = useState("");

    /* ─── Quality score ─── */
    const qualityScore = calcQuality({ title, subtitle, destination, country, description, duration, price, travelStyles, categories, activeModules, highlightItems, inclusionItems: inclusionItems, days, spendingBreakdown, productType, promoPrice });

    /* ─── Toast auto-dismiss ─── */
    useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 4000); return () => clearTimeout(t); }, [toast]);

    /* ─── Mark dirty ─── */
    const markDirty = useCallback(() => setDirty(true), []);

    /* ─── Load data ─── */
    useEffect(() => {
        if (isNew) return;
        getItineraryById(id)
            .then((data: any) => {
                setTitle(data.title || ""); setSubtitle(data.subtitle || "");
                setDestination(data.destination || ""); setCountry(data.country || "");
                setDuration(data.duration || 1); setDescription(data.description || "");
                setTravelStyles(data.travelStyles || []); setCategories(data.categories || []);
                setProductType(data.productType || "DIGITAL");
                setPrice(data.price || 0); setCurrency(data.currency || "BRL");
                setPromoPrice(data.promoPrice || null); setInstallments(data.installments || null);
                setImmediateAccess(data.immediateAccess ?? true); setLifetimeAccess(data.lifetimeAccess ?? true);
                setOfflineDownload(data.offlineDownload ?? true); setFeatured(data.featured || false);
                setActiveModules(data.activeModules || []);
                setHighlightItems(data.highlights || []); setInclusionItems(data.inclusions || []);
                setImages(Array.isArray(data.images) ? data.images.map((img: any) => typeof img === "string" ? img : img.url) : [""]);
                setAllowPdf(data.allowPdf ?? false); setAllowShare(data.allowShare ?? true);
                // Spending
                const sp = data.estimatedSpending || {};
                setSpendingCurrency(sp.currency || "BRL");
                setSpendingBreakdown((sp.breakdown || []).map((b: any) => ({ category: b.category || "", min: b.min || "", max: b.max || "" })));
                // Days
                setDays((data.days || []).map((d: any) => ({
                    dayNumber: d.dayNumber, title: d.title || "", summary: d.summary || "", description: d.description || "",
                    activities: (d.activities || []).map((a: any) => ({
                        title: a.title || "", description: a.description || "", time: a.time || "", duration: a.duration || "",
                        location: a.location || "", type: a.type || "activity", icon: a.icon || "📍",
                        tips: a.tips || "", latitude: a.latitude?.toString() || "", longitude: a.longitude?.toString() || "",
                        category: a.category || "",
                    })),
                })));
                // Accommodations
                setAccommodations((data.accommodations || []).map((a: any) => ({
                    name: a.name || "", neighborhood: a.neighborhood || "", description: a.description || "",
                    priceRange: a.priceRange || "", rating: a.rating?.toString() || "", externalLink: a.externalLink || "",
                })));
                // Transports
                setTransports((data.transports || []).map((t: any) => ({
                    description: t.description || "", passTypes: t.passTypes || "",
                    estimatedPrice: t.estimatedPrice || "", notes: t.notes || "",
                })));
                // Checklists
                setChecklistItems((data.checklists || []).map((c: any) => ({
                    category: c.category || "documentos", item: c.item || "", isDefault: c.isDefault ?? true,
                })));
                // Flight
                if (data.flightInfo) {
                    setFlightOutbound(data.flightInfo.outbound || { ...EMPTY_FLIGHT_LEG });
                    setFlightReturn(data.flightInfo.return || { ...EMPTY_FLIGHT_LEG });
                    setFlightTips(data.flightInfo.tips || []);
                }
                // Restaurants
                setRestaurants((data.restaurants || []).map((r: any) => ({
                    name: r.name || "", cuisine: r.cuisine || "", location: r.location || "",
                    description: r.description || "", priceRange: r.priceRange || "",
                    hours: r.hours || "", externalLink: r.externalLink || "", tips: r.tips || "",
                })));
                // General Tips
                setGeneralTips(data.generalTips || []);
            })
            .catch((err) => setToast({ msg: `Erro ao carregar: ${err.message}`, type: "error" }))
            .finally(() => setLoading(false));
    }, [id, isNew]);

    /* ─── Build payload ─── */
    const buildPayload = useCallback(() => {
        const spMin = spendingBreakdown.reduce((s, b) => s + (parseFloat(b.min) || 0), 0);
        const spMax = spendingBreakdown.reduce((s, b) => s + (parseFloat(b.max) || 0), 0);
        return {
            creatorId: DEFAULT_CREATOR_ID, title, subtitle, destination, country, description,
            price: price.toString(), currency, duration: duration.toString(), featured,
            travelStyles, categories, productType, activeModules,
            promoPrice: promoPrice?.toString() || undefined,
            installments: installments?.toString() || undefined,
            immediateAccess, lifetimeAccess, offlineDownload, allowPdf, allowShare,
            highlights: highlightItems, inclusions: inclusionItems,
            estimatedSpending: { min: spMin, max: spMax, currency: spendingCurrency, breakdown: spendingBreakdown },
            images: images.filter(Boolean),
            days: days.map((d, i) => ({ ...d, dayNumber: i + 1, activities: d.activities.map(a => ({ ...a, latitude: a.latitude ? parseFloat(a.latitude) : undefined, longitude: a.longitude ? parseFloat(a.longitude) : undefined })) })),
            accommodations, transports, checklists: checklistItems,
            flightInfo: (flightOutbound.airline || flightReturn.airline) ? {
                outbound: flightOutbound,
                return: flightReturn,
                tips: flightTips.filter(t => t.trim()),
            } : undefined,
            restaurants: restaurants.filter(r => r.name.trim()),
            generalTips: generalTips.filter(t => t.trim()),
        };
    }, [title, subtitle, destination, country, description, price, currency, duration, featured, travelStyles, categories, productType, activeModules, promoPrice, installments, immediateAccess, lifetimeAccess, offlineDownload, allowPdf, allowShare, highlightItems, inclusionItems, spendingBreakdown, spendingCurrency, images, days, accommodations, transports, checklistItems, flightOutbound, flightReturn, flightTips, restaurants, generalTips]);

    /* ─── Save ─── */
    const handleSave = async () => {
        // Validation
        if (!title || !destination || !country) { setToast({ msg: "Preencha título, destino e país", type: "error" }); return; }
        if (price <= 0) { setToast({ msg: "Defina um preço válido", type: "error" }); return; }
        if (categories.length < 1) { setToast({ msg: "Selecione pelo menos 1 categoria", type: "error" }); return; }
        if (days.length < 3) { setToast({ msg: "Cadastre pelo menos 3 dias", type: "error" }); return; }
        if (activeModules.length < 1) { setToast({ msg: "Ative pelo menos 1 módulo", type: "error" }); return; }

        setSaving(true);
        try {
            const payload = buildPayload();
            if (isNew) {
                const created = await createItinerary(payload);
                setToast({ msg: "Roteiro criado com sucesso!", type: "success" });
                window.location.href = `/dashboard/roteiro/${created.id}`;
            } else {
                await updateItinerary(id, payload);
                setToast({ msg: "Alterações salvas!", type: "success" });
                setDirty(false);
            }
        } catch (err: any) { setToast({ msg: err.message, type: "error" }); }
        finally { setSaving(false); }
    };

    /* ─── Auto-save ─── */
    useEffect(() => {
        if (isNew) return;
        autoSaveRef.current = setInterval(() => {
            if (dirty) { updateItinerary(id, buildPayload()).then(() => setDirty(false)).catch(() => { }); }
        }, 30000);
        return () => { if (autoSaveRef.current) clearInterval(autoSaveRef.current); };
    }, [id, isNew, dirty, buildPayload]);

    /* ─── Section helpers ─── */
    const toggleSection = (key: SectionKey) => { setOpenSections(p => { const n = new Set(p); if (n.has(key)) n.delete(key); else n.add(key); return n; }); };
    const isSectionComplete = useCallback((key: SectionKey): boolean => {
        switch (key) {
            case "identity": return !!(title && destination && country && categories.length >= 1);
            case "commerce": return price > 0;
            case "modules": return activeModules.length >= 1;
            case "itinerary": return days.length >= 3;
            case "spending": return spendingBreakdown.length > 0;
            case "flight": return !!(flightOutbound.airline || flightReturn.airline);
            case "checklist": return checklistItems.length > 0;
            case "postpurchase": return true;
            default: return false;
        }
    }, [title, destination, country, categories, price, activeModules, days, spendingBreakdown, checklistItems, flightOutbound, flightReturn]);

    /* ─── Chip toggle ─── */
    const toggleChip = (arr: string[], set: (v: string[]) => void, key: string, max: number) => {
        markDirty();
        if (arr.includes(key)) set(arr.filter(k => k !== key));
        else if (arr.length < max) set([...arr, key]);
    };

    /* ─── Data helpers ─── */
    const addDay = () => { markDirty(); setDays([...days, { dayNumber: days.length + 1, title: `Dia ${days.length + 1}`, summary: "", description: "", activities: [] }]); };
    const removeDay = (i: number) => { markDirty(); setDays(days.filter((_, idx) => idx !== i)); };
    const updateDay = (i: number, f: string, v: any) => { markDirty(); const u = [...days]; u[i] = { ...u[i], [f]: v }; setDays(u); };
    const addActivity = (di: number) => { markDirty(); const u = [...days]; u[di].activities = [...u[di].activities, { title: "", description: "", time: "", duration: "", location: "", type: "activity", icon: "📍", tips: "", latitude: "", longitude: "", category: "" }]; setDays(u); };
    const updateActivity = (di: number, ai: number, f: string, v: any) => { markDirty(); const u = [...days]; u[di].activities[ai] = { ...u[di].activities[ai], [f]: v }; setDays(u); };
    const removeActivity = (di: number, ai: number) => { markDirty(); const u = [...days]; u[di].activities.splice(ai, 1); setDays([...u]); };
    const addAccommodation = () => { markDirty(); setAccommodations([...accommodations, { name: "", neighborhood: "", description: "", priceRange: "", rating: "", externalLink: "" }]); };
    const addTransport = () => { markDirty(); setTransports([...transports, { description: "", passTypes: "", estimatedPrice: "", notes: "" }]); };

    /* ─── Loading ─── */
    if (loading) return (
        <div className="editor-skeleton">
            <div className="editor-skeleton-bar short" /><div className="editor-skeleton-bar medium" />
            <div className="editor-skeleton-section" /><div className="editor-skeleton-section" />
        </div>
    );

    /* ─── Render section content ─── */
    const renderSection = (key: SectionKey) => {
        switch (key) {
            /* ═══ BLOCO 1: IDENTIDADE ═══ */
            case "identity": return (<>
                <div className="form-group">
                    <label className="form-label">Título do Roteiro *</label>
                    <input className="form-input" value={title} onChange={e => { setTitle(e.target.value); markDirty(); }} placeholder='ex: "Tóquio Autêntica – 15 dias de Cultura"' />
                </div>
                <div className="form-group">
                    <label className="form-label">Subtítulo / Descrição curta *</label>
                    <input className="form-input" value={subtitle} onChange={e => { setSubtitle(e.target.value.slice(0, 160)); markDirty(); }} placeholder="Até 160 caracteres" maxLength={160} />
                    <span className="form-helper">{subtitle.length}/160 caracteres</span>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">País *</label>
                        <select className="form-input" value={country} onChange={e => { setCountry(e.target.value); markDirty(); }}>
                            <option value="">Selecione o país</option>
                            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Cidade Principal *</label>
                        <input className="form-input" value={destination} onChange={e => { setDestination(e.target.value); markDirty(); }} placeholder="ex: Tóquio" />
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Duração (dias) *</label>
                        <input className="form-input" type="number" value={duration} onChange={e => { setDuration(parseInt(e.target.value) || 1); markDirty(); }} min={1} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Classificação</label>
                        <div className="editor-duration-badge">{getDurationLabel(duration)}</div>
                    </div>
                </div>
                <div className="form-group">
                    <label className="form-label">Descrição completa</label>
                    <textarea className="form-input" style={{ minHeight: 120 }} value={description} onChange={e => { setDescription(e.target.value); markDirty(); }} placeholder="Descreva o que o viajante vai encontrar..." />
                    <span className="form-helper">{description.length} caracteres</span>
                </div>
                <div className="form-group">
                    <label className="form-label">Estilo de Experiência (máx 3) — {travelStyles.length}/3</label>
                    <div className="editor-chip-grid">{STYLE_OPTIONS.map(s => (
                        <button key={s.key} className={`editor-chip ${travelStyles.includes(s.key) ? "active" : ""}`} onClick={() => toggleChip(travelStyles, setTravelStyles, s.key, 3)}>
                            {s.icon} {s.label}
                        </button>
                    ))}</div>
                </div>
                <div className="form-group">
                    <label className="form-label">Categorias Temáticas (mín 1, máx 5) — {categories.length}/5</label>
                    <div className="editor-chip-grid">{CATEGORY_OPTIONS.map(c => (
                        <button key={c.key} className={`editor-chip ${categories.includes(c.key) ? "active" : ""}`} onClick={() => toggleChip(categories, setCategories, c.key, 5)}>
                            {c.icon} {c.label}
                        </button>
                    ))}</div>
                </div>
                <div className="form-group">
                    <label className="form-label">Tipo de Produto</label>
                    <select className="form-input" value={productType} onChange={e => { setProductType(e.target.value); markDirty(); }}>
                        <option value="DIGITAL">📱 Digital</option>
                        <option value="PRESENCIAL">🤝 Presencial</option>
                        <option value="HIBRIDO">🔄 Híbrido</option>
                    </select>
                </div>
            </>);

            /* ═══ BLOCO 2: COMERCIAL ═══ */
            case "commerce": return (<>
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Preço *</label>
                        <input className="form-input" type="number" value={price || ""} onChange={e => { setPrice(parseFloat(e.target.value) || 0); markDirty(); }} step={0.01} min={0} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Promoção</label>
                        <input className="form-input" type="number" value={promoPrice ?? ""} onChange={e => { setPromoPrice(e.target.value ? parseFloat(e.target.value) : null); markDirty(); }} placeholder="Preço promocional" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Moeda</label>
                        <select className="form-input" value={currency} onChange={e => { setCurrency(e.target.value); markDirty(); }}>
                            <option value="BRL">BRL (R$)</option><option value="USD">USD ($)</option><option value="EUR">EUR (€)</option>
                        </select>
                    </div>
                </div>
                <div className="form-group">
                    <label className="form-label">Parcelamento (parcelas)</label>
                    <input className="form-input" type="number" value={installments ?? ""} onChange={e => { setInstallments(e.target.value ? parseInt(e.target.value) : null); markDirty(); }} placeholder="ex: 12" min={1} max={24} />
                    {installments && price > 0 && <span className="form-helper">Até {installments}x de R$ {(price / installments).toFixed(2)}</span>}
                </div>
                {[
                    { label: "📥 Download offline", desc: "Pode baixar para acessar sem internet", val: offlineDownload, set: setOfflineDownload },
                ].map(t => (
                    <div className="editor-toggle-row" key={t.label}>
                        <div className="editor-toggle-info"><span className="editor-toggle-label">{t.label}</span><span className="editor-toggle-desc">{t.desc}</span></div>
                        <label className="editor-toggle"><input type="checkbox" checked={t.val} onChange={e => { t.set(e.target.checked); markDirty(); }} /><span className="editor-toggle-track" /><span className="editor-toggle-thumb" /></label>
                    </div>
                ))}
                <div className="editor-legal-notice">⚠️ Aviso automático: &quot;Produto digital. Não inclui serviços turísticos.&quot;</div>
            </>);

            /* ═══ BLOCO 3: MÓDULOS ═══ */
            case "modules": return (<>
                <span className="form-helper">Ative os módulos que serão incluídos no roteiro. Cada módulo ativo aparece como chip na vitrine.</span>
                <div className="editor-module-grid">{MODULE_OPTIONS.map(m => (
                    <div key={m.key} className={`editor-module-card ${activeModules.includes(m.key) ? "active" : ""}`} onClick={() => toggleChip(activeModules, setActiveModules, m.key, 9)}>
                        <div className="editor-module-icon">{m.icon}</div>
                        <div className="editor-module-info"><span className="editor-module-label">{m.label}</span><span className="editor-module-desc">{m.desc}</span></div>
                        <label className="editor-toggle"><input type="checkbox" checked={activeModules.includes(m.key)} onChange={() => toggleChip(activeModules, setActiveModules, m.key, 9)} /><span className="editor-toggle-track" /><span className="editor-toggle-thumb" /></label>
                    </div>
                ))}</div>
            </>);

            /* ═══ BLOCO 4: ITINERÁRIO ═══ */
            case "itinerary": return (<>
                {days.map((day, di) => (
                    <div className="editor-day-card" key={di}>
                        <div className="editor-day-header">
                            <div className="editor-day-number">
                                <div className="editor-day-badge">{di + 1}</div>
                                <input className="editor-day-title-input" value={day.title} onChange={e => updateDay(di, "title", e.target.value)} placeholder={`Título do Dia ${di + 1}`} />
                            </div>
                            <button className="btn-remove" onClick={() => removeDay(di)}>🗑️</button>
                        </div>
                        <div className="editor-day-body">
                            <div className="form-group">
                                <textarea className="form-input" style={{ minHeight: 60 }} value={day.description} onChange={e => updateDay(di, "description", e.target.value)} placeholder="O que esperar nesse dia..." />
                            </div>
                            <div className="editor-activities">
                                <div className="editor-activities-label">Atividades ({day.activities.length})</div>
                                {day.activities.map((act, ai) => (
                                    <div className="editor-activity-card" key={ai}>
                                        <div className="editor-activity-row">
                                            <input className="editor-act-time" value={act.time} onChange={e => updateActivity(di, ai, "time", e.target.value)} placeholder="09:00" />
                                            <input className="editor-act-title" value={act.title} onChange={e => updateActivity(di, ai, "title", e.target.value)} placeholder="O que fazer" />
                                            <input className="editor-act-dur" value={act.duration} onChange={e => updateActivity(di, ai, "duration", e.target.value)} placeholder="2h" />
                                        </div>
                                        <div className="editor-activity-row">
                                            <input value={act.location} onChange={e => updateActivity(di, ai, "location", e.target.value)} placeholder="📍 Local" />
                                            <input value={act.latitude} onChange={e => updateActivity(di, ai, "latitude", e.target.value)} placeholder="Lat" style={{ width: 80 }} />
                                            <input value={act.longitude} onChange={e => updateActivity(di, ai, "longitude", e.target.value)} placeholder="Lng" style={{ width: 80 }} />
                                            <select value={act.category} onChange={e => updateActivity(di, ai, "category", e.target.value)} style={{ width: 120 }}>
                                                <option value="">Tipo</option><option value="atração">🎫 Atração</option><option value="restaurante">🍴 Restaurante</option><option value="hotel">🏨 Hotel</option>
                                            </select>
                                            <button className="btn-remove" onClick={() => removeActivity(di, ai)}>✕</button>
                                        </div>
                                        <div className="editor-activity-row">
                                            <textarea value={act.tips} onChange={e => updateActivity(di, ai, "tips", e.target.value)} placeholder="💡 Dica opcional..." style={{ minHeight: 40 }} />
                                        </div>
                                    </div>
                                ))}
                                <button className="btn-add-item" onClick={() => addActivity(di)}>+ Atividade</button>
                            </div>
                        </div>
                    </div>
                ))}
                <button className="btn-add-item full-width" onClick={addDay}>+ Adicionar Dia</button>
                {days.length < 3 && <div className="editor-validation-alert">⚠️ Mínimo de 3 dias necessários para publicar ({days.length}/3)</div>}

                {/* ── Highlights ── */}
                <div className="editor-subsection" style={{ marginTop: 24 }}>
                    <h4 style={{ margin: "0 0 8px", fontSize: 14, color: "var(--text-secondary)" }}>⭐ Destaques do roteiro</h4>
                    <div className="editor-tag-list">
                        {highlightItems.map((h, i) => (
                            <span key={i} className="editor-tag">
                                {h}
                                <button onClick={() => { setHighlightItems(highlightItems.filter((_, idx) => idx !== i)); markDirty(); }}>×</button>
                            </span>
                        ))}
                    </div>
                    <div className="editor-tag-input-row">
                        <input className="form-input" value={newHighlight} onChange={e => setNewHighlight(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && newHighlight.trim()) { setHighlightItems([...highlightItems, newHighlight.trim()]); setNewHighlight(""); markDirty(); } }} placeholder="Ex: Sub à Torre Eiffel, Cruzeiro Sena..." />
                        <button className="btn-add-item" onClick={() => { if (newHighlight.trim()) { setHighlightItems([...highlightItems, newHighlight.trim()]); setNewHighlight(""); markDirty(); } }}>+</button>
                    </div>
                </div>

                {/* ── Inclusions ── */}
                <div className="editor-subsection" style={{ marginTop: 16 }}>
                    <h4 style={{ margin: "0 0 8px", fontSize: 14, color: "var(--text-secondary)" }}>✅ O que está incluso</h4>
                    <div className="editor-tag-list">
                        {inclusionItems.map((inc, i) => (
                            <span key={i} className="editor-tag editor-tag-green">
                                {inc}
                                <button onClick={() => { setInclusionItems(inclusionItems.filter((_, idx) => idx !== i)); markDirty(); }}>×</button>
                            </span>
                        ))}
                    </div>
                    <div className="editor-tag-input-row">
                        <input className="form-input" value={newInclusion} onChange={e => setNewInclusion(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && newInclusion.trim()) { setInclusionItems([...inclusionItems, newInclusion.trim()]); setNewInclusion(""); markDirty(); } }} placeholder="Ex: Roteiro dia a dia (10 dias), Mapa interativo..." />
                        <button className="btn-add-item" onClick={() => { if (newInclusion.trim()) { setInclusionItems([...inclusionItems, newInclusion.trim()]); setNewInclusion(""); markDirty(); } }}>+</button>
                    </div>
                </div>

                {/* ── Imagens ── */}
                <div className="editor-subsection" style={{ marginTop: 16 }}>
                    <h4 style={{ margin: "0 0 8px", fontSize: 14, color: "var(--text-secondary)" }}>🖼️ URLs das Imagens</h4>
                    {images.map((url, i) => (
                        <div className="editor-tag-input-row" key={i} style={{ marginBottom: 6 }}>
                            <input className="form-input" value={url} onChange={e => { const u = [...images]; u[i] = e.target.value; setImages(u); markDirty(); }} placeholder="https://..." />
                            <button className="btn-remove" onClick={() => { setImages(images.filter((_, idx) => idx !== i)); markDirty(); }}>✕</button>
                        </div>
                    ))}
                    <button className="btn-add-item" onClick={() => setImages([...images, ""])}>+ Imagem</button>
                </div>

                {/* ── Hospedagem (gated by module) ── */}
                {activeModules.includes("hospedagem") && (
                <div className="editor-subsection" style={{ marginTop: 24 }}>
                    <h4 style={{ margin: "0 0 8px", fontSize: 14, color: "var(--text-secondary)" }}>🏨 Hospedagens Sugeridas</h4>
                    {accommodations.map((acc, i) => (
                        <div className="editor-activity-card" key={i} style={{ marginBottom: 10 }}>
                            <div className="editor-activity-row">
                                <input className="form-input" value={acc.name} onChange={e => { const u = [...accommodations]; u[i].name = e.target.value; setAccommodations(u); markDirty(); }} placeholder="Nome do hotel / hostel" style={{ flex: 2 }} />
                                <input className="form-input" value={acc.rating} onChange={e => { const u = [...accommodations]; u[i].rating = e.target.value; setAccommodations(u); markDirty(); }} placeholder="Nota (ex: 8.5)" style={{ width: 90 }} />
                                <button className="btn-remove" onClick={() => { setAccommodations(accommodations.filter((_, idx) => idx !== i)); markDirty(); }}>✕</button>
                            </div>
                            <div className="editor-activity-row">
                                <input className="form-input" value={acc.neighborhood} onChange={e => { const u = [...accommodations]; u[i].neighborhood = e.target.value; setAccommodations(u); markDirty(); }} placeholder="Bairro / Localização" />
                                <input className="form-input" value={acc.priceRange} onChange={e => { const u = [...accommodations]; u[i].priceRange = e.target.value; setAccommodations(u); markDirty(); }} placeholder="Faixa de preço (ex: R$ 150-250/noite)" />
                            </div>
                            <div className="editor-activity-row">
                                <textarea className="form-input" value={acc.description} onChange={e => { const u = [...accommodations]; u[i].description = e.target.value; setAccommodations(u); markDirty(); }} placeholder="Descrição curta e dicas" style={{ minHeight: 50 }} rows={2} />
                            </div>
                            <div className="editor-activity-row">
                                <input className="form-input" value={acc.externalLink} onChange={e => { const u = [...accommodations]; u[i].externalLink = e.target.value; setAccommodations(u); markDirty(); }} placeholder="Link externo (Booking, Hostelworld...)" />
                            </div>
                        </div>
                    ))}
                    <button className="btn-add-item" onClick={addAccommodation}>+ Hospedagem</button>
                </div>
                )}

                {/* ── Transporte (gated by module) ── */}
                {activeModules.includes("transporte") && (
                <div className="editor-subsection" style={{ marginTop: 24 }}>
                    <h4 style={{ margin: "0 0 8px", fontSize: 14, color: "var(--text-secondary)" }}>🚌 Opções de Transporte</h4>
                    {transports.map((t, i) => (
                        <div className="editor-activity-card" key={i} style={{ marginBottom: 10 }}>
                            <div className="editor-activity-row">
                                <input className="form-input" value={t.description} onChange={e => { const u = [...transports]; u[i].description = e.target.value; setTransports(u); markDirty(); }} placeholder="Ex: Passe de metrô semanal Paris" style={{ flex: 2 }} />
                                <button className="btn-remove" onClick={() => { setTransports(transports.filter((_, idx) => idx !== i)); markDirty(); }}>✕</button>
                            </div>
                            <div className="editor-activity-row">
                                <input className="form-input" value={t.passTypes} onChange={e => { const u = [...transports]; u[i].passTypes = e.target.value; setTransports(u); markDirty(); }} placeholder="Tipo de passe / bilhete" />
                                <input className="form-input" value={t.estimatedPrice} onChange={e => { const u = [...transports]; u[i].estimatedPrice = e.target.value; setTransports(u); markDirty(); }} placeholder="Preço estimado (ex: R$ 170/semana)" />
                            </div>
                            <div className="editor-activity-row">
                                <textarea className="form-input" value={t.notes} onChange={e => { const u = [...transports]; u[i].notes = e.target.value; setTransports(u); markDirty(); }} placeholder="Notas e dicas adicionais" style={{ minHeight: 50 }} rows={2} />
                            </div>
                        </div>
                    ))}
                    <button className="btn-add-item" onClick={addTransport}>+ Opção de Transporte</button>
                </div>
                )}

                {/* ── Restaurantes Selecionados (gated by module) ── */}
                {activeModules.includes("restaurantes") && (
                <div className="editor-subsection" style={{ marginTop: 24 }}>
                    <h4 style={{ margin: "0 0 4px", fontSize: 14, color: "var(--text-secondary)" }}>🍽️ Restaurantes Selecionados</h4>
                    <span className="form-helper" style={{ marginBottom: 12, display: "block" }}>Recomende restaurantes e experiências gastronômicas para o viajante.</span>
                    {restaurants.map((rest, i) => (
                        <div className="editor-activity-card" key={i} style={{ marginBottom: 12 }}>
                            <div className="editor-activity-row">
                                <input className="form-input" value={rest.name} onChange={e => { const u = [...restaurants]; u[i].name = e.target.value; setRestaurants(u); markDirty(); }} placeholder="Nome do restaurante *" style={{ flex: 2 }} />
                                <select className="form-input" value={rest.cuisine} onChange={e => { const u = [...restaurants]; u[i].cuisine = e.target.value; setRestaurants(u); markDirty(); }} style={{ width: 140 }}>
                                    <option value="">Culinária</option>
                                    {CUISINE_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <button className="btn-remove" onClick={() => { setRestaurants(restaurants.filter((_, idx) => idx !== i)); markDirty(); }}>✕</button>
                            </div>
                            <div className="editor-activity-row">
                                <input className="form-input" value={rest.location} onChange={e => { const u = [...restaurants]; u[i].location = e.target.value; setRestaurants(u); markDirty(); }} placeholder="Localização / Bairro *" />
                                <input className="form-input" value={rest.priceRange} onChange={e => { const u = [...restaurants]; u[i].priceRange = e.target.value; setRestaurants(u); markDirty(); }} placeholder="Preço por pessoa (ex: R$ 30-60)" />
                            </div>
                            <div className="editor-activity-row">
                                <textarea className="form-input" value={rest.description} onChange={e => { const u = [...restaurants]; u[i].description = e.target.value; setRestaurants(u); markDirty(); }} placeholder="Descrição / Por que recomendar" style={{ minHeight: 50 }} rows={2} />
                            </div>
                            <div className="editor-activity-row">
                                <input className="form-input" value={rest.hours} onChange={e => { const u = [...restaurants]; u[i].hours = e.target.value; setRestaurants(u); markDirty(); }} placeholder="Horário (ex: 17:00 - 23:00)" />
                                <input className="form-input" value={rest.externalLink} onChange={e => { const u = [...restaurants]; u[i].externalLink = e.target.value; setRestaurants(u); markDirty(); }} placeholder="Link externo (Google Maps, reserva)" />
                            </div>
                            <div className="editor-activity-row">
                                <textarea className="form-input" value={rest.tips} onChange={e => { const u = [...restaurants]; u[i].tips = e.target.value; setRestaurants(u); markDirty(); }} placeholder="💡 Dicas de experiência (ex: Chegar às 19h para evitar fila)" style={{ minHeight: 40 }} rows={2} />
                            </div>
                        </div>
                    ))}
                    <button className="btn-add-item" onClick={() => { setRestaurants([...restaurants, { name: "", cuisine: "", location: "", description: "", priceRange: "", hours: "", externalLink: "", tips: "" }]); markDirty(); }}>+ Restaurante</button>
                </div>
                )}

                {/* ── Dicas Gerais do Viajante (gated by module) ── */}
                {activeModules.includes("dicas") && (
                <div className="editor-subsection" style={{ marginTop: 24 }}>
                    <h4 style={{ margin: "0 0 4px", fontSize: 14, color: "var(--text-secondary)" }}>💡 Dicas Gerais do Viajante</h4>
                    <span className="form-helper" style={{ marginBottom: 12, display: "block" }}>Compartilhe dicas úteis baseadas na sua experiência real no destino.</span>
                    {generalTips.map((tip, i) => (
                        <div className="editor-checklist-item" key={i}>
                            <span style={{ flex: 1 }}>{tip}</span>
                            <button className="btn-remove" onClick={() => { setGeneralTips(generalTips.filter((_, idx) => idx !== i)); markDirty(); }}>✕</button>
                        </div>
                    ))}
                    <div className="editor-tag-input-row">
                        <input className="form-input" value={newGeneralTip} onChange={e => setNewGeneralTip(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && newGeneralTip.trim()) { setGeneralTips([...generalTips, newGeneralTip.trim()]); setNewGeneralTip(""); markDirty(); } }} placeholder="Ex: Comprei ida e volta pela LATAM com 3 meses de antecedência..." />
                        <button className="btn-add-item" onClick={() => { if (newGeneralTip.trim()) { setGeneralTips([...generalTips, newGeneralTip.trim()]); setNewGeneralTip(""); markDirty(); } }}>+</button>
                    </div>
                </div>
                )}
            </>);

            /* ═══ BLOCO 5: GASTO ═══ */
            case "spending": return (<>
                <div className="form-group">
                    <label className="form-label">Moeda</label>
                    <select className="form-input" value={spendingCurrency} onChange={e => { setSpendingCurrency(e.target.value); markDirty(); }}>
                        <option value="BRL">BRL (R$)</option><option value="USD">USD ($)</option><option value="EUR">EUR (€)</option>
                    </select>
                </div>
                {spendingBreakdown.length === 0 && (
                    <button className="btn-add-item" onClick={() => { setSpendingBreakdown(SPENDING_CATS.map(c => ({ category: c, min: "", max: "" }))); markDirty(); }}>
                        ⚡ Preencher categorias padrão
                    </button>
                )}
                <div className="editor-breakdown-list">
                    {spendingBreakdown.map((item, i) => (
                        <div className="editor-breakdown-row" key={i}>
                            <input className="form-input" value={item.category} onChange={e => { const u = [...spendingBreakdown]; u[i].category = e.target.value; setSpendingBreakdown(u); markDirty(); }} placeholder="Categoria" />
                            <input className="form-input" type="number" value={item.min} onChange={e => { const u = [...spendingBreakdown]; u[i].min = e.target.value; setSpendingBreakdown(u); markDirty(); }} placeholder="Mínimo" />
                            <input className="form-input" type="number" value={item.max} onChange={e => { const u = [...spendingBreakdown]; u[i].max = e.target.value; setSpendingBreakdown(u); markDirty(); }} placeholder="Máximo" />
                            <button className="btn-remove" onClick={() => { setSpendingBreakdown(spendingBreakdown.filter((_, idx) => idx !== i)); markDirty(); }}>✕</button>
                        </div>
                    ))}
                </div>
                {spendingBreakdown.length > 0 && (
                    <>
                        <button className="btn-add-item" onClick={() => { setSpendingBreakdown([...spendingBreakdown, { category: "", min: "", max: "" }]); markDirty(); }}>+ Categoria</button>
                        <div className="editor-breakdown-total">
                            <span className="editor-breakdown-total-label">Total estimado por pessoa</span>
                            <span className="editor-breakdown-total-value">
                                R$ {spendingBreakdown.reduce((s, b) => s + (parseFloat(b.min) || 0), 0).toLocaleString("pt-BR")} – {spendingBreakdown.reduce((s, b) => s + (parseFloat(b.max) || 0), 0).toLocaleString("pt-BR")}
                            </span>
                        </div>
                    </>
                )}
            </>);

            /* ═══ BLOCO 6: MEU VOO ═══ */
            case "flight": {
                const renderFlightLeg = (leg: FlightLeg, setLeg: (l: FlightLeg) => void, label: string, icon: string) => (
                    <>
                        <h4 style={{ margin: "16px 0 8px", fontSize: 14 }}>{icon} {label}</h4>
                        <div className="editor-activity-card" style={{ marginBottom: 10 }}>
                            <div className="editor-activity-row">
                                <input className="form-input" value={leg.airline} onChange={e => { setLeg({ ...leg, airline: e.target.value }); markDirty(); }} placeholder="Companhia aérea (ex: LATAM)" style={{ flex: 1 }} />
                                <input className="form-input" value={leg.route} onChange={e => { setLeg({ ...leg, route: e.target.value }); markDirty(); }} placeholder="Rota (ex: GRU → CDG)" style={{ flex: 1 }} />
                            </div>
                            <div className="editor-activity-row">
                                <input className="form-input" value={leg.departure} onChange={e => { setLeg({ ...leg, departure: e.target.value }); markDirty(); }} placeholder="Saída (ex: 22:30)" />
                                <input className="form-input" value={leg.arrival} onChange={e => { setLeg({ ...leg, arrival: e.target.value }); markDirty(); }} placeholder="Chegada (ex: 14:15 +1)" />
                                <input className="form-input" value={leg.duration} onChange={e => { setLeg({ ...leg, duration: e.target.value }); markDirty(); }} placeholder="Duração (ex: 11h45)" />
                            </div>
                            <div className="editor-activity-row">
                                <div className="form-group" style={{ flex: 0, margin: 0 }}>
                                    <label className="form-label" style={{ fontSize: 12, margin: 0 }}>Paradas</label>
                                    <input className="form-input" type="number" value={leg.stops} onChange={e => { setLeg({ ...leg, stops: parseInt(e.target.value) || 0 }); markDirty(); }} min={0} style={{ width: 80 }} />
                                </div>
                                <input className="form-input" value={leg.pricePaid} onChange={e => { setLeg({ ...leg, pricePaid: e.target.value }); markDirty(); }} placeholder="Preço pago (ex: R$ 3.450)" style={{ flex: 1 }} />
                            </div>
                        </div>
                    </>
                );
                return (<>
                    <span className="form-helper">Informe os dados do voo que você usou/recomenda para esse destino.</span>
                    {renderFlightLeg(flightOutbound, setFlightOutbound, "Voo de Ida", "🛫")}
                    {renderFlightLeg(flightReturn, setFlightReturn, "Voo de Volta", "🛬")}

                    <h4 style={{ margin: "24px 0 8px", fontSize: 14 }}>💬 Dicas sobre o Voo</h4>
                    {flightTips.map((tip, i) => (
                        <div className="editor-checklist-item" key={i}>
                            <span style={{ flex: 1 }}>{tip}</span>
                            <button className="btn-remove" onClick={() => { setFlightTips(flightTips.filter((_, idx) => idx !== i)); markDirty(); }}>✕</button>
                        </div>
                    ))}
                    <div className="editor-tag-input-row">
                        <input className="form-input" value={newFlightTip} onChange={e => setNewFlightTip(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && newFlightTip.trim()) { setFlightTips([...flightTips, newFlightTip.trim()]); setNewFlightTip(""); markDirty(); } }} placeholder="Ex: Voo noturno é a melhor opção — dormi no avião e cheguei de manhã" />
                        <button className="btn-add-item" onClick={() => { if (newFlightTip.trim()) { setFlightTips([...flightTips, newFlightTip.trim()]); setNewFlightTip(""); markDirty(); } }}>+</button>
                    </div>
                </>);
            }

            /* ═══ BLOCO 7: CHECKLIST ═══ */
            case "checklist": return (<>
                <h4 style={{ margin: "0 0 8px" }}>✅ Checklist</h4>
                <div className="editor-checklist-add">
                    <select className="form-input" value={newCheckCat} onChange={e => setNewCheckCat(e.target.value)} style={{ width: 140 }}>
                        {CHECKLIST_CATS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <input className="form-input" value={newCheckItem} onChange={e => setNewCheckItem(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && newCheckItem.trim()) { setChecklistItems([...checklistItems, { category: newCheckCat, item: newCheckItem.trim(), isDefault: true }]); setNewCheckItem(""); markDirty(); } }} placeholder="Novo item..." />
                    <button className="btn-add-item" onClick={() => { if (newCheckItem.trim()) { setChecklistItems([...checklistItems, { category: newCheckCat, item: newCheckItem.trim(), isDefault: true }]); setNewCheckItem(""); markDirty(); } }}>+</button>
                </div>
                {CHECKLIST_CATS.map(cat => {
                    const items = checklistItems.filter(c => c.category === cat); if (items.length === 0) return null; return (
                        <div key={cat} style={{ marginBottom: 12 }}>
                            <div className="form-label" style={{ textTransform: "capitalize" }}>{cat}</div>
                            {items.map((item, i) => {
                                const gi = checklistItems.indexOf(item); return (
                                    <div className="editor-checklist-item" key={i}>
                                        <span>{item.item}</span>
                                        <button className="btn-remove" onClick={() => { setChecklistItems(checklistItems.filter((_, idx) => idx !== gi)); markDirty(); }}>✕</button>
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}

                <div style={{ marginTop: 24, padding: "14px 16px", backgroundColor: "#F0F7FF", borderRadius: 10, borderLeft: "3px solid var(--teal)" }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)", marginBottom: 4 }}>💬 Perguntas & Respostas</div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                        A seção de Perguntas é gerada automaticamente pelos usuários. Quando alguém fizer uma pergunta na página do seu roteiro, ela aparecerá na sua <strong>Dashboard → Perguntas</strong> para você responder.
                    </div>
                </div>
            </>);

            /* ═══ BLOCO 7: PÓS-COMPRA ═══ */
            case "postpurchase": return (<>
                {[
                    { label: "📥 Download offline", desc: "Usuário pode baixar para usar sem internet", val: offlineDownload, set: setOfflineDownload },
                    { label: "📄 Exportar PDF", desc: "Permitir exportar como PDF", val: allowPdf, set: setAllowPdf },
                    { label: "🔗 Compartilhar", desc: "Permitir compartilhar com amigos", val: allowShare, set: setAllowShare },
                    { label: "♾️ Acesso vitalício", desc: "Sem prazo de expiração", val: lifetimeAccess, set: setLifetimeAccess },
                ].map(t => (
                    <div className="editor-toggle-row" key={t.label}>
                        <div className="editor-toggle-info"><span className="editor-toggle-label">{t.label}</span><span className="editor-toggle-desc">{t.desc}</span></div>
                        <label className="editor-toggle"><input type="checkbox" checked={t.val} onChange={e => { t.set(e.target.checked); markDirty(); }} /><span className="editor-toggle-track" /><span className="editor-toggle-thumb" /></label>
                    </div>
                ))}
            </>);

            default: return <p>Seção em construção...</p>;
        }
    };

    /* ═══════════════════════════ RENDER ═══════════════════════════ */
    return (
        <div className="editor-page">
            {toast && <div className={`editor-toast ${toast.type}`}>{toast.msg}</div>}

            {/* Header */}
            <div className="editor-header">
                <div className="editor-header-left">
                    <Link href="/dashboard/roteiros" className="btn-back">← Voltar</Link>
                    <h1 className="editor-title">{isNew ? "Novo Roteiro" : title || "Editar Roteiro"}</h1>
                </div>
                <div className="editor-header-right">
                    <div className={`quality-score-mini ${qualityScore >= 80 ? "high" : qualityScore >= 50 ? "medium" : "low"}`}>{qualityScore}%</div>
                    {dirty && <span className="editor-dirty-badge">● Não salvo</span>}
                    <button className="editor-save-btn" onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Publicar Roteiro"}</button>
                </div>
            </div>

            {/* Sections */}
            <div className="editor-sections">
                {SECTIONS.filter(sec => {
                    const requiredModule = SECTION_MODULE_MAP[sec.key];
                    if (!requiredModule) return true; // always visible (identity, commerce, modules, postpurchase)
                    return activeModules.includes(requiredModule);
                }).map(sec => (
                    <div key={sec.key} ref={el => { sectionRefs.current[sec.key] = el; }} className={`editor-section ${openSections.has(sec.key) ? "open" : ""} ${activeSection === sec.key ? "active" : ""}`}>
                        <button className="editor-section-header" onClick={() => { toggleSection(sec.key); setActiveSection(sec.key); }}>
                            <span className="editor-section-icon">{sec.icon}</span>
                            <span className="editor-section-title">{sec.title}</span>
                            <span className={`editor-section-status ${isSectionComplete(sec.key) ? "complete" : "pending"}`}>{isSectionComplete(sec.key) ? "Completo" : "Pendente"}</span>
                            <span className="editor-section-arrow">{openSections.has(sec.key) ? "▲" : "▼"}</span>
                        </button>
                        {openSections.has(sec.key) && <div className="editor-section-body">{renderSection(sec.key)}</div>}
                    </div>
                ))}
            </div>
        </div>
    );
}

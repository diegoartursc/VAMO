"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useCallback, use, type ReactNode } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getItineraryById, createItinerary, updateItinerary } from "../../../../lib/api";
import { Crown, Banknote, Backpack, Users, Heart, Mountain as ClimbIcon, Sofa, Landmark, UtensilsCrossed, Leaf, Dribbble, Flower2, Plane, Palmtree, MountainSnow, Building2, ScrollText, CalendarDays, Map, Hotel, Bus, CreditCard, UtensilsCrossed as Fork, Lightbulb, CircleCheck, Target, DollarSign, Package, CreditCard as CardIcon, Settings, Trash2, Star as StarIcon, MapPin, Ticket, Image, Truck, Zap, Infinity, Download, FileText, Link2, AlertTriangle, HelpCircle, X, Copy, ArrowLeft, Rocket } from "lucide-react";
import StepperNav, { StepperActions } from "../../../../components/dashboard/StepperNav";
import PhonePreview from "../../../../components/dashboard/PhonePreview";
import QualityCoach from "../../../../components/dashboard/QualityCoach";
import DraggableList, { DragHandle } from "../../../../components/dashboard/DraggableList";
import SectionInfo from "../../../../components/dashboard/SectionInfo";

/* ─── Constants ─── */
const STYLE_OPTIONS = [
    { key: "luxo", icon: <Crown size={14} />, label: "Luxo" },
    { key: "economico", icon: <Banknote size={14} />, label: "Econômico" },
    { key: "mochilao", icon: <Backpack size={14} />, label: "Mochilão" },
    { key: "familia", icon: <Users size={14} />, label: "Família" },
    { key: "romantico", icon: <Heart size={14} />, label: "Romântico" },
    { key: "aventura", icon: <ClimbIcon size={14} />, label: "Aventura" },
    { key: "conforto", icon: <Sofa size={14} />, label: "Conforto" },
];
const CATEGORY_OPTIONS = [
    { key: "cultura", icon: <Landmark size={14} />, label: "Cultura" },
    { key: "gastronomia", icon: <UtensilsCrossed size={14} />, label: "Gastronomia" },
    { key: "natureza", icon: <Leaf size={14} />, label: "Natureza" },
    { key: "esportes", icon: <Dribbble size={14} />, label: "Esportes" },
    { key: "relax", icon: <Flower2 size={14} />, label: "Relax" },
    { key: "eurotrip", icon: <Plane size={14} />, label: "Eurotrip" },
    { key: "praia", icon: <Palmtree size={14} />, label: "Praia" },
    { key: "montanha", icon: <MountainSnow size={14} />, label: "Montanha" },
    { key: "urbano", icon: <Building2 size={14} />, label: "Urbano" },
    { key: "historico", icon: <ScrollText size={14} />, label: "Histórico" },
];
const MODULE_OPTIONS = [
    { key: "itinerario", icon: <CalendarDays size={18} />, label: "Itinerário por dia", desc: "Roteiro dia a dia completo" },
    { key: "hospedagem", icon: <Hotel size={18} />, label: "Hospedagens", desc: "Hotéis e hospedagens sugeridas" },
    { key: "transporte", icon: <Bus size={18} />, label: "Transporte", desc: "Dicas de locomoção" },
    { key: "gasto", icon: <CreditCard size={18} />, label: "Estimativa de gastos por pessoa", desc: "Quanto você vai gastar" },
    { key: "restaurantes", icon: <Fork size={18} />, label: "Restaurantes", desc: "Onde comer" },
    { key: "dicas", icon: <Lightbulb size={18} />, label: "Dicas exclusivas", desc: "Dicas do criador" },
    { key: "checklist", icon: <CircleCheck size={18} />, label: "Checklist interativo", desc: "O que levar e preparar" },
    { key: "voo", icon: <Plane size={18} />, label: "Meu voo", desc: "Sugestões de voo" },
];
const CHECKLIST_CATS = ["documentos", "mala", "pre-viagem", "finanças", "apps úteis", "outros"];
type SectionKey = "identity" | "commerce" | "modules" | "itinerary" | "spending" | "checklist" | "postpurchase";
interface SectionDef { key: SectionKey; icon: ReactNode; title: string; }
const SECTIONS: SectionDef[] = [
    { key: "identity", icon: <Target size={16} />, title: "Sobre o Roteiro" },
    { key: "commerce", icon: <DollarSign size={16} />, title: "Preço e Venda" },
    { key: "modules", icon: <Package size={16} />, title: "Conteúdo Incluso" },
    { key: "itinerary", icon: <CalendarDays size={16} />, title: "Dia a Dia" },
    { key: "spending", icon: <CardIcon size={16} />, title: "Estimativa de Gastos por Pessoa" },
    { key: "checklist", icon: <CircleCheck size={16} />, title: "Preparativos e Dúvidas" },
];

const SECTION_TIPS: Record<SectionKey, string[]> = {
    identity: [
        "Use um título curto e chamativo — ele aparece nos resultados de busca",
        "A descrição deve ter entre 200-500 caracteres para melhor ranqueamento",
        "Selecione estilos e categorias para seu roteiro aparecer nas buscas certas",
        "Adicione pelo menos 3 fotos de alta qualidade do destino",
    ],
    commerce: [
        "Roteiros entre A$ 19-49 têm a melhor taxa de conversão",
        "Ative parcelas para aumentar as vendas em até 40%",
        "O preço promocional cria urgência — use com moderação",
    ],
    modules: [
        "Quanto mais módulos ativos, maior a percepção de valor",
        "Checklist e dicas exclusivas são os módulos mais valorizados pelos viajantes",
        "Módulos desativados não aparecem para o comprador",
    ],
    itinerary: [
        "Organize pelo menos 3 dias para um roteiro completo",
        "Inclua horários nas atividades — viajantes adoram cronogramas",
        "Adicione localização e horários detalhados para cada atividade",
        "Você pode arrastar os dias para reordenar",
    ],
    spending: [
        "Separe os gastos por categoria (hospedagem, alimentação, transporte...)",
        "Valores mín/máx ajudam o viajante a planejar melhor",
        "Selecione a moeda correta do destino",
    ],
    checklist: [
        "Adicione itens essenciais: documentos, vacinas, adaptadores de tomada",
        "O FAQ reduz em 70% as perguntas no WhatsApp",
        "Perguntas frequentes aumentam a confiança do comprador",
    ],
    postpurchase: [
        "Download offline permite uso sem internet — ideal para viagens internacionais",
        "Acesso vitalício aumenta a percepção de valor",
        "Permitir compartilhamento gera marketing boca a boca gratuito",
    ],
};

interface Activity { title: string; description: string; time: string; duration: string; location: string; type: string; icon: string; tips: string; latitude: string; longitude: string; category: string; }
interface Day { dayNumber: number; title: string; summary: string; description: string; activities: Activity[]; }
interface Accommodation { name: string; neighborhood: string; description: string; priceRange: string; rating: string; externalLink: string; }
interface Transport { description: string; passTypes: string; estimatedPrice: string; notes: string; }
interface ChecklistItem { category: string; item: string; isDefault: boolean; }
interface FaqItem { question: string; answer: string; }
interface BreakdownItem { category: string; min: string; max: string; }

const SPENDING_CATS = ["Hospedagem", "Alimentação", "Transporte", "Atrações", "Extras"];

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
    const isNew = id === "new" || id === "novo";
    const searchParams = useSearchParams();
    const fromId = searchParams.get("from");
    const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const formScrollRef = useRef<HTMLDivElement>(null);
    const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const router = useRouter();

    /* ─── UI state ─── */
    const [activeStep, setActiveStep] = useState(0);
    const [openSections, setOpenSections] = useState<Set<SectionKey>>(new Set(["identity"]));
    const [activeSection, setActiveSection] = useState<SectionKey>("identity");
    const [loading, setLoading] = useState(!isNew || !!fromId);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
    const [dirty, setDirty] = useState(false);
    const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
    const [lastSaved, setLastSaved] = useState<string | null>(null);

    /* ─── Bloco 1: Identidade ─── */
    const [title, setTitle] = useState("");
    const [subtitle, setSubtitle] = useState("");
    const [destination, setDestination] = useState("");
    const [country, setCountry] = useState("");
    const [locations, setLocations] = useState<{ country: string; cities: string[] }[]>([]);
    const [duration, setDuration] = useState(1);
    const [description, setDescription] = useState("");
    const [travelStyles, setTravelStyles] = useState<string[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [productType, setProductType] = useState("DIGITAL");

    /* ─── Bloco 2: Comercial ─── */
    const [price, setPrice] = useState(0);
    const [currency, setCurrency] = useState("AUD");
    const [promoPrice, setPromoPrice] = useState<number | null>(null);
    const [installments, setInstallments] = useState<number | null>(null);
    const [immediateAccess, setImmediateAccess] = useState(true);
    const [lifetimeAccess, setLifetimeAccess] = useState(true);
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
    const [spendingCurrency, setSpendingCurrency] = useState("AUD");

    /* ─── Bloco 6: Checklist + FAQ ─── */
    const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
    const [faqItems, setFaqItems] = useState<FaqItem[]>([]);
    const [newCheckItem, setNewCheckItem] = useState("");
    const [newCheckCat, setNewCheckCat] = useState("documentos");

    /* ─── Bloco 7: Pós-compra ─── */
    const [allowShare, setAllowShare] = useState(true);

    /* ─── Hospedagem & Transporte ─── */
    const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
    const [transports, setTransports] = useState<Transport[]>([]);

    /* ─── Quality score ─── */
    const qualityScore = calcQuality({ title, subtitle, destination, country, description, duration, price, travelStyles, categories, activeModules, highlightItems, inclusionItems: inclusionItems, days, spendingBreakdown, productType, promoPrice });

    /* ─── Toast auto-dismiss ─── */
    useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 4000); return () => clearTimeout(t); }, [toast]);

    /* ─── Mark dirty ─── */
    const markDirty = useCallback(() => setDirty(true), []);

    /* ─── Populate from data ─── */
    const populateFromData = useCallback((data: any) => {
        setTitle(data.title || ""); setSubtitle(data.subtitle || "");
        setDestination(data.destination || ""); setCountry(data.country || "");
        let mergedLocations: { country: string; cities: string[] }[] = [];
        if (data.locations && Array.isArray(data.locations) && data.locations.length > 0) {
            mergedLocations = data.locations;
        } else {
            if (data.country || data.destination) {
                mergedLocations.push({ country: data.country || "", cities: data.destination ? [data.destination] : [] });
            }
            if ((data.extraCountries?.length || 0) > 0 || (data.extraCities?.length || 0) > 0) {
                const maxLen = Math.max((data.extraCountries || []).length, (data.extraCities || []).length);
                for (let i = 0; i < maxLen; i++) {
                    const c = (data.extraCountries || [])[i] || "";
                    const d = (data.extraCities || [])[i];
                    mergedLocations.push({ country: c, cities: d ? [d] : [] });
                }
            }
        }
        if (mergedLocations.length === 0) mergedLocations = [{ country: "", cities: [] }];
        setLocations(mergedLocations);
        setDuration(data.duration || 1); setDescription(data.description || "");
        setTravelStyles(data.travelStyles || []); setCategories(data.categories || []);
        setProductType(data.productType || "DIGITAL");
        setPrice(data.price || 0); setCurrency(data.currency || "AUD");
        setPromoPrice(data.promoPrice || null); setInstallments(data.installments || null);
        setImmediateAccess(data.immediateAccess ?? true); setLifetimeAccess(data.lifetimeAccess ?? true);
        setFeatured(data.featured || false);
        setActiveModules(data.activeModules || []);
        setHighlightItems(data.highlights || []); setInclusionItems(data.inclusions || []);
        setImages(Array.isArray(data.images) ? data.images.map((img: any) => typeof img === "string" ? img : img.url) : [""]);
        setAllowShare(data.allowShare ?? true);
        const sp = data.estimatedSpending || {};
        setSpendingCurrency(sp.currency || "AUD");
        setSpendingBreakdown((sp.breakdown || []).map((b: any) => ({ category: b.category || "", min: b.min || "", max: b.max || "" })));
        setDays((data.days || []).map((d: any) => ({
            dayNumber: d.dayNumber, title: d.title || "", summary: d.summary || "", description: d.description || "",
            activities: (d.activities || []).map((a: any) => ({
                title: a.title || "", description: a.description || "", time: a.time || "", duration: a.duration || "",
                location: a.location || "", type: a.type || "activity", icon: a.icon || "pin",
                tips: a.tips || "", latitude: a.latitude?.toString() || "", longitude: a.longitude?.toString() || "",
                category: a.category || "",
            })),
        })));
        setAccommodations((data.accommodations || []).map((a: any) => ({
            name: a.name || "", neighborhood: a.neighborhood || "", description: a.description || "",
            priceRange: a.priceRange || "", rating: a.rating?.toString() || "", externalLink: a.externalLink || "",
        })));
        setTransports((data.transports || []).map((t: any) => ({
            description: t.description || "", passTypes: t.passTypes || "",
            estimatedPrice: t.estimatedPrice || "", notes: t.notes || "",
        })));
        setChecklistItems((data.checklists || []).map((c: any) => ({
            category: c.category || "documentos", item: c.item || "", isDefault: c.isDefault ?? true,
        })));
        setFaqItems((data.faqQuestions || []).map((f: any) => ({ question: f.question || "", answer: f.answer || "" })));
    }, []);

    /* ─── Load data (edit or duplicate) ─── */
    useEffect(() => {
        const loadId = isNew ? fromId : id;
        if (!loadId) {
            populateFromData({});
            setLoading(false);
            return;
        }
        getItineraryById(loadId)
            .then((data: any) => populateFromData(data))
            .catch((err) => setToast({ msg: `Erro ao carregar: ${err.message}`, type: "error" }))
            .finally(() => setLoading(false));
    }, [id, isNew, fromId, populateFromData]);

    /* ─── Build payload ─── */
    const buildPayload = useCallback(() => {
        const spMin = spendingBreakdown.reduce((s, b) => s + (parseFloat(b.min) || 0), 0);
        const spMax = spendingBreakdown.reduce((s, b) => s + (parseFloat(b.max) || 0), 0);
        const mainCountry = locations[0]?.country || "";
        const mainDestination = locations[0]?.cities[0] || "";
        return {
            title, subtitle, destination: mainDestination, country: mainCountry, locations, description,
            price: price.toString(), currency, duration: duration.toString(), featured,
            travelStyles, categories, productType, activeModules,
            promoPrice: promoPrice?.toString() || undefined,
            installments: installments?.toString() || undefined,
            immediateAccess, lifetimeAccess, allowShare,
            highlights: highlightItems, inclusions: inclusionItems,
            estimatedSpending: { min: spMin, max: spMax, currency: spendingCurrency, breakdown: spendingBreakdown },
            images: images.filter(Boolean),
            days: days.map((d, i) => ({ ...d, dayNumber: i + 1, activities: d.activities.map(a => ({ ...a, latitude: a.latitude ? parseFloat(a.latitude) : undefined, longitude: a.longitude ? parseFloat(a.longitude) : undefined })) })),
            accommodations, transports, checklists: checklistItems,
            faqQuestions: faqItems,
        };
    }, [title, subtitle, destination, country, description, price, currency, duration, featured, travelStyles, categories, productType, activeModules, promoPrice, installments, immediateAccess, lifetimeAccess, allowShare, highlightItems, inclusionItems, spendingBreakdown, spendingCurrency, images, days, accommodations, transports, checklistItems]);

    /* ─── Save ─── */
    const handleSave = async () => {
        if (!title || !destination || !country) { setToast({ msg: "Preencha título, destino e país", type: "error" }); return; }
        if (price <= 0) { setToast({ msg: "Defina um preço válido", type: "error" }); return; }
        if (categories.length < 1) { setToast({ msg: "Selecione pelo menos 1 categoria", type: "error" }); return; }
        if (days.length < 3) { setToast({ msg: "Cadastre pelo menos 3 dias", type: "error" }); return; }
        if (activeModules.length < 1) { setToast({ msg: "Ative pelo menos 1 módulo", type: "error" }); return; }

        setSaving(true);
        try {
            const payload = { ...buildPayload(), status: "PENDING_REVIEW" };
            if (isNew) {
                const created = await createItinerary(payload);
                setToast({ msg: "Roteiro enviado para revisão!", type: "success" });
                router.push(`/dashboard/roteiro/${created.id}`);
            } else {
                await updateItinerary(id, payload);
                setToast({ msg: "Alterações enviadas para revisão!", type: "success" });
                setDirty(false);
            }
        } catch (err: any) { setToast({ msg: err.message, type: "error" }); }
        finally { setSaving(false); }
    };

    /* ─── Auto-save with 5s debounce ─── */
    useEffect(() => {
        if (isNew || !dirty) return;
        if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
        autoSaveRef.current = setTimeout(async () => {
            setSaveStatus("saving");
            try {
                await updateItinerary(id, buildPayload());
                setDirty(false);
                setSaveStatus("saved");
                setLastSaved(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
            } catch { setSaveStatus("idle"); }
        }, 5000);
        return () => { if (autoSaveRef.current) clearTimeout(autoSaveRef.current); };
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
            case "checklist": return checklistItems.length > 0 || faqItems.length > 0;
            case "postpurchase": return true;
            default: return false;
        }
    }, [title, destination, country, categories, price, activeModules, days, spendingBreakdown, checklistItems, faqItems]);

    /* ─── Chip toggle ─── */
    const toggleChip = (arr: string[], set: (v: string[]) => void, key: string, max: number) => {
        markDirty();
        if (arr.includes(key)) set(arr.filter(k => k !== key));
        else if (arr.length < max) set([...arr, key]);
    };

    /* ─── Data helpers ─── */
    const addDay = () => { markDirty(); setDays([...days, { dayNumber: days.length + 1, title: "", summary: "", description: "", activities: [] }]); };
    const removeDay = (i: number) => { markDirty(); setDays(days.filter((_, idx) => idx !== i)); };
    const updateDay = (i: number, f: string, v: any) => { markDirty(); const u = [...days]; u[i] = { ...u[i], [f]: v }; setDays(u); };
    const reorderDays = (newDays: Day[]) => { markDirty(); setDays(newDays); };
    const addActivity = (di: number) => { markDirty(); const u = [...days]; u[di].activities = [...u[di].activities, { title: "", description: "", time: "", duration: "", location: "", type: "activity", icon: "pin", tips: "", latitude: "", longitude: "", category: "" }]; setDays(u); };
    const updateActivity = (di: number, ai: number, f: string, v: any) => { markDirty(); const u = [...days]; u[di].activities[ai] = { ...u[di].activities[ai], [f]: v }; setDays(u); };
    const removeActivity = (di: number, ai: number) => { markDirty(); const u = [...days]; u[di].activities.splice(ai, 1); setDays([...u]); };
    const reorderActivities = (di: number, newActs: Activity[]) => { markDirty(); const u = [...days]; u[di].activities = newActs; setDays(u); };
    const addAccommodation = () => { markDirty(); setAccommodations([...accommodations, { name: "", neighborhood: "", description: "", priceRange: "", rating: "", externalLink: "" }]); };
    const addTransport = () => { markDirty(); setTransports([...transports, { description: "", passTypes: "", estimatedPrice: "", notes: "" }]); };

    /* ─── Warn before unload if dirty ─── */
    useEffect(() => {
        const handler = (e: BeforeUnloadEvent) => { if (dirty) { e.preventDefault(); } };
        window.addEventListener("beforeunload", handler);
        return () => window.removeEventListener("beforeunload", handler);
    }, [dirty]);

    /* ─── Back navigation with draft prompt ─── */
    const handleBack = async () => {
        if (!dirty) { router.push("/dashboard/roteiros"); return; }
        const choice = confirm("Você tem alterações não salvas.\n\nDeseja salvar como rascunho antes de sair?");
        if (choice) {
            try {
                const payload = { ...buildPayload(), status: "draft" };
                if (isNew) {
                    await createItinerary(payload);
                } else {
                    await updateItinerary(id, payload);
                }
            } catch { /* proceed anyway */ }
        }
        router.push("/dashboard/roteiros");
    };

    /* ─── Quality tips ─── */
    const qualityTips = [
        { condition: !title, text: "Adicione um título atraente para seu roteiro", priority: 1 },
        { condition: !destination, text: "Informe a cidade de destino principal", priority: 1 },
        { condition: !country, text: "Selecione o país de destino", priority: 2 },
        { condition: !description, text: "Escreva uma descrição completa do roteiro", priority: 3 },
        { condition: categories.length === 0, text: "Selecione pelo menos 1 categoria temática", priority: 2 },
        { condition: travelStyles.length === 0, text: "Escolha estilos de experiência (Luxo, Mochilão...)", priority: 3 },
        { condition: price <= 0, text: "Defina o preço do seu roteiro", priority: 2 },
        { condition: days.length < 3, text: `Cadastre pelo menos 3 dias (${days.length}/3)`, priority: 1 },
        { condition: highlightItems.length === 0, text: "Adicione destaques para atrair viajantes", priority: 4 },
        { condition: images.filter(Boolean).length < 3, text: "Adicione mais fotos para melhorar a conversão", priority: 4 },
        { condition: activeModules.length === 0, text: "Ative módulos do roteiro (mapa, checklist...)", priority: 3 },
    ];

    /* ─── Stepper step navigation ─── */
    const stepKeys = SECTIONS.map(s => s.key);
    const handleStepClick = (i: number) => {
        setActiveStep(i);
        setActiveSection(stepKeys[i]);
        if (!openSections.has(stepKeys[i])) setOpenSections(p => new Set(p).add(stepKeys[i]));
        // Scroll form panel to top smoothly
        setTimeout(() => formScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" }), 50);
    };
    const handleNext = () => { if (activeStep < SECTIONS.length - 1) handleStepClick(activeStep + 1); };
    const handlePrev = () => { if (activeStep > 0) handleStepClick(activeStep - 1); };
    const completedSteps = new Set(SECTIONS.filter(s => isSectionComplete(s.key)).map(s => s.key));

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
                <div className="form-row" style={{ display: "none" }}>
                    {/* Standalone inputs have been removed in favor of structured locations */}
                </div>
                {/* Países e cidades adicionais — estruturado */}
                {locations.map((loc, locIdx) => (
                    <div key={`loc-${locIdx}`} style={{ background: "var(--surface-light)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 16px", marginBottom: 12 }}>
                        {/* País */}
                        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 10 }}>
                            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                                <label className="form-label" style={{ marginBottom: 4 }}>
                                    {locIdx === 0 ? "País *" : `País ${locIdx + 1}`}
                                </label>
                                <input
                                    className="form-input"
                                    value={loc.country}
                                    onChange={e => {
                                        const u = locations.map((l, i) => i === locIdx ? { ...l, country: e.target.value } : l);
                                        setLocations(u); markDirty();
                                    }}
                                    placeholder={locIdx === 0 ? "Digite ou selecione o país..." : "Digite o país..."}
                                    autoComplete="off"
                                />
                            </div>
                            {locations.length > 1 && (
                                <button
                                    className="btn-remove"
                                    style={{ marginBottom: 2 }}
                                    onClick={() => { setLocations(locations.filter((_, i) => i !== locIdx)); markDirty(); }}
                                >✕</button>
                            )}
                        </div>
                        {/* Cidades deste país */}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                            {loc.cities.map((city, cityIdx) => (
                                <div key={`city-${locIdx}-${cityIdx}`} style={{ display: "flex", alignItems: "center", gap: 4, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "4px 10px" }}>
                                    <input
                                        style={{ border: "none", background: "transparent", outline: "none", fontSize: 13, fontWeight: 500, color: "var(--text-primary)", width: Math.max(80, city.length * 8) }}
                                        value={city}
                                        onChange={e => {
                                            const u = locations.map((l, i) => i === locIdx
                                                ? { ...l, cities: l.cities.map((c, j) => j === cityIdx ? e.target.value : c) }
                                                : l);
                                            setLocations(u); markDirty();
                                        }}
                                        placeholder={locIdx === 0 && cityIdx === 0 ? "Cidade *" : "Cidade..."}
                                        autoComplete="off"
                                    />
                                    {!(locIdx === 0 && loc.cities.length === 1) && (
                                        <button
                                            onClick={() => {
                                                const u = locations.map((l, i) => i === locIdx
                                                    ? { ...l, cities: l.cities.filter((_, j) => j !== cityIdx) }
                                                    : l);
                                                setLocations(u); markDirty();
                                            }}
                                            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 12, padding: "0 2px", lineHeight: 1 }}
                                        >✕</button>
                                    )}
                                </div>
                            ))}
                            <button
                                className="btn-add-item"
                                style={{ padding: "4px 12px", fontSize: 12 }}
                                onClick={() => {
                                    const u = locations.map((l, i) => i === locIdx ? { ...l, cities: [...l.cities, ""] } : l);
                                    setLocations(u); markDirty();
                                }}
                            >+ Cidade</button>
                        </div>
                    </div>
                ))}
                <div style={{ marginBottom: 16 }}>
                    <button className="btn-add-item" onClick={() => { setLocations([...locations, { country: "", cities: [] }]); markDirty(); }}>+ Adicionar País</button>
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
            </>);

            /* ═══ BLOCO 2: COMERCIAL ═══ */
            case "commerce": return (<>
                <div className="form-row">
                    <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">Preço *</label>
                        <input className="form-input" type="number" value={price || ""} onChange={e => { setPrice(parseFloat(e.target.value) || 0); markDirty(); }} step={0.01} min={0} />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">Moeda</label>
                        <select className="form-input" value={currency} onChange={e => { setCurrency(e.target.value); markDirty(); }}>
                            <option value="AUD">AUD (A$)</option><option value="BRL">BRL (R$)</option><option value="USD">USD ($)</option><option value="EUR">EUR (€)</option>
                        </select>
                    </div>
                </div>
                {[
                    { label: <><Zap size={14} /> Acesso imediato</>, desc: "Liberado logo após o pagamento", val: immediateAccess, set: setImmediateAccess },
                    { label: <><Infinity size={14} /> Acesso vitalício</>, desc: "Sem prazo de expiração", val: lifetimeAccess, set: setLifetimeAccess },
                    { label: <><StarIcon size={14} /> Em destaque</>, desc: "Aparece na seção principal", val: featured, set: setFeatured },
                ].map((t, i) => (
                    <div className="editor-toggle-row" key={i}>
                        <div className="editor-toggle-info"><span className="editor-toggle-label">{t.label}</span><span className="editor-toggle-desc">{t.desc}</span></div>
                        <label className="editor-toggle"><input type="checkbox" checked={t.val} onChange={e => { t.set(e.target.checked); markDirty(); }} /><span className="editor-toggle-track" /><span className="editor-toggle-thumb" /></label>
                    </div>
                ))}
                <div className="editor-legal-notice"><AlertTriangle size={14} /> Aviso automático: &quot;Produto digital. Não inclui serviços turísticos.&quot;</div>
            </>);

            /* ═══ BLOCO 3: MÓDULOS ═══ */
            case "modules": return (<>
                <span className="form-helper">Ative os módulos que serão incluídos no roteiro. Cada módulo ativo aparece como chip na vitrine.</span>
                <div className="editor-module-grid">{MODULE_OPTIONS.map(m => (
                    <div key={m.key} className={`editor-module-card ${activeModules.includes(m.key) ? "active" : ""}`} onClick={() => toggleChip(activeModules, setActiveModules, m.key, 9)}>
                        <div className="editor-module-icon">{m.icon}</div>
                        <div className="editor-module-info"><span className="editor-module-label">{m.label}</span><span className="editor-module-desc">{m.desc}</span></div>
                        <div className="editor-toggle" style={{ pointerEvents: "none" }}><input type="checkbox" checked={activeModules.includes(m.key)} readOnly /><span className="editor-toggle-track" /><span className="editor-toggle-thumb" /></div>
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
                                <span style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: 16 }}>Dia {di + 1} — </span>
                                <input 
                                    className="editor-day-title-input" 
                                    value={day.title.replace(new RegExp(`^Dia ${di + 1}\\s*(?:-|—)?\\s*`, 'i'), '')} 
                                    onChange={e => updateDay(di, "title", e.target.value)} 
                                    placeholder="Coloque o título do dia aqui. Ex: Torre Eiffel e Trocadério" 
                                    style={{ flex: 1 }}
                                />
                            </div>
                            <button className="btn-remove" onClick={() => removeDay(di)}><Trash2 size={14} /></button>
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
                                            <input value={act.location} onChange={e => updateActivity(di, ai, "location", e.target.value)} placeholder="Local" />
                                            <input value={act.latitude} onChange={e => updateActivity(di, ai, "latitude", e.target.value)} placeholder="Lat" style={{ width: 80 }} />
                                            <input value={act.longitude} onChange={e => updateActivity(di, ai, "longitude", e.target.value)} placeholder="Lng" style={{ width: 80 }} />
                                            <select value={act.category} onChange={e => updateActivity(di, ai, "category", e.target.value)} style={{ width: 120 }}>
                                                <option value="">Tipo</option><option value="atração">Atração</option><option value="restaurante">Restaurante</option><option value="hotel">Hotel</option>
                                            </select>
                                            <button className="btn-remove" onClick={() => removeActivity(di, ai)}><X size={14} /></button>
                                        </div>
                                        <div className="editor-activity-row">
                                            <textarea value={act.tips} onChange={e => updateActivity(di, ai, "tips", e.target.value)} placeholder="Dica opcional..." style={{ minHeight: 40 }} />
                                        </div>
                                    </div>
                                ))}
                                <button className="btn-add-item" onClick={() => addActivity(di)}>+ Atividade</button>
                            </div>
                        </div>
                    </div>
                ))}
                <button className="btn-add-item full-width" onClick={addDay}>+ Adicionar Dia</button>
                {days.length < 3 && <div className="editor-validation-alert"><AlertTriangle size={14} /> Mínimo de 3 dias necessários para publicar ({days.length}/3)</div>}

                {/* ── Highlights ── */}
                <div className="editor-subsection" style={{ marginTop: 24 }}>
                    <h4 style={{ margin: "0 0 8px", fontSize: 14, color: "var(--text-secondary)" }}><StarIcon size={14} /> Destaques do roteiro</h4>
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
                    <h4 style={{ margin: "0 0 8px", fontSize: 14, color: "var(--text-secondary)" }}><CircleCheck size={14} /> O que está incluso</h4>
                    <div className="editor-tag-list">
                        {inclusionItems.map((inc, i) => (
                            <span key={i} className="editor-tag editor-tag-green">
                                {inc}
                                <button onClick={() => { setInclusionItems(inclusionItems.filter((_, idx) => idx !== i)); markDirty(); }}>×</button>
                            </span>
                        ))}
                    </div>
                    <div className="editor-tag-input-row">
                        <input className="form-input" value={newInclusion} onChange={e => setNewInclusion(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && newInclusion.trim()) { setInclusionItems([...inclusionItems, newInclusion.trim()]); setNewInclusion(""); markDirty(); } }} placeholder="Ex: Roteiro dia a dia (10 dias), Checklist de viagem..." />
                        <button className="btn-add-item" onClick={() => { if (newInclusion.trim()) { setInclusionItems([...inclusionItems, newInclusion.trim()]); setNewInclusion(""); markDirty(); } }}>+</button>
                    </div>
                </div>

                {/* ── Imagens ── */}
                <div className="editor-subsection" style={{ marginTop: 16 }}>
                    <h4 style={{ margin: "0 0 8px", fontSize: 14, color: "var(--text-secondary)" }}><Image size={14} /> URLs das Imagens</h4>
                    {images.map((url, i) => (
                        <div className="editor-tag-input-row" key={i} style={{ marginBottom: 6 }}>
                            <input className="form-input" value={url} onChange={e => { const u = [...images]; u[i] = e.target.value; setImages(u); markDirty(); }} placeholder="https://..." />
                            <button className="btn-remove" onClick={() => { setImages(images.filter((_, idx) => idx !== i)); markDirty(); }}><X size={14} /></button>
                        </div>
                    ))}
                    <button className="btn-add-item" onClick={() => setImages([...images, ""])}>+ Imagem</button>
                </div>

                {/* ── Hospedagem ── */}
                <div className="editor-subsection" style={{ marginTop: 24 }}>
                    <h4 style={{ margin: "0 0 8px", fontSize: 14, color: "var(--text-secondary)" }}><Hotel size={14} /> Hospedagens Sugeridas</h4>
                    {accommodations.map((acc, i) => (
                        <div className="editor-activity-card" key={i} style={{ marginBottom: 10 }}>
                            <div className="editor-activity-row">
                                <input className="form-input" value={acc.name} onChange={e => { const u = [...accommodations]; u[i].name = e.target.value; setAccommodations(u); markDirty(); }} placeholder="Nome do hotel / hostel" style={{ flex: 2 }} />
                                <input className="form-input" value={acc.rating} onChange={e => { const u = [...accommodations]; u[i].rating = e.target.value; setAccommodations(u); markDirty(); }} placeholder="Nota (ex: 8.5)" style={{ width: 90 }} />
                                <button className="btn-remove" onClick={() => { setAccommodations(accommodations.filter((_, idx) => idx !== i)); markDirty(); }}><X size={14} /></button>
                            </div>
                            <div className="editor-activity-row">
                                <input className="form-input" value={acc.neighborhood} onChange={e => { const u = [...accommodations]; u[i].neighborhood = e.target.value; setAccommodations(u); markDirty(); }} placeholder="Bairro / Localização" />
                                <input className="form-input" value={acc.priceRange} onChange={e => { const u = [...accommodations]; u[i].priceRange = e.target.value; setAccommodations(u); markDirty(); }} placeholder="Faixa de preço (ex: A$ 50-90/noite)" />
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

                {/* ── Transporte ── */}
                <div className="editor-subsection" style={{ marginTop: 24 }}>
                    <h4 style={{ margin: "0 0 8px", fontSize: 14, color: "var(--text-secondary)" }}><Bus size={14} /> Opções de Transporte</h4>
                    {transports.map((t, i) => (
                        <div className="editor-activity-card" key={i} style={{ marginBottom: 10 }}>
                            <div className="editor-activity-row">
                                <input className="form-input" value={t.description} onChange={e => { const u = [...transports]; u[i].description = e.target.value; setTransports(u); markDirty(); }} placeholder="Ex: Passe de metrô semanal Paris" style={{ flex: 2 }} />
                                <button className="btn-remove" onClick={() => { setTransports(transports.filter((_, idx) => idx !== i)); markDirty(); }}><X size={14} /></button>
                            </div>
                            <div className="editor-activity-row">
                                <input className="form-input" value={t.passTypes} onChange={e => { const u = [...transports]; u[i].passTypes = e.target.value; setTransports(u); markDirty(); }} placeholder="Tipo de passe / bilhete" />
                                <input className="form-input" value={t.estimatedPrice} onChange={e => { const u = [...transports]; u[i].estimatedPrice = e.target.value; setTransports(u); markDirty(); }} placeholder="Preço estimado (ex: A$ 55/semana)" />
                            </div>
                            <div className="editor-activity-row">
                                <textarea className="form-input" value={t.notes} onChange={e => { const u = [...transports]; u[i].notes = e.target.value; setTransports(u); markDirty(); }} placeholder="Notas e dicas adicionais" style={{ minHeight: 50 }} rows={2} />
                            </div>
                        </div>
                    ))}
                    <button className="btn-add-item" onClick={addTransport}>+ Opção de Transporte</button>
                </div>
            </>);

            /* ═══ BLOCO 5: GASTO ═══ */
            case "spending": return (<>
                <div className="editor-legal-notice" style={{ display: "flex", gap: 10, padding: "10px 14px", background: "rgba(249, 115, 22, 0.06)", borderRadius: 8, borderLeft: "3px solid #f97316", marginBottom: 8 }}>
                    <AlertTriangle size={15} style={{ color: "#f97316", flexShrink: 0, marginTop: 1 }} />
                    <div style={{ fontSize: 12, color: "var(--text-secondary)" }}><strong style={{ color: "#f97316" }}>Importante:</strong> Todos os valores informados nesta seção devem ser referentes ao custo <strong>por pessoa</strong>.</div>
                </div>
                <div className="form-group">
                    <label className="form-label">Moeda</label>
                    <select className="form-input" value={spendingCurrency} onChange={e => { setSpendingCurrency(e.target.value); markDirty(); }}>
                        <option value="AUD">AUD (A$)</option><option value="BRL">BRL (R$)</option><option value="USD">USD ($)</option><option value="EUR">EUR (€)</option>
                    </select>
                </div>
                {spendingBreakdown.length === 0 && (
                    <button className="btn-add-item" onClick={() => { setSpendingBreakdown(SPENDING_CATS.map(c => ({ category: c, min: "", max: "" }))); markDirty(); }}>
                        <Zap size={14} /> Preencher categorias padrão
                    </button>
                )}
                <div className="editor-breakdown-list">
                    {spendingBreakdown.map((item, i) => (
                        <div className="editor-breakdown-row" key={i}>
                            <input className="form-input" value={item.category} onChange={e => { const u = [...spendingBreakdown]; u[i].category = e.target.value; setSpendingBreakdown(u); markDirty(); }} placeholder="Categoria" />
                            <input className="form-input" type="number" value={item.min} onChange={e => { const u = [...spendingBreakdown]; u[i].min = e.target.value; setSpendingBreakdown(u); markDirty(); }} placeholder="Mínimo" />
                            <input className="form-input" type="number" value={item.max} onChange={e => { const u = [...spendingBreakdown]; u[i].max = e.target.value; setSpendingBreakdown(u); markDirty(); }} placeholder="Máximo" />
                            <button className="btn-remove" onClick={() => { setSpendingBreakdown(spendingBreakdown.filter((_, idx) => idx !== i)); markDirty(); }}><X size={14} /></button>
                        </div>
                    ))}
                </div>
                {spendingBreakdown.length > 0 && (
                    <>
                        <button className="btn-add-item" onClick={() => { setSpendingBreakdown([...spendingBreakdown, { category: "", min: "", max: "" }]); markDirty(); }}>+ Categoria</button>
                        <div className="editor-breakdown-total">
                            <span className="editor-breakdown-total-label">Total estimado por pessoa</span>
                            <span className="editor-breakdown-total-value">
                                A$ {spendingBreakdown.reduce((s, b) => s + (parseFloat(b.min) || 0), 0).toLocaleString("pt-BR")} – {spendingBreakdown.reduce((s, b) => s + (parseFloat(b.max) || 0), 0).toLocaleString("pt-BR")}
                            </span>
                        </div>
                    </>
                )}
            </>);

            /* ═══ BLOCO 6: CHECKLIST + FAQ ═══ */
            case "checklist": return (<>
                <h4 style={{ margin: "0 0 8px" }}><CircleCheck size={14} /> Checklist</h4>
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
                                        <button className="btn-remove" onClick={() => { setChecklistItems(checklistItems.filter((_, idx) => idx !== gi)); markDirty(); }}><X size={14} /></button>
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}

                <h4 style={{ margin: "24px 0 8px" }}><HelpCircle size={14} /> FAQ</h4>
                {faqItems.map((faq, i) => (
                    <div className="editor-faq-item" key={i}>
                        <input className="form-input" value={faq.question} onChange={e => { const u = [...faqItems]; u[i].question = e.target.value; setFaqItems(u); markDirty(); }} placeholder="Pergunta" />
                        <textarea className="form-input" value={faq.answer} onChange={e => { const u = [...faqItems]; u[i].answer = e.target.value; setFaqItems(u); markDirty(); }} placeholder="Resposta" style={{ minHeight: 60 }} />
                        <button className="btn-remove" onClick={() => { setFaqItems(faqItems.filter((_, idx) => idx !== i)); markDirty(); }}><X size={14} /></button>
                    </div>
                ))}
                <button className="btn-add-item" onClick={() => { setFaqItems([...faqItems, { question: "", answer: "" }]); markDirty(); }}>+ Pergunta</button>
            </>);

            /* ═══ BLOCO 7: PÓS-COMPRA ═══ */

            default: return <p>Seção em construção...</p>;
        }
    };

    /* ═══════════════════════════ RENDER ═══════════════════════════ */
    const currentSection = SECTIONS[activeStep];
    const qualityColor = qualityScore >= 80 ? "#28C9BF" : qualityScore >= 40 ? "#F59E0B" : "#EF4444";
    const circumference = 2 * Math.PI * 17; // r=17

    return (
        <div className="editor-page">
            {toast && <div className={`editor-toast ${toast.type}`}>{toast.msg}</div>}

            {/* ══════════════ HEADER ══════════════ */}
            <div className="editor-header">
                <div className="editor-header-left">
                    <button onClick={handleBack} className="editor-back">
                        <ArrowLeft size={15} />
                        Meus Roteiros
                    </button>
                    <div className="editor-header-info">
                        <div className="editor-header-context">
                            <span className="editor-header-context-dot" />
                            Painel do Roteirista
                        </div>
                        <h1 className="editor-title">
                            {isNew ? (fromId ? "Duplicar Roteiro" : "Novo Roteiro") : title || "Editar Roteiro"}
                        </h1>
                    </div>
                </div>
                <div className="editor-header-right">
                    {/* Save status */}
                    {saveStatus === "saving" && (
                        <span className="save-status saving"><span className="save-status-dot" /> Salvando...</span>
                    )}
                    {saveStatus === "saved" && lastSaved && (
                        <span className="save-status saved"><span className="save-status-dot" /> Salvo às {lastSaved}</span>
                    )}
                    {dirty && saveStatus === "idle" && (
                        <span className="save-status unsaved"><span className="save-status-dot" /> Não salvo</span>
                    )}

                    {/* Quality ring */}
                    <div className="editor-quality-badge" title={`Qualidade: ${qualityScore}/100`}>
                        <svg className="editor-quality-svg" viewBox="0 0 44 44" width="44" height="44">
                            <circle cx="22" cy="22" r="17" fill="none" stroke={qualityColor} strokeOpacity="0.15" strokeWidth="3.5" />
                            <circle
                                cx="22" cy="22" r="17" fill="none"
                                stroke={qualityColor} strokeWidth="3.5"
                                strokeDasharray={`${(qualityScore / 100) * circumference} ${circumference}`}
                                strokeLinecap="round"
                                transform="rotate(-90 22 22)"
                                style={{ transition: "stroke-dasharray 0.6s cubic-bezier(0.4,0,0.2,1), stroke 0.3s ease" }}
                            />
                        </svg>
                        <div className="editor-quality-text">
                            <span className="editor-quality-num" style={{ color: qualityColor }}>{qualityScore}</span>
                            <span className="editor-quality-lbl">/ 100</span>
                        </div>
                    </div>

                    <button className="editor-save-btn" onClick={handleSave} disabled={saving}>
                        {saving ? (
                            <>Publicando...</>
                        ) : (
                            <><Rocket size={14} /> Publicar Roteiro</>
                        )}
                    </button>
                </div>
            </div>

            {/* ══════════════ STEPPER ══════════════ */}
            <div className="editor-stepper-wrapper">
                <StepperNav
                    steps={SECTIONS.map(s => ({ key: s.key, icon: s.icon, title: s.title }))}
                    activeIndex={activeStep}
                    completedSteps={completedSteps}
                    onStepClick={handleStepClick}
                />
            </div>

            {/* ══════════════ SPLIT LAYOUT ══════════════ */}
            <div className="editor-split">
                <div className="editor-split-form" ref={formScrollRef}>

                    {/* Active section card */}
                    <div ref={el => { sectionRefs.current[currentSection.key] = el; }} className="editor-section open active">

                        {/* Section header */}
                        <div className="editor-section-header" style={{ cursor: "default" }}>
                            <span className="editor-section-icon">{currentSection.icon}</span>
                            <div className="editor-section-header-info">
                                <span className="editor-section-step-tag">Etapa {activeStep + 1} / {SECTIONS.length}</span>
                                <span className="editor-section-title">{currentSection.title}</span>
                            </div>
                            <SectionInfo tips={SECTION_TIPS[currentSection.key] || []} />
                            <span className={`editor-section-status ${isSectionComplete(currentSection.key) ? "complete" : "pending"}`}>
                                {isSectionComplete(currentSection.key) ? "✓ Completo" : "Pendente"}
                            </span>
                        </div>

                        {/* Contextual tip callout */}
                        {(SECTION_TIPS[currentSection.key as keyof typeof SECTION_TIPS]?.length ?? 0) > 0 && (
                            <div className="editor-tips-callout">
                                <Lightbulb size={13} />
                                <span>{SECTION_TIPS[currentSection.key as keyof typeof SECTION_TIPS][0]}</span>
                            </div>
                        )}

                        <div className="editor-section-body">
                            {renderSection(currentSection.key)}
                        </div>
                    </div>

                    {/* Step navigation */}
                    <StepperActions
                        activeIndex={activeStep}
                        totalSteps={SECTIONS.length}
                        onPrev={handlePrev}
                        onNext={handleNext}
                        onSave={handleSave}
                        saving={saving}
                        isLastStep={activeStep === SECTIONS.length - 1}
                    />
                </div>

                {/* Phone Preview + Quality Coach */}
                <div className="editor-split-preview">
                    <PhonePreview
                        title={title}
                        subtitle={subtitle}
                        destination={locations[0]?.cities[0] || ""}
                        country={locations[0]?.country || ""}
                        duration={duration}
                        price={price}
                        currency={currency}
                        coverImage={images.find(Boolean) || undefined}
                        highlights={highlightItems}
                        days={days.map((d, i) => ({ dayNumber: i + 1, title: d.title, activities: d.activities.map(a => ({ title: a.title, time: a.time })) }))}
                        travelStyles={travelStyles}
                        categories={categories}
                        type="roteiro"
                    />
                    <div style={{ marginTop: 20 }}>
                        <QualityCoach score={qualityScore} tips={qualityTips} />
                    </div>
                </div>
            </div>
        </div>
    );
}

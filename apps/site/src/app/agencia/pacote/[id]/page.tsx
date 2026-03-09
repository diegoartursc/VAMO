"use client";
import { useState, useEffect, useRef, use, useCallback } from "react";
import Link from "next/link";
import { getPackageById, createPackage, updatePackage } from "@/lib/api";
import { getSession } from "@/lib/auth";
import StepperNav, { StepperActions } from "../../../../components/dashboard/StepperNav";
import PhonePreview from "../../../../components/dashboard/PhonePreview";
import QualityCoach from "../../../../components/dashboard/QualityCoach";
import { Target, DollarSign, Compass, Tag, Package, CheckSquare, FileText, MapPin, Trash2, X } from "lucide-react";

/* ═══════════════════════════════════════════════════
   CONSTANTS & TYPES
   ═══════════════════════════════════════════════════ */

type SectionKey = "basicos" | "perfil" | "oferta" | "docs";
interface SectionDef { key: SectionKey; icon: React.ReactNode; title: string; }

const SECTIONS: SectionDef[] = [
    { key: "basicos", icon: <MapPin size={16} />, title: "Básicos" },
    { key: "perfil", icon: <Tag size={16} />, title: "Perfil do Pacote" },
    { key: "oferta", icon: <DollarSign size={16} />, title: "Preço e Oferta" },
    { key: "docs", icon: <FileText size={16} />, title: "Documentação" },
];

const COUNTRIES = [
    "Brasil", "Argentina", "Chile", "Colômbia", "Peru", "Uruguai", "Paraguai",
    "Estados Unidos", "Canadá", "México", "Costa Rica", "República Dominicana",
    "França", "Itália", "Espanha", "Portugal", "Alemanha", "Reino Unido",
    "Holanda", "Suíça", "Áustria", "Grécia", "Turquia", "Croácia",
    "República Tcheca", "Polônia", "Suécia", "Noruega", "Dinamarca",
    "Japão", "China", "Tailândia", "Índia", "Indonésia", "Coreia do Sul",
    "Vietnã", "Singapura", "Filipinas", "Maldivas", "Emirados Árabes",
    "Egito", "África do Sul", "Marrocos", "Quênia", "Tanzânia",
    "Austrália", "Nova Zelândia",
].sort();

const CONTINENT_MAP: Record<string, string> = {
    'Brasil': 'América do Sul', 'Argentina': 'América do Sul', 'Chile': 'América do Sul',
    'Colômbia': 'América do Sul', 'Peru': 'América do Sul', 'Uruguai': 'América do Sul',
    'Estados Unidos': 'América do Norte', 'Canadá': 'América do Norte', 'México': 'América do Norte',
    'Costa Rica': 'América Central', 'República Dominicana': 'América Central',
    'França': 'Europa', 'Itália': 'Europa', 'Espanha': 'Europa', 'Portugal': 'Europa',
    'Alemanha': 'Europa', 'Reino Unido': 'Europa', 'Holanda': 'Europa', 'Suíça': 'Europa',
    'Áustria': 'Europa', 'Grécia': 'Europa', 'Turquia': 'Europa', 'Croácia': 'Europa',
    'República Tcheca': 'Europa', 'Polônia': 'Europa', 'Suécia': 'Europa',
    'Noruega': 'Europa', 'Dinamarca': 'Europa',
    'Japão': 'Ásia', 'China': 'Ásia', 'Tailândia': 'Ásia', 'Índia': 'Ásia',
    'Indonésia': 'Ásia', 'Coreia do Sul': 'Ásia', 'Vietnã': 'Ásia',
    'Singapura': 'Ásia', 'Filipinas': 'Ásia', 'Maldivas': 'Ásia', 'Emirados Árabes': 'Ásia',
    'Egito': 'África', 'África do Sul': 'África', 'Marrocos': 'África',
    'Quênia': 'África', 'Tanzânia': 'África',
    'Austrália': 'Oceania', 'Nova Zelândia': 'Oceania',
};

const TRAVEL_STYLES = [
    { key: "luxo", label: "Luxo" }, { key: "economico", label: "Econômico" },
    { key: "mochilao", label: "Mochilão" }, { key: "familia", label: "Família" },
    { key: "romantico", label: "Romântico" }, { key: "aventura", label: "Aventura" },
    { key: "conforto", label: "Conforto" },
];
const CATEGORY_OPTIONS = [
    { key: "cultura", label: "Cultura" }, { key: "gastronomia", label: "Gastronomia" },
    { key: "natureza", label: "Natureza" }, { key: "esportes", label: "Esportes" },
    { key: "cruzeiros", label: "Cruzeiros" }, { key: "eurotrip", label: "Eurotrip" },
    { key: "relax", label: "Relax" }, { key: "familia", label: "Família" },
    { key: "aventura", label: "Aventura" },
];
const CURRENCIES = ["BRL", "USD", "EUR", "GBP"];

function getDurationLabel(days: number): string {
    if (days <= 3) return "Fim de semana";
    if (days <= 6) return "Curta duração";
    if (days === 7) return "7 dias";
    if (days <= 14) return "8–14 dias";
    if (days === 15) return "15 dias";
    return "+15 dias";
}

function calcQualityScore(form: any): number {
    let s = 0;
    const c = (v: any, p: number) => { if (v && (typeof v !== "string" || v.trim())) s += p; };
    const a = (v: any[], p: number) => { if (v && v.length > 0) s += p; };
    c(form.title, 8); c(form.destination, 8); c(form.country, 8); c(form.description, 8);
    c(form.duration, 5); c(form.priceMin, 10);
    a(form.categories, 8); a(form.travelStyles, 8);
    a(form.highlights, 5); a(form.includedItems, 5);
    c(form.cancellationPolicy, 3); c(form.whatsappOfficial, 2);
    return Math.min(s, 100);
}

const SECTION_TIPS: Record<SectionKey, string[]> = {
    basicos: ["Escolha um país e cidade bem conhecidos para maior visibilidade", "Multi-destino atrai viajantes que querem conhecer várias cidades de uma vez", "Duração e noites são calculadas automaticamente"],
    perfil: ["Selecione até 3 estilos para atingir o público certo", "Luxo e Família têm os maiores tickets médios", "Máximo 5 categorias para não diluir o perfil do pacote"],
    oferta: ["Pacotes com cancelamento gratuito convertem 40% mais", "Parcele em até 12x para facilitar a decisão de compra", "Liste tudo que está incluso — eleva a percepção de valor"],
    docs: ["O WhatsApp oficial é o canal de contato mostrado ao comprador após a compra", "Voucher e e-ticket são enviados automaticamente após o pagamento"],
};

const EMPTY_FORM = {
    agencyId: "",
    title: "", destination: "", country: "", continent: "", airport: "",
    multiDestination: false, additionalCities: [] as string[],
    duration: 7, nights: 6,
    travelStyles: [] as string[], categories: [] as string[],
    description: "", fullDescription: "", emotionalIntro: "",
    priceMin: 0, priceMax: 0, promoPrice: null as number | null,
    currency: "BRL", installments: 12,
    cancellationPolicy: "", hasFreeCancellation: false, isAllInclusive: false, featured: false,
    includedItems: [] as string[], highlights: [] as string[],
    perfectFor: [] as string[], notRecommendedFor: [] as string[],
    importantInfo: [] as string[],
    whatsappOfficial: "", autoMessage: "", voucherUrl: "", eticketUrl: "",
    status: "ACTIVE",
};

/* Tag input state keys for new fields */
const NEW_TAG_FIELDS = ["perfectFor", "notRecommendedFor", "importantInfo"] as const;

/* ═══════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════ */

export default function PackageEditorPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const isNew = id === "new";

    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [dirty, setDirty] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
    const [form, setForm] = useState({ ...EMPTY_FORM });
    const [cityInput, setCityInput] = useState("");
    const [newInclude, setNewInclude] = useState("");
    const [newHighlight, setNewHighlight] = useState("");
    const [newPerfectFor, setNewPerfectFor] = useState("");
    const [newNotRecommended, setNewNotRecommended] = useState("");
    const [newImportantInfo, setNewImportantInfo] = useState("");

    const markDirty = useCallback(() => setDirty(true), []);
    const upd = (field: string, val: any) => { setForm(f => ({ ...f, [field]: val })); markDirty(); };

    const showToast = (msg: string, type: "success" | "error") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    // ─── Load session agencyId ───
    useEffect(() => {
        (async () => {
            try {
                const session = await getSession();
                if (session?.agency?.id) setForm(f => ({ ...f, agencyId: session.agency.id }));
            } catch { /* silent */ }
        })();
    }, []);

    // ─── Load data ───
    useEffect(() => {
        if (isNew) return;
        (async () => {
            try {
                const data = await getPackageById(id);
                setForm(prev => ({
                    ...prev, ...data,
                    priceMin: data.price?.min ?? data.priceMin ?? 0,
                    priceMax: data.price?.max ?? data.priceMax ?? 0,
                    travelStyles: data.travelStyles || [],
                    categories: data.categories || [],
                    additionalCities: data.additionalCities || [],
                    includedItems: data.includedItems || data.includes || [],
                    highlights: data.highlights || [],
                    perfectFor: data.perfectFor || [],
                    notRecommendedFor: data.notRecommendedFor || [],
                    importantInfo: data.importantInfo || [],
                }));
            } catch { showToast("Erro ao carregar pacote", "error"); }
            finally { setLoading(false); }
        })();
    }, [id, isNew]);

    // ─── Auto country → continent ───
    useEffect(() => {
        if (form.country) {
            const cont = CONTINENT_MAP[form.country] || "";
            if (cont !== form.continent) setForm(f => ({ ...f, continent: cont }));
        }
    }, [form.country]);

    // ─── Auto duration → nights ───
    useEffect(() => {
        const n = form.duration > 0 ? form.duration - 1 : 0;
        if (n !== form.nights) setForm(f => ({ ...f, nights: n }));
    }, [form.duration]);

    // ─── Save ───
    const handleSave = async () => {
        if (!form.title.trim() || !form.destination || !form.country) {
            showToast("Preencha título, cidade e país", "error"); return;
        }
        if (form.priceMin <= 0) { showToast("Defina um preço válido", "error"); return; }
        setSaving(true);
        try {
            const payload = { ...form, qualityScore: calcQualityScore(form) };
            if (isNew) {
                await createPackage(payload);
                showToast("Pacote criado com sucesso!", "success");
                window.location.href = "/agencia/pacotes";
            } else {
                await updatePackage(id, payload);
                showToast("Alterações salvas!", "success");
                setDirty(false);
            }
        } catch (err: any) { showToast(err?.message || "Erro ao salvar", "error"); }
        finally { setSaving(false); }
    };

    // ─── Chip toggle ───
    const toggleChip = (field: string, val: string, max: number) => {
        setForm(f => {
            const cur = [...(f as any)[field]];
            if (cur.includes(val)) return { ...f, [field]: cur.filter((v: string) => v !== val) };
            if (cur.length >= max) return f;
            return { ...f, [field]: [...cur, val] };
        });
        markDirty();
    };

    // ─── Tag helpers ───
    const addTag = (field: string, val: string, setter: (v: string) => void) => {
        if (!val.trim()) return;
        // Support comma-separated batch entry
        const items = val.split(",").map(v => v.trim()).filter(Boolean);
        setForm(f => ({ ...f, [field]: [...(f as any)[field], ...items] }));
        setter(""); markDirty();
    };
    const removeTag = (field: string, idx: number) => {
        setForm(f => ({ ...f, [field]: (f as any)[field].filter((_: any, i: number) => i !== idx) }));
        markDirty();
    };

    // ─── Section completion ───
    const isSectionComplete = useCallback((key: SectionKey): boolean => {
        switch (key) {
            case "basicos": return !!(form.country && form.destination && form.duration >= 1);
            case "perfil": return form.travelStyles.length >= 1 && form.categories.length >= 1;
            case "oferta": return form.priceMin > 0 && !!form.description.trim() && form.includedItems.length > 0;
            case "docs": return !!form.whatsappOfficial;
            default: return false;
        }
    }, [form]);

    const completedSteps = new Set(SECTIONS.filter(s => isSectionComplete(s.key)).map(s => s.key));
    const qualityScore = calcQualityScore(form);

    // ─── Stepper navigation ───
    const formScrollRef = useRef<HTMLDivElement>(null);
    const handleStepClick = (i: number) => {
        setActiveStep(i);
        setTimeout(() => formScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" }), 50);
    };
    const handleNext = () => { if (activeStep < SECTIONS.length - 1) setActiveStep(s => s + 1); };
    const handlePrev = () => { if (activeStep > 0) setActiveStep(s => s - 1); };

    const qualityTips = [
        { condition: !form.title, text: "Adicione um título atraente para o pacote", priority: 1 },
        { condition: !form.destination, text: "Informe a cidade de destino principal", priority: 1 },
        { condition: !form.country, text: "Selecione o país de destino", priority: 1 },
        { condition: form.priceMin <= 0, text: "Defina o preço base por pessoa", priority: 2 },
        { condition: !form.description.trim(), text: "Escreva uma descrição curta cativante", priority: 2 },
        { condition: form.travelStyles.length === 0, text: "Escolha pelo menos 1 estilo de viagem", priority: 3 },
        { condition: form.categories.length === 0, text: "Selecione ao menos 1 categoria temática", priority: 3 },
        { condition: form.includedItems.length === 0, text: "Liste o que está incluso no pacote", priority: 4 },
        { condition: !form.whatsappOfficial, text: "Informe o WhatsApp de contato oficial", priority: 5 },
    ];

    // ─── Section content ───
    const renderSection = (key: SectionKey) => {
        switch (key) {
            case "basicos": return (<>
                <div className="form-group">
                    <label className="form-label">Título do Pacote *</label>
                    <input className="form-input" value={form.title} onChange={e => upd("title", e.target.value)} placeholder='Ex: "Paris Romântica – 7 Dias Inesquecíveis"' />
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">País *</label>
                        <select className="form-input" value={form.country} onChange={e => upd("country", e.target.value)}>
                            <option value="">Selecione o país</option>
                            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Continente</label>
                        <input className="form-input" value={form.continent} readOnly style={{ opacity: 0.6 }} />
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Cidade Principal *</label>
                        <input className="form-input" value={form.destination} onChange={e => upd("destination", e.target.value)} placeholder="Ex: Paris, Roma..." />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Aeroporto</label>
                        <input className="form-input" value={form.airport} onChange={e => upd("airport", e.target.value)} placeholder="Ex: CDG, GRU" />
                    </div>
                </div>
                <div className="form-row" style={{ marginTop: 8 }}>
                    <div className="form-group">
                        <label className="form-label">Número de dias *</label>
                        <input className="form-input" type="number" min={1} value={form.duration} onChange={e => upd("duration", parseInt(e.target.value) || 1)} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Noites</label>
                        <input className="form-input" type="number" value={form.nights} readOnly style={{ opacity: 0.6 }} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Classificação</label>
                        <div className="editor-duration-badge" style={{ marginTop: 8 }}>{form.duration >= 1 ? getDurationLabel(form.duration) : "—"}</div>
                    </div>
                </div>
                <div className="form-group" style={{ marginTop: 16 }}>
                    <label className="editor-toggle-row" style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                        <label className="editor-toggle">
                            <input type="checkbox" checked={form.multiDestination} onChange={e => upd("multiDestination", e.target.checked)} />
                            <span className="editor-toggle-track" /><span className="editor-toggle-thumb" />
                        </label>
                        <span className="form-label" style={{ margin: 0 }}>Roteiro Multi-destino</span>
                    </label>
                </div>
                {form.multiDestination && (
                    <div className="form-group">
                        <label className="form-label">Cidades Adicionais</label>
                        <div className="editor-tag-list">
                            {form.additionalCities.map((c, i) => (
                                <span key={i} className="editor-tag">{c}<button onClick={() => removeTag("additionalCities", i)}>×</button></span>
                            ))}
                        </div>
                        <div className="editor-tag-input-row">
                            <input className="form-input" value={cityInput} onChange={e => setCityInput(e.target.value)}
                                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag("additionalCities", cityInput, setCityInput); } }}
                                placeholder="Adicionar cidade (pressione Enter)" />
                            <button className="btn-add-item" onClick={() => addTag("additionalCities", cityInput, setCityInput)}>+</button>
                        </div>
                    </div>
                )}
            </>);

            case "perfil": return (<>
                <div className="form-group">
                    <label className="form-label">Estilo de Viagem</label>
                    <span className="form-helper">Selecione até 3 estilos ({form.travelStyles.length}/3)</span>
                    <div className="editor-chip-grid" style={{ marginBottom: 24 }}>
                        {TRAVEL_STYLES.map(ts => (
                            <button key={ts.key}
                                className={`editor-chip ${form.travelStyles.includes(ts.key) ? "active" : ""}`}
                                onClick={() => toggleChip("travelStyles", ts.key, 3)}
                                disabled={!form.travelStyles.includes(ts.key) && form.travelStyles.length >= 3}>
                                {ts.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="form-group">
                    <label className="form-label">Categorias Temáticas</label>
                    <span className="form-helper">Mínimo 1, máximo 5 ({form.categories.length}/5)</span>
                    <div className="editor-chip-grid">
                        {CATEGORY_OPTIONS.map(cat => (
                            <button key={cat.key}
                                className={`editor-chip ${form.categories.includes(cat.key) ? "active" : ""}`}
                                onClick={() => toggleChip("categories", cat.key, 5)}
                                disabled={!form.categories.includes(cat.key) && form.categories.length >= 5}>
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>
            </>);

            case "oferta": return (<>
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Preço base por pessoa *</label>
                        <input className="form-input" type="number" min={0} value={form.priceMin || ""} onChange={e => upd("priceMin", parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Promoção (opcional)</label>
                        <input className="form-input" type="number" min={0} value={form.promoPrice ?? ""} onChange={e => upd("promoPrice", e.target.value ? parseFloat(e.target.value) : null)} placeholder="Deixe vazio se não houver" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Moeda</label>
                        <select className="form-input" value={form.currency} onChange={e => upd("currency", e.target.value)}>
                            {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Preço máximo estimado</label>
                        <input className="form-input" type="number" min={0} value={form.priceMax || ""} onChange={e => upd("priceMax", parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Parcelas (máx)</label>
                        <input className="form-input" type="number" min={1} max={24} value={form.installments} onChange={e => upd("installments", parseInt(e.target.value) || 1)} />
                        {form.installments > 0 && form.priceMin > 0 && <span className="form-helper">Até {form.installments}x de {form.currency === "BRL" ? "R$" : form.currency} {(form.priceMin / form.installments).toFixed(2)}</span>}
                    </div>
                </div>

                <div style={{ padding: "16px 0", borderTop: "1px solid rgba(226, 232, 240, 0.6)", borderBottom: "1px solid rgba(226, 232, 240, 0.6)", margin: "20px 0" }}>
                    {[
                        { label: "Cancelamento gratuito", field: "hasFreeCancellation", val: form.hasFreeCancellation },
                        { label: "All Inclusive", field: "isAllInclusive", val: form.isAllInclusive },
                        { label: "Em destaque", field: "featured", val: form.featured },
                    ].map((t, i) => (
                        <div className="editor-toggle-row" key={i} style={{ padding: "8px 0", borderBottom: i < 2 ? "1px solid rgba(226, 232, 240, 0.3)" : "none" }}>
                            <div className="editor-toggle-info"><span className="editor-toggle-label">{t.label}</span></div>
                            <label className="editor-toggle">
                                <input type="checkbox" checked={t.val} onChange={e => upd(t.field, e.target.checked)} />
                                <span className="editor-toggle-track" /><span className="editor-toggle-thumb" />
                            </label>
                        </div>
                    ))}
                </div>

                <div className="form-group">
                    <label className="form-label">Descrição curta *</label>
                    <textarea className="form-input" value={form.description} onChange={e => upd("description", e.target.value)} placeholder="Uma frase que resume o pacote..." style={{ minHeight: 80 }} />
                </div>

                <div className="form-group">
                    <label className="form-label">O que está incluso</label>
                    <div className="editor-tag-list">
                        {form.includedItems.map((item, i) => (
                            <span key={i} className="editor-tag editor-tag-green">{item}<button onClick={() => removeTag("includedItems", i)}>×</button></span>
                        ))}
                    </div>
                    <div className="editor-tag-input-row">
                        <input className="form-input" value={newInclude} onChange={e => setNewInclude(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag("includedItems", newInclude, setNewInclude); } }}
                            placeholder="Ex: Voo, Hotel (separe por vírgula para adicionar vários)" />
                        <button className="btn-add-item" onClick={() => addTag("includedItems", newInclude, setNewInclude)}>+</button>
                    </div>
                </div>

                <div className="form-group" style={{ marginTop: 16 }}>
                    <label className="form-label">Destaques do pacote</label>
                    <div className="editor-tag-list">
                        {form.highlights.map((h, i) => (
                            <span key={i} className="editor-tag">{h}<button onClick={() => removeTag("highlights", i)}>×</button></span>
                        ))}
                    </div>
                    <div className="editor-tag-input-row">
                        <input className="form-input" value={newHighlight} onChange={e => setNewHighlight(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag("highlights", newHighlight, setNewHighlight); } }}
                            placeholder="Ex: City tour VIP (separe por vírgula para adicionar vários)" />
                        <button className="btn-add-item" onClick={() => addTag("highlights", newHighlight, setNewHighlight)}>+</button>
                    </div>
                </div>

                <div className="form-group" style={{ marginTop: 16 }}>
                    <label className="form-label">Descrição completa (Opcional)</label>
                    <textarea className="form-input" value={form.fullDescription} onChange={e => upd("fullDescription", e.target.value)} placeholder="Detalhes completos do itinerário e experiências..." style={{ minHeight: 120 }} />
                </div>

                <div className="form-group">
                    <label className="form-label">Introdução Emocional (Opcional)</label>
                    <textarea className="form-input" value={form.emotionalIntro} onChange={e => upd("emotionalIntro", e.target.value)} placeholder="Ex: Imagine caminhar pelas ruas de Paris ao pôr do sol..." style={{ minHeight: 80 }} />
                    <span className="form-helper">Texto inspirador exibido antes da descrição no app</span>
                </div>

                {/* Para quem é perfeito */}
                <div className="form-group" style={{ marginTop: 16 }}>
                    <label className="form-label">Para quem essa viagem é perfeita</label>
                    <div className="editor-tag-list">
                        {form.perfectFor.map((item, i) => (
                            <span key={i} className="editor-tag editor-tag-green">{item}<button onClick={() => removeTag("perfectFor", i)}>×</button></span>
                        ))}
                    </div>
                    <div className="editor-tag-input-row">
                        <input className="form-input" value={newPerfectFor} onChange={e => setNewPerfectFor(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag("perfectFor", newPerfectFor, setNewPerfectFor); } }}
                            placeholder="Ex: Casais, Primeira viagem à Europa (Enter para adicionar)" />
                        <button className="btn-add-item" onClick={() => addTag("perfectFor", newPerfectFor, setNewPerfectFor)}>+</button>
                    </div>
                </div>

                {/* Não indicado para */}
                <div className="form-group" style={{ marginTop: 16 }}>
                    <label className="form-label">Não indicado para</label>
                    <div className="editor-tag-list">
                        {form.notRecommendedFor.map((item, i) => (
                            <span key={i} className="editor-tag" style={{ backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' }}>{item}<button onClick={() => removeTag("notRecommendedFor", i)}>×</button></span>
                        ))}
                    </div>
                    <div className="editor-tag-input-row">
                        <input className="form-input" value={newNotRecommended} onChange={e => setNewNotRecommended(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag("notRecommendedFor", newNotRecommended, setNewNotRecommended); } }}
                            placeholder="Ex: Pessoas com dificuldade de locomoção" />
                        <button className="btn-add-item" onClick={() => addTag("notRecommendedFor", newNotRecommended, setNewNotRecommended)}>+</button>
                    </div>
                </div>

                {/* Informações importantes */}
                <div className="form-group" style={{ marginTop: 16 }}>
                    <label className="form-label">Informações Importantes / Avisos</label>
                    <div className="editor-tag-list">
                        {form.importantInfo.map((item, i) => (
                            <span key={i} className="editor-tag" style={{ backgroundColor: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.3)' }}>{item}<button onClick={() => removeTag("importantInfo", i)}>×</button></span>
                        ))}
                    </div>
                    <div className="editor-tag-input-row">
                        <input className="form-input" value={newImportantInfo} onChange={e => setNewImportantInfo(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag("importantInfo", newImportantInfo, setNewImportantInfo); } }}
                            placeholder="Ex: Visto obrigatório, Vacina febre amarela" />
                        <button className="btn-add-item" onClick={() => addTag("importantInfo", newImportantInfo, setNewImportantInfo)}>+</button>
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Política de cancelamento</label>
                    <textarea className="form-input" value={form.cancellationPolicy} onChange={e => upd("cancellationPolicy", e.target.value)} placeholder="Ex: Cancelamento gratuito até 7 dias antes da viagem..." style={{ minHeight: 60 }} />
                </div>
            </>);

            case "docs": return (<>
                <div className="form-group">
                    <label className="form-label">WhatsApp Oficial *</label>
                    <input className="form-input" value={form.whatsappOfficial} onChange={e => upd("whatsappOfficial", e.target.value)} placeholder="Ex: +55 11 99999-9999" />
                    <span className="form-helper">Exibido ao comprador após a confirmação para tirar dúvidas</span>
                </div>
                <div className="form-group">
                    <label className="form-label">Mensagem automática</label>
                    <textarea className="form-input" value={form.autoMessage} onChange={e => upd("autoMessage", e.target.value)} placeholder="Olá! Obrigado pela compra do seu pacote..." style={{ minHeight: 80 }} />
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">URL do Voucher (Opcional)</label>
                        <input className="form-input" value={form.voucherUrl} onChange={e => upd("voucherUrl", e.target.value)} placeholder="https://..." />
                    </div>
                    <div className="form-group">
                        <label className="form-label">URL do E-ticket (Opcional)</label>
                        <input className="form-input" value={form.eticketUrl} onChange={e => upd("eticketUrl", e.target.value)} placeholder="https://..." />
                    </div>
                </div>
            </>);

            default: return <p>Seção não encontrada.</p>;
        }
    };

    if (loading) return (
        <div className="editor-skeleton">
            <div className="editor-skeleton-bar short" /><div className="editor-skeleton-bar medium" />
            <div className="editor-skeleton-section" /><div className="editor-skeleton-section" />
        </div>
    );

    const currentSection = SECTIONS[activeStep];

    return (
        <div className="editor-page">
            {toast && <div className={`editor-toast ${toast.type}`}>{toast.msg}</div>}

            {/* Header */}
            <div className="editor-header">
                <div className="editor-header-left">
                    <Link href="/agencia/pacotes" className="editor-back">← Voltar</Link>
                    <div className="editor-header-info">
                        <h1 className="editor-title">{isNew ? "Novo Pacote" : (form.title || "Editar Pacote")}</h1>
                        <span className="editor-subtitle">Painel da Agência</span>
                    </div>
                </div>
                <div className="editor-header-right">
                    {dirty && <span className="save-status unsaved"><span className="save-status-dot" /> Não salvo</span>}
                    <button className="editor-save-btn" onClick={handleSave} disabled={saving}>
                        {saving ? "Salvando..." : "Publicar Pacote"}
                    </button>
                </div>
            </div>

            {/* Stepper */}
            <div style={{ padding: "0 32px" }}>
                <StepperNav
                    steps={SECTIONS.map(s => ({ key: s.key, icon: s.icon, title: s.title }))}
                    activeIndex={activeStep}
                    completedSteps={completedSteps}
                    onStepClick={handleStepClick}
                />
            </div>

            {/* Editor split layout */}
            <div className="editor-split">
                {/* Form */}
                <div className="editor-split-form" ref={formScrollRef}>
                    {/* Section header */}
                    <div className="editor-section-card">
                        <div className="editor-section-card-header">
                            <div className="editor-section-card-icon">{currentSection.icon}</div>
                            <h2 className="editor-section-card-title">{currentSection.title}</h2>
                            <span className={`editor-section-badge ${isSectionComplete(currentSection.key) ? "complete" : "incomplete"}`}>
                                {isSectionComplete(currentSection.key) ? "Completo ✓" : "Pendente"}
                            </span>
                        </div>
                        <div className="editor-section-card-body">
                            {renderSection(currentSection.key)}
                        </div>
                    </div>

                    {/* Quality coach tips for current section */}
                    {SECTION_TIPS[currentSection.key]?.length > 0 && (
                        <div className="editor-tips-box">
                            {SECTION_TIPS[currentSection.key].map((tip, i) => (
                                <div key={i} className="editor-tip-item">
                                    <span className="editor-tip-dot" />
                                    {tip}
                                </div>
                            ))}
                        </div>
                    )}

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

                {/* Preview */}
                <div className="editor-split-preview">
                    <QualityCoach score={qualityScore} tips={qualityTips} />
                    <PhonePreview
                        title={form.title}
                        subtitle={form.description}
                        destination={form.destination}
                        country={form.country}
                        duration={form.duration}
                        price={form.priceMin}
                        currency={form.currency}
                        highlights={form.highlights}
                        travelStyles={form.travelStyles}
                        categories={form.categories}
                        type="pacote"
                    />
                </div>
            </div>
        </div>
    );
}

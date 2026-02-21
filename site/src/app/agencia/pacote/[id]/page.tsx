"use client";
import { useState, useEffect, useRef, use, useCallback } from "react";
import Link from "next/link";
import { getPackageById, createPackage, updatePackage } from "@/lib/api";
import { getSession } from "@/lib/auth";

/* ═══════════════════════════════════════════════════
   CONSTANTS & TYPES
   ═══════════════════════════════════════════════════ */

type SectionKey = "destination" | "duration" | "style" | "categories" | "price" | "inclusions" | "docs";

interface SectionDef { key: SectionKey; icon: string; title: string; }

const SECTIONS: SectionDef[] = [
    { key: "destination", icon: "1", title: "Destino" },
    { key: "duration", icon: "2", title: "Duração" },
    { key: "style", icon: "3", title: "Estilo de Viagem" },
    { key: "categories", icon: "4", title: "Categorias" },
    { key: "price", icon: "5", title: "Preço" },
    { key: "inclusions", icon: "6", title: "Inclusões e Experiência" },
    { key: "docs", icon: "7", title: "Documentação" },
];

const COUNTRIES = [
    "Brasil", "Argentina", "Chile", "Colômbia", "Peru", "Uruguai", "Paraguai", "Bolívia",
    "Equador", "Venezuela", "Estados Unidos", "Canadá", "México", "Cuba", "Jamaica",
    "Costa Rica", "Panamá", "República Dominicana", "França", "Itália", "Espanha",
    "Portugal", "Alemanha", "Reino Unido", "Holanda", "Bélgica", "Suíça", "Áustria",
    "Grécia", "Turquia", "Croácia", "República Tcheca", "Polônia", "Hungria", "Irlanda",
    "Suécia", "Noruega", "Dinamarca", "Finlândia", "Islândia", "Romênia", "Sérvia",
    "Montenegro", "Japão", "China", "Tailândia", "Índia", "Indonésia", "Coreia do Sul",
    "Vietnã", "Malásia", "Singapura", "Filipinas", "Sri Lanka", "Nepal", "Camboja",
    "Maldivas", "Emirados Árabes", "Israel", "Jordânia", "Egito", "África do Sul",
    "Marrocos", "Quênia", "Tanzânia", "Namíbia", "Austrália", "Nova Zelândia", "Fiji",
    "Guatemala", "Honduras", "Etiópia", "Moçambique", "Nigéria",
].sort();

const CONTINENT_MAP: Record<string, string> = {
    'Brasil': 'América do Sul', 'Argentina': 'América do Sul', 'Chile': 'América do Sul', 'Colômbia': 'América do Sul',
    'Peru': 'América do Sul', 'Uruguai': 'América do Sul', 'Paraguai': 'América do Sul', 'Bolívia': 'América do Sul',
    'Equador': 'América do Sul', 'Venezuela': 'América do Sul',
    'Estados Unidos': 'América do Norte', 'Canadá': 'América do Norte', 'México': 'América do Norte',
    'Cuba': 'América Central', 'Jamaica': 'América Central', 'Costa Rica': 'América Central', 'Panamá': 'América Central',
    'República Dominicana': 'América Central', 'Guatemala': 'América Central', 'Honduras': 'América Central',
    'França': 'Europa', 'Itália': 'Europa', 'Espanha': 'Europa', 'Portugal': 'Europa', 'Alemanha': 'Europa',
    'Reino Unido': 'Europa', 'Holanda': 'Europa', 'Bélgica': 'Europa', 'Suíça': 'Europa', 'Áustria': 'Europa',
    'Grécia': 'Europa', 'Turquia': 'Europa', 'Croácia': 'Europa', 'República Tcheca': 'Europa', 'Polônia': 'Europa',
    'Hungria': 'Europa', 'Irlanda': 'Europa', 'Suécia': 'Europa', 'Noruega': 'Europa', 'Dinamarca': 'Europa',
    'Finlândia': 'Europa', 'Islândia': 'Europa', 'Romênia': 'Europa', 'Sérvia': 'Europa', 'Montenegro': 'Europa',
    'Japão': 'Ásia', 'China': 'Ásia', 'Tailândia': 'Ásia', 'Índia': 'Ásia', 'Indonésia': 'Ásia',
    'Coreia do Sul': 'Ásia', 'Vietnã': 'Ásia', 'Malásia': 'Ásia', 'Singapura': 'Ásia', 'Filipinas': 'Ásia',
    'Sri Lanka': 'Ásia', 'Nepal': 'Ásia', 'Camboja': 'Ásia', 'Maldivas': 'Ásia', 'Emirados Árabes': 'Ásia',
    'Israel': 'Ásia', 'Jordânia': 'Ásia',
    'Egito': 'África', 'África do Sul': 'África', 'Marrocos': 'África', 'Quênia': 'África', 'Tanzânia': 'África',
    'Namíbia': 'África', 'Etiópia': 'África', 'Moçambique': 'África', 'Nigéria': 'África',
    'Austrália': 'Oceania', 'Nova Zelândia': 'Oceania', 'Fiji': 'Oceania',
};

const TRAVEL_STYLES = [
    { key: "luxo", label: "Luxo" },
    { key: "economico", label: "Econômico" },
    { key: "mochilao", label: "Mochilão" },
    { key: "familia", label: "Família" },
    { key: "romantico", label: "Romântico" },
    { key: "aventura", label: "Aventura" },
];

const CATEGORY_OPTIONS = [
    { key: "cultura", label: "Cultura" },
    { key: "gastronomia", label: "Gastronomia" },
    { key: "natureza", label: "Natureza" },
    { key: "esportes", label: "Esportes" },
    { key: "cruzeiros", label: "Cruzeiros" },
    { key: "eurotrip", label: "Eurotrip" },
    { key: "relax", label: "Relax" },
    { key: "familia", label: "Família" },
    { key: "aventura", label: "Aventura" },
];

const CURRENCIES = ["BRL (R$)", "USD ($)", "EUR (€)", "GBP (£)"];

function getDurationLabel(days: number): string {
    if (days <= 3) return "Fim de semana";
    if (days <= 6) return "Curta duração";
    if (days === 7) return "7 dias";
    if (days <= 14) return "8–14 dias";
    if (days === 15) return "15 dias";
    if (days <= 20) return "16–20 dias";
    return "+20 dias";
}

/* ═══════════════════════════════════════════════════
   QUALITY SCORE CALCULATOR
   ═══════════════════════════════════════════════════ */

function calcQualityScore(form: any): number {
    let s = 0;
    const c = (v: any, p: number) => { if (v && (typeof v !== "string" || v.trim())) s += p; };
    const a = (v: any[], p: number) => { if (v && v.length > 0) s += p; };
    c(form.title, 8); c(form.destination, 8); c(form.country, 8); c(form.description, 8);
    c(form.duration, 5); c(form.priceMin, 10);
    a(form.categories, 8); a(form.travelStyles, 8);
    a(form.highlights, 5); a(form.includes, 5); a(form.includedItems, 5);
    a(form.perfectFor, 3); a(form.notRecommendedFor, 3);
    c(form.fullDescription, 4); c(form.cancellationPolicy, 3);
    c(form.airport, 2); c(form.whatsappOfficial, 2); c(form.emotionalIntro, 3);
    return Math.min(s, 100);
}

/* ═══════════════════════════════════════════════════
   INITIAL STATE
   ═══════════════════════════════════════════════════ */

const EMPTY_FORM = {
    agencyId: "",
    title: "",
    destination: "",
    country: "",
    continent: "",
    airport: "",
    multiDestination: false,
    additionalCities: [] as string[],
    duration: 7,
    nights: 6,
    travelStyles: [] as string[],
    categories: [] as string[],
    description: "",
    fullDescription: "",
    emotionalIntro: "",
    priceMin: 0,
    priceMax: 0,
    promoPrice: null as number | null,
    currency: "BRL (R$)",
    installments: 12,
    cancellationPolicy: "",
    hasFreeCancellation: false,
    isAllInclusive: false,
    featured: false,
    includes: [] as string[],
    includedItems: [] as string[],
    highlights: [] as string[],
    perfectFor: [] as string[],
    notRecommendedFor: [] as string[],
    importantInfo: [] as string[],
    routeDetails: null as any,
    whatsappOfficial: "",
    autoMessage: "",
    voucherUrl: "",
    eticketUrl: "",
    status: "ACTIVE",
};

/* ═══════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════ */

export default function PackageEditorPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const isNew = id === "new";

    const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const [openSections, setOpenSections] = useState<Set<SectionKey>>(new Set(["destination"]));
    const [activeSection, setActiveSection] = useState<SectionKey>("destination");
    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
    const [form, setForm] = useState({ ...EMPTY_FORM });
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [cityInput, setCityInput] = useState("");
    const [newInclude, setNewInclude] = useState("");
    const [newHighlight, setNewHighlight] = useState("");
    const [newPerfectFor, setNewPerfectFor] = useState("");
    const [newNotFor, setNewNotFor] = useState("");
    const [newImportant, setNewImportant] = useState("");

    // ─── Auto-save timer ───
    const autoSaveRef = useRef<NodeJS.Timeout | null>(null);

    const showToast = (msg: string, type: "success" | "error") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    // ─── Load session agencyId ───
    useEffect(() => {
        (async () => {
            try {
                const session = await getSession();
                if (session?.agency?.id) {
                    setForm(f => ({ ...f, agencyId: session.agency.id }));
                }
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
                    ...prev,
                    ...data,
                    priceMin: data.price?.min ?? data.priceMin ?? 0,
                    priceMax: data.price?.max ?? data.priceMax ?? 0,
                    travelStyles: data.travelStyles || [],
                    categories: data.categories || [],
                    additionalCities: data.additionalCities || [],
                    includes: data.includes || [],
                    includedItems: data.includedItems || [],
                    highlights: data.highlights || [],
                    perfectFor: data.perfectFor || [],
                    notRecommendedFor: data.notRecommendedFor || [],
                    importantInfo: data.importantInfo || [],
                }));
            } catch (err) {
                showToast("Erro ao carregar pacote", "error");
            } finally {
                setLoading(false);
            }
        })();
    }, [id, isNew]);

    // ─── Auto country → continent ───
    useEffect(() => {
        if (form.country) {
            const cont = CONTINENT_MAP[form.country] || "";
            if (cont !== form.continent) setForm(f => ({ ...f, continent: cont }));
        }
    }, [form.country, form.continent]);

    // ─── Auto duration → nights ───
    useEffect(() => {
        const n = form.duration > 0 ? form.duration - 1 : 0;
        if (n !== form.nights) setForm(f => ({ ...f, nights: n }));
    }, [form.duration, form.nights]);

    // ─── Auto-save draft every 30s ───
    useEffect(() => {
        if (isNew) return;
        autoSaveRef.current = setInterval(async () => {
            try {
                await updatePackage(id, form);
            } catch { /* silent */ }
        }, 30000);
        return () => { if (autoSaveRef.current) clearInterval(autoSaveRef.current); };
    }, [id, isNew, form]);

    // ─── Validation ───
    const validate = useCallback((): string[] => {
        const errs: string[] = [];
        if (!form.title.trim()) errs.push("Título é obrigatório");
        if (!form.destination.trim()) errs.push("Cidade de destino é obrigatória");
        if (!form.country) errs.push("País é obrigatório");
        if (form.duration < 1) errs.push("Duração deve ser ≥ 1 dia");
        if (form.travelStyles.length === 0) errs.push("Selecione ao menos 1 estilo de viagem");
        if (form.travelStyles.length > 3) errs.push("Máximo 3 estilos de viagem");
        if (form.categories.length < 1) errs.push("Selecione ao menos 1 categoria");
        if (form.categories.length > 5) errs.push("Máximo 5 categorias");
        if (!form.priceMin && form.priceMin !== 0) errs.push("Preço base é obrigatório");
        if (!form.description.trim()) errs.push("Descrição curta é obrigatória");
        return errs;
    }, [form]);

    // ─── Save ───
    const handleSave = async () => {
        const errs = validate();
        setValidationErrors(errs);
        if (errs.length > 0) {
            showToast(`${errs.length} campo(s) obrigatório(s) pendente(s)`, "error");
            return;
        }
        setSaving(true);
        try {
            const payload = { ...form, qualityScore: calcQualityScore(form) };
            if (isNew) {
                await createPackage(payload);
                showToast("Pacote criado com sucesso!", "success");
            } else {
                await updatePackage(id, payload);
                showToast("Alterações salvas!", "success");
            }
        } catch (err: any) {
            showToast(err?.message || "Erro ao salvar", "error");
        } finally {
            setSaving(false);
        }
    };

    // ─── Section helpers ───
    const toggleSection = (key: SectionKey) => {
        setOpenSections(prev => {
            const s = new Set(prev);
            s.has(key) ? s.delete(key) : s.add(key);
            return s;
        });
    };

    const scrollToSection = (key: SectionKey) => {
        setActiveSection(key);
        if (!openSections.has(key)) setOpenSections(prev => new Set(prev).add(key));
        sectionRefs.current[key]?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    // ─── Section completion ───
    const isSectionComplete = (key: SectionKey): boolean => {
        switch (key) {
            case "destination": return !!(form.country && form.destination);
            case "duration": return form.duration >= 1;
            case "style": return form.travelStyles.length >= 1 && form.travelStyles.length <= 3;
            case "categories": return form.categories.length >= 1 && form.categories.length <= 5;
            case "price": return !!(form.priceMin || form.priceMin === 0) && !!form.description;
            case "inclusions": return form.includedItems.length > 0 || form.includes.length > 0;
            case "docs": return !!(form.whatsappOfficial);
            default: return false;
        }
    };

    // ─── Multi-select chip handler ───
    const toggleChip = (arr: string[], val: string, max: number, field: string) => {
        setForm(f => {
            const current = [...(f as any)[field]];
            if (current.includes(val)) {
                return { ...f, [field]: current.filter((v: string) => v !== val) };
            }
            if (current.length >= max) return f;
            return { ...f, [field]: [...current, val] };
        });
    };

    // ─── Tag add/remove helpers ───
    const addTag = (field: string, val: string, setter: (v: string) => void) => {
        if (!val.trim()) return;
        setForm(f => ({ ...f, [field]: [...(f as any)[field], val.trim()] }));
        setter("");
    };

    const removeTag = (field: string, idx: number) => {
        setForm(f => ({ ...f, [field]: (f as any)[field].filter((_: any, i: number) => i !== idx) }));
    };

    // ─── Quality score ───
    const qualityScore = calcQualityScore(form);
    const qualityColor = qualityScore >= 80 ? "var(--success)" : qualityScore >= 50 ? "var(--warning)" : "var(--error)";

    // ─── Loading skeleton ───
    if (loading) {
        return (
            <div className="editor-container">
                <div className="editor-skeleton">
                    <div className="skeleton-bar" style={{ width: "60%", height: 32 }} />
                    <div className="skeleton-bar" style={{ width: "100%", height: 200, marginTop: 16 }} />
                    <div className="skeleton-bar" style={{ width: "100%", height: 200, marginTop: 16 }} />
                </div>
            </div>
        );
    }

    return (
        <div className="editor-container">
            {/* ─── Toast ─── */}
            {toast && (
                <div className={`editor-toast ${toast.type}`}>
                    <span>{toast.type === "success" ? "" : ""}</span>
                    {toast.msg}
                </div>
            )}

            {/* ─── Validation Errors ─── */}
            {validationErrors.length > 0 && (
                <div className="pkg-validation-alert">
                    <strong>Campos obrigatórios pendentes:</strong>
                    <ul>{validationErrors.map((e, i) => <li key={i}>{e}</li>)}</ul>
                </div>
            )}

            {/* ─── Header ─── */}
            <div className="editor-header">
                <div className="editor-header-left">
                    <Link href="/agencia/pacotes" className="editor-back">← Voltar</Link>
                    <h1 className="editor-title">{form.title || "Novo Pacote"}</h1>
                </div>
                <div className="editor-header-right">
                    {/* Quality Score */}
                    <div className="pkg-quality-badge" style={{ borderColor: qualityColor }}>
                        <div className="pkg-quality-fill" style={{ width: `${qualityScore}%`, background: qualityColor }} />
                        <span className="pkg-quality-label">{qualityScore}%</span>
                    </div>
                    <button className="editor-save-btn" onClick={handleSave} disabled={saving}>
                        {saving ? "Salvando..." : "Publicar Pacote"}
                    </button>
                </div>
            </div>

            {/* ─── Layout ─── */}
            <div className="editor-layout">
                {/* ─── Sidebar ─── */}
                <nav className="editor-sidebar editor-nav">
                    {SECTIONS.map(s => (
                        <button
                            key={s.key}
                            className={`editor-nav-item ${activeSection === s.key ? "active" : ""}`}
                            onClick={() => scrollToSection(s.key)}
                        >
                            <span className="editor-nav-icon">{s.icon}</span>
                            <span className="editor-nav-label">{s.title}</span>
                            <span className={`editor-nav-dot ${isSectionComplete(s.key) ? "complete" : ""}`} />
                        </button>
                    ))}
                </nav>

                {/* ─── Main ─── */}
                <div className="editor-main">

                    {/* ═══ BLOCO 1 — DESTINO ═══ */}
                    <div ref={el => { sectionRefs.current.destination = el; }} className={`editor-section ${openSections.has("destination") ? "open" : ""}`}>
                        <button className="editor-section-header" onClick={() => toggleSection("destination")}>
                            <span className="editor-section-icon">1</span>
                            <h2>Destino</h2>
                            <span className={`editor-section-badge ${isSectionComplete("destination") ? "complete" : "incomplete"}`}>
                                {isSectionComplete("destination") ? "Completo" : "Pendente"}
                            </span>
                            <span className="editor-section-arrow">{openSections.has("destination") ? "▲" : "▼"}</span>
                        </button>
                        {openSections.has("destination") && (
                            <div className="editor-section-body">
                                <div className="editor-row">
                                    <div className="editor-field" style={{ flex: 2 }}>
                                        <label>País *</label>
                                        <select
                                            value={form.country}
                                            onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                                            className="editor-select"
                                        >
                                            <option value="">Selecione o país</option>
                                            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="editor-field" style={{ flex: 1 }}>
                                        <label>Continente</label>
                                        <input type="text" value={form.continent} readOnly className="editor-input readonly" />
                                    </div>
                                </div>
                                <div className="editor-row">
                                    <div className="editor-field" style={{ flex: 2 }}>
                                        <label>Cidade Principal *</label>
                                        <input
                                            type="text"
                                            value={form.destination}
                                            onChange={e => setForm(f => ({ ...f, destination: e.target.value }))}
                                            placeholder="Ex: Paris, Roma, São Paulo..."
                                            className="editor-input"
                                        />
                                    </div>
                                    <div className="editor-field" style={{ flex: 1 }}>
                                        <label>Aeroporto Principal</label>
                                        <input
                                            type="text"
                                            value={form.airport}
                                            onChange={e => setForm(f => ({ ...f, airport: e.target.value }))}
                                            placeholder="Ex: CDG, GRU"
                                            className="editor-input"
                                        />
                                    </div>
                                </div>

                                <div className="editor-row">
                                    <div className="editor-field">
                                        <label className="pkg-toggle-row">
                                            <input
                                                type="checkbox"
                                                checked={form.multiDestination}
                                                onChange={e => setForm(f => ({ ...f, multiDestination: e.target.checked }))}
                                            />
                                            <span>Multi-destino</span>
                                        </label>
                                    </div>
                                </div>

                                {form.multiDestination && (
                                    <div className="editor-field">
                                        <label>Cidades Adicionais</label>
                                        <div className="editor-tag-list">
                                            {form.additionalCities.map((c, i) => (
                                                <span key={i} className="editor-tag">
                                                    {c}
                                                    <button onClick={() => removeTag("additionalCities", i)}>×</button>
                                                </span>
                                            ))}
                                        </div>
                                        <div className="editor-tag-input-row">
                                            <input
                                                type="text"
                                                value={cityInput}
                                                onChange={e => setCityInput(e.target.value)}
                                                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag("additionalCities", cityInput, setCityInput))}
                                                placeholder="Adicionar cidade"
                                                className="editor-input"
                                            />
                                            <button className="editor-tag-add" onClick={() => addTag("additionalCities", cityInput, setCityInput)}>+</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ═══ BLOCO 2 — DURAÇÃO ═══ */}
                    <div ref={el => { sectionRefs.current.duration = el; }} className={`editor-section ${openSections.has("duration") ? "open" : ""}`}>
                        <button className="editor-section-header" onClick={() => toggleSection("duration")}>
                            <span className="editor-section-icon">2</span>
                            <h2>Duração</h2>
                            <span className={`editor-section-badge ${isSectionComplete("duration") ? "complete" : "incomplete"}`}>
                                {isSectionComplete("duration") ? "Completo" : "Pendente"}
                            </span>
                            <span className="editor-section-arrow">{openSections.has("duration") ? "▲" : "▼"}</span>
                        </button>
                        {openSections.has("duration") && (
                            <div className="editor-section-body">
                                <div className="editor-row">
                                    <div className="editor-field">
                                        <label>Número de dias *</label>
                                        <input
                                            type="number"
                                            min={1}
                                            value={form.duration}
                                            onChange={e => setForm(f => ({ ...f, duration: parseInt(e.target.value) || 0 }))}
                                            className="editor-input"
                                        />
                                    </div>
                                    <div className="editor-field">
                                        <label>Número de noites</label>
                                        <input type="number" value={form.nights} readOnly className="editor-input readonly" />
                                    </div>
                                    <div className="editor-field">
                                        <label>Classificação</label>
                                        <div className="pkg-duration-badge">
                                            {form.duration >= 1 ? getDurationLabel(form.duration) : "—"}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ═══ BLOCO 3 — ESTILO DE VIAGEM ═══ */}
                    <div ref={el => { sectionRefs.current.style = el; }} className={`editor-section ${openSections.has("style") ? "open" : ""}`}>
                        <button className="editor-section-header" onClick={() => toggleSection("style")}>
                            <span className="editor-section-icon">3</span>
                            <h2>Estilo de Viagem</h2>
                            <span className={`editor-section-badge ${isSectionComplete("style") ? "complete" : "incomplete"}`}>
                                {isSectionComplete("style") ? "Completo" : "Pendente"}
                            </span>
                            <span className="editor-section-arrow">{openSections.has("style") ? "▲" : "▼"}</span>
                        </button>
                        {openSections.has("style") && (
                            <div className="editor-section-body">
                                <p className="editor-field-hint">Selecione até <strong>3</strong> estilos ({form.travelStyles.length}/3)</p>
                                <div className="pkg-chip-grid">
                                    {TRAVEL_STYLES.map(ts => {
                                        const selected = form.travelStyles.includes(ts.key);
                                        const disabled = !selected && form.travelStyles.length >= 3;
                                        return (
                                            <button
                                                key={ts.key}
                                                className={`pkg-chip ${selected ? "selected" : ""} ${disabled ? "disabled" : ""}`}
                                                onClick={() => toggleChip(form.travelStyles, ts.key, 3, "travelStyles")}
                                                disabled={disabled}
                                            >
                                                {ts.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ═══ BLOCO 4 — CATEGORIAS ═══ */}
                    <div ref={el => { sectionRefs.current.categories = el; }} className={`editor-section ${openSections.has("categories") ? "open" : ""}`}>
                        <button className="editor-section-header" onClick={() => toggleSection("categories")}>
                            <span className="editor-section-icon">4</span>
                            <h2>Categorias Temáticas</h2>
                            <span className={`editor-section-badge ${isSectionComplete("categories") ? "complete" : "incomplete"}`}>
                                {isSectionComplete("categories") ? "Completo" : "Pendente"}
                            </span>
                            <span className="editor-section-arrow">{openSections.has("categories") ? "▲" : "▼"}</span>
                        </button>
                        {openSections.has("categories") && (
                            <div className="editor-section-body">
                                <p className="editor-field-hint">Mínimo 1, máximo 5 ({form.categories.length}/5)</p>
                                <div className="pkg-chip-grid">
                                    {CATEGORY_OPTIONS.map(cat => {
                                        const selected = form.categories.includes(cat.key);
                                        const disabled = !selected && form.categories.length >= 5;
                                        return (
                                            <button
                                                key={cat.key}
                                                className={`pkg-chip ${selected ? "selected" : ""} ${disabled ? "disabled" : ""}`}
                                                onClick={() => toggleChip(form.categories, cat.key, 5, "categories")}
                                                disabled={disabled}
                                            >
                                                {cat.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ═══ BLOCO 5 — PREÇO ═══ */}
                    <div ref={el => { sectionRefs.current.price = el; }} className={`editor-section ${openSections.has("price") ? "open" : ""}`}>
                        <button className="editor-section-header" onClick={() => toggleSection("price")}>
                            <span className="editor-section-icon">5</span>
                            <h2>Preço</h2>
                            <span className={`editor-section-badge ${isSectionComplete("price") ? "complete" : "incomplete"}`}>
                                {isSectionComplete("price") ? "Completo" : "Pendente"}
                            </span>
                            <span className="editor-section-arrow">{openSections.has("price") ? "▲" : "▼"}</span>
                        </button>
                        {openSections.has("price") && (
                            <div className="editor-section-body">
                                <div className="editor-row">
                                    <div className="editor-field">
                                        <label>Preço base por pessoa *</label>
                                        <input
                                            type="number"
                                            min={0}
                                            value={form.priceMin}
                                            onChange={e => setForm(f => ({ ...f, priceMin: parseFloat(e.target.value) || 0 }))}
                                            className="editor-input"
                                        />
                                    </div>
                                    <div className="editor-field">
                                        <label>Preço máximo estimado</label>
                                        <input
                                            type="number"
                                            min={0}
                                            value={form.priceMax}
                                            onChange={e => setForm(f => ({ ...f, priceMax: parseFloat(e.target.value) || 0 }))}
                                            className="editor-input"
                                        />
                                    </div>
                                    <div className="editor-field">
                                        <label>Moeda</label>
                                        <select
                                            value={form.currency}
                                            onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                                            className="editor-select"
                                        >
                                            {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="editor-row">
                                    <div className="editor-field">
                                        <label>Preço promocional (opcional)</label>
                                        <input
                                            type="number"
                                            min={0}
                                            value={form.promoPrice ?? ""}
                                            onChange={e => setForm(f => ({ ...f, promoPrice: e.target.value ? parseFloat(e.target.value) : null }))}
                                            placeholder="Deixe vazio se não houver"
                                            className="editor-input"
                                        />
                                    </div>
                                    <div className="editor-field">
                                        <label>Parcelas (máx)</label>
                                        <input
                                            type="number"
                                            min={1}
                                            max={24}
                                            value={form.installments}
                                            onChange={e => setForm(f => ({ ...f, installments: parseInt(e.target.value) || 1 }))}
                                            className="editor-input"
                                        />
                                    </div>
                                </div>

                                <div className="editor-field">
                                    <label>Descrição curta *</label>
                                    <textarea
                                        value={form.description}
                                        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                        placeholder="Uma frase que resume o pacote..."
                                        className="editor-textarea"
                                        rows={2}
                                    />
                                </div>

                                <div className="editor-field">
                                    <label>Política de cancelamento</label>
                                    <textarea
                                        value={form.cancellationPolicy}
                                        onChange={e => setForm(f => ({ ...f, cancellationPolicy: e.target.value }))}
                                        placeholder="Ex: Cancelamento gratuito até 7 dias antes..."
                                        className="editor-textarea"
                                        rows={2}
                                    />
                                </div>

                                <div className="editor-row">
                                    <label className="pkg-toggle-row">
                                        <input
                                            type="checkbox"
                                            checked={form.hasFreeCancellation}
                                            onChange={e => setForm(f => ({ ...f, hasFreeCancellation: e.target.checked }))}
                                        />
                                        <span>Cancelamento gratuito</span>
                                    </label>
                                    <label className="pkg-toggle-row">
                                        <input
                                            type="checkbox"
                                            checked={form.isAllInclusive}
                                            onChange={e => setForm(f => ({ ...f, isAllInclusive: e.target.checked }))}
                                        />
                                        <span>All Inclusive</span>
                                    </label>
                                    <label className="pkg-toggle-row">
                                        <input
                                            type="checkbox"
                                            checked={form.featured}
                                            onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))}
                                        />
                                        <span>Destaque</span>
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ═══ BLOCO 6 — INCLUSÕES E EXPERIÊNCIA ═══ */}
                    <div ref={el => { sectionRefs.current.inclusions = el; }} className={`editor-section ${openSections.has("inclusions") ? "open" : ""}`}>
                        <button className="editor-section-header" onClick={() => toggleSection("inclusions")}>
                            <span className="editor-section-icon">6</span>
                            <h2>Inclusões e Experiência</h2>
                            <span className={`editor-section-badge ${isSectionComplete("inclusions") ? "complete" : "incomplete"}`}>
                                {isSectionComplete("inclusions") ? "Completo" : "Pendente"}
                            </span>
                            <span className="editor-section-arrow">{openSections.has("inclusions") ? "▲" : "▼"}</span>
                        </button>
                        {openSections.has("inclusions") && (
                            <div className="editor-section-body">
                                {/* Includes */}
                                <div className="editor-field">
                                    <label>O que está incluso</label>
                                    <div className="editor-tag-list">
                                        {form.includedItems.map((item, i) => (
                                            <span key={i} className="editor-tag">
                                                {item}
                                                <button onClick={() => removeTag("includedItems", i)}>×</button>
                                            </span>
                                        ))}
                                    </div>
                                    <div className="editor-tag-input-row">
                                        <input
                                            type="text"
                                            value={newInclude}
                                            onChange={e => setNewInclude(e.target.value)}
                                            onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag("includedItems", newInclude, setNewInclude))}
                                            placeholder="Ex: Passagem aérea, Hotel 4 estrelas..."
                                            className="editor-input"
                                        />
                                        <button className="editor-tag-add" onClick={() => addTag("includedItems", newInclude, setNewInclude)}>+</button>
                                    </div>
                                </div>

                                {/* Highlights */}
                                <div className="editor-field">
                                    <label>Destaques do pacote</label>
                                    <div className="editor-tag-list">
                                        {form.highlights.map((h, i) => (
                                            <span key={i} className="editor-tag">
                                                {h}
                                                <button onClick={() => removeTag("highlights", i)}>×</button>
                                            </span>
                                        ))}
                                    </div>
                                    <div className="editor-tag-input-row">
                                        <input
                                            type="text"
                                            value={newHighlight}
                                            onChange={e => setNewHighlight(e.target.value)}
                                            onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag("highlights", newHighlight, setNewHighlight))}
                                            placeholder="Ex: Tour pela Torre Eiffel..."
                                            className="editor-input"
                                        />
                                        <button className="editor-tag-add" onClick={() => addTag("highlights", newHighlight, setNewHighlight)}>+</button>
                                    </div>
                                </div>

                                {/* Descrição completa */}
                                <div className="editor-field">
                                    <label>Descrição completa</label>
                                    <textarea
                                        value={form.fullDescription}
                                        onChange={e => setForm(f => ({ ...f, fullDescription: e.target.value }))}
                                        placeholder="Descrição detalhada do pacote..."
                                        className="editor-textarea"
                                        rows={4}
                                    />
                                </div>

                                {/* Intro emocional */}
                                <div className="editor-field">
                                    <label>Introdução emocional</label>
                                    <textarea
                                        value={form.emotionalIntro}
                                        onChange={e => setForm(f => ({ ...f, emotionalIntro: e.target.value }))}
                                        placeholder="Uma frase inspiradora sobre o destino..."
                                        className="editor-textarea"
                                        rows={2}
                                    />
                                </div>

                                {/* Perfect for */}
                                <div className="editor-field">
                                    <label>Público ideal</label>
                                    <div className="editor-tag-list">
                                        {form.perfectFor.map((p, i) => (
                                            <span key={i} className="editor-tag editor-tag-green">
                                                {p}
                                                <button onClick={() => removeTag("perfectFor", i)}>×</button>
                                            </span>
                                        ))}
                                    </div>
                                    <div className="editor-tag-input-row">
                                        <input
                                            type="text"
                                            value={newPerfectFor}
                                            onChange={e => setNewPerfectFor(e.target.value)}
                                            onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag("perfectFor", newPerfectFor, setNewPerfectFor))}
                                            placeholder="Ex: Casais, Famílias com crianças..."
                                            className="editor-input"
                                        />
                                        <button className="editor-tag-add" onClick={() => addTag("perfectFor", newPerfectFor, setNewPerfectFor)}>+</button>
                                    </div>
                                </div>

                                {/* Not recommended for */}
                                <div className="editor-field">
                                    <label>Não recomendado para</label>
                                    <div className="editor-tag-list">
                                        {form.notRecommendedFor.map((n, i) => (
                                            <span key={i} className="editor-tag editor-tag-red">
                                                {n}
                                                <button onClick={() => removeTag("notRecommendedFor", i)}>×</button>
                                            </span>
                                        ))}
                                    </div>
                                    <div className="editor-tag-input-row">
                                        <input
                                            type="text"
                                            value={newNotFor}
                                            onChange={e => setNewNotFor(e.target.value)}
                                            onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag("notRecommendedFor", newNotFor, setNewNotFor))}
                                            placeholder="Ex: Pessoas com mobilidade reduzida..."
                                            className="editor-input"
                                        />
                                        <button className="editor-tag-add" onClick={() => addTag("notRecommendedFor", newNotFor, setNewNotFor)}>+</button>
                                    </div>
                                </div>

                                {/* Important info */}
                                <div className="editor-field">
                                    <label>Informações importantes</label>
                                    <div className="editor-tag-list">
                                        {form.importantInfo.map((info, i) => (
                                            <span key={i} className="editor-tag">
                                                {info}
                                                <button onClick={() => removeTag("importantInfo", i)}>×</button>
                                            </span>
                                        ))}
                                    </div>
                                    <div className="editor-tag-input-row">
                                        <input
                                            type="text"
                                            value={newImportant}
                                            onChange={e => setNewImportant(e.target.value)}
                                            onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag("importantInfo", newImportant, setNewImportant))}
                                            placeholder="Ex: Necessário passaporte válido..."
                                            className="editor-input"
                                        />
                                        <button className="editor-tag-add" onClick={() => addTag("importantInfo", newImportant, setNewImportant)}>+</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ═══ BLOCO 7 — DOCUMENTAÇÃO ═══ */}
                    <div ref={el => { sectionRefs.current.docs = el; }} className={`editor-section ${openSections.has("docs") ? "open" : ""}`}>
                        <button className="editor-section-header" onClick={() => toggleSection("docs")}>
                            <span className="editor-section-icon">7</span>
                            <h2>Documentação e Pós-compra</h2>
                            <span className={`editor-section-badge ${isSectionComplete("docs") ? "complete" : "incomplete"}`}>
                                {isSectionComplete("docs") ? "Completo" : "Pendente"}
                            </span>
                            <span className="editor-section-arrow">{openSections.has("docs") ? "▲" : "▼"}</span>
                        </button>
                        {openSections.has("docs") && (
                            <div className="editor-section-body">
                                <div className="editor-row">
                                    <div className="editor-field">
                                        <label>URL do Voucher</label>
                                        <input
                                            type="url"
                                            value={form.voucherUrl}
                                            onChange={e => setForm(f => ({ ...f, voucherUrl: e.target.value }))}
                                            placeholder="https://..."
                                            className="editor-input"
                                        />
                                    </div>
                                    <div className="editor-field">
                                        <label>URL do E-ticket</label>
                                        <input
                                            type="url"
                                            value={form.eticketUrl}
                                            onChange={e => setForm(f => ({ ...f, eticketUrl: e.target.value }))}
                                            placeholder="https://..."
                                            className="editor-input"
                                        />
                                    </div>
                                </div>
                                <div className="editor-row">
                                    <div className="editor-field">
                                        <label>WhatsApp oficial da agência</label>
                                        <input
                                            type="tel"
                                            value={form.whatsappOfficial}
                                            onChange={e => setForm(f => ({ ...f, whatsappOfficial: e.target.value }))}
                                            placeholder="+55 11 99999-9999"
                                            className="editor-input"
                                        />
                                    </div>
                                </div>
                                <div className="editor-field">
                                    <label>Mensagem automática pós-compra</label>
                                    <textarea
                                        value={form.autoMessage}
                                        onChange={e => setForm(f => ({ ...f, autoMessage: e.target.value }))}
                                        placeholder="Mensagem que o comprador recebe automaticamente após a compra..."
                                        className="editor-textarea"
                                        rows={3}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}

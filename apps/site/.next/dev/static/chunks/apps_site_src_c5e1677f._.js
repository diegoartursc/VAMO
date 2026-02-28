(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/apps/site/src/lib/api.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createItinerary",
    ()=>createItinerary,
    "createPackage",
    ()=>createPackage,
    "deleteItinerary",
    ()=>deleteItinerary,
    "deletePackage",
    ()=>deletePackage,
    "getAgencyPackages",
    ()=>getAgencyPackages,
    "getDashboardStats",
    ()=>getDashboardStats,
    "getItineraries",
    ()=>getItineraries,
    "getItineraryById",
    ()=>getItineraryById,
    "getPackageById",
    ()=>getPackageById,
    "getPackageDashboardStats",
    ()=>getPackageDashboardStats,
    "getPackages",
    ()=>getPackages,
    "updateItinerary",
    ()=>updateItinerary,
    "updatePackage",
    ()=>updatePackage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
/**
 * Dashboard API utility — connects to VAMO backend
 * Automatically attaches JWT token from auth lib
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$site$2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/site/src/lib/auth.ts [app-client] (ecmascript)");
;
const API_BASE_URL = ("TURBOPACK compile-time value", "http://localhost:3333/api") || 'http://localhost:3333/api';
async function fetchApi(endpoint, options) {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
            'Content-Type': 'application/json',
            ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$site$2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAuthHeaders"])(),
            ...options?.headers
        },
        ...options
    });
    if (!res.ok) {
        const error = await res.json().catch(()=>({
                error: res.statusText
            }));
        throw new Error(error.error || `API Error: ${res.status}`);
    }
    return res.json();
}
async function getDashboardStats(creatorId) {
    const query = creatorId ? `?creatorId=${creatorId}` : '';
    return fetchApi(`/itineraries/dashboard/stats${query}`);
}
async function getItineraries() {
    const stats = await getDashboardStats();
    return stats.itineraries;
}
async function getItineraryById(id) {
    return fetchApi(`/itineraries/${id}`);
}
async function createItinerary(data) {
    return fetchApi('/itineraries', {
        method: 'POST',
        body: JSON.stringify(data)
    });
}
async function updateItinerary(id, data) {
    return fetchApi(`/itineraries/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
}
async function deleteItinerary(id) {
    return fetchApi(`/itineraries/${id}`, {
        method: 'DELETE'
    });
}
async function getPackages(agencyId) {
    const query = agencyId ? `?agencyId=${agencyId}` : '';
    return fetchApi(`/packages${query}`);
}
async function getAgencyPackages(agencyId) {
    return fetchApi(`/packages?agencyId=${agencyId}`);
}
async function getPackageById(id) {
    return fetchApi(`/packages/${id}`);
}
async function createPackage(data) {
    return fetchApi('/packages', {
        method: 'POST',
        body: JSON.stringify(data)
    });
}
async function updatePackage(id, data) {
    return fetchApi(`/packages/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
}
async function deletePackage(id) {
    return fetchApi(`/packages/${id}`, {
        method: 'DELETE'
    });
}
async function getPackageDashboardStats(agencyId) {
    return fetchApi(`/packages/dashboard/stats?agencyId=${agencyId}`);
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>PackageEditorPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$site$2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/site/src/lib/api.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$site$2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/site/src/lib/auth.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
const SECTIONS = [
    {
        key: "destination",
        icon: "1",
        title: "Destino"
    },
    {
        key: "duration",
        icon: "2",
        title: "Duração"
    },
    {
        key: "style",
        icon: "3",
        title: "Estilo de Viagem"
    },
    {
        key: "categories",
        icon: "4",
        title: "Categorias"
    },
    {
        key: "price",
        icon: "5",
        title: "Preço"
    },
    {
        key: "inclusions",
        icon: "6",
        title: "Inclusões e Experiência"
    },
    {
        key: "itinerary",
        icon: "7",
        title: "Roteiro Dia a Dia"
    },
    {
        key: "docs",
        icon: "8",
        title: "Documentação"
    }
];
const COUNTRIES = [
    "Brasil",
    "Argentina",
    "Chile",
    "Colômbia",
    "Peru",
    "Uruguai",
    "Paraguai",
    "Bolívia",
    "Equador",
    "Venezuela",
    "Estados Unidos",
    "Canadá",
    "México",
    "Cuba",
    "Jamaica",
    "Costa Rica",
    "Panamá",
    "República Dominicana",
    "França",
    "Itália",
    "Espanha",
    "Portugal",
    "Alemanha",
    "Reino Unido",
    "Holanda",
    "Bélgica",
    "Suíça",
    "Áustria",
    "Grécia",
    "Turquia",
    "Croácia",
    "República Tcheca",
    "Polônia",
    "Hungria",
    "Irlanda",
    "Suécia",
    "Noruega",
    "Dinamarca",
    "Finlândia",
    "Islândia",
    "Romênia",
    "Sérvia",
    "Montenegro",
    "Japão",
    "China",
    "Tailândia",
    "Índia",
    "Indonésia",
    "Coreia do Sul",
    "Vietnã",
    "Malásia",
    "Singapura",
    "Filipinas",
    "Sri Lanka",
    "Nepal",
    "Camboja",
    "Maldivas",
    "Emirados Árabes",
    "Israel",
    "Jordânia",
    "Egito",
    "África do Sul",
    "Marrocos",
    "Quênia",
    "Tanzânia",
    "Namíbia",
    "Austrália",
    "Nova Zelândia",
    "Fiji",
    "Guatemala",
    "Honduras",
    "Etiópia",
    "Moçambique",
    "Nigéria"
].sort();
const CONTINENT_MAP = {
    'Brasil': 'América do Sul',
    'Argentina': 'América do Sul',
    'Chile': 'América do Sul',
    'Colômbia': 'América do Sul',
    'Peru': 'América do Sul',
    'Uruguai': 'América do Sul',
    'Paraguai': 'América do Sul',
    'Bolívia': 'América do Sul',
    'Equador': 'América do Sul',
    'Venezuela': 'América do Sul',
    'Estados Unidos': 'América do Norte',
    'Canadá': 'América do Norte',
    'México': 'América do Norte',
    'Cuba': 'América Central',
    'Jamaica': 'América Central',
    'Costa Rica': 'América Central',
    'Panamá': 'América Central',
    'República Dominicana': 'América Central',
    'Guatemala': 'América Central',
    'Honduras': 'América Central',
    'França': 'Europa',
    'Itália': 'Europa',
    'Espanha': 'Europa',
    'Portugal': 'Europa',
    'Alemanha': 'Europa',
    'Reino Unido': 'Europa',
    'Holanda': 'Europa',
    'Bélgica': 'Europa',
    'Suíça': 'Europa',
    'Áustria': 'Europa',
    'Grécia': 'Europa',
    'Turquia': 'Europa',
    'Croácia': 'Europa',
    'República Tcheca': 'Europa',
    'Polônia': 'Europa',
    'Hungria': 'Europa',
    'Irlanda': 'Europa',
    'Suécia': 'Europa',
    'Noruega': 'Europa',
    'Dinamarca': 'Europa',
    'Finlândia': 'Europa',
    'Islândia': 'Europa',
    'Romênia': 'Europa',
    'Sérvia': 'Europa',
    'Montenegro': 'Europa',
    'Japão': 'Ásia',
    'China': 'Ásia',
    'Tailândia': 'Ásia',
    'Índia': 'Ásia',
    'Indonésia': 'Ásia',
    'Coreia do Sul': 'Ásia',
    'Vietnã': 'Ásia',
    'Malásia': 'Ásia',
    'Singapura': 'Ásia',
    'Filipinas': 'Ásia',
    'Sri Lanka': 'Ásia',
    'Nepal': 'Ásia',
    'Camboja': 'Ásia',
    'Maldivas': 'Ásia',
    'Emirados Árabes': 'Ásia',
    'Israel': 'Ásia',
    'Jordânia': 'Ásia',
    'Egito': 'África',
    'África do Sul': 'África',
    'Marrocos': 'África',
    'Quênia': 'África',
    'Tanzânia': 'África',
    'Namíbia': 'África',
    'Etiópia': 'África',
    'Moçambique': 'África',
    'Nigéria': 'África',
    'Austrália': 'Oceania',
    'Nova Zelândia': 'Oceania',
    'Fiji': 'Oceania'
};
const TRAVEL_STYLES = [
    {
        key: "luxo",
        label: "Luxo"
    },
    {
        key: "economico",
        label: "Econômico"
    },
    {
        key: "mochilao",
        label: "Mochilão"
    },
    {
        key: "familia",
        label: "Família"
    },
    {
        key: "romantico",
        label: "Romântico"
    },
    {
        key: "aventura",
        label: "Aventura"
    }
];
const CATEGORY_OPTIONS = [
    {
        key: "cultura",
        label: "Cultura"
    },
    {
        key: "gastronomia",
        label: "Gastronomia"
    },
    {
        key: "natureza",
        label: "Natureza"
    },
    {
        key: "esportes",
        label: "Esportes"
    },
    {
        key: "cruzeiros",
        label: "Cruzeiros"
    },
    {
        key: "eurotrip",
        label: "Eurotrip"
    },
    {
        key: "relax",
        label: "Relax"
    },
    {
        key: "familia",
        label: "Família"
    },
    {
        key: "aventura",
        label: "Aventura"
    }
];
const CURRENCIES = [
    "BRL (R$)",
    "USD ($)",
    "EUR (€)",
    "GBP (£)"
];
function getDurationLabel(days) {
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
   ═══════════════════════════════════════════════════ */ function calcQualityScore(form) {
    let s = 0;
    const c = (v, p)=>{
        if (v && (typeof v !== "string" || v.trim())) s += p;
    };
    const a = (v, p)=>{
        if (v && v.length > 0) s += p;
    };
    c(form.title, 8);
    c(form.destination, 8);
    c(form.country, 8);
    c(form.description, 8);
    c(form.duration, 5);
    c(form.priceMin, 10);
    a(form.categories, 8);
    a(form.travelStyles, 8);
    a(form.highlights, 5);
    a(form.includes, 5);
    a(form.includedItems, 5);
    a(form.perfectFor, 3);
    a(form.notRecommendedFor, 3);
    c(form.fullDescription, 4);
    c(form.cancellationPolicy, 3);
    c(form.airport, 2);
    c(form.whatsappOfficial, 2);
    c(form.emotionalIntro, 3);
    return Math.min(s, 100);
}
/* ═══════════════════════════════════════════════════
   INITIAL STATE
   ═══════════════════════════════════════════════════ */ const EMPTY_FORM = {
    agencyId: "",
    title: "",
    destination: "",
    country: "",
    continent: "",
    airport: "",
    multiDestination: false,
    additionalCities: [],
    duration: 7,
    nights: 6,
    travelStyles: [],
    categories: [],
    description: "",
    fullDescription: "",
    emotionalIntro: "",
    priceMin: 0,
    priceMax: 0,
    promoPrice: null,
    currency: "BRL (R$)",
    installments: 12,
    cancellationPolicy: "",
    hasFreeCancellation: false,
    isAllInclusive: false,
    featured: false,
    includes: [],
    includedItems: [],
    highlights: [],
    perfectFor: [],
    notRecommendedFor: [],
    importantInfo: [],
    routeDetails: null,
    whatsappOfficial: "",
    autoMessage: "",
    voucherUrl: "",
    eticketUrl: "",
    status: "ACTIVE"
};
function PackageEditorPage({ params }) {
    _s();
    const { id } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["use"])(params);
    const isNew = id === "new";
    const sectionRefs = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])({});
    const [openSections, setOpenSections] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(new Set([
        "destination"
    ]));
    const [activeSection, setActiveSection] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("destination");
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(!isNew);
    const [saving, setSaving] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [toast, setToast] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [form, setForm] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        ...EMPTY_FORM
    });
    const [validationErrors, setValidationErrors] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [cityInput, setCityInput] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [newInclude, setNewInclude] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [newHighlight, setNewHighlight] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [newPerfectFor, setNewPerfectFor] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [newNotFor, setNewNotFor] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [newImportant, setNewImportant] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [pkgDays, setPkgDays] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const addPkgDay = ()=>setPkgDays((d)=>[
                ...d,
                {
                    title: `Dia ${d.length + 1}`,
                    summary: "",
                    description: "",
                    activities: []
                }
            ]);
    const removePkgDay = (i)=>setPkgDays((d)=>d.filter((_, idx)=>idx !== i));
    const updatePkgDay = (i, f, v)=>setPkgDays((d)=>{
            const u = [
                ...d
            ];
            u[i][f] = v;
            return u;
        });
    const addPkgActivity = (di)=>setPkgDays((d)=>{
            const u = [
                ...d
            ];
            u[di].activities = [
                ...u[di].activities,
                {
                    time: "",
                    title: "",
                    location: "",
                    description: "",
                    tips: "",
                    duration: ""
                }
            ];
            return u;
        });
    const updatePkgActivity = (di, ai, f, v)=>setPkgDays((d)=>{
            const u = [
                ...d
            ];
            u[di].activities[ai][f] = v;
            return u;
        });
    const removePkgActivity = (di, ai)=>setPkgDays((d)=>{
            const u = [
                ...d
            ];
            u[di].activities.splice(ai, 1);
            return [
                ...u
            ];
        });
    // ─── Auto-save timer ───
    const autoSaveRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const showToast = (msg, type)=>{
        setToast({
            msg,
            type
        });
        setTimeout(()=>setToast(null), 3500);
    };
    // ─── Load session agencyId ───
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "PackageEditorPage.useEffect": ()=>{
            ({
                "PackageEditorPage.useEffect": async ()=>{
                    try {
                        const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$site$2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSession"])();
                        if (session?.agency?.id) {
                            setForm({
                                "PackageEditorPage.useEffect": (f)=>({
                                        ...f,
                                        agencyId: session.agency.id
                                    })
                            }["PackageEditorPage.useEffect"]);
                        }
                    } catch  {}
                }
            })["PackageEditorPage.useEffect"]();
        }
    }["PackageEditorPage.useEffect"], []);
    // ─── Load data ───
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "PackageEditorPage.useEffect": ()=>{
            if (isNew) return;
            ({
                "PackageEditorPage.useEffect": async ()=>{
                    try {
                        const data = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$site$2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getPackageById"])(id);
                        setForm({
                            "PackageEditorPage.useEffect": (prev)=>({
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
                                    importantInfo: data.importantInfo || []
                                })
                        }["PackageEditorPage.useEffect"]);
                    } catch (err) {
                        showToast("Erro ao carregar pacote", "error");
                    } finally{
                        setLoading(false);
                    }
                }
            })["PackageEditorPage.useEffect"]();
        }
    }["PackageEditorPage.useEffect"], [
        id,
        isNew
    ]);
    // ─── Auto country → continent ───
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "PackageEditorPage.useEffect": ()=>{
            if (form.country) {
                const cont = CONTINENT_MAP[form.country] || "";
                if (cont !== form.continent) setForm({
                    "PackageEditorPage.useEffect": (f)=>({
                            ...f,
                            continent: cont
                        })
                }["PackageEditorPage.useEffect"]);
            }
        }
    }["PackageEditorPage.useEffect"], [
        form.country,
        form.continent
    ]);
    // ─── Auto duration → nights ───
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "PackageEditorPage.useEffect": ()=>{
            const n = form.duration > 0 ? form.duration - 1 : 0;
            if (n !== form.nights) setForm({
                "PackageEditorPage.useEffect": (f)=>({
                        ...f,
                        nights: n
                    })
            }["PackageEditorPage.useEffect"]);
        }
    }["PackageEditorPage.useEffect"], [
        form.duration,
        form.nights
    ]);
    // ─── Auto-save draft every 30s ───
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "PackageEditorPage.useEffect": ()=>{
            if (isNew) return;
            autoSaveRef.current = setInterval({
                "PackageEditorPage.useEffect": async ()=>{
                    try {
                        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$site$2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["updatePackage"])(id, form);
                    } catch  {}
                }
            }["PackageEditorPage.useEffect"], 30000);
            return ({
                "PackageEditorPage.useEffect": ()=>{
                    if (autoSaveRef.current) clearInterval(autoSaveRef.current);
                }
            })["PackageEditorPage.useEffect"];
        }
    }["PackageEditorPage.useEffect"], [
        id,
        isNew,
        form
    ]);
    // ─── Validation ───
    const validate = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "PackageEditorPage.useCallback[validate]": ()=>{
            const errs = [];
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
        }
    }["PackageEditorPage.useCallback[validate]"], [
        form
    ]);
    // ─── Save ───
    const handleSave = async ()=>{
        const errs = validate();
        setValidationErrors(errs);
        if (errs.length > 0) {
            showToast(`${errs.length} campo(s) obrigatório(s) pendente(s)`, "error");
            return;
        }
        setSaving(true);
        try {
            const payload = {
                ...form,
                qualityScore: calcQualityScore(form)
            };
            if (isNew) {
                await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$site$2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createPackage"])(payload);
                showToast("Pacote criado com sucesso!", "success");
            } else {
                await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$site$2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["updatePackage"])(id, payload);
                showToast("Alterações salvas!", "success");
            }
        } catch (err) {
            showToast(err?.message || "Erro ao salvar", "error");
        } finally{
            setSaving(false);
        }
    };
    // ─── Section helpers ───
    const toggleSection = (key)=>{
        setOpenSections((prev)=>{
            const s = new Set(prev);
            s.has(key) ? s.delete(key) : s.add(key);
            return s;
        });
    };
    const scrollToSection = (key)=>{
        setActiveSection(key);
        if (!openSections.has(key)) setOpenSections((prev)=>new Set(prev).add(key));
        sectionRefs.current[key]?.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    };
    // ─── Section completion ───
    const isSectionComplete = (key)=>{
        switch(key){
            case "destination":
                return !!(form.country && form.destination);
            case "duration":
                return form.duration >= 1;
            case "style":
                return form.travelStyles.length >= 1 && form.travelStyles.length <= 3;
            case "categories":
                return form.categories.length >= 1 && form.categories.length <= 5;
            case "price":
                return !!(form.priceMin || form.priceMin === 0) && !!form.description;
            case "inclusions":
                return form.includedItems.length > 0 || form.includes.length > 0;
            case "itinerary":
                return pkgDays.length > 0;
            case "docs":
                return !!form.whatsappOfficial;
            default:
                return false;
        }
    };
    // ─── Multi-select chip handler ───
    const toggleChip = (arr, val, max, field)=>{
        setForm((f)=>{
            const current = [
                ...f[field]
            ];
            if (current.includes(val)) {
                return {
                    ...f,
                    [field]: current.filter((v)=>v !== val)
                };
            }
            if (current.length >= max) return f;
            return {
                ...f,
                [field]: [
                    ...current,
                    val
                ]
            };
        });
    };
    // ─── Tag add/remove helpers ───
    const addTag = (field, val, setter)=>{
        if (!val.trim()) return;
        setForm((f)=>({
                ...f,
                [field]: [
                    ...f[field],
                    val.trim()
                ]
            }));
        setter("");
    };
    const removeTag = (field, idx)=>{
        setForm((f)=>({
                ...f,
                [field]: f[field].filter((_, i)=>i !== idx)
            }));
    };
    // ─── Quality score ───
    const qualityScore = calcQualityScore(form);
    const qualityColor = qualityScore >= 80 ? "var(--success)" : qualityScore >= 50 ? "var(--warning)" : "var(--error)";
    // ─── Loading skeleton ───
    if (loading) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "editor-container",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "editor-skeleton",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "skeleton-bar",
                        style: {
                            width: "60%",
                            height: 32
                        }
                    }, void 0, false, {
                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                        lineNumber: 365,
                        columnNumber: 21
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "skeleton-bar",
                        style: {
                            width: "100%",
                            height: 200,
                            marginTop: 16
                        }
                    }, void 0, false, {
                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                        lineNumber: 366,
                        columnNumber: 21
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "skeleton-bar",
                        style: {
                            width: "100%",
                            height: 200,
                            marginTop: 16
                        }
                    }, void 0, false, {
                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                        lineNumber: 367,
                        columnNumber: 21
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                lineNumber: 364,
                columnNumber: 17
            }, this)
        }, void 0, false, {
            fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
            lineNumber: 363,
            columnNumber: 13
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "editor-container",
        children: [
            toast && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: `editor-toast ${toast.type}`,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: toast.type === "success" ? "" : ""
                    }, void 0, false, {
                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                        lineNumber: 378,
                        columnNumber: 21
                    }, this),
                    toast.msg
                ]
            }, void 0, true, {
                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                lineNumber: 377,
                columnNumber: 17
            }, this),
            validationErrors.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "pkg-validation-alert",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                        children: "Campos obrigatórios pendentes:"
                    }, void 0, false, {
                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                        lineNumber: 386,
                        columnNumber: 21
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                        children: validationErrors.map((e, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                children: e
                            }, i, false, {
                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                lineNumber: 387,
                                columnNumber: 57
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                        lineNumber: 387,
                        columnNumber: 21
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                lineNumber: 385,
                columnNumber: 17
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "editor-header",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "editor-header-left",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                href: "/dashboard/pacotes",
                                className: "editor-back",
                                children: "← Voltar"
                            }, void 0, false, {
                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                lineNumber: 394,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                className: "editor-title",
                                children: form.title || "Novo Pacote"
                            }, void 0, false, {
                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                lineNumber: 395,
                                columnNumber: 21
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                        lineNumber: 393,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "editor-header-right",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "pkg-quality-badge",
                                style: {
                                    borderColor: qualityColor
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "pkg-quality-fill",
                                        style: {
                                            width: `${qualityScore}%`,
                                            background: qualityColor
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                        lineNumber: 400,
                                        columnNumber: 25
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "pkg-quality-label",
                                        children: [
                                            qualityScore,
                                            "%"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                        lineNumber: 401,
                                        columnNumber: 25
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                lineNumber: 399,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: "editor-save-btn",
                                onClick: handleSave,
                                disabled: saving,
                                children: saving ? "Salvando..." : "Publicar Pacote"
                            }, void 0, false, {
                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                lineNumber: 403,
                                columnNumber: 21
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                        lineNumber: 397,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                lineNumber: 392,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "editor-layout",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                        className: "editor-sidebar editor-nav",
                        children: SECTIONS.map((s)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: `editor-nav-item ${activeSection === s.key ? "active" : ""}`,
                                onClick: ()=>scrollToSection(s.key),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "editor-nav-icon",
                                        children: s.icon
                                    }, void 0, false, {
                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                        lineNumber: 419,
                                        columnNumber: 29
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "editor-nav-label",
                                        children: s.title
                                    }, void 0, false, {
                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                        lineNumber: 420,
                                        columnNumber: 29
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: `editor-nav-dot ${isSectionComplete(s.key) ? "complete" : ""}`
                                    }, void 0, false, {
                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                        lineNumber: 421,
                                        columnNumber: 29
                                    }, this)
                                ]
                            }, s.key, true, {
                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                lineNumber: 414,
                                columnNumber: 25
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                        lineNumber: 412,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "editor-main",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                ref: (el)=>{
                                    sectionRefs.current.destination = el;
                                },
                                className: `editor-section ${openSections.has("destination") ? "open" : ""}`,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        className: "editor-section-header",
                                        onClick: ()=>toggleSection("destination"),
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "editor-section-icon",
                                                children: "1"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                lineNumber: 432,
                                                columnNumber: 29
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                                children: "Destino"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                lineNumber: 433,
                                                columnNumber: 29
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: `editor-section-badge ${isSectionComplete("destination") ? "complete" : "incomplete"}`,
                                                children: isSectionComplete("destination") ? "Completo" : "Pendente"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                lineNumber: 434,
                                                columnNumber: 29
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "editor-section-arrow",
                                                children: openSections.has("destination") ? "▲" : "▼"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                lineNumber: 437,
                                                columnNumber: 29
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                        lineNumber: 431,
                                        columnNumber: 25
                                    }, this),
                                    openSections.has("destination") && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "editor-section-body",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "editor-field",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                        children: "Título do Pacote *"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                        lineNumber: 442,
                                                        columnNumber: 37
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                        type: "text",
                                                        value: form.title,
                                                        onChange: (e)=>setForm((f)=>({
                                                                    ...f,
                                                                    title: e.target.value
                                                                })),
                                                        placeholder: "Ex: Paris Romântica & Vale do Loire",
                                                        className: "editor-input"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                        lineNumber: 443,
                                                        columnNumber: 37
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                lineNumber: 441,
                                                columnNumber: 33
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "editor-row",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "editor-field",
                                                        style: {
                                                            flex: 2
                                                        },
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                children: "País *"
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                lineNumber: 453,
                                                                columnNumber: 41
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                                                value: form.country,
                                                                onChange: (e)=>setForm((f)=>({
                                                                            ...f,
                                                                            country: e.target.value
                                                                        })),
                                                                className: "editor-select",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                        value: "",
                                                                        children: "Selecione o país"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                        lineNumber: 459,
                                                                        columnNumber: 45
                                                                    }, this),
                                                                    COUNTRIES.map((c)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                            value: c,
                                                                            children: c
                                                                        }, c, false, {
                                                                            fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                            lineNumber: 460,
                                                                            columnNumber: 65
                                                                        }, this))
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                lineNumber: 454,
                                                                columnNumber: 41
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                        lineNumber: 452,
                                                        columnNumber: 37
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "editor-field",
                                                        style: {
                                                            flex: 1
                                                        },
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                children: "Continente"
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                lineNumber: 464,
                                                                columnNumber: 41
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                type: "text",
                                                                value: form.continent,
                                                                readOnly: true,
                                                                className: "editor-input readonly"
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                lineNumber: 465,
                                                                columnNumber: 41
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                        lineNumber: 463,
                                                        columnNumber: 37
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                lineNumber: 451,
                                                columnNumber: 33
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "editor-row",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "editor-field",
                                                        style: {
                                                            flex: 2
                                                        },
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                children: "Cidade Principal *"
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                lineNumber: 470,
                                                                columnNumber: 41
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                type: "text",
                                                                value: form.destination,
                                                                onChange: (e)=>setForm((f)=>({
                                                                            ...f,
                                                                            destination: e.target.value
                                                                        })),
                                                                placeholder: "Ex: Paris, Roma, São Paulo...",
                                                                className: "editor-input"
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                lineNumber: 471,
                                                                columnNumber: 41
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                        lineNumber: 469,
                                                        columnNumber: 37
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "editor-field",
                                                        style: {
                                                            flex: 1
                                                        },
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                children: "Aeroporto Principal"
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                lineNumber: 480,
                                                                columnNumber: 41
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                type: "text",
                                                                value: form.airport,
                                                                onChange: (e)=>setForm((f)=>({
                                                                            ...f,
                                                                            airport: e.target.value
                                                                        })),
                                                                placeholder: "Ex: CDG, GRU",
                                                                className: "editor-input"
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                lineNumber: 481,
                                                                columnNumber: 41
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                        lineNumber: 479,
                                                        columnNumber: 37
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                lineNumber: 468,
                                                columnNumber: 33
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "editor-row",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "editor-field",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                        className: "editor-toggle",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                type: "checkbox",
                                                                checked: form.multiDestination,
                                                                onChange: (e)=>setForm((f)=>({
                                                                            ...f,
                                                                            multiDestination: e.target.checked
                                                                        }))
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                lineNumber: 494,
                                                                columnNumber: 45
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "editor-toggle-track"
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                lineNumber: 499,
                                                                columnNumber: 45
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "editor-toggle-thumb"
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                lineNumber: 500,
                                                                columnNumber: 45
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                style: {
                                                                    marginLeft: '10px',
                                                                    fontWeight: 600,
                                                                    color: 'var(--secondary)',
                                                                    fontSize: '14px'
                                                                },
                                                                children: "Multi-destino"
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                lineNumber: 501,
                                                                columnNumber: 45
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                        lineNumber: 493,
                                                        columnNumber: 41
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                    lineNumber: 492,
                                                    columnNumber: 37
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                lineNumber: 491,
                                                columnNumber: 33
                                            }, this),
                                            form.multiDestination && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "editor-field",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                        children: "Cidades Adicionais"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                        lineNumber: 508,
                                                        columnNumber: 41
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "editor-tag-list",
                                                        children: form.additionalCities.map((c, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "editor-tag",
                                                                children: [
                                                                    c,
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                        onClick: ()=>removeTag("additionalCities", i),
                                                                        children: "×"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                        lineNumber: 513,
                                                                        columnNumber: 53
                                                                    }, this)
                                                                ]
                                                            }, i, true, {
                                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                lineNumber: 511,
                                                                columnNumber: 49
                                                            }, this))
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                        lineNumber: 509,
                                                        columnNumber: 41
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "editor-tag-input-row",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                type: "text",
                                                                value: cityInput,
                                                                onChange: (e)=>setCityInput(e.target.value),
                                                                onKeyDown: (e)=>e.key === "Enter" && (e.preventDefault(), addTag("additionalCities", cityInput, setCityInput)),
                                                                placeholder: "Adicionar cidade",
                                                                className: "editor-input"
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                lineNumber: 518,
                                                                columnNumber: 45
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                className: "editor-tag-add",
                                                                onClick: ()=>addTag("additionalCities", cityInput, setCityInput),
                                                                children: "+"
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                lineNumber: 526,
                                                                columnNumber: 45
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                        lineNumber: 517,
                                                        columnNumber: 41
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                lineNumber: 507,
                                                columnNumber: 37
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                        lineNumber: 440,
                                        columnNumber: 29
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                lineNumber: 430,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                ref: (el)=>{
                                    sectionRefs.current.duration = el;
                                },
                                className: `editor-section ${openSections.has("duration") ? "open" : ""}`,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        className: "editor-section-header",
                                        onClick: ()=>toggleSection("duration"),
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "editor-section-icon",
                                                children: "2"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                lineNumber: 537,
                                                columnNumber: 29
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                                children: "Duração"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                lineNumber: 538,
                                                columnNumber: 29
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: `editor-section-badge ${isSectionComplete("duration") ? "complete" : "incomplete"}`,
                                                children: isSectionComplete("duration") ? "Completo" : "Pendente"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                lineNumber: 539,
                                                columnNumber: 29
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "editor-section-arrow",
                                                children: openSections.has("duration") ? "▲" : "▼"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                lineNumber: 542,
                                                columnNumber: 29
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                        lineNumber: 536,
                                        columnNumber: 25
                                    }, this),
                                    openSections.has("duration") && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "editor-section-body",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "editor-row",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "editor-field",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                            children: "Número de dias *"
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                            lineNumber: 548,
                                                            columnNumber: 41
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                            type: "number",
                                                            min: 1,
                                                            value: form.duration,
                                                            onChange: (e)=>setForm((f)=>({
                                                                        ...f,
                                                                        duration: parseInt(e.target.value) || 0
                                                                    })),
                                                            onFocus: (e)=>e.target.select(),
                                                            className: "editor-input"
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                            lineNumber: 549,
                                                            columnNumber: 41
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                    lineNumber: 547,
                                                    columnNumber: 37
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "editor-field",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                            children: "Número de noites"
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                            lineNumber: 559,
                                                            columnNumber: 41
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                            type: "number",
                                                            value: form.nights,
                                                            readOnly: true,
                                                            className: "editor-input readonly"
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                            lineNumber: 560,
                                                            columnNumber: 41
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                    lineNumber: 558,
                                                    columnNumber: 37
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "editor-field",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                            children: "Classificação"
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                            lineNumber: 563,
                                                            columnNumber: 41
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "pkg-duration-badge",
                                                            children: form.duration >= 1 ? getDurationLabel(form.duration) : "—"
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                            lineNumber: 564,
                                                            columnNumber: 41
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                    lineNumber: 562,
                                                    columnNumber: 37
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                            lineNumber: 546,
                                            columnNumber: 33
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                        lineNumber: 545,
                                        columnNumber: 29
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                lineNumber: 535,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                ref: (el)=>{
                                    sectionRefs.current.style = el;
                                },
                                className: `editor-section ${openSections.has("style") ? "open" : ""}`,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        className: "editor-section-header",
                                        onClick: ()=>toggleSection("style"),
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "editor-section-icon",
                                                children: "3"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                lineNumber: 576,
                                                columnNumber: 29
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                                children: "Estilo de Viagem"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                lineNumber: 577,
                                                columnNumber: 29
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: `editor-section-badge ${isSectionComplete("style") ? "complete" : "incomplete"}`,
                                                children: isSectionComplete("style") ? "Completo" : "Pendente"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                lineNumber: 578,
                                                columnNumber: 29
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "editor-section-arrow",
                                                children: openSections.has("style") ? "▲" : "▼"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                lineNumber: 581,
                                                columnNumber: 29
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                        lineNumber: 575,
                                        columnNumber: 25
                                    }, this),
                                    openSections.has("style") && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "editor-section-body",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "editor-field-hint",
                                                children: [
                                                    "Selecione até ",
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                        children: "3"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                        lineNumber: 585,
                                                        columnNumber: 80
                                                    }, this),
                                                    " estilos (",
                                                    form.travelStyles.length,
                                                    "/3)"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                lineNumber: 585,
                                                columnNumber: 33
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "pkg-chip-grid",
                                                children: TRAVEL_STYLES.map((ts)=>{
                                                    const selected = form.travelStyles.includes(ts.key);
                                                    const disabled = !selected && form.travelStyles.length >= 3;
                                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        className: `pkg-chip ${selected ? "selected" : ""} ${disabled ? "disabled" : ""}`,
                                                        onClick: ()=>toggleChip(form.travelStyles, ts.key, 3, "travelStyles"),
                                                        disabled: disabled,
                                                        children: ts.label
                                                    }, ts.key, false, {
                                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                        lineNumber: 591,
                                                        columnNumber: 45
                                                    }, this);
                                                })
                                            }, void 0, false, {
                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                lineNumber: 586,
                                                columnNumber: 33
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                        lineNumber: 584,
                                        columnNumber: 29
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                lineNumber: 574,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                ref: (el)=>{
                                    sectionRefs.current.categories = el;
                                },
                                className: `editor-section ${openSections.has("categories") ? "open" : ""}`,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        className: "editor-section-header",
                                        onClick: ()=>toggleSection("categories"),
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "editor-section-icon",
                                                children: "4"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                lineNumber: 609,
                                                columnNumber: 29
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                                children: "Categorias Temáticas"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                lineNumber: 610,
                                                columnNumber: 29
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: `editor-section-badge ${isSectionComplete("categories") ? "complete" : "incomplete"}`,
                                                children: isSectionComplete("categories") ? "Completo" : "Pendente"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                lineNumber: 611,
                                                columnNumber: 29
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "editor-section-arrow",
                                                children: openSections.has("categories") ? "▲" : "▼"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                lineNumber: 614,
                                                columnNumber: 29
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                        lineNumber: 608,
                                        columnNumber: 25
                                    }, this),
                                    openSections.has("categories") && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "editor-section-body",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "editor-field-hint",
                                                children: [
                                                    "Mínimo 1, máximo 5 (",
                                                    form.categories.length,
                                                    "/5)"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                lineNumber: 618,
                                                columnNumber: 33
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "pkg-chip-grid",
                                                children: CATEGORY_OPTIONS.map((cat)=>{
                                                    const selected = form.categories.includes(cat.key);
                                                    const disabled = !selected && form.categories.length >= 5;
                                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        className: `pkg-chip ${selected ? "selected" : ""} ${disabled ? "disabled" : ""}`,
                                                        onClick: ()=>toggleChip(form.categories, cat.key, 5, "categories"),
                                                        disabled: disabled,
                                                        children: cat.label
                                                    }, cat.key, false, {
                                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                        lineNumber: 624,
                                                        columnNumber: 45
                                                    }, this);
                                                })
                                            }, void 0, false, {
                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                lineNumber: 619,
                                                columnNumber: 33
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                        lineNumber: 617,
                                        columnNumber: 29
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                lineNumber: 607,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                ref: (el)=>{
                                    sectionRefs.current.price = el;
                                },
                                className: `editor-section ${openSections.has("price") ? "open" : ""}`,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        className: "editor-section-header",
                                        onClick: ()=>toggleSection("price"),
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "editor-section-icon",
                                                children: "5"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                lineNumber: 642,
                                                columnNumber: 29
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                                children: "Preço"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                lineNumber: 643,
                                                columnNumber: 29
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: `editor-section-badge ${isSectionComplete("price") ? "complete" : "incomplete"}`,
                                                children: isSectionComplete("price") ? "Completo" : "Pendente"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                lineNumber: 644,
                                                columnNumber: 29
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "editor-section-arrow",
                                                children: openSections.has("price") ? "▲" : "▼"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                lineNumber: 647,
                                                columnNumber: 29
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                        lineNumber: 641,
                                        columnNumber: 25
                                    }, this),
                                    openSections.has("price") && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "editor-section-body",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "editor-row",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "editor-field",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                children: "Preço base por pessoa *"
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                lineNumber: 653,
                                                                columnNumber: 41
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                type: "number",
                                                                min: 0,
                                                                value: form.priceMin,
                                                                onChange: (e)=>setForm((f)=>({
                                                                            ...f,
                                                                            priceMin: parseFloat(e.target.value) || 0
                                                                        })),
                                                                onFocus: (e)=>e.target.select(),
                                                                className: "editor-input"
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                lineNumber: 654,
                                                                columnNumber: 41
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                        lineNumber: 652,
                                                        columnNumber: 37
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "editor-field",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                children: "Preço máximo estimado"
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                lineNumber: 664,
                                                                columnNumber: 41
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                type: "number",
                                                                min: 0,
                                                                value: form.priceMax,
                                                                onChange: (e)=>setForm((f)=>({
                                                                            ...f,
                                                                            priceMax: parseFloat(e.target.value) || 0
                                                                        })),
                                                                onFocus: (e)=>e.target.select(),
                                                                className: "editor-input"
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                lineNumber: 665,
                                                                columnNumber: 41
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                        lineNumber: 663,
                                                        columnNumber: 37
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "editor-field",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                children: "Moeda"
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                lineNumber: 675,
                                                                columnNumber: 41
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                                                value: form.currency,
                                                                onChange: (e)=>setForm((f)=>({
                                                                            ...f,
                                                                            currency: e.target.value
                                                                        })),
                                                                className: "editor-select",
                                                                children: CURRENCIES.map((c)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                        value: c,
                                                                        children: c
                                                                    }, c, false, {
                                                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                        lineNumber: 681,
                                                                        columnNumber: 66
                                                                    }, this))
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                lineNumber: 676,
                                                                columnNumber: 41
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                        lineNumber: 674,
                                                        columnNumber: 37
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                lineNumber: 651,
                                                columnNumber: 33
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "editor-row",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "editor-field",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                children: "Preço promocional (opcional)"
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                lineNumber: 687,
                                                                columnNumber: 41
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                type: "number",
                                                                min: 0,
                                                                value: form.promoPrice ?? "",
                                                                onChange: (e)=>setForm((f)=>({
                                                                            ...f,
                                                                            promoPrice: e.target.value ? parseFloat(e.target.value) : null
                                                                        })),
                                                                onFocus: (e)=>e.target.select(),
                                                                placeholder: "Deixe vazio se não houver",
                                                                className: "editor-input"
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                lineNumber: 688,
                                                                columnNumber: 41
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                        lineNumber: 686,
                                                        columnNumber: 37
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "editor-field",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                children: "Parcelas (máx)"
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                lineNumber: 699,
                                                                columnNumber: 41
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                type: "number",
                                                                min: 1,
                                                                max: 24,
                                                                value: form.installments,
                                                                onChange: (e)=>setForm((f)=>({
                                                                            ...f,
                                                                            installments: parseInt(e.target.value) || 1
                                                                        })),
                                                                className: "editor-input"
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                lineNumber: 700,
                                                                columnNumber: 41
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                        lineNumber: 698,
                                                        columnNumber: 37
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                lineNumber: 685,
                                                columnNumber: 33
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "editor-field",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                        children: "Descrição curta *"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                        lineNumber: 712,
                                                        columnNumber: 37
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                                        value: form.description,
                                                        onChange: (e)=>setForm((f)=>({
                                                                    ...f,
                                                                    description: e.target.value
                                                                })),
                                                        placeholder: "Uma frase que resume o pacote...",
                                                        className: "editor-textarea",
                                                        rows: 2
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                        lineNumber: 713,
                                                        columnNumber: 37
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                lineNumber: 711,
                                                columnNumber: 33
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "editor-field",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                        children: "Política de cancelamento"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                        lineNumber: 723,
                                                        columnNumber: 37
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                                        value: form.cancellationPolicy,
                                                        onChange: (e)=>setForm((f)=>({
                                                                    ...f,
                                                                    cancellationPolicy: e.target.value
                                                                })),
                                                        placeholder: "Ex: Cancelamento gratuito até 7 dias antes...",
                                                        className: "editor-textarea",
                                                        rows: 2
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                        lineNumber: 724,
                                                        columnNumber: 37
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                lineNumber: 722,
                                                columnNumber: 33
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "editor-row",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                        className: "pkg-toggle-row",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                type: "checkbox",
                                                                checked: form.hasFreeCancellation,
                                                                onChange: (e)=>setForm((f)=>({
                                                                            ...f,
                                                                            hasFreeCancellation: e.target.checked
                                                                        }))
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                lineNumber: 735,
                                                                columnNumber: 41
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                children: "Cancelamento gratuito"
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                lineNumber: 740,
                                                                columnNumber: 41
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                        lineNumber: 734,
                                                        columnNumber: 37
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                        className: "pkg-toggle-row",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                type: "checkbox",
                                                                checked: form.isAllInclusive,
                                                                onChange: (e)=>setForm((f)=>({
                                                                            ...f,
                                                                            isAllInclusive: e.target.checked
                                                                        }))
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                lineNumber: 743,
                                                                columnNumber: 41
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                children: "All Inclusive"
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                lineNumber: 748,
                                                                columnNumber: 41
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                        lineNumber: 742,
                                                        columnNumber: 37
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                        className: "pkg-toggle-row",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                type: "checkbox",
                                                                checked: form.featured,
                                                                onChange: (e)=>setForm((f)=>({
                                                                            ...f,
                                                                            featured: e.target.checked
                                                                        }))
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                lineNumber: 751,
                                                                columnNumber: 41
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                children: "Destaque"
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                lineNumber: 756,
                                                                columnNumber: 41
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                        lineNumber: 750,
                                                        columnNumber: 37
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                lineNumber: 733,
                                                columnNumber: 33
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                        lineNumber: 650,
                                        columnNumber: 29
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                lineNumber: 640,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                ref: (el)=>{
                                    sectionRefs.current.inclusions = el;
                                },
                                className: `editor-section ${openSections.has("inclusions") ? "open" : ""}`,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        className: "editor-section-header",
                                        onClick: ()=>toggleSection("inclusions"),
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "editor-section-icon",
                                                children: "6"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                lineNumber: 766,
                                                columnNumber: 29
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                                children: "Inclusões e Experiência"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                lineNumber: 767,
                                                columnNumber: 29
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: `editor-section-badge ${isSectionComplete("inclusions") ? "complete" : "incomplete"}`,
                                                children: isSectionComplete("inclusions") ? "Completo" : "Pendente"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                lineNumber: 768,
                                                columnNumber: 29
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "editor-section-arrow",
                                                children: openSections.has("inclusions") ? "▲" : "▼"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                lineNumber: 771,
                                                columnNumber: 29
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                        lineNumber: 765,
                                        columnNumber: 25
                                    }, this),
                                    openSections.has("inclusions") && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "editor-section-body",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "editor-field",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                        children: "O que está incluso"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                        lineNumber: 777,
                                                        columnNumber: 37
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "editor-tag-list",
                                                        children: form.includedItems.map((item, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "editor-tag",
                                                                children: [
                                                                    item,
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                        onClick: ()=>removeTag("includedItems", i),
                                                                        children: "×"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                        lineNumber: 782,
                                                                        columnNumber: 49
                                                                    }, this)
                                                                ]
                                                            }, i, true, {
                                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                lineNumber: 780,
                                                                columnNumber: 45
                                                            }, this))
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                        lineNumber: 778,
                                                        columnNumber: 37
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "editor-tag-input-row",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                type: "text",
                                                                value: newInclude,
                                                                onChange: (e)=>setNewInclude(e.target.value),
                                                                onKeyDown: (e)=>e.key === "Enter" && (e.preventDefault(), addTag("includedItems", newInclude, setNewInclude)),
                                                                placeholder: "Ex: Passagem aérea, Hotel 4 estrelas...",
                                                                className: "editor-input"
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                lineNumber: 787,
                                                                columnNumber: 41
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                className: "editor-tag-add",
                                                                onClick: ()=>addTag("includedItems", newInclude, setNewInclude),
                                                                children: "+"
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                lineNumber: 795,
                                                                columnNumber: 41
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                        lineNumber: 786,
                                                        columnNumber: 37
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                lineNumber: 776,
                                                columnNumber: 33
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "editor-field",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                        children: "Destaques do pacote"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                        lineNumber: 801,
                                                        columnNumber: 37
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "editor-tag-list",
                                                        children: form.highlights.map((h, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "editor-tag",
                                                                children: [
                                                                    h,
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                        onClick: ()=>removeTag("highlights", i),
                                                                        children: "×"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                        lineNumber: 806,
                                                                        columnNumber: 49
                                                                    }, this)
                                                                ]
                                                            }, i, true, {
                                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                lineNumber: 804,
                                                                columnNumber: 45
                                                            }, this))
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                        lineNumber: 802,
                                                        columnNumber: 37
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "editor-tag-input-row",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                type: "text",
                                                                value: newHighlight,
                                                                onChange: (e)=>setNewHighlight(e.target.value),
                                                                onKeyDown: (e)=>e.key === "Enter" && (e.preventDefault(), addTag("highlights", newHighlight, setNewHighlight)),
                                                                placeholder: "Ex: Tour pela Torre Eiffel...",
                                                                className: "editor-input"
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                lineNumber: 811,
                                                                columnNumber: 41
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                className: "editor-tag-add",
                                                                onClick: ()=>addTag("highlights", newHighlight, setNewHighlight),
                                                                children: "+"
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                lineNumber: 819,
                                                                columnNumber: 41
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                        lineNumber: 810,
                                                        columnNumber: 37
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                lineNumber: 800,
                                                columnNumber: 33
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "editor-field",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                        children: "Descrição completa"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                        lineNumber: 825,
                                                        columnNumber: 37
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                                        value: form.fullDescription,
                                                        onChange: (e)=>setForm((f)=>({
                                                                    ...f,
                                                                    fullDescription: e.target.value
                                                                })),
                                                        placeholder: "Descrição detalhada do pacote...",
                                                        className: "editor-textarea",
                                                        rows: 4
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                        lineNumber: 826,
                                                        columnNumber: 37
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                lineNumber: 824,
                                                columnNumber: 33
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "editor-field",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                        children: "Introdução emocional"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                        lineNumber: 837,
                                                        columnNumber: 37
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                                        value: form.emotionalIntro,
                                                        onChange: (e)=>setForm((f)=>({
                                                                    ...f,
                                                                    emotionalIntro: e.target.value
                                                                })),
                                                        placeholder: "Uma frase inspiradora sobre o destino...",
                                                        className: "editor-textarea",
                                                        rows: 2
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                        lineNumber: 838,
                                                        columnNumber: 37
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                lineNumber: 836,
                                                columnNumber: 33
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "editor-field",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                        children: "Público ideal"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                        lineNumber: 849,
                                                        columnNumber: 37
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "editor-tag-list",
                                                        children: form.perfectFor.map((p, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "editor-tag editor-tag-green",
                                                                children: [
                                                                    p,
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                        onClick: ()=>removeTag("perfectFor", i),
                                                                        children: "×"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                        lineNumber: 854,
                                                                        columnNumber: 49
                                                                    }, this)
                                                                ]
                                                            }, i, true, {
                                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                lineNumber: 852,
                                                                columnNumber: 45
                                                            }, this))
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                        lineNumber: 850,
                                                        columnNumber: 37
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "editor-tag-input-row",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                type: "text",
                                                                value: newPerfectFor,
                                                                onChange: (e)=>setNewPerfectFor(e.target.value),
                                                                onKeyDown: (e)=>e.key === "Enter" && (e.preventDefault(), addTag("perfectFor", newPerfectFor, setNewPerfectFor)),
                                                                placeholder: "Ex: Casais, Famílias com crianças...",
                                                                className: "editor-input"
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                lineNumber: 859,
                                                                columnNumber: 41
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                className: "editor-tag-add",
                                                                onClick: ()=>addTag("perfectFor", newPerfectFor, setNewPerfectFor),
                                                                children: "+"
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                lineNumber: 867,
                                                                columnNumber: 41
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                        lineNumber: 858,
                                                        columnNumber: 37
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                lineNumber: 848,
                                                columnNumber: 33
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "editor-field",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                        children: "Não recomendado para"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                        lineNumber: 873,
                                                        columnNumber: 37
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "editor-tag-list",
                                                        children: form.notRecommendedFor.map((n, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "editor-tag editor-tag-red",
                                                                children: [
                                                                    n,
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                        onClick: ()=>removeTag("notRecommendedFor", i),
                                                                        children: "×"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                        lineNumber: 878,
                                                                        columnNumber: 49
                                                                    }, this)
                                                                ]
                                                            }, i, true, {
                                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                lineNumber: 876,
                                                                columnNumber: 45
                                                            }, this))
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                        lineNumber: 874,
                                                        columnNumber: 37
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "editor-tag-input-row",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                type: "text",
                                                                value: newNotFor,
                                                                onChange: (e)=>setNewNotFor(e.target.value),
                                                                onKeyDown: (e)=>e.key === "Enter" && (e.preventDefault(), addTag("notRecommendedFor", newNotFor, setNewNotFor)),
                                                                placeholder: "Ex: Pessoas com mobilidade reduzida...",
                                                                className: "editor-input"
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                lineNumber: 883,
                                                                columnNumber: 41
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                className: "editor-tag-add",
                                                                onClick: ()=>addTag("notRecommendedFor", newNotFor, setNewNotFor),
                                                                children: "+"
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                lineNumber: 891,
                                                                columnNumber: 41
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                        lineNumber: 882,
                                                        columnNumber: 37
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                lineNumber: 872,
                                                columnNumber: 33
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "editor-field",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                        children: "Informações importantes"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                        lineNumber: 897,
                                                        columnNumber: 37
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "editor-tag-list",
                                                        children: form.importantInfo.map((info, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "editor-tag",
                                                                children: [
                                                                    info,
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                        onClick: ()=>removeTag("importantInfo", i),
                                                                        children: "×"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                        lineNumber: 902,
                                                                        columnNumber: 49
                                                                    }, this)
                                                                ]
                                                            }, i, true, {
                                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                lineNumber: 900,
                                                                columnNumber: 45
                                                            }, this))
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                        lineNumber: 898,
                                                        columnNumber: 37
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "editor-tag-input-row",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                type: "text",
                                                                value: newImportant,
                                                                onChange: (e)=>setNewImportant(e.target.value),
                                                                onKeyDown: (e)=>e.key === "Enter" && (e.preventDefault(), addTag("importantInfo", newImportant, setNewImportant)),
                                                                placeholder: "Ex: Necessário passaporte válido...",
                                                                className: "editor-input"
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                lineNumber: 907,
                                                                columnNumber: 41
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                className: "editor-tag-add",
                                                                onClick: ()=>addTag("importantInfo", newImportant, setNewImportant),
                                                                children: "+"
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                lineNumber: 915,
                                                                columnNumber: 41
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                        lineNumber: 906,
                                                        columnNumber: 37
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                lineNumber: 896,
                                                columnNumber: 33
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                        lineNumber: 774,
                                        columnNumber: 29
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                lineNumber: 764,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                ref: (el)=>{
                                    sectionRefs.current.itinerary = el;
                                },
                                className: `editor-section ${openSections.has("itinerary") ? "open" : ""}`,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        className: "editor-section-header",
                                        onClick: ()=>toggleSection("itinerary"),
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "editor-section-icon",
                                                children: "7"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                lineNumber: 925,
                                                columnNumber: 29
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                                children: "Roteiro Dia a Dia"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                lineNumber: 926,
                                                columnNumber: 29
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: `editor-section-badge ${isSectionComplete("itinerary") ? "complete" : "incomplete"}`,
                                                children: pkgDays.length > 0 ? `${pkgDays.length} dia(s)` : "Pendente"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                lineNumber: 927,
                                                columnNumber: 29
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "editor-section-arrow",
                                                children: openSections.has("itinerary") ? "▲" : "▼"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                lineNumber: 930,
                                                columnNumber: 29
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                        lineNumber: 924,
                                        columnNumber: 25
                                    }, this),
                                    openSections.has("itinerary") && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "editor-section-body",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "editor-field-hint",
                                                children: "Descreva o que o viajante fará em cada dia do pacote. Quanto mais detalhado, mais confiança você transmite."
                                            }, void 0, false, {
                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                lineNumber: 934,
                                                columnNumber: 33
                                            }, this),
                                            pkgDays.map((day, di)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "editor-day-card",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "editor-day-header",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "editor-day-number",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                            className: "editor-day-badge",
                                                                            children: di + 1
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                            lineNumber: 939,
                                                                            columnNumber: 49
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                            className: "editor-day-title-input",
                                                                            value: day.title,
                                                                            onChange: (e)=>updatePkgDay(di, "title", e.target.value),
                                                                            placeholder: `Título do Dia ${di + 1} — ex: Chegada em Paris`
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                            lineNumber: 940,
                                                                            columnNumber: 49
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                    lineNumber: 938,
                                                                    columnNumber: 45
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                    className: "btn-remove",
                                                                    onClick: ()=>removePkgDay(di),
                                                                    children: "🗑️"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                    lineNumber: 947,
                                                                    columnNumber: 45
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                            lineNumber: 937,
                                                            columnNumber: 41
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "editor-day-body",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "editor-field",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                            children: "Resumo do dia"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                            lineNumber: 951,
                                                                            columnNumber: 49
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                            className: "editor-input",
                                                                            value: day.summary,
                                                                            onChange: (e)=>updatePkgDay(di, "summary", e.target.value),
                                                                            placeholder: "Ex: Chegada, city tour e jantar no Marais"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                            lineNumber: 952,
                                                                            columnNumber: 49
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                    lineNumber: 950,
                                                                    columnNumber: 45
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "editor-field",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                            children: "Descrição completa do dia"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                            lineNumber: 960,
                                                                            columnNumber: 49
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                                                            className: "editor-textarea",
                                                                            rows: 3,
                                                                            value: day.description,
                                                                            onChange: (e)=>updatePkgDay(di, "description", e.target.value),
                                                                            placeholder: "Descreva como o dia se desenrola, o que está incluso, dicas..."
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                            lineNumber: 961,
                                                                            columnNumber: 49
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                    lineNumber: 959,
                                                                    columnNumber: 45
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "editor-activities",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                            className: "editor-activities-label",
                                                                            children: [
                                                                                "Atividades / Pontos do dia (",
                                                                                day.activities.length,
                                                                                ")"
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                            lineNumber: 970,
                                                                            columnNumber: 49
                                                                        }, this),
                                                                        day.activities.map((act, ai)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                className: "editor-activity-card",
                                                                                children: [
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                        className: "editor-activity-row",
                                                                                        children: [
                                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                                                className: "editor-act-time",
                                                                                                value: act.time,
                                                                                                onChange: (e)=>updatePkgActivity(di, ai, "time", e.target.value),
                                                                                                placeholder: "09:00"
                                                                                            }, void 0, false, {
                                                                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                                                lineNumber: 974,
                                                                                                columnNumber: 61
                                                                                            }, this),
                                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                                                className: "editor-act-title",
                                                                                                value: act.title,
                                                                                                onChange: (e)=>updatePkgActivity(di, ai, "title", e.target.value),
                                                                                                placeholder: "Ex: Visita à Torre Eiffel",
                                                                                                style: {
                                                                                                    flex: 2
                                                                                                }
                                                                                            }, void 0, false, {
                                                                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                                                lineNumber: 975,
                                                                                                columnNumber: 61
                                                                                            }, this),
                                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                                                className: "editor-act-dur",
                                                                                                value: act.duration,
                                                                                                onChange: (e)=>updatePkgActivity(di, ai, "duration", e.target.value),
                                                                                                placeholder: "2h"
                                                                                            }, void 0, false, {
                                                                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                                                lineNumber: 976,
                                                                                                columnNumber: 61
                                                                                            }, this),
                                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                                                className: "btn-remove",
                                                                                                onClick: ()=>removePkgActivity(di, ai),
                                                                                                children: "✕"
                                                                                            }, void 0, false, {
                                                                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                                                lineNumber: 977,
                                                                                                columnNumber: 61
                                                                                            }, this)
                                                                                        ]
                                                                                    }, void 0, true, {
                                                                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                                        lineNumber: 973,
                                                                                        columnNumber: 57
                                                                                    }, this),
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                        className: "editor-activity-row",
                                                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                                            className: "editor-input",
                                                                                            value: act.location,
                                                                                            onChange: (e)=>updatePkgActivity(di, ai, "location", e.target.value),
                                                                                            placeholder: "📍 Local / Endereço"
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                                            lineNumber: 980,
                                                                                            columnNumber: 61
                                                                                        }, this)
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                                        lineNumber: 979,
                                                                                        columnNumber: 57
                                                                                    }, this),
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                        className: "editor-activity-row",
                                                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                                                                            value: act.tips,
                                                                                            onChange: (e)=>updatePkgActivity(di, ai, "tips", e.target.value),
                                                                                            placeholder: "💡 Dica sobre esse ponto...",
                                                                                            style: {
                                                                                                minHeight: 40,
                                                                                                width: "100%"
                                                                                            },
                                                                                            className: "editor-textarea",
                                                                                            rows: 2
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                                            lineNumber: 983,
                                                                                            columnNumber: 61
                                                                                        }, this)
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                                        lineNumber: 982,
                                                                                        columnNumber: 57
                                                                                    }, this)
                                                                                ]
                                                                            }, ai, true, {
                                                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                                lineNumber: 972,
                                                                                columnNumber: 53
                                                                            }, this)),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                            className: "btn-add-item",
                                                                            onClick: ()=>addPkgActivity(di),
                                                                            children: "+ Atividade"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                            lineNumber: 987,
                                                                            columnNumber: 49
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                    lineNumber: 969,
                                                                    columnNumber: 45
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                            lineNumber: 949,
                                                            columnNumber: 41
                                                        }, this)
                                                    ]
                                                }, di, true, {
                                                    fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                    lineNumber: 936,
                                                    columnNumber: 37
                                                }, this)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                className: "btn-add-item full-width",
                                                onClick: addPkgDay,
                                                children: "+ Adicionar Dia"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                lineNumber: 992,
                                                columnNumber: 33
                                            }, this),
                                            pkgDays.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "editor-field-hint",
                                                style: {
                                                    marginTop: 8
                                                },
                                                children: "💡 Opcional mas altamente recomendado — pacotes com roteiro detalhado convertem 3x mais."
                                            }, void 0, false, {
                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                lineNumber: 993,
                                                columnNumber: 58
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                        lineNumber: 933,
                                        columnNumber: 29
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                lineNumber: 923,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                ref: (el)=>{
                                    sectionRefs.current.docs = el;
                                },
                                className: `editor-section ${openSections.has("docs") ? "open" : ""}`,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        className: "editor-section-header",
                                        onClick: ()=>toggleSection("docs"),
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "editor-section-icon",
                                                children: "8"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                lineNumber: 1001,
                                                columnNumber: 29
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                                children: "Documentação e Pós-compra"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                lineNumber: 1002,
                                                columnNumber: 29
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: `editor-section-badge ${isSectionComplete("docs") ? "complete" : "incomplete"}`,
                                                children: isSectionComplete("docs") ? "Completo" : "Pendente"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                lineNumber: 1003,
                                                columnNumber: 29
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "editor-section-arrow",
                                                children: openSections.has("docs") ? "▲" : "▼"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                lineNumber: 1006,
                                                columnNumber: 29
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                        lineNumber: 1000,
                                        columnNumber: 25
                                    }, this),
                                    openSections.has("docs") && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "editor-section-body",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "editor-row",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "editor-field",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                children: "URL do Voucher"
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                lineNumber: 1012,
                                                                columnNumber: 41
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                type: "url",
                                                                value: form.voucherUrl,
                                                                onChange: (e)=>setForm((f)=>({
                                                                            ...f,
                                                                            voucherUrl: e.target.value
                                                                        })),
                                                                placeholder: "https://...",
                                                                className: "editor-input"
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                lineNumber: 1013,
                                                                columnNumber: 41
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                        lineNumber: 1011,
                                                        columnNumber: 37
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "editor-field",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                children: "URL do E-ticket"
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                lineNumber: 1022,
                                                                columnNumber: 41
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                type: "url",
                                                                value: form.eticketUrl,
                                                                onChange: (e)=>setForm((f)=>({
                                                                            ...f,
                                                                            eticketUrl: e.target.value
                                                                        })),
                                                                placeholder: "https://...",
                                                                className: "editor-input"
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                                lineNumber: 1023,
                                                                columnNumber: 41
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                        lineNumber: 1021,
                                                        columnNumber: 37
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                lineNumber: 1010,
                                                columnNumber: 33
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "editor-row",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "editor-field",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                            children: "WhatsApp oficial da agência"
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                            lineNumber: 1034,
                                                            columnNumber: 41
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                            type: "tel",
                                                            value: form.whatsappOfficial,
                                                            onChange: (e)=>setForm((f)=>({
                                                                        ...f,
                                                                        whatsappOfficial: e.target.value
                                                                    })),
                                                            placeholder: "+55 11 99999-9999",
                                                            className: "editor-input"
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                            lineNumber: 1035,
                                                            columnNumber: 41
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                    lineNumber: 1033,
                                                    columnNumber: 37
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                lineNumber: 1032,
                                                columnNumber: 33
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "editor-field",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                        children: "Mensagem automática pós-compra"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                        lineNumber: 1045,
                                                        columnNumber: 37
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                                        value: form.autoMessage,
                                                        onChange: (e)=>setForm((f)=>({
                                                                    ...f,
                                                                    autoMessage: e.target.value
                                                                })),
                                                        placeholder: "Mensagem que o comprador recebe automaticamente após a compra...",
                                                        className: "editor-textarea",
                                                        rows: 3
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                        lineNumber: 1046,
                                                        columnNumber: 37
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                                lineNumber: 1044,
                                                columnNumber: 33
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                        lineNumber: 1009,
                                        columnNumber: 29
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                                lineNumber: 999,
                                columnNumber: 21
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                        lineNumber: 427,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
                lineNumber: 410,
                columnNumber: 13
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/site/src/app/dashboard/pacote/[id]/page.tsx",
        lineNumber: 374,
        columnNumber: 9
    }, this);
}
_s(PackageEditorPage, "4KZz7miV2rodAma034NQFaTbZQ4=");
_c = PackageEditorPage;
var _c;
__turbopack_context__.k.register(_c, "PackageEditorPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=apps_site_src_c5e1677f._.js.map
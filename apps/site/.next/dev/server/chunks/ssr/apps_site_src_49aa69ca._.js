module.exports = [
"[project]/apps/site/src/lib/api.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
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
/**
 * Dashboard API utility — connects to VAMO backend
 * Automatically attaches JWT token from auth lib
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$site$2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/site/src/lib/auth.ts [app-ssr] (ecmascript)");
;
const API_BASE_URL = ("TURBOPACK compile-time value", "http://localhost:3333/api") || 'http://localhost:3333/api';
async function fetchApi(endpoint, options) {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
            'Content-Type': 'application/json',
            ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$site$2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getAuthHeaders"])(),
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
}),
"[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>RoteiroEditorPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$site$2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/site/src/lib/api.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
;
/* ─── Constants ─── */ const COUNTRIES = [
    "Brasil",
    "Argentina",
    "Chile",
    "Colômbia",
    "Peru",
    "México",
    "EUA",
    "Canadá",
    "Portugal",
    "Espanha",
    "França",
    "Itália",
    "Alemanha",
    "Inglaterra",
    "Grécia",
    "Turquia",
    "Japão",
    "Tailândia",
    "Indonésia",
    "Austrália",
    "Egito",
    "Marrocos",
    "África do Sul"
];
const STYLE_OPTIONS = [
    {
        key: "luxo",
        icon: "👑",
        label: "Luxo"
    },
    {
        key: "economico",
        icon: "💵",
        label: "Econômico"
    },
    {
        key: "mochilao",
        icon: "🎒",
        label: "Mochilão"
    },
    {
        key: "familia",
        icon: "👨‍👩‍👧‍👦",
        label: "Família"
    },
    {
        key: "romantico",
        icon: "💕",
        label: "Romântico"
    },
    {
        key: "aventura",
        icon: "🧗",
        label: "Aventura"
    },
    {
        key: "conforto",
        icon: "🛋️",
        label: "Conforto"
    }
];
const CATEGORY_OPTIONS = [
    {
        key: "cultura",
        icon: "🏛️",
        label: "Cultura"
    },
    {
        key: "gastronomia",
        icon: "🍽️",
        label: "Gastronomia"
    },
    {
        key: "natureza",
        icon: "🌿",
        label: "Natureza"
    },
    {
        key: "esportes",
        icon: "⚽",
        label: "Esportes"
    },
    {
        key: "relax",
        icon: "🧘",
        label: "Relax"
    },
    {
        key: "eurotrip",
        icon: "✈️",
        label: "Eurotrip"
    },
    {
        key: "praia",
        icon: "🏖️",
        label: "Praia"
    },
    {
        key: "montanha",
        icon: "⛰️",
        label: "Montanha"
    },
    {
        key: "urbano",
        icon: "🏙️",
        label: "Urbano"
    },
    {
        key: "historico",
        icon: "📜",
        label: "Histórico"
    }
];
const MODULE_OPTIONS = [
    {
        key: "itinerario",
        icon: "🗓️",
        label: "Itinerário por dia",
        desc: "Roteiro dia a dia completo"
    },
    {
        key: "mapa",
        icon: "🗺️",
        label: "Mapa integrado",
        desc: "Mapa com todos os pontos"
    },
    {
        key: "hospedagem",
        icon: "🏨",
        label: "Hospedagens",
        desc: "Hotéis e hospedagens sugeridas"
    },
    {
        key: "transporte",
        icon: "🚌",
        label: "Transporte",
        desc: "Dicas de locomoção"
    },
    {
        key: "gasto",
        icon: "💳",
        label: "Estimativa de gasto",
        desc: "Quanto você vai gastar"
    },
    {
        key: "restaurantes",
        icon: "🍴",
        label: "Restaurantes",
        desc: "Onde comer"
    },
    {
        key: "dicas",
        icon: "💡",
        label: "Dicas exclusivas",
        desc: "Dicas do criador"
    },
    {
        key: "checklist",
        icon: "✅",
        label: "Checklist interativo",
        desc: "O que levar e preparar"
    },
    {
        key: "voo",
        icon: "✈️",
        label: "Meu voo",
        desc: "Sugestões de voo"
    }
];
const CHECKLIST_CATS = [
    "documentos",
    "mala",
    "pre-viagem",
    "custom"
];
const SECTIONS = [
    {
        key: "identity",
        icon: "🎯",
        title: "Identidade e Indexação"
    },
    {
        key: "commerce",
        icon: "💰",
        title: "Estrutura Comercial"
    },
    {
        key: "modules",
        icon: "📦",
        title: "Módulos do Roteiro"
    },
    {
        key: "itinerary",
        icon: "🗓️",
        title: "Itinerário Estruturado"
    },
    {
        key: "spending",
        icon: "💳",
        title: "Estimativa de Gasto"
    },
    {
        key: "checklist",
        icon: "✅",
        title: "Checklist e FAQ"
    },
    {
        key: "postpurchase",
        icon: "⚙️",
        title: "Configuração Pós-compra"
    }
];
const DEFAULT_CREATOR_ID = "creator-diego-001";
const SPENDING_CATS = [
    "🏨 Hospedagem",
    "🍽️ Alimentação",
    "🚌 Transporte",
    "🎫 Atrações",
    "🎁 Extras"
];
function getDurationLabel(d) {
    if (d <= 3) return "Fim de semana";
    if (d <= 7) return "1 semana";
    if (d <= 15) return "15 dias";
    return "+20 dias";
}
function calcQuality(data) {
    let s = 0;
    const c = (v, p)=>{
        if (v && (typeof v !== "string" || v.trim())) s += p;
    };
    const a = (v, p)=>{
        if (v && v.length > 0) s += p;
    };
    c(data.title, 8);
    c(data.destination, 8);
    c(data.country, 5);
    c(data.description, 8);
    c(data.subtitle, 5);
    c(data.duration, 3);
    c(data.price, 10);
    a(data.travelStyles, 8);
    a(data.categories, 8);
    a(data.activeModules, 5);
    a(data.highlights, 5);
    a(data.inclusions, 5);
    a(data.days, 10);
    if (data.days && data.days.length >= 3) s += 5;
    if (data.spendingBreakdown && data.spendingBreakdown.length > 0) s += 5;
    c(data.productType, 2);
    c(data.promoPrice, 2);
    return Math.min(s, 100);
}
function RoteiroEditorPage({ params }) {
    const { id } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["use"])(params);
    const isNew = id === "new";
    const sectionRefs = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])({});
    const autoSaveRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    /* ─── UI state ─── */ const [openSections, setOpenSections] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(new Set([
        "identity"
    ]));
    const [activeSection, setActiveSection] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("identity");
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(!isNew);
    const [saving, setSaving] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [toast, setToast] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [dirty, setDirty] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    /* ─── Bloco 1: Identidade ─── */ const [title, setTitle] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [subtitle, setSubtitle] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [destination, setDestination] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [country, setCountry] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [duration, setDuration] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(1);
    const [description, setDescription] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [travelStyles, setTravelStyles] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [categories, setCategories] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [productType, setProductType] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("DIGITAL");
    /* ─── Bloco 2: Comercial ─── */ const [price, setPrice] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(0);
    const [currency, setCurrency] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("BRL");
    const [promoPrice, setPromoPrice] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [installments, setInstallments] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [immediateAccess, setImmediateAccess] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    const [lifetimeAccess, setLifetimeAccess] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    const [offlineDownload, setOfflineDownload] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    const [featured, setFeatured] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    /* ─── Bloco 3: Módulos ─── */ const [activeModules, setActiveModules] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    /* ─── Bloco 4: Itinerário ─── */ const [days, setDays] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [images, setImages] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([
        ""
    ]);
    const [highlightItems, setHighlightItems] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [newHighlight, setNewHighlight] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [inclusionItems, setInclusionItems] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [newInclusion, setNewInclusion] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    /* ─── Bloco 5: Gasto ─── */ const [spendingBreakdown, setSpendingBreakdown] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [spendingCurrency, setSpendingCurrency] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("BRL");
    /* ─── Bloco 6: Checklist + FAQ ─── */ const [checklistItems, setChecklistItems] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [faqItems, setFaqItems] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [newCheckItem, setNewCheckItem] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [newCheckCat, setNewCheckCat] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("documentos");
    /* ─── Bloco 7: Pós-compra ─── */ const [allowPdf, setAllowPdf] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [allowShare, setAllowShare] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    /* ─── Hospedagem & Transporte ─── */ const [accommodations, setAccommodations] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [transports, setTransports] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    /* ─── Quality score ─── */ const qualityScore = calcQuality({
        title,
        subtitle,
        destination,
        country,
        description,
        duration,
        price,
        travelStyles,
        categories,
        activeModules,
        highlightItems,
        inclusionItems: inclusionItems,
        days,
        spendingBreakdown,
        productType,
        promoPrice
    });
    /* ─── Toast auto-dismiss ─── */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!toast) return;
        const t = setTimeout(()=>setToast(null), 4000);
        return ()=>clearTimeout(t);
    }, [
        toast
    ]);
    /* ─── Mark dirty ─── */ const markDirty = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>setDirty(true), []);
    /* ─── Load data ─── */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (isNew) return;
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$site$2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getItineraryById"])(id).then((data)=>{
            setTitle(data.title || "");
            setSubtitle(data.subtitle || "");
            setDestination(data.destination || "");
            setCountry(data.country || "");
            setDuration(data.duration || 1);
            setDescription(data.description || "");
            setTravelStyles(data.travelStyles || []);
            setCategories(data.categories || []);
            setProductType(data.productType || "DIGITAL");
            setPrice(data.price || 0);
            setCurrency(data.currency || "BRL");
            setPromoPrice(data.promoPrice || null);
            setInstallments(data.installments || null);
            setImmediateAccess(data.immediateAccess ?? true);
            setLifetimeAccess(data.lifetimeAccess ?? true);
            setOfflineDownload(data.offlineDownload ?? true);
            setFeatured(data.featured || false);
            setActiveModules(data.activeModules || []);
            setHighlightItems(data.highlights || []);
            setInclusionItems(data.inclusions || []);
            setImages(Array.isArray(data.images) ? data.images.map((img)=>typeof img === "string" ? img : img.url) : [
                ""
            ]);
            setAllowPdf(data.allowPdf ?? false);
            setAllowShare(data.allowShare ?? true);
            // Spending
            const sp = data.estimatedSpending || {};
            setSpendingCurrency(sp.currency || "BRL");
            setSpendingBreakdown((sp.breakdown || []).map((b)=>({
                    category: b.category || "",
                    min: b.min || "",
                    max: b.max || ""
                })));
            // Days
            setDays((data.days || []).map((d)=>({
                    dayNumber: d.dayNumber,
                    title: d.title || "",
                    summary: d.summary || "",
                    description: d.description || "",
                    activities: (d.activities || []).map((a)=>({
                            title: a.title || "",
                            description: a.description || "",
                            time: a.time || "",
                            duration: a.duration || "",
                            location: a.location || "",
                            type: a.type || "activity",
                            icon: a.icon || "📍",
                            tips: a.tips || "",
                            latitude: a.latitude?.toString() || "",
                            longitude: a.longitude?.toString() || "",
                            category: a.category || ""
                        }))
                })));
            // Accommodations
            setAccommodations((data.accommodations || []).map((a)=>({
                    name: a.name || "",
                    neighborhood: a.neighborhood || "",
                    description: a.description || "",
                    priceRange: a.priceRange || "",
                    rating: a.rating?.toString() || "",
                    externalLink: a.externalLink || ""
                })));
            // Transports
            setTransports((data.transports || []).map((t)=>({
                    description: t.description || "",
                    passTypes: t.passTypes || "",
                    estimatedPrice: t.estimatedPrice || "",
                    notes: t.notes || ""
                })));
            // Checklists
            setChecklistItems((data.checklists || []).map((c)=>({
                    category: c.category || "documentos",
                    item: c.item || "",
                    isDefault: c.isDefault ?? true
                })));
            // FAQ
            setFaqItems((data.faqQuestions || []).map((f)=>({
                    question: f.question || "",
                    answer: f.answer || ""
                })));
        }).catch((err)=>setToast({
                msg: `Erro ao carregar: ${err.message}`,
                type: "error"
            })).finally(()=>setLoading(false));
    }, [
        id,
        isNew
    ]);
    /* ─── Build payload ─── */ const buildPayload = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        const spMin = spendingBreakdown.reduce((s, b)=>s + (parseFloat(b.min) || 0), 0);
        const spMax = spendingBreakdown.reduce((s, b)=>s + (parseFloat(b.max) || 0), 0);
        return {
            creatorId: DEFAULT_CREATOR_ID,
            title,
            subtitle,
            destination,
            country,
            description,
            price: price.toString(),
            currency,
            duration: duration.toString(),
            featured,
            travelStyles,
            categories,
            productType,
            activeModules,
            promoPrice: promoPrice?.toString() || undefined,
            installments: installments?.toString() || undefined,
            immediateAccess,
            lifetimeAccess,
            offlineDownload,
            allowPdf,
            allowShare,
            highlights: highlightItems,
            inclusions: inclusionItems,
            estimatedSpending: {
                min: spMin,
                max: spMax,
                currency: spendingCurrency,
                breakdown: spendingBreakdown
            },
            images: images.filter(Boolean),
            days: days.map((d, i)=>({
                    ...d,
                    dayNumber: i + 1,
                    activities: d.activities.map((a)=>({
                            ...a,
                            latitude: a.latitude ? parseFloat(a.latitude) : undefined,
                            longitude: a.longitude ? parseFloat(a.longitude) : undefined
                        }))
                })),
            accommodations,
            transports,
            checklists: checklistItems
        };
    }, [
        title,
        subtitle,
        destination,
        country,
        description,
        price,
        currency,
        duration,
        featured,
        travelStyles,
        categories,
        productType,
        activeModules,
        promoPrice,
        installments,
        immediateAccess,
        lifetimeAccess,
        offlineDownload,
        allowPdf,
        allowShare,
        highlightItems,
        inclusionItems,
        spendingBreakdown,
        spendingCurrency,
        images,
        days,
        accommodations,
        transports,
        checklistItems
    ]);
    /* ─── Save ─── */ const handleSave = async ()=>{
        // Validation
        if (!title || !destination || !country) {
            setToast({
                msg: "Preencha título, destino e país",
                type: "error"
            });
            return;
        }
        if (price <= 0) {
            setToast({
                msg: "Defina um preço válido",
                type: "error"
            });
            return;
        }
        if (categories.length < 1) {
            setToast({
                msg: "Selecione pelo menos 1 categoria",
                type: "error"
            });
            return;
        }
        if (days.length < 3) {
            setToast({
                msg: "Cadastre pelo menos 3 dias",
                type: "error"
            });
            return;
        }
        if (activeModules.length < 1) {
            setToast({
                msg: "Ative pelo menos 1 módulo",
                type: "error"
            });
            return;
        }
        setSaving(true);
        try {
            const payload = buildPayload();
            if (isNew) {
                const created = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$site$2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createItinerary"])(payload);
                setToast({
                    msg: "Roteiro criado com sucesso!",
                    type: "success"
                });
                window.location.href = `/criador/roteiro/${created.id}`;
            } else {
                await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$site$2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["updateItinerary"])(id, payload);
                setToast({
                    msg: "Alterações salvas!",
                    type: "success"
                });
                setDirty(false);
            }
        } catch (err) {
            setToast({
                msg: err.message,
                type: "error"
            });
        } finally{
            setSaving(false);
        }
    };
    /* ─── Auto-save ─── */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (isNew) return;
        autoSaveRef.current = setInterval(()=>{
            if (dirty) {
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$site$2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["updateItinerary"])(id, buildPayload()).then(()=>setDirty(false)).catch(()=>{});
            }
        }, 30000);
        return ()=>{
            if (autoSaveRef.current) clearInterval(autoSaveRef.current);
        };
    }, [
        id,
        isNew,
        dirty,
        buildPayload
    ]);
    /* ─── Section helpers ─── */ const toggleSection = (key)=>{
        setOpenSections((p)=>{
            const n = new Set(p);
            if (n.has(key)) n.delete(key);
            else n.add(key);
            return n;
        });
    };
    const isSectionComplete = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((key)=>{
        switch(key){
            case "identity":
                return !!(title && destination && country && categories.length >= 1);
            case "commerce":
                return price > 0;
            case "modules":
                return activeModules.length >= 1;
            case "itinerary":
                return days.length >= 3;
            case "spending":
                return spendingBreakdown.length > 0;
            case "checklist":
                return checklistItems.length > 0 || faqItems.length > 0;
            case "postpurchase":
                return true;
            default:
                return false;
        }
    }, [
        title,
        destination,
        country,
        categories,
        price,
        activeModules,
        days,
        spendingBreakdown,
        checklistItems,
        faqItems
    ]);
    /* ─── Chip toggle ─── */ const toggleChip = (arr, set, key, max)=>{
        markDirty();
        if (arr.includes(key)) set(arr.filter((k)=>k !== key));
        else if (arr.length < max) set([
            ...arr,
            key
        ]);
    };
    /* ─── Data helpers ─── */ const addDay = ()=>{
        markDirty();
        setDays([
            ...days,
            {
                dayNumber: days.length + 1,
                title: `Dia ${days.length + 1}`,
                summary: "",
                description: "",
                activities: []
            }
        ]);
    };
    const removeDay = (i)=>{
        markDirty();
        setDays(days.filter((_, idx)=>idx !== i));
    };
    const updateDay = (i, f, v)=>{
        markDirty();
        const u = [
            ...days
        ];
        u[i] = {
            ...u[i],
            [f]: v
        };
        setDays(u);
    };
    const addActivity = (di)=>{
        markDirty();
        const u = [
            ...days
        ];
        u[di].activities = [
            ...u[di].activities,
            {
                title: "",
                description: "",
                time: "",
                duration: "",
                location: "",
                type: "activity",
                icon: "📍",
                tips: "",
                latitude: "",
                longitude: "",
                category: ""
            }
        ];
        setDays(u);
    };
    const updateActivity = (di, ai, f, v)=>{
        markDirty();
        const u = [
            ...days
        ];
        u[di].activities[ai] = {
            ...u[di].activities[ai],
            [f]: v
        };
        setDays(u);
    };
    const removeActivity = (di, ai)=>{
        markDirty();
        const u = [
            ...days
        ];
        u[di].activities.splice(ai, 1);
        setDays([
            ...u
        ]);
    };
    const addAccommodation = ()=>{
        markDirty();
        setAccommodations([
            ...accommodations,
            {
                name: "",
                neighborhood: "",
                description: "",
                priceRange: "",
                rating: "",
                externalLink: ""
            }
        ]);
    };
    const addTransport = ()=>{
        markDirty();
        setTransports([
            ...transports,
            {
                description: "",
                passTypes: "",
                estimatedPrice: "",
                notes: ""
            }
        ]);
    };
    /* ─── Loading ─── */ if (loading) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "editor-skeleton",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "editor-skeleton-bar short"
            }, void 0, false, {
                fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                lineNumber: 302,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "editor-skeleton-bar medium"
            }, void 0, false, {
                fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                lineNumber: 302,
                columnNumber: 58
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "editor-skeleton-section"
            }, void 0, false, {
                fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                lineNumber: 303,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "editor-skeleton-section"
            }, void 0, false, {
                fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                lineNumber: 303,
                columnNumber: 56
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
        lineNumber: 301,
        columnNumber: 9
    }, this);
    /* ─── Render section content ─── */ const renderSection = (key)=>{
        switch(key){
            /* ═══ BLOCO 1: IDENTIDADE ═══ */ case "identity":
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "form-group",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    className: "form-label",
                                    children: "Título do Roteiro *"
                                }, void 0, false, {
                                    fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                    lineNumber: 313,
                                    columnNumber: 21
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    className: "form-input",
                                    value: title,
                                    onChange: (e)=>{
                                        setTitle(e.target.value);
                                        markDirty();
                                    },
                                    placeholder: 'ex: "Tóquio Autêntica – 15 dias de Cultura"'
                                }, void 0, false, {
                                    fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                    lineNumber: 314,
                                    columnNumber: 21
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                            lineNumber: 312,
                            columnNumber: 17
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "form-group",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    className: "form-label",
                                    children: "Subtítulo / Descrição curta *"
                                }, void 0, false, {
                                    fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                    lineNumber: 317,
                                    columnNumber: 21
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    className: "form-input",
                                    value: subtitle,
                                    onChange: (e)=>{
                                        setSubtitle(e.target.value.slice(0, 160));
                                        markDirty();
                                    },
                                    placeholder: "Até 160 caracteres",
                                    maxLength: 160
                                }, void 0, false, {
                                    fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                    lineNumber: 318,
                                    columnNumber: 21
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "form-helper",
                                    children: [
                                        subtitle.length,
                                        "/160 caracteres"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                    lineNumber: 319,
                                    columnNumber: 21
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                            lineNumber: 316,
                            columnNumber: 17
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "form-row",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "form-group",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: "form-label",
                                            children: "País *"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                            lineNumber: 323,
                                            columnNumber: 25
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                            className: "form-input",
                                            value: country,
                                            onChange: (e)=>{
                                                setCountry(e.target.value);
                                                markDirty();
                                            },
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: "",
                                                    children: "Selecione o país"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                                    lineNumber: 325,
                                                    columnNumber: 29
                                                }, this),
                                                COUNTRIES.map((c)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                        value: c,
                                                        children: c
                                                    }, c, false, {
                                                        fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                                        lineNumber: 326,
                                                        columnNumber: 49
                                                    }, this))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                            lineNumber: 324,
                                            columnNumber: 25
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                    lineNumber: 322,
                                    columnNumber: 21
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "form-group",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: "form-label",
                                            children: "Cidade Principal *"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                            lineNumber: 330,
                                            columnNumber: 25
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            className: "form-input",
                                            value: destination,
                                            onChange: (e)=>{
                                                setDestination(e.target.value);
                                                markDirty();
                                            },
                                            placeholder: "ex: Tóquio"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                            lineNumber: 331,
                                            columnNumber: 25
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                    lineNumber: 329,
                                    columnNumber: 21
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                            lineNumber: 321,
                            columnNumber: 17
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "form-row",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "form-group",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: "form-label",
                                            children: "Duração (dias) *"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                            lineNumber: 336,
                                            columnNumber: 25
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            className: "form-input",
                                            type: "number",
                                            value: duration,
                                            onChange: (e)=>{
                                                setDuration(parseInt(e.target.value) || 1);
                                                markDirty();
                                            },
                                            min: 1
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                            lineNumber: 337,
                                            columnNumber: 25
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                    lineNumber: 335,
                                    columnNumber: 21
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "form-group",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: "form-label",
                                            children: "Classificação"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                            lineNumber: 340,
                                            columnNumber: 25
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "editor-duration-badge",
                                            children: getDurationLabel(duration)
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                            lineNumber: 341,
                                            columnNumber: 25
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                    lineNumber: 339,
                                    columnNumber: 21
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                            lineNumber: 334,
                            columnNumber: 17
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "form-group",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    className: "form-label",
                                    children: "Descrição completa"
                                }, void 0, false, {
                                    fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                    lineNumber: 345,
                                    columnNumber: 21
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                    className: "form-input",
                                    style: {
                                        minHeight: 120
                                    },
                                    value: description,
                                    onChange: (e)=>{
                                        setDescription(e.target.value);
                                        markDirty();
                                    },
                                    placeholder: "Descreva o que o viajante vai encontrar..."
                                }, void 0, false, {
                                    fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                    lineNumber: 346,
                                    columnNumber: 21
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "form-helper",
                                    children: [
                                        description.length,
                                        " caracteres"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                    lineNumber: 347,
                                    columnNumber: 21
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                            lineNumber: 344,
                            columnNumber: 17
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "form-group",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    className: "form-label",
                                    children: [
                                        "Estilo de Experiência (máx 3) — ",
                                        travelStyles.length,
                                        "/3"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                    lineNumber: 350,
                                    columnNumber: 21
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "editor-chip-grid",
                                    children: STYLE_OPTIONS.map((s)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            className: `editor-chip ${travelStyles.includes(s.key) ? "active" : ""}`,
                                            onClick: ()=>toggleChip(travelStyles, setTravelStyles, s.key, 3),
                                            children: [
                                                s.icon,
                                                " ",
                                                s.label
                                            ]
                                        }, s.key, true, {
                                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                            lineNumber: 352,
                                            columnNumber: 25
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                    lineNumber: 351,
                                    columnNumber: 21
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                            lineNumber: 349,
                            columnNumber: 17
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "form-group",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    className: "form-label",
                                    children: [
                                        "Categorias Temáticas (mín 1, máx 5) — ",
                                        categories.length,
                                        "/5"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                    lineNumber: 358,
                                    columnNumber: 21
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "editor-chip-grid",
                                    children: CATEGORY_OPTIONS.map((c)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            className: `editor-chip ${categories.includes(c.key) ? "active" : ""}`,
                                            onClick: ()=>toggleChip(categories, setCategories, c.key, 5),
                                            children: [
                                                c.icon,
                                                " ",
                                                c.label
                                            ]
                                        }, c.key, true, {
                                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                            lineNumber: 360,
                                            columnNumber: 25
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                    lineNumber: 359,
                                    columnNumber: 21
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                            lineNumber: 357,
                            columnNumber: 17
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "form-group",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    className: "form-label",
                                    children: "Tipo de Produto"
                                }, void 0, false, {
                                    fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                    lineNumber: 366,
                                    columnNumber: 21
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                    className: "form-input",
                                    value: productType,
                                    onChange: (e)=>{
                                        setProductType(e.target.value);
                                        markDirty();
                                    },
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                            value: "DIGITAL",
                                            children: "📱 Digital"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                            lineNumber: 368,
                                            columnNumber: 25
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                            value: "PRESENCIAL",
                                            children: "🤝 Presencial"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                            lineNumber: 369,
                                            columnNumber: 25
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                            value: "HIBRIDO",
                                            children: "🔄 Híbrido"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                            lineNumber: 370,
                                            columnNumber: 25
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                    lineNumber: 367,
                                    columnNumber: 21
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                            lineNumber: 365,
                            columnNumber: 17
                        }, this)
                    ]
                }, void 0, true);
            /* ═══ BLOCO 2: COMERCIAL ═══ */ case "commerce":
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "form-row",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "form-group",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: "form-label",
                                            children: "Preço *"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                            lineNumber: 379,
                                            columnNumber: 25
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            className: "form-input",
                                            type: "number",
                                            value: price || "",
                                            onChange: (e)=>{
                                                setPrice(parseFloat(e.target.value) || 0);
                                                markDirty();
                                            },
                                            step: 0.01,
                                            min: 0
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                            lineNumber: 380,
                                            columnNumber: 25
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                    lineNumber: 378,
                                    columnNumber: 21
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "form-group",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: "form-label",
                                            children: "Promoção"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                            lineNumber: 383,
                                            columnNumber: 25
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            className: "form-input",
                                            type: "number",
                                            value: promoPrice ?? "",
                                            onChange: (e)=>{
                                                setPromoPrice(e.target.value ? parseFloat(e.target.value) : null);
                                                markDirty();
                                            },
                                            placeholder: "Preço promocional"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                            lineNumber: 384,
                                            columnNumber: 25
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                    lineNumber: 382,
                                    columnNumber: 21
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "form-group",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: "form-label",
                                            children: "Moeda"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                            lineNumber: 387,
                                            columnNumber: 25
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                            className: "form-input",
                                            value: currency,
                                            onChange: (e)=>{
                                                setCurrency(e.target.value);
                                                markDirty();
                                            },
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: "BRL",
                                                    children: "BRL (R$)"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                                    lineNumber: 389,
                                                    columnNumber: 29
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: "USD",
                                                    children: "USD ($)"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                                    lineNumber: 389,
                                                    columnNumber: 66
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: "EUR",
                                                    children: "EUR (€)"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                                    lineNumber: 389,
                                                    columnNumber: 102
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                            lineNumber: 388,
                                            columnNumber: 25
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                    lineNumber: 386,
                                    columnNumber: 21
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                            lineNumber: 377,
                            columnNumber: 17
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "form-group",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    className: "form-label",
                                    children: "Parcelamento (parcelas)"
                                }, void 0, false, {
                                    fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                    lineNumber: 394,
                                    columnNumber: 21
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    className: "form-input",
                                    type: "number",
                                    value: installments ?? "",
                                    onChange: (e)=>{
                                        setInstallments(e.target.value ? parseInt(e.target.value) : null);
                                        markDirty();
                                    },
                                    placeholder: "ex: 12",
                                    min: 1,
                                    max: 24
                                }, void 0, false, {
                                    fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                    lineNumber: 395,
                                    columnNumber: 21
                                }, this),
                                installments && price > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "form-helper",
                                    children: [
                                        "Até ",
                                        installments,
                                        "x de R$ ",
                                        (price / installments).toFixed(2)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                    lineNumber: 396,
                                    columnNumber: 51
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                            lineNumber: 393,
                            columnNumber: 17
                        }, this),
                        [
                            {
                                label: "⚡ Acesso imediato",
                                desc: "Liberado logo após o pagamento",
                                val: immediateAccess,
                                set: setImmediateAccess
                            },
                            {
                                label: "♾️ Acesso vitalício",
                                desc: "Sem prazo de expiração",
                                val: lifetimeAccess,
                                set: setLifetimeAccess
                            },
                            {
                                label: "📥 Download offline",
                                desc: "Pode baixar para acessar sem internet",
                                val: offlineDownload,
                                set: setOfflineDownload
                            },
                            {
                                label: "⭐ Em destaque",
                                desc: "Aparece na seção principal",
                                val: featured,
                                set: setFeatured
                            }
                        ].map((t)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "editor-toggle-row",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "editor-toggle-info",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "editor-toggle-label",
                                                children: t.label
                                            }, void 0, false, {
                                                fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                                lineNumber: 405,
                                                columnNumber: 61
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "editor-toggle-desc",
                                                children: t.desc
                                            }, void 0, false, {
                                                fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                                lineNumber: 405,
                                                columnNumber: 115
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                        lineNumber: 405,
                                        columnNumber: 25
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "editor-toggle",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                type: "checkbox",
                                                checked: t.val,
                                                onChange: (e)=>{
                                                    t.set(e.target.checked);
                                                    markDirty();
                                                }
                                            }, void 0, false, {
                                                fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                                lineNumber: 406,
                                                columnNumber: 58
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "editor-toggle-track"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                                lineNumber: 406,
                                                columnNumber: 157
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "editor-toggle-thumb"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                                lineNumber: 406,
                                                columnNumber: 197
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                        lineNumber: 406,
                                        columnNumber: 25
                                    }, this)
                                ]
                            }, t.label, true, {
                                fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                lineNumber: 404,
                                columnNumber: 21
                            }, this)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "editor-legal-notice",
                            children: '⚠️ Aviso automático: "Produto digital. Não inclui serviços turísticos."'
                        }, void 0, false, {
                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                            lineNumber: 409,
                            columnNumber: 17
                        }, this)
                    ]
                }, void 0, true);
            /* ═══ BLOCO 3: MÓDULOS ═══ */ case "modules":
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "form-helper",
                            children: "Ative os módulos que serão incluídos no roteiro. Cada módulo ativo aparece como chip na vitrine."
                        }, void 0, false, {
                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                            lineNumber: 414,
                            columnNumber: 17
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "editor-module-grid",
                            children: MODULE_OPTIONS.map((m)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: `editor-module-card ${activeModules.includes(m.key) ? "active" : ""}`,
                                    onClick: ()=>toggleChip(activeModules, setActiveModules, m.key, 9),
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "editor-module-icon",
                                            children: m.icon
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                            lineNumber: 417,
                                            columnNumber: 25
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "editor-module-info",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "editor-module-label",
                                                    children: m.label
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                                    lineNumber: 418,
                                                    columnNumber: 61
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "editor-module-desc",
                                                    children: m.desc
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                                    lineNumber: 418,
                                                    columnNumber: 115
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                            lineNumber: 418,
                                            columnNumber: 25
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: "editor-toggle",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "checkbox",
                                                    checked: activeModules.includes(m.key),
                                                    onChange: ()=>toggleChip(activeModules, setActiveModules, m.key, 9)
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                                    lineNumber: 419,
                                                    columnNumber: 58
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "editor-toggle-track"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                                    lineNumber: 419,
                                                    columnNumber: 194
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "editor-toggle-thumb"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                                    lineNumber: 419,
                                                    columnNumber: 234
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                            lineNumber: 419,
                                            columnNumber: 25
                                        }, this)
                                    ]
                                }, m.key, true, {
                                    fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                    lineNumber: 416,
                                    columnNumber: 21
                                }, this))
                        }, void 0, false, {
                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                            lineNumber: 415,
                            columnNumber: 17
                        }, this)
                    ]
                }, void 0, true);
            /* ═══ BLOCO 4: ITINERÁRIO ═══ */ case "itinerary":
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                    children: [
                        days.map((day, di)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "editor-day-card",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "editor-day-header",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "editor-day-number",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "editor-day-badge",
                                                        children: di + 1
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                                        lineNumber: 430,
                                                        columnNumber: 33
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                        className: "editor-day-title-input",
                                                        value: day.title,
                                                        onChange: (e)=>updateDay(di, "title", e.target.value),
                                                        placeholder: `Título do Dia ${di + 1}`
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                                        lineNumber: 431,
                                                        columnNumber: 33
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                                lineNumber: 429,
                                                columnNumber: 29
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                className: "btn-remove",
                                                onClick: ()=>removeDay(di),
                                                children: "🗑️"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                                lineNumber: 433,
                                                columnNumber: 29
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                        lineNumber: 428,
                                        columnNumber: 25
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "editor-day-body",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "form-group",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                                    className: "form-input",
                                                    style: {
                                                        minHeight: 60
                                                    },
                                                    value: day.description,
                                                    onChange: (e)=>updateDay(di, "description", e.target.value),
                                                    placeholder: "O que esperar nesse dia..."
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                                    lineNumber: 437,
                                                    columnNumber: 33
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                                lineNumber: 436,
                                                columnNumber: 29
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "editor-activities",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "editor-activities-label",
                                                        children: [
                                                            "Atividades (",
                                                            day.activities.length,
                                                            ")"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                                        lineNumber: 440,
                                                        columnNumber: 33
                                                    }, this),
                                                    day.activities.map((act, ai)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "editor-activity-card",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "editor-activity-row",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                            className: "editor-act-time",
                                                                            value: act.time,
                                                                            onChange: (e)=>updateActivity(di, ai, "time", e.target.value),
                                                                            placeholder: "09:00"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                                                            lineNumber: 444,
                                                                            columnNumber: 45
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                            className: "editor-act-title",
                                                                            value: act.title,
                                                                            onChange: (e)=>updateActivity(di, ai, "title", e.target.value),
                                                                            placeholder: "O que fazer"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                                                            lineNumber: 445,
                                                                            columnNumber: 45
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                            className: "editor-act-dur",
                                                                            value: act.duration,
                                                                            onChange: (e)=>updateActivity(di, ai, "duration", e.target.value),
                                                                            placeholder: "2h"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                                                            lineNumber: 446,
                                                                            columnNumber: 45
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                                                    lineNumber: 443,
                                                                    columnNumber: 41
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "editor-activity-row",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                            value: act.location,
                                                                            onChange: (e)=>updateActivity(di, ai, "location", e.target.value),
                                                                            placeholder: "📍 Local"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                                                            lineNumber: 449,
                                                                            columnNumber: 45
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                            value: act.latitude,
                                                                            onChange: (e)=>updateActivity(di, ai, "latitude", e.target.value),
                                                                            placeholder: "Lat",
                                                                            style: {
                                                                                width: 80
                                                                            }
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                                                            lineNumber: 450,
                                                                            columnNumber: 45
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                            value: act.longitude,
                                                                            onChange: (e)=>updateActivity(di, ai, "longitude", e.target.value),
                                                                            placeholder: "Lng",
                                                                            style: {
                                                                                width: 80
                                                                            }
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                                                            lineNumber: 451,
                                                                            columnNumber: 45
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                                                            value: act.category,
                                                                            onChange: (e)=>updateActivity(di, ai, "category", e.target.value),
                                                                            style: {
                                                                                width: 120
                                                                            },
                                                                            children: [
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                                    value: "",
                                                                                    children: "Tipo"
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                                                                    lineNumber: 453,
                                                                                    columnNumber: 49
                                                                                }, this),
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                                    value: "atração",
                                                                                    children: "🎫 Atração"
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                                                                    lineNumber: 453,
                                                                                    columnNumber: 79
                                                                                }, this),
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                                    value: "restaurante",
                                                                                    children: "🍴 Restaurante"
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                                                                    lineNumber: 453,
                                                                                    columnNumber: 122
                                                                                }, this),
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                                    value: "hotel",
                                                                                    children: "🏨 Hotel"
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                                                                    lineNumber: 453,
                                                                                    columnNumber: 173
                                                                                }, this)
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                                                            lineNumber: 452,
                                                                            columnNumber: 45
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                            className: "btn-remove",
                                                                            onClick: ()=>removeActivity(di, ai),
                                                                            children: "✕"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                                                            lineNumber: 455,
                                                                            columnNumber: 45
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                                                    lineNumber: 448,
                                                                    columnNumber: 41
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "editor-activity-row",
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                                                        value: act.tips,
                                                                        onChange: (e)=>updateActivity(di, ai, "tips", e.target.value),
                                                                        placeholder: "💡 Dica opcional...",
                                                                        style: {
                                                                            minHeight: 40
                                                                        }
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                                                        lineNumber: 458,
                                                                        columnNumber: 45
                                                                    }, this)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                                                    lineNumber: 457,
                                                                    columnNumber: 41
                                                                }, this)
                                                            ]
                                                        }, ai, true, {
                                                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                                            lineNumber: 442,
                                                            columnNumber: 37
                                                        }, this)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        className: "btn-add-item",
                                                        onClick: ()=>addActivity(di),
                                                        children: "+ Atividade"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                                        lineNumber: 462,
                                                        columnNumber: 33
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                                lineNumber: 439,
                                                columnNumber: 29
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                        lineNumber: 435,
                                        columnNumber: 25
                                    }, this)
                                ]
                            }, di, true, {
                                fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                lineNumber: 427,
                                columnNumber: 21
                            }, this)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            className: "btn-add-item full-width",
                            onClick: addDay,
                            children: "+ Adicionar Dia"
                        }, void 0, false, {
                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                            lineNumber: 467,
                            columnNumber: 17
                        }, this),
                        days.length < 3 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "editor-validation-alert",
                            children: [
                                "⚠️ Mínimo de 3 dias necessários para publicar (",
                                days.length,
                                "/3)"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                            lineNumber: 468,
                            columnNumber: 37
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "editor-subsection",
                            style: {
                                marginTop: 24
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                    style: {
                                        margin: "0 0 8px",
                                        fontSize: 14,
                                        color: "var(--text-secondary)"
                                    },
                                    children: "⭐ Destaques do roteiro"
                                }, void 0, false, {
                                    fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                    lineNumber: 472,
                                    columnNumber: 21
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "editor-tag-list",
                                    children: highlightItems.map((h, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "editor-tag",
                                            children: [
                                                h,
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    onClick: ()=>{
                                                        setHighlightItems(highlightItems.filter((_, idx)=>idx !== i));
                                                        markDirty();
                                                    },
                                                    children: "×"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                                    lineNumber: 477,
                                                    columnNumber: 33
                                                }, this)
                                            ]
                                        }, i, true, {
                                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                            lineNumber: 475,
                                            columnNumber: 29
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                    lineNumber: 473,
                                    columnNumber: 21
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "editor-tag-input-row",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            className: "form-input",
                                            value: newHighlight,
                                            onChange: (e)=>setNewHighlight(e.target.value),
                                            onKeyDown: (e)=>{
                                                if (e.key === "Enter" && newHighlight.trim()) {
                                                    setHighlightItems([
                                                        ...highlightItems,
                                                        newHighlight.trim()
                                                    ]);
                                                    setNewHighlight("");
                                                    markDirty();
                                                }
                                            },
                                            placeholder: "Ex: Sub à Torre Eiffel, Cruzeiro Sena..."
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                            lineNumber: 482,
                                            columnNumber: 25
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            className: "btn-add-item",
                                            onClick: ()=>{
                                                if (newHighlight.trim()) {
                                                    setHighlightItems([
                                                        ...highlightItems,
                                                        newHighlight.trim()
                                                    ]);
                                                    setNewHighlight("");
                                                    markDirty();
                                                }
                                            },
                                            children: "+"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                            lineNumber: 483,
                                            columnNumber: 25
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                    lineNumber: 481,
                                    columnNumber: 21
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                            lineNumber: 471,
                            columnNumber: 17
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "editor-subsection",
                            style: {
                                marginTop: 16
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                    style: {
                                        margin: "0 0 8px",
                                        fontSize: 14,
                                        color: "var(--text-secondary)"
                                    },
                                    children: "✅ O que está incluso"
                                }, void 0, false, {
                                    fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                    lineNumber: 489,
                                    columnNumber: 21
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "editor-tag-list",
                                    children: inclusionItems.map((inc, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "editor-tag editor-tag-green",
                                            children: [
                                                inc,
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    onClick: ()=>{
                                                        setInclusionItems(inclusionItems.filter((_, idx)=>idx !== i));
                                                        markDirty();
                                                    },
                                                    children: "×"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                                    lineNumber: 494,
                                                    columnNumber: 33
                                                }, this)
                                            ]
                                        }, i, true, {
                                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                            lineNumber: 492,
                                            columnNumber: 29
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                    lineNumber: 490,
                                    columnNumber: 21
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "editor-tag-input-row",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            className: "form-input",
                                            value: newInclusion,
                                            onChange: (e)=>setNewInclusion(e.target.value),
                                            onKeyDown: (e)=>{
                                                if (e.key === "Enter" && newInclusion.trim()) {
                                                    setInclusionItems([
                                                        ...inclusionItems,
                                                        newInclusion.trim()
                                                    ]);
                                                    setNewInclusion("");
                                                    markDirty();
                                                }
                                            },
                                            placeholder: "Ex: Roteiro dia a dia (10 dias), Mapa interativo..."
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                            lineNumber: 499,
                                            columnNumber: 25
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            className: "btn-add-item",
                                            onClick: ()=>{
                                                if (newInclusion.trim()) {
                                                    setInclusionItems([
                                                        ...inclusionItems,
                                                        newInclusion.trim()
                                                    ]);
                                                    setNewInclusion("");
                                                    markDirty();
                                                }
                                            },
                                            children: "+"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                            lineNumber: 500,
                                            columnNumber: 25
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                    lineNumber: 498,
                                    columnNumber: 21
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                            lineNumber: 488,
                            columnNumber: 17
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "editor-subsection",
                            style: {
                                marginTop: 16
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                    style: {
                                        margin: "0 0 8px",
                                        fontSize: 14,
                                        color: "var(--text-secondary)"
                                    },
                                    children: "🖼️ URLs das Imagens"
                                }, void 0, false, {
                                    fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                    lineNumber: 506,
                                    columnNumber: 21
                                }, this),
                                images.map((url, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "editor-tag-input-row",
                                        style: {
                                            marginBottom: 6
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                className: "form-input",
                                                value: url,
                                                onChange: (e)=>{
                                                    const u = [
                                                        ...images
                                                    ];
                                                    u[i] = e.target.value;
                                                    setImages(u);
                                                    markDirty();
                                                },
                                                placeholder: "https://..."
                                            }, void 0, false, {
                                                fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                                lineNumber: 509,
                                                columnNumber: 29
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                className: "btn-remove",
                                                onClick: ()=>{
                                                    setImages(images.filter((_, idx)=>idx !== i));
                                                    markDirty();
                                                },
                                                children: "✕"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                                lineNumber: 510,
                                                columnNumber: 29
                                            }, this)
                                        ]
                                    }, i, true, {
                                        fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                        lineNumber: 508,
                                        columnNumber: 25
                                    }, this)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    className: "btn-add-item",
                                    onClick: ()=>setImages([
                                            ...images,
                                            ""
                                        ]),
                                    children: "+ Imagem"
                                }, void 0, false, {
                                    fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                    lineNumber: 513,
                                    columnNumber: 21
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                            lineNumber: 505,
                            columnNumber: 17
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "editor-subsection",
                            style: {
                                marginTop: 24
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                    style: {
                                        margin: "0 0 8px",
                                        fontSize: 14,
                                        color: "var(--text-secondary)"
                                    },
                                    children: "🏨 Hospedagens Sugeridas"
                                }, void 0, false, {
                                    fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                    lineNumber: 518,
                                    columnNumber: 21
                                }, this),
                                accommodations.map((acc, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "editor-activity-card",
                                        style: {
                                            marginBottom: 10
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "editor-activity-row",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                        className: "form-input",
                                                        value: acc.name,
                                                        onChange: (e)=>{
                                                            const u = [
                                                                ...accommodations
                                                            ];
                                                            u[i].name = e.target.value;
                                                            setAccommodations(u);
                                                            markDirty();
                                                        },
                                                        placeholder: "Nome do hotel / hostel",
                                                        style: {
                                                            flex: 2
                                                        }
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                                        lineNumber: 522,
                                                        columnNumber: 33
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                        className: "form-input",
                                                        value: acc.rating,
                                                        onChange: (e)=>{
                                                            const u = [
                                                                ...accommodations
                                                            ];
                                                            u[i].rating = e.target.value;
                                                            setAccommodations(u);
                                                            markDirty();
                                                        },
                                                        placeholder: "Nota (ex: 8.5)",
                                                        style: {
                                                            width: 90
                                                        }
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                                        lineNumber: 523,
                                                        columnNumber: 33
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        className: "btn-remove",
                                                        onClick: ()=>{
                                                            setAccommodations(accommodations.filter((_, idx)=>idx !== i));
                                                            markDirty();
                                                        },
                                                        children: "✕"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                                        lineNumber: 524,
                                                        columnNumber: 33
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                                lineNumber: 521,
                                                columnNumber: 29
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "editor-activity-row",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                        className: "form-input",
                                                        value: acc.neighborhood,
                                                        onChange: (e)=>{
                                                            const u = [
                                                                ...accommodations
                                                            ];
                                                            u[i].neighborhood = e.target.value;
                                                            setAccommodations(u);
                                                            markDirty();
                                                        },
                                                        placeholder: "Bairro / Localização"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                                        lineNumber: 527,
                                                        columnNumber: 33
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                        className: "form-input",
                                                        value: acc.priceRange,
                                                        onChange: (e)=>{
                                                            const u = [
                                                                ...accommodations
                                                            ];
                                                            u[i].priceRange = e.target.value;
                                                            setAccommodations(u);
                                                            markDirty();
                                                        },
                                                        placeholder: "Faixa de preço (ex: R$ 150-250/noite)"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                                        lineNumber: 528,
                                                        columnNumber: 33
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                                lineNumber: 526,
                                                columnNumber: 29
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "editor-activity-row",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                                    className: "form-input",
                                                    value: acc.description,
                                                    onChange: (e)=>{
                                                        const u = [
                                                            ...accommodations
                                                        ];
                                                        u[i].description = e.target.value;
                                                        setAccommodations(u);
                                                        markDirty();
                                                    },
                                                    placeholder: "Descrição curta e dicas",
                                                    style: {
                                                        minHeight: 50
                                                    },
                                                    rows: 2
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                                    lineNumber: 531,
                                                    columnNumber: 33
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                                lineNumber: 530,
                                                columnNumber: 29
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "editor-activity-row",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    className: "form-input",
                                                    value: acc.externalLink,
                                                    onChange: (e)=>{
                                                        const u = [
                                                            ...accommodations
                                                        ];
                                                        u[i].externalLink = e.target.value;
                                                        setAccommodations(u);
                                                        markDirty();
                                                    },
                                                    placeholder: "Link externo (Booking, Hostelworld...)"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                                    lineNumber: 534,
                                                    columnNumber: 33
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                                lineNumber: 533,
                                                columnNumber: 29
                                            }, this)
                                        ]
                                    }, i, true, {
                                        fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                        lineNumber: 520,
                                        columnNumber: 25
                                    }, this)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    className: "btn-add-item",
                                    onClick: addAccommodation,
                                    children: "+ Hospedagem"
                                }, void 0, false, {
                                    fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                    lineNumber: 538,
                                    columnNumber: 21
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                            lineNumber: 517,
                            columnNumber: 17
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "editor-subsection",
                            style: {
                                marginTop: 24
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                    style: {
                                        margin: "0 0 8px",
                                        fontSize: 14,
                                        color: "var(--text-secondary)"
                                    },
                                    children: "🚌 Opções de Transporte"
                                }, void 0, false, {
                                    fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                    lineNumber: 543,
                                    columnNumber: 21
                                }, this),
                                transports.map((t, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "editor-activity-card",
                                        style: {
                                            marginBottom: 10
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "editor-activity-row",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                        className: "form-input",
                                                        value: t.description,
                                                        onChange: (e)=>{
                                                            const u = [
                                                                ...transports
                                                            ];
                                                            u[i].description = e.target.value;
                                                            setTransports(u);
                                                            markDirty();
                                                        },
                                                        placeholder: "Ex: Passe de metrô semanal Paris",
                                                        style: {
                                                            flex: 2
                                                        }
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                                        lineNumber: 547,
                                                        columnNumber: 33
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        className: "btn-remove",
                                                        onClick: ()=>{
                                                            setTransports(transports.filter((_, idx)=>idx !== i));
                                                            markDirty();
                                                        },
                                                        children: "✕"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                                        lineNumber: 548,
                                                        columnNumber: 33
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                                lineNumber: 546,
                                                columnNumber: 29
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "editor-activity-row",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                        className: "form-input",
                                                        value: t.passTypes,
                                                        onChange: (e)=>{
                                                            const u = [
                                                                ...transports
                                                            ];
                                                            u[i].passTypes = e.target.value;
                                                            setTransports(u);
                                                            markDirty();
                                                        },
                                                        placeholder: "Tipo de passe / bilhete"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                                        lineNumber: 551,
                                                        columnNumber: 33
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                        className: "form-input",
                                                        value: t.estimatedPrice,
                                                        onChange: (e)=>{
                                                            const u = [
                                                                ...transports
                                                            ];
                                                            u[i].estimatedPrice = e.target.value;
                                                            setTransports(u);
                                                            markDirty();
                                                        },
                                                        placeholder: "Preço estimado (ex: R$ 170/semana)"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                                        lineNumber: 552,
                                                        columnNumber: 33
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                                lineNumber: 550,
                                                columnNumber: 29
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "editor-activity-row",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                                    className: "form-input",
                                                    value: t.notes,
                                                    onChange: (e)=>{
                                                        const u = [
                                                            ...transports
                                                        ];
                                                        u[i].notes = e.target.value;
                                                        setTransports(u);
                                                        markDirty();
                                                    },
                                                    placeholder: "Notas e dicas adicionais",
                                                    style: {
                                                        minHeight: 50
                                                    },
                                                    rows: 2
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                                    lineNumber: 555,
                                                    columnNumber: 33
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                                lineNumber: 554,
                                                columnNumber: 29
                                            }, this)
                                        ]
                                    }, i, true, {
                                        fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                        lineNumber: 545,
                                        columnNumber: 25
                                    }, this)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    className: "btn-add-item",
                                    onClick: addTransport,
                                    children: "+ Opção de Transporte"
                                }, void 0, false, {
                                    fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                    lineNumber: 559,
                                    columnNumber: 21
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                            lineNumber: 542,
                            columnNumber: 17
                        }, this)
                    ]
                }, void 0, true);
            /* ═══ BLOCO 5: GASTO ═══ */ case "spending":
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "form-group",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    className: "form-label",
                                    children: "Moeda"
                                }, void 0, false, {
                                    fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                    lineNumber: 566,
                                    columnNumber: 21
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                    className: "form-input",
                                    value: spendingCurrency,
                                    onChange: (e)=>{
                                        setSpendingCurrency(e.target.value);
                                        markDirty();
                                    },
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                            value: "BRL",
                                            children: "BRL (R$)"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                            lineNumber: 568,
                                            columnNumber: 25
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                            value: "USD",
                                            children: "USD ($)"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                            lineNumber: 568,
                                            columnNumber: 62
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                            value: "EUR",
                                            children: "EUR (€)"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                            lineNumber: 568,
                                            columnNumber: 98
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                    lineNumber: 567,
                                    columnNumber: 21
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                            lineNumber: 565,
                            columnNumber: 17
                        }, this),
                        spendingBreakdown.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            className: "btn-add-item",
                            onClick: ()=>{
                                setSpendingBreakdown(SPENDING_CATS.map((c)=>({
                                        category: c,
                                        min: "",
                                        max: ""
                                    })));
                                markDirty();
                            },
                            children: "⚡ Preencher categorias padrão"
                        }, void 0, false, {
                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                            lineNumber: 572,
                            columnNumber: 21
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "editor-breakdown-list",
                            children: spendingBreakdown.map((item, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "editor-breakdown-row",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            className: "form-input",
                                            value: item.category,
                                            onChange: (e)=>{
                                                const u = [
                                                    ...spendingBreakdown
                                                ];
                                                u[i].category = e.target.value;
                                                setSpendingBreakdown(u);
                                                markDirty();
                                            },
                                            placeholder: "Categoria"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                            lineNumber: 579,
                                            columnNumber: 29
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            className: "form-input",
                                            type: "number",
                                            value: item.min,
                                            onChange: (e)=>{
                                                const u = [
                                                    ...spendingBreakdown
                                                ];
                                                u[i].min = e.target.value;
                                                setSpendingBreakdown(u);
                                                markDirty();
                                            },
                                            placeholder: "Mínimo"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                            lineNumber: 580,
                                            columnNumber: 29
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            className: "form-input",
                                            type: "number",
                                            value: item.max,
                                            onChange: (e)=>{
                                                const u = [
                                                    ...spendingBreakdown
                                                ];
                                                u[i].max = e.target.value;
                                                setSpendingBreakdown(u);
                                                markDirty();
                                            },
                                            placeholder: "Máximo"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                            lineNumber: 581,
                                            columnNumber: 29
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            className: "btn-remove",
                                            onClick: ()=>{
                                                setSpendingBreakdown(spendingBreakdown.filter((_, idx)=>idx !== i));
                                                markDirty();
                                            },
                                            children: "✕"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                            lineNumber: 582,
                                            columnNumber: 29
                                        }, this)
                                    ]
                                }, i, true, {
                                    fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                    lineNumber: 578,
                                    columnNumber: 25
                                }, this))
                        }, void 0, false, {
                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                            lineNumber: 576,
                            columnNumber: 17
                        }, this),
                        spendingBreakdown.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    className: "btn-add-item",
                                    onClick: ()=>{
                                        setSpendingBreakdown([
                                            ...spendingBreakdown,
                                            {
                                                category: "",
                                                min: "",
                                                max: ""
                                            }
                                        ]);
                                        markDirty();
                                    },
                                    children: "+ Categoria"
                                }, void 0, false, {
                                    fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                    lineNumber: 588,
                                    columnNumber: 25
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "editor-breakdown-total",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "editor-breakdown-total-label",
                                            children: "Total estimado por pessoa"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                            lineNumber: 590,
                                            columnNumber: 29
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "editor-breakdown-total-value",
                                            children: [
                                                "R$ ",
                                                spendingBreakdown.reduce((s, b)=>s + (parseFloat(b.min) || 0), 0).toLocaleString("pt-BR"),
                                                " – ",
                                                spendingBreakdown.reduce((s, b)=>s + (parseFloat(b.max) || 0), 0).toLocaleString("pt-BR")
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                            lineNumber: 591,
                                            columnNumber: 29
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                    lineNumber: 589,
                                    columnNumber: 25
                                }, this)
                            ]
                        }, void 0, true)
                    ]
                }, void 0, true);
            /* ═══ BLOCO 6: CHECKLIST + FAQ ═══ */ case "checklist":
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                            style: {
                                margin: "0 0 8px"
                            },
                            children: "✅ Checklist"
                        }, void 0, false, {
                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                            lineNumber: 601,
                            columnNumber: 17
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "editor-checklist-add",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                    className: "form-input",
                                    value: newCheckCat,
                                    onChange: (e)=>setNewCheckCat(e.target.value),
                                    style: {
                                        width: 140
                                    },
                                    children: CHECKLIST_CATS.map((c)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                            value: c,
                                            children: c
                                        }, c, false, {
                                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                            lineNumber: 604,
                                            columnNumber: 50
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                    lineNumber: 603,
                                    columnNumber: 21
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    className: "form-input",
                                    value: newCheckItem,
                                    onChange: (e)=>setNewCheckItem(e.target.value),
                                    onKeyDown: (e)=>{
                                        if (e.key === "Enter" && newCheckItem.trim()) {
                                            setChecklistItems([
                                                ...checklistItems,
                                                {
                                                    category: newCheckCat,
                                                    item: newCheckItem.trim(),
                                                    isDefault: true
                                                }
                                            ]);
                                            setNewCheckItem("");
                                            markDirty();
                                        }
                                    },
                                    placeholder: "Novo item..."
                                }, void 0, false, {
                                    fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                    lineNumber: 606,
                                    columnNumber: 21
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    className: "btn-add-item",
                                    onClick: ()=>{
                                        if (newCheckItem.trim()) {
                                            setChecklistItems([
                                                ...checklistItems,
                                                {
                                                    category: newCheckCat,
                                                    item: newCheckItem.trim(),
                                                    isDefault: true
                                                }
                                            ]);
                                            setNewCheckItem("");
                                            markDirty();
                                        }
                                    },
                                    children: "+"
                                }, void 0, false, {
                                    fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                    lineNumber: 607,
                                    columnNumber: 21
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                            lineNumber: 602,
                            columnNumber: 17
                        }, this),
                        CHECKLIST_CATS.map((cat)=>{
                            const items = checklistItems.filter((c)=>c.category === cat);
                            if (items.length === 0) return null;
                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    marginBottom: 12
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "form-label",
                                        style: {
                                            textTransform: "capitalize"
                                        },
                                        children: cat
                                    }, void 0, false, {
                                        fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                        lineNumber: 612,
                                        columnNumber: 29
                                    }, this),
                                    items.map((item, i)=>{
                                        const gi = checklistItems.indexOf(item);
                                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "editor-checklist-item",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    children: item.item
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                                    lineNumber: 616,
                                                    columnNumber: 41
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    className: "btn-remove",
                                                    onClick: ()=>{
                                                        setChecklistItems(checklistItems.filter((_, idx)=>idx !== gi));
                                                        markDirty();
                                                    },
                                                    children: "✕"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                                    lineNumber: 617,
                                                    columnNumber: 41
                                                }, this)
                                            ]
                                        }, i, true, {
                                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                            lineNumber: 615,
                                            columnNumber: 37
                                        }, this);
                                    })
                                ]
                            }, cat, true, {
                                fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                lineNumber: 611,
                                columnNumber: 25
                            }, this);
                        }),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                            style: {
                                margin: "24px 0 8px"
                            },
                            children: "❓ FAQ"
                        }, void 0, false, {
                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                            lineNumber: 625,
                            columnNumber: 17
                        }, this),
                        faqItems.map((faq, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "editor-faq-item",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        className: "form-input",
                                        value: faq.question,
                                        onChange: (e)=>{
                                            const u = [
                                                ...faqItems
                                            ];
                                            u[i].question = e.target.value;
                                            setFaqItems(u);
                                            markDirty();
                                        },
                                        placeholder: "Pergunta"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                        lineNumber: 628,
                                        columnNumber: 25
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                        className: "form-input",
                                        value: faq.answer,
                                        onChange: (e)=>{
                                            const u = [
                                                ...faqItems
                                            ];
                                            u[i].answer = e.target.value;
                                            setFaqItems(u);
                                            markDirty();
                                        },
                                        placeholder: "Resposta",
                                        style: {
                                            minHeight: 60
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                        lineNumber: 629,
                                        columnNumber: 25
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        className: "btn-remove",
                                        onClick: ()=>{
                                            setFaqItems(faqItems.filter((_, idx)=>idx !== i));
                                            markDirty();
                                        },
                                        children: "✕"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                        lineNumber: 630,
                                        columnNumber: 25
                                    }, this)
                                ]
                            }, i, true, {
                                fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                lineNumber: 627,
                                columnNumber: 21
                            }, this)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            className: "btn-add-item",
                            onClick: ()=>{
                                setFaqItems([
                                    ...faqItems,
                                    {
                                        question: "",
                                        answer: ""
                                    }
                                ]);
                                markDirty();
                            },
                            children: "+ Pergunta"
                        }, void 0, false, {
                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                            lineNumber: 633,
                            columnNumber: 17
                        }, this)
                    ]
                }, void 0, true);
            /* ═══ BLOCO 7: PÓS-COMPRA ═══ */ case "postpurchase":
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                    children: [
                        {
                            label: "📥 Download offline",
                            desc: "Usuário pode baixar para usar sem internet",
                            val: offlineDownload,
                            set: setOfflineDownload
                        },
                        {
                            label: "📄 Exportar PDF",
                            desc: "Permitir exportar como PDF",
                            val: allowPdf,
                            set: setAllowPdf
                        },
                        {
                            label: "🔗 Compartilhar",
                            desc: "Permitir compartilhar com amigos",
                            val: allowShare,
                            set: setAllowShare
                        },
                        {
                            label: "♾️ Acesso vitalício",
                            desc: "Sem prazo de expiração",
                            val: lifetimeAccess,
                            set: setLifetimeAccess
                        }
                    ].map((t)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "editor-toggle-row",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "editor-toggle-info",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "editor-toggle-label",
                                            children: t.label
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                            lineNumber: 645,
                                            columnNumber: 61
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "editor-toggle-desc",
                                            children: t.desc
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                            lineNumber: 645,
                                            columnNumber: 115
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                    lineNumber: 645,
                                    columnNumber: 25
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    className: "editor-toggle",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            type: "checkbox",
                                            checked: t.val,
                                            onChange: (e)=>{
                                                t.set(e.target.checked);
                                                markDirty();
                                            }
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                            lineNumber: 646,
                                            columnNumber: 58
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "editor-toggle-track"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                            lineNumber: 646,
                                            columnNumber: 157
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "editor-toggle-thumb"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                            lineNumber: 646,
                                            columnNumber: 197
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                    lineNumber: 646,
                                    columnNumber: 25
                                }, this)
                            ]
                        }, t.label, true, {
                            fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                            lineNumber: 644,
                            columnNumber: 21
                        }, this))
                }, void 0, false);
            default:
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    children: "Seção em construção..."
                }, void 0, false, {
                    fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                    lineNumber: 651,
                    columnNumber: 29
                }, this);
        }
    };
    /* ═══════════════════════════ RENDER ═══════════════════════════ */ return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "editor-page",
        children: [
            toast && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: `editor-toast ${toast.type}`,
                children: toast.msg
            }, void 0, false, {
                fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                lineNumber: 658,
                columnNumber: 23
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "editor-header",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "editor-header-left",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                href: "/criador/roteiros",
                                className: "btn-back",
                                children: "← Voltar"
                            }, void 0, false, {
                                fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                lineNumber: 663,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                className: "editor-title",
                                children: isNew ? "Novo Roteiro" : title || "Editar Roteiro"
                            }, void 0, false, {
                                fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                lineNumber: 664,
                                columnNumber: 21
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                        lineNumber: 662,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "editor-header-right",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: `quality-score-mini ${qualityScore >= 80 ? "high" : qualityScore >= 50 ? "medium" : "low"}`,
                                children: [
                                    qualityScore,
                                    "%"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                lineNumber: 667,
                                columnNumber: 21
                            }, this),
                            dirty && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "editor-dirty-badge",
                                children: "● Não salvo"
                            }, void 0, false, {
                                fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                lineNumber: 668,
                                columnNumber: 31
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: "editor-save-btn",
                                onClick: handleSave,
                                disabled: saving,
                                children: saving ? "Salvando..." : "Publicar Roteiro"
                            }, void 0, false, {
                                fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                lineNumber: 669,
                                columnNumber: 21
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                        lineNumber: 666,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                lineNumber: 661,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "editor-sections",
                children: SECTIONS.map((sec)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        ref: (el)=>{
                            sectionRefs.current[sec.key] = el;
                        },
                        className: `editor-section ${openSections.has(sec.key) ? "open" : ""} ${activeSection === sec.key ? "active" : ""}`,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: "editor-section-header",
                                onClick: ()=>{
                                    toggleSection(sec.key);
                                    setActiveSection(sec.key);
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "editor-section-icon",
                                        children: sec.icon
                                    }, void 0, false, {
                                        fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                        lineNumber: 678,
                                        columnNumber: 29
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "editor-section-title",
                                        children: sec.title
                                    }, void 0, false, {
                                        fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                        lineNumber: 679,
                                        columnNumber: 29
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: `editor-section-status ${isSectionComplete(sec.key) ? "complete" : "pending"}`,
                                        children: isSectionComplete(sec.key) ? "Completo" : "Pendente"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                        lineNumber: 680,
                                        columnNumber: 29
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "editor-section-arrow",
                                        children: openSections.has(sec.key) ? "▲" : "▼"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                        lineNumber: 681,
                                        columnNumber: 29
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                lineNumber: 677,
                                columnNumber: 25
                            }, this),
                            openSections.has(sec.key) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "editor-section-body",
                                children: renderSection(sec.key)
                            }, void 0, false, {
                                fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                                lineNumber: 683,
                                columnNumber: 55
                            }, this)
                        ]
                    }, sec.key, true, {
                        fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                        lineNumber: 676,
                        columnNumber: 21
                    }, this))
            }, void 0, false, {
                fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
                lineNumber: 674,
                columnNumber: 13
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/site/src/app/criador/roteiro/[id]/page.tsx",
        lineNumber: 657,
        columnNumber: 9
    }, this);
}
}),
];

//# sourceMappingURL=apps_site_src_49aa69ca._.js.map
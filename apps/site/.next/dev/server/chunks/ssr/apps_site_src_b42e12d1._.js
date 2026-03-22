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
    "getAgencySales",
    ()=>getAgencySales,
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
    ()=>updatePackage,
    "updateSaleDocuments",
    ()=>updateSaleDocuments
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
const MOCK_ITINERARIES = [
    {
        id: "mock-1",
        title: "Chapada Diamantina — 7 dias",
        destination: "Lençóis",
        country: "Brasil",
        status: "active",
        sales: 24,
        revenue: 7176,
        rating: 4.9,
        reviewCount: 18,
        duration: 7,
        price: 299,
        updatedAt: new Date().toISOString()
    },
    {
        id: "mock-2",
        title: "Jalapão Selvagem",
        destination: "Palmas",
        country: "Brasil",
        status: "active",
        sales: 11,
        revenue: 1650,
        rating: 4.7,
        reviewCount: 9,
        duration: 5,
        price: 150,
        updatedAt: new Date(Date.now() - 86400000 * 3).toISOString()
    },
    {
        id: "mock-3",
        title: "Fernando de Noronha — Mergulho",
        destination: "Fernando de Noronha",
        country: "Brasil",
        status: "pending",
        sales: 0,
        revenue: 0,
        rating: null,
        reviewCount: 0,
        duration: 6,
        price: 2500,
        updatedAt: new Date(Date.now() - 86400000 * 7).toISOString()
    }
];
async function getDashboardStats(creatorId) {
    const query = creatorId ? `?creatorId=${creatorId}` : '';
    try {
        const stats = await fetchApi(`/itineraries/dashboard/stats${query}`);
        // Return mock data if no itineraries found (for demo/development)
        if (!stats.itineraries || stats.itineraries.length === 0) throw new Error('Empty');
        return stats;
    } catch  {
        return {
            totalRevenue: 13650,
            totalSales: 35,
            averageRating: 4.8,
            totalReviews: 27,
            activeItineraries: 2,
            totalItineraries: 3,
            itineraries: MOCK_ITINERARIES
        };
    }
}
async function getItineraries() {
    const stats = await getDashboardStats();
    return stats.itineraries;
}
async function getItineraryById(id) {
    try {
        return await fetchApi(`/itineraries/${id}`);
    } catch  {
        return MOCK_ITINERARIES.find((i)=>i.id === id) || MOCK_ITINERARIES[0] || null;
    }
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
// ─── Packages CRUD ───
const MOCK_PACKAGES = [
    {
        id: "pkg-1",
        title: "Paris Romântica — 10 dias",
        destination: "Paris",
        country: "França",
        duration: 10,
        status: "ACTIVE",
        priceMin: 8500,
        priceMax: 12000,
        qualityScore: 85,
        rating: 4.8,
        reviewCount: 32,
        recentPurchases: 7
    },
    {
        id: "pkg-2",
        title: "Japão Completo",
        destination: "Tóquio",
        country: "Japão",
        duration: 15,
        status: "ACTIVE",
        priceMin: 14000,
        priceMax: 18000,
        qualityScore: 92,
        rating: 4.9,
        reviewCount: 19,
        recentPurchases: 4
    },
    {
        id: "pkg-3",
        title: "Grécia — Ilhas e Cultura",
        destination: "Atenas",
        country: "Grécia",
        duration: 12,
        status: "PAUSED",
        priceMin: 9800,
        priceMax: 13500,
        qualityScore: 68,
        rating: 4.5,
        reviewCount: 11,
        recentPurchases: 0
    }
];
async function getPackages(agencyId) {
    const query = agencyId ? `?agencyId=${agencyId}` : '';
    try {
        return await fetchApi(`/packages${query}`);
    } catch  {
        return MOCK_PACKAGES;
    }
}
async function getAgencyPackages(agencyId) {
    try {
        const pkgs = await fetchApi(`/packages?agencyId=${agencyId}`);
        // Return mock data if no packages found (for demo/development)
        if (!pkgs || pkgs.length === 0) throw new Error('Empty');
        return pkgs;
    } catch  {
        return MOCK_PACKAGES;
    }
}
async function getPackageById(id) {
    try {
        return await fetchApi(`/packages/${id}`);
    } catch  {
        // Try exact match first, then index-based match (for numeric IDs like "1","2","3")
        const pkg = MOCK_PACKAGES.find((p)=>p.id === id) || MOCK_PACKAGES[parseInt(id, 10) - 1] || MOCK_PACKAGES[0];
        if (pkg) return pkg;
        throw new Error("Pacote não encontrado");
    }
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
async function getAgencySales(agencyId) {
    try {
        return await fetchApi(`/sales/${agencyId}`);
    } catch  {
        return [];
    }
}
async function updateSaleDocuments(purchaseId, data) {
    return fetchApi(`/sales/${purchaseId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
}
async function getPackageDashboardStats(agencyId) {
    try {
        const stats = await fetchApi(`/packages/dashboard/stats?agencyId=${agencyId}`);
        if (!stats.packages || stats.packages.length === 0) throw new Error('Empty');
        return stats;
    } catch  {
        return {
            totalPackages: MOCK_PACKAGES.length,
            activePackages: MOCK_PACKAGES.filter((p)=>p.status === "ACTIVE").length,
            totalRevenue: 312500,
            totalSales: 11,
            averageQualityScore: 82,
            packages: MOCK_PACKAGES
        };
    }
}
}),
"[project]/apps/site/src/app/agencia/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>AgenciaDashboardPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$site$2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/site/src/lib/auth.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$site$2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/site/src/lib/api.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
function AgenciaDashboardPage() {
    const [session, setSession] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [packages, setPackages] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        (async ()=>{
            try {
                const s = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$site$2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getSession"])();
                if (s) setSession(s);
                // If ADMIN, fetch all packages (passing no agencyId)
                const isAuthAdmin = s?.employee?.role === "ADMIN";
                const pkgs = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$site$2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getAgencyPackages"])(isAuthAdmin ? "" : s?.agency?.id || "mock");
                setPackages(pkgs || []);
            } catch  {
            // mock data already handled in api.ts
            } finally{
                setLoading(false);
            }
        })();
    }, []);
    const formatCurrency = (value)=>`R$ ${value.toLocaleString("pt-BR", {
            minimumFractionDigits: 0
        })}`;
    const activePackages = packages.filter((p)=>p.status === "ACTIVE" || p.status === "active");
    const totalSales = packages.reduce((s, p)=>s + (p.recentPurchases || 0), 0);
    const avgRating = packages.filter((p)=>p.rating).length > 0 ? (packages.reduce((s, p)=>s + (p.rating || 0), 0) / packages.filter((p)=>p.rating).length).toFixed(1) : "—";
    const avgQuality = packages.length > 0 ? Math.round(packages.reduce((s, p)=>s + (p.qualityScore || 0), 0) / packages.length) : 0;
    if (loading) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "dash-header",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        className: "dash-title",
                        children: "Visão Geral"
                    }, void 0, false, {
                        fileName: "[project]/apps/site/src/app/agencia/page.tsx",
                        lineNumber: 46,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "dash-subtitle",
                        children: "Carregando dados..."
                    }, void 0, false, {
                        fileName: "[project]/apps/site/src/app/agencia/page.tsx",
                        lineNumber: 47,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/site/src/app/agencia/page.tsx",
                lineNumber: 45,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "dash-stats",
                children: [
                    1,
                    2,
                    3,
                    4
                ].map((i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "dash-stat-card",
                        style: {
                            opacity: 0.4
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "dash-stat-label",
                                children: "—"
                            }, void 0, false, {
                                fileName: "[project]/apps/site/src/app/agencia/page.tsx",
                                lineNumber: 52,
                                columnNumber: 25
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "dash-stat-value",
                                children: "..."
                            }, void 0, false, {
                                fileName: "[project]/apps/site/src/app/agencia/page.tsx",
                                lineNumber: 53,
                                columnNumber: 25
                            }, this)
                        ]
                    }, i, true, {
                        fileName: "[project]/apps/site/src/app/agencia/page.tsx",
                        lineNumber: 51,
                        columnNumber: 21
                    }, this))
            }, void 0, false, {
                fileName: "[project]/apps/site/src/app/agencia/page.tsx",
                lineNumber: 49,
                columnNumber: 13
            }, this)
        ]
    }, void 0, true);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "dash-header",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        className: "dash-title",
                        children: "Visão Geral"
                    }, void 0, false, {
                        fileName: "[project]/apps/site/src/app/agencia/page.tsx",
                        lineNumber: 63,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "dash-subtitle",
                        children: [
                            session?.employee?.role === "ADMIN" ? "VAMO Admin Control" : session?.agency?.name || "Sua Agência",
                            " — Gerencie pacotes, vendas e avaliações"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/site/src/app/agencia/page.tsx",
                        lineNumber: 64,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/site/src/app/agencia/page.tsx",
                lineNumber: 62,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "dash-stats",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "dash-stat-card",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "dash-stat-label",
                                children: "Pacotes Ativos"
                            }, void 0, false, {
                                fileName: "[project]/apps/site/src/app/agencia/page.tsx",
                                lineNumber: 72,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "dash-stat-value teal",
                                children: activePackages.length
                            }, void 0, false, {
                                fileName: "[project]/apps/site/src/app/agencia/page.tsx",
                                lineNumber: 73,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "dash-stat-change",
                                children: [
                                    packages.length,
                                    " total cadastrados"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/site/src/app/agencia/page.tsx",
                                lineNumber: 74,
                                columnNumber: 21
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/site/src/app/agencia/page.tsx",
                        lineNumber: 71,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "dash-stat-card",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "dash-stat-label",
                                children: "Vendas Totais"
                            }, void 0, false, {
                                fileName: "[project]/apps/site/src/app/agencia/page.tsx",
                                lineNumber: 77,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "dash-stat-value",
                                children: totalSales
                            }, void 0, false, {
                                fileName: "[project]/apps/site/src/app/agencia/page.tsx",
                                lineNumber: 78,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "dash-stat-change",
                                children: [
                                    packages.reduce((s, p)=>s + (p.reviewCount || 0), 0),
                                    " avaliações recebidas"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/site/src/app/agencia/page.tsx",
                                lineNumber: 79,
                                columnNumber: 21
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/site/src/app/agencia/page.tsx",
                        lineNumber: 76,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "dash-stat-card",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "dash-stat-label",
                                children: "Avaliação Média"
                            }, void 0, false, {
                                fileName: "[project]/apps/site/src/app/agencia/page.tsx",
                                lineNumber: 84,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "dash-stat-value",
                                children: avgRating
                            }, void 0, false, {
                                fileName: "[project]/apps/site/src/app/agencia/page.tsx",
                                lineNumber: 85,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "dash-stat-change",
                                children: "de 5.0 estrelas"
                            }, void 0, false, {
                                fileName: "[project]/apps/site/src/app/agencia/page.tsx",
                                lineNumber: 86,
                                columnNumber: 21
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/site/src/app/agencia/page.tsx",
                        lineNumber: 83,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "dash-stat-card",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "dash-stat-label",
                                children: "Qualidade Média"
                            }, void 0, false, {
                                fileName: "[project]/apps/site/src/app/agencia/page.tsx",
                                lineNumber: 89,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "dash-stat-value",
                                style: {
                                    color: avgQuality >= 80 ? "var(--success)" : avgQuality >= 50 ? "var(--warning)" : "var(--error)"
                                },
                                children: [
                                    avgQuality,
                                    "%"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/site/src/app/agencia/page.tsx",
                                lineNumber: 90,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "dash-stat-change",
                                children: "Quality Score"
                            }, void 0, false, {
                                fileName: "[project]/apps/site/src/app/agencia/page.tsx",
                                lineNumber: 94,
                                columnNumber: 21
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/site/src/app/agencia/page.tsx",
                        lineNumber: 88,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/site/src/app/agencia/page.tsx",
                lineNumber: 70,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "itinerary-table",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "table-header",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: "table-title",
                                children: [
                                    "Seus Pacotes (",
                                    packages.length,
                                    ")"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/site/src/app/agencia/page.tsx",
                                lineNumber: 101,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                href: "/agencia/pacote/new",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    className: "btn-new",
                                    children: "+ Novo Pacote"
                                }, void 0, false, {
                                    fileName: "[project]/apps/site/src/app/agencia/page.tsx",
                                    lineNumber: 103,
                                    columnNumber: 25
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/apps/site/src/app/agencia/page.tsx",
                                lineNumber: 102,
                                columnNumber: 21
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/site/src/app/agencia/page.tsx",
                        lineNumber: 100,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "table-row table-row-head",
                        style: {
                            gridTemplateColumns: "2.5fr 1fr 1fr 1fr 1fr 100px"
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "table-cell",
                                children: "Pacote"
                            }, void 0, false, {
                                fileName: "[project]/apps/site/src/app/agencia/page.tsx",
                                lineNumber: 108,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "table-cell",
                                children: "Status"
                            }, void 0, false, {
                                fileName: "[project]/apps/site/src/app/agencia/page.tsx",
                                lineNumber: 109,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "table-cell",
                                children: "Preço"
                            }, void 0, false, {
                                fileName: "[project]/apps/site/src/app/agencia/page.tsx",
                                lineNumber: 110,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "table-cell",
                                children: "Vendas"
                            }, void 0, false, {
                                fileName: "[project]/apps/site/src/app/agencia/page.tsx",
                                lineNumber: 111,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "table-cell",
                                children: "Score"
                            }, void 0, false, {
                                fileName: "[project]/apps/site/src/app/agencia/page.tsx",
                                lineNumber: 112,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "table-cell",
                                children: "Ações"
                            }, void 0, false, {
                                fileName: "[project]/apps/site/src/app/agencia/page.tsx",
                                lineNumber: 113,
                                columnNumber: 21
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/site/src/app/agencia/page.tsx",
                        lineNumber: 107,
                        columnNumber: 17
                    }, this),
                    packages.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "table-row",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "table-cell",
                            style: {
                                gridColumn: "1 / -1",
                                textAlign: "center",
                                padding: "2rem"
                            },
                            children: [
                                "Nenhum pacote cadastrado.",
                                " ",
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                    href: "/agencia/pacote/new",
                                    style: {
                                        color: "var(--primary)",
                                        fontWeight: 600
                                    },
                                    children: "Crie seu primeiro pacote →"
                                }, void 0, false, {
                                    fileName: "[project]/apps/site/src/app/agencia/page.tsx",
                                    lineNumber: 120,
                                    columnNumber: 29
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/site/src/app/agencia/page.tsx",
                            lineNumber: 118,
                            columnNumber: 25
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/apps/site/src/app/agencia/page.tsx",
                        lineNumber: 117,
                        columnNumber: 21
                    }, this) : packages.map((pkg)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "table-row",
                            style: {
                                gridTemplateColumns: "2.5fr 1fr 1fr 1fr 1fr 100px"
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "table-cell",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "itinerary-name",
                                            children: [
                                                pkg.title,
                                                " — ",
                                                pkg.duration,
                                                " dias"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/site/src/app/agencia/page.tsx",
                                            lineNumber: 129,
                                            columnNumber: 33
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "itinerary-destination",
                                            children: [
                                                "📍 ",
                                                pkg.destination,
                                                ", ",
                                                pkg.country
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/site/src/app/agencia/page.tsx",
                                            lineNumber: 130,
                                            columnNumber: 33
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/site/src/app/agencia/page.tsx",
                                    lineNumber: 128,
                                    columnNumber: 29
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "table-cell",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: `status-badge ${pkg.status === "ACTIVE" || pkg.status === "active" ? "published" : pkg.status === "PAUSED" || pkg.status === "paused" ? "draft" : "archived"}`,
                                        children: pkg.status === "ACTIVE" || pkg.status === "active" ? "Ativo" : pkg.status === "PAUSED" || pkg.status === "paused" ? "Pausado" : "Arquivado"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/site/src/app/agencia/page.tsx",
                                        lineNumber: 133,
                                        columnNumber: 33
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/apps/site/src/app/agencia/page.tsx",
                                    lineNumber: 132,
                                    columnNumber: 29
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "table-cell",
                                    children: pkg.priceMin != null ? formatCurrency(pkg.priceMin) : pkg.price?.min != null ? formatCurrency(pkg.price.min) : "—"
                                }, void 0, false, {
                                    fileName: "[project]/apps/site/src/app/agencia/page.tsx",
                                    lineNumber: 137,
                                    columnNumber: 29
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "table-cell",
                                    children: (pkg.recentPurchases || 0) > 0 ? pkg.recentPurchases : "—"
                                }, void 0, false, {
                                    fileName: "[project]/apps/site/src/app/agencia/page.tsx",
                                    lineNumber: 140,
                                    columnNumber: 29
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "table-cell",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        style: {
                                            fontWeight: 700,
                                            color: (pkg.qualityScore || 0) >= 80 ? "var(--success)" : (pkg.qualityScore || 0) >= 50 ? "var(--warning)" : "var(--error)"
                                        },
                                        children: [
                                            pkg.qualityScore || 0,
                                            "%"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/site/src/app/agencia/page.tsx",
                                        lineNumber: 144,
                                        columnNumber: 33
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/apps/site/src/app/agencia/page.tsx",
                                    lineNumber: 143,
                                    columnNumber: 29
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "table-cell table-actions",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                        href: `/agencia/pacote/${pkg.id}`,
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            className: "table-action-btn",
                                            title: "Editar",
                                            children: "✏️"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/app/agencia/page.tsx",
                                            lineNumber: 153,
                                            columnNumber: 37
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/apps/site/src/app/agencia/page.tsx",
                                        lineNumber: 152,
                                        columnNumber: 33
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/apps/site/src/app/agencia/page.tsx",
                                    lineNumber: 151,
                                    columnNumber: 29
                                }, this)
                            ]
                        }, pkg.id, true, {
                            fileName: "[project]/apps/site/src/app/agencia/page.tsx",
                            lineNumber: 127,
                            columnNumber: 25
                        }, this))
                ]
            }, void 0, true, {
                fileName: "[project]/apps/site/src/app/agencia/page.tsx",
                lineNumber: 99,
                columnNumber: 13
            }, this)
        ]
    }, void 0, true);
}
}),
];

//# sourceMappingURL=apps_site_src_b42e12d1._.js.map
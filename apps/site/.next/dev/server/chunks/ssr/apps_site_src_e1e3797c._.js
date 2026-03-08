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
        return await fetchApi(`/itineraries/dashboard/stats${query}`);
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
        return await fetchApi(`/packages?agencyId=${agencyId}`);
    } catch  {
        return MOCK_PACKAGES;
    }
}
async function getPackageById(id) {
    try {
        return await fetchApi(`/packages/${id}`);
    } catch  {
        const pkg = MOCK_PACKAGES.find((p)=>p.id === id);
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
async function getPackageDashboardStats(agencyId) {
    try {
        return await fetchApi(`/packages/dashboard/stats?agencyId=${agencyId}`);
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
"[project]/apps/site/src/components/dashboard/StepperNav.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "StepperActions",
    ()=>StepperActions,
    "default",
    ()=>StepperNav
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
"use client";
;
function StepperNav({ steps, activeIndex, completedSteps, onStepClick }) {
    const progress = Math.round(completedSteps.size / steps.length * 100);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "stepper-container",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "stepper-progress-track",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "stepper-progress-fill",
                        style: {
                            width: `${progress}%`
                        }
                    }, void 0, false, {
                        fileName: "[project]/apps/site/src/components/dashboard/StepperNav.tsx",
                        lineNumber: 25,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "stepper-progress-label",
                        children: [
                            progress,
                            "% concluído"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/site/src/components/dashboard/StepperNav.tsx",
                        lineNumber: 29,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/site/src/components/dashboard/StepperNav.tsx",
                lineNumber: 24,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "stepper-steps",
                children: steps.map((step, i)=>{
                    const isActive = i === activeIndex;
                    const isCompleted = completedSteps.has(step.key);
                    const isPast = i < activeIndex;
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: `stepper-step ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""} ${isPast ? "past" : ""}`,
                        onClick: ()=>onStepClick(i),
                        type: "button",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "stepper-step-number",
                                children: isCompleted ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                    width: "14",
                                    height: "14",
                                    viewBox: "0 0 24 24",
                                    fill: "none",
                                    stroke: "currentColor",
                                    strokeWidth: "3",
                                    strokeLinecap: "round",
                                    strokeLinejoin: "round",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("polyline", {
                                        points: "20 6 9 17 4 12"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/site/src/components/dashboard/StepperNav.tsx",
                                        lineNumber: 49,
                                        columnNumber: 41
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/apps/site/src/components/dashboard/StepperNav.tsx",
                                    lineNumber: 48,
                                    columnNumber: 37
                                }, this) : i + 1
                            }, void 0, false, {
                                fileName: "[project]/apps/site/src/components/dashboard/StepperNav.tsx",
                                lineNumber: 46,
                                columnNumber: 29
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "stepper-step-label",
                                children: step.title
                            }, void 0, false, {
                                fileName: "[project]/apps/site/src/components/dashboard/StepperNav.tsx",
                                lineNumber: 55,
                                columnNumber: 29
                            }, this),
                            i < steps.length - 1 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "stepper-step-connector"
                            }, void 0, false, {
                                fileName: "[project]/apps/site/src/components/dashboard/StepperNav.tsx",
                                lineNumber: 56,
                                columnNumber: 54
                            }, this)
                        ]
                    }, step.key, true, {
                        fileName: "[project]/apps/site/src/components/dashboard/StepperNav.tsx",
                        lineNumber: 40,
                        columnNumber: 25
                    }, this);
                })
            }, void 0, false, {
                fileName: "[project]/apps/site/src/components/dashboard/StepperNav.tsx",
                lineNumber: 33,
                columnNumber: 13
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/site/src/components/dashboard/StepperNav.tsx",
        lineNumber: 22,
        columnNumber: 9
    }, this);
}
function StepperActions({ activeIndex, totalSteps, onPrev, onNext, onSave, saving, isLastStep }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "stepper-actions",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                className: "stepper-btn stepper-btn-prev",
                onClick: onPrev,
                disabled: activeIndex === 0,
                type: "button",
                children: "← Anterior"
            }, void 0, false, {
                fileName: "[project]/apps/site/src/components/dashboard/StepperNav.tsx",
                lineNumber: 85,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "stepper-step-indicator",
                children: [
                    "Etapa ",
                    activeIndex + 1,
                    " de ",
                    totalSteps
                ]
            }, void 0, true, {
                fileName: "[project]/apps/site/src/components/dashboard/StepperNav.tsx",
                lineNumber: 93,
                columnNumber: 13
            }, this),
            isLastStep ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                className: "stepper-btn stepper-btn-save",
                onClick: onSave,
                disabled: saving,
                type: "button",
                children: saving ? "Publicando..." : "🚀 Publicar"
            }, void 0, false, {
                fileName: "[project]/apps/site/src/components/dashboard/StepperNav.tsx",
                lineNumber: 97,
                columnNumber: 17
            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                className: "stepper-btn stepper-btn-next",
                onClick: onNext,
                type: "button",
                children: "Próximo →"
            }, void 0, false, {
                fileName: "[project]/apps/site/src/components/dashboard/StepperNav.tsx",
                lineNumber: 106,
                columnNumber: 17
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/site/src/components/dashboard/StepperNav.tsx",
        lineNumber: 84,
        columnNumber: 9
    }, this);
}
}),
"[project]/apps/site/src/components/dashboard/PhonePreview.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>PhonePreview
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
"use client";
;
;
/* ─── Shimmer Skeleton for empty state ─── */ function PhoneSkeleton() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: {
            padding: "12px 10px"
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "phone-skeleton-cover"
            }, void 0, false, {
                fileName: "[project]/apps/site/src/components/dashboard/PhonePreview.tsx",
                lineNumber: 25,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "phone-skeleton-line medium"
            }, void 0, false, {
                fileName: "[project]/apps/site/src/components/dashboard/PhonePreview.tsx",
                lineNumber: 26,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "phone-skeleton-line short",
                style: {
                    marginBottom: 16
                }
            }, void 0, false, {
                fileName: "[project]/apps/site/src/components/dashboard/PhonePreview.tsx",
                lineNumber: 27,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "phone-skeleton-line thin long"
            }, void 0, false, {
                fileName: "[project]/apps/site/src/components/dashboard/PhonePreview.tsx",
                lineNumber: 28,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "phone-skeleton-line thin medium"
            }, void 0, false, {
                fileName: "[project]/apps/site/src/components/dashboard/PhonePreview.tsx",
                lineNumber: 29,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "phone-skeleton-line thin short"
            }, void 0, false, {
                fileName: "[project]/apps/site/src/components/dashboard/PhonePreview.tsx",
                lineNumber: 30,
                columnNumber: 13
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/site/src/components/dashboard/PhonePreview.tsx",
        lineNumber: 24,
        columnNumber: 9
    }, this);
}
function PhonePreview({ title, subtitle, destination, country, duration, price, currency = "BRL", coverImage, highlights = [], days = [], travelStyles = [], categories = [], type = "roteiro" }) {
    const currencySymbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : "R$";
    const formattedPrice = price > 0 ? `${currencySymbol} ${price.toLocaleString("pt-BR")}` : "—";
    const hasContent = !!(title || destination);
    // Track previous score to know when content first appears
    const prevHasContent = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(false);
    const contentKey = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(0);
    if (hasContent && !prevHasContent.current) {
        contentKey.current++;
    }
    prevHasContent.current = hasContent;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "phone-preview-wrapper",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "phone-preview-label",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                        width: "14",
                        height: "14",
                        viewBox: "0 0 24 24",
                        fill: "none",
                        stroke: "currentColor",
                        strokeWidth: "2",
                        strokeLinecap: "round",
                        strokeLinejoin: "round",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                                x: "5",
                                y: "2",
                                width: "14",
                                height: "20",
                                rx: "2",
                                ry: "2"
                            }, void 0, false, {
                                fileName: "[project]/apps/site/src/components/dashboard/PhonePreview.tsx",
                                lineNumber: 66,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                x1: "12",
                                y1: "18",
                                x2: "12.01",
                                y2: "18"
                            }, void 0, false, {
                                fileName: "[project]/apps/site/src/components/dashboard/PhonePreview.tsx",
                                lineNumber: 67,
                                columnNumber: 21
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/site/src/components/dashboard/PhonePreview.tsx",
                        lineNumber: 65,
                        columnNumber: 17
                    }, this),
                    "Preview no App"
                ]
            }, void 0, true, {
                fileName: "[project]/apps/site/src/components/dashboard/PhonePreview.tsx",
                lineNumber: 64,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "phone-frame",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "phone-notch"
                    }, void 0, false, {
                        fileName: "[project]/apps/site/src/components/dashboard/PhonePreview.tsx",
                        lineNumber: 73,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "phone-screen",
                        children: !hasContent ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(PhoneSkeleton, {}, void 0, false, {
                            fileName: "[project]/apps/site/src/components/dashboard/PhonePreview.tsx",
                            lineNumber: 78,
                            columnNumber: 25
                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "phone-cover phone-content-fade",
                                    style: {
                                        animationDelay: "0s"
                                    },
                                    children: [
                                        coverImage ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                            src: coverImage,
                                            alt: "",
                                            className: "phone-cover-img"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/components/dashboard/PhonePreview.tsx",
                                            lineNumber: 84,
                                            columnNumber: 37
                                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "phone-cover-placeholder",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                width: "32",
                                                height: "32",
                                                viewBox: "0 0 24 24",
                                                fill: "none",
                                                stroke: "rgba(255,255,255,0.4)",
                                                strokeWidth: "1.5",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                                                        x: "3",
                                                        y: "3",
                                                        width: "18",
                                                        height: "18",
                                                        rx: "2",
                                                        ry: "2"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/site/src/components/dashboard/PhonePreview.tsx",
                                                        lineNumber: 88,
                                                        columnNumber: 45
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                                        cx: "8.5",
                                                        cy: "8.5",
                                                        r: "1.5"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/site/src/components/dashboard/PhonePreview.tsx",
                                                        lineNumber: 89,
                                                        columnNumber: 45
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("polyline", {
                                                        points: "21 15 16 10 5 21"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/site/src/components/dashboard/PhonePreview.tsx",
                                                        lineNumber: 90,
                                                        columnNumber: 45
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/site/src/components/dashboard/PhonePreview.tsx",
                                                lineNumber: 87,
                                                columnNumber: 41
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/components/dashboard/PhonePreview.tsx",
                                            lineNumber: 86,
                                            columnNumber: 37
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "phone-cover-overlay",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "phone-cover-badge",
                                                children: type === "roteiro" ? "Roteiro Digital" : "Pacote"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/site/src/components/dashboard/PhonePreview.tsx",
                                                lineNumber: 95,
                                                columnNumber: 37
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/components/dashboard/PhonePreview.tsx",
                                            lineNumber: 94,
                                            columnNumber: 33
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/site/src/components/dashboard/PhonePreview.tsx",
                                    lineNumber: 82,
                                    columnNumber: 29
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "phone-content",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                            className: "phone-title phone-content-fade",
                                            style: {
                                                animationDelay: "0.06s",
                                                opacity: 0
                                            },
                                            children: title || "Título do " + (type === "roteiro" ? "Roteiro" : "Pacote")
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/components/dashboard/PhonePreview.tsx",
                                            lineNumber: 103,
                                            columnNumber: 33
                                        }, this),
                                        (destination || country) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "phone-location phone-content-fade",
                                            style: {
                                                animationDelay: "0.10s",
                                                opacity: 0
                                            },
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                    width: "10",
                                                    height: "10",
                                                    viewBox: "0 0 24 24",
                                                    fill: "none",
                                                    stroke: "currentColor",
                                                    strokeWidth: "2",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                            d: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/site/src/components/dashboard/PhonePreview.tsx",
                                                            lineNumber: 110,
                                                            columnNumber: 45
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                                            cx: "12",
                                                            cy: "10",
                                                            r: "3"
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/site/src/components/dashboard/PhonePreview.tsx",
                                                            lineNumber: 111,
                                                            columnNumber: 45
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/site/src/components/dashboard/PhonePreview.tsx",
                                                    lineNumber: 109,
                                                    columnNumber: 41
                                                }, this),
                                                destination,
                                                country ? `, ${country}` : ""
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/site/src/components/dashboard/PhonePreview.tsx",
                                            lineNumber: 108,
                                            columnNumber: 37
                                        }, this),
                                        subtitle && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "phone-subtitle phone-content-fade",
                                            style: {
                                                animationDelay: "0.14s",
                                                opacity: 0
                                            },
                                            children: subtitle
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/components/dashboard/PhonePreview.tsx",
                                            lineNumber: 117,
                                            columnNumber: 46
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "phone-meta-row phone-content-fade",
                                            style: {
                                                animationDelay: "0.18s",
                                                opacity: 0
                                            },
                                            children: [
                                                duration > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "phone-meta-chip",
                                                    children: [
                                                        "📅 ",
                                                        duration,
                                                        " ",
                                                        duration === 1 ? "dia" : "dias"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/site/src/components/dashboard/PhonePreview.tsx",
                                                    lineNumber: 121,
                                                    columnNumber: 41
                                                }, this),
                                                price > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "phone-meta-chip phone-meta-price",
                                                    children: formattedPrice
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/site/src/components/dashboard/PhonePreview.tsx",
                                                    lineNumber: 126,
                                                    columnNumber: 41
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/site/src/components/dashboard/PhonePreview.tsx",
                                            lineNumber: 119,
                                            columnNumber: 33
                                        }, this),
                                        (travelStyles.length > 0 || categories.length > 0) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "phone-tags phone-content-fade",
                                            style: {
                                                animationDelay: "0.22s",
                                                opacity: 0
                                            },
                                            children: [
                                                travelStyles.map((s)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "phone-tag",
                                                        children: s
                                                    }, s, false, {
                                                        fileName: "[project]/apps/site/src/components/dashboard/PhonePreview.tsx",
                                                        lineNumber: 136,
                                                        columnNumber: 45
                                                    }, this)),
                                                categories.map((c)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "phone-tag phone-tag-cat",
                                                        children: c
                                                    }, c, false, {
                                                        fileName: "[project]/apps/site/src/components/dashboard/PhonePreview.tsx",
                                                        lineNumber: 139,
                                                        columnNumber: 45
                                                    }, this))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/site/src/components/dashboard/PhonePreview.tsx",
                                            lineNumber: 134,
                                            columnNumber: 37
                                        }, this),
                                        highlights.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "phone-highlights phone-content-fade",
                                            style: {
                                                animationDelay: "0.26s",
                                                opacity: 0
                                            },
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "phone-section-label",
                                                    children: "Destaques"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/site/src/components/dashboard/PhonePreview.tsx",
                                                    lineNumber: 147,
                                                    columnNumber: 41
                                                }, this),
                                                highlights.slice(0, 3).map((h, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "phone-highlight-item",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "phone-highlight-dot"
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/site/src/components/dashboard/PhonePreview.tsx",
                                                                lineNumber: 150,
                                                                columnNumber: 49
                                                            }, this),
                                                            h
                                                        ]
                                                    }, i, true, {
                                                        fileName: "[project]/apps/site/src/components/dashboard/PhonePreview.tsx",
                                                        lineNumber: 149,
                                                        columnNumber: 45
                                                    }, this)),
                                                highlights.length > 3 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "phone-highlight-more",
                                                    children: [
                                                        "+",
                                                        highlights.length - 3,
                                                        " mais"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/site/src/components/dashboard/PhonePreview.tsx",
                                                    lineNumber: 155,
                                                    columnNumber: 45
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/site/src/components/dashboard/PhonePreview.tsx",
                                            lineNumber: 146,
                                            columnNumber: 37
                                        }, this),
                                        days.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "phone-days phone-content-fade",
                                            style: {
                                                animationDelay: "0.30s",
                                                opacity: 0
                                            },
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "phone-section-label",
                                                    children: "Itinerário"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/site/src/components/dashboard/PhonePreview.tsx",
                                                    lineNumber: 163,
                                                    columnNumber: 41
                                                }, this),
                                                days.slice(0, 3).map((day, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "phone-day-card",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "phone-day-badge",
                                                                children: [
                                                                    "Dia ",
                                                                    day.dayNumber || i + 1
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/apps/site/src/components/dashboard/PhonePreview.tsx",
                                                                lineNumber: 166,
                                                                columnNumber: 49
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "phone-day-title",
                                                                children: day.title || `Dia ${i + 1}`
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/site/src/components/dashboard/PhonePreview.tsx",
                                                                lineNumber: 167,
                                                                columnNumber: 49
                                                            }, this),
                                                            day.activities.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "phone-day-activities",
                                                                children: day.activities.slice(0, 2).map((act, j)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                        className: "phone-day-act",
                                                                        children: [
                                                                            act.time && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                className: "phone-act-time",
                                                                                children: act.time
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/apps/site/src/components/dashboard/PhonePreview.tsx",
                                                                                lineNumber: 172,
                                                                                columnNumber: 78
                                                                            }, this),
                                                                            act.title
                                                                        ]
                                                                    }, j, true, {
                                                                        fileName: "[project]/apps/site/src/components/dashboard/PhonePreview.tsx",
                                                                        lineNumber: 171,
                                                                        columnNumber: 61
                                                                    }, this))
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/site/src/components/dashboard/PhonePreview.tsx",
                                                                lineNumber: 169,
                                                                columnNumber: 53
                                                            }, this)
                                                        ]
                                                    }, i, true, {
                                                        fileName: "[project]/apps/site/src/components/dashboard/PhonePreview.tsx",
                                                        lineNumber: 165,
                                                        columnNumber: 45
                                                    }, this)),
                                                days.length > 3 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "phone-days-more",
                                                    children: [
                                                        "+",
                                                        days.length - 3,
                                                        " dias"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/site/src/components/dashboard/PhonePreview.tsx",
                                                    lineNumber: 181,
                                                    columnNumber: 45
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/site/src/components/dashboard/PhonePreview.tsx",
                                            lineNumber: 162,
                                            columnNumber: 37
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/site/src/components/dashboard/PhonePreview.tsx",
                                    lineNumber: 102,
                                    columnNumber: 29
                                }, this)
                            ]
                        }, contentKey.current, true, {
                            fileName: "[project]/apps/site/src/components/dashboard/PhonePreview.tsx",
                            lineNumber: 80,
                            columnNumber: 25
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/apps/site/src/components/dashboard/PhonePreview.tsx",
                        lineNumber: 76,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/site/src/components/dashboard/PhonePreview.tsx",
                lineNumber: 71,
                columnNumber: 13
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/site/src/components/dashboard/PhonePreview.tsx",
        lineNumber: 63,
        columnNumber: 9
    }, this);
}
}),
"[project]/apps/site/src/components/dashboard/QualityCoach.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>QualityCoach
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
"use client";
;
;
/* ─── Icons ─── */ const InfoIcon = ()=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        width: "18",
        height: "18",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                cx: "12",
                cy: "12",
                r: "10"
            }, void 0, false, {
                fileName: "[project]/apps/site/src/components/dashboard/QualityCoach.tsx",
                lineNumber: 20,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M12 16v-4"
            }, void 0, false, {
                fileName: "[project]/apps/site/src/components/dashboard/QualityCoach.tsx",
                lineNumber: 21,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M12 8h.01"
            }, void 0, false, {
                fileName: "[project]/apps/site/src/components/dashboard/QualityCoach.tsx",
                lineNumber: 22,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/apps/site/src/components/dashboard/QualityCoach.tsx",
        lineNumber: 19,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
const CloseIcon = ()=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        width: "20",
        height: "20",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
            d: "M18 6L6 18 M6 6l12 12"
        }, void 0, false, {
            fileName: "[project]/apps/site/src/components/dashboard/QualityCoach.tsx",
            lineNumber: 27,
            columnNumber: 9
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/apps/site/src/components/dashboard/QualityCoach.tsx",
        lineNumber: 26,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
const TrendingUpIcon = ()=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        width: "18",
        height: "18",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("polyline", {
                points: "23 6 13.5 15.5 8.5 10.5 1 18"
            }, void 0, false, {
                fileName: "[project]/apps/site/src/components/dashboard/QualityCoach.tsx",
                lineNumber: 32,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("polyline", {
                points: "17 6 23 6 23 12"
            }, void 0, false, {
                fileName: "[project]/apps/site/src/components/dashboard/QualityCoach.tsx",
                lineNumber: 33,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/apps/site/src/components/dashboard/QualityCoach.tsx",
        lineNumber: 31,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
/* ─── Particle burst on milestone ─── */ function Particles() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "quality-particles",
        "aria-hidden": "true",
        children: [
            1,
            2,
            3,
            4,
            5
        ].map((i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "quality-particle"
            }, i, false, {
                fileName: "[project]/apps/site/src/components/dashboard/QualityCoach.tsx",
                lineNumber: 41,
                columnNumber: 39
            }, this))
    }, void 0, false, {
        fileName: "[project]/apps/site/src/components/dashboard/QualityCoach.tsx",
        lineNumber: 40,
        columnNumber: 9
    }, this);
}
function QualityCoach({ score, tips, maxTips = 3 }) {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - score / 100 * circumference;
    const color = score >= 80 ? "#28C9BF" : score >= 50 ? "#F59E0B" : "#FF5252";
    const bgColor = score >= 80 ? "rgba(40,201,191,0.08)" : score >= 50 ? "rgba(245,158,11,0.08)" : "rgba(255,82,82,0.08)";
    const message = score >= 95 ? "Perfeito! 🏆 Pronto para publicar!" : score >= 80 ? "Excelente! Quase perfeito ✨" : score >= 60 ? "Bom progresso! Continue preenchendo 💪" : score >= 30 ? "Bom começo! Preencha mais campos 📝" : "Vamos começar! 🚀";
    const prevScore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(0);
    const [isMilestone, setIsMilestone] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [showParticles, setShowParticles] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [showInfo, setShowInfo] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        // Trigger milestone glow when crossing 80%
        const crossedMilestone = prevScore.current < 80 && score >= 80;
        if (crossedMilestone) {
            setIsMilestone(true);
            setShowParticles(true);
            setTimeout(()=>setIsMilestone(false), 1200);
            setTimeout(()=>setShowParticles(false), 1000);
        }
        prevScore.current = score;
    }, [
        score
    ]);
    const activeTips = tips.filter((t)=>t.condition).sort((a, b)=>a.priority - b.priority).slice(0, maxTips);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: `quality-coach ${isMilestone ? "milestone" : ""}`,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            position: "absolute",
                            top: "12px",
                            right: "12px",
                            zIndex: 10
                        },
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: ()=>setShowInfo(true),
                            className: "quality-info-btn",
                            style: {
                                color
                            },
                            title: "Como o score é calculado?",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(InfoIcon, {}, void 0, false, {
                                fileName: "[project]/apps/site/src/components/dashboard/QualityCoach.tsx",
                                lineNumber: 94,
                                columnNumber: 25
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/apps/site/src/components/dashboard/QualityCoach.tsx",
                            lineNumber: 88,
                            columnNumber: 21
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/apps/site/src/components/dashboard/QualityCoach.tsx",
                        lineNumber: 87,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: `quality-gauge ${isMilestone ? "milestone" : ""}`,
                        style: {
                            "--qc-color": color,
                            "--qc-bg": bgColor
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    position: "relative"
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                        width: "100",
                                        height: "100",
                                        viewBox: "0 0 100 100",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                                cx: "50",
                                                cy: "50",
                                                r: radius,
                                                fill: "none",
                                                stroke: "rgba(0,0,0,0.06)",
                                                strokeWidth: "6"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/site/src/components/dashboard/QualityCoach.tsx",
                                                lineNumber: 104,
                                                columnNumber: 29
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                                cx: "50",
                                                cy: "50",
                                                r: radius,
                                                fill: "none",
                                                stroke: color,
                                                strokeWidth: "6",
                                                strokeLinecap: "round",
                                                strokeDasharray: circumference,
                                                strokeDashoffset: offset,
                                                transform: "rotate(-90 50 50)",
                                                style: {
                                                    transition: "stroke-dashoffset 0.7s cubic-bezier(0.4,0,0.2,1), stroke 0.4s ease"
                                                }
                                            }, void 0, false, {
                                                fileName: "[project]/apps/site/src/components/dashboard/QualityCoach.tsx",
                                                lineNumber: 106,
                                                columnNumber: 29
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/site/src/components/dashboard/QualityCoach.tsx",
                                        lineNumber: 102,
                                        columnNumber: 25
                                    }, this),
                                    showParticles && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Particles, {}, void 0, false, {
                                        fileName: "[project]/apps/site/src/components/dashboard/QualityCoach.tsx",
                                        lineNumber: 116,
                                        columnNumber: 43
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/site/src/components/dashboard/QualityCoach.tsx",
                                lineNumber: 101,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "quality-gauge-value",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "quality-gauge-number",
                                        style: {
                                            color
                                        },
                                        children: score
                                    }, score, false, {
                                        fileName: "[project]/apps/site/src/components/dashboard/QualityCoach.tsx",
                                        lineNumber: 119,
                                        columnNumber: 25
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "quality-gauge-percent",
                                        children: "%"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/site/src/components/dashboard/QualityCoach.tsx",
                                        lineNumber: 120,
                                        columnNumber: 25
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/site/src/components/dashboard/QualityCoach.tsx",
                                lineNumber: 118,
                                columnNumber: 21
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/site/src/components/dashboard/QualityCoach.tsx",
                        lineNumber: 99,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "quality-message",
                        children: message
                    }, message, false, {
                        fileName: "[project]/apps/site/src/components/dashboard/QualityCoach.tsx",
                        lineNumber: 125,
                        columnNumber: 17
                    }, this),
                    activeTips.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "quality-tips",
                        children: activeTips.map((tip, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "quality-tip",
                                style: {
                                    animationDelay: `${i * 0.05}s`
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "quality-tip-icon",
                                        children: "💡"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/site/src/components/dashboard/QualityCoach.tsx",
                                        lineNumber: 132,
                                        columnNumber: 33
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "quality-tip-text",
                                        children: tip.text
                                    }, void 0, false, {
                                        fileName: "[project]/apps/site/src/components/dashboard/QualityCoach.tsx",
                                        lineNumber: 133,
                                        columnNumber: 33
                                    }, this)
                                ]
                            }, tip.text, true, {
                                fileName: "[project]/apps/site/src/components/dashboard/QualityCoach.tsx",
                                lineNumber: 131,
                                columnNumber: 29
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/apps/site/src/components/dashboard/QualityCoach.tsx",
                        lineNumber: 129,
                        columnNumber: 21
                    }, this),
                    activeTips.length === 0 && score > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "quality-tip",
                        style: {
                            background: "rgba(40,201,191,0.06)",
                            borderColor: "rgba(40,201,191,0.18)"
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "quality-tip-icon",
                                children: "✅"
                            }, void 0, false, {
                                fileName: "[project]/apps/site/src/components/dashboard/QualityCoach.tsx",
                                lineNumber: 142,
                                columnNumber: 25
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "quality-tip-text",
                                style: {
                                    color: "#1FA89F"
                                },
                                children: "Todos os pontos preenchidos!"
                            }, void 0, false, {
                                fileName: "[project]/apps/site/src/components/dashboard/QualityCoach.tsx",
                                lineNumber: 143,
                                columnNumber: 25
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/site/src/components/dashboard/QualityCoach.tsx",
                        lineNumber: 141,
                        columnNumber: 21
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/site/src/components/dashboard/QualityCoach.tsx",
                lineNumber: 85,
                columnNumber: 13
            }, this),
            showInfo && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "qc-modal-overlay",
                onClick: ()=>setShowInfo(false),
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "qc-modal-content",
                    onClick: (e)=>e.stopPropagation(),
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            className: "qc-modal-close",
                            onClick: ()=>setShowInfo(false),
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(CloseIcon, {}, void 0, false, {
                                fileName: "[project]/apps/site/src/components/dashboard/QualityCoach.tsx",
                                lineNumber: 154,
                                columnNumber: 95
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/apps/site/src/components/dashboard/QualityCoach.tsx",
                            lineNumber: 154,
                            columnNumber: 25
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "qc-modal-header",
                            style: {
                                borderBottomColor: bgColor
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "qc-modal-icon",
                                    style: {
                                        background: bgColor,
                                        color
                                    },
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(TrendingUpIcon, {}, void 0, false, {
                                        fileName: "[project]/apps/site/src/components/dashboard/QualityCoach.tsx",
                                        lineNumber: 157,
                                        columnNumber: 99
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/apps/site/src/components/dashboard/QualityCoach.tsx",
                                    lineNumber: 157,
                                    columnNumber: 29
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                            className: "qc-modal-title",
                                            children: "Índice de Qualidade VAMO"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/components/dashboard/QualityCoach.tsx",
                                            lineNumber: 159,
                                            columnNumber: 33
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "qc-modal-subtitle",
                                            children: "Descubra como seu score afeta suas vendas."
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/components/dashboard/QualityCoach.tsx",
                                            lineNumber: 160,
                                            columnNumber: 33
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/site/src/components/dashboard/QualityCoach.tsx",
                                    lineNumber: 158,
                                    columnNumber: 29
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/site/src/components/dashboard/QualityCoach.tsx",
                            lineNumber: 156,
                            columnNumber: 25
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "qc-modal-body",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    style: {
                                        fontSize: "14px",
                                        color: "#475569",
                                        lineHeight: 1.6,
                                        marginBottom: "24px"
                                    },
                                    children: [
                                        "O ",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                            children: "Score VAMO"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/components/dashboard/QualityCoach.tsx",
                                            lineNumber: 166,
                                            columnNumber: 35
                                        }, this),
                                        " (0 a 100%) mede o nível de detalhamento do seu produto. Pacotes e Roteiros com ",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                            children: 'Score acima de 80% recebem o selo "Destaque"'
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/components/dashboard/QualityCoach.tsx",
                                            lineNumber: 167,
                                            columnNumber: 56
                                        }, this),
                                        ", tendo prioridade nas buscas e convertendo até 2x mais vendas por passarem mais confiança."
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/site/src/components/dashboard/QualityCoach.tsx",
                                    lineNumber: 165,
                                    columnNumber: 29
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                    style: {
                                        fontSize: "14px",
                                        fontWeight: "700",
                                        color: "#1E293B",
                                        marginBottom: "16px",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.05em"
                                    },
                                    children: "Calculo do Score"
                                }, void 0, false, {
                                    fileName: "[project]/apps/site/src/components/dashboard/QualityCoach.tsx",
                                    lineNumber: 171,
                                    columnNumber: 29
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: {
                                        display: "grid",
                                        gap: "12px"
                                    },
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "qc-modal-rule",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "qc-rule-badge",
                                                    style: {
                                                        background: "rgba(239,68,68,0.1)",
                                                        color: "#DC2626"
                                                    },
                                                    children: "Até 40%"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/site/src/components/dashboard/QualityCoach.tsx",
                                                    lineNumber: 175,
                                                    columnNumber: 37
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "qc-rule-text",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                            children: "Informações Básicas:"
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/site/src/components/dashboard/QualityCoach.tsx",
                                                            lineNumber: 177,
                                                            columnNumber: 41
                                                        }, this),
                                                        " Título, Destino, Preço, Duração e Fotos. (Obrigatório para publicar)."
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/site/src/components/dashboard/QualityCoach.tsx",
                                                    lineNumber: 176,
                                                    columnNumber: 37
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/site/src/components/dashboard/QualityCoach.tsx",
                                            lineNumber: 174,
                                            columnNumber: 33
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "qc-modal-rule",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "qc-rule-badge",
                                                    style: {
                                                        background: "rgba(245,158,11,0.1)",
                                                        color: "#D97706"
                                                    },
                                                    children: "Até 75%"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/site/src/components/dashboard/QualityCoach.tsx",
                                                    lineNumber: 181,
                                                    columnNumber: 37
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "qc-rule-text",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                            children: "Atributos de Valor:"
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/site/src/components/dashboard/QualityCoach.tsx",
                                                            lineNumber: 183,
                                                            columnNumber: 41
                                                        }, this),
                                                        " Inclusões estruturadas, Estilos de Viagem selecionados e Categorias bem definidas."
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/site/src/components/dashboard/QualityCoach.tsx",
                                                    lineNumber: 182,
                                                    columnNumber: 37
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/site/src/components/dashboard/QualityCoach.tsx",
                                            lineNumber: 180,
                                            columnNumber: 33
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "qc-modal-rule",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "qc-rule-badge",
                                                    style: {
                                                        background: "rgba(40,201,191,0.1)",
                                                        color: "#1FA89F"
                                                    },
                                                    children: "100%"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/site/src/components/dashboard/QualityCoach.tsx",
                                                    lineNumber: 187,
                                                    columnNumber: 37
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "qc-rule-text",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                            children: "Riqueza de Detalhes:"
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/site/src/components/dashboard/QualityCoach.tsx",
                                                            lineNumber: 189,
                                                            columnNumber: 41
                                                        }, this),
                                                        " Textos longos na Descrição, Política de Cancelamento explicada e Destaques bem pontuados."
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/site/src/components/dashboard/QualityCoach.tsx",
                                                    lineNumber: 188,
                                                    columnNumber: 37
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/site/src/components/dashboard/QualityCoach.tsx",
                                            lineNumber: 186,
                                            columnNumber: 33
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/site/src/components/dashboard/QualityCoach.tsx",
                                    lineNumber: 173,
                                    columnNumber: 29
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: {
                                        marginTop: "24px",
                                        padding: "16px",
                                        background: "#F8FAFC",
                                        borderRadius: "12px",
                                        border: "1px solid #E2E8F0"
                                    },
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        style: {
                                            margin: 0,
                                            fontSize: "13px",
                                            color: "#64748B",
                                            fontStyle: "italic",
                                            textAlign: "center"
                                        },
                                        children: "Dica: Siga as lâmpadas amarelas (💡) indicadas no painel. Elas são atalhos diretos para os campos que mais geram pontuação!"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/site/src/components/dashboard/QualityCoach.tsx",
                                        lineNumber: 195,
                                        columnNumber: 33
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/apps/site/src/components/dashboard/QualityCoach.tsx",
                                    lineNumber: 194,
                                    columnNumber: 29
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/site/src/components/dashboard/QualityCoach.tsx",
                            lineNumber: 164,
                            columnNumber: 25
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/site/src/components/dashboard/QualityCoach.tsx",
                    lineNumber: 153,
                    columnNumber: 21
                }, this)
            }, void 0, false, {
                fileName: "[project]/apps/site/src/components/dashboard/QualityCoach.tsx",
                lineNumber: 152,
                columnNumber: 17
            }, this)
        ]
    }, void 0, true);
}
}),
"[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>PackageEditorPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$site$2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/site/src/lib/api.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$site$2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/site/src/lib/auth.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$site$2f$src$2f$components$2f$dashboard$2f$StepperNav$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/site/src/components/dashboard/StepperNav.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$site$2f$src$2f$components$2f$dashboard$2f$PhonePreview$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/site/src/components/dashboard/PhonePreview.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$site$2f$src$2f$components$2f$dashboard$2f$QualityCoach$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/site/src/components/dashboard/QualityCoach.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$dollar$2d$sign$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__DollarSign$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/dollar-sign.js [app-ssr] (ecmascript) <export default as DollarSign>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$tag$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Tag$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/tag.js [app-ssr] (ecmascript) <export default as Tag>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$text$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__FileText$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/file-text.js [app-ssr] (ecmascript) <export default as FileText>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$map$2d$pin$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__MapPin$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/map-pin.js [app-ssr] (ecmascript) <export default as MapPin>");
"use client";
;
;
;
;
;
;
;
;
;
const SECTIONS = [
    {
        key: "basicos",
        icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$map$2d$pin$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__MapPin$3e$__["MapPin"], {
            size: 16
        }, void 0, false, {
            fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
            lineNumber: 19,
            columnNumber: 29
        }, ("TURBOPACK compile-time value", void 0)),
        title: "Básicos"
    },
    {
        key: "perfil",
        icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$tag$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Tag$3e$__["Tag"], {
            size: 16
        }, void 0, false, {
            fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
            lineNumber: 20,
            columnNumber: 28
        }, ("TURBOPACK compile-time value", void 0)),
        title: "Perfil do Pacote"
    },
    {
        key: "oferta",
        icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$dollar$2d$sign$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__DollarSign$3e$__["DollarSign"], {
            size: 16
        }, void 0, false, {
            fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
            lineNumber: 21,
            columnNumber: 28
        }, ("TURBOPACK compile-time value", void 0)),
        title: "Preço e Oferta"
    },
    {
        key: "docs",
        icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$text$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__FileText$3e$__["FileText"], {
            size: 16
        }, void 0, false, {
            fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
            lineNumber: 22,
            columnNumber: 26
        }, ("TURBOPACK compile-time value", void 0)),
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
    "Estados Unidos",
    "Canadá",
    "México",
    "Costa Rica",
    "República Dominicana",
    "França",
    "Itália",
    "Espanha",
    "Portugal",
    "Alemanha",
    "Reino Unido",
    "Holanda",
    "Suíça",
    "Áustria",
    "Grécia",
    "Turquia",
    "Croácia",
    "República Tcheca",
    "Polônia",
    "Suécia",
    "Noruega",
    "Dinamarca",
    "Japão",
    "China",
    "Tailândia",
    "Índia",
    "Indonésia",
    "Coreia do Sul",
    "Vietnã",
    "Singapura",
    "Filipinas",
    "Maldivas",
    "Emirados Árabes",
    "Egito",
    "África do Sul",
    "Marrocos",
    "Quênia",
    "Tanzânia",
    "Austrália",
    "Nova Zelândia"
].sort();
const CONTINENT_MAP = {
    'Brasil': 'América do Sul',
    'Argentina': 'América do Sul',
    'Chile': 'América do Sul',
    'Colômbia': 'América do Sul',
    'Peru': 'América do Sul',
    'Uruguai': 'América do Sul',
    'Estados Unidos': 'América do Norte',
    'Canadá': 'América do Norte',
    'México': 'América do Norte',
    'Costa Rica': 'América Central',
    'República Dominicana': 'América Central',
    'França': 'Europa',
    'Itália': 'Europa',
    'Espanha': 'Europa',
    'Portugal': 'Europa',
    'Alemanha': 'Europa',
    'Reino Unido': 'Europa',
    'Holanda': 'Europa',
    'Suíça': 'Europa',
    'Áustria': 'Europa',
    'Grécia': 'Europa',
    'Turquia': 'Europa',
    'Croácia': 'Europa',
    'República Tcheca': 'Europa',
    'Polônia': 'Europa',
    'Suécia': 'Europa',
    'Noruega': 'Europa',
    'Dinamarca': 'Europa',
    'Japão': 'Ásia',
    'China': 'Ásia',
    'Tailândia': 'Ásia',
    'Índia': 'Ásia',
    'Indonésia': 'Ásia',
    'Coreia do Sul': 'Ásia',
    'Vietnã': 'Ásia',
    'Singapura': 'Ásia',
    'Filipinas': 'Ásia',
    'Maldivas': 'Ásia',
    'Emirados Árabes': 'Ásia',
    'Egito': 'África',
    'África do Sul': 'África',
    'Marrocos': 'África',
    'Quênia': 'África',
    'Tanzânia': 'África',
    'Austrália': 'Oceania',
    'Nova Zelândia': 'Oceania'
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
    },
    {
        key: "conforto",
        label: "Conforto"
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
    "BRL",
    "USD",
    "EUR",
    "GBP"
];
function getDurationLabel(days) {
    if (days <= 3) return "Fim de semana";
    if (days <= 6) return "Curta duração";
    if (days === 7) return "7 dias";
    if (days <= 14) return "8–14 dias";
    if (days === 15) return "15 dias";
    return "+15 dias";
}
function calcQualityScore(form) {
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
    a(form.includedItems, 5);
    c(form.cancellationPolicy, 3);
    c(form.whatsappOfficial, 2);
    return Math.min(s, 100);
}
const SECTION_TIPS = {
    basicos: [
        "Escolha um país e cidade bem conhecidos para maior visibilidade",
        "Multi-destino atrai viajantes que querem conhecer várias cidades de uma vez",
        "Duração e noites são calculadas automaticamente"
    ],
    perfil: [
        "Selecione até 3 estilos para atingir o público certo",
        "Luxo e Família têm os maiores tickets médios",
        "Máximo 5 categorias para não diluir o perfil do pacote"
    ],
    oferta: [
        "Pacotes com cancelamento gratuito convertem 40% mais",
        "Parcele em até 12x para facilitar a decisão de compra",
        "Liste tudo que está incluso — eleva a percepção de valor"
    ],
    docs: [
        "O WhatsApp oficial é o canal de contato mostrado ao comprador após a compra",
        "Voucher e e-ticket são enviados automaticamente após o pagamento"
    ]
};
const EMPTY_FORM = {
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
    currency: "BRL",
    installments: 12,
    cancellationPolicy: "",
    hasFreeCancellation: false,
    isAllInclusive: false,
    featured: false,
    includedItems: [],
    highlights: [],
    perfectFor: [],
    notRecommendedFor: [],
    importantInfo: [],
    whatsappOfficial: "",
    autoMessage: "",
    voucherUrl: "",
    eticketUrl: "",
    status: "ACTIVE"
};
function PackageEditorPage({ params }) {
    const { id } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["use"])(params);
    const isNew = id === "new";
    const [activeStep, setActiveStep] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(0);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(!isNew);
    const [saving, setSaving] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [dirty, setDirty] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [toast, setToast] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [form, setForm] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({
        ...EMPTY_FORM
    });
    const [cityInput, setCityInput] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [newInclude, setNewInclude] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [newHighlight, setNewHighlight] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const markDirty = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>setDirty(true), []);
    const upd = (field, val)=>{
        setForm((f)=>({
                ...f,
                [field]: val
            }));
        markDirty();
    };
    const showToast = (msg, type)=>{
        setToast({
            msg,
            type
        });
        setTimeout(()=>setToast(null), 3500);
    };
    // ─── Load session agencyId ───
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        (async ()=>{
            try {
                const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$site$2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getSession"])();
                if (session?.agency?.id) setForm((f)=>({
                        ...f,
                        agencyId: session.agency.id
                    }));
            } catch  {}
        })();
    }, []);
    // ─── Load data ───
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (isNew) return;
        (async ()=>{
            try {
                const data = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$site$2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getPackageById"])(id);
                setForm((prev)=>({
                        ...prev,
                        ...data,
                        priceMin: data.price?.min ?? data.priceMin ?? 0,
                        priceMax: data.price?.max ?? data.priceMax ?? 0,
                        travelStyles: data.travelStyles || [],
                        categories: data.categories || [],
                        additionalCities: data.additionalCities || [],
                        includedItems: data.includedItems || data.includes || [],
                        highlights: data.highlights || [],
                        perfectFor: data.perfectFor || [],
                        notRecommendedFor: data.notRecommendedFor || [],
                        importantInfo: data.importantInfo || []
                    }));
            } catch  {
                showToast("Erro ao carregar pacote", "error");
            } finally{
                setLoading(false);
            }
        })();
    }, [
        id,
        isNew
    ]);
    // ─── Auto country → continent ───
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (form.country) {
            const cont = CONTINENT_MAP[form.country] || "";
            if (cont !== form.continent) setForm((f)=>({
                    ...f,
                    continent: cont
                }));
        }
    }, [
        form.country
    ]);
    // ─── Auto duration → nights ───
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const n = form.duration > 0 ? form.duration - 1 : 0;
        if (n !== form.nights) setForm((f)=>({
                ...f,
                nights: n
            }));
    }, [
        form.duration
    ]);
    // ─── Save ───
    const handleSave = async ()=>{
        if (!form.title.trim() || !form.destination || !form.country) {
            showToast("Preencha título, cidade e país", "error");
            return;
        }
        if (form.priceMin <= 0) {
            showToast("Defina um preço válido", "error");
            return;
        }
        setSaving(true);
        try {
            const payload = {
                ...form,
                qualityScore: calcQualityScore(form)
            };
            if (isNew) {
                await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$site$2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createPackage"])(payload);
                showToast("Pacote criado com sucesso!", "success");
                window.location.href = "/agencia/pacotes";
            } else {
                await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$site$2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["updatePackage"])(id, payload);
                showToast("Alterações salvas!", "success");
                setDirty(false);
            }
        } catch (err) {
            showToast(err?.message || "Erro ao salvar", "error");
        } finally{
            setSaving(false);
        }
    };
    // ─── Chip toggle ───
    const toggleChip = (field, val, max)=>{
        setForm((f)=>{
            const cur = [
                ...f[field]
            ];
            if (cur.includes(val)) return {
                ...f,
                [field]: cur.filter((v)=>v !== val)
            };
            if (cur.length >= max) return f;
            return {
                ...f,
                [field]: [
                    ...cur,
                    val
                ]
            };
        });
        markDirty();
    };
    // ─── Tag helpers ───
    const addTag = (field, val, setter)=>{
        if (!val.trim()) return;
        // Support comma-separated batch entry
        const items = val.split(",").map((v)=>v.trim()).filter(Boolean);
        setForm((f)=>({
                ...f,
                [field]: [
                    ...f[field],
                    ...items
                ]
            }));
        setter("");
        markDirty();
    };
    const removeTag = (field, idx)=>{
        setForm((f)=>({
                ...f,
                [field]: f[field].filter((_, i)=>i !== idx)
            }));
        markDirty();
    };
    // ─── Section completion ───
    const isSectionComplete = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((key)=>{
        switch(key){
            case "basicos":
                return !!(form.country && form.destination && form.duration >= 1);
            case "perfil":
                return form.travelStyles.length >= 1 && form.categories.length >= 1;
            case "oferta":
                return form.priceMin > 0 && !!form.description.trim() && form.includedItems.length > 0;
            case "docs":
                return !!form.whatsappOfficial;
            default:
                return false;
        }
    }, [
        form
    ]);
    const completedSteps = new Set(SECTIONS.filter((s)=>isSectionComplete(s.key)).map((s)=>s.key));
    const qualityScore = calcQualityScore(form);
    // ─── Stepper navigation ───
    const formScrollRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const handleStepClick = (i)=>{
        setActiveStep(i);
        setTimeout(()=>formScrollRef.current?.scrollTo({
                top: 0,
                behavior: "smooth"
            }), 50);
    };
    const handleNext = ()=>{
        if (activeStep < SECTIONS.length - 1) setActiveStep((s)=>s + 1);
    };
    const handlePrev = ()=>{
        if (activeStep > 0) setActiveStep((s)=>s - 1);
    };
    const qualityTips = [
        {
            condition: !form.title,
            text: "Adicione um título atraente para o pacote",
            priority: 1
        },
        {
            condition: !form.destination,
            text: "Informe a cidade de destino principal",
            priority: 1
        },
        {
            condition: !form.country,
            text: "Selecione o país de destino",
            priority: 1
        },
        {
            condition: form.priceMin <= 0,
            text: "Defina o preço base por pessoa",
            priority: 2
        },
        {
            condition: !form.description.trim(),
            text: "Escreva uma descrição curta cativante",
            priority: 2
        },
        {
            condition: form.travelStyles.length === 0,
            text: "Escolha pelo menos 1 estilo de viagem",
            priority: 3
        },
        {
            condition: form.categories.length === 0,
            text: "Selecione ao menos 1 categoria temática",
            priority: 3
        },
        {
            condition: form.includedItems.length === 0,
            text: "Liste o que está incluso no pacote",
            priority: 4
        },
        {
            condition: !form.whatsappOfficial,
            text: "Informe o WhatsApp de contato oficial",
            priority: 5
        }
    ];
    // ─── Section content ───
    const renderSection = (key)=>{
        switch(key){
            case "basicos":
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
                                            children: "País *"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                            lineNumber: 276,
                                            columnNumber: 25
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                            className: "form-input",
                                            value: form.country,
                                            onChange: (e)=>upd("country", e.target.value),
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: "",
                                                    children: "Selecione o país"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                                    lineNumber: 278,
                                                    columnNumber: 29
                                                }, this),
                                                COUNTRIES.map((c)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                        value: c,
                                                        children: c
                                                    }, c, false, {
                                                        fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                                        lineNumber: 279,
                                                        columnNumber: 49
                                                    }, this))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                            lineNumber: 277,
                                            columnNumber: 25
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                    lineNumber: 275,
                                    columnNumber: 21
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "form-group",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: "form-label",
                                            children: "Continente"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                            lineNumber: 283,
                                            columnNumber: 25
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            className: "form-input",
                                            value: form.continent,
                                            readOnly: true,
                                            style: {
                                                opacity: 0.6
                                            }
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                            lineNumber: 284,
                                            columnNumber: 25
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                    lineNumber: 282,
                                    columnNumber: 21
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                            lineNumber: 274,
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
                                            children: "Cidade Principal *"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                            lineNumber: 289,
                                            columnNumber: 25
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            className: "form-input",
                                            value: form.destination,
                                            onChange: (e)=>upd("destination", e.target.value),
                                            placeholder: "Ex: Paris, Roma..."
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                            lineNumber: 290,
                                            columnNumber: 25
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                    lineNumber: 288,
                                    columnNumber: 21
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "form-group",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: "form-label",
                                            children: "Aeroporto"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                            lineNumber: 293,
                                            columnNumber: 25
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            className: "form-input",
                                            value: form.airport,
                                            onChange: (e)=>upd("airport", e.target.value),
                                            placeholder: "Ex: CDG, GRU"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                            lineNumber: 294,
                                            columnNumber: 25
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                    lineNumber: 292,
                                    columnNumber: 21
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                            lineNumber: 287,
                            columnNumber: 17
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "form-row",
                            style: {
                                marginTop: 8
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "form-group",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: "form-label",
                                            children: "Número de dias *"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                            lineNumber: 299,
                                            columnNumber: 25
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            className: "form-input",
                                            type: "number",
                                            min: 1,
                                            value: form.duration,
                                            onChange: (e)=>upd("duration", parseInt(e.target.value) || 1)
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                            lineNumber: 300,
                                            columnNumber: 25
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                    lineNumber: 298,
                                    columnNumber: 21
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "form-group",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: "form-label",
                                            children: "Noites"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                            lineNumber: 303,
                                            columnNumber: 25
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            className: "form-input",
                                            type: "number",
                                            value: form.nights,
                                            readOnly: true,
                                            style: {
                                                opacity: 0.6
                                            }
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                            lineNumber: 304,
                                            columnNumber: 25
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                    lineNumber: 302,
                                    columnNumber: 21
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "form-group",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: "form-label",
                                            children: "Classificação"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                            lineNumber: 307,
                                            columnNumber: 25
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "editor-duration-badge",
                                            style: {
                                                marginTop: 8
                                            },
                                            children: form.duration >= 1 ? getDurationLabel(form.duration) : "—"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                            lineNumber: 308,
                                            columnNumber: 25
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                    lineNumber: 306,
                                    columnNumber: 21
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                            lineNumber: 297,
                            columnNumber: 17
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "form-group",
                            style: {
                                marginTop: 16
                            },
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "editor-toggle-row",
                                style: {
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "editor-toggle",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                type: "checkbox",
                                                checked: form.multiDestination,
                                                onChange: (e)=>upd("multiDestination", e.target.checked)
                                            }, void 0, false, {
                                                fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                                lineNumber: 314,
                                                columnNumber: 29
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "editor-toggle-track"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                                lineNumber: 315,
                                                columnNumber: 29
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "editor-toggle-thumb"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                                lineNumber: 315,
                                                columnNumber: 69
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                        lineNumber: 313,
                                        columnNumber: 25
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "form-label",
                                        style: {
                                            margin: 0
                                        },
                                        children: "Roteiro Multi-destino"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                        lineNumber: 317,
                                        columnNumber: 25
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                lineNumber: 312,
                                columnNumber: 21
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                            lineNumber: 311,
                            columnNumber: 17
                        }, this),
                        form.multiDestination && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "form-group",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    className: "form-label",
                                    children: "Cidades Adicionais"
                                }, void 0, false, {
                                    fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                    lineNumber: 322,
                                    columnNumber: 25
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "editor-tag-list",
                                    children: form.additionalCities.map((c, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "editor-tag",
                                            children: [
                                                c,
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    onClick: ()=>removeTag("additionalCities", i),
                                                    children: "×"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                                    lineNumber: 325,
                                                    columnNumber: 73
                                                }, this)
                                            ]
                                        }, i, true, {
                                            fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                            lineNumber: 325,
                                            columnNumber: 33
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                    lineNumber: 323,
                                    columnNumber: 25
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "editor-tag-input-row",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            className: "form-input",
                                            value: cityInput,
                                            onChange: (e)=>setCityInput(e.target.value),
                                            onKeyDown: (e)=>{
                                                if (e.key === "Enter") {
                                                    e.preventDefault();
                                                    addTag("additionalCities", cityInput, setCityInput);
                                                }
                                            },
                                            placeholder: "Adicionar cidade (pressione Enter)"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                            lineNumber: 329,
                                            columnNumber: 29
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            className: "btn-add-item",
                                            onClick: ()=>addTag("additionalCities", cityInput, setCityInput),
                                            children: "+"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                            lineNumber: 332,
                                            columnNumber: 29
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                    lineNumber: 328,
                                    columnNumber: 25
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                            lineNumber: 321,
                            columnNumber: 21
                        }, this)
                    ]
                }, void 0, true);
            case "perfil":
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "form-group",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    className: "form-label",
                                    children: "Estilo de Viagem"
                                }, void 0, false, {
                                    fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                    lineNumber: 340,
                                    columnNumber: 21
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "form-helper",
                                    children: [
                                        "Selecione até 3 estilos (",
                                        form.travelStyles.length,
                                        "/3)"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                    lineNumber: 341,
                                    columnNumber: 21
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "editor-chip-grid",
                                    style: {
                                        marginBottom: 24
                                    },
                                    children: TRAVEL_STYLES.map((ts)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            className: `editor-chip ${form.travelStyles.includes(ts.key) ? "active" : ""}`,
                                            onClick: ()=>toggleChip("travelStyles", ts.key, 3),
                                            disabled: !form.travelStyles.includes(ts.key) && form.travelStyles.length >= 3,
                                            children: ts.label
                                        }, ts.key, false, {
                                            fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                            lineNumber: 344,
                                            columnNumber: 29
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                    lineNumber: 342,
                                    columnNumber: 21
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                            lineNumber: 339,
                            columnNumber: 17
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "form-group",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    className: "form-label",
                                    children: "Categorias Temáticas"
                                }, void 0, false, {
                                    fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                    lineNumber: 354,
                                    columnNumber: 21
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "form-helper",
                                    children: [
                                        "Mínimo 1, máximo 5 (",
                                        form.categories.length,
                                        "/5)"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                    lineNumber: 355,
                                    columnNumber: 21
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "editor-chip-grid",
                                    children: CATEGORY_OPTIONS.map((cat)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            className: `editor-chip ${form.categories.includes(cat.key) ? "active" : ""}`,
                                            onClick: ()=>toggleChip("categories", cat.key, 5),
                                            disabled: !form.categories.includes(cat.key) && form.categories.length >= 5,
                                            children: cat.label
                                        }, cat.key, false, {
                                            fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                            lineNumber: 358,
                                            columnNumber: 29
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                    lineNumber: 356,
                                    columnNumber: 21
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                            lineNumber: 353,
                            columnNumber: 17
                        }, this)
                    ]
                }, void 0, true);
            case "oferta":
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
                                            children: "Preço base por pessoa *"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                            lineNumber: 372,
                                            columnNumber: 25
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            className: "form-input",
                                            type: "number",
                                            min: 0,
                                            value: form.priceMin || "",
                                            onChange: (e)=>upd("priceMin", parseFloat(e.target.value) || 0)
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                            lineNumber: 373,
                                            columnNumber: 25
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                    lineNumber: 371,
                                    columnNumber: 21
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "form-group",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: "form-label",
                                            children: "Promoção (opcional)"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                            lineNumber: 376,
                                            columnNumber: 25
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            className: "form-input",
                                            type: "number",
                                            min: 0,
                                            value: form.promoPrice ?? "",
                                            onChange: (e)=>upd("promoPrice", e.target.value ? parseFloat(e.target.value) : null),
                                            placeholder: "Deixe vazio se não houver"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                            lineNumber: 377,
                                            columnNumber: 25
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                    lineNumber: 375,
                                    columnNumber: 21
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "form-group",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: "form-label",
                                            children: "Moeda"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                            lineNumber: 380,
                                            columnNumber: 25
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                            className: "form-input",
                                            value: form.currency,
                                            onChange: (e)=>upd("currency", e.target.value),
                                            children: CURRENCIES.map((c)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: c,
                                                    children: c
                                                }, c, false, {
                                                    fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                                    lineNumber: 382,
                                                    columnNumber: 50
                                                }, this))
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                            lineNumber: 381,
                                            columnNumber: 25
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                    lineNumber: 379,
                                    columnNumber: 21
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                            lineNumber: 370,
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
                                            children: "Preço máximo estimado"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                            lineNumber: 388,
                                            columnNumber: 25
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            className: "form-input",
                                            type: "number",
                                            min: 0,
                                            value: form.priceMax || "",
                                            onChange: (e)=>upd("priceMax", parseFloat(e.target.value) || 0)
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                            lineNumber: 389,
                                            columnNumber: 25
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                    lineNumber: 387,
                                    columnNumber: 21
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "form-group",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: "form-label",
                                            children: "Parcelas (máx)"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                            lineNumber: 392,
                                            columnNumber: 25
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            className: "form-input",
                                            type: "number",
                                            min: 1,
                                            max: 24,
                                            value: form.installments,
                                            onChange: (e)=>upd("installments", parseInt(e.target.value) || 1)
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                            lineNumber: 393,
                                            columnNumber: 25
                                        }, this),
                                        form.installments > 0 && form.priceMin > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "form-helper",
                                            children: [
                                                "Até ",
                                                form.installments,
                                                "x de ",
                                                form.currency === "BRL" ? "R$" : form.currency,
                                                " ",
                                                (form.priceMin / form.installments).toFixed(2)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                            lineNumber: 394,
                                            columnNumber: 72
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                    lineNumber: 391,
                                    columnNumber: 21
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                            lineNumber: 386,
                            columnNumber: 17
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                padding: "16px 0",
                                borderTop: "1px solid rgba(226, 232, 240, 0.6)",
                                borderBottom: "1px solid rgba(226, 232, 240, 0.6)",
                                margin: "20px 0"
                            },
                            children: [
                                {
                                    label: "Cancelamento gratuito",
                                    field: "hasFreeCancellation",
                                    val: form.hasFreeCancellation
                                },
                                {
                                    label: "All Inclusive",
                                    field: "isAllInclusive",
                                    val: form.isAllInclusive
                                },
                                {
                                    label: "Em destaque",
                                    field: "featured",
                                    val: form.featured
                                }
                            ].map((t, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "editor-toggle-row",
                                    style: {
                                        padding: "8px 0",
                                        borderBottom: i < 2 ? "1px solid rgba(226, 232, 240, 0.3)" : "none"
                                    },
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "editor-toggle-info",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "editor-toggle-label",
                                                children: t.label
                                            }, void 0, false, {
                                                fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                                lineNumber: 405,
                                                columnNumber: 65
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                            lineNumber: 405,
                                            columnNumber: 29
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: "editor-toggle",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "checkbox",
                                                    checked: t.val,
                                                    onChange: (e)=>upd(t.field, e.target.checked)
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                                    lineNumber: 407,
                                                    columnNumber: 33
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "editor-toggle-track"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                                    lineNumber: 408,
                                                    columnNumber: 33
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "editor-toggle-thumb"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                                    lineNumber: 408,
                                                    columnNumber: 73
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                            lineNumber: 406,
                                            columnNumber: 29
                                        }, this)
                                    ]
                                }, i, true, {
                                    fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                    lineNumber: 404,
                                    columnNumber: 25
                                }, this))
                        }, void 0, false, {
                            fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                            lineNumber: 398,
                            columnNumber: 17
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "form-group",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    className: "form-label",
                                    children: "Descrição curta *"
                                }, void 0, false, {
                                    fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                    lineNumber: 415,
                                    columnNumber: 21
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                    className: "form-input",
                                    value: form.description,
                                    onChange: (e)=>upd("description", e.target.value),
                                    placeholder: "Uma frase que resume o pacote...",
                                    style: {
                                        minHeight: 80
                                    }
                                }, void 0, false, {
                                    fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                    lineNumber: 416,
                                    columnNumber: 21
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                            lineNumber: 414,
                            columnNumber: 17
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "form-group",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    className: "form-label",
                                    children: "O que está incluso"
                                }, void 0, false, {
                                    fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                    lineNumber: 420,
                                    columnNumber: 21
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "editor-tag-list",
                                    children: form.includedItems.map((item, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "editor-tag editor-tag-green",
                                            children: [
                                                item,
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    onClick: ()=>removeTag("includedItems", i),
                                                    children: "×"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                                    lineNumber: 423,
                                                    columnNumber: 89
                                                }, this)
                                            ]
                                        }, i, true, {
                                            fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                            lineNumber: 423,
                                            columnNumber: 29
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                    lineNumber: 421,
                                    columnNumber: 21
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "editor-tag-input-row",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            className: "form-input",
                                            value: newInclude,
                                            onChange: (e)=>setNewInclude(e.target.value),
                                            onKeyDown: (e)=>{
                                                if (e.key === "Enter") {
                                                    e.preventDefault();
                                                    addTag("includedItems", newInclude, setNewInclude);
                                                }
                                            },
                                            placeholder: "Ex: Voo, Hotel (separe por vírgula para adicionar vários)"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                            lineNumber: 427,
                                            columnNumber: 25
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            className: "btn-add-item",
                                            onClick: ()=>addTag("includedItems", newInclude, setNewInclude),
                                            children: "+"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                            lineNumber: 430,
                                            columnNumber: 25
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                    lineNumber: 426,
                                    columnNumber: 21
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                            lineNumber: 419,
                            columnNumber: 17
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "form-group",
                            style: {
                                marginTop: 16
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    className: "form-label",
                                    children: "Destaques do pacote"
                                }, void 0, false, {
                                    fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                    lineNumber: 435,
                                    columnNumber: 21
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "editor-tag-list",
                                    children: form.highlights.map((h, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "editor-tag",
                                            children: [
                                                h,
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    onClick: ()=>removeTag("highlights", i),
                                                    children: "×"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                                    lineNumber: 438,
                                                    columnNumber: 69
                                                }, this)
                                            ]
                                        }, i, true, {
                                            fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                            lineNumber: 438,
                                            columnNumber: 29
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                    lineNumber: 436,
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
                                                if (e.key === "Enter") {
                                                    e.preventDefault();
                                                    addTag("highlights", newHighlight, setNewHighlight);
                                                }
                                            },
                                            placeholder: "Ex: City tour VIP (separe por vírgula para adicionar vários)"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                            lineNumber: 442,
                                            columnNumber: 25
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            className: "btn-add-item",
                                            onClick: ()=>addTag("highlights", newHighlight, setNewHighlight),
                                            children: "+"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                            lineNumber: 445,
                                            columnNumber: 25
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                    lineNumber: 441,
                                    columnNumber: 21
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                            lineNumber: 434,
                            columnNumber: 17
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "form-group",
                            style: {
                                marginTop: 16
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    className: "form-label",
                                    children: "Descrição completa (Opcional)"
                                }, void 0, false, {
                                    fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                    lineNumber: 450,
                                    columnNumber: 21
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                    className: "form-input",
                                    value: form.fullDescription,
                                    onChange: (e)=>upd("fullDescription", e.target.value),
                                    placeholder: "Detalhes completos do itinerário e experiências...",
                                    style: {
                                        minHeight: 120
                                    }
                                }, void 0, false, {
                                    fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                    lineNumber: 451,
                                    columnNumber: 21
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                            lineNumber: 449,
                            columnNumber: 17
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "form-group",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    className: "form-label",
                                    children: "Política de cancelamento"
                                }, void 0, false, {
                                    fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                    lineNumber: 455,
                                    columnNumber: 21
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                    className: "form-input",
                                    value: form.cancellationPolicy,
                                    onChange: (e)=>upd("cancellationPolicy", e.target.value),
                                    placeholder: "Ex: Cancelamento gratuito até 7 dias antes da viagem...",
                                    style: {
                                        minHeight: 60
                                    }
                                }, void 0, false, {
                                    fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                    lineNumber: 456,
                                    columnNumber: 21
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                            lineNumber: 454,
                            columnNumber: 17
                        }, this)
                    ]
                }, void 0, true);
            case "docs":
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "form-group",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    className: "form-label",
                                    children: "WhatsApp Oficial *"
                                }, void 0, false, {
                                    fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                    lineNumber: 462,
                                    columnNumber: 21
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    className: "form-input",
                                    value: form.whatsappOfficial,
                                    onChange: (e)=>upd("whatsappOfficial", e.target.value),
                                    placeholder: "Ex: +55 11 99999-9999"
                                }, void 0, false, {
                                    fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                    lineNumber: 463,
                                    columnNumber: 21
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "form-helper",
                                    children: "Exibido ao comprador após a confirmação para tirar dúvidas"
                                }, void 0, false, {
                                    fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                    lineNumber: 464,
                                    columnNumber: 21
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                            lineNumber: 461,
                            columnNumber: 17
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "form-group",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    className: "form-label",
                                    children: "Mensagem automática"
                                }, void 0, false, {
                                    fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                    lineNumber: 467,
                                    columnNumber: 21
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                    className: "form-input",
                                    value: form.autoMessage,
                                    onChange: (e)=>upd("autoMessage", e.target.value),
                                    placeholder: "Olá! Obrigado pela compra do seu pacote...",
                                    style: {
                                        minHeight: 80
                                    }
                                }, void 0, false, {
                                    fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                    lineNumber: 468,
                                    columnNumber: 21
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                            lineNumber: 466,
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
                                            children: "URL do Voucher (Opcional)"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                            lineNumber: 472,
                                            columnNumber: 25
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            className: "form-input",
                                            value: form.voucherUrl,
                                            onChange: (e)=>upd("voucherUrl", e.target.value),
                                            placeholder: "https://..."
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                            lineNumber: 473,
                                            columnNumber: 25
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                    lineNumber: 471,
                                    columnNumber: 21
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "form-group",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: "form-label",
                                            children: "URL do E-ticket (Opcional)"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                            lineNumber: 476,
                                            columnNumber: 25
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            className: "form-input",
                                            value: form.eticketUrl,
                                            onChange: (e)=>upd("eticketUrl", e.target.value),
                                            placeholder: "https://..."
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                            lineNumber: 477,
                                            columnNumber: 25
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                    lineNumber: 475,
                                    columnNumber: 21
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                            lineNumber: 470,
                            columnNumber: 17
                        }, this)
                    ]
                }, void 0, true);
            default:
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    children: "Seção não encontrada."
                }, void 0, false, {
                    fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                    lineNumber: 482,
                    columnNumber: 29
                }, this);
        }
    };
    if (loading) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "editor-skeleton",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "editor-skeleton-bar short"
            }, void 0, false, {
                fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                lineNumber: 488,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "editor-skeleton-bar medium"
            }, void 0, false, {
                fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                lineNumber: 488,
                columnNumber: 58
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "editor-skeleton-section"
            }, void 0, false, {
                fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                lineNumber: 489,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "editor-skeleton-section"
            }, void 0, false, {
                fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                lineNumber: 489,
                columnNumber: 56
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
        lineNumber: 487,
        columnNumber: 9
    }, this);
    const currentSection = SECTIONS[activeStep];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "editor-page",
        children: [
            toast && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: `editor-toast ${toast.type}`,
                children: toast.msg
            }, void 0, false, {
                fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                lineNumber: 497,
                columnNumber: 23
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "editor-header",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "editor-header-left",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                href: "/agencia/pacotes",
                                className: "editor-back",
                                children: "← Voltar"
                            }, void 0, false, {
                                fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                lineNumber: 502,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "editor-header-info",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                        className: "editor-title",
                                        children: isNew ? "Novo Pacote" : form.title || "Editar Pacote"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                        lineNumber: 504,
                                        columnNumber: 25
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "editor-subtitle",
                                        children: "Painel da Agência"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                        lineNumber: 505,
                                        columnNumber: 25
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                lineNumber: 503,
                                columnNumber: 21
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                        lineNumber: 501,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "editor-header-right",
                        children: [
                            dirty && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "save-status unsaved",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "save-status-dot"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                        lineNumber: 509,
                                        columnNumber: 69
                                    }, this),
                                    " Não salvo"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                lineNumber: 509,
                                columnNumber: 31
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: "editor-save-btn",
                                onClick: handleSave,
                                disabled: saving,
                                children: saving ? "Salvando..." : "Publicar Pacote"
                            }, void 0, false, {
                                fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                lineNumber: 510,
                                columnNumber: 21
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                        lineNumber: 508,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                lineNumber: 500,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    padding: "0 32px"
                },
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$site$2f$src$2f$components$2f$dashboard$2f$StepperNav$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                    steps: SECTIONS.map((s)=>({
                            key: s.key,
                            icon: s.icon,
                            title: s.title
                        })),
                    activeIndex: activeStep,
                    completedSteps: completedSteps,
                    onStepClick: handleStepClick
                }, void 0, false, {
                    fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                    lineNumber: 518,
                    columnNumber: 17
                }, this)
            }, void 0, false, {
                fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                lineNumber: 517,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "editor-split",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "editor-split-form",
                        ref: formScrollRef,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "editor-section-card",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "editor-section-card-header",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "editor-section-card-icon",
                                                children: currentSection.icon
                                            }, void 0, false, {
                                                fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                                lineNumber: 533,
                                                columnNumber: 29
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                                className: "editor-section-card-title",
                                                children: currentSection.title
                                            }, void 0, false, {
                                                fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                                lineNumber: 534,
                                                columnNumber: 29
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: `editor-section-badge ${isSectionComplete(currentSection.key) ? "complete" : "incomplete"}`,
                                                children: isSectionComplete(currentSection.key) ? "Completo ✓" : "Pendente"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                                lineNumber: 535,
                                                columnNumber: 29
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                        lineNumber: 532,
                                        columnNumber: 25
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "editor-section-card-body",
                                        children: renderSection(currentSection.key)
                                    }, void 0, false, {
                                        fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                        lineNumber: 539,
                                        columnNumber: 25
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                lineNumber: 531,
                                columnNumber: 21
                            }, this),
                            SECTION_TIPS[currentSection.key]?.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "editor-tips-box",
                                children: SECTION_TIPS[currentSection.key].map((tip, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "editor-tip-item",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "editor-tip-dot"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                                lineNumber: 549,
                                                columnNumber: 37
                                            }, this),
                                            tip
                                        ]
                                    }, i, true, {
                                        fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                        lineNumber: 548,
                                        columnNumber: 33
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                lineNumber: 546,
                                columnNumber: 25
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$site$2f$src$2f$components$2f$dashboard$2f$StepperNav$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["StepperActions"], {
                                activeIndex: activeStep,
                                totalSteps: SECTIONS.length,
                                onPrev: handlePrev,
                                onNext: handleNext,
                                onSave: handleSave,
                                saving: saving,
                                isLastStep: activeStep === SECTIONS.length - 1
                            }, void 0, false, {
                                fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                lineNumber: 557,
                                columnNumber: 21
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                        lineNumber: 529,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "editor-split-preview",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$site$2f$src$2f$components$2f$dashboard$2f$QualityCoach$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                score: qualityScore,
                                tips: qualityTips
                            }, void 0, false, {
                                fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                lineNumber: 570,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$site$2f$src$2f$components$2f$dashboard$2f$PhonePreview$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                title: form.title,
                                subtitle: form.description,
                                destination: form.destination,
                                country: form.country,
                                duration: form.duration,
                                price: form.priceMin,
                                currency: form.currency,
                                highlights: form.highlights,
                                travelStyles: form.travelStyles,
                                categories: form.categories,
                                type: "pacote"
                            }, void 0, false, {
                                fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                                lineNumber: 571,
                                columnNumber: 21
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                        lineNumber: 569,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
                lineNumber: 527,
                columnNumber: 13
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/site/src/app/agencia/pacote/[id]/page.tsx",
        lineNumber: 496,
        columnNumber: 9
    }, this);
}
}),
];

//# sourceMappingURL=apps_site_src_e1e3797c._.js.map
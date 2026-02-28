(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/apps/site/src/app/admin/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>AdminDashboardPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
const API = ("TURBOPACK compile-time value", "http://localhost:3333/api") || "http://localhost:3333/api";
const STATUS_LABEL = {
    DRAFT: "Rascunho",
    PENDING_REVIEW: "Em Revisão",
    APPROVED: "Aprovado",
    REJECTED: "Rejeitado",
    ACTIVE: "Ativo",
    PAUSED: "Pausado",
    ARCHIVED: "Arquivado"
};
const STATUS_COLOR = {
    DRAFT: "#64748B",
    PENDING_REVIEW: "#D97706",
    APPROVED: "#16A34A",
    REJECTED: "#DC2626",
    ACTIVE: "#16A34A",
    PAUSED: "#64748B",
    ARCHIVED: "#64748B"
};
function AdminDashboardPage() {
    _s();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const [tab, setTab] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("packages");
    const [packages, setPackages] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [itineraries, setItineraries] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [history, setHistory] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        packages: [],
        itineraries: []
    });
    const [stats, setStats] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [adminUser, setAdminUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // Modal state
    const [modal, setModal] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [rejectNote, setRejectNote] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [actionLoading, setActionLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [toast, setToast] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const getToken = ()=>localStorage.getItem("adminToken");
    const fetchData = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AdminDashboardPage.useCallback[fetchData]": async ()=>{
            const token = getToken();
            if (!token) {
                router.push("/admin/login");
                return;
            }
            try {
                const headers = {
                    Authorization: `Bearer ${token}`
                };
                const [pendingRes, statsRes] = await Promise.all([
                    fetch(`${API}/admin/pending`, {
                        headers
                    }),
                    fetch(`${API}/admin/stats`, {
                        headers
                    })
                ]);
                if (pendingRes.status === 401) {
                    localStorage.removeItem("adminToken");
                    router.push("/admin/login");
                    return;
                }
                const pendingData = await pendingRes.json();
                const statsData = await statsRes.json();
                setPackages(pendingData.packages || []);
                setItineraries(pendingData.itineraries || []);
                setStats(statsData);
                // Load history
                const histRes = await fetch(`${API}/admin/all`, {
                    headers
                });
                const histData = await histRes.json();
                setHistory(histData);
            } catch (e) {
                showToast("Erro ao carregar dados", "error");
            } finally{
                setLoading(false);
            }
        }
    }["AdminDashboardPage.useCallback[fetchData]"], [
        router
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AdminDashboardPage.useEffect": ()=>{
            const user = localStorage.getItem("adminUser");
            if (user) setAdminUser(JSON.parse(user));
            fetchData();
        }
    }["AdminDashboardPage.useEffect"], [
        fetchData
    ]);
    const showToast = (msg, type)=>{
        setToast({
            msg,
            type
        });
        setTimeout(()=>setToast(null), 3500);
    };
    const handleApprove = async (itemType, id, title)=>{
        setModal({
            type: "approve",
            itemType,
            id,
            title
        });
    };
    const handleReject = async (itemType, id, title)=>{
        setRejectNote("");
        setModal({
            type: "reject",
            itemType,
            id,
            title
        });
    };
    const confirmAction = async ()=>{
        if (!modal) return;
        setActionLoading(true);
        try {
            const endpoint = modal.type === "approve" ? `${API}/admin/${modal.itemType}/${modal.id}/approve` : `${API}/admin/${modal.itemType}/${modal.id}/reject`;
            const res = await fetch(endpoint, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${getToken()}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(modal.type === "reject" ? {
                    note: rejectNote
                } : {})
            });
            if (!res.ok) throw new Error("Erro ao executar ação");
            showToast(modal.type === "approve" ? "✅ Aprovado com sucesso!" : "❌ Rejeitado com nota.", "success");
            setModal(null);
            fetchData();
        } catch (e) {
            showToast(e.message, "error");
        } finally{
            setActionLoading(false);
        }
    };
    const logout = ()=>{
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        router.push("/admin/login");
    };
    const s = {
        fontFamily: "'Inter', sans-serif"
    };
    if (loading) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: {
            minHeight: "100vh",
            background: "#F0F4F8",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            ...s
        },
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            style: {
                fontSize: "16px",
                color: "#64748B"
            },
            children: "Carregando…"
        }, void 0, false, {
            fileName: "[project]/apps/site/src/app/admin/page.tsx",
            lineNumber: 135,
            columnNumber: 13
        }, this)
    }, void 0, false, {
        fileName: "[project]/apps/site/src/app/admin/page.tsx",
        lineNumber: 134,
        columnNumber: 9
    }, this);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: {
            minHeight: "100vh",
            background: "#F0F4F8",
            ...s
        },
        children: [
            toast && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    position: "fixed",
                    top: "20px",
                    right: "20px",
                    zIndex: 9999,
                    padding: "14px 20px",
                    borderRadius: "14px",
                    background: toast.type === "success" ? "rgba(22,163,74,0.95)" : "rgba(220,38,38,0.95)",
                    color: "#fff",
                    fontWeight: "700",
                    fontSize: "14px",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.15)"
                },
                children: toast.msg
            }, void 0, false, {
                fileName: "[project]/apps/site/src/app/admin/page.tsx",
                lineNumber: 143,
                columnNumber: 17
            }, this),
            modal && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    position: "fixed",
                    inset: 0,
                    background: "rgba(0,0,0,0.5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 1000
                },
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    style: {
                        background: "#fff",
                        borderRadius: "24px",
                        padding: "32px",
                        width: "100%",
                        maxWidth: "480px",
                        margin: "0 16px",
                        boxShadow: "0 24px 60px rgba(0,0,0,0.2)"
                    },
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                            style: {
                                margin: "0 0 8px",
                                fontSize: "18px",
                                fontWeight: "800",
                                color: "#1E293B"
                            },
                            children: modal.type === "approve" ? "✅ Aprovar" : "❌ Rejeitar"
                        }, void 0, false, {
                            fileName: "[project]/apps/site/src/app/admin/page.tsx",
                            lineNumber: 163,
                            columnNumber: 25
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            style: {
                                margin: "0 0 20px",
                                color: "#64748B",
                                fontSize: "14px"
                            },
                            children: modal.type === "approve" ? `Aprovar "${modal.title}"? Ele ficará visível no app.` : `Rejeitar "${modal.title}"? Informe o motivo.`
                        }, void 0, false, {
                            fileName: "[project]/apps/site/src/app/admin/page.tsx",
                            lineNumber: 166,
                            columnNumber: 25
                        }, this),
                        modal.type === "reject" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                            value: rejectNote,
                            onChange: (e)=>setRejectNote(e.target.value),
                            placeholder: "Motivo da rejeição (ex: imagens de baixa qualidade, preço inválido...)",
                            style: {
                                width: "100%",
                                minHeight: "100px",
                                padding: "12px 14px",
                                borderRadius: "12px",
                                border: "1.5px solid #E2E8F0",
                                fontSize: "14px",
                                fontFamily: "inherit",
                                resize: "none",
                                outline: "none",
                                boxSizing: "border-box",
                                background: "#F8FAFC",
                                color: "#1E293B"
                            }
                        }, void 0, false, {
                            fileName: "[project]/apps/site/src/app/admin/page.tsx",
                            lineNumber: 172,
                            columnNumber: 29
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                display: "flex",
                                gap: "10px",
                                marginTop: "20px"
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>setModal(null),
                                    style: {
                                        flex: 1,
                                        padding: "12px",
                                        borderRadius: "12px",
                                        border: "1.5px solid #E2E8F0",
                                        background: "#fff",
                                        cursor: "pointer",
                                        fontWeight: "600",
                                        fontSize: "14px",
                                        color: "#64748B"
                                    },
                                    children: "Cancelar"
                                }, void 0, false, {
                                    fileName: "[project]/apps/site/src/app/admin/page.tsx",
                                    lineNumber: 186,
                                    columnNumber: 29
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: confirmAction,
                                    disabled: actionLoading,
                                    style: {
                                        flex: 1,
                                        padding: "12px",
                                        borderRadius: "12px",
                                        border: "none",
                                        background: modal.type === "approve" ? "linear-gradient(135deg, #28C9BF, #1FA89F)" : "linear-gradient(135deg, #EF4444, #DC2626)",
                                        color: "#fff",
                                        cursor: "pointer",
                                        fontWeight: "700",
                                        fontSize: "14px"
                                    },
                                    children: actionLoading ? "..." : modal.type === "approve" ? "Aprovar" : "Rejeitar"
                                }, void 0, false, {
                                    fileName: "[project]/apps/site/src/app/admin/page.tsx",
                                    lineNumber: 191,
                                    columnNumber: 29
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/site/src/app/admin/page.tsx",
                            lineNumber: 185,
                            columnNumber: 25
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/site/src/app/admin/page.tsx",
                    lineNumber: 158,
                    columnNumber: 21
                }, this)
            }, void 0, false, {
                fileName: "[project]/apps/site/src/app/admin/page.tsx",
                lineNumber: 154,
                columnNumber: 17
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    background: "#fff",
                    borderBottom: "1px solid rgba(226,232,240,0.8)",
                    padding: "0 32px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    height: "64px",
                    boxShadow: "0 1px 8px rgba(26,50,99,0.06)"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            display: "flex",
                            alignItems: "center",
                            gap: "12px"
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    width: "36px",
                                    height: "36px",
                                    borderRadius: "12px",
                                    background: "linear-gradient(135deg, #28C9BF, #1FA89F)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "18px",
                                    boxShadow: "0 2px 8px rgba(40,201,191,0.3)"
                                },
                                children: "🛡️"
                            }, void 0, false, {
                                fileName: "[project]/apps/site/src/app/admin/page.tsx",
                                lineNumber: 213,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            fontWeight: "800",
                                            fontSize: "16px",
                                            color: "#1E293B"
                                        },
                                        children: "VAMO Admin"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/site/src/app/admin/page.tsx",
                                        lineNumber: 220,
                                        columnNumber: 25
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            fontSize: "11px",
                                            color: "#94A3B8"
                                        },
                                        children: "Painel de Moderação"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/site/src/app/admin/page.tsx",
                                        lineNumber: 221,
                                        columnNumber: 25
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/site/src/app/admin/page.tsx",
                                lineNumber: 219,
                                columnNumber: 21
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/site/src/app/admin/page.tsx",
                        lineNumber: 212,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            display: "flex",
                            alignItems: "center",
                            gap: "16px"
                        },
                        children: [
                            adminUser && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    textAlign: "right"
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            fontSize: "13px",
                                            fontWeight: "600",
                                            color: "#1E293B"
                                        },
                                        children: adminUser.name
                                    }, void 0, false, {
                                        fileName: "[project]/apps/site/src/app/admin/page.tsx",
                                        lineNumber: 227,
                                        columnNumber: 29
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            fontSize: "11px",
                                            color: "#94A3B8"
                                        },
                                        children: adminUser.role
                                    }, void 0, false, {
                                        fileName: "[project]/apps/site/src/app/admin/page.tsx",
                                        lineNumber: 228,
                                        columnNumber: 29
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/site/src/app/admin/page.tsx",
                                lineNumber: 226,
                                columnNumber: 25
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: logout,
                                style: {
                                    padding: "8px 16px",
                                    borderRadius: "10px",
                                    border: "1px solid rgba(226,232,240,0.8)",
                                    background: "#F8FAFC",
                                    color: "#64748B",
                                    fontSize: "13px",
                                    fontWeight: "600",
                                    cursor: "pointer"
                                },
                                children: "Sair"
                            }, void 0, false, {
                                fileName: "[project]/apps/site/src/app/admin/page.tsx",
                                lineNumber: 231,
                                columnNumber: 21
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/site/src/app/admin/page.tsx",
                        lineNumber: 224,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/site/src/app/admin/page.tsx",
                lineNumber: 206,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    padding: "24px 32px",
                    maxWidth: "1100px",
                    margin: "0 auto"
                },
                children: [
                    stats && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            display: "grid",
                            gridTemplateColumns: "repeat(4, 1fr)",
                            gap: "14px",
                            marginBottom: "24px"
                        },
                        children: [
                            {
                                label: "Total Pendente",
                                value: stats.totalPending,
                                icon: "⏳",
                                color: "#D97706",
                                bg: "rgba(217,119,6,0.08)"
                            },
                            {
                                label: "Pacotes Pendentes",
                                value: stats.pendingPackages,
                                icon: "📦",
                                color: "#1FA89F",
                                bg: "rgba(31,168,159,0.08)"
                            },
                            {
                                label: "Roteiros Pendentes",
                                value: stats.pendingItineraries,
                                icon: "🗺️",
                                color: "#6366F1",
                                bg: "rgba(99,102,241,0.08)"
                            },
                            {
                                label: "Aprovados Hoje",
                                value: stats.approvedToday,
                                icon: "✅",
                                color: "#16A34A",
                                bg: "rgba(22,163,74,0.08)"
                            }
                        ].map((stat)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    background: "#fff",
                                    borderRadius: "18px",
                                    padding: "18px 20px",
                                    border: "1px solid rgba(226,232,240,0.7)",
                                    boxShadow: "0 2px 8px rgba(26,50,99,0.04)"
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "10px",
                                            marginBottom: "8px"
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                style: {
                                                    width: "36px",
                                                    height: "36px",
                                                    borderRadius: "10px",
                                                    background: stat.bg,
                                                    fontSize: "18px",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center"
                                                },
                                                children: stat.icon
                                            }, void 0, false, {
                                                fileName: "[project]/apps/site/src/app/admin/page.tsx",
                                                lineNumber: 256,
                                                columnNumber: 37
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                style: {
                                                    fontSize: "12px",
                                                    color: "#64748B",
                                                    fontWeight: "600"
                                                },
                                                children: stat.label
                                            }, void 0, false, {
                                                fileName: "[project]/apps/site/src/app/admin/page.tsx",
                                                lineNumber: 261,
                                                columnNumber: 37
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/site/src/app/admin/page.tsx",
                                        lineNumber: 255,
                                        columnNumber: 33
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            fontSize: "28px",
                                            fontWeight: "800",
                                            color: stat.color
                                        },
                                        children: stat.value
                                    }, void 0, false, {
                                        fileName: "[project]/apps/site/src/app/admin/page.tsx",
                                        lineNumber: 263,
                                        columnNumber: 33
                                    }, this)
                                ]
                            }, stat.label, true, {
                                fileName: "[project]/apps/site/src/app/admin/page.tsx",
                                lineNumber: 250,
                                columnNumber: 29
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/apps/site/src/app/admin/page.tsx",
                        lineNumber: 243,
                        columnNumber: 21
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            display: "flex",
                            gap: "4px",
                            marginBottom: "20px",
                            background: "#fff",
                            padding: "6px",
                            borderRadius: "14px",
                            border: "1px solid rgba(226,232,240,0.7)",
                            width: "fit-content"
                        },
                        children: [
                            {
                                key: "packages",
                                label: `Pacotes ${stats ? `(${stats.pendingPackages})` : ""}`
                            },
                            {
                                key: "itineraries",
                                label: `Roteiros ${stats ? `(${stats.pendingItineraries})` : ""}`
                            },
                            {
                                key: "history",
                                label: "Histórico"
                            }
                        ].map((t)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>setTab(t.key),
                                style: {
                                    padding: "8px 18px",
                                    borderRadius: "10px",
                                    border: "none",
                                    background: tab === t.key ? "linear-gradient(135deg, #28C9BF, #1FA89F)" : "transparent",
                                    color: tab === t.key ? "#fff" : "#64748B",
                                    fontWeight: "700",
                                    fontSize: "13px",
                                    cursor: "pointer",
                                    transition: "all 0.2s"
                                },
                                children: t.label
                            }, t.key, false, {
                                fileName: "[project]/apps/site/src/app/admin/page.tsx",
                                lineNumber: 276,
                                columnNumber: 25
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/apps/site/src/app/admin/page.tsx",
                        lineNumber: 270,
                        columnNumber: 17
                    }, this),
                    tab === "packages" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ItemList, {
                        items: packages,
                        type: "packages",
                        onApprove: handleApprove,
                        onReject: handleReject,
                        emptyMsg: "Nenhum pacote aguardando revisão"
                    }, void 0, false, {
                        fileName: "[project]/apps/site/src/app/admin/page.tsx",
                        lineNumber: 288,
                        columnNumber: 21
                    }, this),
                    tab === "itineraries" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ItemList, {
                        items: itineraries,
                        type: "itineraries",
                        onApprove: handleApprove,
                        onReject: handleReject,
                        emptyMsg: "Nenhum roteiro aguardando revisão"
                    }, void 0, false, {
                        fileName: "[project]/apps/site/src/app/admin/page.tsx",
                        lineNumber: 299,
                        columnNumber: 21
                    }, this),
                    tab === "history" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            display: "flex",
                            flexDirection: "column",
                            gap: "10px"
                        },
                        children: [
                            [
                                ...history.packages,
                                ...history.itineraries
                            ].sort((a, b)=>new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: {
                                        background: "#fff",
                                        borderRadius: "16px",
                                        padding: "16px 20px",
                                        border: "1px solid rgba(226,232,240,0.7)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between"
                                    },
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    style: {
                                                        fontWeight: "700",
                                                        fontSize: "14px",
                                                        color: "#1E293B"
                                                    },
                                                    children: item.title
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/site/src/app/admin/page.tsx",
                                                    lineNumber: 320,
                                                    columnNumber: 41
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    style: {
                                                        fontSize: "12px",
                                                        color: "#94A3B8",
                                                        marginTop: "2px"
                                                    },
                                                    children: [
                                                        item.destination,
                                                        " · ",
                                                        item.agency?.name || item.creator?.traveler?.name
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/site/src/app/admin/page.tsx",
                                                    lineNumber: 321,
                                                    columnNumber: 41
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/site/src/app/admin/page.tsx",
                                            lineNumber: 319,
                                            columnNumber: 37
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            style: {
                                                padding: "4px 12px",
                                                borderRadius: "20px",
                                                fontSize: "11px",
                                                fontWeight: "700",
                                                background: `${STATUS_COLOR[item.status]}18`,
                                                color: STATUS_COLOR[item.status]
                                            },
                                            children: STATUS_LABEL[item.status]
                                        }, void 0, false, {
                                            fileName: "[project]/apps/site/src/app/admin/page.tsx",
                                            lineNumber: 325,
                                            columnNumber: 37
                                        }, this)
                                    ]
                                }, item.id, true, {
                                    fileName: "[project]/apps/site/src/app/admin/page.tsx",
                                    lineNumber: 314,
                                    columnNumber: 33
                                }, this)),
                            history.packages.length === 0 && history.itineraries.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(EmptyState, {
                                msg: "Nenhum item no histórico"
                            }, void 0, false, {
                                fileName: "[project]/apps/site/src/app/admin/page.tsx",
                                lineNumber: 333,
                                columnNumber: 29
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/site/src/app/admin/page.tsx",
                        lineNumber: 310,
                        columnNumber: 21
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/site/src/app/admin/page.tsx",
                lineNumber: 240,
                columnNumber: 13
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/site/src/app/admin/page.tsx",
        lineNumber: 140,
        columnNumber: 9
    }, this);
}
_s(AdminDashboardPage, "kSN0FDerYboPOlZK1d4JFNdxdZs=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c = AdminDashboardPage;
function ItemList({ items, type, onApprove, onReject, emptyMsg }) {
    if (items.length === 0) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(EmptyState, {
        msg: emptyMsg
    }, void 0, false, {
        fileName: "[project]/apps/site/src/app/admin/page.tsx",
        lineNumber: 348,
        columnNumber: 36
    }, this);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: {
            display: "flex",
            flexDirection: "column",
            gap: "12px"
        },
        children: items.map((item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    background: "#fff",
                    borderRadius: "20px",
                    padding: "20px 24px",
                    border: "1px solid rgba(226,232,240,0.7)",
                    boxShadow: "0 2px 8px rgba(26,50,99,0.04)",
                    display: "flex",
                    alignItems: "center",
                    gap: "16px"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            width: "64px",
                            height: "64px",
                            borderRadius: "14px",
                            background: "linear-gradient(135deg, rgba(40,201,191,0.12), rgba(40,201,191,0.06))",
                            flexShrink: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "28px",
                            overflow: "hidden"
                        },
                        children: item.images?.[0]?.url ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                            src: item.images[0].url,
                            style: {
                                width: "100%",
                                height: "100%",
                                objectFit: "cover"
                            }
                        }, void 0, false, {
                            fileName: "[project]/apps/site/src/app/admin/page.tsx",
                            lineNumber: 367,
                            columnNumber: 31
                        }, this) : type === "packages" ? "📦" : "🗺️"
                    }, void 0, false, {
                        fileName: "[project]/apps/site/src/app/admin/page.tsx",
                        lineNumber: 360,
                        columnNumber: 21
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            flex: 1,
                            minWidth: 0
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    fontWeight: "700",
                                    fontSize: "15px",
                                    color: "#1E293B",
                                    marginBottom: "4px"
                                },
                                children: item.title
                            }, void 0, false, {
                                fileName: "[project]/apps/site/src/app/admin/page.tsx",
                                lineNumber: 373,
                                columnNumber: 25
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    fontSize: "13px",
                                    color: "#64748B"
                                },
                                children: [
                                    item.destination,
                                    ", ",
                                    item.country,
                                    " ·",
                                    " ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        style: {
                                            color: "#94A3B8"
                                        },
                                        children: type === "packages" ? item.agency?.name : item.creator?.traveler?.name
                                    }, void 0, false, {
                                        fileName: "[project]/apps/site/src/app/admin/page.tsx",
                                        lineNumber: 376,
                                        columnNumber: 29
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/site/src/app/admin/page.tsx",
                                lineNumber: 374,
                                columnNumber: 25
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    display: "flex",
                                    gap: "10px",
                                    marginTop: "6px",
                                    alignItems: "center"
                                },
                                children: [
                                    item.qualityScore !== undefined && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        style: {
                                            fontSize: "11px",
                                            fontWeight: "700",
                                            color: item.qualityScore >= 70 ? "#16A34A" : item.qualityScore >= 40 ? "#D97706" : "#DC2626"
                                        },
                                        children: [
                                            "Score: ",
                                            item.qualityScore,
                                            "%"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/site/src/app/admin/page.tsx",
                                        lineNumber: 384,
                                        columnNumber: 33
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        style: {
                                            fontSize: "11px",
                                            color: "#94A3B8"
                                        },
                                        children: new Date(item.createdAt).toLocaleDateString("pt-BR")
                                    }, void 0, false, {
                                        fileName: "[project]/apps/site/src/app/admin/page.tsx",
                                        lineNumber: 389,
                                        columnNumber: 29
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/site/src/app/admin/page.tsx",
                                lineNumber: 382,
                                columnNumber: 25
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/site/src/app/admin/page.tsx",
                        lineNumber: 372,
                        columnNumber: 21
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            textAlign: "right",
                            flexShrink: 0
                        },
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                fontSize: "14px",
                                fontWeight: "700",
                                color: "#1FA89F"
                            },
                            children: type === "packages" ? item.priceMin ? `R$ ${item.priceMin.toLocaleString("pt-BR")}` : "—" : item.price ? `R$ ${item.price.toLocaleString("pt-BR")}` : "—"
                        }, void 0, false, {
                            fileName: "[project]/apps/site/src/app/admin/page.tsx",
                            lineNumber: 397,
                            columnNumber: 25
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/apps/site/src/app/admin/page.tsx",
                        lineNumber: 396,
                        columnNumber: 21
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            display: "flex",
                            gap: "8px",
                            flexShrink: 0
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>onApprove(type, item.id, item.title),
                                style: {
                                    padding: "9px 18px",
                                    borderRadius: "10px",
                                    border: "none",
                                    background: "linear-gradient(135deg, #28C9BF, #1FA89F)",
                                    color: "#fff",
                                    fontWeight: "700",
                                    fontSize: "13px",
                                    cursor: "pointer",
                                    boxShadow: "0 2px 8px rgba(40,201,191,0.25)"
                                },
                                children: "✅ Aprovar"
                            }, void 0, false, {
                                fileName: "[project]/apps/site/src/app/admin/page.tsx",
                                lineNumber: 406,
                                columnNumber: 25
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>onReject(type, item.id, item.title),
                                style: {
                                    padding: "9px 18px",
                                    borderRadius: "10px",
                                    border: "1.5px solid rgba(239,68,68,0.2)",
                                    background: "rgba(239,68,68,0.06)",
                                    color: "#DC2626",
                                    fontWeight: "700",
                                    fontSize: "13px",
                                    cursor: "pointer"
                                },
                                children: "❌ Rejeitar"
                            }, void 0, false, {
                                fileName: "[project]/apps/site/src/app/admin/page.tsx",
                                lineNumber: 412,
                                columnNumber: 25
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/site/src/app/admin/page.tsx",
                        lineNumber: 405,
                        columnNumber: 21
                    }, this)
                ]
            }, item.id, true, {
                fileName: "[project]/apps/site/src/app/admin/page.tsx",
                lineNumber: 353,
                columnNumber: 17
            }, this))
    }, void 0, false, {
        fileName: "[project]/apps/site/src/app/admin/page.tsx",
        lineNumber: 351,
        columnNumber: 9
    }, this);
}
_c1 = ItemList;
function EmptyState({ msg }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: {
            background: "#fff",
            borderRadius: "20px",
            padding: "48px 32px",
            border: "1px solid rgba(226,232,240,0.7)",
            textAlign: "center"
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    fontSize: "48px",
                    marginBottom: "12px"
                },
                children: "🎉"
            }, void 0, false, {
                fileName: "[project]/apps/site/src/app/admin/page.tsx",
                lineNumber: 431,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    fontSize: "16px",
                    fontWeight: "700",
                    color: "#1E293B",
                    marginBottom: "6px"
                },
                children: msg
            }, void 0, false, {
                fileName: "[project]/apps/site/src/app/admin/page.tsx",
                lineNumber: 432,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    fontSize: "14px",
                    color: "#94A3B8"
                },
                children: "Tudo em dia por aqui."
            }, void 0, false, {
                fileName: "[project]/apps/site/src/app/admin/page.tsx",
                lineNumber: 433,
                columnNumber: 13
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/site/src/app/admin/page.tsx",
        lineNumber: 427,
        columnNumber: 9
    }, this);
}
_c2 = EmptyState;
var _c, _c1, _c2;
__turbopack_context__.k.register(_c, "AdminDashboardPage");
__turbopack_context__.k.register(_c1, "ItemList");
__turbopack_context__.k.register(_c2, "EmptyState");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/node_modules/next/dist/compiled/react/cjs/react-jsx-dev-runtime.development.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
/**
 * @license React
 * react-jsx-dev-runtime.development.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ "use strict";
"production" !== ("TURBOPACK compile-time value", "development") && function() {
    function getComponentNameFromType(type) {
        if (null == type) return null;
        if ("function" === typeof type) return type.$$typeof === REACT_CLIENT_REFERENCE ? null : type.displayName || type.name || null;
        if ("string" === typeof type) return type;
        switch(type){
            case REACT_FRAGMENT_TYPE:
                return "Fragment";
            case REACT_PROFILER_TYPE:
                return "Profiler";
            case REACT_STRICT_MODE_TYPE:
                return "StrictMode";
            case REACT_SUSPENSE_TYPE:
                return "Suspense";
            case REACT_SUSPENSE_LIST_TYPE:
                return "SuspenseList";
            case REACT_ACTIVITY_TYPE:
                return "Activity";
            case REACT_VIEW_TRANSITION_TYPE:
                return "ViewTransition";
        }
        if ("object" === typeof type) switch("number" === typeof type.tag && console.error("Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."), type.$$typeof){
            case REACT_PORTAL_TYPE:
                return "Portal";
            case REACT_CONTEXT_TYPE:
                return type.displayName || "Context";
            case REACT_CONSUMER_TYPE:
                return (type._context.displayName || "Context") + ".Consumer";
            case REACT_FORWARD_REF_TYPE:
                var innerType = type.render;
                type = type.displayName;
                type || (type = innerType.displayName || innerType.name || "", type = "" !== type ? "ForwardRef(" + type + ")" : "ForwardRef");
                return type;
            case REACT_MEMO_TYPE:
                return innerType = type.displayName || null, null !== innerType ? innerType : getComponentNameFromType(type.type) || "Memo";
            case REACT_LAZY_TYPE:
                innerType = type._payload;
                type = type._init;
                try {
                    return getComponentNameFromType(type(innerType));
                } catch (x) {}
        }
        return null;
    }
    function testStringCoercion(value) {
        return "" + value;
    }
    function checkKeyStringCoercion(value) {
        try {
            testStringCoercion(value);
            var JSCompiler_inline_result = !1;
        } catch (e) {
            JSCompiler_inline_result = !0;
        }
        if (JSCompiler_inline_result) {
            JSCompiler_inline_result = console;
            var JSCompiler_temp_const = JSCompiler_inline_result.error;
            var JSCompiler_inline_result$jscomp$0 = "function" === typeof Symbol && Symbol.toStringTag && value[Symbol.toStringTag] || value.constructor.name || "Object";
            JSCompiler_temp_const.call(JSCompiler_inline_result, "The provided key is an unsupported type %s. This value must be coerced to a string before using it here.", JSCompiler_inline_result$jscomp$0);
            return testStringCoercion(value);
        }
    }
    function getTaskName(type) {
        if (type === REACT_FRAGMENT_TYPE) return "<>";
        if ("object" === typeof type && null !== type && type.$$typeof === REACT_LAZY_TYPE) return "<...>";
        try {
            var name = getComponentNameFromType(type);
            return name ? "<" + name + ">" : "<...>";
        } catch (x) {
            return "<...>";
        }
    }
    function getOwner() {
        var dispatcher = ReactSharedInternals.A;
        return null === dispatcher ? null : dispatcher.getOwner();
    }
    function UnknownOwner() {
        return Error("react-stack-top-frame");
    }
    function hasValidKey(config) {
        if (hasOwnProperty.call(config, "key")) {
            var getter = Object.getOwnPropertyDescriptor(config, "key").get;
            if (getter && getter.isReactWarning) return !1;
        }
        return void 0 !== config.key;
    }
    function defineKeyPropWarningGetter(props, displayName) {
        function warnAboutAccessingKey() {
            specialPropKeyWarningShown || (specialPropKeyWarningShown = !0, console.error("%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://react.dev/link/special-props)", displayName));
        }
        warnAboutAccessingKey.isReactWarning = !0;
        Object.defineProperty(props, "key", {
            get: warnAboutAccessingKey,
            configurable: !0
        });
    }
    function elementRefGetterWithDeprecationWarning() {
        var componentName = getComponentNameFromType(this.type);
        didWarnAboutElementRef[componentName] || (didWarnAboutElementRef[componentName] = !0, console.error("Accessing element.ref was removed in React 19. ref is now a regular prop. It will be removed from the JSX Element type in a future release."));
        componentName = this.props.ref;
        return void 0 !== componentName ? componentName : null;
    }
    function ReactElement(type, key, props, owner, debugStack, debugTask) {
        var refProp = props.ref;
        type = {
            $$typeof: REACT_ELEMENT_TYPE,
            type: type,
            key: key,
            props: props,
            _owner: owner
        };
        null !== (void 0 !== refProp ? refProp : null) ? Object.defineProperty(type, "ref", {
            enumerable: !1,
            get: elementRefGetterWithDeprecationWarning
        }) : Object.defineProperty(type, "ref", {
            enumerable: !1,
            value: null
        });
        type._store = {};
        Object.defineProperty(type._store, "validated", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: 0
        });
        Object.defineProperty(type, "_debugInfo", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: null
        });
        Object.defineProperty(type, "_debugStack", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: debugStack
        });
        Object.defineProperty(type, "_debugTask", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: debugTask
        });
        Object.freeze && (Object.freeze(type.props), Object.freeze(type));
        return type;
    }
    function jsxDEVImpl(type, config, maybeKey, isStaticChildren, debugStack, debugTask) {
        var children = config.children;
        if (void 0 !== children) if (isStaticChildren) if (isArrayImpl(children)) {
            for(isStaticChildren = 0; isStaticChildren < children.length; isStaticChildren++)validateChildKeys(children[isStaticChildren]);
            Object.freeze && Object.freeze(children);
        } else console.error("React.jsx: Static children should always be an array. You are likely explicitly calling React.jsxs or React.jsxDEV. Use the Babel transform instead.");
        else validateChildKeys(children);
        if (hasOwnProperty.call(config, "key")) {
            children = getComponentNameFromType(type);
            var keys = Object.keys(config).filter(function(k) {
                return "key" !== k;
            });
            isStaticChildren = 0 < keys.length ? "{key: someKey, " + keys.join(": ..., ") + ": ...}" : "{key: someKey}";
            didWarnAboutKeySpread[children + isStaticChildren] || (keys = 0 < keys.length ? "{" + keys.join(": ..., ") + ": ...}" : "{}", console.error('A props object containing a "key" prop is being spread into JSX:\n  let props = %s;\n  <%s {...props} />\nReact keys must be passed directly to JSX without using spread:\n  let props = %s;\n  <%s key={someKey} {...props} />', isStaticChildren, children, keys, children), didWarnAboutKeySpread[children + isStaticChildren] = !0);
        }
        children = null;
        void 0 !== maybeKey && (checkKeyStringCoercion(maybeKey), children = "" + maybeKey);
        hasValidKey(config) && (checkKeyStringCoercion(config.key), children = "" + config.key);
        if ("key" in config) {
            maybeKey = {};
            for(var propName in config)"key" !== propName && (maybeKey[propName] = config[propName]);
        } else maybeKey = config;
        children && defineKeyPropWarningGetter(maybeKey, "function" === typeof type ? type.displayName || type.name || "Unknown" : type);
        return ReactElement(type, children, maybeKey, getOwner(), debugStack, debugTask);
    }
    function validateChildKeys(node) {
        isValidElement(node) ? node._store && (node._store.validated = 1) : "object" === typeof node && null !== node && node.$$typeof === REACT_LAZY_TYPE && ("fulfilled" === node._payload.status ? isValidElement(node._payload.value) && node._payload.value._store && (node._payload.value._store.validated = 1) : node._store && (node._store.validated = 1));
    }
    function isValidElement(object) {
        return "object" === typeof object && null !== object && object.$$typeof === REACT_ELEMENT_TYPE;
    }
    var React = __turbopack_context__.r("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)"), REACT_ELEMENT_TYPE = Symbol.for("react.transitional.element"), REACT_PORTAL_TYPE = Symbol.for("react.portal"), REACT_FRAGMENT_TYPE = Symbol.for("react.fragment"), REACT_STRICT_MODE_TYPE = Symbol.for("react.strict_mode"), REACT_PROFILER_TYPE = Symbol.for("react.profiler"), REACT_CONSUMER_TYPE = Symbol.for("react.consumer"), REACT_CONTEXT_TYPE = Symbol.for("react.context"), REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref"), REACT_SUSPENSE_TYPE = Symbol.for("react.suspense"), REACT_SUSPENSE_LIST_TYPE = Symbol.for("react.suspense_list"), REACT_MEMO_TYPE = Symbol.for("react.memo"), REACT_LAZY_TYPE = Symbol.for("react.lazy"), REACT_ACTIVITY_TYPE = Symbol.for("react.activity"), REACT_VIEW_TRANSITION_TYPE = Symbol.for("react.view_transition"), REACT_CLIENT_REFERENCE = Symbol.for("react.client.reference"), ReactSharedInternals = React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, hasOwnProperty = Object.prototype.hasOwnProperty, isArrayImpl = Array.isArray, createTask = console.createTask ? console.createTask : function() {
        return null;
    };
    React = {
        react_stack_bottom_frame: function(callStackForError) {
            return callStackForError();
        }
    };
    var specialPropKeyWarningShown;
    var didWarnAboutElementRef = {};
    var unknownOwnerDebugStack = React.react_stack_bottom_frame.bind(React, UnknownOwner)();
    var unknownOwnerDebugTask = createTask(getTaskName(UnknownOwner));
    var didWarnAboutKeySpread = {};
    exports.Fragment = REACT_FRAGMENT_TYPE;
    exports.jsxDEV = function(type, config, maybeKey, isStaticChildren) {
        var trackActualOwner = 1e4 > ReactSharedInternals.recentlyCreatedOwnerStacks++;
        if (trackActualOwner) {
            var previousStackTraceLimit = Error.stackTraceLimit;
            Error.stackTraceLimit = 10;
            var debugStackDEV = Error("react-stack-top-frame");
            Error.stackTraceLimit = previousStackTraceLimit;
        } else debugStackDEV = unknownOwnerDebugStack;
        return jsxDEVImpl(type, config, maybeKey, isStaticChildren, debugStackDEV, trackActualOwner ? createTask(getTaskName(type)) : unknownOwnerDebugTask);
    };
}();
}),
"[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
'use strict';
if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
;
else {
    module.exports = __turbopack_context__.r("[project]/node_modules/next/dist/compiled/react/cjs/react-jsx-dev-runtime.development.js [app-client] (ecmascript)");
}
}),
"[project]/node_modules/next/navigation.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {

module.exports = __turbopack_context__.r("[project]/node_modules/next/dist/client/components/navigation.js [app-client] (ecmascript)");
}),
]);

//# sourceMappingURL=_d1af77a2._.js.map
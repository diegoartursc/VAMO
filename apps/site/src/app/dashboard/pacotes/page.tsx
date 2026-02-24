"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAgencyPackages, deletePackage } from "@/lib/api";
import { getSession } from "@/lib/auth";

export default function PacotesListPage() {
    const [packages, setPackages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        (async () => {
            try {
                const session = await getSession();
                if (session?.agency?.id) {
                    const data = await getAgencyPackages(session.agency.id);
                    setPackages(data || []);
                }
            } catch {
                setPackages([]);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Arquivar pacote "${title}"?`)) return;
        try {
            await deletePackage(id);
            setPackages(prev => prev.filter(p => p.id !== id));
        } catch { alert("Erro ao arquivar pacote"); }
    };

    return (
        <div>
            <div className="roteiros-header">
                <h1 className="section-title">Meus Pacotes</h1>
                <Link href="/dashboard/pacote/new" className="btn-primary" style={{ padding: "10px 24px", fontSize: 14 }}>
                    + Novo Pacote
                </Link>
            </div>

            {loading ? (
                <div className="editor-skeleton">
                    <div className="skeleton-bar" style={{ width: "100%", height: 60 }} />
                    <div className="skeleton-bar" style={{ width: "100%", height: 60, marginTop: 8 }} />
                    <div className="skeleton-bar" style={{ width: "100%", height: 60, marginTop: 8 }} />
                </div>
            ) : packages.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 7V5a4 4 0 00-8 0v2" /></svg>
                    </div>
                    <h3>Nenhum pacote cadastrado</h3>
                    <p>Crie seu primeiro pacote de viagem para começar a vender</p>
                    <Link href="/dashboard/pacote/new" className="btn-primary" style={{ padding: "12px 28px", fontSize: 14 }}>
                        Criar Pacote
                    </Link>
                </div>
            ) : (
                <div className="roteiros-table-wrap">
                    <table className="roteiros-table">
                        <thead>
                            <tr>
                                <th>Pacote</th>
                                <th>Destino</th>
                                <th>Preço</th>
                                <th>Duração</th>
                                <th>Score</th>
                                <th>Status</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {packages.map(pkg => (
                                <tr key={pkg.id}>
                                    <td>
                                        <Link href={`/dashboard/pacote/${pkg.id}`} className="roteiro-link">
                                            {pkg.title}
                                        </Link>
                                    </td>
                                    <td>{pkg.destination}, {pkg.country}</td>
                                    <td>
                                        {pkg.price?.min != null
                                            ? `R$ ${pkg.price.min.toLocaleString("pt-BR")}`
                                            : pkg.priceMin != null
                                                ? `R$ ${pkg.priceMin.toLocaleString("pt-BR")}`
                                                : "—"}
                                    </td>
                                    <td>{pkg.duration} dias</td>
                                    <td>
                                        <div className="pkg-quality-mini" style={{
                                            "--q": `${pkg.qualityScore || 0}%`,
                                            "--qc": (pkg.qualityScore || 0) >= 80 ? "var(--success)" : (pkg.qualityScore || 0) >= 50 ? "var(--warning)" : "var(--error)",
                                        } as any}>
                                            <span>{pkg.qualityScore || 0}%</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${pkg.status?.toLowerCase()}`}>
                                            {pkg.status === "APPROVED" ? "Aprovado"
                                                : pkg.status === "PENDING_REVIEW" ? "Em revisão"
                                                    : pkg.status === "DRAFT" ? "Rascunho"
                                                        : pkg.status === "ACTIVE" ? "Ativo"
                                                            : pkg.status === "PAUSED" ? "Pausado"
                                                                : pkg.status === "REJECTED" ? "Rejeitado"
                                                                    : "Arquivado"}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-btns">
                                            <Link href={`/dashboard/pacote/${pkg.id}`} className="btn-sm">Editar</Link>
                                            <button className="btn-sm" style={{ color: '#1FA89F' }} onClick={() => {
                                                if (confirm(`Deseja iniciar um novo cadastro de pacote a partir de uma cópia de "${pkg.title}"?`)) {
                                                    router.push(`/dashboard/pacote/new?from=${pkg.id}`);
                                                }
                                            }}>Duplicar</button>
                                            <button className="btn-sm btn-danger" onClick={() => handleDelete(pkg.id, pkg.title)}>
                                                Arquivar
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

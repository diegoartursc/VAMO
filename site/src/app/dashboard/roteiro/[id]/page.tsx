"use client";

import Link from "next/link";
import { useState } from "react";

type SectionKey =
    | "basic"
    | "description"
    | "price"
    | "images"
    | "days"
    | "accommodation"
    | "transport"
    | "spending"
    | "checklist"
    | "important"
    | "highlights"
    | "emergency"
    | "includes";

interface Section {
    key: SectionKey;
    icon: string;
    title: string;
    status: "complete" | "incomplete";
}

const SECTIONS: Section[] = [
    { key: "basic", icon: "📝", title: "Informações Básicas", status: "complete" },
    { key: "description", icon: "📖", title: "Descrição", status: "complete" },
    { key: "price", icon: "💰", title: "Preço e Condições", status: "complete" },
    { key: "images", icon: "📸", title: "Imagens", status: "incomplete" },
    { key: "days", icon: "📅", title: "Dias e Atividades", status: "complete" },
    { key: "accommodation", icon: "🏨", title: "Hospedagem", status: "incomplete" },
    { key: "transport", icon: "🚌", title: "Transporte", status: "incomplete" },
    { key: "spending", icon: "💳", title: "Gastos Estimados", status: "complete" },
    { key: "checklist", icon: "✅", title: "Checklist", status: "incomplete" },
    { key: "important", icon: "⚠️", title: "Informações Importantes", status: "incomplete" },
    { key: "highlights", icon: "⭐", title: "Destaques", status: "complete" },
    { key: "emergency", icon: "🆘", title: "Contatos de Emergência", status: "incomplete" },
    { key: "includes", icon: "📦", title: "O que recebe", status: "complete" },
];

export default function RoteiroEditorPage() {
    const [openSection, setOpenSection] = useState<SectionKey | null>("basic");

    const toggleSection = (key: SectionKey) => {
        setOpenSection(openSection === key ? null : key);
    };

    return (
        <div className="editor-container">
            {/* Header */}
            <div className="editor-header">
                <Link href="/dashboard/roteiros" className="editor-back">
                    ← Voltar para Meus Roteiros
                </Link>
                <div className="editor-actions">
                    <button className="btn-outline">Salvar Rascunho</button>
                    <button className="btn-save">Publicar Roteiro</button>
                </div>
            </div>

            <div className="dash-header">
                <h1 className="dash-title">Editar Roteiro</h1>
                <p className="dash-subtitle">
                    Preencha todas as seções para publicar seu roteiro
                </p>
            </div>

            {/* Sections */}
            <div className="editor-sections">
                {SECTIONS.map((section) => (
                    <div className="editor-section" key={section.key}>
                        <div
                            className="editor-section-header"
                            onClick={() => toggleSection(section.key)}
                        >
                            <div className="editor-section-left">
                                <span className="editor-section-icon">{section.icon}</span>
                                <span className="editor-section-title">{section.title}</span>
                            </div>
                            <span
                                className={`editor-section-status ${section.status}`}
                            >
                                {section.status === "complete" ? "✓ Completo" : "Pendente"}
                            </span>
                        </div>

                        {openSection === section.key && (
                            <div className="editor-section-body">
                                {renderSectionContent(section.key)}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

function renderSectionContent(key: SectionKey) {
    switch (key) {
        case "basic":
            return (
                <>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Título do Roteiro</label>
                            <input className="form-input" defaultValue="Paris Econômica — 10 dias" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Destino</label>
                            <input className="form-input" defaultValue="Paris, França" />
                        </div>
                    </div>
                    <div className="form-row-3">
                        <div className="form-group">
                            <label className="form-label">Duração (dias)</label>
                            <input className="form-input" type="number" defaultValue={10} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Dificuldade</label>
                            <select className="form-input">
                                <option>Fácil</option>
                                <option selected>Moderado</option>
                                <option>Avançado</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Idioma</label>
                            <input className="form-input" defaultValue="Português" />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Tags (separadas por vírgula)</label>
                        <input className="form-input" defaultValue="europa, econômico, cultura, gastronomia" />
                    </div>
                </>
            );

        case "description":
            return (
                <>
                    <div className="form-group">
                        <label className="form-label">Descrição curta</label>
                        <textarea
                            className="form-input"
                            defaultValue="Descubra Paris sem gastar muito! Roteiro completo com hospedagem econômica, restaurantes acessíveis e todas as atrações imperdíveis."
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Descrição completa</label>
                        <textarea
                            className="form-input"
                            style={{ minHeight: 200 }}
                            defaultValue="Um roteiro detalhado para explorar Paris de forma econômica. Inclui dicas de hospedagem em hostels bem avaliados, restaurantes com menus acessíveis, passes de transporte, e estratégias para visitar todas as principais atrações sem gastar uma fortuna. Ideal para viajantes solo ou casais com orçamento limitado."
                        />
                    </div>
                </>
            );

        case "price":
            return (
                <>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Preço do roteiro (R$)</label>
                            <input className="form-input" type="number" defaultValue={49.90} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Preço promocional (R$)</label>
                            <input className="form-input" type="number" placeholder="Opcional" />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Política de reembolso</label>
                        <select className="form-input">
                            <option>Reembolso em até 7 dias</option>
                            <option>Reembolso em até 30 dias</option>
                            <option>Sem reembolso</option>
                        </select>
                    </div>
                </>
            );

        case "images":
            return (
                <>
                    <div className="form-group">
                        <label className="form-label">Imagem de capa (URL)</label>
                        <input className="form-input" placeholder="https://images.unsplash.com/..." />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Galeria de imagens</label>
                        <button className="btn-add-item">+ Adicionar Imagem</button>
                    </div>
                </>
            );

        case "days":
            return (
                <>
                    <div style={{ padding: '16px', background: 'var(--primary-bg)', borderRadius: 'var(--radius-sm)', marginBottom: 8 }}>
                        <div style={{ fontWeight: 700, marginBottom: 8 }}>Dia 1 — Chegada e Montmartre</div>
                        <div className="form-group">
                            <label className="form-label">Descrição do dia</label>
                            <textarea className="form-input" defaultValue="Chegada no aeroporto CDG. Transfer para o hostel em Montmartre. Visita à Sacré-Cœur e explorar as ruas do bairro." />
                        </div>
                        <div style={{ marginTop: 12 }}>
                            <div className="form-label" style={{ marginBottom: 8 }}>Atividades</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <div className="form-row">
                                    <input className="form-input" defaultValue="Transfer aeroporto → hostel" />
                                    <input className="form-input" defaultValue="09:00 - 11:00" />
                                </div>
                                <div className="form-row">
                                    <input className="form-input" defaultValue="Visita Sacré-Cœur" />
                                    <input className="form-input" defaultValue="14:00 - 16:00" />
                                </div>
                            </div>
                            <button className="btn-add-item" style={{ marginTop: 12 }}>+ Adicionar Atividade</button>
                        </div>
                    </div>

                    <div style={{ padding: '16px', background: 'var(--primary-bg)', borderRadius: 'var(--radius-sm)', marginBottom: 8 }}>
                        <div style={{ fontWeight: 700, marginBottom: 8 }}>Dia 2 — Torre Eiffel e Trocadéro</div>
                        <div className="form-group">
                            <label className="form-label">Descrição do dia</label>
                            <textarea className="form-input" defaultValue="Dia dedicado à icônica Torre Eiffel. Vista do Trocadéro pela manhã, subida à torre, e passeio pelo Champ de Mars." />
                        </div>
                    </div>

                    <button className="btn-add-item">+ Adicionar Dia</button>
                </>
            );

        case "accommodation":
            return (
                <>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Nome da hospedagem</label>
                            <input className="form-input" placeholder="ex: Le Village Hostel Montmartre" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Tipo</label>
                            <select className="form-input">
                                <option>Hostel</option>
                                <option>Hotel</option>
                                <option>Airbnb</option>
                                <option>Pousada</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Preço médio (por noite)</label>
                            <input className="form-input" type="number" placeholder="ex: 120" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Link de reserva</label>
                            <input className="form-input" placeholder="https://..." />
                        </div>
                    </div>
                    <button className="btn-add-item">+ Adicionar Hospedagem</button>
                </>
            );

        case "transport":
            return (
                <>
                    <div className="form-group">
                        <label className="form-label">Transporte recomendado</label>
                        <textarea className="form-input" placeholder="Descreva as opções de transporte no destino..." />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Passe de transporte</label>
                            <input className="form-input" placeholder="ex: Navigo Découverte" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Custo estimado</label>
                            <input className="form-input" placeholder="ex: €30/semana" />
                        </div>
                    </div>
                </>
            );

        case "spending":
            return (
                <>
                    <div className="form-row-3">
                        <div className="form-group">
                            <label className="form-label">Alimentação (diária)</label>
                            <input className="form-input" type="number" defaultValue={80} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Transporte (diário)</label>
                            <input className="form-input" type="number" defaultValue={15} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Atrações (diário)</label>
                            <input className="form-input" type="number" defaultValue={25} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Dicas de economia</label>
                        <textarea className="form-input" defaultValue="Evite restaurantes turísticos. Use o passe Navigo. Muitos museus são gratuitos no 1º domingo do mês." />
                    </div>
                </>
            );

        case "checklist":
            return (
                <>
                    <div className="form-group">
                        <label className="form-label">Itens da checklist (um por linha)</label>
                        <textarea
                            className="form-input"
                            style={{ minHeight: 150 }}
                            defaultValue={`Passaporte válido\nSeguro viagem\nAdaptador de tomada\nCasaco impermeável\nSapatos confortáveis\nMedicamentos pessoais\nCópia digital dos documentos`}
                        />
                    </div>
                </>
            );

        case "important":
            return (
                <>
                    <div className="form-group">
                        <label className="form-label">Informações importantes para o viajante</label>
                        <textarea
                            className="form-input"
                            style={{ minHeight: 150 }}
                            placeholder="Dicas de segurança, costumes locais, documentos necessários..."
                        />
                    </div>
                </>
            );

        case "highlights":
            return (
                <>
                    <div className="form-group">
                        <label className="form-label">Destaques do roteiro (um por linha)</label>
                        <textarea
                            className="form-input"
                            style={{ minHeight: 120 }}
                            defaultValue={`Torre Eiffel ao pôr do sol\nCafé da manhã em Montmartre\nPasseio de barco pelo Sena\nVisita ao Louvre sem filas\nMercado de flores Île de la Cité`}
                        />
                    </div>
                </>
            );

        case "emergency":
            return (
                <>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Emergência local</label>
                            <input className="form-input" defaultValue="112" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Embaixada do Brasil</label>
                            <input className="form-input" placeholder="Telefone da embaixada" />
                        </div>
                    </div>
                    <button className="btn-add-item">+ Adicionar Contato</button>
                </>
            );

        case "includes":
            return (
                <>
                    <div className="form-group">
                        <label className="form-label">O que o comprador recebe (um por linha)</label>
                        <textarea
                            className="form-input"
                            style={{ minHeight: 120 }}
                            defaultValue={`Roteiro completo dia a dia\nMapa interativo dos pontos\nLista de restaurantes testados\nChecklist de viagem\nDicas de economia exclusivas\nContatos de emergência`}
                        />
                    </div>
                </>
            );

        default:
            return <p>Seção em construção...</p>;
    }
}

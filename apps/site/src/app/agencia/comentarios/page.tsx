"use client";

import { useState } from "react";

export default function ComentariosPage() {
    const [comentarios] = useState([
        { id: 1, user: "Mariana Silva", item: "Roteiro: Fernando de Noronha", text: "O roteiro está muito bem detalhado, mas senti falta de falar sobre o transporte entre praias.", date: "2026-02-25" },
        { id: 2, user: "João Pedro", item: "Pacote: Chapada Diamantina", text: "Gostaria de saber se tem opção de guia bilingue para esse pacote específico.", date: "2026-02-24" },
        { id: 3, user: "Roberta G.", item: "Roteiro: Jalapão", text: "Incrível! As dicas de restaurantes foram o ponto alto da viagem.", date: "2026-02-20" },
    ]);

    return (
        <div className="comments-page">
            <div className="dash-header">
                <h1 className="dash-title">Comentários e Feedbacks</h1>
                <p className="dash-subtitle">Acompanhe o que os viajantes estão dizendo sobre seus produtos</p>
            </div>

            <div className="itinerary-table">
                <div className="table-row table-row-head">
                    <div className="table-cell">Viajante</div>
                    <div className="table-cell">Item Relacionado</div>
                    <div className="table-cell">Comentário</div>
                    <div className="table-cell">Data</div>
                </div>

                {comentarios.map(c => (
                    <div className="table-row" key={c.id}>
                        <div className="table-cell"><strong>{c.user}</strong></div>
                        <div className="table-cell">{c.item}</div>
                        <div className="table-cell" style={{ maxWidth: "400px", lineHeight: "1.4" }}>{c.text}</div>
                        <div className="table-cell">{c.date}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

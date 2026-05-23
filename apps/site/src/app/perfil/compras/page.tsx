import EmptyState from "../_components/EmptyState";

export default function ComprasPage() {
    return (
        <EmptyState
            title="Minhas compras"
            subtitle="Roteiros e pacotes que você adquiriu aparecem aqui."
            emoji="🧳"
            ctaHref="/criadores"
            ctaLabel="Explorar roteiros"
            description="Depois da compra, você acessa o material completo, contato com o criador e seu histórico de viagem."
        />
    );
}

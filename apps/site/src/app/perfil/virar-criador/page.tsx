import EmptyState from "../_components/EmptyState";

export default function VirarCriadorPage() {
    return (
        <EmptyState
            title="Vire um criador VAMO"
            subtitle="Transforme suas viagens em roteiros que outras pessoas vão comprar."
            emoji="✨"
            ctaHref="/dashboard/roteiro/novo"
            ctaLabel="Criar primeiro roteiro"
            description="Ao publicar seu primeiro roteiro, você ativa automaticamente o modo Criador na sua conta — todas as ferramentas de dashboard, vendas e analytics ficam disponíveis."
        />
    );
}

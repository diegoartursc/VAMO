import EmptyState from "../_components/EmptyState";

export default function FavoritosPage() {
    return (
        <EmptyState
            title="Seus favoritos"
            subtitle="Roteiros salvos pra depois aparecem aqui."
            emoji="❤️"
            ctaHref="/explore"
            ctaLabel="Explorar roteiros"
            description="Quando você curtir um roteiro durante a navegação, ele entra direto nessa lista."
        />
    );
}

// Bio genérica/legada gerada automaticamente pelo backend em versões antigas
// (auto-criação de Creator no primeiro roteiro, ou profileName no cadastro).
// Detecta apenas para mascarar na LEITURA — nunca apaga/altera o banco.
const LEGACY_BIO_PATTERN = /^Roteirista no VAMO\s*[—-]\s*.+$/i;

export function isGenericCreatorBio(bio: string | null | undefined): boolean {
    const trimmed = (bio ?? '').trim();
    if (!trimmed) return true;
    return LEGACY_BIO_PATTERN.test(trimmed);
}

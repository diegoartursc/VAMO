// VAMO — Feature flags do app mobile
//
// Centraliza flags de rollout. A comunicação da "central de viagem" pós-compra
// só deve aparecer quando a funcionalidade interativa estiver de fato disponível.
// As features (aba Original, Minha Versão, checklist, central de arquivos,
// edição de custos, export em PDF) já estão implementadas e sempre ativas no
// pós-compra — esta flag existe como kill switch da comunicação comercial.

export const features = {
  /**
   * Liga/desliga toda a comunicação sobre a experiência interativa pós-compra
   * (seção de valor em Detalhes do Roteiro, box perto do botão de compra,
   * badge "Roteiro interativo", reforços no checkout e em Meus Roteiros).
   */
  interactivePurchasedRouteEnabled: true,
} as const;

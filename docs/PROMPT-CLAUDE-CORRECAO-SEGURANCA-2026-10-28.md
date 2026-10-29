# Prompt para Claude/Fable — corrigir e reauditar a segurança do VAMO

Copie o texto abaixo para uma sessão do Claude/Fable com acesso ao repositório VAMO. O relatório complementar está em `docs/ANALISE-SEGURANCA-2026-10-28.md`.

**Antes de abrir a sessão (Diego):**

1. Na raiz do repositório, rode `touch .claude/skip-boot`. Isso desliga o boot automático, que ligaria o backend no banco de produção.
2. Abra a sessão do Fable **na pasta VAMO** (sessão local, não na nuvem).
3. Revise a seção "Decisões já definidas" abaixo. Se alguma estiver errada, corrija antes de colar.
4. Na Fase 6 (implantação), o Fable vai pedir sua autorização **uma operação por vez**. Responda "autorizo" só depois de ler o que ele vai fazer.
5. Ao terminar tudo, rode `rm .claude/skip-boot` para voltar ao normal (o Fable também lembra você).

---

Você vai **analisar, corrigir e reauditar** a segurança do VAMO. O trabalho tem duas metades com o mesmo peso:

- **Análise própria:** a análise de 28/10 é um ponto de partida, não o limite. Confirme cada achado, procure o que ela não cobriu e registre novos achados com evidência.
- **Execução:** implemente as correções, crie testes que demonstrem os ataques e verifique os fluxos legítimos.

Não entregue apenas diagnóstico, plano ou recomendações, e também não pule a análise para sair codificando. Não conclua "está OK" com base apenas em build, lint, npm audit ou testes que reproduzem a própria implementação.

## Como organizar a sessão (orçamento limitado)

Esta sessão tem orçamento de créditos limitado e pode ser interrompida. Trabalhe em fases, nesta ordem, e **feche cada fase com um commit local e o relatório atualizado** antes de começar a próxima. Se a sessão acabar no meio, o que já foi feito precisa estar salvo, revisável e descrito.

- **Branch:** crie `security-fixes-2026-10-28` a partir do commit atual e trabalhe só nela. Commits locais por fase; **sem push até a Fase 6** (Vercel e Render publicam a `main` automaticamente). Se `.claude/skip-boot` não existir, pare e avise o usuário antes de rodar qualquer coisa.
- **Relatório vivo:** crie `docs/SEGURANCA-POS-CORRECAO-2026-10-28.md` logo na Fase 0 e atualize ao fim de cada fase (tabela de estado, testes, pendências).
- **Fases:**
  - **Fase 0 — Análise (sem editar código do app):** reconfirmar SEC-01 a SEC-16 e fazer a análise própria descrita em "Análise própria obrigatória". Saída: tabela de estado + novos achados com gravidade e evidência, e a ordem das fases seguintes revista se algum achado novo for mais grave.
  - **Fase 1 — Contas e admin:** SEC-01, SEC-07, SEC-06, SEC-10, SEC-16.
  - **Fase 2 — Conteúdo pago e documentos:** SEC-02, SEC-03, SEC-04, SEC-05.
  - **Fase 3 — Dinheiro:** SEC-11, SEC-12, SEC-13, SEC-15.
  - **Fase 4 — Upload, dependências e confiança:** SEC-08, SEC-09, SEC-14 e novos achados da Fase 0.
  - **Fase 5 — Reauditoria independente** e parecer final do código.
  - **Fase 6 — Implantação com autorização do Diego:** publicar, migrar e verificar em produção, uma operação por vez (ver seção "Fase 6").
- Se perceber que não vai dar tempo de tudo, priorize terminar e validar a fase em andamento em vez de abrir várias pela metade.

## Decisões já definidas (não pare para perguntar)

Propostas por Claude em 28/10 e revisadas pelo Diego antes de colar este prompt. Use-as como regra de produto:

| Tema | Decisão |
| --- | --- |
| Acesso após **reembolso total** | O comprador perde o acesso ao conteúdo pago. A venda continua registrada com estado de reembolsada. |
| Acesso após **reembolso parcial** | Mantém o acesso. |
| **Disputa aberta** | Mantém o acesso; o repasse ao roteirista fica travado até o desfecho. |
| **Disputa ganha** pela VAMO | Tudo volta ao normal; repasse liberado. |
| **Disputa perdida** | Perde o acesso; reverter a transferência ao roteirista proporcionalmente ao valor perdido, se já tiver sido feita. |
| Reembolso **depois** do repasse | Reverter a transferência proporcionalmente (Transfer Reversal); se faltar saldo na conta do roteirista, registrar pendência e alertar o admin. |
| Quem paga a taxa da Stripe | A VAMO (sai dos 20%). O roteirista recebe 80% cheios. |
| **Prévia pública** de roteiro ACTIVE | Título, capa e galeria pública, descrição, destino, país, duração, preço/moeda, estilo, perfil público do criador, avaliações, lista de módulos ativos com contagens e resumo de custos. **Só para quem comprou (ou dono/admin):** dias, atividades, dicas, checklist, hospedagens/restaurantes/transportes detalhados, arquivos e links. |
| Troca do sistema de tokens | Pode invalidar todas as sessões atuais e exigir novo login (hoje há 2 viajantes e 1 admin). |
| Multer | Atualizar para a versão 2.x suportada mais recente que cubra os avisos vigentes. |
| Banco de teste | Não há Docker e o Postgres local foi abandonado. Use Prisma e Stripe simulados; banco descartável só se você conseguir criar um isolado sem tocar em produção. |
| Compra demonstrativa (`demo`) | Não existe fora de testes automatizados. |

Se uma decisão nova for realmente indispensável, implemente o caminho mais conservador (que nega acesso ou trava dinheiro), isole-o num ponto fácil de mudar e registre no relatório.

## Análise própria obrigatória (Fase 0 e Fase 5)

Além de reconfirmar os SEC, investigue pelo menos estes pontos, que a análise de 28/10 cobriu pouco ou não cobriu. Para cada um, registre: o que foi verificado, como, resultado (reproduzido / confirmado por leitura / não encontrado / não verificável) e gravidade.

1. **Autorização rota a rota:** liste todas as rotas montadas em `apps/backend/src/index.ts` com método, middleware de auth, papel exigido e checagem de dono. Procure IDOR em cada `:id` (roteiros, vendas, perguntas/respostas, avaliações e denúncias, carrinho, favoritos, my-trips, trip-center, shares, creators, admin).
2. **Rotas novas desde 15/10:** denúncia e moderação de avaliações (`routes/reviews.ts`, `routes/admin.ts`), convite de avaliação (`jobs/reviewRequests.ts`), onboarding Connect e status (`routes/creators.ts`), ganhos do criador (`/me/earnings`), job de repasse (`jobs/payouts.ts`), aceite de termos no cadastro.
3. **Painel admin (`apps/site`):** como o token admin é guardado e enviado, rotas Next que chamam o backend, proteção das páginas `/admin`, CSRF/CORS, e o fato de o projeto `vamo-admin` estar publicado na Vercel com Deployment Protection.
4. **Configuração HTTP do backend:** CORS (`ALLOWED_ORIGINS`), helmet/headers, `trust proxy` atrás do Render, rate limit (login, cadastro, esqueci a senha, perguntas, denúncias, uploads), tamanho de corpo JSON, mensagens de erro que vazam stack ou detalhes.
5. **E-mails:** injeção de cabeçalho ou HTML com dados do usuário (nome, título do roteiro, mensagem do suporte), links com host vindo do request, enumeração de contas por resposta/tempo em login, cadastro e esqueci a senha.
6. **Mass assignment** em cadastro, perfil, criador e roteiro além de `featured`/`proofStatus` (ex.: `role`, `status`, `verificationLevel`, `totalSales`, `rating`, `approvedAt`, `creatorId`, `price` depois de vendido).
7. **Fluxo de status do roteiro:** o criador consegue publicar sem aprovação, editar depois de aprovado sem nova revisão, ou mudar preço/moeda com vendas em andamento?
8. **Cliente mobile/web:** onde tokens ficam (localStorage/AsyncStorage/SecureStore), links externos sem validação de protocolo, renderização de HTML/markdown vindo do criador, geração de PDF com conteúdo do criador, deep links.
9. **Storage (Supabase):** bucket público vs privado no código, nomes previsíveis, quem pode listar, URLs assinadas e validade. Verifique só pelo código; não acesse o bucket real.
10. **Segredos e logs:** busca de segredos no checkout e no histórico com saída redigida; logs que imprimem tokens, links de reset, URLs de documentos ou dados pessoais.
11. **Dependências e supply chain:** `npm audit` por workspace com triagem de alcance real, scripts `postinstall`, versões não fixadas em pacotes sensíveis.
12. **Privacidade (CCPA/LGPD):** exclusão de conta realmente apaga/anonimiza dados pessoais; exportação de dados; o que fica em snapshots de compra.

Achado sem reprodução deve ser marcado como tal. Não invente gravidade: justifique pelo impacto e pela condição de exploração.

## Contexto e limites autorizados

O VAMO é um monorepo: backend Express 4 + Prisma/PostgreSQL em `apps/backend`, site/admin Next.js em `apps/site`, app Expo/React Native em `apps/mobile` e lógica em `packages/shared`. Preserve a stack, funcionalidades, previews, acesso legítimo a compras, snapshots, identidade visual e regras de moeda/comissão compartilhadas. Corrija as causas, sem refatoração ampla.

Leia `AGENTS.md`, `CLAUDE.md`, `docs/ANALISE-SEGURANCA-2026-10-28.md`, os manifests e os arquivos afetados. Confira `git status` e o commit atual. A análise original usou o commit `25823d4` e foi revisada em `4c8a1af` (veja a seção "Atualização de 28/10/2026" da análise); linhas e diagnósticos precisam ser reconfirmados se o código mudou. Não sobrescreva trabalho existente.

**Instrução explícita para esta tarefa:** o boot automático definido em `CLAUDE.md` e no hook `scripts/session-start-hook.sh` não deve iniciar uma API ou jobs conectados ao banco real durante testes de segurança. Primeiro prepare ambiente isolado e verifique os destinos sem revelar credenciais. Não execute `scripts/health.sh`, `audit-prod.ts`, seeds, scripts e2e, `npm start` ou comandos que alcancem produção como parte dos testes. O `npm start` do backend aplica migrations. Nunca use `.env` real implicitamente nos testes.

Use Prisma e Stripe simulados para os testes unitários/HTTP e, se necessário, um banco de teste descartável separado, sem acesso a dados reais. Assinaturas Stripe podem ser geradas offline com segredos sintéticos. Proíba saída de rede real para banco, SMTP, storage e provedor nos testes. Não imprima senhas, tokens, chaves, URLs de documentos ou valores de ambiente.

Está autorizado implementar e validar correções locais, testes, migrations aditivas geradas offline, ferramentas de migração em dry-run e documentação. Até o fim da Fase 5, não faça push, merge, deploy, cobrança, estorno, transferência, rotação de segredo real ou escrita em banco/bucket de produção. Prepare esses passos concretamente, com diff, inventário redigido, validação, rollback e uma lista final de operações que dependem de autorização. Continue todo o trabalho independente enquanto houver dependência externa.

Não use `prisma migrate dev`, `migrate reset`, `db push`, seed, `git reset --hard`, `push --force` ou reescrita de histórico. Migrations devem ser SQL offline versionado e revisado. Não remova registros financeiros, usuários ou conteúdo para “resolver” segurança. Não aplique `npm audit fix --force` nem faça downgrade/migração ampla de Expo às cegas.

## Método obrigatório

1. (Fase 0) Reconfirme cada SEC abaixo, faça a análise própria e monte uma tabela de estado. Diferencie reproduzido, confirmado por leitura, condicional, já corrigido e não aplicável, com evidência.
2. Antes de alterar cada causa, escreva um teste negativo que falhe por causa da brecha atual, usando o middleware/handler/parser real quando aplicável. Rode e registre a falha esperada. Não substitua a autorização real por um mock que já devolve 401.
3. Implemente em grupos pequenos, com contratos explícitos e atualizações coordenadas dos clientes.
4. Rode os mesmos testes e também os fluxos positivos. Preserve os testes existentes; não relaxe assertions, apague cenários ou introduza skips para ficar verde.
5. Ao terminar, faça uma segunda auditoria com foco em caminhos alternativos e falhas das próprias correções. Use um subagente revisor com contexto novo, se disponível; ele deve revisar o diff e tentar invalidar as conclusões antes de ver sua declaração de sucesso. Se não houver subagente, faça uma passagem separada sem editar, registre suas limitações e execute novos ataques negativos.
6. Corrija todo novo achado relevante e repita a verificação afetada. Se depender de produção ou decisão de negócio indispensável, registre a pendência com precisão; não declare o sistema aprovado nessa dimensão.

## Correções exigidas

### 1. Tokens e sessões — SEC-01 e SEC-07

Arquivos iniciais: `apps/backend/src/lib/auth.ts`, `middleware/traveler-auth.ts`, `middleware/auth.ts`, `middleware/admin-auth.ts`, `routes/traveler-auth.ts`, `routes/admin.ts`, scripts de reset e clientes de sessão.

Hoje access, refresh e arquivo compartilham segredo e não têm validação obrigatória de finalidade nas rotas de sessão. O JWT de arquivo tem `travelerId`; o middleware aceita esse JWT como Bearer, e o refresh também aceita access/file. Access continua válido após troca de senha. Reset administrativo de traveler não atualiza `passwordChangedAt`; reset de admin não revoga JWT emitido.

Implemente emissão e validação específicas por finalidade, algoritmo permitido, issuer/audience e claims obrigatórias com tipos estritos. Tokens de arquivo devem ter escopo de um único arquivo/dono e expiração curta; não podem acessar conta, admin ou refresh. Auth opcional deve aplicar a mesma validação de sessão. Inclua todos os validadores manuais de `traveler-auth.ts` (GET/PATCH /me e `authTravelerIdFromHeader` no upload de avatar/capa), além dos middlewares; busque todos os consumidores de `verifyToken`/`jwt.verify`. Rejeite tokens legados sem finalidade com estratégia explícita de encerramento/relogin. Inclua estratégia de refresh rotativo, detecção de reuso e revogação de sessões; encerrar no servidor ao trocar senha e nos scripts, inclusive admin, e implementar logout coerente nos clientes. Não basta acrescentar `purpose` apenas na emissão.

Teste matriz access/refresh/file/admin em cada verificador e endpoint: tipo errado, assinatura errada, expirado, algoritmo/issuer/audience inválidos, claims faltantes, dono/arquivo trocados e sessão revogada. Inclua as duas implementações administrativas: `verifyAdmin` em `routes/admin.ts` e `middleware/admin-auth.ts`. Teste reset e logout com credenciais previamente emitidas, inclusive borda de segundo do timestamp e requisições simultâneas de refresh. Mostre que refresh válido funciona, token antigo/reutilizado não e arquivo legítimo continua abrindo para o dono.

### 2. Respostas públicas e documentos — SEC-02, SEC-03, SEC-04 e SEC-05

Arquivos iniciais: `routes/itineraries.ts`, `routes/creators.ts`, `routes/shares.ts`, `routes/my-trips.ts`, `routes/traveler-trip-center.ts`, `lib/storage.ts`, `routes/uploads.ts` e `src/index.ts`; verifique também snapshots, exports e clientes.

- O detalhe público de roteiro ACTIVE entrega dias/atividades/dicas/checklists/arquivos completos sem compra. A listagem também repassa módulos JSON. Defina DTOs separados para catálogo/prévia, dono, comprador e admin, com listas explícitas de campos. Preserve a prévia necessária ao marketplace e proteja conteúdo integral por compra/propriedade. Revise todos os endpoints alternativos e o storage de anexos pagos.
- `travelProofUrl` e `cost.proofFiles` administrativos vazam em respostas públicas/compradas e snapshots. Separe mídias públicas, conteúdo pago e documentos privados. Autorize comprovantes apenas a dono/admin. Sanitize profundamente campos aninhados e snapshots legados na leitura; não altere indiscriminadamente os snapshots históricos no banco. URL pública conhecida não pode continuar funcionando depois da migração.
- `/api/itineraries/dashboard/stats?creatorId=...` é anônimo e consulta outro criador, incluindo receita e rascunhos. Exija sessão e derive ownership do token/DB; não aceite um ID arbitrário como autorização. Administração deve ter fluxo próprio. Dados públicos de reputação precisam de DTO público distinto.
- O bloqueio literal de `TravelerFile` em `/uploads/itineraries/:filename` é burlado por dupla barra e encoding antes do `express.static`. Tire arquivos privados da raiz estática. Enquanto houver legado, autorização e resolução de caminho precisam usar a mesma forma canônica e falhar fechadas.

Crie testes com anônimo, usuário A, usuário B, comprador, criador dono e admin. Cheque status e o corpo completo: nenhum segredo deve aparecer em nenhuma profundidade, nem sob nome alternativo. Inclua rascunho/rejeitado/arquivado, listagem/destaque, detalhe, shares, snapshots antigos, exports e acesso direto ao objeto. Teste `/uploads/itineraries//arquivo.pdf`, `/uploads/%69tineraries/arquivo.pdf`, outras variantes de encoding e GET/HEAD. Teste links expirados e acesso ao arquivo de outra conta.

Prepare ferramenta de migração de documentos já públicos com dry-run padrão: classificação, referências, cópia verificada privada, troca de referência, revogação da origem e rollback. Não delete/mova documentos reais nesta execução. Registre a implantação/migração pendente como bloqueio de proteção efetiva dos objetos anteriores.

### 3. Ambientes e acesso administrativo — SEC-06, SEC-10 e SEC-16

- Remova a aceitação de `mock-admin-token` e a criação automática de SUPER_ADMIN via esse caminho. Teste que nenhuma combinação de `NODE_ENV`, IP ou header o habilita. Preserve login administrativo legítimo e bootstrap controlado, sem recriar seed de dados.
- Webhook deve exigir assinatura válida sobre corpo bruto em todos os ambientes que usam a integração real. Não aceite evento JSON não assinado por `NODE_ENV`. Compras demonstrativas devem ficar impossíveis contra banco/Stripe reais, mesmo com configuração de desenvolvimento ou flag acidental.
- Valide configuração antes de abrir listener/iniciar jobs; falhe fechado para combinações inseguras e documente os requisitos. Use credenciais/destinos separados; não confie só na etiqueta `NODE_ENV`. Atualize `.env.example` sem valores reais e mantenha instruções de inicialização coerentes.
- Valide tipos/tamanhos no login/seed admin antes de Prisma/bcrypt. No Express 4, encaminhe rejeições async ao error handler de forma consistente em handlers e middlewares. Não faça migração de framework para contornar esse problema. Teste senha objeto/array, e-mail inválido, corpo ausente, falha Prisma, falha bcrypt e serviço vivo após cada erro; nenhuma rejeição não tratada.
- O par de login/senha do hook já foi removido do arquivo atual em 28/10 (o hook agora é `scripts/session-start-hook.sh`), mas continua no histórico do Git. Confirme que não há outras cópias e procure segredos no checkout e histórico com saída redigida. `.claude/settings.local.json` também tem senhas em comandos permitidos, mas é ignorado pelo Git; registre-o como risco local. Não teste a credencial real nem a copie para relatório. Documente possível rotação/revogação se ainda válida/reutilizada; prepare o procedimento sem executar em produção ou reescrever Git.

### 4. Upload e dependências — SEC-08 e SEC-09

`routes/uploads.ts` combina memoryStorage cloud, 20 arquivos e 100 MiB por arquivo, permitindo aproximadamente 2 GiB por requisição, num serviço documentado com 512 MB.

Imponha limites no servidor de bytes por arquivo e agregado, quantidade, campos/partes, concorrência e quota. Faça rejeição precoce e limpeza ao abortar/falhar. Prefira streaming ou upload direto autorizado com restrições verificadas, preservando os formatos e a experiência legítima. Faça o orçamento de memória explícito; não use limite de frontend como defesa. Revise documentos da Central da Viagem e crescimento de storage/DB. Testes devem usar limites pequenos configuráveis e streams sintéticos, nunca cargas grandes na produção.

Multer `1.4.5-lts.2` instalado está afetado pelo aviso oficial GHSA-wc9g-mqfw-jrwm. Atualize para versão suportada que cubra os avisos atuais, incluindo os posteriores à 2.3.0, com validação de compatibilidade dos parsers/limpeza/assinatura de arquivo. Reexecute `npm audit --omit=dev --json` geral e por workspace. A consulta original encontrou 18 entradas no geral e 2 no backend, mas isso muda com o tempo. Zod/qs e dependências de ferramentas Expo precisam de triagem de alcance, atualizações compatíveis e evidência; não afirme que todo aviso corresponde a exploit no app. Confira versão instalada e lockfile, além do manifesto. Não restaure Next/Nodemailer antigos: já estavam em 16.4.3/10.2.1 na análise.

### 5. Dinheiro, estados e repasses — SEC-11, SEC-12, SEC-13 e SEC-15

Arquivos iniciais: `routes/payments.ts`, `jobs/payouts.ts`, `prisma/schema.prisma`, autorização pós-compra, relatórios do criador/admin e testes.

- O webhook só trata checkout pago e ignora estorno, disputa e reversão. Persista estados e IDs do provedor para conciliação, idempotência, eventos duplicados/fora de ordem, processamento confiável e retries. Vincule cada evento à venda/pagamento correto; não libere compra apenas por conteúdo de um JSON. Preserve validação de assinatura e checagem de identidade no retorno do checkout.
- Vendas já transferidas precisam de tratamento de estorno/disputa/reversão. Suspenda novos repasses de vendas em risco. Para recuperar transferência quando devida, trate valor proporcional, limites, saldo insuficiente, retries persistidos e alerta de intervenção. Siga a política de disputa: aceitar pode exigir reversão imediata; contestar depende do desfecho. Não reverta indiscriminadamente toda disputa criada. Se faltar uma decisão indispensável, prepare implementação segura e isole o ponto para decisão.
- A política de acesso após estorno total/parcial/disputa deve ser explícita, refletida no servidor e nos relatórios. Não apague a venda para esconder histórico. Estorno total não pode continuar sendo tratado como venda paga válida por simples existência da linha; parcial/disputa não podem causar exclusão indiscriminada de direitos sem política definida.
- `refundPaymentIntentIfNeeded` considera qualquer refund succeeded/pending como total devolvido, mesmo de 1 centavo. Calcule montante realmente devolvido/restante e valores pendentes/reservados; diferencie pendente, concluído e falhou. Trate concorrência, paginação e idempotência. Um refund total pendente é iniciação válida: persista-o, confirme recebimento com 2xx e acompanhe via eventos/conciliação; não crie outro refund nem provoque retry contínuo só por ainda estar pending. Distinga e-mails de início e de conclusão; o corpo atual já diz que o refund foi iniciado, mas o título antecipa conclusão.
- Congele e valide valor, moeda, comissão e destinatário no pedido/venda a partir da transação confirmada. O fulfillment não pode usar preço atual do roteiro para uma sessão antiga; payout não pode usar moeda atual do roteiro nem recalcular comissão vigente de uma venda histórica. Use unidades mínimas inteiras conforme a moeda. Preserve comissões legadas e faça plano explícito para dados antigos.
- A varredura de payout sempre pega as 50 vendas mais antigas sem transferência. Vendas estornadas/disputadas ou Connect incompleto ficam no início para sempre. Implemente paginação determinística/estados de tentativa para que inelegíveis não bloqueiem as seguintes.

Testes mínimos: checkout simultâneo; retorno + webhook repetidos; replay/ordem invertida; valor/moeda divergentes; preço alterado durante checkout; moeda e comissão alteradas depois; comissão histórica; falha antes/depois de persistir; refund parcial, total, pendente, falho e concorrente; disputa aberta/ganha/perdida; estorno antes/depois do repasse; reversão parcial/repetida/falha; restart do worker; mais de 50 inelegíveis antes de uma elegível. Nenhuma operação deve cobrar, estornar ou transferir dinheiro real.

**Preserve correções já existentes:** há idempotency key de checkout e detecção/estorno de PaymentIntent duplicado; falha de refund por roteiro indisponível já devolve 500 no webhook para retry; existe job de repasse. Não reintroduza bugs nem apresente essas proteções como ausentes. Amplie testes de integração das causas remanescentes.

### 6. Integridade de confiança — SEC-14

Criador pode enviar `featured` e `cost.proofStatus=approved`; o selo “Verified by VAMO” usa esse status.

Defina schemas/listas de escrita por papel, inclusive para JSON aninhado. Destaque e decisões de comprovação são exclusivos do admin/backend; desconsidere/rejeite valores enviados pelo criador. Invalide aprovação quando mudar valor, arquivo ou conteúdo associado. Teste payload completo, PATCH/PUT parcial, objetos aninhados, campo omitido, mudança após aprovação e caminho administrativo legítimo.

## Nova auditoria e critério de aceite

Depois das correções, procure caminhos alternativos de tomada de conta, IDOR, mass assignment, autorização por papel, exposição de documentos, XSS/URLs/PDF, uploads, abuso de recursos, segredos e falhas financeiras. Uma observação sem reprodução deve ser identificada como tal. localStorage não é prova de XSS, e ausência de SSRF encontrado não certifica ausência de SSRF.

Execute e registre:

- Typecheck dos três apps e shared conforme sua configuração real; lint/build relevantes em ambiente isolado. Não esconda erro com `ignoreBuildErrors`.
- Testes existentes e novos de segurança, com comandos, contagens e resultados; evidência “falha antes / passa depois”.
- Testes HTTP dos middlewares/rotas montadas, não só helpers puros. Separe criação do app do listener/jobs se necessário para permitir testes sem efeitos.
- Fluxos positivos: cadastro/login/refresh/logout, reset, admin, catálogo/prévia, edição/submissão/aprovação, compra, conteúdo autorizado, documento privado, upload e repasse simulado.
- Auditoria de dependências e busca de segredos sem revelar valores. Para cada aviso remanescente, documente pacote, alcance, mitigação e pendência; não confunda contagem npm com número de falhas exploráveis.
- Revisão independente do diff e dos testes. Corrija os achados e repita a verificação necessária.

Entregue `docs/SEGURANCA-POS-CORRECAO-2026-10-28.md` (iniciado na Fase 0 e atualizado a cada fase) com a tabela SEC-01 a SEC-16 contendo causa, mudança, arquivos/linhas atuais, teste que a comprova e status. Use somente: **corrigido e validado**, **já corrigido com evidência**, **condicional/não aplicável com justificativa**, **pendente de operação externa** ou **não corrigido**. Acrescente uma seção "Novos achados" (NEW-01, NEW-02…) com tudo o que a análise própria e a reauditoria encontraram, no mesmo formato e com os mesmos status.

Entregue também checklist de implantação: variáveis necessárias sem valores, ordem de migrations/deploy, encerramento dos tokens antigos, migração/revogação de documentos públicos, conciliação de pagamentos anteriores, verificação de RLS/buckets/headers/origens/proxy realmente publicados, smoke tests seguros e rollback que não reabra a brecha. Se os repositórios espelhados `VAMOsite`/`adminVAMO` ainda forem usados, identifique como sincronizar a correção; não altere outros repositórios ou faça publicação automaticamente.

Conclua com parecer objetivo em três dimensões:

1. **Código local:** aprovado ou reprovado nos cenários efetivamente testados, com limitações.
2. **Homologação:** validada ou pendente, indicando o que faltou executar.
3. **Produção:** validada, pendente de implantação/configuração ou reprovada; não inferir pelo estado local.

Só declare as brechas corrigidas quando houver evidências. Falta de credencial/ambiente é uma pendência, nunca um teste aprovado. Ao fim da Fase 5, informe riscos residuais e a lista exata de operações que exigem autorização, após deixar todo o trabalho local concreto e revisável. Não prometa segurança absoluta.

## Fase 6 — Implantação com autorização do Diego

Só comece depois de entregar o relatório da Fase 5 com o parecer de código **aprovado** (se estiver reprovado, corrija antes ou pergunte ao Diego se quer publicar só a parte aprovada). Nesta fase você **pode** fazer push, merge, deploy, migrations e verificações em produção, mas **cada operação exige autorização explícita do Diego no chat, uma por vez**.

**Como pedir cada autorização.** Antes de cada operação, mostre em português simples e curto:

1. o que vai fazer e o comando exato (sem valores secretos);
2. o que muda para os usuários (ex.: "todos precisam entrar de novo no app");
3. como verificar que deu certo;
4. como desfazer, e se desfazer reabre alguma brecha.

Termine com a pergunta "Autoriza?". Só execute depois de uma resposta afirmativa clara do Diego **a essa operação**. Uma autorização não vale para a próxima. Se ele perguntar algo ou responder de forma ambígua, explique e pergunte de novo. Se algo der errado, pare, mostre o erro e proponha o próximo passo; não tente consertar em produção sem nova autorização.

**Ordem sugerida** (ajuste ao checklist de implantação que você escreveu):

1. **Backup do banco** (`cd apps/backend && npx tsx scripts/backup-db.ts`), respeitando a pegadinha do Prisma com colunas novas descrita no `CLAUDE.md`. Confirme onde o arquivo ficou.
2. **Variáveis de ambiente novas** no Render e na Vercel. Você não tem acesso aos painéis: liste nome, onde colocar e de onde vem o valor, sem mostrar valores, e espere o Diego confirmar que colou. Nunca peça para ele colar segredos no chat.
3. **Merge da branch na `main` e push.** Isso publica sozinho: Render (backend + migrations no `npm run start`) e Vercel (app e admin). Use merge normal; nunca `push --force` nem reescrita de histórico.
4. **Acompanhar o deploy:** status no GitHub, `/health` do Render respondendo 200, migrations aplicadas (`npx prisma migrate status` ou logs), bundle novo no Vercel.
5. **Smoke tests seguros em produção, só leitura ou com as contas do próprio Diego:** login/refresh/logout, catálogo e prévia sem login (sem conteúdo pago), roteiro comprado com a conta do Diego, painel admin, rotas atacadas antes (dupla barra, `%69`, token de arquivo como Bearer, `/dashboard/stats` anônimo) agora recusadas. Nada de cobrança real, estorno, transferência ou upload grande.
6. **Encerramento de sessões antigas**, se não acontecer sozinho pelo deploy. Avise que todos terão de entrar de novo.
7. **Migração de documentos públicos para privado:** primeiro o dry-run com o inventário redigido; a execução real é uma autorização separada.
8. **Conciliação de pagamentos e repasses antigos:** primeiro relatório em dry-run; qualquer escrita é outra autorização.
9. **Tarefas que só o Diego faz** (rotação de chaves no Stripe/Supabase/Render, 2FA, RLS e buckets no painel do Supabase, Deployment Protection): passo a passo com o caminho exato no painel; espere ele confirmar cada uma.
10. **Fechamento:** atualize `docs/SEGURANCA-POS-CORRECAO-2026-10-28.md` com a dimensão **Produção** (o que foi aplicado, verificado e o que ficou pendente), marque os itens em `docs/LANCAMENTO-TASKS.md`, atualize o `CLAUDE.md` se algo de operação mudou (tokens, variáveis, storage) e lembre o Diego de rodar `rm .claude/skip-boot`.

**Rollback:** se um smoke test falhar de forma que afete usuários, proponha o rollback (redeploy da versão anterior no Render/Vercel ou revert do merge) e peça autorização. Diga claramente se o rollback reabre alguma brecha e se alguma migration não tem volta.

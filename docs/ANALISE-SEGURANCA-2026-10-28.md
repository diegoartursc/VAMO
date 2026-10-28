# Análise de segurança — VAMO

Data: 28/10/2026. Base: checkout local no commit `25823d4`, inicialmente sem alterações.

**Parecer: o código atual tem falhas críticas e altas e ainda não está apto a uma aprovação de segurança para lançamento.** Há tomada de sessão a partir de token de documento, entrega pública de conteúdo pago e comprovantes, exposição de dados internos e lacunas financeiras. A classificação considera impacto e condições de exploração; não é um cálculo formal de CVSS.

Foi produzido um [prompt de correção e nova auditoria para Claude/Fable](PROMPT-CLAUDE-CORRECAO-SEGURANCA-2026-10-28.md). Nenhuma correção foi aplicada ao aplicativo nesta análise.

## Escopo e evidências

- Revisão de backend Express/Prisma, autenticação, admin, APIs públicas, compras, Stripe/Connect, jobs, uploads/storage, site Next.js e app Expo.
- Confirmação de quais rotas são efetivamente montadas em `apps/backend/src/index.ts`. APIs legadas não montadas não foram tratadas como exposição ativa.
- Provas isoladas com chaves, contas e arquivos sintéticos, Prisma simulado e assinaturas Stripe geradas offline. Sem acesso ao banco, pagamentos, e-mails reais ou exploração dos serviços publicados.
- `tsc --noEmit -p apps/backend/tsconfig.json`: passou.
- 33 testes existentes selecionados: passaram, zero falhas. Arquivos: `payments.security.test.ts`, `payments.refund.test.ts`, `itineraries.submission.test.ts`, `payouts.test.ts`, `reviewRequests.test.ts` e `mailer.test.ts`. Esse resultado não cobre os ataques reproduzidos abaixo.
- `npm audit --omit=dev --json`: 18 entradas de pacotes afetados: 4 altas, 7 moderadas e 7 baixas, zero críticas na resposta dessa ferramenta. No workspace backend: 2 entradas, `zod` alta e `qs` moderada. São entradas na árvore, não 18 ataques comprovados no produto. O Multer vulnerável instalado não apareceu nessa resposta; foi verificado separadamente por aviso do mantenedor.
- Os `.env` reais não estão rastreados no estado atual do Git. Valores de `.env` não foram consultados. Isso não certifica o histórico do repositório nem a ausência de outros segredos.

Não foram verificados o commit publicado, os painéis de Render/Vercel/Stripe/Supabase, RLS/policies reais, firewall, credenciais, conteúdo dos buckets, presença de documentos legados ou sinais de exploração anterior. O uso do banco de produção por instâncias locais consta em `CLAUDE.md`; não foi confirmado lendo credenciais. Não foram executados build/typecheck dos frontends nesta rodada.

## Achados

| ID | Gravidade | Problema | Evidência |
| --- | --- | --- | --- |
| SEC-01 | Crítica | Token de arquivo/refresh serve como sessão e access serve como refresh | Código e reprodução isolada dos validadores |
| SEC-02 | Alta | Conteúdo pago entregue pela API pública | Reprodução do handler com Prisma simulado |
| SEC-03 | Alta | Comprovantes administrativos expostos publicamente e a compradores | Reprodução e rastreamento de upload/payload |
| SEC-04 | Alta | Estatísticas e rascunhos de qualquer criador acessíveis sem login | Reprodução do handler com Prisma simulado |
| SEC-05 | Alta, condicional | Caminhos alternativos burlam bloqueio de arquivos privados legados | Reprodução HTTP local com arquivo sintético |
| SEC-06 | Alta, condicional | Modo de desenvolvimento habilita privilégios e pagamentos simulados | Bypass admin reproduzido; outros fluxos lidos |
| SEC-07 | Alta | Troca de senha não revoga todas as credenciais anteriores | Leitura de emissão, reset e validadores |
| SEC-08 | Alta | Uma requisição de upload pode exceder a RAM do serviço | Limites e armazenamento em memória no código |
| SEC-09 | Alta | Multer instalado tem falha conhecida de encerramento do processo | Versão instalada e aviso oficial |
| SEC-10 | Alta | Login admin malformado produz rejeição não tratada no Express 4 | Reprodução com router real e banco simulado |
| SEC-11 | Alta | Estornos/disputas/reversões não são reconciliados no app | Eventos assinados offline e leitura do job |
| SEC-12 | Média | Estorno parcial é tratado como total; pendentes não têm acompanhamento | Reprodução com refund parcial de 1 centavo |
| SEC-13 | Média | Venda e repasse usam preço/moeda/comissão fora do histórico pago | Leitura do checkout, fulfillment e job |
| SEC-14 | Média | Criador escreve campos de destaque e aprovação de comprovantes | Leitura de persistência e selo de confiança |
| SEC-15 | Média | 50 vendas inelegíveis podem bloquear repasses posteriores | Leitura da seleção e dos caminhos de skip |
| SEC-16 | Média; impacto condicional | Hook versionado contém um par de login/senha em texto | Inspeção de arquivo rastreado, sem testar a credencial |

### SEC-01 — Confusão entre tokens

`apps/backend/src/lib/auth.ts:22–35` emite access e refresh com o mesmo segredo e sem finalidade distinta. Em `:40–61`, o token de arquivo inclui `travelerId` e `purpose: traveler-file`, mas usa o mesmo segredo. `middleware/traveler-auth.ts:24–38` e `middleware/auth.ts:55–68` aceitam esse token como identidade completa do viajante. Também há validadores manuais vulneráveis em `routes/traveler-auth.ts:384–386` (GET /me), `:543–547` (PATCH /me) e `:723–729` (upload de perfil). `/refresh`, em `:194–230`, usa o verificador genérico.

**Impacto:** quem obtiver um link válido de um documento pode reutilizar o token para operar como o dono da conta. Refresh tokens também funcionam como access, com validade padrão de 7 dias. O refresh aceita access/file e pode prolongar a sessão usando novos access tokens.

**Evidência executada:** os três tipos foram aceitos pelo middleware real com identidade sintética; TTLs padrão de 86.400, 604.800 e 3.600 segundos. Nenhum token real foi usado ou impresso.

**Correção:** finalidades explícitas, validadores separados, algoritmo/issuer/audience restritos e rejeição de tipos cruzados, inclusive no auth opcional e refresh. Prever transição que invalide tokens antigos sem finalidade, rotação/revogação de sessões e atualização coordenada dos clientes.

### SEC-02 — Quebra do acesso ao conteúdo pago

`routes/itineraries.ts:879` registra detalhe público com autenticação opcional. A checagem em `:903–908` verifica publicação/propriedade; o retorno em `:955–1000` entrega dias, atividades, dicas, checklists, hospedagens, transportes e arquivos completos. A existência de `/purchased`, com checagem de venda em `:646–660`, não impede esse caminho alternativo. A listagem também retorna módulos JSON em `:79–103`.

**Reprodução:** visitante sem identidade recebeu atividade, dica, checklist e URL de arquivo marcados como conteúdo pago na fixture. Os IDs podem ser obtidos pela listagem pública.

**Correção:** respostas públicas com lista explícita de campos e prévias; conteúdo completo somente após autorização de compra/propriedade. Revisar listagem, destaque, perfil de criador, compartilhamentos, exports e arquivos pagos. Proteger o objeto no storage, além de esconder sua URL. Preservar a prévia pública prevista pelo produto.

### SEC-03 — Comprovantes privados em respostas e storage públicos

O detalhe anônimo retorna `travelProofUrl` em `routes/itineraries.ts:964`; custos aninhados e `proofFiles` atravessam os mapeamentos em `:921`, `:932` e `:972–981`. O payload comprado também inclui o comprovante em `:566`. O editor explica que esse material é destinado ao admin (`apps/mobile/app/new-itinerary.tsx:424–427`), mas o upload geral publica o objeto: `lib/storage.ts:59` cria bucket público e `:120–125` produz URL pública, ou usa o diretório estático local.

**Impacto:** passagens, cartões de embarque e recibos podem expor dados pessoais conforme o conteúdo enviado. A exposição do campo foi reproduzida com URL sintética; não foram abertos documentos reais.

**Correção:** separar mídia pública, conteúdo de comprador e documentos de dono/admin; filtrar recursivamente DTOs e snapshots antigos na leitura. Preparar migração privada e revogação de URLs já publicadas. Remover apenas o campo da resposta não fecha uma URL pública conhecida.

### SEC-04 — IDOR nas estatísticas do criador

`routes/itineraries.ts:185–210` aceita `creatorId` fornecido pela query, antes de resolver identidade pelo token, e usa auth opcional. A consulta não limita status (`:213–218`); a resposta inclui faturamento, vendas, títulos, IDs e estados de rascunhos/rejeitados/em revisão (`:242–268`).

**Reprodução:** requisição anônima com ID de outro criador recebeu título e status de um rascunho sintético e estrutura de receita.

**Correção:** exigir sessão e resolver o criador pelo usuário autenticado; acesso administrativo separado e explícito. Métricas públicas devem ter DTO próprio, restrito ao que o produto realmente torna público.

### SEC-05 — Bypass de documentos locais legados

Em `src/index.ts:108–124`, o bloqueio consulta `TravelerFile` somente quando casa com `/uploads/itineraries/:filename`. Em `:125`, `express.static` decodifica/normaliza outras variantes e serve o mesmo disco.

**Reprodução HTTP em microaplicação com Express instalado e PDF sintético:** caminho literal retornou 404; `/uploads/itineraries//synthetic-private.pdf` e `/uploads/%69tineraries/synthetic-private.pdf` retornaram 200. A condição para impacto real é existir documento privado legado nesse diretório e seu caminho ser conhecido.

**Correção:** documentos privados fora de qualquer raiz pública; resolver/autorizar caminhos de forma canônica enquanto houver legado. Testar barras repetidas, encoding e outros métodos HTTP. Não foi verificada a existência de arquivos afetados na hospedagem.

### SEC-06 — Atalhos de desenvolvimento não isolados

`routes/admin.ts:23–48` aceita token fixo de admin fora de produção, podendo criar um SUPER_ADMIN. A prova com IP remoto sintético e banco simulado autorizou a consulta administrativa sem senha. Não há restrição à interface loopback nesse fluxo; `index.ts:168` abre o listener sem bind explícito.

Além disso, `routes/payments.ts:521–523` aceita webhook sem assinatura fora de produção, e `routes/itineraries.ts:1840–1845` só bloqueia compra demonstrativa quando `NODE_ENV=production` e a flag não está habilitada. `CLAUDE.md` informa que o ambiente local usa o banco real. **Não foi confirmado o conteúdo do ambiente desta máquina nem a acessibilidade pela rede.** Em produção corretamente configurada, os dois últimos atalhos têm bloqueios; não são um bypass irrestrito do servidor publicado.

**Correção:** eliminar o token fixo; exigir assinatura do provedor; bloquear compra demonstrativa em qualquer ambiente compartilhado/real e restringir fixtures a testes isolados. Validar combinações de ambiente antes de iniciar serviço ou jobs e separar credenciais/bancos de teste e produção.

### SEC-07 — Revogação incompleta de sessão

`routes/traveler-auth.ts:217–219` verifica `passwordChangedAt` apenas na renovação. O middleware de access não consulta revogação, de modo que access antigo continua aceito por até 24h por padrão; a confusão SEC-01 ainda permite refresh como Bearer. O script administrativo `scripts/reset-password.ts:42` sequer atualiza o timestamp. Para admin, `routes/admin.ts:83` emite JWT por 8h e os validadores só verificam ID/active; trocar hash em `scripts/reset-admin-password.ts:41` não invalida JWT já emitido.

**Correção:** sessões ou versão de credencial consultada em cada autorização pertinente, revogação ao trocar senha e nos scripts, refresh rotativo e logout no servidor. Usar política coerente de expiração e teste dos limites de timestamp. Não confundir remover token do navegador com revogá-lo no servidor.

### SEC-08 — Consumo de memória no upload

`routes/uploads.ts:29–30` usa `memoryStorage()` quando o cloud storage está habilitado. `:56–60` permite 100 MiB por arquivo e `:187` aceita 20 arquivos: até aproximadamente 2 GiB em uma requisição, antes de overhead. A validação de conteúdo vem depois do recebimento (`:195–203`). O espelho `render.yaml` informa serviço de 512 MB. Um traveler registrado chega à rota; rate limit por requisições não limita bytes nem concorrência.

**Correção:** streaming/upload direto autorizado ou temporários limitados, teto agregado, quantidade/campos/partes, concorrência e quotas; limpeza em falha e cancelamento. Revisar também documentos em memória da Central da Viagem. Não foi feito teste de carga.

### SEC-09 — Dependências de segurança

Multer instalado/lockfile: `1.4.5-lts.2`; manifesto backend ainda permite linha 1.x. O aviso do mantenedor [GHSA-wc9g-mqfw-jrwm](https://github.com/expressjs/multer/security/advisories/GHSA-wc9g-mqfw-jrwm) descreve encerramento do processo por multipart malformado em versões anteriores à 2.3.0. O upload exige autenticação, mas o cadastro é aberto. Não foi enviado payload que derruba o processo.

Ao atualizar, considerar também a correção posterior de limpeza em disco, [GHSA-3pph-fpjx-jg34](https://github.com/expressjs/multer/security/advisories/GHSA-3pph-fpjx-jg34), que afeta a linha 2.2–2.3 e foi corrigida em 2.4.0. Escolher versão suportada que cubra os avisos vigentes na implementação.

O `npm audit` também apontou `zod`, `qs`, `postcss`, `image-size`, `node-forge` e dependências Expo que propagam esses avisos. Isso exige análise de alcance: ferramentas de build não equivalem a entrada remota no backend; o corpo JSON padrão já tem limite; a exploração de cada aviso não foi demonstrada. Não aplicar `npm audit fix --force`, downgrade de Expo ou migração de Zod às cegas. Next instalado é `16.4.3` e Nodemailer `10.2.1`, diferentes das versões criticadas em 15/10.

### SEC-10 — Rejeição não tratada no login admin

`routes/admin.ts:67–83` é handler async sem wrapper/try-catch no Express 4 instalado (`4.22.1`). Só há validação de presença; uma senha objeto alcança bcrypt após localizar conta ativa. Falhas Prisma também rejeitam a Promise. O middleware global em `index.ts:159` não recebe automaticamente essa rejeição.

**Reprodução:** router real, Prisma simulado e `password={}` geraram `unhandledRejection: Illegal arguments: object, string`, sem chamada de `next(error)`. Em Node com política padrão de rejeição não tratada isso pode encerrar o processo. Não foi derrubado servidor real.

**Correção:** schemas de tipo e tamanho antes do banco/bcrypt e tratamento consistente das Promises no Express 4. Revisar seed e demais handlers/middlewares async. Preservar a stack: não é necessário migrar para Express 5 para corrigir. A [documentação de migração do Express](https://expressjs.com/en/guide/migrating-5/#rejected-promises-handled-from-middleware-and-handlers) distingue o comportamento automático introduzido na versão 5.

### SEC-11 — Falta conciliação de estornos, disputas e reversões

`routes/payments.ts:535–573` só processa eventos de checkout pago; eventos de refund/disputa/reversão recebem 200 sem atualização do domínio. `jobs/payouts.ts:41–53` só seleciona vendas ainda sem `payoutTransferId`; vendas já repassadas não voltam para conciliação. O acesso comprado em `routes/itineraries.ts:646–660` depende da existência de venda, sem estado efetivo de estorno/disputa.

**Reprodução:** eventos `charge.refunded`, `charge.dispute.created` e `transfer.reversed`, assinados com segredo de teste offline e validados pelo handler real, retornaram `{received:true}` sem atualização da venda. Isso demonstra ausência de tratamento, não um estorno real executado.

**Impacto:** divergência entre direitos de acesso, relatórios e dinheiro. Após repasse, estorno/chargeback pode ficar sem recuperação dos recursos do criador. A [Stripe documenta](https://docs.stripe.com/connect/disputes) que disputas em separate charges/transfers debitam a plataforma e que o momento da reversão depende de aceitar ou contestar a disputa.

**Correção:** estados persistidos e idempotentes, eventos repetidos/fora de ordem, reconciliação e retries. Bloquear repasses de vendas em risco. Tratar reversão proporcional quando devida, saldo insuficiente e alertas; não reverter automaticamente toda disputa aberta sem considerar sua política e desfecho. Aplicar política explícita e testada ao acesso após estorno total/parcial/disputa; registros financeiros devem ser preservados.

### SEC-12 — Refund parcial confundido com total e pendentes sem acompanhamento

`routes/payments.ts:59–74` considera qualquer refund `succeeded` ou `pending` suficiente para retornar `refunded:true`, sem conferir valor. Um refund parcial pode encerrar o fluxo indevidamente. Também falta acompanhamento durável da evolução dos pendentes (SEC-11). No e-mail, o corpo já comunica início da devolução, mas o título antecipa conclusão (`lib/mailer.ts:149–158`).

**Reprodução:** refund existente de 1 centavo fez a função retornar `refunded:true` e não chamar a criação do valor restante. A [API Stripe](https://docs.stripe.com/api/refunds/create) permite devoluções parciais sucessivas até o total da cobrança.

**Correção:** somar valores/status de forma confiável ou consultar a cobrança; registrar saldo restante, valores pendentes/reservados e status pendente/concluído/falhou; concluir apenas o necessário de forma idempotente, considerando concorrência e paginação. Um refund total pendente é uma iniciação válida: depois de registrá-lo duravelmente, 2xx pode ser correto; não criar outro refund nem provocar retry contínuo só porque ainda está pendente. Acompanhar por eventos/conciliação até conclusão/falha e distinguir mensagens de início de mensagens de conclusão.

### SEC-13 — Preço, moeda e comissão sem fonte histórica confiável

O checkout fixa valor/moeda em `routes/payments.ts:399–400`, mas o fulfillment grava `itinerary.price` atual e recalcula comissão em `:270–285`, embora receba o valor confirmado pelo provedor. `jobs/payouts.ts:27–28` recalcula a comissão vigente e `:51–52`, `:75–80` usa moeda atual do roteiro.

**Impacto:** alterar preço entre checkout e confirmação pode gerar venda/repasse diferentes da cobrança; mudar moeda depois pode impedir o repasse; comissões históricas podem ser substituídas pela taxa atual. Não se afirma que a Stripe permita ultrapassar os limites da cobrança vinculada.

**Correção:** pedido/venda com snapshot imutável de valor em unidade mínima, moeda, comissão e destinatário, validado contra o provedor e usado em todos os relatórios/repasses. Preservar vendas legadas e suas comissões, sem recalcular retroativamente.

### SEC-14 — Campos administrativos escritos pelo criador

`routes/itineraries.ts:1377` e `:1572` aceitam `featured`; atualização isolada desse campo não consta em `hasContentUpdate` (`:1098–1109`). Custos de hospedagem são persistidos diretamente (`:1715–1717`), assim como objetos JSON de outros módulos. `packages/shared/itinerary/cost.ts:233–234` considera `proofStatus=approved` como verificado pela VAMO.

**Impacto:** autopromoção e selo de confiança com origem no cliente. A revisão geral do roteiro não substitui controle de escrita dos campos administrativos.

**Correção:** lista de campos permitidos, decisões de destaque/comprovação exclusivas do admin/backend e invalidação da aprovação ao mudar o comprovante ou valor associado. Rejeitar/sanitizar campos protegidos inclusive em objetos profundamente aninhados.

### SEC-15 — Fila de repasses pode parar

`jobs/payouts.ts:41–49` sempre consulta as 50 vendas mais antigas sem transferência. Vendas inelegíveis são puladas em `:62`, `:69` e `:73`, sem avançar cursor ou marcar uma próxima tentativa. Com 50 itens assim, vendas posteriores elegíveis nunca entram no lote.

**Correção:** paginação determinística e estados/agenda de tentativa persistidos, com distinção entre inelegibilidade definitiva e transitória. Testar 50 vendas bloqueadas antes de uma venda elegível. Confirmado pela lógica, sem simulação de dinheiro ou banco.

### SEC-16 — Credencial em hook rastreado

`.claude/settings.json:8` contém um par de login/senha dentro da string de contexto do hook de início. Não foi testada a validade; nenhum valor é reproduzido neste relatório. Ser conta antiga/demonstrativa reduz o risco de acesso, mas não justifica manter uma senha utilizável em instruções versionadas.

**Correção:** remover valores do hook e de outras instruções; realizar busca de segredos com saída redigida no estado atual e histórico. Se a credencial ainda for válida ou reutilizada, preparar rotação e revogação das sessões, com execução de produção sujeita à autorização. Remover do último arquivo não remove versões anteriores; não reescrever histórico automaticamente.

## Evolução desde a auditoria de 15/10

Não é correto copiar todos os achados antigos como se estivessem inalterados:

- Já existem chave de idempotência de checkout e detecção/estorno de outro PaymentIntent para roteiro já comprado (`payments.ts:87–128`, `:216–225`, `:304–315`). A janela temporal não substitui pedido persistido, mas o antigo diagnóstico de ausência total dessas defesas está desatualizado.
- Falha de estorno automático por roteiro indisponível agora produz 500 no webhook (`payments.ts:557–577`), permitindo retry. A falha atual remanescente é a classificação incorreta de refund parcial/pendente e a ausência de conciliação completa.
- Existe job de repasse Connect em `jobs/payouts.ts`; a afirmação antiga de inexistência de repasse está desatualizada.
- Next/Nodemailer foram atualizados; a nova consulta de dependências tem resultado distinto. Não foi demonstrado que todos os avisos históricos tenham sido resolvidos por testes de exploração.

## Reforços adicionais e limites

Tokens web em localStorage/AsyncStorage e ausência de CSP própria nos frontends aumentam o impacto de eventual XSS. Não foi demonstrado XSS; links sem validação de protocolo exigem teste real antes de chamar isso de exploração. PDF aplica escape de HTML no fluxo revisado; não houve SSRF confirmado. SecureStore nativo, bcrypt, reset com token aleatório hasheado e transação/índice único de venda são defesas existentes a preservar.

Recomenda-se também limitação específica de login por IP/conta, MFA administrativo, logs sem tokens/links/documentos, alertas operacionais e CI com typecheck/testes/audit/secret scan. O checkout tem Dependabot e uptime; isso não equivale a uma barreira de segurança de aplicação no CI.

## Critério para uma nova aprovação

Primeiro conter SEC-01 a SEC-07 e exposição de documentos. Depois corrigir indisponibilidade e dependências e concluir integridade financeira antes de aceitar pagamentos reais. Resolver também os itens médios ou registrar justificativa técnica verificável; não encobrir pendências com um “está seguro”.

A nova revisão precisa executar ataques negativos contra os handlers reais, testar os fluxos legítimos, revisar os diffs com independência e separar **correção no código**, **validação em ambiente de teste** e **configuração/migração efetivamente aplicada na produção**. Nenhuma auditoria estática ou conjunto de testes garante ausência de todas as vulnerabilidades.

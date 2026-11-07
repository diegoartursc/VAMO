# Verificação da execução do plano de segurança — VAMO

**Revisão iniciada em 06/11 e concluída em 07/11/2026.** Código examinado: `b83a959608d7982d15b10593a6d3869e0a2c9a38`, branch local `home-hero-slideshow`. Referência: [análise original](ANALISE-SEGURANCA-2026-10-28.md), [plano/prompt](PROMPT-CLAUDE-CORRECAO-SEGURANCA-2026-10-28.md), [pós-correção](SEGURANCA-POS-CORRECAO-2026-10-28.md), [resumo de 29/10](RELATORIO-SEGURANCA-2026-10-29.md) e [auditoria de 04/11](security/AUDITORIA-2026-11-04.md).

## Conclusão

**O plano foi executado em grande parte, mas não está integralmente concluído. Não aprovo o código atual para operar pagamentos reais sem corrigir os problemas altos desta revisão.** As correções de separação dos tokens, prévia pública, propriedade das estatísticas, campos administrativos e avanço da fila de repasse estão presentes e passaram nos cenários examinados. Entretanto, documentos enviados pelo site ainda são publicados, há lacunas de revogação de sessão e os fluxos financeiros quebram sob concorrência e falhas intermediárias.

**Os 441 testes existentes passaram. Isso não encerra a revisão:** testes adicionais reproduziram problemas não cobertos. Três falhas financeiras foram confirmadas também com **PostgreSQL real, local e descartável**, usando o código de aplicação atual e Stripe simulada. Não foram realizadas cobranças, estornos ou transferências reais.

Os pareceres antigos “corrigido e validado” e “apto com ressalvas” devem ser lidos como resultados daqueles cenários e datas. Esta revisão não sustenta uma aprovação integral no estado atual. Nenhuma falha foi corrigida nesta rodada: o pedido foi verificar, testar e documentar.

## O que de fato foi implementado

O histórico local contém as etapas de correção; não se trata apenas de um plano escrito:

| Etapa | Evidência no Git | Entrega observada |
| --- | --- | --- |
| Contas/admin | `a71490e` | Tokens por finalidade, sessões no banco, logout, revogação, limite de login e tratamento de erros |
| Conteúdo/documentos | `0b36e54` | DTO público, sanitização de comprovantes, documentos privados, stats por dono e normalização do estático |
| Dinheiro | `427ec22` | Estado financeiro, eventos Stripe, valores históricos, estorno parcial e backoff de repasse |
| Upload/dependências/confiança | `aeda662` | Temporários/limites/cotas, Multer/Express atualizados, decisões administrativas e exclusão de conta |
| Revisão posterior | `f012df0`, `ee016b2`, `46ae382`, `b3267c9`, `0760ec2` | Correções adicionais de sessão, reversão, recompra, comprovantes e uploads |
| Ferramenta de migração | `31e11ef` | Revogação a partir de inventário anterior (`--revoke-from`) |
| Auditoria e CI | `5367e88`, `26b3ac4`, `61ed6a6`, `a0eceec`; merge `c0b0077` | Matriz de API, cabeçalhos, proxy configurável, índices, cache, testes no CI e relatório de 04/11 |
| Alterações de 06/11 | `849e5f4`, `cd66263`, `3481410` | E-mail de reembolso, apresentação de ganhos e câmbio persistido/automático |

Há migrations versionadas para sessões/admin, documentos privados e estado financeiro (`20261029100000`, `20261029110000`, `20261029120000`), além dos índices de 04/11 e câmbio de 06/11. Nesta revisão, os **20 scripts SQL de migration** foram aplicados com sucesso num banco novo descartável. Isso verifica essa sequência de SQL em banco vazio, **não** o estado de `_prisma_migrations` ou dos dados em produção.

## Matriz de verificação SEC-01 a SEC-16

“Validado” abaixo significa os cenários efetivamente examinados nesta rodada. Não é certificado de ausência de outros problemas.

| ID | Situação atual | O que confirmei / o que falta |
| --- | --- | --- |
| SEC-01 — finalidade JWT | **Corrigido e validado nos cenários testados** | `lib/auth.ts` deriva chaves distintas, restringe HS256/issuer/audience/tipo e rejeita credenciais cruzadas/legadas. Validadores manuais e middlewares usam sessão. Suíte `phase1-auth` passou. |
| SEC-02 — conteúdo pago público | **Corrigido e validado nos cenários testados** | `lib/itineraryDto.ts` separa prévia e comprador; listagem/destaque/detalhe aplicam DTO. Conteúdo e snapshots são filtrados; testes de conteúdo passaram. Não reexecutei a varredura de 52 telas do relatório anterior. |
| SEC-03 — comprovantes | **Parcial** | Backend e mobile têm `/private-docs` e sanitização profunda. O site continua enviando comprovantes ao upload público; recibos não são abrangidos pela canonicalização/migração. Ver R-05. |
| SEC-04 — stats de terceiros | **Corrigido e validado nos cenários testados** | `itineraries.ts:206–230` exige sessão e deriva o criador do traveler; `creatorId` da query não concede acesso. Testes passaram; falta ampliar o caso específico com dois criadores na mesma fixture. |
| SEC-05 — arquivos locais legados | **Caminho original corrigido; proteção ainda parcial** | Guard canônico em `app.ts:149–183` bloqueia variantes. Exclusão com falha de filesystem faz o arquivo reaparecer publicamente: R-13. |
| SEC-06 — atalhos/ambiente | **Parcial** | Token fixo admin removido; webhook exige assinatura; demo exige `NODE_ENV=test` e flag. Configuração ainda aceita esse modo com banco remoto: R-12. Não é um bypass do modo production corretamente configurado. |
| SEC-07 — revogação | **Parcial** | Sessões revogáveis, refresh rotativo e logout do backend/mobile/admin principal existem. Login em andamento escapa ao reset; logout do site não chama servidor: R-06/R-07. |
| SEC-08 — recursos no upload | **Parcial** | Teto antecipado, temporários, partes/cotas/tempo/concorrência existem. Default de 12 uploads permite orçamento incompatível com 512 MiB em rotas que ainda carregam buffers: R-10. Sem medição de memória nesta rodada. |
| SEC-09 — dependências | **Multer/Express corrigidos; triagem restante aberta** | Instalados Multer 2.5.0 e Express 4.22.3. Audit atual: 20 entradas no monorepo e uma alta no backend (`zod`). Classificar tudo como ferramenta de build é inadequado: há imports de runtime no Expo Router. |
| SEC-10 — rejeições async | **Login admin corrigido; cobertura parcial do produto** | Wrapper de Router e validação resolveram o cenário original. Callback async do Multer em documentos privados escapa ao wrapper: R-08. |
| SEC-11 — estados/reconciliação | **Parcial; bloqueador financeiro** | Eventos, estados e reversões foram implementados. Concorrência, resposta perdida e evento anterior à venda continuam gerando estados/dinheiro incorretos: R-01 a R-04. |
| SEC-12 — refund parcial/pendente | **Parcial** | Soma/paginação/valor restante e deduplicação de pendente existem. `failed` e evolução posterior de refund não são tratados adequadamente: R-09. |
| SEC-13 — histórico financeiro | **Núcleo venda/repasse corrigido; relatórios parciais** | `paidAmountCents`, `paidCurrency`, comissão e ganho congelados são usados no repasse. Snapshot, totais e painel financeiro ainda têm inconsistências: R-11. |
| SEC-14 — destaque/comprovação | **Corrigido e validado no escopo testado** | `featured` do criador é ignorado; aprovação é ligada a item/fingerprint e invalidada em alterações. `phase4-trust` passou. Ampliar os casos de moeda/divisão/arquivo e fluxo legítimo administrativo. |
| SEC-15 — fila bloqueada | **Corrigido e validado no cenário original** | Próxima tentativa/backoff filtra inelegíveis. Teste adicional respeitando `take:50` confirmou que a 51ª venda elegível é processada no sweep seguinte. Não confundir com recuperação de transferência de resultado incerto (R-04). |
| SEC-16 — credencial em instruções | **Removida do hook atual; operação externa não revalidada** | Histórico registra remoção em `1bccf6d`; configuração rejeita segredo conhecido como público. Não testei credenciais, não reli `.env`, não auditei novamente todo o histórico nem confirmei rotação/privacidade no serviço remoto. |

## Testes executados e resultados

Ambiente: Node **v24.12.0**, bibliotecas instaladas deste checkout. Testes de aplicação com rede externa bloqueada, credenciais de serviços removidas/substituídas e preload adicional impedindo leitura de `.env*`. O preload foi necessário porque o próprio Prisma pode tentar carregar ambiente ao ser importado. Nenhum valor real de ambiente foi usado ou registrado.

| Verificação | Resultado |
| --- | --- |
| Backend: 22 arquivos, incluindo fases 1–5, isolamento, cache/proxy e negócio | **163 passaram; 0 falhas; 0 skips** |
| Mobile: 14 arquivos de testes | **223 passaram; 0 falhas; 0 skips** |
| Shared: 5 arquivos de testes | **55 passaram; 0 falhas; 0 skips** |
| Total das três suítes acima | **441 passaram** |
| TypeScript backend | **Passou** |
| TypeScript site/admin | **Passou** |
| TypeScript mobile | **Falhou:** TS2322 em `VamoButton.tsx:91`, `borderColor: string \| null` não aceita `null` |
| SQL das migrations em PostgreSQL descartável | **20 scripts aplicados**; banco encerrado e removido |
| Concorrência financeira com PostgreSQL/Prisma reais e Stripe simulada | **3 cenários reproduziram os defeitos** R-01/R-02 |
| Verificações adicionais isoladas | Confirmaram documentação pública no fluxo do site, logout sem revogação, corrida de reset, erros de upload privado, configuração demo e exclusão legada; detalhes abaixo |
| Dependências sem dev | Monorepo: **20 entradas (7 altas, 12 moderadas, 1 baixa)**. Backend: **1 alta** |

A falha TypeScript do mobile já era registrada na auditoria de 15/10; continua aberta. “Sem erro novo” não equivale a compilação estrita aprovada. Não há aqui evidência de quebra de segurança decorrente desse erro de estilo.

Não executei builds de publicação, Playwright, a matriz completa de 439 chamadas nem k6 nesta rodada. Os números desses testes no relatório de 04/11 são **evidência histórica**, não resultados reexecutados agora. As reproduções financeiras novas usam sincronização determinística das operações, sem carga de volume. Não foi acessado banco, bucket, SMTP, Stripe ou painel de produção.

As [evidências e comandos reproduzíveis](security/evidencias-2026-11-07/README.md) incluem resultados, inventário de testes e scripts isolados. **Os scripts de reprodução confirmam a existência dos defeitos; código de saída zero nesses scripts não significa segurança aprovada.**

## Problemas encontrados nas correções

Gravidades abaixo são avaliação técnica de impacto/condições, não pontuação formal de CVSS. Condição de falha intermediária ou concorrência é explicitada; não há evidência de que algum caso tenha ocorrido em produção.

### R-01 — Alta: eventos concorrentes desfazem estorno e retiram repasse excessivo

`apps/backend/src/lib/paymentEvents.ts:61–87` lê estado antes de atualizar. O `updateMany` condicional tenta impedir redução de `refundedCents`, mas o fallback **incondicional** em `:82` escreve o snapshot antigo quando a condição perde a corrida. Resultado reproduzido: refund total de 10.000 centavos gravado primeiro e evento parcial concorrente de 1.000 depois deixam a venda com apenas 1.000 devolvidos e acesso novamente ativo (`money.ts:72–77`).

Em `paymentEvents.ts:34–49`, duas reversões usam `payoutReversedCents` antigo e chaves de idempotência distintas por alvo. Refunds acumulados de 1.000/2.000 sobre repasse de 8.000 produziram pedidos de reversão somando **2.400**, quando o alvo correto era **1.600**. Isso não exige ultrapassar o limite total da transferência no provedor.

**Confirmação:** módulos reais + mocks e, depois, os dois cenários com Prisma/PostgreSQL reais em cluster descartável. Não é apenas hipótese sobre concorrência do banco. O interleaving foi controlado pelo teste; não se mediu sua frequência natural.

**O que concluir/corrigir:** cálculo sequencial e chave de idempotência não substituem serialização por venda. Atualizações de perdas precisam ser monotônicas e usar estado atual/lock/versão transacional. Reversões precisam de reserva/ledger de operação para não criar deltas sobrepostos. Adicionar os dois casos como regressões com banco real.

### R-02 — Alta: duas recompras pagas deixam cobrança duplicada sem estorno

Em `routes/payments.ts:371–384`, duas recompras após estorno leem a mesma venda elegível. Uma vence o `updateMany`; a outra recebe `count=0` e retorna `alreadyPurchased` sem conferir/estornar o PaymentIntent perdedor. O tratamento adequado da primeira compra em `:418–425` não cobre esse ramo.

**Confirmação:** dois pagamentos sintéticos, uma venda atualizada e **zero solicitações de refund do pagamento excedente**. Repetido com PostgreSQL real. O teste representa PIs pagos distintos; não executou uma cobrança real.

**Correção necessária:** ao perder a transição, reler a venda, comparar o PI e reconciliar/estornar o excedente de forma persistida e idempotente. Testar recompra concorrente e reentrega dos mesmos pagamentos.

### R-03 — Alta: falha de consulta ao provedor libera venda já estornada

`paymentEvents.ts:63` descarta evento sem venda; `:210–214` ainda o marca processado. O fulfillment tenta recuperar o estado atual, mas `routes/payments.ts:328–347` só loga o erro de `paymentIntents.retrieve` e continua criando venda `paid`.

**Confirmação:** refund total chegou antes da venda, foi finalizado; consulta Stripe simulou timeout; a venda nasceu paga e com acesso. Um teste existente também passa depois de uma tentativa de consulta Stripe ser bloqueada pela rede do harness — justamente porque o erro é engolido.

**Correção necessária:** estado pendente de verificação/retry durável e reprocessamento do evento órfão. Falha de confirmação não pode produzir um estado pago definitivo. Não basta registrar erro no console.

### R-04 — Alta, condicional: transferência realizada com resposta perdida fica sem recuperação

`jobs/payouts.ts:128–143` chama o provedor antes de persistir o ID. Se o provedor efetiva a transferência e a resposta/processo se perde, o banco fica sem `payoutTransferId`. Refund posterior marca `blocked` e não reverte (`paymentEvents.ts:72,87`); o sweep deixa de selecionar a venda. A mesma idempotency key poderia ajudar numa repetição, mas o estado bloqueado impede esse caminho.

**Confirmação simulada:** uma transferência efetivada no fake, erro de resposta, refund total e novo sweep: nenhuma recuperação de ID/reversão. Não se afirma que a Stripe tenha perdido uma resposta real nesta revisão.

**Correção necessária:** operação de transferência persistida antes do efeito externo, conciliação de resultado incerto por chave/metadata/provedor, independente da elegibilidade de novos repasses. Preservar recuperação mesmo após refund/disputa e após a janela de retenção de idempotência do provedor.

### R-05 — Alta: o site continua publicando comprovantes; migração não cobre recibos

> **Status 07/11/2026 — corrigido no código (PR fix-docs-auth-review):** o site envia comprovante de viagem e recibos por `uploadPrivateDoc` (`/private-docs`); `receiptUrl` entra em `mapDocRefs` (canonicalização, assinatura e legado); a migração lê `estimatedSpending`. **Pendente:** rodar `migrate-proofs-to-private.ts` (simulação primeiro) para recibos antigos já públicos.

O mobile envia os contextos de comprovante a `/private-docs`, mas o site não foi alinhado:

- `apps/site/src/app/dashboard/roteiro/[id]/page.tsx:1225` envia comprovante de viagem usando `uploadFile(prepared)`;
- `:1986` envia recibo com a mesma função e grava `receiptUrl`;
- `apps/site/src/lib/api.ts:40–44` sempre chama `/uploads`, cujo resultado é público.

**Confirmação:** executei o helper real do site contra o app real isolado, com PDF sintético. O arquivo abriu anonimamente com **HTTP 200**, antes de salvar roteiro. Cloud não foi acessado; no código, o mesmo caminho publica no bucket público (`lib/storage.ts:110–120`). Descartar depois o `travelProofUrl` não remove o objeto já publicado.

`lib/privateDocs.ts:41–60` só mapeia `travelProofUrl` e `proofFiles`; `receiptUrl` passa intacto. A seleção/varredura de `scripts/migrate-proofs-to-private.ts:127–145` também não cobre `spendingProfile/receiptUrl`. O teste confirmou essa referência intacta. A sanitização das respostas para comprador/público remove `receiptUrl`; isso protege o JSON, mas não a URL direta já conhecida.

**Correção necessária:** adaptar todo cliente que envia comprovantes, cobrir recibos no formato de referência privada e ampliar inventário/migração/revogação. O relato histórico de migração de 13 documentos em 04/11 não comprova cobertura desses recibos nem impede novos uploads públicos pelo site.

### R-06 — Média: login iniciado antes do reset cria sessão depois da revogação

`routes/traveler-auth.ts:168–183` lê/verifica a senha fora da operação de criação da sessão; `lib/sessions.ts:27–35` insere sem reconferir versão da credencial. O reset revoga as sessões existentes, mas uma criação ainda pendente passa depois.

**Confirmação HTTP isolada:** reset 200; access anterior 401; login concorrente que já havia validado senha antiga 200; seu novo access abriu `/me` com 200; tentativa nova com senha antiga foi corretamente recusada. Requer conhecer a senha anterior e acertar a janela de concorrência.

**Correção necessária:** versão de credencial no token/sessão e validação contra versão atual, ou transação/lock que torne login/reset coerentes. Testar a emissão concorrente, não só revogar sessões previamente criadas.

### R-07 — Média: logout do site só limpa o navegador

> **Status 07/11/2026 — corrigido:** `logout()` do site chama `POST /auth/traveler/logout` antes de limpar o navegador (falha de rede: limpa mesmo assim e avisa no console); o admin legado chama `/admin/logout`. Renovação de sessão do site segue pendente.

`apps/site/src/lib/auth.ts:418–423` remove localStorage e redireciona, sem chamar `/auth/traveler/logout`. O admin principal foi atualizado, mas o admin legado em `app/dashboard/admin/page.tsx:222` também só remove storage.

**Confirmação:** chamando `logout()` real do site, token local foi removido e houve zero chamadas de revogação; o mesmo Bearer continuou abrindo `/me` com 200. O backend oferece revogação, mas esse cliente não a solicita.

**Correção necessária:** ligar logout dos clientes ativos ao servidor, tratar falha de rede de maneira explícita e testar token antigo após sair. Verificar também refresh/expiração do site, que segue sem o fluxo central de renovação observado no mobile.

### R-08 — Média: erro de banco no upload privado escapa ao wrapper

> **Status 07/11/2026 — corrigido:** o callback do Multer delega a `handleUpload` com `.catch` → 500 tratado. Teste: falha de `aggregate` e de `create` respondem 500 sem rejeição solta.

`routes/private-docs.ts:37–94` usa callback `async` do Multer com `await aggregate/create` sem `try/catch`. O handler externo retorna `undefined`, portanto o wrapper de Router não recebe a Promise desse callback.

**Confirmação HTTP isolada:** falha de `aggregate` e de `create`, separadamente, geraram uma rejeição não tratada cada; nenhum 5xx foi retornado nos 500 ms observados e o teste abortou. `/health` continuou 200. O guard tem timeout maior, mas isso não substitui tratamento de erro. Não derrubei processo real.

**Correção necessária:** capturar/repassar a rejeição dentro do callback ou promisificar a operação, responder com erro consistente e liberar buffers/vagas. Testar falhas de persistência e de limpeza, além de uploads bem-sucedidos.

### R-09 — Média: falha posterior de refund não tem recuperação

`routes/payments.ts:101` retorna `refunded:true,pending:true` até se o objeto de criação tiver `status=failed`. `paymentEvents.ts:192–205` não trata `refund.updated/refund.failed`; esses eventos são marcados processados sem ação.

**Confirmação simulada:** retorno `failed` foi considerado iniciado; evento `refund.failed` foi finalizado sem encaminhamento. O problema também existe quando um refund inicialmente pendente falha depois. A [Stripe documenta essa evolução e os eventos de refund](https://docs.stripe.com/refunds#handle-failed-refunds).

**Correção necessária:** estado/valor por refund, acompanhamento de falha/cancelamento/requires_action, fila de intervenção/retry apropriado e comunicação correta. Reconhecer um refund total pendente e devolver 2xx após registro durável pode ser correto; não criar outro refund ou provocar retry contínuo apenas por estar pendente.

### R-10 — Alta, condicional à capacidade: orçamento de memória não fecha nos defaults

O relatório anterior descreve quatro uploads simultâneos; `lib/uploadGuard.ts:17–24` atualmente permite **12**, com arquivo de até 100 MiB. O upload cloud ainda lê cada temporário inteiro em `routes/uploads.ts:147–150`. A Central da Viagem usa `memoryStorage` com 50 MiB (`traveler-trip-center.ts:19,43–45`).

Limite superior permitido, antes de cópias/overhead/memória-base: **12 × 100 MiB = 1.200 MiB** no cloud, ou **12 × 50 MiB = 600 MiB** no Trip Center. O serviço documentado tem 512 MB. A limitação por usuário é 2; contas distintas compartilham o limite global de 12.

Não enviei carga volumosa nem medi pico de RAM: trata-se de inconsistência demonstrada entre limites de código e capacidade documentada, não de crash medido. Variáveis reais podem reduzir o limite; não foram consultadas.

**Correção necessária:** orçamento por bytes em voo, concorrência compatível, streaming/upload direto restrito e teste de memória em ambiente com recursos equivalentes. Limitar a requisição antes de recebê-la é melhoria real, mas não prova que a simultaneidade permitida caiba no serviço.

### R-11 — Média: histórico e relatórios usam moedas/estados inadequados

O núcleo financeiro já congela valores corretamente, mas:

- `routes/itineraries.ts:592` monta moeda do snapshot a partir do roteiro atual; `my-trips.ts:72` usa snapshot/roteiro em vez de `paidCurrency`;
- `routes/admin.ts:334–354` usa moeda atual e estado original de `purchaseData.payment`, sem os campos atuais de refund/disputa; não é uma visão líquida conciliada;
- `lib/money.ts:111–128` soma valores de moedas diferentes sem conversão; `routes/creators.ts:195–203` rotula esse total com `BASE_CURRENCY`. As linhas individuais em `:187` já usam a moeda paga corretamente.

Confirmado por leitura; não foi simulada mudança de moeda em produção. **Correção necessária:** valores/estados históricos em todos os DTOs; totais segregados por moeda ou convertidos explicitamente com taxa/data/fonte. Não misturar venda bruta com receita líquida conciliada.

### R-12 — Média, condicional: flags de teste não provam isolamento do banco

`lib/config.ts:28–41` aceita `NODE_ENV=test` + `ALLOW_DEMO_PURCHASES=true` com destino remoto, apenas emitindo aviso. A rota demo em `itineraries.ts:1911` verifica essas flags, não a separação efetiva do banco.

**Confirmação:** configuração sintética com host remoto `.invalid` produziu zero erros fatais e um aviso; nenhuma conexão foi tentada. Isso não permite compra demo no modo production normal, mas descumpre o requisito de impedir efeito no banco real com configuração permissiva/acidental.

**Correção necessária:** modo de teste com destino dedicado validado, isolamento operacional e falha fechada nas combinações perigosas; não depender exclusivamente do nome de uma variável.

### R-13 — Alta, condicional ao legado: exclusão pode tornar arquivo privado público

> **Status 07/11/2026 — corrigido:** a cópia legada sai do disco ANTES do registro; se a remoção falhar, o registro fica (o guard segue bloqueando) e a rota responde 500. Vale para exclusão de arquivo e de conta. Teste com `EACCES` simulado.

`traveler-trip-center.ts:337–340` apaga o registro antes de remover a cópia legada. `lib/storage.ts:145–149` suprime falhas de remoção. Sem registro, o guard de `/uploads` não reconhece mais aquele arquivo como privado.

**Confirmação HTTP isolada:** arquivo PDF sintético retornou 404; simulei erro `EACCES` apenas na remoção desse arquivo; DELETE retornou 200; acesso anônimo à mesma URL retornou **200**. A condição real é haver cópia legada e a remoção falhar. Não foi verificada a existência desses arquivos na hospedagem.

**Correção necessária:** documento privado fora da raiz pública, ou tombstone/bloqueio durável que sobreviva à exclusão do registro enquanto a limpeza não for confirmada. Adicionar teste de falha no filesystem e de exclusão de conta, não só GET/HEAD de registro existente.

## Dependências, testes e documentação que exigem ajuste

O `npm audit --omit=dev` foi consultado novamente. **20 entradas de pacote não equivalem a 20 falhas exploráveis**, e zero entradas críticas nessa ferramenta não significa ausência de falhas altas da aplicação. O backend mantém `zod 3.25.76` com aviso alto; limite JSON reduz alcance, mas não transforma o aviso em correção.

Multer 2.5.0 e Express 4.22.3 estão efetivamente instalados. Contudo, o teste de upload verifica apenas major `>=2`; isso aceitaria versões 2.x anteriores às correções de segurança. A asserção deve acompanhar os intervalos corrigidos e o lockfile.

A classificação histórica de todos os avisos Expo como build-only precisa de revisão: `expo-router/build/fork/getPathFromState*.js` importa `query-string`, que importa o `decode-uri-component 0.2.2` instalado. Há portanto caminho de dependência de runtime, não somente CLI. Não demonstrei ataque no navegador nem provei que todo caminho de entrada alcance o parser vulnerável. O [aviso do mantenedor](https://github.com/SamVerschueren/decode-uri-component/security/advisories/GHSA-qr28-fpjm-wq7f) descreve o risco e suas condições. Fazer triagem por pacote/caminho de entrada e atualizar com compatibilidade Expo; não executar `audit fix --force` ou downgrade sugerido automaticamente.

Os testes existentes têm limitações concretas:

- `test/helpers.ts` não reproduz todas as garantias de transação/constraints e ignora `take/orderBy` no `memoryTable`. Os testes novos de fila respeitaram esses filtros; os três cenários financeiros principais foram repetidos em banco real.
- Há cobertura de eventos sequenciais/repetidos, mas faltam concorrência entre eventos distintos, retomada após efeito externo de resultado incerto e falhas posteriores de refund.
- Os clientes do site não foram cobertos pela correção mobile de comprovantes e logout.
- O CI versionado em `.github/workflows/tests.yml` roda backend/mobile. Não contém typecheck dos três apps nem triagem automática de dependências/segredos; presença do workflow não confirma execução verde no serviço remoto.
- Nos logs da suíte há erros controlados e também erro de cabeçalhos após timeout de upload. Não se deve usar apenas exit code e contagem para declarar todo caminho de falha validado.

## Produção: evidência histórica versus confirmação atual

O relatório de 04/11 registra RLS, rotação de segredos, migração de 13 comprovantes e leituras de produção. Esses registros foram consultados, **não repetidos nem certificados nesta rodada**. O código atual incorpora o merge da auditoria de 04/11; por isso a frase histórica “branch ainda sem push” não descreve mais este checkout. Isso também não prova qual commit está publicado ou quais variáveis estão efetivas.

Continuam exigindo evidência atual: commit/deploy e migrations aplicadas; inventário/revogação de todos os formatos de documento; segredos antigos revogados e sessões encerradas; eventos habilitados no webhook; `TRUST_PROXY_HOPS` conforme a cadeia real e resistente a header forjado; limites de memória/cotas efetivos; headers e políticas do storage; operação de retries/alertas e conciliação de pagamentos anteriores. Não alterar automaticamente o hop para 2 sem conferir a topologia.

Cookies HttpOnly/CSP de scripts, 2FA administrativo e dos provedores, alertas, limite próprio de compartilhamento e paginação do catálogo continuam como reforços/pontos abertos documentados. Não foi demonstrado XSS nesta rodada. Cabeçalhos contra frame/objeto não equivalem a uma política completa de scripts.

## Próximos passos verificáveis

1. **Antes de pagamentos reais:** resolver R-01 a R-04 e adicionar concorrência/recovery em PostgreSQL e provedor simulado. Usar invariantes: refund acumulado nunca diminui; acesso não renasce por evento atrasado; reversão acumulada nunca supera o devido; todo PI pago tem entrega ou devolução conciliada; transferência de resultado incerto sempre é recuperável.
2. **Documentos e contas:** fechar R-05 a R-08 e R-13, incluindo site, migração de recibos, erro de persistência, logout e reset concorrente. Demonstrar que URL antiga deixa de funcionar depois da operação necessária.
3. **Operação:** acompanhar ciclo de refund (R-09), estabelecer orçamento de upload (R-10), corrigir histórico/relatórios (R-11) e impedir configurações de teste com dados reais (R-12).
4. **Qualidade:** corrigir o TypeScript antigo do mobile, triar/atualizar dependências compatíveis e incluir os novos cenários na barreira de CI. Não mascarar o erro nem apenas trocar fixtures para obter verde.
5. **Homologação e publicação:** validar as mudanças num ambiente segregado, então preparar implantação/migrations/migração de documentos/rollback com evidências atuais. A aplicação em produção deve ser uma etapa separada e autorizada.

## Parecer final desta revisão

| Dimensão | Parecer |
| --- | --- |
| Execução do plano | **Parcial.** Há implementação concreta em todas as áreas, mas “16 itens concluídos” não é sustentado pelos novos cenários. |
| Código local | **Reprovado para aprovação integral de segurança/pagamentos.** Suítes existentes verdes coexistem com falhas altas reproduzidas. |
| Homologação | **Não validada integralmente.** Testes isolados e três integrações em PostgreSQL descartável não substituem o fluxo completo com Stripe de teste e clientes reais. |
| Produção | **Não revalidada.** Não se pode concluir segurança/implantação/configuração a partir desta análise local. |

Não foi encontrado indício de exploração real; também não foi feita investigação de incidentes. Não houve alteração de código da aplicação, credenciais ou dados de produção. As alterações desta rodada ficam na documentação e nas evidências anexas; os diretórios preexistentes `docs/marca/` e `docs/seguranca/` foram preservados.

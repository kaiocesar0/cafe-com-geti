# Spec — Avisos de estoque no Google Chat (0 / 1 / reposição)

Status: ready-for-agent  
Fuso: `America/Sao_Paulo`  
Glossário: [CONTEXT.md](../../CONTEXT.md)

## Problem Statement

O espaço do Google Chat só é avisado quando o estoque **cruza 1 para baixo** (`anterior > 1` e `novo ≤ 1`). Quem usa a copa no grupo não vê quando o item **acaba de fato** (1→0), nem quando alguém **repõe** e o estoque sai de 0 ou de 1. A mensagem atual fala em “restante” sem unidade do cadastro e não leva ao app. O ADR-0011 e a spec de produto ainda descrevem a regra antiga, em conflito com o que o time quer no grupo.

## Solution

Toda **mutação gravada de estoque** (contribuição vigente, −1/+1, contagem, editar/excluir vigente) passa a decidir o aviso pelo **antes e depois** daquela gravação, por item:

- chegou em **1** (vinda de cima) → estoque baixo + próximo da vez + link do app;
- chegou em **0** (inclui pulo 5→0 e queda 1→0) → acabou + próximo da vez + link;
- saiu de **0** ou de **1** para cima → item e quantidade nova (sem próximo da vez) + link;
- ambos acima de 1, ou estoque igual → silêncio.

Uma gravação gera **uma mensagem por item** com o estoque **final**. Contribuição **passada**, **criar** item e **excluir** item não avisam. O webhook e a falha do Chat continuam como no MVP (save não desfaz). Documentação: ADR novo supersede o 0011; glossário e trecho de alerta na spec atualizados; ADR-0005 perde o “não repetir até repor em aberto”.

## User Stories

1. Como time no Google Chat, quero ser avisado quando o estoque de um item chegar a 1, para saber que está acabando e quem é o próximo da vez.
2. Como time no Google Chat, quero ser avisado quando o estoque chegar a 0 (incluindo pulo direto de 2+ para 0), para saber que acabou e quem deve repor.
3. Como time no Google Chat, quero ser avisado de novo se o estoque voltar de 1 para 0, para não perder a queda depois de uma reposição parcial.
4. Como time no Google Chat, quero ser avisado quando o estoque sair de 0 ou de 1 para cima, com a quantidade que ficou, para ver que alguém repôs.
5. Como time no Google Chat, quero silêncio quando o estoque só muda entre valores acima de 1 (ex.: 5→3, 3→6), para o grupo não virar ruído.
6. Como time no Google Chat, quero silêncio quando a gravação não altera o estoque (igual ou contribuição passada), para abrir o app ou lançar histórico não spammar o espaço.
7. Como time no Google Chat, quero uma mensagem só por item na gravação, mesmo se alguém lançar várias unidades de uma vez, para não receber um aviso por unidade.
8. Como time no Google Chat, quero duas mensagens se a mesma gravação cruzar o limiar em dois itens distintos (ex.: editar contribuição mudando de item), para cada produto aparecer no grupo.
9. Como time no Google Chat, quero nas mensagens de estoque baixo e de acabou o nome do próximo da vez (ou “ninguém na fila”), para a coordenação ficar no grupo.
10. Como time no Google Chat, quero na mensagem de reposição só o item e a quantidade nova, sem próximo da vez, para o aviso ser curto.
11. Como time no Google Chat, quero a unidade do cadastro do item no texto (ex.: pacote), com `s` colado quando a quantidade ≠ 1, para bater com o que está na prateleira.
12. Como time no Google Chat, quero o link público do app no fim de cada aviso, para abrir o Café com Geti sem procurar o endereço.
13. Como quem configura, quero `APP_URL` só no servidor (como o webhook), documentada no `.env.example` e no README, com valor de prod sem barra no fim e normalização no código.
14. Como quem configura, quero que com webhook presente e `APP_URL` ausente o aviso ainda saia sem o link e o servidor logue aviso, para o save e o Chat não quebrarem.
15. Como quem configura, quero que `GOOGLE_CHAT_WEBHOOK_URL` ausente continue ignorando o envio e logando, sem falhar o save.
16. Como quem grava estoque, quero que falha de rede ou HTTP do Chat não desfaça o estoque já persistido, para a copa não depender do Google.
17. Como admin, quero que −1/+1, contagem no item, contribuição vigente e editar/excluir vigente disparem a mesma regra de antes/depois, para o grupo refletir qualquer baixa ou reposição real.
18. Como admin, quero que criar um item (mesmo com estoque 0 ou 1) não avise o Chat, para o cadastro inicial não parecer “acabou”.
19. Como admin, quero que excluir um item não mande “acabou” no Chat, para apagar cadastro não ser tratado como queda de estoque.
20. Como visitante ou leitor, quero que abrir o dashboard ou qualquer GET continue sem aviso, para só a persistência notificar.
21. Como quem mantém o produto, quero um ADR novo (ex. 0024) supersedendo o 0011, com a regra 0/1/reposição, para a decisão escrita bater com o grupo.
22. Como quem mantém o produto, quero o glossário e o trecho de alerta em `docs/spec.md` / `CONTEXT.md` atualizados, e o ADR-0005 sem o “não repetir até repor em aberto”, para o contrato único.
23. Como quem testa, quero a suíte conferindo as mensagens via espião (sem POST real ao Chat), para 1→0, 2→0, 3→1, reposição e silêncio acima de 1 ficarem travados.
24. Como quem usa o espaço, quero o texto exatamente no formato combinado (markdown leve do Chat: negrito com `*`), para copiar/colar e ler no celular.

## Implementation Decisions

- Escopo: evoluir o módulo de notificação e o ponto único que já decide após mutação de estoque (hoje “maybe notify crossed one”). Predicado e builders de mensagem passam a cobrir três tipos: estoque baixo (chegou em 1), acabou (chegou em 0), reposição (saiu de 0 ou 1 para cima). Call sites das actions de item/contribuição que já chamam esse ponto continuam; criar item e excluir item seguem sem chamar.
- Regra (before → after), por item, após commit do estoque:
  - `after === 1` e `before > 1` → estoque baixo;
  - `after === 0` e `before > 0` → acabou (cobre 5→0 e 1→0);
  - `before <= 1` e `after > before` → reposição;
  - caso contrário → não notifica.
- Uma mensagem por item por gravação; texto usa estoque **final**. Dois itens afetados → duas chamadas / duas mensagens.
- Copy (pt-BR), com `APP_URL` normalizada (sem barra final) na última linha quando a env existir:

```
⚠️ Estoque baixo: *{nome}* (1 {unitLabel})
Próximo da vez: *{nome}* | ninguém na fila
{APP_URL}
```

```
⚠️ Acabou: *{nome}*
Próximo da vez: *{nome}* | ninguém na fila
{APP_URL}
```

```
*{nome}*: estoque agora é {n} {unitLabel[+s se n ≠ 1]}
{APP_URL}
```

- Unidade: texto do cadastro; se quantidade ≠ 1, concatenar `s` ao `unitLabel` (sem flexão portuguesa).
- Próximo da vez: só nos avisos de estoque baixo e acabou; calcular com a fila **já** refletindo o estado gravado (mesmo espírito do fluxo atual).
- Env: `APP_URL` opcional, servidor only; documentar em `.env.example` e README. Prod: `https://cafe-com-geti.vercel.app`. Ausente → mensagem sem linha de URL + `console.warn`. Webhook: inalterado (`GOOGLE_CHAT_WEBHOOK_URL`, body `{ text }`, erros engolidos com log).
- Docs na mesma entrega: ADR-0024 (ou próximo número livre) supersede ADR-0011; atualizar alerta em `docs/spec.md` e glossário RF em `CONTEXT.md`; ADR-0005: remover a frase de “não repetir até repor (ainda em aberto)” — a regra before/after já define o silêncio.
- Sem schema novo, sem cron, sem DM, sem Chat API além do incoming webhook, sem UI nova no app.

## Testing Decisions

Testar **comportamento externo**: mensagem (ou ausência) após mutação de estoque; estoque permanece se o envio falha; nenhum POST real ao Chat na suíte.

**Seam preferida (única de integração):** server actions / serviço de estoque já usados em `alerts.test.ts` (e afins), com `notifyLowStock` (ou o export de envio equivalente) como espião — a suíte monta a mensagem esperada e garante que `fetch` não sai para o webhook. **Seam pura:** predicado “que tipo de aviso (se houver)” e builders de texto (unidade + plural + URL opcional), no espírito de `shouldNotifyStockCrossedOne` em `domain.test.ts`.

Prior art: `alerts.test.ts`, `domain.test.ts` (predicado), espião em `src/test/setup.ts`.

Casos mínimos a cobrir na suíte (ajustar asserts à copy nova):

- 3→1 → estoque baixo + próximo + URL (se `APP_URL` no teste);
- 2→0 e 5→0 → acabou (não “estoque baixo” com 0);
- 1→0 → acabou;
- 0→4 e 1→4 → reposição com quantidade e unidade pluralizada; sem linha de próximo;
- 5→2 e estoque igual → não chama envio;
- contribuição passada → não chama;
- criar item com stock 0/1 → não chama;
- webhook ausente / `APP_URL` ausente → save ok; sem link se só `APP_URL` falta;
- envio que rejeita → estoque novo permanece (erro engolido no módulo de notify, como hoje).

Não exigir E2E no Google Chat real.

## Out of Scope

Menção (@) ou DM no Chat; cards ricos além de `text`; fila de retry/refila; cron de “ainda está baixo”; link em env `NEXT_PUBLIC_*`; mudar regra de próximo da vez; UI de configuração do webhook no app; pluralização portuguesa além de `+ s`; avisar ao excluir ou criar item.

## Further Notes

Entendimento fechado em grilling (2026-09-28). Próximo passo natural: tickets a partir desta SPEC. Implementação altera contratos de teste existentes que ainda esperam “cruzar 1 para baixo” e a copy antiga (`restante`, 2→0 como estoque baixo, 1→0 silêncio).

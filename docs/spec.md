# Spec — Café com Geti (MVP)

Status: ready-for-agent  
Fuso: `America/Sao_Paulo`  
Glossário: [CONTEXT.md](../CONTEXT.md)

## Problem Statement

Na copa, café, leite e filtro acabam e só então alguém percebe. Não dá para ver o estoque, quanto cada um já trouxe, nem de quem é a vez de repor cada item. O grupo no Google Chat não é avisado a tempo.

## Solution

Um app interno (link, sem login) onde qualquer um cadastra pessoas e itens, registra o que foi trazido, vê o estoque e **quem é o próximo da vez por item**, e o **espaço do Google Chat** recebe aviso quando o estoque **cruza 1 para baixo**.

## User Stories

1. Como funcionário, quero ver no celular o estoque de cada item, para não descobrir na hora do café que acabou.
2. Como funcionário, quero ver o **próximo da vez** de cada item, para saber quem deve repor.
3. Como funcionário, quero registrar que trouxe N unidades de um item **agora**, para o estoque e o ranking atualizarem.
4. Como funcionário, quero lançar contribuições **passadas** (data + quem + quanto), para o ranking começar justo sem inflar o estoque da prateleira.
5. Como funcionário, quero acertar o estoque com uma **contagem** (“agora é X”), para corrigir divergência.
6. Como funcionário, quero um **−1** (e +1) rápido no dashboard quando acaba ou volta um pacote, para não abrir cadastro.
7. Como funcionário, quero cadastrar colegas com preferência café / leite / ambos e flag ativo, para as filas ficarem certas.
8. Como funcionário, quero inativar alguém de férias/desligado, para essa pessoa sair de todas as filas.
9. Como funcionário, quero cadastrar itens livres (nome, unidade, tipo café/leite/filtro, estoque), para não depender de deploy.
10. Como quem toma só leite, quero **não** aparecer como próximo do café nem do filtro, mesmo que eu tenha trazido café.
11. Como quem toma só leite, quero **poder registrar** que trouxe café, para o ranking e o estoque refletirem o que aconteceu.
12. Como quem toma café, quero entrar na fila de café **e** de filtro.
13. Como time, quero que empate no total vá para quem está **devendo há mais tempo**, e se ninguém nunca trouxe, para a **ordem de cadastro**.
14. Como time, quero editar ou excluir um lançamento errado, para o total e o estoque (se vigente) voltarem ao correto.
15. Como time no Google Chat, quero uma mensagem no **grupo** quando o estoque cruzar 1 para baixo, nomeando o próximo da vez — e **nada** quando alguém só abre o app.
16. Como time, quero tema claro por padrão e escuro opcional, com as cores do DS **sem** logo/nome da DPE.
17. Como quem configura, quero webhook e banco só em variáveis de ambiente na Vercel.

## Regras de domínio (não negociar na implementação)

### Filas e próximo da vez

- Tipo `coffee` ou `filter`: fila = ativos com preferência `coffee` ou `both`.
- Tipo `milk`: fila = ativos com preferência `milk` ou `both`.
- Inativo: fora de **todas** as filas.
- **Próximo da vez** (por item, só a fila):
  1. menor **total contribuído** (vigentes + passadas daquele item; 1 unidade cadastrada = 1);
  2. empate: maior tempo desde a **última** contribuição daquele item (nunca trouxe = o mais antigo);
  3. se todos na fila nunca trouxeram: menor `createdAt` do funcionário (ordem de cadastro).
- Quem está fora da fila **pode** contribuir; a quantidade **entra no total**; **não** pode ser o próximo.

### Estoque

| Evento | Estoque | Total / ranking |
|---|---|---|
| Contribuição vigente | + quantidade | + quantidade |
| Contribuição passada | não mexe | + quantidade |
| Contagem (estoque := X) | vira X | não mexe |
| Delta −1 / +1 | ±1 | não mexe |
| Editar/excluir vigente | desfaz antigo, aplica novo | recalcula |
| Editar/excluir passada | não mexe | recalcula |

Quantidade de contribuição ≥ 1 (inteiro). Estoque ≥ 0. Operação que deixaria estoque < 0 é **recusada** com erro na UI.

Não mudar vigente ↔ passada na edição.

### Alerta Google Chat

Somente no servidor, após commit da mudança de estoque:

`estoqueAnterior > 1` **e** `estoqueNovo <= 1`

Dispara: 2→0, 3→1, 5→0.  
Não dispara: abrir app, 1→0, 5→2, contribuição passada (estoque igual).

Texto (pt-BR): item, quantidade nova, nome do próximo da vez (ou “ninguém na fila”). Webhook em env; nunca no cliente.

### Tempo

`America/Sao_Paulo`. Persistência timestamptz. “Hoje” no date picker = hoje nesse fuso.

## Telas (shadcn, sem Figma de produto)

1. **Dashboard** — cards por item: estoque (semaforo: >1 ok, =1 ouro, 0 vermelho), unidade, próximo da vez, −1/+1, atalho para contribuir vigente.
2. **Contribuir** — funcionário (lista completa), item, quantidade, data (default hoje), tipo vigente vs passada (passada esconde efeito no estoque).
3. **Histórico** — lista; filtrar por item/pessoa; editar; excluir com confirmação.
4. **Funcionários** — CRUD; preferência; ativo.
5. **Itens** — CRUD; tipo; unidade; contagem de estoque.
6. **Tema** — toggle claro/escuro no header.

Identidade: tokens ADR-0013, **sem** marca DPE. Nome do produto: Café com Geti.

## Implementation Decisions

- App **Next.js App Router** + **shadcn/ui** + Tailwind na **Vercel**.
- Postgres **Neon**; acesso só no servidor (Server Actions).
- ORM: **Drizzle** (ADR-0022) + driver serverless Neon; schema em TypeScript.
- Módulos lógicos: `employees`, `items`, `contributions`, `stock` (ajustes + aplicação de vigente), `rotation` (puro: próximo da vez), `notify` (Chat).
- `rotation` e a condição de alerta são funções puras, testáveis sem HTTP.
- Schema (conceitual):
  - `employees`: id, name, preference (`coffee` \| `milk` \| `both`), active, createdAt
  - `items`: id, name, unitLabel, kind (`coffee` \| `milk` \| `filter`), stock (int ≥ 0)
  - `contributions`: id, employeeId, itemId, quantity, occurredAt, affectsStock (boolean; vigente = true)
  - estoque **não** é derivado: coluna em `items`, mutada só nas regras acima
- Webhook: `GOOGLE_CHAT_WEBHOOK_URL`. Falha de rede do Chat **não** desfaz o save; logar erro (MVP: não refila).
- Sem cron para alerta.
- Sem auth; não indexar (`robots.txt` / `X-Robots-Tag`) se trivial.

## Testing Decisions

Testar **comportamento** das regras, não componentes shadcn.

Seam principal: módulo `rotation` + predicado `shouldNotifyStockCrossedOne(prev, next)`.

Casos mínimos:

- Maria 1 café, João 2 → próximo café = Maria.
- Empate de total → quem contribuiu há mais tempo.
- Fila vazia de contribuintes → ordem de cadastro.
- Só leite não é próximo de `coffee`/`filter` mesmo com total alto.
- Passada não muda estoque; vigente muda.
- 2→0 notifica; 1→0 não; GET não notifica.
- Excluir vigente desfaz estoque; excluir passada não.

Ainda não há suíte no repo; Vitest (ou equivalente) no mesmo projeto Next.

## Out of Scope

Login, papéis, DM no Chat, consumo automático, CSV, tipos de item além dos três, logo DPE, Figma de telas, backend separado, estimativa mensal automática.

## Further Notes

Implementar **somente depois** desta spec ser confirmada como entendimento compartilhado.

Referência Figma (tokens/componentes, não telas do app): [Design System](https://www.figma.com/design/3kid9m8j5OrTnenRUvALx7/Design-System?node-id=4048-350).

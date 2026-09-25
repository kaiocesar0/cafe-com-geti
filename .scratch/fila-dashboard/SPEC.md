# Spec — Fila de contribuição no dashboard

Status: ready-for-human  
Fuso: `America/Sao_Paulo`  
Glossário: [CONTEXT.md](../../CONTEXT.md)  
ADRs: [0004](../../docs/adr/0004-per-item-rotation-by-quantity.md), [0006](../../docs/adr/0006-rotation-tie-break.md), [0008](../../docs/adr/0008-filter-queue-coffee-drinkers.md)

## Problem Statement

No dashboard dá para ver o estoque e um único nome de **próximo da vez** por item. Não dá para ver a **fila de item** inteira: quem vem depois, quanto cada um já trouxe daquele item e quando foi a última contribuição. Quem consulta a copa não entende a ordem nem consegue filtrar a fila por item de forma explícita.

## Solution

O dashboard ganha uma seção serverside com a fila completa do item selecionado. A ordem é a mesma do **próximo da vez** já existente (menor **total contribuído**, desempate por quem está **devendo há mais tempo**, senão ordem de cadastro; só entram quem está na **fila de item**). Chips escolhem o item via query string. Cada linha mostra posição, nome, total com unidade e data da última contribuição. A primeira linha destaca quem é a vez. Os cards de estoque e o nome “próximo da vez” continuam iguais e batem com o topo da lista.

## User Stories

1. Como visitante, quero ver a fila completa de um item no dashboard, para saber quem traz depois do próximo.
2. Como visitante, quero que a ordem da lista seja a mesma regra do próximo da vez, para não haver duas verdades.
3. Como visitante, quero ver na seção o critério em texto (“menos quantidade neste item; empate: mais tempo sem trazer”), para entender por que a ordem é essa.
4. Como visitante, quero em cada linha a posição (#), o nome do funcionário, o total contribuído com a unidade do item e a data da última contribuição, para comparar de relance.
5. Como visitante, quero a quantidade como soma das unidades daquele item (vigentes + passadas), para bater com o total que define a fila.
6. Como visitante, quero data absoluta no formato `dd/mm/aaaa` no fuso da copa, para ler sem ambiguidade.
7. Como visitante, quero “Nunca” na data quando a pessoa ainda não trouxe aquele item, e quantidade `0`, para ver quem nunca contribuiu.
8. Como visitante, quero a primeira linha com destaque visual (fundo ou borda), sem texto extra tipo “É a vez”, para o topo da fila saltar sem poluir.
9. Como visitante, quero chips com o nome de cada item para trocar a fila, para filtrar sem digitar.
10. Como visitante, quero a escolha do item refletida na URL (`?item=<id>`), para compartilhar ou atualizar a página e manter o filtro.
11. Como visitante, quero que sem `item` na URL abra a fila do primeiro item por nome, para a seção já nascer útil.
12. Como visitante, quero que um `item` inválido na URL caia no mesmo default (primeiro por nome), sem erro gritante, para um link quebrado não travar a tela.
13. Como visitante, quero a mensagem “Ninguém na fila deste item” quando a fila estiver vazia, para não ver uma tabela vazia sem explicação.
14. Como visitante, quero que quem só toma leite não apareça na fila de café ou filtro, para a lista respeitar a preferência.
15. Como visitante, quero que funcionário inativo não apareça na fila, para a ordem refletir só quem participa.
16. Como visitante, quero a seção da fila depois dos cards de “Itens em estoque”, para o overview de estoque vir antes do detalhe da rodada.
17. Como visitante, quero que o nome “próximo da vez” no card do mesmo item seja exatamente a primeira pessoa da lista, para card e fila não divergirem.
18. Como visitante, quero que os cards de estoque e o −1/+1/contribuir continuem como estão, para a fila ser complemento e não substituto.
19. Como visitante, quero que ao registrarem uma contribuição o ranking da lista mude na próxima leitura, para a fila acompanhar a copa.
20. Como visitante, quero a lista montada no servidor, para o HTML já vir com a ordem certa sem depender de filtro só no cliente.
21. Como quem implementa, quero uma função que devolve a fila ordenada inteira e o próximo da vez ser só o primeiro dessa fila, para uma fonte de verdade e testes da ordem completa.
22. Como quem implementa, quero esta feature numa branch/worktree a partir da base estável da copa, sem misturar com a branch de autenticação, para os diffs não colidirem.
23. Como quem revisa, quero um único ticket alinhado a esta spec, para implementar sem fatiar em vários PRs artificiais.

## Implementation Decisions

- A regra de ordenação **não muda**: menor total contribuído do item; empate por última contribuição mais antiga daquele item; quem nunca trouxe conta como o mais antigo; se ninguém trouxe, ordem de cadastro. Quem entra na fila: ativo cuja preferência cobre o tipo do item (leite → leite/ambos; café e filtro → café/ambos). Alinhado aos ADRs 0004, 0006 e 0008.
- Extrair uma função pura que ranqueia a fila inteira a partir de funcionários, tipo do item e resumos de contribuição (total + última data). O “próximo da vez” passa a ser o primeiro dessa lista. Summaries e listagens de item/funcionário já existentes alimentam a UI; sem schema novo e sem endpoint novo.
- Dashboard: nova seção após os cards de estoque. Chips/tabs com o nome de cada item; navegação via search param `item` com o id do item. Sem param ou id desconhecido → primeiro item ordenado por nome. Critério descrito uma vez no cabeçalho/descrição da seção.
- Linha: posição, nome, total + rótulo de unidade do item, data `dd/mm/aaaa` (fuso `America/Sao_Paulo`) ou “Nunca”. Primeira linha: destaque visual só (fundo/borda), sem label “É a vez”.
- Cards de item mantêm estoque, semáforo e um nome de próximo da vez; esse nome deve ser o topo da fila do mesmo item.
- Trabalho em branch/worktree separado da autenticação, partindo da base estável (`main`), para não acoplar a feature de leitura à auth em andamento.
- Sem mudança de ADR; a feature só torna a fila já definida observável.

## Testing Decisions

Testar comportamento externo da ordenação, não estrutura interna da UI.

**Seam única (automatizada):** o módulo puro de rotação. Cobrir a ordem completa da fila (não só o vencedor): menor total, empate por última contribuição, nunca trouxe, ordem de cadastro, exclusão por preferência e por inativo. O próximo da vez deve continuar sendo o primeiro da fila ranqueada. Prior art: suíte unitária atual do próximo da vez / quem entra na fila.

**Não criar seam nova** para agregados por item (já existem) nem E2E/render da página. Chips, query string, destaque da primeira linha, “Nunca”, mensagem de fila vazia e fallback de item inválido ficam como aceite do ticket (checklist humano).

## Out of Scope

Fila global entre itens; mudar o critério de justiça; autenticação ou restrição de leitura; remover o “próximo da vez” dos cards; coluna de preferência ou critério por linha; data relativa (“há X dias”); hora na data; contagem de eventos em vez da soma de quantidade; schema/migration; testes E2E do dashboard.

## Further Notes

Implementar a partir de `main` em worktree/branch `feat/fila-contribuicao-dashboard`. Auth segue noutro terminal/branch. Ticket único em `tickets/`.

Implementar somente depois desta spec ser confirmada como entendimento compartilhado — status já `ready-for-agent` após o grill e confirmação das seams.

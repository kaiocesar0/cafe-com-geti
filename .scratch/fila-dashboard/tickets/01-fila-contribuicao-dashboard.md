# 01: Fila completa de contribuição no dashboard

> **Difficulty:** Standard: **suggested model:** Sonnet (Claude Code) / Sonnet (Cursor). Suggestion only, use whatever model you have to hand.

**What to build:** Expor a fila ordenada inteira no módulo de rotação (`rankQueue`; próximo da vez = primeiro). No dashboard, após os cards de estoque, seção serverside com chips por item (`?item=<id>`), legenda do critério, lista `#` / nome / total+unidade / data `dd/mm/aaaa` ou “Nunca”, destaque visual na 1ª linha, vazios e fallback de item inválido. Cards de estoque e “próximo da vez” permanecem e batem com o topo da fila do mesmo item. Branch/worktree a partir de `main`, sem misturar com auth.

**Blocked by:** None (can start immediately from `main`).

**Status:** ready-for-human

- [x] Função pura ranqueia a fila completa; próximo da vez é o primeiro; testes cobrem ordem (total, empate, nunca trouxe, cadastro, preferência, inativo)
- [x] Dashboard: seção após “Itens em estoque” com chips, `?item=`, default/primeiro por nome, id inválido → default
- [x] Critério visível na seção; linhas com #, nome, total+unidade, data ou “Nunca”; 1ª linha só com destaque visual
- [x] Fila vazia mostra “Ninguém na fila deste item”
- [x] Nome “próximo da vez” no card do item selecionado coincide com a 1ª pessoa da lista
- [x] Sem schema novo; sem alterar regra dos ADRs 0004/0006/0008; trabalho fora da branch de autenticação

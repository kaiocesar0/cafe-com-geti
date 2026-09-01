# 03: CRUD de itens e contagem de estoque

> **Difficulty:** Standard: **suggested model:** Sonnet (Claude Code) / Sonnet (Cursor). Suggestion only, use whatever model you have to hand.

**What to build:** Cadastro livre de **itens** (nome, unidade, **tipo de item** café/leite/filtro). No mesmo cadastro, **contagem física**: “estoque agora é X”. Estoque ≥ 0; recusar valor negativo. Ainda sem próximo da vez nem −1 do dashboard.

**Blocked by:** 01 App shell Next, Drizzle, tema e tokens

**Status:** ready-for-human

- [x] Item persistido com tipo `coffee` | `milk` | `filter`, unidade e estoque inteiro
- [x] Tela CRUD; contagem define estoque absoluto
- [x] Dois itens do mesmo tipo são registros independentes
- [x] Server Actions; estoque não derivado de contribuições (ainda não existem)

# 02: CRUD de funcionários (preferência e ativo)

> **Difficulty:** Standard: **suggested model:** Sonnet (Claude Code) / Sonnet (Cursor). Suggestion only, use whatever model you have to hand.

**What to build:** Qualquer pessoa com o link cadastra, edita e inativa **funcionários** (nome, **preferência de consumo** café/leite/ambos, flag **ativo**). Inativo permanece no histórico futuro, mas já fica fora das filas quando elas existirem. Ordem de cadastro (`createdAt`) visível o bastante para o desempate.

**Blocked by:** 01 App shell Next, Drizzle, tema e tokens

**Status:** ready-for-human

- [x] Tabela/schema de funcionários persistido no Neon
- [x] Tela de funcionários: criar, editar, inativar (e reativar)
- [x] Preferência só nos três valores do glossário
- [x] Server Actions; nada de `DATABASE_URL` no browser
- [x] Fuso das datas de cadastro alinhado a America/Sao_Paulo na UI

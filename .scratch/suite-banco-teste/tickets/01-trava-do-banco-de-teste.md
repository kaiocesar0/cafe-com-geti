# 01: Trava do banco de teste

> **Difficulty:** Heavy: **suggested model:** Opus (Claude Code) / Opus or the strongest reasoning model available (Cursor). Suggestion only, use whatever model you have to hand.

**What to build:** Quem roda a suíte prova que ela só escreve numa branch Neon persistente, só com schema, distinta de `hml` e `production`. Sem a URL no arquivo de ambiente exclusivo da suíte (`.env.test`), o comando falha antes do migrate e antes de apagar qualquer linha. Se essa URL for a mesma do app (`.env` ou `.env.local`, em geral a branch `hml`), a suíte falha do mesmo jeito. Com a URL certa, o schema é aplicado nessa branch, cada caso começa com funcionários, itens e contribuições vazios, os testes de regra pura continuam passando no mesmo `npm test`, e um caso grava e lê de volta um funcionário só nessa branch. A branch de teste não herda o prazo de 30 dias das branches novas.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] Existe uma branch Neon persistente, só com schema, que não é `hml` nem `production` e não expira
- [ ] `npm test` lê `DATABASE_URL` só de `.env.test`; sem essa variável, falha antes do migrate e antes do primeiro delete
- [ ] Se a URL de `.env.test` for igual à do app, a suíte falha do mesmo jeito
- [ ] Com a URL da branch de teste, o migrate roda nela e cada caso começa com as três tabelas vazias
- [ ] Os testes de fila e do predicado de alerta continuam passando no mesmo comando
- [ ] Um caso grava e lê de volta um funcionário nessa branch
- [ ] Os casos que falam com o banco rodam em série

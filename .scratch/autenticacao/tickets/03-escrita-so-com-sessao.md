# 03: Escrita só com sessão

> **Difficulty:** Standard: **suggested model:** Sonnet (Claude Code) / Sonnet (Cursor). Suggestion only, use whatever model you have to hand.

**What to build:** Sem sessão, listagens de item, funcionário e contribuição continuam. A de funcionário não traz username, perfil nem hash. Criar, editar, excluir, contribuir, contagem e −1/+1 são recusados e o banco não muda. Com sessão de admin ou admin geral, essas escritas passam. Os casos já existentes de estoque, fila, contribuição e alerta rodam com uma sessão de admin aberta pelo harness e continuam válidos.

**Blocked by:** 02: Entrar, sair e sessão

**Status:** ready-for-agent

- [ ] Sem sessão, listagens funcionam; listagem pública de funcionário não expõe username, perfil nem hash
- [ ] Sem sessão, criar/editar/excluir item e funcionário, contribuir, editar/excluir contribuição, contagem e −1/+1 são recusados e o banco não muda
- [ ] Com sessão de admin ou admin geral, as escritas acima passam
- [ ] Casos existentes da suíte abrem sessão de admin pelo harness e continuam passando
- [ ] Leitura de username/perfil só na listagem autenticada de admin ou admin geral

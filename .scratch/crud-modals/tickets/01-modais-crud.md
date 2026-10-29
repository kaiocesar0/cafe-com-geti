# 01: Modais de editar e confirmar no CRUD

> **Difficulty:** Standard: **suggested model:** Sonnet (Claude Code) / Sonnet (Cursor). Suggestion only, use whatever model you have to hand.

**What to build:** Substituir `<details>` de editar (histórico, itens, funcionários) e `window.confirm` (excluir contribuição, rebaixar) por Dialog do DS. Extrair shell reutilizável de formulário em modal e de confirmação. Forms e actions existentes; criar continua nas seções. Fecha modal no sucesso; erro mantém aberto + toast.

**Blocked by:** None (can start immediately).

**Status:** ready-for-human

- [x] Shells reutilizáveis de modal de formulário e de confirmação (Dialog do app; sem `confirm` nativo)
- [x] Editar contribuição / item / funcionário abre modal; salvar com sucesso fecha; erro mantém aberto
- [x] Excluir contribuição e rebaixar usam modal de confirmação com Cancelar + ação destrutiva
- [x] Sem `<details>` de edição nas três tabelas; criar permanece nas seções atuais
- [x] Visitante sem escrita: sem gatilhos; permissões/actions inalteradas
- [x] Aceite manual: Esc/overlay/X fecham; toasts iguais; Auth Dialogs existentes sem regressão

# 03: Alerta ao cruzar 1

> **Difficulty:** Standard: **suggested model:** Sonnet (Claude Code) / Sonnet (Cursor). Suggestion only, use whatever model you have to hand.

**What to build:** Quando o estoque cruza 1 para baixo, a suíte vê a mensagem do espaço do Google Chat — nome do item, quantidade nova e o próximo da vez, ou “ninguém na fila” — e nenhum POST sai. Cruzar de 1 para 0, descer sem chegar em 1, ou manter o estoque não gera mensagem. Se o envio falha, o estoque novo permanece gravado.

**Blocked by:** 01: Trava do banco de teste

**Status:** ready-for-agent

- [ ] 2→0, 3→1 e 5→0 produzem a mensagem com item, quantidade nova e próximo da vez (ou “ninguém na fila”)
- [ ] 1→0, 5→2 e estoque inalterado não produzem mensagem
- [ ] Nenhum POST sai para o espaço do Google Chat
- [ ] Se o envio falha, o estoque novo permanece

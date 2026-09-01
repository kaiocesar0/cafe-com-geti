# 08: Alerta no espaço do Google Chat ao cruzar 1

> **Difficulty:** Heavy: **suggested model:** Opus (Claude Code) / Grok 4.6 ou o modelo de raciocínio mais forte disponível (Cursor). Suggestion only, use whatever model you have to hand.

**What to build:** Depois de **salvar** uma mudança de estoque (vigente, contagem, −1/+1), se `anterior > 1` e `novo <= 1`, o **espaço do Google Chat** recebe mensagem em pt-BR com item, quantidade nova e **próximo da vez** (ou ninguém na fila). Abrir o app não avisa. 1→0 não avisa. URL do webhook só no servidor. Falha do Chat não desfaz o save.

**Blocked by:** 05 Registrar contribuição vigente; 07 −1 / +1 de estoque no dashboard

**Status:** ready-for-human

- [x] Predicado `shouldNotifyStockCrossedOne` testado (2→0 sim, 3→1 sim, 1→0 não, 5→2 não)
- [x] POST do webhook nas mutações de estoque vigentes (não em contribuição passada, não em GET)
- [x] `GOOGLE_CHAT_WEBHOOK_URL` ausente: não quebra o save; loga
- [x] Texto nunca vai ao cliente como URL; sem menção/DM

# 07: −1 / +1 de estoque no dashboard

> **Difficulty:** Standard: **suggested model:** Sonnet (Claude Code) / Sonnet (Cursor). Suggestion only, use whatever model you have to hand.

**What to build:** No card do item, gesto rápido **−1** (pacote acabou) e **+1** (voltou à prateleira). Só mexe estoque, não o ranking. Recusar −1 que deixaria estoque < 0, com erro visível. Sem Chat neste ticket (o próximo fio dispara o alerta).

**Blocked by:** 04 Dashboard com estoque e próximo da vez

**Status:** ready-for-human

- [x] −1 e +1 no dashboard persistem estoque
- [x] Ranking/próximo da vez inalterado pelo delta
- [x] Estoque não fica negativo; UI mostra o erro
- [x] Contagem no cadastro do item continua funcionando em paralelo

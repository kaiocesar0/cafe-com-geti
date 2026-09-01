# 05: Registrar contribuição vigente

> **Difficulty:** Standard: **suggested model:** Sonnet (Claude Code) / Sonnet (Cursor). Suggestion only, use whatever model you have to hand.

**What to build:** Formulário “trouxe agora”: qualquer **funcionário** (lista completa), qualquer **item**, quantidade ≥ 1, data default **hoje** em São Paulo. **Contribuição vigente** sobe estoque e **total contribuído**. Dashboard passa a mostrar o próximo certo. Quem não consome o item pode registrar; não vira próximo se estiver fora da **fila de item**.

**Blocked by:** 04 Dashboard com estoque e próximo da vez

**Status:** ready-for-human

- [x] Persistência de contribuição com `affectsStock = true`
- [x] Transação: estoque += qty e ranking atualiza
- [x] Data default no fuso America/Sao_Paulo
- [x] Teste: vigente muda estoque; próximo recalcula (ex. Maria 1, João 2)
- [x] Atalho a partir do dashboard para contribuir naquele item

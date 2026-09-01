# 09: Histórico, editar e excluir contribuição

> **Difficulty:** Standard: **suggested model:** Sonnet (Claude Code) / Sonnet (Cursor). Suggestion only, use whatever model you have to hand.

**What to build:** Lista de contribuições (vigentes e passadas), filtro por item/pessoa. **Editar** e **excluir** (com confirmação): recalcula total; se vigente, desfaz o estoque antigo e aplica o novo; se passada, estoque intocado. Não permitir trocar vigente ↔ passada. Recusar edição vigente que deixaria estoque < 0. Se a correção cruzar 1 para baixo, o Chat dispara (mesmo fio do ticket 08).

**Blocked by:** 06 Lançar contribuição passada; 08 Alerta no espaço do Google Chat ao cruzar 1

**Status:** ready-for-human

- [x] Histórico listável e filtrável
- [x] Excluir vigente desfaz estoque; excluir passada não
- [x] Editar quantidade/item/pessoa/data recalcula ranking; vigente recalcula estoque
- [x] Testes da spec para excluir vigente vs passada
- [x] Cruzar 1 numa edição vigente notifica o grupo; GET do histórico não notifica

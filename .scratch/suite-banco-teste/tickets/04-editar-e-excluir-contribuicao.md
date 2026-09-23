# 04: Editar e excluir contribuição

> **Difficulty:** Standard: **suggested model:** Sonnet (Claude Code) / Sonnet (Cursor). Suggestion only, use whatever model you have to hand.

**What to build:** Excluir uma contribuição vigente desfaz o estoque; excluir uma passada não mexe na prateleira. Nos dois casos o total contribuído é recalculado. Exclusão ou edição que deixaria o estoque negativo é recusada e a linha permanece. A edição não troca vigente por passada, nem o inverso. Trocar o item numa vigente tira a quantidade do item antigo e soma no novo.

**Blocked by:** 01: Trava do banco de teste

**Status:** ready-for-human

- [x] Excluir vigente desfaz o estoque; excluir passada não mexe no estoque; o total recalcula nos dois casos
- [x] Exclusão que deixaria estoque negativo é recusada e a contribuição permanece
- [x] Edição não troca vigente por passada nem o inverso
- [x] Trocar o item na edição de uma vigente move a quantidade do item antigo para o novo
- [x] Edição que deixaria estoque negativo é recusada

# 05: Contagem, −1/+1 e CRUD de item

> **Difficulty:** Standard: **suggested model:** Sonnet (Claude Code) / Sonnet (Cursor). Suggestion only, use whatever model you have to hand.

**What to build:** A contagem física define o estoque absoluto e não mexe no total contribuído. O −1 e o +1 do dashboard alteram só a prateleira; um −1 que ficaria negativo é recusado. Se a contagem ou o delta cruza 1 para baixo, o alerta sai com a mensagem já definida. Apagar um item apaga as contribuições dele e não alerta. Criar e editar item grava nome, unidade, tipo e estoque.

**Blocked by:** 03: Alerta ao cruzar 1

**Status:** ready-for-human

- [x] Contagem define o estoque absoluto e não altera o total contribuído
- [x] −1 e +1 alteram só o estoque; −1 que ficaria negativo é recusado
- [x] Contagem ou delta que cruza 1 para baixo dispara o alerta com a mensagem já definida
- [x] Apagar um item apaga as contribuições dele e não dispara alerta
- [x] Criar e editar item persiste nome, unidade, tipo e estoque

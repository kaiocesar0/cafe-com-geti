# 07: Spec descreve a suíte

> **Difficulty:** Light: **suggested model:** Sonnet (Claude Code) / Sonnet (Cursor). Suggestion only, use whatever model you have to hand.

**What to build:** A seção Testing Decisions da spec passa a ser o contrato desta suíte: branch de teste isolada de `hml` e `production`, as duas travas da URL, espiões no lugar do POST e da revalidação, falha do Chat não desfaz o save, e os comportamentos cobertos pelos tickets anteriores. A frase de que ainda não há suíte sai. Componentes de UI continuam fora.

**Blocked by:** 02: Contribuição vigente e passada; 03: Alerta ao cruzar 1; 04: Editar e excluir contribuição; 05: Contagem, −1/+1 e CRUD de item; 06: Fila e próximo da vez no banco

**Status:** ready-for-human

- [x] Testing Decisions descreve a branch de teste, as duas travas, os espiões, a falha do Chat que não desfaz o save, e os comportamentos dos tickets 02 a 06
- [x] A frase de que ainda não há suíte não permanece
- [x] A spec continua dizendo que componentes de UI ficam fora da suíte

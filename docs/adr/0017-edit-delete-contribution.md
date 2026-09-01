# ADR-0017 — Editar e excluir contribuição

## Status

Aceito

## Contexto

Lançamento no nome errado ou quantidade errada precisa de correção. Recalcular total e, se vigente, o estoque.

## Decisão

Contribuição pode ser **editada** e **excluída**.

- Recalcular **total contribuído** do(s) item(ns) afetados.
- Se **vigente**: desfazer o efeito antigo no estoque e aplicar o novo (troca de item, quantidade). Não deixar estoque negativo: recusar a operação ou clampar em 0 — recusar com erro visível.
- Se **passada**: estoque **intocado**.
- Não permitir mudar o tipo vigente ↔ passada na edição (exclui e lança de novo se precisar).
- Editar disparando cruza-1: usar estoque before/after da transação (ADR-0011).

## Consequências

- Histórico precisa de ações editar/excluir na UI.
- Auditoria de “quem clicou” continua inexistente (sem login).

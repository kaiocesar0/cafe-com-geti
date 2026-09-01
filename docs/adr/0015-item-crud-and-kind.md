# ADR-0015 — CRUD de item com tipo de fila

## Status

Aceito

## Contexto

Café, leite e filtro não devem ser hardcoded. Novos produtos (outro café, açúcar) precisam de regra de quem entra na fila.

## Decisão

Itens são **cadastrados na UI**. Cada item tem **tipo**:

| Tipo | Quem entra na fila |
|---|---|
| `coffee` | preferência café ou ambos |
| `milk` | preferência leite ou ambos |
| `filter` | preferência café ou ambos |

Dois itens `coffee` têm filas/totais **separados** (próximo do “café 500 g” ≠ próximo do “café da outra marca”).

## Consequências

- Preferência do funcionário permanece o enum de três valores.
- Tipo novo além desses três fica para fase 2 (exigiria regra de fila custom).

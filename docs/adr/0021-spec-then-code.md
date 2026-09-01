# ADR-0021 — Spec antes do código, sem telas no Figma

## Status

Aceito

## Contexto

Tokens e DS Figma existem; não há necessidade de mockar as três telas antes de implementar.

## Decisão

Entregar **`docs/spec.md`** como contrato de implementação. Código em seguida, UI em shadcn. Sem Figma de telas do produto no MVP.

## Consequências

- Visual = spec de telas em prosa + tokens ADR-0013, não arquivo `.fig` do app.

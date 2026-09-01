# ADR-0018 — Dois jeitos de ajustar estoque

## Status

Aceito

## Contexto

Contagem física e o gesto do dia a dia (“acabou um pacote”) são fluxos diferentes.

## Decisão

- **Contagem**: no cadastro/edição do item, campo “estoque agora é X”.
- **Delta rápido**: no dashboard, **−1** (e **+1** se fizer sentido simétrico) por item, quando um pacote acaba ou volta à prateleira.

Ambos só mudam estoque, não o ranking. Ambos passam pela regra de alerta ADR-0011.

## Consequências

- Dashboard é o lugar do gesto que mais gera Chat.
- Estoque inicial = contagem no create do item.

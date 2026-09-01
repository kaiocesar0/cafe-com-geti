# ADR-0008 — Fila do filtro = quem toma café

## Status

Aceito

## Contexto

Filtro não é “consumido” como bebida; acompanha o café.

## Decisão

Quem tem preferência **café** ou **ambos** entra na fila do filtro. Quem só toma leite não entra.

Café e filtro têm **próximos independentes** (totais separados). Podem ser pessoas diferentes no mesmo momento.

## Consequências

- Preferência continua um enum simples (café / leite / ambos), sem flag extra para filtro.
- Novo item “tipo café” no futuro precisaria da mesma regra (ainda não modelado como categoria).

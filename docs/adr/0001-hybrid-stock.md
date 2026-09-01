# ADR-0001 — Estoque híbrido

## Status

Aceito

## Contexto

Não sabemos quanto cada item dura. Consumo automático por preferência seria chute. Esperar só contribuição deixaria o estoque só subir.

## Decisão

- **Contribuição** aumenta o estoque na quantidade registrada.
- **Ajuste manual** reduz (ou corrige) o estoque para refletir consumo, perda ou contagem física.
- Não há baixa automática no MVP.

## Consequências

- O número na tela só é confiável se alguém ajustar quando o pacote acabar (ou periodicamente).
- O histórico de contribuições continua útil para o próximo da vez, mesmo que o estoque esteja desatualizado.
- Relatório de consumo mensal fica para fase 2, a partir dos ajustes + contribuições.

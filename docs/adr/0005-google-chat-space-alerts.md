# ADR-0005 — Alertas no espaço do Google Chat

## Status

Aceito

## Contexto

A dor é perceber tarde demais que acabou. Mensagem privada “sua vez” não é MVP. O time já se coordena num grupo.

## Decisão

- Um **Incoming Webhook** apontando para o **espaço (grupo) do workspace**.
- Disparo conforme before/after do estoque (detalhe: ADR-0024; histórico: ADR-0011).
- Nos avisos de estoque baixo e de acabou, o texto **nomeia o próximo da vez**, visível para todos.
- Sem DM, sem Chat API com menção obrigatória no MVP (webhook cobre o grupo).

## Consequências

- Todos veem o alerta; não depende do próximo abrir o app.
- Silêncio entre valores acima de 1; novo aviso após reposição que volta a cruzar 0 ou 1 (ADR-0024).
- URL do webhook é segredo de servidor.

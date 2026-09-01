# ADR-0004 — Próximo da vez por item e por quantidade trazida

## Status

Aceito (desempate: ADR-0006; filtro: ADR-0008)

## Contexto

Não é uma fila única da copa. Café, leite e filtro têm ritmos e consumidores diferentes. Rodízio “quem trouxe por último” ignora quem já trouxe mais unidades.

Exemplo: João trouxe 2 cafés; Maria trouxe 1. Maria é a próxima do café, mesmo que João tenha trazido depois.

## Decisão

- Existe uma **fila por item**: só entra quem **consome** aquele item.
- **Próximo da vez** = funcionário ativo na fila com o **menor total contribuído** daquele item (soma das quantidades no histórico, inclusive importado).
- Registrar contribuição atualiza o total e, portanto, quem é o próximo.
- Não usamos ponteiro circular (“sua vez e passa”) como regra principal.

## Consequências

- Importar histórico inicial é requisito de MVP (RF-08); sem isso a ordem começa injusta.
- Precisamos definir unidade (pacote vs litro) e o que acontece em empate.
- Preferência “só café” / “só leite” / “ambos” precisa mapear para itens (filtro ainda em aberto).

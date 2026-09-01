# 04: Dashboard com estoque e próximo da vez

> **Difficulty:** Standard: **suggested model:** Sonnet (Claude Code) / Sonnet (Cursor). Suggestion only, use whatever model you have to hand.

**What to build:** No dashboard, cada item mostra estoque (semáforo: >1 ok, =1 ouro, 0 vermelho), unidade e o **próximo da vez** pela regra da spec (fila por tipo, menor **total contribuído**, empate por quem está devendo há mais tempo, senão ordem de cadastro). Sem contribuições, o próximo é o ativo mais antigo na fila. Módulo `rotation` testado de verdade. Leitura apenas; ainda sem −1 nem contribuir.

**Blocked by:** 02 CRUD de funcionários (preferência e ativo); 03 CRUD de itens e contagem de estoque

**Status:** ready-for-human

- [x] Função pura de próximo da vez cobre os casos da spec (Maria vs João, empate, nunca trouxeram, leite não entra em café/filtro, inativo fora)
- [x] Dashboard lista itens com estoque, semáforo e nome do próximo (ou “ninguém na fila”)
- [x] Quem só toma leite não aparece como próximo de café/filtro mesmo com contribuições futuras no total
- [x] Sem POST de Chat ao só abrir o dashboard

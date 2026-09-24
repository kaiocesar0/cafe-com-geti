# 07: Botão Admin e controles na tela

> **Difficulty:** Standard: **suggested model:** Sonnet (Claude Code) / Sonnet (Cursor). Suggestion only, use whatever model you have to hand.

**What to build:** As cinco rotas e o menu continuam. Visitante vê listas, estoque e próximo da vez; somem contribuir, criar, editar, excluir, −1/+1 e contagem. Em Contribuir, sem sessão, a página diz que só admin registra e aponta o botão **Admin**. O botão **Admin** no header (desktop e mobile) abre diálogo na página com username e senha. Logado, o header mostra o username e **Sair**; clique no username abre troca da própria senha. Username e perfil na ficha de Funcionários só para admin e admin geral logados; promover, rebaixar, inativar e trocar senha de outro aparecem só para quem a matriz permite. Contribuir logado pré-seleciona o logado.

**Blocked by:** 04: Trava de login no navegador; 05: Trocar minha senha; 06: Matriz de perfis

**Status:** ready-for-human

- [x] Botão **Admin** no header (desktop e mobile) abre diálogo de login na página atual
- [x] Logado: header mostra username e **Sair**; clique no username abre troca de senha (atual + nova)
- [x] Sem sessão: controles de escrita somem; Contribuir mostra texto apontando **Admin**
- [x] Com sessão: escritas reaparecem; contribuir pré-seleciona o logado
- [x] Lista pública de funcionários: só nome, preferência e ativo
- [x] Username, perfil e ações de promover/rebaixar/trocar senha de outro só para quem a matriz permite
- [x] Menu e as cinco rotas permanecem iguais

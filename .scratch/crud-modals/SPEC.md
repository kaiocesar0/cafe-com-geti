# Spec — Modais de editar e confirmar no CRUD

Status: ready-for-human  
Fuso: `America/Sao_Paulo`  
Glossário: [CONTEXT.md](../../CONTEXT.md)

## Problem Statement

Nas telas de itens, funcionários e histórico, editar abre um bloco inline com `<details>` que estica a linha da tabela e quebra o ritmo visual. Excluir contribuição e rebaixar login usam o `confirm` nativo do navegador, fora do design system. Quem administra a copa vê uma UI inconsistente com o restante do app (já há diálogos em Admin / troca de senha).

## Solution

Editar passa a abrir um **modal** com o formulário existente; ações destrutivas (excluir contribuição, rebaixar a funcionário) passam a um **modal de confirmação** no mesmo visual do Dialog do app. Os formulários de **criar** (novo item / novo funcionário) continuam nas seções atuais. Comportamento das actions, permissões e regras de domínio não mudam — só o shell de UI, com componentes reutilizáveis.

## User Stories

1. Como admin, quero clicar em Editar numa contribuição e ver o formulário num modal, para a tabela não expandir inline.
2. Como admin, quero clicar em Editar num item e ver o formulário num modal, para a lista de cadastrados continuar limpa.
3. Como admin, quero clicar em Editar num funcionário e ver o formulário (e ações de conta, quando couber) num modal, para o mesmo padrão das outras telas.
4. Como admin, quero fechar o modal de edição pelo X, por Cancelar/Fechar ou clicando fora / Esc (comportamento padrão do Dialog), para abortar sem salvar.
5. Como admin, quero que ao salvar com sucesso o modal de edição feche e o toast continue aparecendo, para o fluxo parecer completo.
6. Como admin, quero que erro de validação/permissão no modal de edição mostre o toast e mantenha o modal aberto, para eu corrigir sem reabrir.
7. Como admin, quero clicar em Excluir numa contribuição e ver um modal pedindo confirmação (não o diálogo do Windows/navegador), para a ação parecer do produto.
8. Como admin, quero no modal de exclusão o título e uma frase clara do que será excluído, com botões Cancelar e Excluir (destrutivo), para não apagar por acidente.
9. Como admin, quero Cancelar no modal de exclusão sem chamar a action, para nada mudar no banco.
10. Como admin, quero confirmar a exclusão e ver o toast de sucesso (ou erro), com o modal fechando no sucesso, para o histórico atualizar.
11. Como admin geral, quero clicar em Rebaixar e ver um modal de confirmação com o nome da pessoa, no lugar do `confirm` nativo, para o mesmo padrão visual das exclusões.
12. Como visitante sem escrita, quero que Editar / Excluir / Rebaixar continuem ausentes, para a leitura da copa não mudar.
13. Como admin, quero os botões de ação na linha (Editar, Excluir) discretos e alinhados ao DS, para a tabela não parecer improvisada.
14. Como quem mantém o código, quero um shell de modal de formulário reutilizável e um de confirmação reutilizável, para itens, funcionários e histórico não copiarem markup de Dialog.
15. Como quem mantém o código, quero que os formulários de edição existentes continuem sendo o conteúdo do modal (sem reescrever a lógica de fields/actions), para o risco ficar no shell.
16. Como quem mantém o código, quero que criar item e criar funcionário continuem nas seções “Novo …”, para este trabalho não virar redesign de cadastro.
17. Como quem usa teclado, quero foco preso no modal aberto e retorno ao gatilho ao fechar, para acessibilidade básica do Dialog.
18. Como admin, quero que só um modal de edição/confirmação faça sentido por vez (padrão do Dialog controlado), para não empilhar overlays confusos.
19. Como admin, quero que promoção / troca de senha que já usam Dialog continuem como estão, salvo se o shell compartilhado as absorver sem mudar UX, para não regredir auth.
20. Como quem revisa, quero um ticket único alinhado a esta spec, para implementar a harmonização de uma vez nas três telas.

## Implementation Decisions

- Escopo: substituir todos os `<details>` de editar em histórico, itens e funcionários; substituir todos os `window.confirm` (excluir contribuição e rebaixar). Fora: formulários de criar nas seções atuais.
- Usar o Dialog já existente no design system (Base UI / shadcn do projeto). Não introduzir biblioteca nova. Se faltar um padrão de “alerta”, compor confirmação com o mesmo Dialog (título, descrição, footer com Cancelar + ação destrutiva).
- Extrair componentes compartilhados, no espírito do que Admin já faz com diálogo de sessão: (1) shell de modal de formulário (trigger, título, descrição opcional, children = form, fecha no sucesso); (2) shell de confirmação (trigger ou open controlado, título, descrição, label do botão destrutivo, callback/async confirm). Managers só orquestram dados e actions.
- Formulários de edição (item, funcionário, contribuição) permanecem; ganham callback de sucesso para fechar o modal. Em funcionários, o conteúdo do modal de edição inclui o formulário e as ações de conta que hoje ficam dentro do `<details>`, sem mudar a matriz de permissão.
- Tabelas: gatilho “Editar” (e “Excluir” onde houver) como botão/link do DS na célula de ações; sem `<details>` e sem `confirm` nativo.
- Toast (sonner) e server actions existentes continuam; sem schema, sem mudança de contrato das actions.
- Visual alinhado aos Dialog já usados (Admin): header com título/descrição, conteúdo, footer quando fizer sentido; tema claro/escuro herdado.

## Testing Decisions

Testar comportamento de domínio e permissão nas actions — já coberto. **Não** criar seam automatizada de render de modal.

Aceite humano no ticket: abrir/fechar edição nas três telas; salvar fecha e toast; erro mantém aberto; excluir e rebaixar usam modal (nunca `confirm` nativo); visitante sem botões; teclado/Esc/overlay.

Prior art: Dialog em Admin / troca de senha; managers atuais.

## Out of Scope

Mover criar para modal; redesenhar filtros do histórico; alterar regras de estoque, fila, auth ou matriz; AlertDialog de outra lib; testes E2E/Playwright; mudar copy das actions além do necessário no modal de confirmação.

## Further Notes

Ticket único em `tickets/`. Implementar depois desta spec como entendimento compartilhado.

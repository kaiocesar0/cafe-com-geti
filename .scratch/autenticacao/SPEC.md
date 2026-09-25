# Spec — Autenticação

Status: ready-for-human
Fuso: `America/Sao_Paulo`  
Glossário: [CONTEXT.md](../../CONTEXT.md)

## Problem Statement

O app é um link interno sem login. Qualquer pessoa que abre o endereço altera estoque, contribuição, funcionário e item. A leitura da copa precisa continuar aberta. Criar, editar, excluir e ajustar estoque precisam de uma pessoa autenticada, com senha própria, e com limite claro entre quem só aparece na fila e quem pode gravar.

## Solution

Funcionário, admin e admin geral são a mesma pessoa do cadastro. Funcionário não tem senha. Admin e admin geral entram por um diálogo **Admin** no header, com username e senha. A sessão libera as escritas. Admin geral administra os outros logins. Visitante continua vendo listas, estoque e próximo da vez.

## User Stories

1. Como visitante, quero ver estoque, próximo da vez e as listas sem entrar, para consultar a copa.
2. Como visitante, quero as cinco rotas e o menu iguais aos de hoje, para achar as mesmas telas.
3. Como visitante, quero que sumam contribuir, criar, editar, excluir, −1/+1 e contagem, para a tela não oferecer escrita.
4. Como visitante, quero em Contribuir um texto de que só admin registra, apontando o botão **Admin**, para a página não ficar vazia.
5. Como visitante, quero a lista de funcionários só com nome, preferência e ativo, para username e perfil não aparecerem.
6. Como visitante, quero que uma escrita chamada fora da tela seja recusada, para esconder o botão não ser a única trava.
7. Como visitante, quero o botão **Admin** no header no computador e no celular, para abrir o login onde eu estiver.
8. Como visitante, quero o login num diálogo na página atual, com username e senha, para não ir a outra rota.
9. Como admin, quero entrar com username e senha, para as escritas aparecerem.
10. Como admin, quero a mensagem “credenciais inválidas” quando a senha está errada, o username não existe ou a conta está inativa, para o erro não revelar quem tem login.
11. Como admin, quero o header mostrar meu username e **Sair**, para saber que entrei.
12. Como admin, quero que **Sair** encerre só a sessão deste navegador, para outro aparelho continuar aberto.
13. Como admin, quero a sessão valer 14 dias desde o último uso que a valida, para não cair no meio do uso.
14. Como admin, quero clicar no username e trocar minha senha informando a atual e a nova, para não depender de outra pessoa.
15. Como admin, quero que essa troca derrube as outras sessões e mantenha a atual, para este navegador não cair.
16. Como admin, quero contribuir em nome de qualquer funcionário, comigo já selecionado, para lançar o que eu ou outra pessoa trouxe.
17. Como admin, quero −1/+1, contagem e o criar, editar e excluir de item, funcionário e contribuição, para cuidar da copa.
18. Como admin, quero cadastrar funcionário sem senha, para essa pessoa entrar na fila sem virar login.
19. Como admin, quero promover só funcionário ativo, gravando username e senha inicial, para entregar o acesso fora do app.
20. Como admin, quero ser impedido de promover inativo, de criar admin geral direto e de editar, inativar ou rebaixar outro admin ou admin geral.
21. Como admin, quero alterar meu nome e minha preferência, para a fila me refletir.
22. Como admin, quero ser impedido de alterar meu ativo, meu perfil e meu username.
23. Como admin geral, quero alterar nome, preferência e ativo de outro admin ou admin geral, para corrigir o cadastro deles.
24. Como admin geral, quero rebaixar outro admin ou outro admin geral a funcionário, apagando username, senha e sessões, para tirar o acesso.
25. Como admin geral, quero promover um admin a admin geral sem trocar username nem senha, para ampliar o acesso de quem já entra.
26. Como admin geral, quero trocar a senha de outro admin ou admin geral sem saber a senha atual, e derrubar todas as sessões dessa pessoa.
27. Como admin geral, quero ser impedido de me rebaixar, de me inativar e de rebaixar ou inativar o último admin geral ativo.
28. Como admin ou admin geral inativado e depois reativado, quero entrar com a mesma senha, com as sessões antigas ainda mortas.
29. Como funcionário da fila, quero que o perfil de login não me tire da fila nem mude a preferência por si só.
30. Como quem erra a senha cinco vezes seguidas neste navegador, quero este navegador bloqueado por 15 minutos nesse username, mesmo com a senha certa em seguida.
31. Como quem está em outro navegador, quero entrar com esse username enquanto o primeiro navegador está travado.
32. Como quem erra outro username no mesmo navegador, quero que a outra conta não trave junto.
33. Como quem apaga os cookies deste navegador, quero o contador da trava recomeçar.
34. Como quem acerta a senha neste navegador, quero a trava deste navegador nesse username sumir.
35. Como quem tenta um username que não existe, quero a mesma mensagem de erro e nenhuma linha nova no banco por causa da tentativa.
36. Como admin já logado que dispara uma ação fora da matriz, quero a resposta “Sem permissão”, para a ação não acontecer.
37. Como funcionário sem senha, quero não ter login nem troca de senha.
38. Como quem configura, quero a primeira conta num script local que pede nome, preferência, username e senha e grava um admin geral, para a senha não ir para a Vercel.
39. Como quem configura, quero o pepper só em variável de ambiente, para o banco sozinho não bastar para testar senha.
40. Como quem recebe um username errado na promoção, quero corrigir rebaixando e promovendo de novo, porque o username não muda no lugar.
41. Como admin, quero que as regras já existentes de estoque, fila, contribuição e alerta continuem valendo quando eu gravo, para o login não mudar a copa.

## Implementation Decisions

- Três perfis no funcionário: `funcionario` (sem senha), `admin`, `admin_geral`. O rótulo na interface é funcionário, admin e admin geral. O botão do header continua **Admin**.
- Funcionário ganha perfil, `username` opcional e hash de senha opcional. Username é único, imutável, normalizado em minúsculas. Formato: 3 a 32 caracteres, começa com letra, só letras minúsculas, números e hífen. Vários funcionários sem username podem coexistir.
- Senha: Argon2id, salt aleatório por pessoa dentro do hash, pepper de ambiente misturado antes do hash. Pepper não entra no banco. Mínimo 8 caracteres na senha inicial e na troca. Hash nunca vai ao cliente.
- Sessão no banco: pessoa, hash do token, vencimento. O cookie leva só o token opaco, `httpOnly`, `Secure`, `SameSite=Lax`. Vale 14 dias desde o último request que valida a sessão. **Sair** apaga só essa sessão.
- Troca da própria senha exige a senha atual, abre pelo clique no username, derruba as outras sessões e mantém a atual. Troca feita pelo admin geral na conta de outro não pede a senha atual e derruba todas as sessões dessa pessoa.
- Não há cadastro público nem rota nova de login. O diálogo de entrar pede username e senha. Deslogado, esse diálogo não oferece troca de senha.
- Escritas existentes (contribuir, editar e excluir contribuição, criar, editar e excluir item e funcionário, contagem, −1/+1, ativo) exigem sessão de admin ou admin geral. Listagens seguem sem sessão. A listagem pública de funcionário devolve nome, preferência e ativo. Username e perfil só na leitura autenticada de admin ou admin geral.
- Matriz: admin cria e edita funcionário (nome, preferência, ativo) e promove funcionário ativo a admin, gravando username e senha inicial. Admin não edita outro admin nem admin geral. Admin altera o próprio nome e a própria preferência, e não altera o próprio ativo, perfil ou username. Admin geral altera nome, preferência e ativo dos outros, rebaixa admin ou admin geral a funcionário (apaga username, hash e sessões) e promove admin a admin geral sem mexer em username nem senha. Ninguém rebaixa nem inativa a si mesmo. O último admin geral ativo não é rebaixado nem inativado. Inativar admin ou admin geral apaga as sessões e bloqueia o login. Reativar não recria sessão. Funcionário inativo não é promovido. Perfil não altera fila nem preferência.
- Contribuir logado lista todos os funcionários e pré-seleciona o logado. Sem sessão, a página só explica que admin registra.
- Trava de login num cookie `httpOnly` assinado deste navegador, não no banco e não por IP. Cinco erros seguidos do mesmo username neste navegador travam esse par por 15 minutos, inclusive com a senha certa. O contador não expira sozinho antes da quinta falha. Ao fim dos 15 minutos o contador zera. Outro navegador, outro username e o resto da rede não travam. Acerto zera a trava deste navegador nesse username. Apagar o cookie recomeça o contador. Editar o valor do cookie não zera. Username ausente no banco não grava tentativa. Sessão já aberta não cai por causa da trava.
- Funcionários já gravados passam a funcionário, sem username e sem senha.
- A primeira conta é um script local: nome, preferência, username e senha, gravados como admin geral. A senha não fica em variável de ambiente da hospedagem. Rodar de novo com username já usado falha sem sobrescrever.
- Sem o pepper, login e gravação de senha falham. A suíte define o pepper no ambiente de teste.

## Testing Decisions

Testar comportamento, não componente de interface e não o prompt do terminal.

A suíte continua a de hoje: Vitest, no mesmo `npm test`, em série, contra a branch Neon de teste. Cada caso começa com a copa vazia, agora também sem sessões. `revalidatePath` e o alerta do Chat seguem espiões.

Um só ponto de observação: as operações de servidor. O harness substitui o cookie do Next por um pote em memória e oferece um relógio avançável, no mesmo espírito dos espiões já usados. O teste chama login, sair, troca de senha e as escritas, e confere o retorno e o banco. Não renderiza tela.

A operação que o script usa para criar o primeiro admin geral entra nesse mesmo ponto. O readline fica de fora.

Casos novos:

- Sem sessão, listagem de item, funcionário e contribuição funciona. A de funcionário não traz username, perfil nem hash. Criar, editar, excluir, contribuir, contagem e −1/+1 são recusados e o banco não muda.
- Login certo abre sessão e a escrita passa. Senha errada, username ausente e conta inativa devolvem “credenciais inválidas”. Username ausente não cria linha de tentativa.
- Cinco erros seguidos travam esse username neste pote de cookies por 15 minutos, inclusive com a senha certa. Outro pote entra. Outro username no mesmo pote não trava. Acerto zera. Apagar o cookie zera. Cookie adulterado não zera.
- **Sair** mata só a sessão daquele pote. A sessão vence 14 dias após o último uso que a valida. O relógio avançado dispara o vencimento.
- Troca da própria senha exige a atual, mantém a sessão deste pote, mata as outras e passa a valer a senha nova. Admin geral troca a de outro sem a atual e mata todas as sessões dessa pessoa.
- Admin promove funcionário ativo e o novo admin entra. Inativo não promove. Admin não edita outro admin, não se inativa, não muda o próprio username nem o próprio perfil. Admin geral rebaixa, promove a admin geral e é impedido de rebaixar ou inativar a si mesmo e o último admin geral ativo. Rebaixar apaga username, senha e sessões. Inativar bloqueia o login. Reativar entra com a senha antiga e sem sessão antiga.
- Ação autenticada fora da matriz devolve “Sem permissão” e o banco não muda.
- Os casos já existentes de estoque, fila, contribuição e alerta rodam com uma sessão de admin aberta pelo harness e continuam válidos.

## Out of Scope

Cadastro público, e-mail, “esqueci a senha”, login Google, papéis além dos três, editar username no lugar, botão de desbloquear, trava por IP, fingerprint, firewall de volume, apagar funcionário (segue só inativar), rota separada de login, componente de UI na suíte, prompt interativo do script na suíte.

## Further Notes

Este contrato substitui, para autenticação, a decisão de MVP sem login. A fila, o estoque, o alerta e o fuso não mudam.

Implementar somente depois desta spec ser confirmada como entendimento compartilhado.

# 01: Perfil no funcionário e primeira conta

> **Difficulty:** Heavy: **suggested model:** Opus (Claude Code) / Opus or the strongest reasoning model available (Cursor). Suggestion only, use whatever model you have to hand.

**What to build:** O funcionário passa a ter perfil (`funcionario`, `admin`, `admin_geral`), username opcional e hash de senha opcional. Existe tabela de sessões. Quem configura o ambiente define o pepper e cria o primeiro admin geral por operação de servidor (script local no terminal; a suíte chama a mesma operação sem readline). Funcionários já gravados viram `funcionario` sem username nem senha. Cada caso da suíte começa sem funcionários, itens, contribuições nem sessões. Sem pepper, gravar senha falha.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [x] Schema tem perfil, username único (quando presente), hash de senha e tabela de sessões
- [x] Funcionários existentes migram para perfil funcionário, sem username e sem senha
- [x] Operação cria o primeiro admin geral com nome, preferência, username e senha; username já usado falha sem sobrescrever
- [x] Senha é Argon2id com pepper de ambiente; hash nunca vai ao cliente
- [x] Username normalizado (minúsculas, 3–32, letra no início, só letras/números/hífen)
- [x] Sem pepper, gravação de senha falha
- [x] Suíte define pepper no ambiente de teste e esvazia também as sessões a cada caso
- [x] Script local pede os dados no terminal e grava um admin geral; senha não vai para env da hospedagem

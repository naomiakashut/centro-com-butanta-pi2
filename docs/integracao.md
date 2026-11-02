# Integração e conflitos encontrados

Análise do front `centro-com-butanta-pi2` e do back `centro_butanta_be`, em 31/10/2026. O contrato foi conferido nos schemas, routers, modelos e CRUD do back-end, e não apenas nos exemplos do README.

## Corrigido nesta entrega

| Problema | Correção |
|---|---|
| Login aceitava qualquer credencial e gravava apenas um booleano | POST `/api/v1/auth/token` como `application/x-www-form-urlencoded`, com `username` e `password`; JWT Bearer nas consultas |
| Dados e alterações existiam apenas em `localStorage` | Store passa a consultar e alterar a API; dados de demonstração e sua restauração foram removidos |
| API usa campos portugueses e IDs por entidade | Adaptador converte associados, moradias, comprovantes e pagamentos para o modelo das telas |
| Cadastro não enviava a FK obrigatória de moradia | Cria moradia primeiro e vincula todos os associados por `id_moradia` |
| Falha durante cadastro poderia deixar registros sem aviso | Tenta remover apenas os registros recém-criados; informa IDs remanescentes quando a compensação falha |
| Limite padrão de 100 registros truncaria listas e indicadores | Consultas percorrem páginas com `skip` e `limit` |
| Campos opcionais vazios e e-mail sem ponto no domínio | E-mail e telefone vazios são enviados como `null`; validação de e-mail passou a exigir domínio com ponto, compatível com o caso básico de `EmailStr` |
| Identidade, datas, vencimentos e pagamentos fictícios | Identidade genérica, datas da API e ausência de vencimento explícita; pagamentos agora exigem dados reais |
| Pendentes eram contados como ativos | Contagem de ativos inclui somente `ativo` e o indicador derivado de atraso |
| Agrupamento dependia de texto do endereço | Relações e contagens usam `id_moradia` |
| API não iniciava com instalação limpa | Adicionado `python-multipart` a `../centro_butanta_be/requirements.txt`; necessário para `OAuth2PasswordRequestForm` |

## Lacunas e decisões pendentes

| Prioridade | Conflito / evidência | Comportamento atual e próximo ajuste |
|---|---|---|
| Alta | Não há transação HTTP única para moradia + associados; cada POST faz commit | Compensação pelo cliente. Queda de rede pode deixar resultado desconhecido mesmo com tentativa de limpeza. Criar endpoint transacional e chave de idempotência no back-end |
| Alta | Cadastro ainda não envia CEP, cidade e estado à API atualizada | A tela informa que CEP/cidade/estado são apenas consulta. O campo **Complemento** utiliza `complemento` da API, com limite de 200 caracteres. A integração dos demais campos de endereço continua pendente |
| Resolvido | Front consultava `/api/cep/{cep}`, rota inexistente | Consulta direta a `https://viacep.com.br/ws/{cep}/json/`. Mapeia `logradouro/localidade/uf` para endereço/cidade/estado, trata `erro: true`, indisponibilidade e cancelamento. Mantém preenchimento manual quando necessário |
| Alta | `Pagamento` pertence ao associado; não há competência, vencimento ou saldo por unidade | O fluxo simplificado grava `ativo`/`mensalidade_atrasada` e a última data de pagamento no associado selecionado. Não cria lançamentos financeiros nem calcula saldo. Cobrança por unidade, competência e pagamentos parciais continuam pendentes |
| Alta | Não há endpoint/configuração de UFESP nem regra de mensalidade persistida | UFESP é uma estimativa local da sessão (valor inicial herdado do protótipo, sem validação de valor vigente). Estimativa de 0,5/1 UFESP depende de `numero_residentes`. Criar configuração central e regra de cobrança no servidor |
| Alta | `SECRET_KEY` e seed têm valores de exemplo no back-end | Configurar chave própria e credenciais próprias antes de disponibilizar o sistema. O front não contém credenciais reais nem renovação de JWT |
| Média | Aprovar comprovante e ativar associado são duas operações | Atualiza comprovante primeiro e recarrega dados ao tentar ativação. Uma falha pode deixar comprovante aprovado e cadastro pendente; definir endpoint transacional de aprovação |
| Média | Comprovante tem apenas caminho e status; não existe upload/download de arquivo ou motivo de reprovação | Apenas aprova/reprova registros existentes. Motivo não é solicitado nem anunciado como salvo. Criar armazenamento, endpoints e campo de motivo para completar o fluxo documental |
| Média | `situacao_cadastro`, `tipo_associacao` e `status_aprovacao` são textos livres | Integração usa `pendente/ativo/inativo`, `proprietario/associado`, `pendente/aprovado/reprovado`. Valores desconhecidos são sinalizados. Formalizar enums e migrar registros históricos |
| Média | Não há unicidade de documento ou de endereço nem seleção de moradia existente no cadastro | Cada envio cria uma nova moradia. Pessoas com o mesmo endereço não são mescladas automaticamente. Definir unicidade e fluxo de vinculação a moradias existentes |
| Média | `numero_residentes` não é recalculado ao desativar alguém | Mantém valor do cadastro; estimativa financeira pode ficar desatualizada. Definir se o total inclui inativos e calcular no servidor |
| Média | Não há `/auth/me`, recuperação de senha ou refresh token | Cabeçalho identifica a equipe genericamente. Sessão usa JWT na aba e exige novo login após 401. Recuperação fictícia foi removida |
| Média | Aprovação/pagamento não atribuem automaticamente o administrador autenticado no CRUD | A API aceita `id_administrador` opcional no PUT, mas POST de pagamento não o recebe. Para auditoria confiável, servidor deve usar a identidade autenticada |
| Média | Schemas aceitam senha até 128 caracteres; bcrypt tem limite de 72 bytes | Revisar validação/hash no back-end: senhas longas podem causar erro. Não foi alterado o mecanismo de autenticação nesta integração |
| Média | CORS fixa origens localhost e segredo JWT tem padrão de desenvolvimento | Proxy local resolve acesso pelo front em desenvolvimento. Produção exige domínio/proxy/CORS e configuração de segredo próprios |
| Baixa | README do back mostra login Axios com JSON e menciona `senha` em exemplo de formulário | Implementação real exige formulário com `password`; cliente segue o router, não esses exemplos |
| Baixa | Dependências Python têm limites mínimos sem lock; warnings de Pydantic/Starlette | Fixar versões homologadas e atualizar APIs depreciadas antes de upgrades maiores |

CPFs são mascarados para exibição; os dados completos continuam disponíveis na API ao administrador autenticado. A máscara visual não substitui controle de acesso. Dados reais de moradores não são persistidos no armazenamento local pelo novo store.

## Validação

Os testes unitários cobrem OAuth2/Bearer, 401, erro 422, falha de rede, paginação, resposta de sessão encerrada, criação com FK compartilhada, compensação, falha de compensação e composição das entidades. Os testes de formulário cobrem máscaras, campos obrigatórios, CEP e envio assíncrono.

A suíte original do back-end foi executada numa cópia temporária com SQLite, após instalar a dependência ausente: **45 testes passaram**, com warnings de depreciação de configuração Pydantic e uso de TestClient/HTTPX. Não houve acesso a um PostgreSQL existente.

Resultado final: **73 testes unitários do front**, **45 testes do back-end** e **6 execuções E2E em Chromium**, sem retries na verificação final (três cenários repetidos duas vezes). Build, ESLint, Oxlint e verificação de whitespace passaram. A API real foi executada em cópia temporária com SQLite em arquivo; PostgreSQL e deploy de produção não foram validados. CEP foi simulado no E2E.


## Ajuste de registro de pagamento ou atraso — 01/11/2026

O formulário simplificado contém apenas a opção **Mensalidade atrasada** e a data em **dd/mm/aaaa**. Marcar atraso desabilita a data e preserva a data do último pagamento no banco. Desmarcar exige uma data válida e salva a situação `ativo`. O endpoint `PUT /associados/{id}/mensalidade` aplica a mudança somente ao associado selecionado, em uma operação, e exige cadastro já ativado. A interface passa a usar a situação persistida, sem inferir atraso a partir de pagamentos antigos ou de outros moradores.

Não há geração de `Pagamento` neste fluxo, pois não são coletados valor, pagador ou forma de pagamento. O histórico financeiro anterior permanece intacto. O novo campo `data_ultimo_pagamento` exige a migração aditiva `migrations/20261101_mensalidade.sql` no back-end para bancos existentes. A revisão Alembic antiga contém exclusão de tabelas e não deve ser executada como parte desta alteração. Os avisos de ausência de persistência de UFESP foram removidos das telas; a implementação de configuração central continua pendente.

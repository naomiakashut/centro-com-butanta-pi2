# Centro Comunitário Butantã — front-end

Painel Vue 3 integrado à API FastAPI do projeto `../centro_butanta_be`.

## Executar somente o front-end

```sh
npm ci
npm run dev:fe
```

Abra o endereço exibido pelo Vite (normalmente `http://localhost:5173`). Esse modo permite navegar pelo painel sem iniciar o back-end ou PostgreSQL. O login vem preenchido com `demo@example.com` / `demonstracao`.

Login, cadastros, aprovação, desativação e pagamentos usam uma API simulada no próprio servidor de desenvolvimento. Os dados são fictícios, compartilhados entre as abas desse servidor e descartados ao reiniciá-lo. O modo ignora a URL de API configurada para evitar enviar alterações ao back-end real. A consulta de CEP continua usando o ViaCEP e requer internet.

O comando `npm run dev` continua usando a API real. O modo de demonstração fica disponível apenas com `npm run dev:fe`, sem fallback automático em caso de falha da API real.

## Executar localmente

Requer Node compatível com `package.json` e o back-end em execução na porta 8000.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

No back-end, configure `.env`, instale `requirements.txt`, disponibilize PostgreSQL e execute:

```sh
uvicorn app.main:app --reload --port 8000
```

O login exige um administrador real. Para o primeiro acesso, o back-end dispõe de `ADMIN_SEED_ENABLED`, `ADMIN_SEED_EMAIL` e `ADMIN_SEED_PASSWORD`. Configure credenciais próprias no ambiente do back-end; desative o seed após criar o administrador. As credenciais locais de demonstração são usadas somente no modo `dev:fe`.

O Vite encaminha `/api` para `http://localhost:8000`. Ajuste `API_PROXY_TARGET` em `.env.local` se necessário. `VITE_API_BASE_URL` define a base dos endpoints de gestão (padrão `/api/v1`). Variáveis `VITE_*` ficam públicas no bundle: nunca coloque segredos nelas.

Em produção, configure o servidor web para encaminhar `/api` ao back-end e servir `index.html` nas rotas da SPA, ou defina `VITE_API_BASE_URL` com a URL pública da API durante o build e ajuste o CORS no back-end. O proxy do Vite não faz parte dos arquivos estáticos gerados.

## Fluxos integrados

- Login OAuth2 por formulário, JWT em `sessionStorage`, Bearer nos pedidos, saída e expiração por HTTP 401.
- Leitura paginada de associados, moradias, comprovantes e pagamentos; lista, detalhes e indicadores usam dados reais.
- Cadastro de uma moradia e seus associados, com tentativa de compensação em caso de falha.
- Aprovação, reprovação de comprovantes existentes e desativação com data de saída.
- Registro de pagamento ou atraso por morador: atraso desabilita a data; pagamento exige uma data em `dd/mm/aaaa`. A API persiste a situação e a data do último pagamento.
- Erros de conexão/validação visíveis, carregamento e nova tentativa. Não há fallback para dados fictícios.

Consulte [problemas e conflitos de integração](docs/integracao.md) antes de usar o painel operacionalmente. Alguns campos e regras do protótipo não têm suporte na API atual.

## Verificação

```sh
npm run build
npm run test:unit -- --run
npx eslint src e2e vite.config.js vitest.config.js --no-cache
npx oxlint src e2e vite.config.js vitest.config.js
CI=1 npm run test:e2e -- --project=chromium
```

O E2E padrão usa respostas HTTP controladas. Instale o Chromium do Playwright caso ainda não esteja disponível (`npx playwright install chromium`).

O E2E de API real é opcional e **grava dados**. `CCB_LIVE_API=1` o habilita explicitamente; `0` ou a ausência da variável mantém o teste pulado. Use somente uma API com banco descartável, rodando na porta 8000, e um administrador de teste já criado:


Substitua o e-mail e a senha abaixo pelas credenciais de um administrador já existente nesse banco. Os valores do comando são exemplos: o teste agora verifica a configuração antes de abrir o navegador e confirma a resposta do login antes de procurar o menu. Ele não cria o administrador automaticamente.

```sh
npm run build
CCB_LIVE_API=1 CCB_TEST_EMAIL=integracao@example.com CCB_TEST_PASSWORD=sua-senha-de-teste CI=1 npm run test:e2e -- --project=chromium
```

A consulta de CEP usa diretamente o ViaCEP via HTTPS, com preenchimento manual disponível quando a consulta falha. Os testes E2E simulam o ViaCEP para não depender da disponibilidade do serviço externo. A autenticação, o cadastro, as consultas, a aprovação, o pagamento e a desativação usam HTTP real.


O registro simplificado usa `PUT /api/v1/associados/{id}/mensalidade`. Para bancos existentes, aplique a migração aditiva `migrations/20261101_mensalidade.sql` do back-end antes de usar esse fluxo. A situação persistida é `ativo` ou `mensalidade_atrasada`, apenas para o morador selecionado; a última data de pagamento é preservada ao marcar atraso.

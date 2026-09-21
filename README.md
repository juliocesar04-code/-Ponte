# Ponte

Ponte é uma camada de navegação para serviços públicos brasileiros. Em vez de exigir que a pessoa saiba o nome do órgão ou do serviço, o produto começa pela situação real — por exemplo, perder o emprego, regularizar documentos, reduzir despesas essenciais ou iniciar um MEI — e transforma isso em uma rota executável.

Produção: https://ponte-red.vercel.app

## O que existe hoje

- catálogo vivo de serviços públicos carregado do Supabase;
- busca por intenção com ranking no PostgreSQL e fallback local/offline;
- rotas compostas por múltiplos serviços e ações locais;
- contexto por estado e município usando a API de Localidades do IBGE;
- conta opcional com autenticação Supabase;
- sincronização de serviços salvos, progresso e localização entre dispositivos;
- modo local-first: sem conta, o estado continua salvo no navegador;
- cache do catálogo para continuidade quando o backend estiver indisponível;
- RLS em todas as tabelas expostas que armazenam dados de usuário;
- monitor diário de links oficiais via Supabase Edge Function + cron;
- diferenciação entre fonte saudável, redirecionada, acesso protegido e fonte em revisão;
- PWA, service worker e experiência responsiva;
- CI com TypeScript, testes unitários e build de produção;
- deploy automático GitHub -> Vercel.

## Arquitetura

```text
Browser / PWA
  |
  |-- UI Next.js + React
  |-- cache local / localStorage
  |-- fallback de busca local
  |
  +--> Supabase
  |     |-- Auth
  |     |-- PostgreSQL
  |     |-- RLS
  |     |-- RPC ponte_search_services()
  |     |-- Edge Function ponte-source-health
  |     +-- pg_cron / pg_net
  |
  +--> API de Localidades do IBGE
  |
  +--> fontes oficiais GOV.BR e órgãos públicos
```

O catálogo e as jornadas são dados do backend. Adicionar ou corrigir um serviço não exige alterar a interface.

## Estrutura principal

- `app/` — shell Next.js e estilos globais;
- `components/` — experiência principal do produto;
- `data/` — fallback estático para primeira abertura offline;
- `domain/` — regras de ranking e seleção de jornada;
- `lib/ponte-backend.ts` — adaptador do Supabase e IBGE;
- `lib/database.types.ts` — tipos gerados a partir do schema real;
- `public/` — manifest, ícone e service worker;
- `.github/workflows/ci.yml` — pipeline de qualidade.

## Segurança e privacidade

O frontend usa apenas a publishable key do Supabase, que é uma credencial pública por design. Operações privadas são protegidas por Row Level Security.

Dados sincronizados por usuário:

- serviços salvos;
- etapas concluídas;
- estado e município escolhidos.

O Ponte não precisa de CPF para montar um plano. A conta é opcional.

A Edge Function de monitoramento não aceita URLs arbitrárias do cliente: ela verifica somente as fontes cadastradas no banco e mantém a credencial administrativa dentro do ambiente do Supabase.

## Monitoramento das fontes

A função `ponte-source-health` verifica periodicamente os links oficiais e registra histórico. Falhas transitórias de rede não substituem automaticamente um último status válido; uma fonte só é marcada como erro quando há evidência HTTP concreta.

O monitor diferencia:

- `ok` — fonte respondeu normalmente;
- `redirected` — fonte oficial redirecionou;
- `restricted` — o órgão bloqueia automação, como pode ocorrer com proteção anti-bot;
- `error` — resposta HTTP concreta indica problema;
- falha transitória — registrada no histórico sem invalidar o último status conhecido.

## Busca

A busca online usa uma função SQL com:

- normalização de acentos;
- trigram similarity;
- match por título;
- match por palavras-chave;
- tokenização da consulta;
- bônus leve de contexto estadual/municipal sem substituir relevância textual.

Quando o backend não está disponível, um ranking local mantém a busca funcional.

## Desenvolvimento

Requisitos: Node.js 22.

```bash
npm install
npm run dev
```

Validação completa:

```bash
npx tsc --noEmit
npm test
npm run build
```

Variáveis opcionais:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

A configuração pública do projeto de produção possui fallback no cliente, então o deploy atual não depende de secrets do Vercel.

## CI/CD

Cada push para `main` executa:

1. instalação das dependências;
2. typecheck estrito;
3. testes unitários;
4. build de produção.

Com o repositório conectado à Vercel, a mesma branch publica automaticamente a produção.

## Limites do produto

O Ponte organiza informação, contexto e sequência. Ele não concede benefícios, não determina elegibilidade e não substitui a decisão ou o atendimento do órgão responsável.

As regras de programas públicos podem mudar. Por isso, a interface prioriza fontes oficiais e exibe o estado recente de cada fonte.

# ez-infra Frontend

## Descrição do Projeto

ez-infra é uma ferramenta de geração de arquitetura de infraestrutura para aplicações. Guia o usuário por um processo conversacional para entender o projeto, permite vincular repositórios do GitHub para alinhar a infra ao código e gera diagramas de arquitetura e arquivos Terraform para visualização e aplicação.

O frontend oferece:

- **Chat de descoberta com IA** — Interface conversacional para coletar contexto do projeto
- **Acompanhamento de progresso** — Checklist visual das etapas de descoberta
- **Visualização de arquitetura** — Diagramas com trade-offs custo vs. performance
- **Saída Terraform** — Infraestrutura como código gerada para deploy

A aplicação integra com um serviço backend de ingestão para descoberta, geração de arquitetura e produção de arquivos Terraform.

## Membros do Grupo

- Laísa Rio
- Lucas Procopio
- Paulo Boccaletti

## Onde o Projeto Está Hospedado

```
https://vibe-cloud-frontend-production.up.railway.app
```



## Tecnologias Utilizadas

- **Vite** — Build e servidor de desenvolvimento
- **React 18** — Framework de UI
- **TypeScript** — Tipagem estática
- **Tailwind CSS** — Estilização
- **shadcn/ui** — Componentes de UI (Radix)
- **TanStack Query** — Estado do servidor
- **React Router** — Roteamento
- **ReactFlow** — Visualização de diagramas
- **ELK.js** — Layout de grafos
- **Recharts** — Gráficos
- **Zod** — Validação de schemas

## Instruções de Instalação

### Pré-requisitos

- **Node.js 18+** e npm (ou use [nvm](https://github.com/nvm-sh/nvm) para gerenciar versões)

### 1. Clonar o repositório

```sh
git clone https://github.com/laisario/ez-infra-frontend.git
cd ez-infra-frontend
```

### 2. Instalar dependências

```sh
npm install
```

### 3. Configurar variáveis de ambiente

Copie o arquivo de exemplo e configure:

```sh
cp .env.example .env
```

Edite o `.env` conforme necessário (veja [Configuração de Ambiente](#configuração-de-ambiente)).

### 4. Iniciar o servidor de desenvolvimento

```sh
npm run dev
```

A aplicação estará disponível em `http://localhost:8080` (ou na porta exibida no terminal).


## Como Usar

1. **Novo projeto** — Na página inicial, descreva sua ideia (nome e resumo) e envie.
2. **Fase de descoberta** — Use o chat para responder perguntas sobre o projeto.
3. **Vincular repositório** — Cole a URL do repositório GitHub no painel correspondente.
4. **Arquitetura** — Após a descoberta e o vínculo do repo, inicie a análise. Visualize diagramas e escolha entre opções focadas em custo ou performance.
5. **Revisão e Terraform** — Revise a arquitetura e acesse os arquivos Terraform gerados.

## Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run preview` | Preview do build localmente |
| `npm run lint` | ESLint |
| `npm run test` | Testes Vitest |

## Licença

Este projeto está sob a licença **MIT** — veja o arquivo [LICENSE](LICENSE).

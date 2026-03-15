# Discovery UX Implementation Report

## 0. Discovery API Enrichment (Migration Complete)

The frontend has been updated to consume the enriched Discovery API:

- **GET /projects/{id}/context**: Now uses top-level `understanding_summary` and `next_best_step` when available. Context shape is top-level (no wrapper object).
- **GET /projects/{id}/activity**: New endpoint integrated; returns `{ events: [{ type, label, timestamp }] }` for the activity feed.

### Migration changes

- `WhatWeUnderstandPanel`: Prefers `context.understanding_summary.items` from API; falls back to derived data from checklist/readiness.
- `NextBestStepPanel`: Prefers `context.next_best_step` from API; falls back to heuristic from questions/readiness/checklist.
- `RecentActivityPanel`: Prefers `activity` from API; falls back to derived events from checklist/readiness/messages.
- `useDiscoveryChat`: Fetches both context and activity; passes to panels. Project name/summary from `context.project` (top-level).

---

## 1. O que foi implementado no frontend

### Componentes criados ou atualizados

- **WhatWeUnderstandPanel** (novo): Seção "O que já entendemos" que exibe informações confirmadas e inferidas do projeto (objetivo, público-alvo, repositório, stack, etc.). Usa checklist, readiness e context. Estado vazio amigável quando não há dados.

- **NextBestStepPanel** (novo): Card "Próximo passo" que mostra a próxima pergunta em aberto, sugestão de conectar repositório, ou itens críticos pendentes. Usa questions, readiness, checklist e última mensagem do assistente.

- **ReadinessPanel** (melhorado): Redesenhado para focar em "Prontidão para arquitetura" com percentual de cobertura, itens críticos pendentes e estado motivador. Labels mais claros (ex: "Em descoberta", "Quase pronto", "Pronto para arquitetura").

- **ChecklistPanel** (melhorado): Layout mais compacto e escaneável, ícones por status (confirmado, inferido, pendente, conflitante), itens expansíveis com evidência, ordenação por status e prioridade.

- **RecentActivityPanel** (novo): Painel de "Atividade recente" com itens derivados de checklist, readiness e mensagens. Exibe progresso (ex: "Objetivo do produto identificado", "Repositório conectado").

- **PhasePipeline** (novo): Pipeline visual das fases: Descoberta → Arquitetura → Revisão → Terraform, com subtítulos explicativos para cada etapa.

- **DiscoveryChat** (copy atualizado): Header "Assistente de descoberta", subtítulo "Transformando sua ideia em contexto técnico pronto para arquitetura", placeholders e empty states revisados.

- **DiscoveryRightPanel** (reestruturado): Nova ordem dos blocos (PhasePipeline, WhatWeUnderstand, NextBestStep, Readiness, Checklist, RecentActivity) e integração com context e messages.

### Integração com API

- **getContext**: Adicionado fetch de `/projects/{id}/context` após connection.ready. Dados usados em WhatWeUnderstandPanel e para preencher project_name/summary.
- **WebSocket**: Mantido; dados de checklist, readiness, questions e messages vêm do connection.ready e eventos em tempo real.

---

## 2. Campos/endpoints do backend ausentes ou insuficientes

| Área | Status | Notas |
|------|--------|-------|
| **Understanding summary** | Implementado | `context.understanding_summary.items` — frontend usa quando disponível. |
| **Next best step** | Implementado | `context.next_best_step` — frontend usa quando disponível. |
| **Activity feed** | Implementado | `GET /projects/{id}/activity` — frontend usa quando disponível. |
| **Checklist evidence** | O campo `evidence` existe no ChecklistItem; depende do backend preenchê-lo. | Se o backend não envia evidence, os itens ficam sem detalhe expansível. |
| **Context structure** | O endpoint `/context` pode retornar 404 para projetos novos ou estrutura diferente da documentada. | Fallbacks implementados; estrutura documentada (overview, stack, components) pode não existir ainda. |
| **Project name in WS** | O connection.ready não inclui project_name. O frontend busca em getContext. | Projeto novo pode não ter context; project_name fica vazio até o context estar disponível. |
| **Progress percentage** | O readiness.coverage existe; readiness pode não ter evaluated_at ou notes. | Funciona com coverage; outros campos são opcionais. |

---

## 3. Adições no backend que desbloqueariam a experiência ideal

### Já implementado (API Enrichment)

- `context.understanding_summary`, `context.next_best_step`, `GET /projects/{id}/activity` — integrados e em uso.

### Campos sugeridos em contratos existentes

- **ChecklistItem**: Garantir que `evidence` seja preenchido quando houver inferência/confirmação.
- **Readiness**: Garantir `evaluated_at`, `notes` e `blocking_questions` quando aplicável.
- **connection.ready**: Incluir `project: { project_name, summary }` para evitar fetch extra de context.
- **Context**: Garantir estrutura documentada (`context.overview`, `context.stack`, `context.project`) mesmo para projetos em descoberta inicial.

---

## 4. Textos convertidos para pt-BR

| Local | Texto (pt-BR) |
|-------|----------------|
| WhatWeUnderstandPanel | "O que já entendemos", "Informações coletadas sobre seu projeto", "Ainda não temos informações suficientes...", "(inferido)" |
| NextBestStepPanel | "Próxima pergunta", "O que precisamos agora", "Próximo passo recomendado", "Conecte seu repositório GitHub...", "O que falta", "Continue a conversa" |
| ReadinessPanel | "Prontidão para arquitetura", "Em descoberta", "Precisa de esclarecimento", "Quase pronto", "Pronto para arquitetura", "cobertura", "itens críticos pendentes", "Perguntas em aberto" |
| ChecklistPanel | "Progresso da descoberta", "Confirmado", "Inferido", "Pendente", "Conflitante", labels de keys (Objetivo do produto, Público-alvo, etc.) |
| RecentActivityPanel | "Atividade recente", "As atualizações aparecerão aqui..." |
| PhasePipeline | "Pipeline do projeto", "Da ideia à infraestrutura em produção", "Descoberta", "Arquitetura", "Revisão", "Terraform", subtítulos de cada fase |
| DiscoveryChat | "Assistente de descoberta", "Transformando sua ideia em contexto técnico pronto para arquitetura", placeholders e empty states |
| DiscoveryRightPanel | "Descoberta", "Arquitetura", "(em breve)", "Complete a descoberta primeiro" |
| DiscoveryPage (start mode) | "Estamos coletando as informações necessárias para desenhar sua arquitetura de nuvem..." |

---

## 5. Strings que ainda vêm do backend em inglês

- **blocking_questions**: Se o backend enviar perguntas em inglês, elas aparecem como estão.
- **notes** em readiness: Idem.
- **evidence** em checklist: Idem.
- **question.question** em questions: Idem.
- **Mensagens do assistente**: O conteúdo das mensagens de chat vem do backend; se em inglês, permanece em inglês.

Para localização completa, o backend precisaria suportar `Accept-Language` ou um parâmetro de locale e retornar textos em pt-BR quando solicitado.

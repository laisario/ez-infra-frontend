import type { ChecklistItem, Readiness } from "@/lib/api/types";
import { Lightbulb, CheckCircle2, Sparkles } from "lucide-react";

interface WhatWeUnderstandPanelProps {
  checklist: ChecklistItem[];
  readiness: Readiness | null;
  context?: unknown;
  projectName?: string;
  projectSummary?: string;
}

interface UnderstandingItem {
  label: string;
  value: string;
  source: "confirmed" | "inferred";
}

const KEY_TO_LABEL: Record<string, string> = {
  product_goal: "Objetivo do produto",
  target_users: "Público-alvo",
  access_channel: "Canal de acesso",
  application_type: "Tipo de aplicação",
  database: "Banco de dados",
  external_integrations: "Integrações externas",
  file_storage: "Armazenamento de arquivos",
  authentication: "Autenticação",
  repo_url: "Repositório",
};

interface ContextShape {
  understanding_summary?: {
    items: Array<{ key: string; label: string; value: string; source: "confirmed" | "inferred" }>;
  };
  overview?: { project_type?: string; repo_url?: string };
  stack?: { languages?: string[]; frameworks?: string[] };
}

function deriveUnderstanding(
  checklist: ChecklistItem[],
  readiness: Readiness | null,
  context: ContextShape | null | undefined,
  projectName?: string,
  projectSummary?: string
): UnderstandingItem[] {
  if (context?.understanding_summary?.items?.length) {
    const apiItems = context.understanding_summary.items.map((i) => ({
      label: i.label,
      value: i.value,
      source: i.source as "confirmed" | "inferred",
    }));
    const items: UnderstandingItem[] = [];
    if (projectName?.trim()) {
      items.push({ label: "Nome do projeto", value: projectName.trim(), source: "confirmed" });
    }
    if (projectSummary?.trim()) {
      items.push({ label: "Resumo", value: projectSummary.trim(), source: "confirmed" });
    }
    for (const i of apiItems) {
      if (!items.some((x) => x.label === i.label)) items.push(i);
    }
    return items.length > 0 ? items : apiItems;
  }

  const items: UnderstandingItem[] = [];

  if (projectName?.trim()) {
    items.push({
      label: "Nome do projeto",
      value: projectName.trim(),
      source: "confirmed",
    });
  }
  if (projectSummary?.trim()) {
    items.push({
      label: "Resumo",
      value: projectSummary.trim(),
      source: "confirmed",
    });
  }

  if (context?.overview?.project_type) {
    items.push({
      label: "Tipo de aplicação",
      value: context.overview.project_type,
      source: "inferred",
    });
  }
  if (context?.stack?.languages?.length) {
    items.push({
      label: "Linguagens",
      value: context.stack.languages.join(", "),
      source: "inferred",
    });
  }
  if (context?.stack?.frameworks?.length) {
    items.push({
      label: "Frameworks",
      value: context.stack.frameworks.join(", "),
      source: "inferred",
    });
  }

  const confirmedKeys = new Set(readiness?.confirmed_items ?? []);
  const inferredKeys = new Set(readiness?.inferred_items ?? []);

  for (const item of checklist) {
    if (item.status !== "confirmed" && item.status !== "inferred") continue;
    if (item.key === "repo_url" || item.key === "repository") continue;
    const label = KEY_TO_LABEL[item.key] ?? item.label ?? item.key;
    const value = item.evidence ?? (item.status === "confirmed" ? "Confirmado" : "Inferido");
    if (items.some((i) => i.label === label)) continue;
    items.push({
      label,
      value,
      source: item.status === "confirmed" ? "confirmed" : "inferred",
    });
  }

  for (const key of confirmedKeys) {
    if (key === "repo_url" || key === "repository") continue;
    if (items.some((i) => KEY_TO_LABEL[key] === i.label || key === i.label)) continue;
    items.push({
      label: KEY_TO_LABEL[key] ?? key,
      value: "Confirmado",
      source: "confirmed",
    });
  }
  for (const key of inferredKeys) {
    if (key === "repo_url" || key === "repository") continue;
    if (items.some((i) => KEY_TO_LABEL[key] === i.label || key === i.label)) continue;
    items.push({
      label: KEY_TO_LABEL[key] ?? key,
      value: "Inferido",
      source: "inferred",
    });
  }

  return items;
}

const WhatWeUnderstandPanel = ({
  checklist,
  readiness,
  context,
  projectName,
  projectSummary,
}: WhatWeUnderstandPanelProps) => {
  const items = deriveUnderstanding(
    checklist,
    readiness,
    context,
    projectName,
    projectSummary
  );

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-muted-foreground/30 bg-card/50 p-5">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">
            O que já entendemos
          </h3>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Ainda não temos informações suficientes. Converse com o assistente e
          compartilhe o que seu projeto faz — vamos preencher esta seção conforme
          avançamos.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">
          O que já entendemos
        </h3>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Informações coletadas sobre seu projeto
      </p>
      <ul className="mt-4 space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <CheckCircle2
              className={`mt-0.5 h-4 w-4 shrink-0 ${
                item.source === "confirmed"
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            />
            <div className="min-w-0 flex-1">
              <span className="font-medium text-foreground">{item.label}:</span>{" "}
              <span className="text-muted-foreground">{item.value}</span>
              {item.source === "inferred" && (
                <span className="ml-1 text-[10px] text-muted-foreground">
                  (inferido)
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default WhatWeUnderstandPanel;

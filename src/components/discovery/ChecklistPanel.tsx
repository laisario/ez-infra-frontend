import { useState } from "react";
import type { ChecklistItem as ChecklistItemType } from "@/lib/api/types";
import { Check, Minus, AlertTriangle, Circle, ChevronDown } from "lucide-react";

interface ChecklistPanelProps {
  checklist: ChecklistItemType[];
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

const statusConfig: Record<
  string,
  { icon: React.ElementType; label: string; className: string }
> = {
  confirmed: {
    icon: Check,
    label: "Confirmado",
    className: "text-primary bg-primary/10",
  },
  inferred: {
    icon: Minus,
    label: "Inferido",
    className: "text-amber-600 dark:text-amber-500 bg-amber-500/10",
  },
  missing: {
    icon: Circle,
    label: "Pendente",
    className: "text-muted-foreground bg-muted",
  },
  conflicting: {
    icon: AlertTriangle,
    label: "Conflitante",
    className: "text-destructive bg-destructive/10",
  },
};

const priorityOrder = { high: 0, medium: 1, low: 2 };

function sortChecklist(items: ChecklistItemType[]): ChecklistItemType[] {
  return [...items].sort((a, b) => {
    const statusOrder = { confirmed: 0, inferred: 1, missing: 2, conflicting: 3 };
    const aStatus = statusOrder[a.status] ?? 4;
    const bStatus = statusOrder[b.status] ?? 4;
    if (aStatus !== bStatus) return aStatus - bStatus;
    const aPri = priorityOrder[a.priority ?? "low"] ?? 2;
    const bPri = priorityOrder[b.priority ?? "low"] ?? 2;
    return aPri - bPri;
  });
}

const ChecklistPanel = ({ checklist }: ChecklistPanelProps) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!checklist || checklist.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-muted-foreground/30 bg-card/50 p-4">
        <h4 className="text-sm font-semibold text-foreground">
          Progresso da descoberta
        </h4>
        <p className="mt-2 text-sm text-muted-foreground">
          O checklist será preenchido conforme a conversa avança.
        </p>
      </div>
    );
  }

  const sorted = sortChecklist(checklist);
  const confirmedCount = checklist.filter((c) => c.status === "confirmed").length;
  const total = checklist.length;

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <div className="border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-foreground">
            Progresso da descoberta
          </h4>
          <span className="text-xs text-muted-foreground">
            {confirmedCount}/{total} concluídos
          </span>
        </div>
      </div>
      <div className="max-h-[240px] overflow-y-auto">
        <ul className="divide-y divide-border">
          {sorted.map((item) => {
            const config = statusConfig[item.status] ?? statusConfig.missing;
            const Icon = config.icon;
            const label =
              KEY_TO_LABEL[item.key] ?? item.label ?? item.key;
            const isExpanded = expandedId === item.id;
            const hasEvidence = !!item.evidence?.trim();

            return (
              <li
                key={item.id}
                className={`group flex flex-col gap-0 ${
                  item.status === "confirmed"
                    ? "bg-primary/5"
                    : item.status === "inferred"
                      ? "bg-amber-500/5"
                      : ""
                }`}
              >
                <div
                  className={`flex items-center gap-3 px-4 py-2.5 ${
                    hasEvidence ? "cursor-pointer" : ""
                  }`}
                  onClick={() =>
                    hasEvidence &&
                    setExpandedId(isExpanded ? null : item.id)
                  }
                >
                  <div
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${config.className}`}
                  >
                    <Icon className="h-3 w-3" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {label}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {config.label}
                      {item.priority && (
                        <span className="ml-1">
                          • {item.priority === "high" ? "Alta" : item.priority === "medium" ? "Média" : "Baixa"}
                        </span>
                      )}
                    </p>
                  </div>
                  {hasEvidence && (
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  )}
                </div>
                {isExpanded && hasEvidence && (
                  <div className="border-t border-border/50 bg-muted/30 px-4 py-2">
                    <p className="text-xs text-muted-foreground">
                      {item.evidence}
                    </p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default ChecklistPanel;

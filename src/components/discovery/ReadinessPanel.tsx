import type { Readiness } from "@/lib/api/types";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Loader2,
} from "lucide-react";

interface ReadinessPanelProps {
  readiness: Readiness | null;
}

const statusConfig: Record<
  string,
  {
    label: string;
    subtitle: string;
    variant: "default" | "secondary" | "outline" | "destructive";
    icon: React.ElementType;
  }
> = {
  not_ready: {
    label: "Em descoberta",
    subtitle: "Coletando informações para a arquitetura",
    variant: "secondary",
    icon: Loader2,
  },
  needs_clarification: {
    label: "Precisa de esclarecimento",
    subtitle: "Algumas perguntas para avançar",
    variant: "outline",
    icon: HelpCircle,
  },
  maybe_ready: {
    label: "Quase pronto",
    subtitle: "Faltam poucos detalhes",
    variant: "secondary",
    icon: HelpCircle,
  },
  ready_for_architecture: {
    label: "Pronto para arquitetura",
    subtitle: "Podemos desenhar sua infraestrutura",
    variant: "default",
    icon: CheckCircle2,
  },
};

const ReadinessPanel = ({ readiness }: ReadinessPanelProps) => {
  if (!readiness) {
    return (
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <p className="text-sm">Carregando prontidão...</p>
        </div>
      </div>
    );
  }

  const config = statusConfig[readiness.status] ?? statusConfig.not_ready;
  const Icon = config.icon;
  const coverage = readiness.coverage ?? 0;
  const percent = Math.round(coverage * 100);
  const missingCount = readiness.missing_critical_items?.length ?? 0;

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-lg ${
              readiness.status === "ready_for_architecture"
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <Icon
              className={`h-4 w-4 ${
                readiness.status === "ready_for_architecture" ? "" : ""
              }`}
            />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Prontidão para arquitetura
            </h3>
            <p className="text-xs text-muted-foreground">{config.subtitle}</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-lg font-bold text-foreground">{percent}%</span>
          <p className="text-[10px] text-muted-foreground">cobertura</p>
        </div>
      </div>

      <div className="mt-4">
        <Progress value={percent} className="h-2" />
      </div>

      {missingCount > 0 && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            {missingCount === 1
              ? "1 item crítico pendente"
              : `${missingCount} itens críticos pendentes`}
            {readiness.missing_critical_items?.length
              ? `: ${readiness.missing_critical_items.slice(0, 3).join(", ")}${(readiness.missing_critical_items?.length ?? 0) > 3 ? "…" : ""}`
              : ""}
          </p>
        </div>
      )}

      {readiness.status === "ready_for_architecture" && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <p className="text-xs font-medium text-primary">
            Pronto para a próxima fase
          </p>
        </div>
      )}

      {readiness.blocking_questions && readiness.blocking_questions.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium text-muted-foreground">
            Perguntas em aberto
          </p>
          <ul className="mt-1 space-y-0.5 text-xs text-foreground">
            {readiness.blocking_questions.slice(0, 2).map((q, i) => (
              <li key={i} className="flex items-start gap-1">
                <span className="text-muted-foreground">•</span>
                {q}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ReadinessPanel;

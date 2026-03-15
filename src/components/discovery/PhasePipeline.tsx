import type { DiscoveryState } from "@/lib/api/types";
import { Check, MessageSquare, LayoutGrid, Eye, Code2 } from "lucide-react";

interface PhasePipelineProps {
  currentState: DiscoveryState | null;
  isReadyForArchitecture?: boolean;
}

const PHASES = [
  {
    key: "discovery",
    label: "Descoberta",
    subtitle: "Transformando sua ideia em contexto técnico",
    icon: MessageSquare,
  },
  {
    key: "architecture",
    label: "Arquitetura",
    subtitle: "Comparando arquiteturas de nuvem viáveis",
    icon: LayoutGrid,
  },
  {
    key: "review",
    label: "Revisão",
    subtitle: "Validando decisões e identificando riscos",
    icon: Eye,
  },
  {
    key: "terraform",
    label: "Terraform",
    subtitle: "Gerando código de infraestrutura deployável",
    icon: Code2,
  },
] as const;

const discoveryStates: DiscoveryState[] = [
  "idle",
  "collecting_initial_context",
  "ingesting_sources",
  "clarifying_core_requirements",
  "merging_context",
  "needs_user_confirmation",
  "ready_for_architecture",
];

const PhasePipeline = ({
  currentState,
  isReadyForArchitecture = false,
}: PhasePipelineProps) => {
  const discoveryComplete = discoveryStates.includes(
    currentState ?? "idle"
  )
    ? currentState === "ready_for_architecture"
    : false;

  const currentPhaseIndex = discoveryComplete ? 1 : 0;

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <h4 className="text-sm font-semibold text-foreground">
        Pipeline do projeto
      </h4>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Da ideia à infraestrutura em produção
      </p>
      <div className="mt-4 flex flex-col gap-3">
        {PHASES.map((phase, i) => {
          const isActive = i === currentPhaseIndex;
          const isPast = i < currentPhaseIndex;
          const Icon = phase.icon;

          return (
            <div
              key={phase.key}
              className={`flex items-start gap-3 rounded-lg px-3 py-2 ${
                isActive ? "bg-primary/10" : "bg-transparent"
              }`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  isPast
                    ? "bg-primary text-primary-foreground"
                    : isActive
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {isPast ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm font-medium ${
                    isActive ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {phase.label}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {phase.subtitle}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PhasePipeline;

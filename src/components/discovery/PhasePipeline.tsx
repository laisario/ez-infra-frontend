import { useEffect } from "react";
import type { DiscoveryState, Readiness } from "@/lib/api/types";
import { Check, MessageSquare, LayoutGrid, Eye, Code2 } from "lucide-react";

export const PHASE_KEYS = ["discovery", "architecture", "review", "terraform"] as const;
export type PhaseKey = (typeof PHASE_KEYS)[number];

export function isPhaseReady(
  phaseKey: PhaseKey,
  readiness: Readiness | null,
  currentState: DiscoveryState | null,
  isReadyForArchitecture?: boolean
): boolean {
  switch (phaseKey) {
    case "discovery":
      return true;
    case "architecture":
      return isReadyForArchitecture ?? false;
    case "review":
    case "terraform":
      return currentState === "architecture_ready";
    default:
      return false;
  }
}

interface PhasePipelineProps {
  currentState: DiscoveryState | null;
  readiness?: Readiness | null;
  isReadyForArchitecture?: boolean;
  selectedPhase?: PhaseKey;
  onPhaseSelect?: (key: PhaseKey) => void;
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
  readiness = null,
  isReadyForArchitecture = false,
  selectedPhase = "discovery",
  onPhaseSelect,
}: PhasePipelineProps) => {
  const discoveryComplete = discoveryStates.includes(
    currentState ?? "idle"
  )
    ? currentState === "ready_for_architecture"
    : false;

  const currentPhaseIndex = discoveryComplete ? 1 : 0;
  const selectedIndex = PHASES.findIndex((p) => p.key === selectedPhase);
  const activeIndex = selectedIndex >= 0 ? selectedIndex : 0;
  const isActive = (i: number) => i === activeIndex;
  const isPast = (i: number) => i < currentPhaseIndex;

  const phaseReady = (key: PhaseKey) =>
    isPhaseReady(key, readiness, currentState, isReadyForArchitecture);

  useEffect(() => {
    if (
      selectedPhase === "architecture" &&
      !isReadyForArchitecture &&
      onPhaseSelect
    ) {
      const fallback =
        PHASES.find((p) =>
          isPhaseReady(p.key as PhaseKey, readiness, currentState, isReadyForArchitecture)
        )?.key ?? "discovery";
      onPhaseSelect(fallback);
    }
  }, [selectedPhase, isReadyForArchitecture, onPhaseSelect, readiness, currentState]);

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
          const active = isActive(i);
          const past = isPast(i);
          const ready = phaseReady(phase.key);
          const Icon = phase.icon;
          const isClickable = !!onPhaseSelect && ready;

          return (
            <div
              key={phase.key}
              role={isClickable ? "button" : undefined}
              tabIndex={isClickable ? 0 : undefined}
              onClick={
                isClickable ? () => onPhaseSelect(phase.key) : undefined
              }
              onKeyDown={
                isClickable
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onPhaseSelect(phase.key);
                      }
                    }
                  : undefined
              }
              aria-disabled={!phaseReady(phase.key)}
              className={`flex items-start gap-3 rounded-lg px-3 py-2 ${
                active ? "bg-primary/10" : "bg-transparent"
              } ${
                ready && onPhaseSelect
                  ? "cursor-pointer hover:bg-muted/50"
                  : !phaseReady(phase.key)
                    ? "cursor-not-allowed opacity-60"
                    : ""
              }`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  past
                    ? "bg-primary text-primary-foreground"
                    : active
                      ? "bg-primary/20 text-primary"
                      : ready
                        ? "bg-muted text-muted-foreground"
                        : "bg-muted/50 text-muted-foreground/60"
                }`}
              >
                {past ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm font-medium ${
                    active ? "text-foreground" : "text-muted-foreground"
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

import type { DiscoveryState, Readiness } from "@/lib/api/types";
import { Check, MessageSquare, LayoutGrid, Eye, Code2 } from "lucide-react";
import { isPhaseReady, type PhaseKey } from "./PhasePipeline";

const STAGES = [
  { key: "discovery" as PhaseKey, label: "Descoberta", icon: MessageSquare },
  { key: "architecture" as PhaseKey, label: "Arquitetura", icon: LayoutGrid },
  { key: "review" as PhaseKey, label: "Revisão", icon: Eye },
  { key: "terraform" as PhaseKey, label: "Terraform", icon: Code2 },
] as const;

interface DiscoveryPipelineStepperProps {
  selectedPhase: PhaseKey;
  currentState: DiscoveryState | null;
  readiness: Readiness | null;
  isReadyForArchitecture: boolean;
  onPhaseSelect?: (key: PhaseKey) => void;
}

export default function DiscoveryPipelineStepper({
  selectedPhase,
  currentState,
  readiness,
  isReadyForArchitecture,
  onPhaseSelect,
}: DiscoveryPipelineStepperProps) {
  const selectedIndex = STAGES.findIndex((s) => s.key === selectedPhase);
  const activeIndex = selectedIndex >= 0 ? selectedIndex : 0;

  return (
    <nav
      className="flex items-center gap-1"
      aria-label="Pipeline do projeto"
    >
      {STAGES.map((stage, i) => {
        const isCurrent = i === activeIndex;
        const isPast = i < activeIndex;
        const ready = isPhaseReady(
          stage.key,
          readiness,
          currentState,
          isReadyForArchitecture
        );
        const isUpcoming = !isCurrent && !isPast && ready;
        const isDisabled = !ready && !isPast;
        const Icon = stage.icon;
        const isClickable = !!onPhaseSelect && ready;

        return (
          <div key={stage.key} className="flex items-center">
            <button
              type="button"
              onClick={isClickable ? () => onPhaseSelect(stage.key) : undefined}
              disabled={!isClickable}
              aria-current={isCurrent ? "step" : undefined}
              aria-disabled={isDisabled}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                isClickable
                  ? "cursor-pointer hover:bg-muted/50"
                  : isDisabled
                    ? "cursor-not-allowed opacity-60"
                    : ""
              } ${
                isCurrent
                  ? "bg-primary/10 font-medium text-foreground"
                  : isPast
                    ? "text-foreground"
                    : "text-muted-foreground"
              }`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
                  isPast
                    ? "bg-primary text-primary-foreground"
                    : isCurrent
                      ? "bg-primary/20 text-primary"
                      : isDisabled
                        ? "bg-muted/50 text-muted-foreground/60"
                        : "bg-muted text-muted-foreground"
                }`}
              >
                {isPast ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Icon className="h-3.5 w-3.5" />
                )}
              </span>
              <span className="hidden sm:inline">{stage.label}</span>
            </button>
            {i < STAGES.length - 1 && (
              <div
                className={`mx-1 h-px w-4 sm:w-6 ${
                  isPast ? "bg-primary/50" : "bg-border"
                }`}
                aria-hidden
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}

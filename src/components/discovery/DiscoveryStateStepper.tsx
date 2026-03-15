import type { DiscoveryState } from "@/lib/api/types";
import { Check } from "lucide-react";

interface DiscoveryStateStepperProps {
  state: DiscoveryState | null;
}

const STEPS: { key: DiscoveryState; label: string }[] = [
  { key: "idle", label: "Início" },
  { key: "collecting_initial_context", label: "Coletando" },
  { key: "clarifying_core_requirements", label: "Esclarecendo" },
  { key: "ready_for_architecture", label: "Pronto" },
];

const DiscoveryStateStepper = ({ state }: DiscoveryStateStepperProps) => {
  if (!state) return null;

  const currentIndex = STEPS.findIndex((s) => s.key === state);
  const activeIndex = currentIndex >= 0 ? currentIndex : 0;

  return (
    <div className="rounded-lg border bg-card p-4">
      <h4 className="mb-3 text-sm font-medium text-foreground">
        Progresso da descoberta
      </h4>
      <div className="flex items-center gap-1">
        {STEPS.map((step, i) => {
          const isCompleted = i < activeIndex;
          const isActive = i === activeIndex;

          return (
            <div key={step.key} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs ${
                    isCompleted
                      ? "border-primary bg-primary text-primary-foreground"
                      : isActive
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted bg-muted text-muted-foreground"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <span>{i + 1}</span>
                  )}
                </div>
                <span
                  className={`mt-1 text-[10px] ${
                    isActive ? "font-medium text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`mx-1 h-0.5 flex-1 ${
                    isCompleted ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DiscoveryStateStepper;

import { useState, useEffect } from "react";
import type {
  DiscoverySession,
  ChecklistItem,
  Readiness,
  Question,
  DiscoveryChatMessage,
} from "@/lib/api/types";
import type { ContextResponse } from "@/lib/api/discoveryClient";
import ReadinessPanel from "./ReadinessPanel";
import ChecklistPanel from "./ChecklistPanel";
import WhatWeUnderstandPanel from "./WhatWeUnderstandPanel";
import NextBestStepPanel from "./NextBestStepPanel";
import RecentActivityPanel from "./RecentActivityPanel";
import PhasePipeline from "./PhasePipeline";
import DiagramsPanel from "./DiagramsPanel";
import TerraformPanel from "./TerraformPanel";
import { isPhaseReady, type PhaseKey } from "./PhasePipeline";
import { Button } from "@/components/ui/button";

interface DiscoveryRightPanelProps {
  projectId: string;
  session: DiscoverySession | null;
  checklist: ChecklistItem[];
  readiness: Readiness | null;
  questions?: Question[];
  messages?: DiscoveryChatMessage[];
  context?: ContextResponse | null;
  activity?: Array<{ type: string; label: string; timestamp: string }>;
  projectName?: string;
  projectSummary?: string;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

function getProjectFromContext(context: ContextResponse | null | undefined): {
  projectName?: string;
  projectSummary?: string;
} {
  const proj = context?.project;
  return {
    projectName: proj?.project_name,
    projectSummary: proj?.summary,
  };
}

function getLastAssistantMessage(messages: DiscoveryChatMessage[]): string | undefined {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "assistant") return messages[i].content;
  }
  return undefined;
}

const DiscoveryRightPanel = ({
  projectId,
  session,
  checklist,
  readiness,
  questions = [],
  messages = [],
  context,
  activity = [],
  projectName: propProjectName,
  projectSummary: propProjectSummary,
  isLoading,
  error,
  onRetry,
}: DiscoveryRightPanelProps) => {
  const [selectedPhase, setSelectedPhase] = useState<PhaseKey>("discovery");

  const isReadyForArchitecture =
    readiness?.status === "ready_for_architecture";

  const currentState = session?.state ?? null;
  const firstReadyPhase: PhaseKey = (() => {
    const keys: PhaseKey[] = ["discovery", "architecture", "review", "terraform"];
    return keys.find((k) => isPhaseReady(k, readiness, currentState)) ?? "discovery";
  })();

  useEffect(() => {
    if (!isPhaseReady(selectedPhase, readiness, currentState)) {
      setSelectedPhase(firstReadyPhase);
    }
  }, [selectedPhase, readiness, currentState, firstReadyPhase]);

  const { projectName: ctxProjectName, projectSummary: ctxProjectSummary } =
    getProjectFromContext(context);
  const projectName = propProjectName ?? ctxProjectName;
  const projectSummary = propProjectSummary ?? ctxProjectSummary;
  const lastAssistantMessage = getLastAssistantMessage(messages);

  return (
    <div className="flex h-full flex-col bg-surface-sunken">
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-5">
          <PhasePipeline
            currentState={currentState}
            readiness={readiness}
            isReadyForArchitecture={isReadyForArchitecture}
            selectedPhase={selectedPhase}
            onPhaseSelect={setSelectedPhase}
          />

          <div className="mt-5">
            {selectedPhase === "discovery" && (
              <>
                {error ? (
                  <div className="flex flex-col items-center gap-3 rounded-xl border bg-card p-6 text-center">
                    <p className="text-sm text-destructive">{error}</p>
                    <Button variant="outline" size="sm" onClick={onRetry}>
                      Tentar novamente
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <WhatWeUnderstandPanel
                      checklist={checklist}
                      readiness={readiness}
                      context={context}
                      projectName={projectName}
                      projectSummary={projectSummary}
                    />

                    <NextBestStepPanel
                      questions={questions}
                      readiness={readiness}
                      checklist={checklist}
                      lastAssistantMessage={lastAssistantMessage}
                      nextBestStep={context?.next_best_step}
                    />

                    <ReadinessPanel readiness={readiness} />
                    <ChecklistPanel checklist={checklist} />

                    <RecentActivityPanel
                      checklist={checklist}
                      readiness={readiness}
                      messages={messages}
                      activityEvents={activity}
                    />
                  </div>
                )}
              </>
            )}

            {selectedPhase === "review" && (
              <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-muted-foreground/30 bg-card/50 p-8 text-center">
              <p className="text-sm font-medium text-foreground">
                Em breve
              </p>
              <p className="max-w-[260px] text-xs text-muted-foreground">
                Esta fase estará disponível em uma próxima atualização.
              </p>
            </div>
            )}

            {selectedPhase === "architecture" && (
              <div className="min-h-[200px]">
                <DiagramsPanel projectId={projectId} />
              </div>
            )}

            {selectedPhase === "terraform" && (
              <div className="min-h-[200px]">
                <TerraformPanel projectId={projectId} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscoveryRightPanel;

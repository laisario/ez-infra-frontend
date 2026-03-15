import type {
  DiscoverySession,
  ChecklistItem,
  Readiness,
  Question,
  DiscoveryChatMessage,
} from "@/lib/api/types";
import type { ContextResponse } from "@/lib/api/discoveryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReadinessPanel from "./ReadinessPanel";
import ChecklistPanel from "./ChecklistPanel";
import WhatWeUnderstandPanel from "./WhatWeUnderstandPanel";
import NextBestStepPanel from "./NextBestStepPanel";
import RecentActivityPanel from "./RecentActivityPanel";
import PhasePipeline from "./PhasePipeline";
import PreviewPanel from "@/components/PreviewPanel";
import { Button } from "@/components/ui/button";
import { LayoutGrid, ListChecks } from "lucide-react";

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
  const isReadyForArchitecture =
    readiness?.status === "ready_for_architecture";

  const { projectName: ctxProjectName, projectSummary: ctxProjectSummary } =
    getProjectFromContext(context);
  const projectName = propProjectName ?? ctxProjectName;
  const projectSummary = propProjectSummary ?? ctxProjectSummary;
  const lastAssistantMessage = getLastAssistantMessage(messages);

  return (
    <div className="flex h-full flex-col bg-surface-sunken">
      <Tabs defaultValue="discovery" className="flex h-full flex-col">
        <div className="border-b bg-card px-5 py-4">
          <TabsList className="w-full">
            <TabsTrigger value="discovery" className="flex-1 gap-2">
              <ListChecks className="h-4 w-4" />
              Descoberta
            </TabsTrigger>
            <TabsTrigger
              value="architecture"
              disabled={!isReadyForArchitecture}
              className="flex-1 gap-2"
            >
              <LayoutGrid className="h-4 w-4" />
              Arquitetura
              {!isReadyForArchitecture && (
                <span className="text-[10px] text-muted-foreground">
                  (em breve)
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          <TabsContent
            value="discovery"
            className="mt-0 flex-1 overflow-y-auto p-5 data-[state=inactive]:hidden"
          >
            {error ? (
              <div className="flex flex-col items-center gap-3 rounded-xl border bg-card p-6 text-center">
                <p className="text-sm text-destructive">{error}</p>
                <Button variant="outline" size="sm" onClick={onRetry}>
                  Tentar novamente
                </Button>
              </div>
            ) : (
              <div className="space-y-5">
                <PhasePipeline
                  currentState={session?.state ?? null}
                  isReadyForArchitecture={isReadyForArchitecture}
                />

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
          </TabsContent>

          <TabsContent
            value="architecture"
            className="mt-0 flex-1 overflow-hidden p-0 data-[state=inactive]:hidden"
          >
            {isReadyForArchitecture ? (
              <div className="h-full">
                <PreviewPanel
                  conversationId={projectId}
                  refreshKey={1}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 rounded-xl border bg-card p-8 text-center m-5">
                <LayoutGrid className="h-12 w-12 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">
                  Complete a descoberta primeiro
                </p>
                <p className="max-w-[260px] text-xs text-muted-foreground">
                  Quando o projeto estiver pronto para arquitetura, você poderá
                  ver e gerar a infraestrutura aqui.
                </p>
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default DiscoveryRightPanel;

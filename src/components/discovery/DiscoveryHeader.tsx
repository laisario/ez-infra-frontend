import type { DiscoverySession, Readiness } from "@/lib/api/types";
import type { ContextResponse } from "@/lib/api/discoveryClient";
import type { ChecklistItem } from "@/lib/api/types";
import DiscoveryPipelineStepper from "./DiscoveryPipelineStepper";
import type { PhaseKey } from "./PhasePipeline";
import { Button } from "@/components/ui/button";
import { Github, Loader2 } from "lucide-react";

const GITHUB_URL_PATTERN =
  /^https?:\/\/(www\.)?github\.com\/([\w.-]+)\/([\w.-]+)(\/)?$/i;

function parseRepoSlug(url: string): string | null {
  const match = url.trim().match(GITHUB_URL_PATTERN);
  if (!match) return null;
  return `${match[2]}/${match[3]}`;
}

interface DiscoveryHeaderProps {
  selectedPhase: PhaseKey;
  session: DiscoverySession | null;
  checklist: ChecklistItem[];
  context: ContextResponse | null;
  readiness: Readiness | null;
  isReadyForArchitecture: boolean;
  onPhaseSelect: (key: PhaseKey) => void;
  onStartArchitecture?: () => Promise<void>;
  isSkippingToArchitecture?: boolean;
}

export default function DiscoveryHeader({
  selectedPhase,
  session,
  checklist,
  context,
  readiness,
  isReadyForArchitecture,
  onPhaseSelect,
  onStartArchitecture,
  isSkippingToArchitecture = false,
}: DiscoveryHeaderProps) {
  const currentState = session?.state ?? null;

  const repoUrl =
    context?.repo_url?.trim() ||
    checklist.find(
      (c) =>
        (c.key === "repo_url" || c.key === "repository") &&
        c.status === "confirmed"
    )?.evidence?.trim() ||
    null;

  const hasRepo = !!repoUrl?.trim();
  const repoSlug = hasRepo ? parseRepoSlug(repoUrl!) : null;
  const hasArchitectureResult = currentState === "architecture_ready";

  const showPularButton =
    selectedPhase === "discovery" &&
    hasRepo &&
    isReadyForArchitecture &&
    !hasArchitectureResult &&
    onStartArchitecture;

  return (
    <header className="flex flex-col gap-3 border-b bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <DiscoveryPipelineStepper
        selectedPhase={selectedPhase}
        currentState={currentState}
        readiness={readiness}
        isReadyForArchitecture={isReadyForArchitecture}
        onPhaseSelect={onPhaseSelect}
      />

      <div className="flex items-center gap-3">
        <div
          className="flex items-center gap-2 text-xs text-muted-foreground"
          title={repoUrl ?? undefined}
        >
          <Github className="h-4 w-4 shrink-0" />
          {hasRepo && repoSlug ? (
            <a
              href={repoUrl ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate hover:text-foreground hover:underline"
            >
              {repoSlug}
            </a>
          ) : (
            <span>GitHub não conectado</span>
          )}
        </div>

        {showPularButton && (
          <Button
            size="sm"
            variant="outline"
            onClick={onStartArchitecture}
            disabled={isSkippingToArchitecture}
          >
            {isSkippingToArchitecture ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Iniciando...
              </>
            ) : (
              "Pular para arquitetura"
            )}
          </Button>
        )}
      </div>
    </header>
  );
}

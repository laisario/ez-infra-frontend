import { useState, useEffect, useCallback } from "react";
import {
  getArchitectureResult,
  toArchitectureUIData,
  type ArchitectureResult,
  type ArchitectureUIData,
} from "@/lib/api/discoveryClient";
import ArchitectureAnalysisPanel from "./ArchitectureAnalysisPanel";
import ArchitectureDiagram from "./ArchitectureDiagram";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LayoutGrid, Loader2, PiggyBank, Zap } from "lucide-react";

const POLL_INTERVAL_MS = 5000;

type VibeMode = "economy" | "performance";

function hasValidResult(data: ArchitectureResult | null): boolean {
  return !!(
    data &&
    (data.vibeEconomica?.recursos?.length || data.vibePerformance?.recursos?.length)
  );
}

interface DiagramsPanelProps {
  projectId: string;
  canStartArchitecture?: boolean;
  architectureStatus?: "not_started" | "in_progress" | "ready";
  onStartArchitecture?: () => Promise<void>;
}

const DiagramsPanel = ({
  projectId,
  canStartArchitecture = false,
  architectureStatus = "not_started",
  onStartArchitecture,
}: DiagramsPanelProps) => {
  const [result, setResult] = useState<ArchitectureResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [vibeMode, setVibeMode] = useState<VibeMode | null>(null);

  const fetchResult = useCallback(() => {
    if (!projectId) return Promise.resolve(null);
    return getArchitectureResult(projectId);
  }, [projectId]);

  useEffect(() => {
    if (!projectId) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetchResult()
      .then((data) => {
        if (cancelled) return;
        if (hasValidResult(data)) {
          setResult(data);
          setIsLoading(false);
          return;
        }
        if (data === null && canStartArchitecture && onStartArchitecture) {
          onStartArchitecture()
            .then(() => fetchResult())
            .then((retryData) => {
              if (!cancelled && hasValidResult(retryData)) setResult(retryData);
            })
            .catch(() => {
              if (!cancelled) {
                setError(
                  "Não foi possível carregar a arquitetura. Tente novamente."
                );
              }
            })
            .finally(() => {
              if (!cancelled) setIsLoading(false);
            });
        } else {
          setResult(data);
          setIsLoading(false);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(
            e?.message ??
              "Não foi possível carregar a arquitetura. Tente novamente."
          );
          setResult(null);
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [projectId, canStartArchitecture, onStartArchitecture, fetchResult]);

  useEffect(() => {
    if (
      !projectId ||
      architectureStatus !== "in_progress" ||
      hasValidResult(result)
    )
      return;

    const interval = setInterval(() => {
      fetchResult().then((data) => {
        if (hasValidResult(data)) setResult(data);
      });
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [projectId, architectureStatus, result, fetchResult]);

  const handleStartArchitecture = async () => {
    if (!onStartArchitecture || isStarting) return;
    setIsStarting(true);
    try {
      await onStartArchitecture();
    } finally {
      setIsStarting(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    fetchResult()
      .then(setResult)
      .catch((e) =>
        setError(
          e?.message ??
            "Não foi possível carregar a arquitetura. Tente novamente."
        )
      )
      .finally(() => setIsLoading(false));
  };

  const isArchitectureInProgress =
    architectureStatus === "in_progress" && !result;

  if (isArchitectureInProgress) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">
          Arquitetura em andamento
        </h3>
        <p className="max-w-[260px] text-xs text-muted-foreground">
          Aguardando retorno do agente de arquitetura
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Carregando arquitetura...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" size="sm" onClick={handleRetry}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (
    (!result ||
      (!result.vibeEconomica?.recursos?.length &&
        !result.vibePerformance?.recursos?.length)) &&
    canStartArchitecture
  ) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
          <LayoutGrid className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">
          Iniciar arquitetura
        </h3>
        <p className="max-w-[260px] text-xs text-muted-foreground">
          Clique no botão abaixo para iniciar a análise de arquitetura do seu
          projeto.
        </p>
        <Button onClick={handleStartArchitecture} disabled={isStarting}>
          {isStarting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Iniciando...
            </>
          ) : (
            "Começar arquitetura"
          )}
        </Button>
      </div>
    );
  }

  if (
    !result ||
    (!result.vibeEconomica?.recursos?.length &&
      !result.vibePerformance?.recursos?.length)
  ) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
          <LayoutGrid className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">
          Nenhuma arquitetura ainda
        </h3>
        <p className="max-w-[260px] text-xs text-muted-foreground">
          Complete a descoberta e inicie a arquitetura para ver as opções.
        </p>
      </div>
    );
  }

  const uiData: ArchitectureUIData | null = toArchitectureUIData(result);

  if (!uiData) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
          <LayoutGrid className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">
          Nenhuma arquitetura ainda
        </h3>
        <p className="max-w-[260px] text-xs text-muted-foreground">
          Complete a descoberta e inicie a arquitetura para ver as opções.
        </p>
      </div>
    );
  }

  const economyHasData = uiData.economy.nodes.length > 0;
  const performanceHasData = uiData.performance.nodes.length > 0;

  const defaultVibe: VibeMode = economyHasData ? "economy" : "performance";
  const effectiveVibe = vibeMode ?? defaultVibe;

  const activeData =
    effectiveVibe === "economy" ? uiData.economy : uiData.performance;

  return (
    <div className="grid h-full min-h-0 grid-cols-1 gap-4 p-4 lg:grid-cols-[1fr_minmax(240px,28%)] lg:gap-6">
      <div className="min-h-[360px] min-w-0 lg:min-h-0">
        <ArchitectureDiagram
          nodes={activeData.nodes}
          edges={activeData.edges}
          fillContainer
        />
      </div>

      <div className="flex min-w-0 flex-col gap-4 overflow-y-auto lg:max-h-full">
        <ArchitectureAnalysisPanel analysis={uiData.analysis} />

        <Tabs
          value={effectiveVibe}
          onValueChange={(v) => setVibeMode(v as VibeMode)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger
              value="economy"
              disabled={!economyHasData}
              className="flex items-center gap-2"
            >
              <PiggyBank className="h-4 w-4" />
              Arquitetura econômica
            </TabsTrigger>
            <TabsTrigger
              value="performance"
              disabled={!performanceHasData}
              className="flex items-center gap-2"
            >
              <Zap className="h-4 w-4" />
              Arquitetura performance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="economy" className="mt-4">
            {economyHasData && (
              <ArchitectureVibeCard
                data={uiData.economy}
                title="Arquitetura econômica"
                icon={PiggyBank}
              />
            )}
          </TabsContent>
          <TabsContent value="performance" className="mt-4">
            {performanceHasData && (
              <ArchitectureVibeCard
                data={uiData.performance}
                title="Arquitetura performance"
                icon={Zap}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

interface ArchitectureVibeCardProps {
  data: ArchitectureUIData["economy"];
  title: string;
  icon: React.ElementType;
}

function ArchitectureVibeCard({
  data,
  title,
  icon: Icon,
}: ArchitectureVibeCardProps) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-foreground">{title}</h4>
          {data.description && (
            <p className="mt-1 text-xs text-muted-foreground">{data.description}</p>
          )}
          {data.estimatedCost && (
            <p className="mt-1 text-[11px] font-medium text-foreground">
              Custo estimado: {data.estimatedCost}
            </p>
          )}
          {data.nodes.length > 0 && (
            <p className="mt-2 text-[11px] text-muted-foreground">
              Recursos principais: {data.nodes.map((n) => n.serviceName).join(", ")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default DiagramsPanel;

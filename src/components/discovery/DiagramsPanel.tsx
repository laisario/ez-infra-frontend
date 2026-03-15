import { useState, useEffect, useCallback } from "react";
import {
  getArchitectureResult,
  type ArchitectureResult,
} from "@/lib/api/discoveryClient";
import ArchitectureVibeGraph from "./ArchitectureVibeGraph";
import { Button } from "@/components/ui/button";
import { LayoutGrid, Loader2, PiggyBank, Zap } from "lucide-react";

const POLL_INTERVAL_MS = 5000;

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

  if ((!result || (!result.vibeEconomica?.recursos?.length && !result.vibePerformance?.recursos?.length)) && canStartArchitecture) {
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
        <Button
          onClick={handleStartArchitecture}
          disabled={isStarting}
        >
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

  if (!result || (!result.vibeEconomica?.recursos?.length && !result.vibePerformance?.recursos?.length)) {
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

  return (
    <div className="flex flex-1 flex-col overflow-y-auto p-5">
      <div className="space-y-6">
        {result.analiseEntrada && (
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <h4 className="text-sm font-semibold text-foreground">
              Análise de entrada
            </h4>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              {result.analiseEntrada}
            </p>
          </div>
        )}

        {result.vibeEconomica?.recursos?.length ? (
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <PiggyBank className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground">
                  Arquitetura econômica
                </h4>
                {result.vibeEconomica.descricao && (
                  <p className="text-[11px] text-muted-foreground">
                    {result.vibeEconomica.descricao}
                  </p>
                )}
                {result.vibeEconomica.custo_estimado && (
                  <p className="mt-0.5 text-[11px] font-medium text-foreground">
                    Custo estimado: {result.vibeEconomica.custo_estimado}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-4">
              <ArchitectureVibeGraph recursos={result.vibeEconomica.recursos} />
            </div>
          </div>
        ) : null}

        {result.vibePerformance?.recursos?.length ? (
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Zap className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground">
                  Arquitetura performance
                </h4>
                {result.vibePerformance.descricao && (
                  <p className="text-[11px] text-muted-foreground">
                    {result.vibePerformance.descricao}
                  </p>
                )}
                {result.vibePerformance.custo_estimado && (
                  <p className="mt-0.5 text-[11px] font-medium text-foreground">
                    Custo estimado: {result.vibePerformance.custo_estimado}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-4">
              <ArchitectureVibeGraph recursos={result.vibePerformance.recursos} />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default DiagramsPanel;

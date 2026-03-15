import { useState, useEffect, useCallback } from "react";
import { getDiagrams, type Diagram } from "@/lib/api/discoveryClient";
import { Button } from "@/components/ui/button";
import { LayoutGrid, Loader2 } from "lucide-react";

const POLL_INTERVAL_MS = 5000;

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
  const [diagrams, setDiagrams] = useState<Diagram[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  const fetchDiagrams = useCallback(() => {
    if (!projectId) return Promise.resolve([]);
    return getDiagrams(projectId).then((res) => res.diagrams ?? []);
  }, [projectId]);

  useEffect(() => {
    if (!projectId) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetchDiagrams()
      .then((d) => {
        if (!cancelled) setDiagrams(d);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(
            e?.message ?? "Não foi possível carregar os diagramas. Tente novamente."
          );
          setDiagrams([]);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [projectId, fetchDiagrams]);

  const isArchitectureInProgress =
    architectureStatus === "in_progress" && diagrams.length === 0;

  useEffect(() => {
    if (!projectId || !isArchitectureInProgress) return;

    const interval = setInterval(() => {
      fetchDiagrams()
        .then((d) => {
          if (d.length > 0) {
            setDiagrams(d);
            setError(null);
          }
        })
        .catch(() => {
          // Ignore poll errors; keep waiting
        });
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [projectId, isArchitectureInProgress, fetchDiagrams]);

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
    fetchDiagrams()
      .then((d) => {
        setDiagrams(d);
      })
      .catch((e) =>
        setError(
          e?.message ?? "Não foi possível carregar os diagramas. Tente novamente."
        )
      )
      .finally(() => setIsLoading(false));
  };

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
        <p className="text-sm text-muted-foreground">Carregando diagramas...</p>
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

  if ((!diagrams || diagrams.length === 0) && canStartArchitecture) {
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

  if (!diagrams || diagrams.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
          <LayoutGrid className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">
          Nenhum diagrama ainda
        </h3>
        <p className="max-w-[260px] text-xs text-muted-foreground">
          Complete a descoberta e a revisão para gerar os diagramas de
          arquitetura.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto p-5">
      <div className="space-y-4">
        {diagrams.map((d, i) => (
          <div
            key={d.id ?? i}
            className="rounded-xl border bg-card p-4 shadow-sm"
          >
            <h4 className="text-sm font-medium text-foreground">
              {d.name ?? d.type ?? `Diagrama ${i + 1}`}
            </h4>
            {d.content && (
              <pre className="mt-2 max-h-48 overflow-auto rounded bg-muted p-3 text-xs text-muted-foreground">
                {d.content}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DiagramsPanel;

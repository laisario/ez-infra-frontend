import { useState, useEffect } from "react";
import { getDiagrams, type Diagram } from "@/lib/api/discoveryClient";
import { Button } from "@/components/ui/button";
import { LayoutGrid, Loader2 } from "lucide-react";

interface DiagramsPanelProps {
  projectId: string;
}

const DiagramsPanel = ({ projectId }: DiagramsPanelProps) => {
  const [diagrams, setDiagrams] = useState<Diagram[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  console.log(diagrams)
  useEffect(() => {
    if (!projectId) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    getDiagrams(projectId)
      .then((res) => {
        if (!cancelled) {
          setDiagrams(res.diagrams ?? []);
        }
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
  }, [projectId]);

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    getDiagrams(projectId)
      .then((res) => setDiagrams(res.diagrams ?? []))
      .catch((e) =>
        setError(
          e?.message ?? "Não foi possível carregar os diagramas. Tente novamente."
        )
      )
      .finally(() => setIsLoading(false));
  };

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

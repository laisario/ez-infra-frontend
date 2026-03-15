import { useState, useEffect } from "react";
import {
  ApiError,
  getArchitectureResult,
  getRevisionDecision,
  putRevisionDecision,
  type ArchitectureResult,
  type RevisionOption,
  type VibeOption,
} from "@/lib/api/discoveryClient";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, Eye, Loader2, PiggyBank, Zap } from "lucide-react";

interface ReviewPanelProps {
  projectId: string;
}

function ArchitectureResultSummary({ text }: { text: string }) {
  if (!text) return null;
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <h4 className="text-sm font-semibold text-foreground">
        Análise de entrada
      </h4>
      <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
        {text}
      </p>
    </div>
  );
}

function ArchitectureOptionResources({ recursos }: { recursos: VibeOption["recursos"] }) {
  if (!recursos?.length) return null;
  const names = recursos.map((r) => r.servico || "serviço").filter(Boolean);
  return (
    <div className="mt-2">
      <p className="text-[11px] font-medium text-muted-foreground">
        Recursos ({recursos.length})
      </p>
      <ul className="mt-1 flex flex-wrap gap-1.5">
        {names.map((name, i) => (
          <li
            key={i}
            className="rounded bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
          >
            {name}
          </li>
        ))}
      </ul>
    </div>
  );
}

interface ArchitectureOptionCardProps {
  optionKey: RevisionOption;
  title: string;
  option: VibeOption;
  selected: boolean;
  onSelect: () => void;
}

function ArchitectureOptionCard({
  optionKey,
  title,
  option,
  selected,
  onSelect,
}: ArchitectureOptionCardProps) {
  const Icon = optionKey === "vibe_economica" ? PiggyBank : Zap;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full flex-col items-start rounded-xl border p-4 text-left shadow-sm transition-colors ${
        selected
          ? "border-primary bg-primary/5 ring-2 ring-primary/30"
          : "border-border bg-card hover:bg-muted/30"
      }`}
    >
      <div className="flex w-full items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
              selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
          </div>
          <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        </div>
        {selected && (
          <Check className="h-5 w-5 shrink-0 text-primary" />
        )}
      </div>
      {option.descricao && (
        <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
          {option.descricao}
        </p>
      )}
      {option.custo_estimado && (
        <p className="mt-1 text-[11px] font-medium text-foreground">
          Custo estimado: {option.custo_estimado}
        </p>
      )}
      <ArchitectureOptionResources recursos={option.recursos} />
    </button>
  );
}

function getSubmitErrorMessage(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.status === 404) return "Projeto não encontrado.";
    if (e.status === 400)
      return "Gere a arquitetura antes de escolher uma opção.";
    if (e.status === 422)
      return "Valor inválido. Use uma das opções disponíveis.";
  }
  return (
    (e instanceof Error ? e.message : null) ??
    "Não foi possível enviar a decisão. Tente novamente."
  );
}

const ReviewPanel = ({ projectId }: ReviewPanelProps) => {
  const [result, setResult] = useState<ArchitectureResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<RevisionOption | null>(null);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    getArchitectureResult(projectId)
      .then((data) => {
        if (!cancelled) setResult(data);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(
            e?.message ??
              "Não foi possível carregar o resultado da arquitetura. Tente novamente."
          );
          setResult(null);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  useEffect(() => {
    if (!projectId || !result) return;

    let cancelled = false;
    getRevisionDecision(projectId)
      .then((res) => {
        if (!cancelled && res.decision) {
          setSelectedOption(res.decision);
        }
      })
      .catch(() => {
        // Ignore; no pre-selection
      });

    return () => {
      cancelled = true;
    };
  }, [projectId, result]);

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    getArchitectureResult(projectId)
      .then(setResult)
      .catch((e) =>
        setError(
          e?.message ??
            "Não foi possível carregar o resultado da arquitetura. Tente novamente."
        )
      )
      .finally(() => setIsLoading(false));
  };

  const handleConfirm = async () => {
    if (!selectedOption || !projectId) return;
    setSubmitStatus("loading");
    setSubmitError(null);
    try {
      await putRevisionDecision(projectId, selectedOption);
      setSubmitStatus("success");
    } catch (e) {
      setSubmitStatus("error");
      setSubmitError(getSubmitErrorMessage(e));
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4">
        <Skeleton className="h-20 w-full rounded-xl" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
        <Skeleton className="h-10 w-40" />
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

  if (!result) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
          <Eye className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">
          Nenhum resultado de arquitetura
        </h3>
        <p className="max-w-[260px] text-xs text-muted-foreground">
          Complete a fase de arquitetura para ver as opções de revisão.
        </p>
      </div>
    );
  }

  if (submitStatus === "success") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          <Check className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">
          Decisão confirmada
        </h3>
        <p className="max-w-[260px] text-xs text-muted-foreground">
          Sua escolha foi registrada com sucesso.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <ArchitectureResultSummary text={result.analiseEntrada} />

      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-foreground">
          Escolha a arquitetura
        </h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <ArchitectureOptionCard
            optionKey="vibe_economica"
            title="Vibe econômica"
            option={result.vibeEconomica}
            selected={selectedOption === "vibe_economica"}
            onSelect={() => setSelectedOption("vibe_economica")}
          />
          <ArchitectureOptionCard
            optionKey="vibe_performance"
            title="Vibe performance"
            option={result.vibePerformance}
            selected={selectedOption === "vibe_performance"}
            onSelect={() => setSelectedOption("vibe_performance")}
          />
        </div>
      </div>

      {submitError && (
        <p className="text-sm text-destructive">{submitError}</p>
      )}

      <Button
        variant="default"
        size="default"
        disabled={!selectedOption || submitStatus === "loading"}
        onClick={handleConfirm}
      >
        {submitStatus === "loading" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Enviando...
          </>
        ) : (
          "Confirmar decisão"
        )}
      </Button>
    </div>
  );
};

export default ReviewPanel;

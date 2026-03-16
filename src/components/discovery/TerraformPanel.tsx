import { useState, useEffect } from "react";
import { getTerraformFiles, type TerraformFile } from "@/lib/api/discoveryClient";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Code2, FileCode, Loader2 } from "lucide-react";

interface TerraformPanelProps {
  projectId: string;
}

function TerraformFileCard({ file }: { file: TerraformFile }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <h4 className="flex items-center gap-2 text-sm font-medium text-foreground">
        <FileCode className="h-4 w-4 text-muted-foreground" />
        {file.name}
      </h4>
      <pre className="mt-2 max-h-48 overflow-auto rounded bg-muted p-3 text-xs font-mono text-muted-foreground whitespace-pre-wrap break-words">
        {file.content}
      </pre>
    </div>
  );
}

function TerraformSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <Skeleton className="h-4 w-24" />
      <div className="mt-3 space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-[80%]" />
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-3 w-5/6" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}

/**
 * Mock handler for applying Terraform.
 * Replace with real POST /projects/:projectId/terraform/apply when available.
 */
async function mockApplyTerraform(_projectId: string): Promise<void> {
  await new Promise((r) => setTimeout(r, 1500));
}

const POLL_INTERVAL_MS = 4000;

const TerraformPanel = ({ projectId }: TerraformPanelProps) => {
  const [files, setFiles] = useState<TerraformFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    if (!projectId) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setIsGenerating(false);

    getTerraformFiles(projectId)
      .then((data) => {
        if (cancelled) return;
        setFiles(data);
        if (data.length > 0) {
          setIsLoading(false);
        } else {
          setIsLoading(false);
          setIsGenerating(true);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(
            e?.message ?? "Não foi possível carregar os arquivos Terraform. Tente novamente."
          );
          setFiles([]);
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  useEffect(() => {
    if (!projectId || !isGenerating) return;

    const id = setInterval(async () => {
      try {
        const data = await getTerraformFiles(projectId);
        setFiles(data);
        if (data.length > 0) {
          setIsGenerating(false);
        }
      } catch (e) {
        setError(
          e?.message ?? "Não foi possível carregar os arquivos Terraform. Tente novamente."
        );
        setIsGenerating(false);
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(id);
  }, [projectId, isGenerating]);

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    setIsGenerating(false);
    getTerraformFiles(projectId)
      .then((data) => {
        setFiles(data);
        if (data.length === 0) setIsGenerating(true);
      })
      .catch((e) =>
        setError(
          e?.message ?? "Não foi possível carregar os arquivos Terraform. Tente novamente."
        )
      )
      .finally(() => setIsLoading(false));
  };

  const handleApply = async () => {
    if (files.length === 0 || isLoading) return;
    setIsApplying(true);
    try {
      await mockApplyTerraform(projectId);
    } finally {
      setIsApplying(false);
    }
  };

  const hasFiles = files.length > 0;
  const canApply = hasFiles && !isLoading && !isApplying;

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4">
        <div className="space-y-4">
          <TerraformSkeleton />
          <TerraformSkeleton />
        </div>
        <Button variant="default" size="default" disabled>
          Aplicar Terraform
        </Button>
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

  if (isGenerating) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">
          Gerando Terraform...
        </h3>
        <p className="max-w-[260px] text-xs text-muted-foreground">
          Os arquivos de infraestrutura estão sendo gerados. Isso pode levar
          alguns segundos.
        </p>
        <Button variant="default" size="default" disabled>
          Aplicar Terraform
        </Button>
      </div>
    );
  }

  if (!hasFiles) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
          <Code2 className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">
          Nenhum arquivo Terraform ainda
        </h3>
        <p className="max-w-[260px] text-xs text-muted-foreground">
          Complete a descoberta e a arquitetura para gerar os arquivos de
          infraestrutura.
        </p>
        <Button variant="default" size="default" disabled>
          Aplicar Terraform
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="space-y-4">
        {files.map((file, i) => (
          <TerraformFileCard key={file.name ?? i} file={file} />
        ))}
      </div>
      <Button
        variant="default"
        size="default"
        disabled={!canApply}
        onClick={handleApply}
      >
        {isApplying ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Aplicando...
          </>
        ) : (
          "Aplicar Terraform"
        )}
      </Button>
    </div>
  );
};

export default TerraformPanel;

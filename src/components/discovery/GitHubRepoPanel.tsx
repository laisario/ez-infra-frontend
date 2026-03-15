import { useState } from "react";
import { Link2, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const GITHUB_URL_PATTERN =
  /^https?:\/\/(www\.)?github\.com\/[\w.-]+\/[\w.-]+(\/)?$/i;

function isValidGitHubUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  return GITHUB_URL_PATTERN.test(trimmed);
}

interface GitHubRepoPanelProps {
  projectId: string;
  repoUrl: string | null;
  onRepoLinked?: () => void;
  isLoading?: boolean;
  isLinking?: boolean;
  linkError?: string | null;
  onLinkRepo: (url: string) => Promise<void>;
  onSkipToArchitecture?: () => Promise<void>;
  isSkippingToArchitecture?: boolean;
}

const GitHubRepoPanel = ({
  projectId,
  repoUrl,
  onRepoLinked,
  isLoading = false,
  isLinking = false,
  linkError = null,
  onLinkRepo,
  onSkipToArchitecture,
  isSkippingToArchitecture = false,
}: GitHubRepoPanelProps) => {
  const [inputUrl, setInputUrl] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const hasRepo = !!repoUrl?.trim();
  const displayError = linkError ?? localError;

  const handleLink = async () => {
    const url = inputUrl.trim();
    setLocalError(null);

    if (!url) {
      setLocalError("Informe a URL do repositório.");
      return;
    }
    if (!isValidGitHubUrl(url)) {
      setLocalError("Informe uma URL válida do GitHub (ex: https://github.com/owner/repo).");
      return;
    }

    try {
      await onLinkRepo(url);
      setInputUrl("");
      onRepoLinked?.();
    } catch {
      // Parent sets linkError; keep localError for validation only
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <p className="text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Link2 className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">
          Repositório no GitHub
        </h3>
      </div>

      {hasRepo ? (
        <>
          <p className="mt-2 text-xs text-muted-foreground">
            Repositório vinculado
          </p>
          <p className="mt-1 break-all text-sm font-medium text-foreground">
            {repoUrl}
          </p>
          {onSkipToArchitecture && (
            <Button
              size="sm"
              variant="outline"
              className="mt-3"
              onClick={onSkipToArchitecture}
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
        </>
      ) : (
        <>
          <p className="mt-2 text-xs text-muted-foreground">
            Cole a URL do repositório para que possamos analisar o código.
          </p>
          <div className="mt-3 flex flex-col gap-2">
            <Input
              type="url"
              placeholder="Cole a URL do repositório"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLink()}
              disabled={isLinking}
              className="h-9"
            />
            <Button
              size="sm"
              onClick={handleLink}
              disabled={isLinking || !inputUrl.trim()}
            >
              {isLinking ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Vinculando...
                </>
              ) : (
                "Vincular repositório"
              )}
            </Button>
            {displayError && (
              <p className="text-xs text-destructive">{displayError}</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default GitHubRepoPanel;

import type { Question, Readiness, ChecklistItem } from "@/lib/api/types";
import { ArrowRight, HelpCircle, Link2, MessageCircle, Eye } from "lucide-react";

interface NextBestStep {
  title: string;
  description: string;
  type?: "repo" | "question" | "clarification" | "review";
}

interface NextBestStepPanelProps {
  questions: Question[];
  readiness: Readiness | null;
  checklist: ChecklistItem[];
  lastAssistantMessage?: string;
  nextBestStep?: NextBestStep | null;
}

function hasRepo(checklist: ChecklistItem[], readiness: Readiness | null): boolean {
  const repoItem = checklist.find(
    (c) =>
      c.key === "repo_url" ||
      c.key === "repository" ||
      c.key?.toLowerCase().includes("repo")
  );
  if (repoItem?.status === "confirmed") return true;
  const missing = readiness?.missing_critical_items ?? [];
  const hasRepoMissing = missing.some(
    (m) =>
      m.toLowerCase().includes("repo") || m.toLowerCase().includes("repositório")
  );
  return !hasRepoMissing && (readiness?.ingestion_complete ?? false);
}

const typeToIcon: Record<string, React.ElementType> = {
  repo: Link2,
  question: HelpCircle,
  clarification: MessageCircle,
  review: Eye,
};

function getNextBestStep(
  questions: Question[],
  readiness: Readiness | null,
  checklist: ChecklistItem[],
  lastAssistantMessage?: string
): { title: string; description: string; icon: React.ElementType } | null {
  const openQuestion = questions.find((q) => q.status === "open");
  if (openQuestion?.question) {
    return {
      title: "Próxima pergunta",
      description: openQuestion.question,
      icon: HelpCircle,
    };
  }

  const blocking = readiness?.blocking_questions?.[0];
  if (blocking) {
    return {
      title: "O que precisamos agora",
      description: blocking,
      icon: MessageCircle,
    };
  }

  const repoConnected = hasRepo(checklist, readiness);
  if (!repoConnected) {
    const repoItem = checklist.find(
      (c) =>
        c.key === "repo_url" ||
        c.key?.toLowerCase().includes("repo") ||
        c.key === "repository"
    );
    if (repoItem?.status === "missing" || !repoItem) {
      return {
        title: "Próximo passo recomendado",
        description:
          "Conecte seu repositório GitHub para que possamos analisar o código e entender melhor sua stack.",
        icon: Link2,
      };
    }
  }

  const missing = readiness?.missing_critical_items ?? [];
  if (missing.length > 0) {
    const labels: Record<string, string> = {
      database: "tipo de banco de dados",
      application_type: "tipo de aplicação",
      access_channel: "canal de acesso dos usuários",
      product_goal: "objetivo do produto",
      target_users: "público-alvo",
    };
    const first = missing[0];
    const label = labels[first] ?? first;
    return {
      title: "O que falta",
      description: `Precisamos entender: ${label}.`,
      icon: HelpCircle,
    };
  }

  if (lastAssistantMessage?.trim()) {
    const truncated =
      lastAssistantMessage.length > 120
        ? lastAssistantMessage.slice(0, 117) + "..."
        : lastAssistantMessage;
    return {
      title: "Continue a conversa",
      description: truncated,
      icon: MessageCircle,
    };
  }

  if (readiness?.status === "not_ready" || readiness?.status === "needs_clarification") {
    return {
      title: "Próximo passo",
      description:
        "Descreva seu projeto ou responda às perguntas do assistente para avançarmos.",
      icon: ArrowRight,
    };
  }

  return null;
}

const NextBestStepPanel = ({
  questions,
  readiness,
  checklist,
  lastAssistantMessage,
  nextBestStep,
}: NextBestStepPanelProps) => {
  const stepFromApi =
    nextBestStep?.title && nextBestStep?.description
      ? {
          title: nextBestStep.title,
          description: nextBestStep.description,
          icon: typeToIcon[nextBestStep.type ?? ""] ?? ArrowRight,
        }
      : null;

  const step =
    stepFromApi ??
    getNextBestStep(
      questions,
      readiness,
      checklist,
      lastAssistantMessage
    );

  if (!step) {
    return (
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center gap-2">
          <ArrowRight className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            Próximo passo
          </h3>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Continue conversando para descobrirmos o que falta. O assistente vai
          guiá-lo.
        </p>
      </div>
    );
  }

  const Icon = step.icon;

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">{step.title}</h3>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
    </div>
  );
};

export default NextBestStepPanel;

import type {
  ChecklistItem,
  Readiness,
  DiscoveryChatMessage,
} from "@/lib/api/types";
import type { ActivityEvent } from "@/lib/api/discoveryClient";
import { Activity, CheckCircle2, Link2, MessageSquare } from "lucide-react";

export interface ActivityItem {
  id: string;
  type: string;
  label: string;
  timestamp?: string;
}

const KEY_TO_LABEL: Record<string, string> = {
  product_goal: "Objetivo do produto identificado",
  target_users: "Público-alvo inferido",
  access_channel: "Canal de acesso identificado",
  application_type: "Tipo de aplicação inferido",
  database: "Banco de dados confirmado",
  external_integrations: "Integrações externas identificadas",
  repo_url: "Repositório conectado",
  repository: "Repositório conectado",
};

function deriveActivities(
  checklist: ChecklistItem[],
  readiness: Readiness | null,
  messages: DiscoveryChatMessage[],
  prevChecklistRef: { current: ChecklistItem[] }
): ActivityItem[] {
  const items: ActivityItem[] = [];
  const seen = new Set<string>();

  const add = (id: string, type: ActivityItem["type"], label: string, ts?: string) => {
    if (seen.has(id)) return;
    seen.add(id);
    items.push({ id, type, label, timestamp: ts });
  };

  for (const c of checklist) {
    if (c.status === "confirmed") {
      const label =
        KEY_TO_LABEL[c.key] ??
        `${c.label || c.key} confirmado`;
      add(`confirmed-${c.id}`, "checklist_confirmed", label, c.updated_at);
    } else if (c.status === "inferred") {
      const label =
        KEY_TO_LABEL[c.key] ??
        `${c.label || c.key} inferido`;
      add(`inferred-${c.id}`, "checklist_inferred", label, c.updated_at);
    }
    if (
      (c.key === "repo_url" || c.key?.toLowerCase().includes("repo")) &&
      c.status === "confirmed"
    ) {
      add(`repo-${c.id}`, "repo_connected", "Análise do repositório concluída", c.updated_at);
    }
  }

  if (readiness?.status === "ready_for_architecture") {
    add(
      "readiness-ready",
      "readiness_updated",
      "Projeto pronto para arquitetura",
      readiness.evaluated_at
    );
  }

  const lastAssistant = [...messages]
    .reverse()
    .find((m) => m.role === "assistant");
  if (lastAssistant?.content) {
    const preview =
      lastAssistant.content.length > 60
        ? lastAssistant.content.slice(0, 57) + "..."
        : lastAssistant.content;
    add(
      `msg-${lastAssistant.id}`,
      "message",
      preview,
      lastAssistant.created_at
    );
  }

  items.sort((a, b) => {
    const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return tb - ta;
  });

  return items;
}

interface RecentActivityPanelProps {
  checklist: ChecklistItem[];
  readiness: Readiness | null;
  messages: DiscoveryChatMessage[];
  activityEvents?: ActivityEvent[];
}

const RecentActivityPanel = ({
  checklist,
  readiness,
  messages,
  activityEvents,
}: RecentActivityPanelProps) => {
  const fromApi =
    activityEvents && activityEvents.length > 0
      ? activityEvents.map((e, i) => ({
          id: `api-${i}-${e.timestamp}`,
          type: e.type,
          label: e.label,
          timestamp: e.timestamp,
        }))
      : [];

  const derived = deriveActivities(
    checklist,
    readiness,
    messages,
    { current: [] }
  );

  const activities = (fromApi && fromApi.length > 0 ? fromApi : derived).slice(0, 5);

  if (activities.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-muted-foreground/30 bg-card/50 p-4">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-semibold text-foreground">
            Atividade recente
          </h4>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          As atualizações aparecerão aqui conforme a descoberta avança.
        </p>
      </div>
    );
  }

  const iconMap: Record<string, React.ElementType> = {
    checklist_confirmed: CheckCircle2,
    checklist_inferred: CheckCircle2,
    repo_connected: Link2,
    readiness_updated: CheckCircle2,
    message: MessageSquare,
    question_open: MessageSquare,
    repo_ingest: Link2,
  };

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Activity className="h-4 w-4 text-primary" />
        <h4 className="text-sm font-semibold text-foreground">
          Atividade recente
        </h4>
      </div>
      <ul className="mt-3 space-y-2">
        {activities.map((a) => {
          const Icon = iconMap[a.type] ?? CheckCircle2;
          return (
            <li
              key={a.id}
              className="flex items-start gap-2 text-sm text-muted-foreground"
            >
              <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/70" />
              <span className="line-clamp-2">{a.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default RecentActivityPanel;

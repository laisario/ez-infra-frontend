import { useParams, useNavigate, useLocation } from "react-router-dom";
import DiscoveryChat from "@/components/discovery/DiscoveryChat";
import DiscoveryRightPanel from "@/components/discovery/DiscoveryRightPanel";
import { useDiscoveryChat } from "@/hooks/useDiscoveryChat";
import { useDiscoveryStart } from "@/hooks/useDiscoveryStart";
import TopBar from "@/components/TopBar";
import { useEffect } from "react";

function parseFirstMessage(text: string): { projectName: string; summary?: string } {
  const trimmed = text.trim();
  const dashMatch = trimmed.match(/^(.+?)\s+[-–—]\s+(.+)$/s);
  if (dashMatch) {
    return { projectName: dashMatch[1].trim(), summary: dashMatch[2].trim() || undefined };
  }
  const newlineIdx = trimmed.indexOf("\n");
  if (newlineIdx > 0) {
    return {
      projectName: trimmed.slice(0, newlineIdx).trim(),
      summary: trimmed.slice(newlineIdx + 1).trim() || undefined,
    };
  }
  return { projectName: trimmed };
}

const DiscoveryPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const pendingMessage = (location.state as { pendingMessage?: string })?.pendingMessage;
  const isStartMode = !projectId;
  const discovery = useDiscoveryChat(projectId, {
    pendingMessage,
    onPendingMessageConsumed: () => {
      navigate(location.pathname, { replace: true, state: {} });
    },
  });
  const start = useDiscoveryStart();

  useEffect(() => {
    if (projectId && discovery.error?.toLowerCase().includes("not found")) {
      navigate("/", { replace: true });
    }
  }, [projectId, discovery.error, navigate]);

  if (isStartMode) {
    const handleFirstMessage = async (text: string) => {
      const { projectName, summary } = parseFirstMessage(text);
      const id = await start.createProjectOnly(projectName, summary);
      if (id) navigate(`/projects/${id}/discovery`, { state: { pendingMessage: text.trim() } });
    };

    return (
      <div className="flex h-screen flex-col">
        <TopBar />
        <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
          <div className="flex h-1/2 flex-col border-b lg:h-full lg:w-[45%] lg:border-b-0 lg:border-r">
            <DiscoveryChat
              projectId=""
              projectName={undefined}
              messages={[]}
              sendMessage={handleFirstMessage}
              isLoading={false}
              isSending={start.isSending}
              error={start.error}
              onRetry={() => start.clearError()}
              isStartMode
            />
          </div>
          <div className="flex flex-1 items-center justify-center bg-surface-sunken p-8">
            <div className="max-w-sm text-center text-sm text-muted-foreground">
              <p>
                Estamos coletando as informações necessárias para desenhar sua
                arquitetura de nuvem. Descreva sua ideia, cole a URL do
                repositório e nós guiamos o resto.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <TopBar />
      <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
        <div className="flex h-1/2 flex-col border-b lg:h-full lg:w-[45%] lg:border-b-0 lg:border-r">
          <DiscoveryChat
            projectId={projectId!}
            projectName={discovery.project?.project_name}
            messages={discovery.messages}
            streamingMessage={discovery.streamingMessage}
            sendMessage={discovery.sendMessage}
            isLoading={discovery.isLoading}
            isSending={discovery.isSending}
            error={discovery.error}
            onRetry={discovery.refresh}
            isReconnecting={discovery.isReconnecting}
          />
        </div>
        <div className="flex-1 overflow-hidden">
          <DiscoveryRightPanel
            projectId={projectId!}
            session={discovery.session}
            checklist={discovery.checklist}
            readiness={discovery.readiness}
            questions={discovery.questions}
            messages={discovery.messages}
            context={discovery.context}
            activity={discovery.activity}
            projectName={discovery.project?.project_name}
            projectSummary={discovery.project?.summary}
            isLoading={discovery.isLoading}
            error={discovery.error}
            onRetry={discovery.refresh}
          />
        </div>
      </div>
    </div>
  );
};

export default DiscoveryPage;

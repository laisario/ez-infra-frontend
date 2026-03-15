import type { DiscoveryChatMessage } from "@/lib/api/types";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import EmptyState from "@/components/EmptyState";
import LoadingDots from "@/components/LoadingDots";
import { Button } from "@/components/ui/button";
import { Bot, Loader2 } from "lucide-react";

interface DiscoveryChatProps {
  projectId: string;
  projectName?: string;
  messages: DiscoveryChatMessage[];
  streamingMessage?: { runId: string; content: string } | null;
  sendMessage: (text: string) => Promise<void>;
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  onRetry: () => void;
  isStartMode?: boolean;
  isReconnecting?: boolean;
}

const DiscoveryChat = ({
  projectId,
  projectName,
  messages,
  streamingMessage,
  sendMessage,
  isLoading,
  isSending,
  error,
  onRetry,
  isStartMode = false,
  isReconnecting = false,
}: DiscoveryChatProps) => {
  const isEmpty = messages.length === 0;

  const handleSend = async (text: string) => {
    try {
      await sendMessage(text);
    } catch {
      // Error handled in hook, toast shown by parent
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-5 py-4">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">
            Assistente de descoberta
            {projectName && (
              <span className="ml-1 font-normal text-muted-foreground">
                — {projectName}
              </span>
            )}
          </h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {isStartMode
            ? "Descreva sua ideia, cole a URL do repositório GitHub e nós guiamos o resto."
            : "Transformando sua ideia em contexto técnico pronto para arquitetura."}
        </p>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center px-5">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {isReconnecting ? "Reconectando..." : "Carregando conversa..."}
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-5 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={onRetry}>
              Tentar novamente
            </Button>
          </div>
        ) : (
          <>
            {isEmpty ? (
              <div className="flex flex-1 items-center justify-center px-5">
                <EmptyState
                  title={isStartMode ? "Comece sua descoberta" : "Converse com o assistente"}
                  description={
                    isStartMode
                      ? "Digite o nome do projeto e uma descrição opcional. Ex: Meu App - Uma ferramenta para pequenos negócios"
                      : "Descreva seu projeto, cole a URL do repositório ou responda às perguntas. O painel à direita mostra o que já entendemos."
                  }
                />
              </div>
            ) : (
              <MessageList messages={messages} streamingMessage={streamingMessage} />
            )}

            <div className="border-t px-5 py-4">
              <MessageInput
                onSend={handleSend}
                disabled={isSending}
                placeholder={
                  isStartMode
                    ? "Ex: Meu App - Uma ferramenta para pequenos negócios"
                    : "Descreva seu projeto ou cole a URL do repositório GitHub"
                }
              />
              {isSending && (
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Assistente está pensando...</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DiscoveryChat;

import { useRef, useEffect } from "react";
import type { DiscoveryChatMessage } from "@/lib/api/types";
import ChatMessage from "@/components/ChatMessage";
import { Bot } from "lucide-react";

interface MessageListProps {
  messages: DiscoveryChatMessage[];
  streamingMessage?: { runId: string; content: string } | null;
}

function toChatMessage(m: DiscoveryChatMessage) {
  return {
    id: m.id,
    role: m.role as "user" | "assistant",
    content: m.content,
    timestamp: new Date(m.created_at),
  };
}

const MessageList = ({ messages, streamingMessage }: MessageListProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingMessage?.content]);

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto scrollbar-thin px-5 py-4"
    >
      <div className="flex flex-col gap-4">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={toChatMessage(msg)} />
        ))}
        {streamingMessage && (
          <div className="flex gap-3 animate-fade-in">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
              <Bot className="h-4 w-4" />
            </div>
            <div className="max-w-[80%] rounded-xl bg-chat-assistant px-4 py-3 text-sm leading-relaxed text-chat-assistant-foreground">
              {streamingMessage.content ? (
                <>
                  {streamingMessage.content.split("\n").map((line, i) => (
                    <p key={i} className={i > 0 ? "mt-2" : ""}>
                      {line.split(/(\*\*[^*]+\*\*)/).map((part, j) =>
                        part.startsWith("**") && part.endsWith("**") ? (
                          <strong key={j} className="font-semibold">
                            {part.slice(2, -2)}
                          </strong>
                        ) : (
                          <span key={j}>{part}</span>
                        )
                      )}
                    </p>
                  ))}
                  <span className="inline-block h-4 w-0.5 animate-pulse bg-current align-middle" />
                </>
              ) : (
                <span className="text-muted-foreground">...</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageList;

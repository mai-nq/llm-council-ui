"use client";

import { useRef, useEffect, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SendHorizontal, User, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CouncilResponseView } from "./council-response-view";
import type {
  Message,
  Stage1Response,
  Stage2Result,
  Settings,
} from "@/lib/types";

interface ChatViewProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  isLoading: boolean;
  currentStage: 0 | 1 | 2 | 3;
  pendingStage1?: Stage1Response[];
  pendingStage2?: Stage2Result;
  pendingStage3?: string;
  settings: Settings | null;
  error?: string | null;
}

export function ChatView({
  messages,
  onSendMessage,
  isLoading,
  currentStage,
  pendingStage1,
  pendingStage2,
  pendingStage3,
  settings,
  error,
}: ChatViewProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, currentStage, pendingStage1, pendingStage2, pendingStage3]);

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (trimmed && !isLoading) {
      onSendMessage(trimmed);
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Group messages into turns (user + assistant)
  const turns: { user: Message; assistant?: Message }[] = [];
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (msg.role === "user") {
      turns.push({
        user: msg,
        assistant: messages[i + 1]?.role === "assistant" ? messages[i + 1] : undefined,
      });
      if (messages[i + 1]?.role === "assistant") i++;
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-auto p-6" ref={scrollRef}>
        <div className="mx-auto max-w-6xl space-y-8">
          {turns.map((turn, index) => (
            <div key={turn.user.id} className="space-y-6">
              {/* User Message */}
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                  <User className="h-4 w-4" />
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">You</span>
                    <span>
                      {new Date(turn.user.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="mt-1">{turn.user.content}</p>
                </div>
              </div>

              {/* Council Response */}
              {turn.assistant?.councilResponse && (
                <CouncilResponseView
                  councilResponse={turn.assistant.councilResponse}
                  settings={settings}
                />
              )}
            </div>
          ))}

          {/* Pending Response */}
          {isLoading && (
            <div className="space-y-6">
              <CouncilResponseView
                pendingStage1={pendingStage1}
                pendingStage2={pendingStage2}
                pendingStage3={pendingStage3}
                currentStage={currentStage}
                settings={settings}
              />
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive" className="mx-auto max-w-2xl">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}
                {error.includes("terminated") && (
                  <span className="block mt-1 text-xs">
                    The request may have timed out. Try a shorter question or check your API key.
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center gap-2 rounded-full border bg-background px-4 py-2 shadow-sm">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a follow-up question..."
              disabled={isLoading}
              className="min-h-[40px] max-h-[120px] flex-1 resize-none border-0 bg-transparent p-0 focus-visible:ring-0"
              rows={1}
            />
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !input.trim()}
              size="icon"
              className="h-9 w-9 shrink-0 rounded-full"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SendHorizontal className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

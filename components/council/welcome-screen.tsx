"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendHorizontal } from "lucide-react";
import { getModelDisplayName, getModelColor } from "@/lib/types";

interface WelcomeScreenProps {
  activeModels: string[];
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
}

const SUGGESTED_QUESTIONS = [
  "What is consciousness and can AI ever truly be conscious?",
  "What are the long-term risks and benefits of artificial general intelligence...",
  "How should humanity approach the alignment problem in AI development...",
];

export function WelcomeScreen({
  activeModels,
  onSendMessage,
  isLoading,
}: WelcomeScreenProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = () => {
    const trimmed = message.trim();
    if (trimmed && !isLoading) {
      onSendMessage(trimmed);
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-2xl space-y-8 text-center">
        {/* Welcome Text */}
        <div className="space-y-3">
          <h2 className="text-3xl font-bold">Welcome to LLM Council</h2>
          <p className="text-muted-foreground">
            Ask a question and watch multiple AI models deliberate,
            <br />
            review each other, and synthesize a final answer. Follow up
            <br />
            to continue the conversation with full context.
          </p>
        </div>

        {/* Active Models */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {activeModels.map((modelId) => (
            <div
              key={modelId}
              className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5"
            >
              <div className={`h-2 w-2 rounded-full ${getModelColor(modelId)}`} />
              <span className="text-sm font-medium">
                {getModelDisplayName(modelId)}
              </span>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="relative">
          <div className="flex items-center gap-2 rounded-full border bg-background px-4 py-2 shadow-sm">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask your council a challenging question..."
              disabled={isLoading}
              className="min-h-[40px] max-h-[120px] flex-1 resize-none border-0 bg-transparent p-0 focus-visible:ring-0"
              rows={1}
            />
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !message.trim()}
              size="icon"
              className="h-9 w-9 shrink-0 rounded-full"
            >
              <SendHorizontal className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Your query will be sent to all council members simultaneously
          </p>
        </div>

        {/* Suggested Questions */}
        <div className="flex flex-wrap justify-center gap-2">
          {SUGGESTED_QUESTIONS.map((question, i) => (
            <button
              key={i}
              onClick={() => onSendMessage(question)}
              disabled={isLoading}
              className="rounded-lg border bg-background px-4 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
            >
              {question}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

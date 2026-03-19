"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/council/header";
import { CouncilChat } from "@/components/council/council-chat";
import { HistorySidebar } from "@/components/council/history-sidebar";
import type {
  Conversation,
  Message,
  Stage1Response,
  Stage2Result,
  Settings as SettingsType,
} from "@/lib/types";

export default function Home() {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStage, setCurrentStage] = useState<0 | 1 | 2 | 3>(0);
  const [pendingStage1, setPendingStage1] = useState<Stage1Response[]>();
  const [pendingStage2, setPendingStage2] = useState<Stage2Result>();
  const [pendingStage3, setPendingStage3] = useState<string>();
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
  };

  const handleNewSession = useCallback(() => {
    setConversation(null);
    setPendingStage1(undefined);
    setPendingStage2(undefined);
    setPendingStage3(undefined);
    setCurrentStage(0);
    setError(null);
  }, []);

  const handleSelectConversation = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/conversations/${id}`);
      if (res.ok) {
        const conv = await res.json();
        setConversation(conv);
        setPendingStage1(undefined);
        setPendingStage2(undefined);
        setPendingStage3(undefined);
        setCurrentStage(0);
        setError(null);
      }
    } catch (error) {
      console.error("Failed to load conversation:", error);
    }
  }, []);

  const handleDeleteConversation = useCallback((id: string) => {
    if (conversation?.id === id) {
      handleNewSession();
    }
  }, [conversation?.id, handleNewSession]);

  const handleSendMessage = useCallback(async (content: string) => {
    // Create conversation if needed
    let conversationId = conversation?.id;

    if (!conversationId) {
      const res = await fetch("/api/conversations", { method: "POST" });
      if (!res.ok) return;
      const newConv = await res.json();
      setConversation(newConv);
      conversationId = newConv.id;
      setRefreshTrigger((prev) => prev + 1);
    }

    await sendMessageToConversation(conversationId, content);
  }, [conversation?.id]);

  const sendMessageToConversation = async (
    conversationId: string,
    content: string
  ) => {
    setIsLoading(true);
    setCurrentStage(1);
    setPendingStage1(undefined);
    setPendingStage2(undefined);
    setPendingStage3(undefined);
    setError(null);

    // Optimistically add user message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    };

    setConversation((prev) =>
      prev
        ? { ...prev, messages: [...prev.messages, userMessage] }
        : {
            id: conversationId,
            title: content.slice(0, 50),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            messages: [userMessage],
          }
    );

    try {
      const res = await fetch(`/api/conversations/${conversationId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!res.ok || !res.body) {
        throw new Error("Failed to send message");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const event = JSON.parse(line.slice(6));

              if (event.type === "stage1_complete") {
                setPendingStage1(event.data);
                setCurrentStage(2);
              } else if (event.type === "stage2_complete") {
                setPendingStage2(event.data);
                setCurrentStage(3);
              } else if (event.type === "stage3_complete") {
                setPendingStage3(event.data);
                setCurrentStage(0);
              } else if (event.type === "complete") {
                // Reload conversation
                const convRes = await fetch(`/api/conversations/${conversationId}`);
                if (convRes.ok) {
                  const conv = await convRes.json();
                  setConversation(conv);
                }
                setRefreshTrigger((prev) => prev + 1);
              } else if (event.type === "error") {
                console.error("Council error:", event.data.message);
                setError(event.data.message || "An error occurred");
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      const errorMessage = err instanceof Error ? err.message : "Connection failed";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setCurrentStage(0);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      <Header
        onNewSession={handleNewSession}
        onHistoryClick={() => setHistoryOpen(true)}
      />
      <HistorySidebar
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        currentConversationId={conversation?.id}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
        onNewSession={() => {
          handleNewSession();
          setHistoryOpen(false);
        }}
        refreshTrigger={refreshTrigger}
      />
      <main className="min-h-0 flex-1">
        <CouncilChat
          conversation={conversation}
          settings={settings}
          isLoading={isLoading}
          currentStage={currentStage}
          pendingStage1={pendingStage1}
          pendingStage2={pendingStage2}
          pendingStage3={pendingStage3}
          error={error}
          onSendMessage={handleSendMessage}
          onNewSession={handleNewSession}
        />
      </main>
    </div>
  );
}

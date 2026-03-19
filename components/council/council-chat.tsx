'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { ChatInput } from './chat-input'
import { ResponseTabs } from './response-tabs'
import { ReviewPanel } from './review-panel'
import { FinalResponse } from './final-response'
import { StageIndicator } from './stage-indicator'
import { UserMessage } from './user-message'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { History, MessagesSquare } from 'lucide-react'
import {
  COUNCIL_MODELS,
  type Stage1Response,
  type Stage2Result,
  type Settings,
  type Message,
  type Conversation,
} from '@/lib/types'

const SUGGESTED_QUESTIONS = [
  'What is consciousness and can AI ever truly be conscious?',
  'What are the long-term risks and benefits of artificial general intelligence?',
  'How should humanity approach the alignment problem in AI development?',
]

interface CouncilChatProps {
  conversation: Conversation | null
  settings: Settings | null
  isLoading: boolean
  currentStage: 0 | 1 | 2 | 3
  pendingStage1?: Stage1Response[]
  pendingStage2?: Stage2Result
  pendingStage3?: string
  error?: string | null
  onSendMessage: (content: string) => void
  onNewSession: () => void
}

export function CouncilChat({
  conversation,
  settings,
  isLoading,
  currentStage,
  pendingStage1,
  pendingStage2,
  pendingStage3,
  error,
  onSendMessage,
  onNewSession,
}: CouncilChatProps) {
  const [activeTab, setActiveTab] = useState(COUNCIL_MODELS[0].id)
  const bottomRef = useRef<HTMLDivElement>(null)

  const isIdle = !conversation || conversation.messages.length === 0

  // Scroll to bottom when new content arrives
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation?.messages, pendingStage1, pendingStage2, pendingStage3])

  // Build turns from messages
  const turns: Array<{
    user: Message
    assistant?: Message
    historyCount: number
  }> = []

  if (conversation) {
    for (let i = 0; i < conversation.messages.length; i++) {
      const msg = conversation.messages[i]
      if (msg.role === 'user') {
        turns.push({
          user: msg,
          assistant:
            conversation.messages[i + 1]?.role === 'assistant'
              ? conversation.messages[i + 1]
              : undefined,
          historyCount: Math.floor(i / 2),
        })
        if (conversation.messages[i + 1]?.role === 'assistant') i++
      }
    }
  }

  const completedTurns = turns.filter((t) => t.assistant?.councilResponse)

  return (
    <div className="flex h-full flex-col">
      {/* Main scrollable area */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {isIdle ? (
          /* Welcome screen */
          <div className="flex h-full flex-col items-center justify-center px-4 py-12">
            <div className="mb-8 text-center">
              <h1 className="mb-2 text-2xl font-bold tracking-tight sm:text-3xl">
                Welcome to LLM Council
              </h1>
              <p className="max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
                Ask a question and watch multiple AI models deliberate, review
                each other, and synthesize a final answer. Follow up to continue
                the conversation with full context.
              </p>
            </div>

            <div className="mb-8 flex flex-wrap justify-center gap-2">
              {COUNCIL_MODELS.map((model) => (
                <div
                  key={model.id}
                  className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5"
                >
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: model.color }}
                  />
                  <span className="text-xs font-medium">{model.name}</span>
                </div>
              ))}
            </div>

            <div className="w-full max-w-2xl px-4">
              <ChatInput
                onSubmit={onSendMessage}
                placeholder="Ask your council a challenging question..."
                disabled={isLoading}
              />
            </div>

            <div className="mt-6 grid gap-2 sm:grid-cols-3">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => onSendMessage(q)}
                  disabled={isLoading}
                  className="rounded-lg border border-border bg-card/50 px-4 py-2 text-xs text-muted-foreground transition-colors hover:bg-card hover:text-foreground disabled:opacity-50"
                >
                  {q.replace(/\?$/, '')}...
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Conversation turns */
          <div className="mx-auto max-w-6xl space-y-6 p-4 lg:p-6">
            {turns.map((turn, idx) => {
              const isLast = idx === turns.length - 1
              const stage1 = turn.assistant?.councilResponse?.stage1 || (isLast ? pendingStage1 : undefined)
              const stage2 = turn.assistant?.councilResponse?.stage2 || (isLast ? pendingStage2 : undefined)
              const stage3 = turn.assistant?.councilResponse?.stage3 || (isLast ? pendingStage3 : undefined)

              return (
                <div key={turn.user.id} className="space-y-6">
                  {/* User message */}
                  <UserMessage content={turn.user.content} timestamp={turn.user.timestamp} />

                  {/* History context badge */}
                  {turn.historyCount > 0 && (
                    <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/30 px-3 py-2">
                      <History className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">
                        Council has access to{' '}
                        <span className="font-medium text-foreground">
                          {turn.historyCount * 2} prior message{turn.historyCount * 2 > 1 ? 's' : ''}
                        </span>{' '}
                        as context for this turn.
                      </p>
                      <Badge variant="outline" className="ml-auto text-xs">
                        Turn {idx + 1}
                      </Badge>
                    </div>
                  )}

                  {/* Stage indicator for active turn */}
                  {isLast && isLoading && currentStage > 0 && (
                    <StageIndicator stage={currentStage} />
                  )}

                  {/* Model responses + peer review */}
                  {(stage1 && stage1.length > 0) && (
                    <div className="grid gap-6 lg:grid-cols-3">
                      <div className="lg:col-span-2">
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Council Responses
                        </p>
                        <div className="h-[380px]">
                          <ResponseTabs
                            responses={stage1}
                            activeTab={activeTab}
                            onTabChange={setActiveTab}
                            isLoading={isLast && currentStage === 1}
                          />
                        </div>
                      </div>
                      <div>
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Peer Review
                        </p>
                        <ReviewPanel
                          stage2={stage2}
                          isLoading={isLast && currentStage === 2}
                        />
                      </div>
                    </div>
                  )}

                  {/* Chairman synthesis */}
                  {(stage2 || (isLast && currentStage >= 3)) && (
                    <div>
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Chairman&apos;s Synthesis
                      </p>
                      <FinalResponse
                        response={stage3}
                        isLoading={isLast && currentStage === 3 && !stage3}
                      />
                    </div>
                  )}

                  {/* Error display */}
                  {isLast && error && (
                    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                      <p className="text-sm text-destructive">{error}</p>
                    </div>
                  )}

                  {/* Separator between turns */}
                  {!isLast && (
                    <div className="flex items-center gap-3 py-2">
                      <Separator className="flex-1" />
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MessagesSquare className="h-3 w-3" />
                        Turn {idx + 2}
                      </div>
                      <Separator className="flex-1" />
                    </div>
                  )}
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Sticky input — only shown once conversation has started */}
      {!isIdle && (
        <div className="border-t border-border bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="mx-auto max-w-6xl">
            {/* History summary */}
            {completedTurns.length > 0 && !isLoading && (
              <div className="mb-2 flex items-center gap-2">
                <History className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {completedTurns.length} turn
                  {completedTurns.length > 1 ? 's' : ''} in history
                  — follow-up questions include full context
                </span>
                <button
                  onClick={onNewSession}
                  className="ml-auto text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                >
                  New session
                </button>
              </div>
            )}

            <ChatInput
              onSubmit={onSendMessage}
              placeholder={
                isLoading
                  ? 'Council is deliberating...'
                  : 'Ask a follow-up question...'
              }
              disabled={isLoading}
            />
          </div>
        </div>
      )}
    </div>
  )
}

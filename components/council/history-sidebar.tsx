'use client'

import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { History, MessageSquare, Trash2, Plus } from 'lucide-react'
import type { ConversationMetadata } from '@/lib/types'

interface HistorySidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentConversationId?: string
  onSelectConversation: (id: string) => void
  onDeleteConversation: (id: string) => void
  onNewSession: () => void
  refreshTrigger?: number
}

export function HistorySidebar({
  open,
  onOpenChange,
  currentConversationId,
  onSelectConversation,
  onDeleteConversation,
  onNewSession,
  refreshTrigger,
}: HistorySidebarProps) {
  const [conversations, setConversations] = useState<ConversationMetadata[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (open) {
      loadConversations()
    }
  }, [open, refreshTrigger])

  const loadConversations = async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/conversations')
      if (res.ok) {
        const data = await res.json()
        setConversations(data)
      }
    } catch (error) {
      console.error('Failed to load conversations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    try {
      const res = await fetch(`/api/conversations/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== id))
        onDeleteConversation(id)
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-80 p-0">
        <SheetHeader className="border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2 text-base">
              <History className="h-4 w-4" />
              Chat History
            </SheetTitle>
            <Button variant="outline" size="sm" onClick={onNewSession}>
              <Plus className="mr-1 h-3 w-3" />
              New
            </Button>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-60px)]">
          <div className="p-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-sm text-muted-foreground">Loading...</p>
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <MessageSquare className="mb-2 h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No conversations yet</p>
                <p className="text-xs text-muted-foreground/70">
                  Start a new session to begin
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => {
                      onSelectConversation(conv.id)
                      onOpenChange(false)
                    }}
                    className={`group flex cursor-pointer items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-accent ${
                      conv.id === currentConversationId ? 'bg-accent' : ''
                    }`}
                  >
                    <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="flex-1 overflow-hidden">
                      <p className="truncate text-sm font-medium">
                        {conv.title || 'Untitled conversation'}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatDate(conv.updatedAt)}</span>
                        <span>•</span>
                        <span>{conv.messageCount} msg{conv.messageCount !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleDelete(e, conv.id)}
                      className="h-6 w-6 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
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
  const [deleteTarget, setDeleteTarget] = useState<ConversationMetadata | null>(null)

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
        // Filter out empty conversations (no messages from user)
        const nonEmpty = data.filter((c: ConversationMetadata) => c.messageCount > 0)
        setConversations(nonEmpty)
      }
    } catch (error) {
      console.error('Failed to load conversations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteClick = (e: React.MouseEvent, conversation: ConversationMetadata) => {
    e.stopPropagation()
    e.preventDefault()
    // Close sheet first, then show dialog after a small delay
    onOpenChange(false)
    setTimeout(() => {
      setDeleteTarget(conversation)
    }, 150)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    try {
      const res = await fetch(`/api/conversations/${deleteTarget.id}`, { method: 'DELETE' })
      if (res.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== deleteTarget.id))
        onDeleteConversation(deleteTarget.id)
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error)
    } finally {
      setDeleteTarget(null)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteTarget(null)
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
    <>
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-96 p-0">
        <SheetHeader className="border-b px-4 py-3 pr-12">
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

        <div className="h-[calc(100vh-60px)] overflow-y-auto">
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
                    className={`group relative flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-accent ${
                      conv.id === currentConversationId ? 'bg-accent' : ''
                    }`}
                  >
                    <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">
                        {conv.title || 'Untitled conversation'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteClick(e, conv)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-md opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>

    <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && handleDeleteCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete &quot;{deleteTarget?.title || 'Untitled conversation'}&quot;.
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleDeleteCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  )
}

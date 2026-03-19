'use client'

import { User } from 'lucide-react'

interface UserMessageProps {
  content: string
  timestamp?: Date | string
}

export function UserMessage({ content, timestamp }: UserMessageProps) {
  const formattedTime = timestamp
    ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
        <User className="h-4 w-4" />
      </div>
      <div className="flex-1 pt-1">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">You</span>
          <span>{formattedTime}</span>
        </div>
        <p className="mt-1">{content}</p>
      </div>
    </div>
  )
}

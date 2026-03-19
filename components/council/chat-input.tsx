'use client'

import { useState, useRef, useCallback } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { SendHorizontal } from 'lucide-react'

interface ChatInputProps {
  onSubmit: (content: string) => void
  placeholder?: string
  disabled?: boolean
}

export function ChatInput({ onSubmit, placeholder, disabled }: ChatInputProps) {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = useCallback(() => {
    const trimmed = input.trim()
    if (trimmed && !disabled) {
      onSubmit(trimmed)
      setInput('')
    }
  }, [input, disabled, onSubmit])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="flex items-center gap-2 rounded-full border bg-background px-4 py-2 shadow-sm">
      <Textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || 'Ask your council a question...'}
        disabled={disabled}
        className="min-h-0 flex-1 resize-none border-0 bg-transparent p-0 text-sm focus-visible:ring-0"
        rows={1}
      />
      <Button
        size="icon"
        className="h-8 w-8 shrink-0 rounded-full"
        onClick={handleSubmit}
        disabled={disabled || !input.trim()}
      >
        <SendHorizontal className="h-4 w-4" />
      </Button>
    </div>
  )
}

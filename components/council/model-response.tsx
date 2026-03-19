'use client'

import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Stage1Response, LLMModel } from '@/lib/types'

interface ModelResponseProps {
  model: LLMModel
  response?: Stage1Response
  isActive?: boolean
  isLoading?: boolean
}

export function ModelResponse({ model, response, isActive, isLoading }: ModelResponseProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (response?.content) {
      await navigator.clipboard.writeText(response.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Calculate token count (rough estimate)
  const getTokenCount = (text: string) => Math.ceil(text.length / 4)

  return (
    <div
      className={cn(
        'flex h-full flex-col rounded-lg border bg-card p-4 transition-all',
        isActive ? 'border-primary/50 ring-1 ring-primary/20' : 'border-border'
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold text-white"
            style={{ backgroundColor: model.color }}
          >
            {model.icon}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{model.name}</span>
            <span className="text-xs text-muted-foreground">{model.provider}</span>
          </div>
        </div>
        {response?.content && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[90%]" />
            <Skeleton className="h-4 w-[75%]" />
            <Skeleton className="h-4 w-[85%]" />
          </div>
        ) : response?.content ? (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {response.content}
            </ReactMarkdown>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            Waiting for response...
          </p>
        )}
      </div>

      {response?.content && !isLoading && (
        <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-2">
          <Badge variant="secondary" className="text-xs">
            {getTokenCount(response.content)} tokens
          </Badge>
          <span className="text-xs text-muted-foreground">
            {new Date().toLocaleTimeString()}
          </span>
        </div>
      )}
    </div>
  )
}

'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Copy, Check, Crown, Sparkles } from 'lucide-react'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface FinalResponseProps {
  response?: string
  isLoading?: boolean
}

export function FinalResponse({ response, isLoading }: FinalResponseProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (response) {
      await navigator.clipboard.writeText(response)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!response && !isLoading) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card/50 p-6 text-center">
        <Crown className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">
          The Chairman will synthesize a final response after the review stage
        </p>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-lg border border-primary/30 bg-gradient-to-br from-card to-card/80 p-4 shadow-lg">
      {/* Decorative gradient */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />

      <div className="relative">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground shadow-lg">
              <Crown className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">Final Response</span>
                <Badge variant="secondary" className="text-xs">
                  <Sparkles className="mr-1 h-3 w-3" />
                  Chairman
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground">
                Synthesized from all council members
              </span>
            </div>
          </div>
          {response && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>

        <div className="min-h-[100px]">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[95%]" />
              <Skeleton className="h-4 w-[85%]" />
              <Skeleton className="h-4 w-[90%]" />
              <Skeleton className="h-4 w-[70%]" />
            </div>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {response || ''}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

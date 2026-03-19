'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ModelResponse } from './model-response'
import { cn } from '@/lib/utils'
import type { Stage1Response } from '@/lib/types'
import { COUNCIL_MODELS } from '@/lib/types'

interface ResponseTabsProps {
  responses: Stage1Response[]
  activeTab?: string
  onTabChange?: (modelId: string) => void
  isLoading?: boolean
}

export function ResponseTabs({
  responses,
  activeTab,
  onTabChange,
  isLoading
}: ResponseTabsProps) {
  const defaultTab = activeTab || responses[0]?.model || COUNCIL_MODELS[0]?.id

  return (
    <Tabs
      value={defaultTab}
      onValueChange={onTabChange}
      className="flex h-full flex-col"
    >
      <TabsList className="mb-4 grid h-auto w-full grid-cols-2 gap-1 bg-muted/50 p-1 sm:grid-cols-4">
        {COUNCIL_MODELS.map((model) => {
          const response = responses.find((r) => r.model === model.id)
          const hasResponse = !!response?.content

          return (
            <TabsTrigger
              key={model.id}
              value={model.id}
              className={cn(
                'relative flex items-center gap-2 px-3 py-2 text-xs font-medium transition-all',
                'data-[state=active]:bg-background data-[state=active]:shadow-sm'
              )}
            >
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: model.color }}
              />
              <span className="hidden sm:inline">{model.name}</span>
              <span className="sm:hidden">{model.icon}</span>
              {isLoading && !hasResponse && (
                <span className="absolute -right-1 -top-1 h-2 w-2 animate-pulse rounded-full bg-primary" />
              )}
              {hasResponse && (
                <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-green-500" />
              )}
            </TabsTrigger>
          )
        })}
      </TabsList>

      <div className="min-h-0 flex-1">
        {COUNCIL_MODELS.map((model) => {
          const response = responses.find((r) => r.model === model.id)
          return (
            <TabsContent
              key={model.id}
              value={model.id}
              className="mt-0 h-full data-[state=inactive]:hidden"
            >
              <ModelResponse
                model={model}
                response={response}
                isActive={model.id === defaultTab}
                isLoading={isLoading && !response?.content}
              />
            </TabsContent>
          )
        })}
      </div>
    </Tabs>
  )
}

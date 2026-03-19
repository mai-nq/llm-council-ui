'use client'

import { Loader2, MessageSquare, Users, Crown } from 'lucide-react'

interface StageIndicatorProps {
  stage: number // 1 = first-opinions, 2 = review, 3 = final-response
}

export function StageIndicator({ stage }: StageIndicatorProps) {
  const stages = [
    { id: 1, name: 'Council responding', icon: MessageSquare },
    { id: 2, name: 'Peer review', icon: Users },
    { id: 3, name: 'Synthesizing', icon: Crown },
  ]

  return (
    <div className="flex items-center gap-4 rounded-lg border border-border bg-card/50 px-4 py-3">
      {stages.map((s, index) => {
        const Icon = s.icon
        const isActive = s.id === stage
        const isCompleted = s.id < stage

        return (
          <div key={s.id} className="flex items-center gap-2">
            {index > 0 && (
              <div
                className={`h-px w-8 ${
                  isCompleted ? 'bg-primary' : 'bg-border'
                }`}
              />
            )}
            <div
              className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : isCompleted
                  ? 'bg-primary/20 text-primary'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {isActive ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Icon className="h-3 w-3" />
              )}
              <span>{s.name}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

'use client'

import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Trophy, Medal, Award, Star } from 'lucide-react'
import { COUNCIL_MODELS, type Stage2Result } from '@/lib/types'

interface ReviewPanelProps {
  stage2?: Stage2Result
  isLoading?: boolean
}

export function ReviewPanel({ stage2, isLoading }: ReviewPanelProps) {
  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-4 w-4 text-yellow-500" />
      case 1:
        return <Medal className="h-4 w-4 text-gray-400" />
      case 2:
        return <Award className="h-4 w-4 text-amber-600" />
      default:
        return <Star className="h-4 w-4 text-muted-foreground" />
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-4 flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-md" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-2 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!stage2 || stage2.aggregateRankings.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card/50 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Peer review will appear here after all models respond
        </p>
      </div>
    )
  }

  const reviewCount = stage2.modelRankings.length

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-4 flex items-center gap-2">
        <Trophy className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Peer Rankings</h3>
        <Badge variant="secondary" className="ml-auto text-xs">
          {reviewCount} reviews
        </Badge>
      </div>

      <div className="space-y-3">
        {stage2.aggregateRankings.map((ranking, index) => {
          const model = COUNCIL_MODELS.find(m => m.id === ranking.model)
          if (!model) return null

          const maxScore = COUNCIL_MODELS.length
          const score = ((maxScore - ranking.avgRank + 1) / maxScore) * maxScore

          return (
            <div key={ranking.model} className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {getRankIcon(index)}
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-md text-xs font-bold text-white"
                  style={{ backgroundColor: model.color }}
                >
                  {model.icon}
                </div>
              </div>
              <div className="flex-1">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium">{model.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {score.toFixed(1)} / {maxScore}
                  </span>
                </div>
                <Progress
                  value={(score / maxScore) * 100}
                  className="h-1.5"
                />
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4 border-t border-border/50 pt-3">
        <p className="text-xs text-muted-foreground">
          Each model anonymously ranks the others based on accuracy and insight
        </p>
      </div>
    </div>
  )
}

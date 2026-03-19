'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { COUNCIL_MODELS, type ModelConfig } from '@/lib/types'

interface ModelConfigCardProps {
  config: ModelConfig
  onUpdate: (updates: Partial<ModelConfig>) => void
}

export function ModelConfigCard({ config, onUpdate }: ModelConfigCardProps) {
  const model = COUNCIL_MODELS.find((m) => m.id === config.modelId)
  if (!model) return null

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg font-semibold text-sm text-white"
              style={{ backgroundColor: model.color }}
            >
              {model.icon}
            </div>
            <div>
              <CardTitle className="text-base">{model.name}</CardTitle>
              <CardDescription className="text-xs">{model.provider}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor={`toggle-${config.modelId}`} className="text-sm">
              Active
            </Label>
            <Switch
              id={`toggle-${config.modelId}`}
              checked={config.active}
              onCheckedChange={(active) => onUpdate({ active })}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Temperature */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor={`temp-${config.modelId}`} className="text-sm font-medium">
              Temperature
            </Label>
            <span className="text-xs text-muted-foreground font-mono">
              {config.temperature.toFixed(2)}
            </span>
          </div>
          <Slider
            id={`temp-${config.modelId}`}
            min={0}
            max={2}
            step={0.1}
            value={[config.temperature]}
            onValueChange={([value]) => onUpdate({ temperature: value })}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Lower = more focused, Higher = more creative
          </p>
        </div>

        {/* Max Tokens */}
        <div className="space-y-2">
          <Label htmlFor={`tokens-${config.modelId}`} className="text-sm font-medium">
            Max Tokens
          </Label>
          <Input
            id={`tokens-${config.modelId}`}
            type="number"
            min={100}
            max={4000}
            step={100}
            value={config.maxTokens}
            onChange={(e) =>
              onUpdate({ maxTokens: Math.max(100, Math.min(4000, parseInt(e.target.value) || 100)) })
            }
            className="h-9 text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Maximum length of the response (100-4000)
          </p>
        </div>

        {/* System Prompt */}
        <div className="space-y-2">
          <Label htmlFor={`prompt-${config.modelId}`} className="text-sm font-medium">
            System Prompt
          </Label>
          <Textarea
            id={`prompt-${config.modelId}`}
            value={config.systemPrompt}
            onChange={(e) => onUpdate({ systemPrompt: e.target.value })}
            placeholder="Enter custom system prompt..."
            className="h-24 text-sm resize-none"
          />
          <p className="text-xs text-muted-foreground">
            Define the behavior and personality for this model
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

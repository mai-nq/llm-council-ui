'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/council/header'
import { ModelConfigCard } from '@/components/council/model-config-card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  DEFAULT_SETTINGS,
  type Settings,
  type ModelConfig,
} from '@/lib/types'

export default function SettingsPage() {
  const router = useRouter()
  const [settings, setSettings] = useState<Settings | null>(null)
  const [saved, setSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/settings')
      if (res.ok) {
        const data = await res.json()
        setSettings(data)
      } else {
        setSettings(DEFAULT_SETTINGS)
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
      setSettings(DEFAULT_SETTINGS)
    }
  }

  const handleSave = async () => {
    if (!settings) return

    setIsSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS)
  }

  const updateConfig = (modelId: string, updates: Partial<ModelConfig>) => {
    if (!settings) return

    setSettings({
      ...settings,
      models: settings.models.map((m) =>
        m.modelId === modelId ? { ...m, ...updates } : m
      ),
    })
  }

  const enabledCount = settings?.models.filter((c) => c.active).length ?? 0

  if (!settings) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />

      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-4xl px-4 py-8 lg:px-6">
          {/* Header Section */}
          <div className="mb-8 flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => router.push('/')}
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="sr-only">Back to chat</span>
                </Button>
                <h1 className="text-3xl font-bold tracking-tight">Configure Models</h1>
              </div>
              <p className="text-muted-foreground">
                Customize each council member's behavior and personality
              </p>
            </div>

            <div className="flex gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <RotateCcw className="h-4 w-4" />
                    Reset to Defaults
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset Configuration?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will restore all models to their default settings. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="flex gap-3">
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleReset} className="bg-destructive hover:bg-destructive/90">
                      Reset
                    </AlertDialogAction>
                  </div>
                </AlertDialogContent>
              </AlertDialog>

              <Button size="sm" onClick={handleSave} className="gap-2" disabled={saved || isSaving}>
                {saved ? '✓ Saved' : isSaving ? 'Saving...' : 'Save Configuration'}
              </Button>
            </div>
          </div>

          {/* Active Council Info */}
          <div className="mb-6 rounded-lg border border-border bg-card/50 p-4">
            <p className="text-sm">
              <span className="font-semibold">{enabledCount}</span> model{enabledCount !== 1 ? 's' : ''} active in your council
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Disable models you don't want to include in the deliberation
            </p>
          </div>

          {/* Model Configuration Cards */}
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
            {settings.models.map((config) => (
              <ModelConfigCard
                key={config.modelId}
                config={config}
                onUpdate={(updates) => updateConfig(config.modelId, updates)}
              />
            ))}
          </div>

          {/* Footer Info */}
          <div className="mt-12 rounded-lg border border-border/50 bg-secondary/20 p-6">
            <h3 className="font-semibold mb-2">Tips for Configuration</h3>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• <span className="font-medium">Temperature</span>: Controls randomness (0 = deterministic, 2 = very creative)</li>
              <li>• <span className="font-medium">Max Tokens</span>: Longer responses allow for more detailed explanations</li>
              <li>• <span className="font-medium">System Prompt</span>: Define each model's role and perspective in the council</li>
              <li>• Each council member brings a unique viewpoint based on their configuration</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}

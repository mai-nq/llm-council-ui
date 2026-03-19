'use client'

import { Users, Settings, Github, History } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface HeaderProps {
  onNewSession?: () => void
  onHistoryClick?: () => void
}

export function Header({ onNewSession, onHistoryClick }: HeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Users className="h-4 w-4 text-primary-foreground" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold tracking-tight">LLM Council</span>
          <span className="text-xs text-muted-foreground">Collaborative AI Reasoning</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onHistoryClick}
        >
          <History className="h-4 w-4" />
          <span className="sr-only">History</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onNewSession}
          className="hidden sm:flex"
        >
          New Session
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Settings className="h-4 w-4" />
              <span className="sr-only">Settings</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href="/settings" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Configure Models
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a
                href="https://github.com/karpathy/llm-council"
                target="_blank"
                rel="noopener noreferrer"
                className="cursor-pointer"
              >
                <Github className="mr-2 h-4 w-4" />
                View on GitHub
              </a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

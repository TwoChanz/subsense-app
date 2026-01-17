"use client"

import { useState, ReactNode } from "react"
import { Lock } from "lucide-react"
import { UpgradeModal } from "@/components/upgrade-modal"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface ProGateProps {
  isPro: boolean
  children: ReactNode
  className?: string
  fallback?: ReactNode
  tooltipText?: string
  email?: string
}

/**
 * Wraps content that requires Pro subscription
 * Shows locked state with upgrade modal for non-Pro users
 */
export function ProGate({
  isPro,
  children,
  className,
  fallback,
  tooltipText = "Upgrade to Pro to unlock this feature",
  email,
}: ProGateProps) {
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false)

  if (isPro) {
    return <>{children}</>
  }

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "relative cursor-pointer",
                className
              )}
              onClick={() => setUpgradeModalOpen(true)}
            >
              {fallback || children}
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded">
                <Lock className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <UpgradeModal
        open={upgradeModalOpen}
        onOpenChange={setUpgradeModalOpen}
        defaultEmail={email}
      />
    </>
  )
}

interface ProFeatureLockProps {
  isPro: boolean
  label: string
  description?: string
  onClick?: () => void
  email?: string
}

/**
 * A clickable locked feature indicator for non-Pro users
 */
export function ProFeatureLock({
  isPro,
  label,
  description,
  onClick,
  email,
}: ProFeatureLockProps) {
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false)

  const handleClick = () => {
    if (isPro && onClick) {
      onClick()
    } else {
      setUpgradeModalOpen(true)
    }
  }

  return (
    <>
      <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={handleClick}
      >
        {!isPro && <Lock className="h-4 w-4 text-muted-foreground" />}
        <div>
          <p className="text-sm font-medium">{label}</p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </div>

      <UpgradeModal
        open={upgradeModalOpen}
        onOpenChange={setUpgradeModalOpen}
        defaultEmail={email}
      />
    </>
  )
}

interface ProSwitchGateProps {
  isPro: boolean
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  email?: string
  children: ReactNode
}

/**
 * Wraps a Switch component - intercepts clicks for non-Pro users
 */
export function ProSwitchGate({
  isPro,
  checked,
  onCheckedChange,
  email,
  children,
}: ProSwitchGateProps) {
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false)

  const handleClick = (e: React.MouseEvent) => {
    if (!isPro) {
      e.preventDefault()
      e.stopPropagation()
      setUpgradeModalOpen(true)
    }
  }

  return (
    <>
      <div className="relative flex items-center">
        {!isPro && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Lock className="h-4 w-4 text-muted-foreground mr-2" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Pro feature - click to upgrade</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        <div onClick={handleClick}>
          {children}
        </div>
      </div>

      <UpgradeModal
        open={upgradeModalOpen}
        onOpenChange={setUpgradeModalOpen}
        defaultEmail={email}
      />
    </>
  )
}

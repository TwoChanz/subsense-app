"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import type { CancellationGuide, CancellationFriction } from "@/lib/types"
import { getCancellationGuide, getGenericCancellationTips } from "@/lib/actions"
import {
  XCircle,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Copy,
  Check,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface CancelGuideProps {
  serviceName: string
  onCanceled?: () => void
  onDismiss?: () => void
}

const difficultyConfig: Record<
  CancellationFriction,
  { label: string; color: string; bgColor: string }
> = {
  easy: {
    label: "Easy",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  moderate: {
    label: "Moderate",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  painful: {
    label: "Difficult",
    color: "text-red-500",
    bgColor: "bg-red-500/10",
  },
}

export function CancelGuide({ serviceName, onCanceled, onDismiss }: CancelGuideProps) {
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [showTips, setShowTips] = useState(false)

  const guide = getCancellationGuide(serviceName)
  const genericTips = getGenericCancellationTips()

  const toggleStep = (stepNumber: number) => {
    setCompletedSteps((prev) =>
      prev.includes(stepNumber)
        ? prev.filter((s) => s !== stepNumber)
        : [...prev, stepNumber]
    )
  }

  const allStepsComplete = guide
    ? completedSteps.length === guide.steps.length
    : false

  if (!guide) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <XCircle className="h-5 w-5 text-red-500" />
            Cancel {serviceName}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-500">
                No specific guide available
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                We don't have step-by-step instructions for {serviceName} yet.
                Try these general tips:
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {genericTips.map((tip, index) => (
              <div
                key={index}
                className="flex items-start gap-2 text-sm text-muted-foreground"
              >
                <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <span>{tip}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={onDismiss}>
              Dismiss
            </Button>
            <Button className="flex-1" onClick={onCanceled}>
              Mark as Canceled
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const diffConfig = difficultyConfig[guide.difficulty]

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <XCircle className="h-5 w-5 text-red-500" />
            Cancel {serviceName}
          </CardTitle>
          <Badge
            variant="outline"
            className={cn(diffConfig.bgColor, diffConfig.color, "border-0")}
          >
            {diffConfig.label}
          </Badge>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {guide.estimatedTime}
          </span>
          {guide.canCancelOnline && (
            <span className="flex items-center gap-1 text-green-500">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Online cancellation
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Steps */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">
            Steps ({completedSteps.length}/{guide.steps.length})
          </h4>
          <div className="space-y-1">
            {guide.steps.map((step) => (
              <CancelStep
                key={step.stepNumber}
                step={step}
                isComplete={completedSteps.includes(step.stepNumber)}
                onToggle={() => toggleStep(step.stepNumber)}
              />
            ))}
          </div>
        </div>

        {/* Tips */}
        {guide.tips.length > 0 && (
          <Collapsible open={showTips} onOpenChange={setShowTips}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  Tips & Notes
                </span>
                {showTips ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 pt-2">
              {guide.tips.map((tip, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 text-sm text-muted-foreground pl-2"
                >
                  <span className="text-amber-500">•</span>
                  <span>{tip}</span>
                </div>
              ))}
              {guide.refundPolicy && (
                <div className="flex items-start gap-2 text-sm pl-2 mt-2 pt-2 border-t">
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">
                    <strong>Refund Policy:</strong> {guide.refundPolicy}
                  </span>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t">
          <Button variant="outline" className="flex-1" onClick={onDismiss}>
            Cancel Later
          </Button>
          <Button
            className="flex-1"
            variant={allStepsComplete ? "default" : "outline"}
            onClick={onCanceled}
          >
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Mark as Canceled
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

interface CancelStepProps {
  step: { stepNumber: number; instruction: string; link?: string }
  isComplete: boolean
  onToggle: () => void
}

function CancelStep({ step, isComplete, onToggle }: CancelStepProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyLink = async () => {
    if (step.link) {
      await navigator.clipboard.writeText(step.link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-2.5 rounded-lg border transition-colors cursor-pointer",
        isComplete
          ? "bg-green-500/10 border-green-500/20"
          : "hover:bg-muted/50"
      )}
      onClick={onToggle}
    >
      <div
        className={cn(
          "flex items-center justify-center w-6 h-6 rounded-full shrink-0 text-xs font-medium",
          isComplete
            ? "bg-green-500 text-white"
            : "bg-muted text-muted-foreground"
        )}
      >
        {isComplete ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          step.stepNumber
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm",
            isComplete && "text-muted-foreground line-through"
          )}
        >
          {step.instruction}
        </p>
        {step.link && (
          <div className="flex items-center gap-2 mt-1">
            <a
              href={step.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-500 hover:underline flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              {step.link.replace(/^https?:\/\//, "").slice(0, 40)}
              <ExternalLink className="h-3 w-3" />
            </a>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={(e) => {
                e.stopPropagation()
                handleCopyLink()
              }}
            >
              {copied ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// Compact version for inline use
export function CancelGuideCompact({
  serviceName,
  onViewFull,
}: {
  serviceName: string
  onViewFull?: () => void
}) {
  const guide = getCancellationGuide(serviceName)

  if (!guide) {
    return (
      <div className="text-xs text-muted-foreground">
        No cancellation guide available
      </div>
    )
  }

  const diffConfig = difficultyConfig[guide.difficulty]

  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <div className="flex items-center gap-2">
        <Badge
          variant="outline"
          className={cn(diffConfig.bgColor, diffConfig.color, "border-0 text-xs")}
        >
          {diffConfig.label}
        </Badge>
        <span className="text-muted-foreground">
          {guide.steps.length} steps &middot; {guide.estimatedTime}
        </span>
      </div>
      {onViewFull && (
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onViewFull}>
          View Guide
          <ChevronRight className="h-3 w-3 ml-1" />
        </Button>
      )}
    </div>
  )
}

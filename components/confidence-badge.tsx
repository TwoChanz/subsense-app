"use client"

import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { CheckCircle2, AlertCircle, HelpCircle } from "lucide-react"
import type { VendorConfidence } from "@/lib/types"
import { getConfidenceLabel, getConfidenceDescription, getConfidenceColors } from "@/lib/vendor-confidence"
import { cn } from "@/lib/utils"

interface ConfidenceBadgeProps {
  confidence: VendorConfidence
  showTooltip?: boolean
  size?: "sm" | "default"
}

export function ConfidenceBadge({
  confidence,
  showTooltip = true,
  size = "default",
}: ConfidenceBadgeProps) {
  const label = getConfidenceLabel(confidence)
  const description = getConfidenceDescription(confidence)
  const colors = getConfidenceColors(confidence)

  const Icon = confidence === "high"
    ? CheckCircle2
    : confidence === "medium"
    ? AlertCircle
    : HelpCircle

  const badge = (
    <Badge
      variant="outline"
      className={cn(
        colors.bg,
        colors.text,
        colors.border,
        size === "sm" && "text-xs px-1.5 py-0"
      )}
    >
      <Icon className={cn("mr-1", size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5")} />
      {label}
    </Badge>
  )

  if (!showTooltip) {
    return badge
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent>
          <p>{description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

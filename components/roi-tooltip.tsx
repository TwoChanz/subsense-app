"use client"

import { HelpCircle } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface ROITooltipProps {
  className?: string
}

export function ROITooltip({ className }: ROITooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={className}
            aria-label="How is ROI score calculated?"
          >
            <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[280px] p-3">
          <div className="space-y-2 text-left">
            <p className="font-semibold">ROI Score Calculation</p>
            <div className="space-y-1 text-xs">
              <p><span className="font-medium">Usage:</span> Daily +40, Weekly +30, Monthly +15, Rare +5</p>
              <p><span className="font-medium">Importance:</span> High +40, Medium +25, Low +10</p>
              <p><span className="font-medium">Cost:</span> Penalty based on monthly cost</p>
            </div>
            <div className="pt-1 border-t border-border/50 text-xs">
              <p className="text-green-500">75+ = Keep</p>
              <p className="text-yellow-500">40-74 = Review</p>
              <p className="text-red-500">&lt;40 = Consider canceling</p>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

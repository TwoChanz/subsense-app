"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { ThumbsUp, ThumbsDown, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface LinkFeedbackToastProps {
  isOpen: boolean
  vendorId: string
  vendorName: string
  onFeedback: (result: "success" | "fail" | "skip") => void
  autoSkipMs?: number
}

export function LinkFeedbackToast({
  isOpen,
  vendorId,
  vendorName,
  onFeedback,
  autoSkipMs = 10000,
}: LinkFeedbackToastProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Handle visibility with animation delay
  useEffect(() => {
    if (isOpen) {
      // Delay showing toast to give user time to switch tabs
      const showTimeout = setTimeout(() => {
        setIsVisible(true)
      }, 1500)

      return () => clearTimeout(showTimeout)
    } else {
      setIsVisible(false)
    }
  }, [isOpen])

  // Auto-skip after timeout
  useEffect(() => {
    if (!isVisible) return

    const timeout = setTimeout(() => {
      handleFeedback("skip")
    }, autoSkipMs)

    return () => clearTimeout(timeout)
  }, [isVisible, autoSkipMs])

  const handleFeedback = useCallback(async (result: "success" | "fail" | "skip") => {
    if (isSubmitting) return
    setIsSubmitting(true)

    try {
      await onFeedback(result)
    } finally {
      setIsSubmitting(false)
      setIsVisible(false)
    }
  }, [onFeedback, isSubmitting])

  if (!isOpen) return null

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 transition-all duration-300",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      )}
    >
      <div className="bg-background border rounded-lg shadow-lg p-4 max-w-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="font-medium text-sm">Did this link work?</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Help improve our {vendorName} cancel link
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={() => handleFeedback("skip")}
            disabled={isSubmitting}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Dismiss</span>
          </Button>
        </div>

        <div className="flex items-center gap-2 mt-3">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => handleFeedback("success")}
            disabled={isSubmitting}
          >
            <ThumbsUp className="h-4 w-4 mr-1.5" />
            Yes
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => handleFeedback("fail")}
            disabled={isSubmitting}
          >
            <ThumbsDown className="h-4 w-4 mr-1.5" />
            No
          </Button>
        </div>

        {/* Auto-dismiss progress bar */}
        <div className="mt-3 h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-100 ease-linear"
            style={{
              animation: isVisible ? `shrink ${autoSkipMs}ms linear forwards` : undefined,
            }}
          />
        </div>

        <style jsx>{`
          @keyframes shrink {
            from {
              width: 100%;
            }
            to {
              width: 0%;
            }
          }
        `}</style>
      </div>
    </div>
  )
}

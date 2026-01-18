"use client"

import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { SavingsData } from "@/lib/types"
import {
  Share2,
  Download,
  Copy,
  Check,
  PiggyBank,
  Flame,
  TrendingUp,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"

interface ShareableSavingsCardProps {
  savings: SavingsData
  streak: number
  subscriptionCount: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ShareableSavingsCard({
  savings,
  streak,
  subscriptionCount,
  open,
  onOpenChange,
}: ShareableSavingsCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)
  const [canShare, setCanShare] = useState(false)

  // Check for Web Share API support after mount to avoid hydration mismatch
  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && "share" in navigator)
  }, [])

  const shareText = generateShareText(savings, streak)
  const shareUrl = typeof window !== "undefined" ? window.location.origin : ""

  const handleNativeShare = async () => {
    if (canShare && navigator.share) {
      try {
        await navigator.share({
          title: "My SubSense Savings",
          text: shareText,
          url: shareUrl,
        })
        toast.success("Shared successfully")
        onOpenChange(false)
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Share failed:", err)
          toast.error("Failed to share")
        }
      }
    } else {
      handleCopyToClipboard()
    }
  }

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`)
      setCopied(true)
      toast.success("Copied to clipboard")
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Clipboard write failed:", err)
      toast.error("Failed to copy")
    }
  }

  const handleDownloadImage = async () => {
    if (!cardRef.current) return

    try {
      // Dynamic import to avoid SSR issues
      const html2canvas = (await import("html2canvas")).default

      // Get computed background color from the card element for theme support
      const computedStyle = getComputedStyle(cardRef.current)
      const bgColor = computedStyle.backgroundColor || "#09090b"

      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: bgColor,
        scale: 2,
      })

      const link = document.createElement("a")
      link.download = `subsense-savings-${new Date().toISOString().slice(0, 10)}.png`
      link.href = canvas.toDataURL("image/png")
      link.click()

      toast.success("Image downloaded")
    } catch (err) {
      console.error("Image download failed:", err)
      toast.error("Failed to download image")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Your Savings</DialogTitle>
          <DialogDescription>
            Share your subscription savings with friends and inspire them to optimize too.
          </DialogDescription>
        </DialogHeader>

        {/* Preview Card */}
        <div
          ref={cardRef}
          className="relative overflow-hidden rounded-xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 p-6 border border-zinc-700"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-green-500/10 p-2">
                <PiggyBank className="h-5 w-5 text-green-500" />
              </div>
              <span className="font-semibold text-white">SubSense</span>
            </div>
            {streak > 0 && (
              <div className="flex items-center gap-1.5 text-amber-500">
                <Flame className="h-4 w-4" />
                <span className="text-sm font-medium">{streak} week streak</span>
              </div>
            )}
          </div>

          {/* Main Stat */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-1">
              <TrendingUp className="h-6 w-6 text-green-500" />
              <span className="text-4xl font-bold text-green-500">
                ${savings.totalSavedAllTime.toFixed(0)}
              </span>
            </div>
            <p className="text-zinc-400 text-sm">total saved</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <StatItem
              value={`$${savings.totalSavedThisMonth.toFixed(0)}`}
              label="this month"
            />
            <StatItem
              value={savings.subscriptionsCanceled.toString()}
              label="canceled"
              icon={<XCircle className="h-3 w-3 text-red-400" />}
            />
            <StatItem
              value={subscriptionCount.toString()}
              label="tracked"
            />
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-zinc-700/50 flex items-center justify-between text-xs text-zinc-500">
            <span>subsense.app</span>
            <span>{new Date().toLocaleDateString()}</span>
          </div>
        </div>

        {/* Share Actions */}
        <div className="flex gap-2 mt-4">
          <Button
            variant="default"
            className="flex-1"
            onClick={handleNativeShare}
          >
            <Share2 className="h-4 w-4 mr-2" />
            {canShare ? "Share" : "Copy Link"}
          </Button>
          <Button
            variant="outline"
            onClick={handleCopyToClipboard}
            aria-label={copied ? "Copied" : "Copy to clipboard"}
          >
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handleDownloadImage}
            aria-label="Download as image"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function StatItem({
  value,
  label,
  icon,
}: {
  value: string
  label: string
  icon?: React.ReactNode
}) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1">
        {icon}
        <span className="text-lg font-semibold text-white">{value}</span>
      </div>
      <p className="text-xs text-zinc-500">{label}</p>
    </div>
  )
}

function generateShareText(savings: SavingsData, streak: number): string {
  const parts: string[] = []

  if (savings.totalSavedAllTime > 0) {
    parts.push(`I've saved $${savings.totalSavedAllTime.toFixed(0)} by optimizing my subscriptions with SubSense!`)
  } else {
    parts.push("I'm tracking my subscriptions with SubSense to find savings!")
  }

  if (savings.subscriptionsCanceled > 0) {
    parts.push(`Canceled ${savings.subscriptionsCanceled} subscription${savings.subscriptionsCanceled > 1 ? "s" : ""} I wasn't using.`)
  }

  if (streak >= 4) {
    parts.push(`On a ${streak}-week review streak!`)
  }

  return parts.join(" ")
}

// Hook for using the share card
export function useShareSavings() {
  const [isOpen, setIsOpen] = useState(false)

  const openShareDialog = () => setIsOpen(true)
  const closeShareDialog = () => setIsOpen(false)

  return {
    isOpen,
    openShareDialog,
    closeShareDialog,
    setIsOpen,
  }
}

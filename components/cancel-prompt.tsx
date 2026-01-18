"use client"

import { useState, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ConfidenceBadge } from "@/components/confidence-badge"
import { LinkFeedbackToast } from "@/components/link-feedback-toast"
import { ExternalLink, Search, Edit2, Clock } from "lucide-react"
import { getCancelLink, getSearchCancelUrl, type SubscriptionWithVendor } from "@/lib/cancel-flow"
import { submitVendorFeedback, updateSubscription } from "@/lib/api"
import type { VendorConfidence } from "@/lib/types"
import { toast } from "sonner"

interface CancelPromptProps {
  subscription: SubscriptionWithVendor | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onCancelUrlUpdated?: (subscriptionId: string, cancelUrl: string) => void
}

export function CancelPrompt({
  subscription,
  isOpen,
  onOpenChange,
  onCancelUrlUpdated,
}: CancelPromptProps) {
  const [showAddLink, setShowAddLink] = useState(false)
  const [newCancelUrl, setNewCancelUrl] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showFeedbackToast, setShowFeedbackToast] = useState(false)
  const [pendingFeedbackVendorId, setPendingFeedbackVendorId] = useState<string | null>(null)

  const cancelInfo = subscription ? getCancelLink(subscription) : null

  const handleOpenLink = useCallback((url: string, showFeedback: boolean) => {
    // Open link in new tab
    window.open(url, "_blank", "noopener,noreferrer")

    // Show feedback toast if applicable
    if (showFeedback && subscription?.vendor?.id) {
      setPendingFeedbackVendorId(subscription.vendor.id)
      setShowFeedbackToast(true)
    }

    // Close dialog
    onOpenChange(false)
  }, [subscription, onOpenChange])

  const handleFeedback = useCallback(async (result: "success" | "fail" | "skip") => {
    if (!pendingFeedbackVendorId) return

    try {
      await submitVendorFeedback(pendingFeedbackVendorId, result)
      if (result === "success") {
        toast.success("Thanks for the feedback!")
      } else if (result === "fail") {
        toast.info("Thanks! We'll review this link.")
      }
    } catch (error) {
      console.error("Failed to submit feedback:", error)
    } finally {
      setShowFeedbackToast(false)
      setPendingFeedbackVendorId(null)
    }
  }, [pendingFeedbackVendorId])

  const handleSearchCancel = useCallback(() => {
    if (!subscription) return
    const searchUrl = getSearchCancelUrl(subscription.name)
    window.open(searchUrl, "_blank", "noopener,noreferrer")
    onOpenChange(false)
  }, [subscription, onOpenChange])

  const handleAddCancelUrl = useCallback(async () => {
    if (!subscription || !newCancelUrl.trim()) return

    setIsSubmitting(true)
    try {
      await updateSubscription(subscription.id, { cancelUrl: newCancelUrl.trim() })
      onCancelUrlUpdated?.(subscription.id, newCancelUrl.trim())
      toast.success("Cancel link saved")
      setShowAddLink(false)
      setNewCancelUrl("")

      // Open the newly added link
      handleOpenLink(newCancelUrl.trim(), false)
    } catch (error) {
      console.error("Failed to save cancel URL:", error)
      toast.error("Failed to save cancel link")
    } finally {
      setIsSubmitting(false)
    }
  }, [subscription, newCancelUrl, onCancelUrlUpdated, handleOpenLink])

  const handleClose = useCallback(() => {
    onOpenChange(false)
    setShowAddLink(false)
    setNewCancelUrl("")
  }, [onOpenChange])

  if (!subscription) return null

  const formatLastVerified = (date: Date | null) => {
    if (!date) return null
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days === 0) return "Verified today"
    if (days === 1) return "Verified yesterday"
    if (days < 7) return `Verified ${days} days ago`
    if (days < 30) return `Verified ${Math.floor(days / 7)} weeks ago`
    return `Verified ${Math.floor(days / 30)} months ago`
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel {subscription.name}</DialogTitle>
            <DialogDescription>
              Open the billing page to manage or cancel your subscription.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Has a cancel link */}
            {cancelInfo?.url && !showAddLink && (
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Billing Page</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {cancelInfo.url}
                    </p>
                  </div>
                  {cancelInfo.confidence && (
                    <ConfidenceBadge
                      confidence={cancelInfo.confidence as VendorConfidence}
                      size="sm"
                    />
                  )}
                </div>

                {cancelInfo.lastVerifiedAt && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatLastVerified(cancelInfo.lastVerifiedAt)}
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => handleOpenLink(cancelInfo.url!, cancelInfo.showFeedback)}
                    className="w-full"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Billing Page
                  </Button>

                  {cancelInfo.source !== "user" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => setShowAddLink(true)}
                    >
                      <Edit2 className="h-3 w-3 mr-1.5" />
                      Use Different Link
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* No cancel link or adding custom link */}
            {(!cancelInfo?.url || showAddLink) && (
              <div className="space-y-3">
                {!cancelInfo?.url && (
                  <p className="text-sm text-muted-foreground">
                    We don't have a cancel link for {subscription.name} yet.
                  </p>
                )}

                <div className="space-y-2">
                  <Label htmlFor="cancel-url">Add Cancel Link</Label>
                  <div className="flex gap-2">
                    <Input
                      id="cancel-url"
                      placeholder="https://..."
                      value={newCancelUrl}
                      onChange={(e) => setNewCancelUrl(e.target.value)}
                      disabled={isSubmitting}
                    />
                    <Button
                      onClick={handleAddCancelUrl}
                      disabled={!newCancelUrl.trim() || isSubmitting}
                    >
                      Save
                    </Button>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">or</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleSearchCancel}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Search "How to Cancel"
                </Button>

                {showAddLink && cancelInfo?.url && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => {
                      setShowAddLink(false)
                      setNewCancelUrl("")
                    }}
                  >
                    Use Suggested Link Instead
                  </Button>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Feedback toast - shows after opening vendor link */}
      <LinkFeedbackToast
        isOpen={showFeedbackToast}
        vendorId={pendingFeedbackVendorId || ""}
        vendorName={subscription.vendor?.name || subscription.name}
        onFeedback={handleFeedback}
      />
    </>
  )
}

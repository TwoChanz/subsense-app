"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ROIProgress } from "@/components/roi-progress"
import { StatusBadge } from "@/components/status-badge"
import {
  fetchSubscriptionById,
  createSubscription,
  updateSubscription as apiUpdateSubscription,
  checkDuplicateName,
} from "@/lib/api"
import { calculateROIScore, getStatusFromScore } from "@/lib/scoring"
import { CATEGORIES, BILLING_CYCLES, CANCELLATION_FRICTIONS, USAGE_SCOPES, TRIAL_REMINDER_OPTIONS } from "@/lib/constants"
import type { UsageFrequency, Importance, BillingCycle, CancellationFriction, UsageScope } from "@/lib/types"
import { ArrowLeft, AlertCircle, Loader2, Plus, X, ChevronDown, Settings2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { ROITooltip } from "@/components/roi-tooltip"
import { cn } from "@/lib/utils"

export default function AddSubscriptionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get("edit")
  const isEditing = !!editId

  const [name, setName] = useState("")
  const [category, setCategory] = useState("")
  const [secondaryCategory, setSecondaryCategory] = useState<string | null>(null)
  const [monthlyCost, setMonthlyCost] = useState("")
  const [usageFrequency, setUsageFrequency] = useState<UsageFrequency | "">("")
  const [importance, setImportance] = useState<Importance | "">("")
  // Additional options fields
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly")
  const [renewalDate, setRenewalDate] = useState<string>("")
  const [cancellationFriction, setCancellationFriction] = useState<CancellationFriction>("moderate")
  const [usageScope, setUsageScope] = useState<UsageScope>("personal")
  const [trialEndDate, setTrialEndDate] = useState<string>("")
  const [trialReminderEnabled, setTrialReminderEnabled] = useState(true)
  const [trialReminderDays, setTrialReminderDays] = useState(3)
  // UI state
  const [showSecondaryCategory, setShowSecondaryCategory] = useState(false)
  const [additionalOptionsOpen, setAdditionalOptionsOpen] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingEdit, setIsLoadingEdit] = useState(false)

  // Load existing data if editing
  useEffect(() => {
    if (editId) {
      setIsLoadingEdit(true)
      fetchSubscriptionById(editId)
        .then((subscription) => {
          if (subscription) {
            setName(subscription.name)
            setCategory(subscription.category)
            setSecondaryCategory(subscription.secondaryCategory ?? null)
            // Show secondary category field if it has a value
            if (subscription.secondaryCategory) {
              setShowSecondaryCategory(true)
            }
            setMonthlyCost(subscription.monthlyCost.toString())
            setUsageFrequency(subscription.usageFrequency)
            setImportance(subscription.importance)
            // Load additional options fields
            setBillingCycle(subscription.billingCycle)
            setRenewalDate(subscription.renewalDate ? subscription.renewalDate.toISOString().split("T")[0] : "")
            setCancellationFriction(subscription.cancellationFriction)
            setUsageScope(subscription.usageScope)
            setTrialEndDate(subscription.trialEndDate ? subscription.trialEndDate.toISOString().split("T")[0] : "")
            setTrialReminderEnabled(subscription.trialReminderEnabled)
            setTrialReminderDays(subscription.trialReminderDays)
            // Expand additional options if any non-default values are set
            const hasNonDefaultOptions =
              subscription.billingCycle !== "monthly" ||
              subscription.renewalDate ||
              subscription.cancellationFriction !== "moderate" ||
              subscription.usageScope !== "personal"
            if (hasNonDefaultOptions) {
              setAdditionalOptionsOpen(true)
            }
            setNotFound(false)
          } else {
            setNotFound(true)
          }
        })
        .catch((error) => {
          console.error("Failed to load subscription:", error)
          setNotFound(true)
        })
        .finally(() => {
          setIsLoadingEdit(false)
        })
    }
  }, [editId])

  // Debounced duplicate check
  const checkDuplicate = useCallback(
    async (nameToCheck: string) => {
      if (!nameToCheck.trim()) {
        setNameError(null)
        return
      }
      try {
        const isDuplicate = await checkDuplicateName(nameToCheck, editId || undefined)
        setNameError(isDuplicate ? "A subscription with this name already exists" : null)
      } catch (error) {
        console.error("Failed to check duplicate:", error)
      }
    },
    [editId]
  )

  // Validate name for duplicates with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      checkDuplicate(name)
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [name, checkDuplicate])

  // Calculate preview ROI (with all scoring factors)
  const previewROI =
    usageFrequency && importance && monthlyCost && category
      ? calculateROIScore(
          usageFrequency as UsageFrequency,
          importance as Importance,
          Number.parseFloat(monthlyCost) || 0,
          category,
          secondaryCategory,
          billingCycle,
          usageScope,
          cancellationFriction,
        )
      : null

  const previewStatus = previewROI !== null ? getStatusFromScore(previewROI) : null

  const isValid =
    name.trim() && !nameError && category && monthlyCost && Number.parseFloat(monthlyCost) > 0 && usageFrequency && importance

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid || isSubmitting) return

    setIsSubmitting(true)

    try {
      const payload = {
        name: name.trim(),
        category,
        secondaryCategory,
        monthlyCost: Number.parseFloat(monthlyCost),
        usageFrequency: usageFrequency as UsageFrequency,
        importance: importance as Importance,
        billingCycle,
        renewalDate: renewalDate ? new Date(renewalDate).toISOString() : null,
        cancellationFriction,
        usageScope,
        trialEndDate: billingCycle === "trial" && trialEndDate ? new Date(trialEndDate).toISOString() : null,
        trialReminderEnabled: billingCycle === "trial" ? trialReminderEnabled : true,
        trialReminderDays: billingCycle === "trial" ? trialReminderDays : 3,
      }

      if (isEditing && editId) {
        await apiUpdateSubscription(editId, payload)
        toast.success("Subscription updated", {
          description: `${name} has been updated successfully.`,
        })
      } else {
        await createSubscription(payload)
        toast.success("Subscription added", {
          description: `${name} has been added to your list.`,
        })
      }

      router.push("/")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Please try again."
      toast.error("Something went wrong", {
        description: message,
      })
      setIsSubmitting(false)
    }
  }

  // Handle removing secondary category
  const handleRemoveSecondaryCategory = () => {
    setSecondaryCategory(null)
    setShowSecondaryCategory(false)
  }

  // Generate summary text for collapsed additional options
  const getAdditionalOptionsSummary = (): string | null => {
    const parts: string[] = []

    // Billing cycle (only show if not default)
    if (billingCycle !== "monthly") {
      const cycleLabel = BILLING_CYCLES.find((c) => c.value === billingCycle)?.label || billingCycle
      parts.push(cycleLabel)
    } else {
      parts.push("Monthly")
    }

    // Renewal date
    if (billingCycle === "trial" && trialEndDate) {
      parts.push(`Ends ${new Date(trialEndDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`)
    } else if (renewalDate) {
      parts.push(`Renews ${new Date(renewalDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`)
    }

    // Cancellation friction
    const frictionLabel = CANCELLATION_FRICTIONS.find((f) => f.value === cancellationFriction)?.label.split(" ")[0] || cancellationFriction
    parts.push(frictionLabel)

    // Usage scope
    const scopeLabel = USAGE_SCOPES.find((s) => s.value === usageScope)?.label || usageScope
    parts.push(scopeLabel)

    return parts.join(" · ")
  }

  // Show loading state while fetching edit data
  if (isLoadingEdit) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded bg-muted animate-pulse" />
          <div className="space-y-2">
            <div className="h-8 w-48 bg-muted animate-pulse rounded" />
            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-96 rounded-lg bg-muted animate-pulse" />
          <div className="h-96 rounded-lg bg-muted animate-pulse" />
        </div>
      </div>
    )
  }

  // Show not found state if editing a non-existent subscription
  if (notFound) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back to dashboard</span>
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Subscription Not Found</h1>
            <p className="text-muted-foreground mt-1">
              The subscription you&apos;re trying to edit doesn&apos;t exist or has been deleted.
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">Subscription not found</p>
            <p className="text-muted-foreground mb-4">This subscription may have been deleted.</p>
            <Button asChild>
              <Link href="/">Return to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back to dashboard</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{isEditing ? "Edit Subscription" : "Add Subscription"}</h1>
          <p className="text-muted-foreground mt-1">
            {isEditing ? "Update your subscription details" : "Add a new subscription to track its ROI"}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription Details</CardTitle>
            <CardDescription>Enter the details of your subscription service</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Slack, Notion, Adobe..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={nameError ? "border-destructive" : ""}
                />
                {nameError && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {nameError}
                  </p>
                )}
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={(v) => {
                  setCategory(v)
                  // Clear secondary if it matches the new primary
                  if (secondaryCategory === v) {
                    setSecondaryCategory(null)
                  }
                }}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Secondary Category - Hidden by default */}
              {!showSecondaryCategory ? (
                <button
                  type="button"
                  onClick={() => setShowSecondaryCategory(true)}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add secondary category
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="secondaryCategory">Secondary Category</Label>
                    <button
                      type="button"
                      onClick={handleRemoveSecondaryCategory}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="h-3 w-3" />
                      Remove
                    </button>
                  </div>
                  <Select
                    value={secondaryCategory ?? "none"}
                    onValueChange={(v) => setSecondaryCategory(v === "none" ? null : v)}
                  >
                    <SelectTrigger id="secondaryCategory">
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {CATEGORIES.filter((cat) => cat !== category).map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    For subscriptions that serve multiple purposes (e.g., YouTube = Education + Entertainment)
                  </p>
                </div>
              )}

              {/* Monthly Cost */}
              <div className="space-y-2">
                <Label htmlFor="cost">Monthly Cost ($)</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={monthlyCost}
                  onChange={(e) => setMonthlyCost(e.target.value)}
                />
              </div>

              {/* Usage Frequency */}
              <div className="space-y-2">
                <Label htmlFor="frequency">Usage Frequency</Label>
                <Select value={usageFrequency} onValueChange={(v) => setUsageFrequency(v as UsageFrequency)}>
                  <SelectTrigger id="frequency">
                    <SelectValue placeholder="How often do you use it?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="rare">Rarely</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Importance */}
              <div className="space-y-2">
                <Label htmlFor="importance">Importance</Label>
                <Select value={importance} onValueChange={(v) => setImportance(v as Importance)}>
                  <SelectTrigger id="importance">
                    <SelectValue placeholder="How important is it?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High - Essential for work</SelectItem>
                    <SelectItem value="medium">Medium - Useful but not critical</SelectItem>
                    <SelectItem value="low">Low - Nice to have</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Additional Options - Collapsible */}
              <Collapsible open={additionalOptionsOpen} onOpenChange={setAdditionalOptionsOpen}>
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center justify-between w-full py-3 px-3 -mx-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Settings2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Additional Options</span>
                    </div>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform duration-200",
                        additionalOptionsOpen && "rotate-180"
                      )}
                    />
                  </button>
                </CollapsibleTrigger>

                {/* Summary when collapsed */}
                {!additionalOptionsOpen && (
                  <p className="text-xs text-muted-foreground px-3 -mt-1 pb-2">
                    {getAdditionalOptionsSummary()}
                  </p>
                )}

                <CollapsibleContent className="space-y-4 pt-2">
                  {/* Billing Cycle */}
                  <div className="space-y-2">
                    <Label htmlFor="billingCycle">Billing Cycle</Label>
                    <Select value={billingCycle} onValueChange={(v) => setBillingCycle(v as BillingCycle)}>
                      <SelectTrigger id="billingCycle">
                        <SelectValue placeholder="Select billing cycle" />
                      </SelectTrigger>
                      <SelectContent>
                        {BILLING_CYCLES.map((cycle) => (
                          <SelectItem key={cycle.value} value={cycle.value}>
                            {cycle.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Renewal Date / Trial End Date */}
                  {billingCycle === "trial" ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="trialEndDate">
                          Trial End Date
                          {!trialEndDate && (
                            <span className="text-amber-500 text-xs ml-2">Recommended to set a date</span>
                          )}
                        </Label>
                        <Input
                          id="trialEndDate"
                          type="date"
                          value={trialEndDate}
                          onChange={(e) => setTrialEndDate(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          We'll remind you before your trial converts to paid
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            id="trialReminder"
                            type="checkbox"
                            checked={trialReminderEnabled}
                            onChange={(e) => setTrialReminderEnabled(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          <Label htmlFor="trialReminder" className="font-normal">
                            Remind me before trial ends
                          </Label>
                        </div>
                      </div>

                      {trialReminderEnabled && (
                        <div className="space-y-2">
                          <Label htmlFor="trialReminderDays">Reminder Timing</Label>
                          <Select
                            value={trialReminderDays.toString()}
                            onValueChange={(v) => setTrialReminderDays(Number(v))}
                          >
                            <SelectTrigger id="trialReminderDays">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TRIAL_REMINDER_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value.toString()}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="renewalDate">
                        Renewal Date <span className="text-muted-foreground text-xs">(optional)</span>
                      </Label>
                      <Input
                        id="renewalDate"
                        type="date"
                        value={renewalDate}
                        onChange={(e) => setRenewalDate(e.target.value)}
                      />
                      {(billingCycle === "annual" || billingCycle === "quarterly") && (
                        <p className="text-xs text-muted-foreground">
                          Optional, but enables renewal reminders
                        </p>
                      )}
                    </div>
                  )}

                  {/* Cancellation Friction */}
                  <div className="space-y-2">
                    <Label htmlFor="cancellationFriction">Easy to Cancel?</Label>
                    <Select
                      value={cancellationFriction}
                      onValueChange={(v) => setCancellationFriction(v as CancellationFriction)}
                    >
                      <SelectTrigger id="cancellationFriction">
                        <SelectValue placeholder="How easy is it to cancel?" />
                      </SelectTrigger>
                      <SelectContent>
                        {CANCELLATION_FRICTIONS.map((friction) => (
                          <SelectItem key={friction.value} value={friction.value}>
                            {friction.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Usage Scope */}
                  <div className="space-y-2">
                    <Label htmlFor="usageScope">Who Uses This?</Label>
                    <Select value={usageScope} onValueChange={(v) => setUsageScope(v as UsageScope)}>
                      <SelectTrigger id="usageScope">
                        <SelectValue placeholder="Who uses this subscription?" />
                      </SelectTrigger>
                      <SelectContent>
                        {USAGE_SCOPES.map((scope) => (
                          <SelectItem key={scope.value} value={scope.value}>
                            {scope.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={!isValid || isSubmitting} className="flex-1">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isEditing ? "Updating..." : "Adding..."}
                    </>
                  ) : (
                    isEditing ? "Update Subscription" : "Add Subscription"
                  )}
                </Button>
                <Button type="button" variant="outline" asChild disabled={isSubmitting}>
                  <Link href="/">Cancel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              ROI Preview
              <ROITooltip />
            </CardTitle>
            <CardDescription>See how your subscription will be scored</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {previewROI !== null && previewStatus ? (
              <>
                <div className="text-center">
                  <div className="text-6xl font-bold mb-2">{previewROI}</div>
                  <p className="text-muted-foreground">ROI Score</p>
                </div>
                <ROIProgress score={previewROI} size="lg" showLabel={false} />
                <div className="flex justify-center">
                  <StatusBadge status={previewStatus} />
                </div>
                <div className="text-sm text-muted-foreground text-center">
                  {previewStatus === "good" && "This subscription has a strong ROI. Keep it!"}
                  {previewStatus === "review" && "Consider reviewing this subscription for potential optimization."}
                  {previewStatus === "cut" && "This subscription may not be worth the cost. Consider canceling."}
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Fill in the form to see your ROI preview</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

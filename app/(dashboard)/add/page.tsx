"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ROIProgress } from "@/components/roi-progress"
import { StatusBadge } from "@/components/status-badge"
import {
  fetchSubscriptionById,
  createSubscription,
  updateSubscription as apiUpdateSubscription,
  checkDuplicateName,
} from "@/lib/api"
import { calculateROIScore, getStatusFromScore } from "@/lib/scoring"
import { CATEGORIES } from "@/lib/constants"
import type { UsageFrequency, Importance } from "@/lib/types"
import { ArrowLeft, AlertCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { ROITooltip } from "@/components/roi-tooltip"

export default function AddSubscriptionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get("edit")
  const isEditing = !!editId

  const [name, setName] = useState("")
  const [category, setCategory] = useState("")
  const [monthlyCost, setMonthlyCost] = useState("")
  const [usageFrequency, setUsageFrequency] = useState<UsageFrequency | "">("")
  const [importance, setImportance] = useState<Importance | "">("")
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
            setMonthlyCost(subscription.monthlyCost.toString())
            setUsageFrequency(subscription.usageFrequency)
            setImportance(subscription.importance)
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

  // Calculate preview ROI
  const previewROI =
    usageFrequency && importance && monthlyCost
      ? calculateROIScore(
          usageFrequency as UsageFrequency,
          importance as Importance,
          Number.parseFloat(monthlyCost) || 0,
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
      if (isEditing && editId) {
        await apiUpdateSubscription(editId, {
          name: name.trim(),
          category,
          monthlyCost: Number.parseFloat(monthlyCost),
          usageFrequency: usageFrequency as UsageFrequency,
          importance: importance as Importance,
        })
        toast.success("Subscription updated", {
          description: `${name} has been updated successfully.`,
        })
      } else {
        await createSubscription({
          name: name.trim(),
          category,
          monthlyCost: Number.parseFloat(monthlyCost),
          usageFrequency: usageFrequency as UsageFrequency,
          importance: importance as Importance,
        })
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

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
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

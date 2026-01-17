"use client"

import { useState, useEffect, Suspense, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { resetSubscriptions as apiResetSubscriptions, fetchSettings, updateSettings } from "@/lib/api"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { UpgradeModal } from "@/components/upgrade-modal"
import { ProStatusBadge } from "@/components/pro-badge"
import { ProSwitchGate } from "@/components/pro-gate"
import { createPortalSession } from "@/lib/stripe-client"
import { toast } from "sonner"
import { useTheme } from "next-themes"
import { Moon, Sun, Monitor, RotateCcw, Sparkles, CreditCard, AlertTriangle, Lock, Loader2 } from "lucide-react"
import type { ProStatus } from "@/lib/pro"

interface UserProStatus {
  isPro: boolean
  proStatus: ProStatus
  stripeCurrentPeriodEnd: string | null
}

function SettingsContent() {
  const { theme, setTheme } = useTheme()
  const searchParams = useSearchParams()
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false)
  const [notifications, setNotifications] = useState(true)
  const [emailReports, setEmailReports] = useState(false)
  const [emailAddress, setEmailAddress] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isResetting, setIsResetting] = useState(false)
  const [userProStatus, setUserProStatus] = useState<UserProStatus | null>(null)
  const [isPortalLoading, setIsPortalLoading] = useState(false)

  // Load settings and user status from API on mount
  const loadSettings = useCallback(async () => {
    try {
      const [settings, statusResponse] = await Promise.all([
        fetchSettings(),
        fetch("/api/user/status").then((res) => res.json()),
      ])
      setNotifications(settings.pushNotifications)
      setEmailReports(settings.emailReports)
      setEmailAddress(settings.emailAddress)

      if (statusResponse.proStatus) {
        setUserProStatus(statusResponse.proStatus)
      }
    } catch (error) {
      console.error("Failed to load settings:", error)
      toast.error("Failed to load settings")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  // Handle Stripe redirect
  useEffect(() => {
    const success = searchParams.get("success")
    const canceled = searchParams.get("canceled")

    if (success === "true") {
      toast.success("Welcome to SubSense Pro!", {
        description: "Your subscription is now active. Enjoy the premium features!",
      })
      // Clear the URL params
      window.history.replaceState({}, "", "/settings")
    } else if (canceled === "true") {
      toast.info("Checkout canceled", {
        description: "No worries, you can upgrade anytime.",
      })
      window.history.replaceState({}, "", "/settings")
    }
  }, [searchParams])

  const handleNotificationsChange = async (checked: boolean) => {
    setNotifications(checked)
    try {
      await updateSettings({ pushNotifications: checked })
      toast.success(checked ? "Notifications enabled" : "Notifications disabled")
    } catch (error) {
      console.error("Failed to update settings:", error)
      setNotifications(!checked) // Revert on error
      toast.error("Failed to update settings")
    }
  }

  const handleEmailReportsChange = async (checked: boolean) => {
    setEmailReports(checked)
    try {
      await updateSettings({ emailReports: checked })
      if (checked) {
        toast.success("Email reports enabled", {
          description: "You'll receive weekly ROI summaries (coming soon)",
        })
      } else {
        toast.success("Email reports disabled")
      }
    } catch (error) {
      console.error("Failed to update settings:", error)
      setEmailReports(!checked) // Revert on error
      toast.error("Failed to update settings")
    }
  }

  const handleEmailChange = async (value: string) => {
    setEmailAddress(value)
    // Debounce the API call
    const timeoutId = setTimeout(async () => {
      try {
        await updateSettings({ emailAddress: value })
      } catch (error) {
        console.error("Failed to update email:", error)
      }
    }, 500)
    return () => clearTimeout(timeoutId)
  }

  const handleReset = async () => {
    setIsResetting(true)
    try {
      await apiResetSubscriptions()
      setResetDialogOpen(false)
      toast.success("Data reset", {
        description: "All subscriptions have been reset to default.",
      })
    } catch (error) {
      console.error("Failed to reset data:", error)
      toast.error("Failed to reset data")
    } finally {
      setIsResetting(false)
    }
  }

  const handleManageSubscription = async () => {
    setIsPortalLoading(true)
    try {
      const portalUrl = await createPortalSession()
      if (portalUrl) {
        window.location.href = portalUrl
      }
    } catch (error) {
      console.error("Portal error:", error)
      toast.error("Failed to open billing portal", {
        description: error instanceof Error ? error.message : "Please try again",
      })
    } finally {
      setIsPortalLoading(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const isPro = userProStatus?.isPro ?? false
  const proStatus = userProStatus?.proStatus ?? "FREE"

  if (isLoading) {
    return <SettingsPageSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your preferences and account settings</p>
      </div>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize how SubSense looks on your device</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Theme</Label>
              <p className="text-sm text-muted-foreground">Select your preferred color scheme</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant={theme === "light" ? "default" : "outline"}
              size="sm"
              onClick={() => setTheme("light")}
              className="flex-1"
            >
              <Sun className="h-4 w-4 mr-2" />
              Light
            </Button>
            <Button
              variant={theme === "dark" ? "default" : "outline"}
              size="sm"
              onClick={() => setTheme("dark")}
              className="flex-1"
            >
              <Moon className="h-4 w-4 mr-2" />
              Dark
            </Button>
            <Button
              variant={theme === "system" ? "default" : "outline"}
              size="sm"
              onClick={() => setTheme("system")}
              className="flex-1"
            >
              <Monitor className="h-4 w-4 mr-2" />
              System
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Configure how you receive updates and alerts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notifications">Push Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive alerts about subscription changes</p>
            </div>
            <Switch id="notifications" checked={notifications} onCheckedChange={handleNotificationsChange} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5 flex items-center gap-2">
              {!isPro && <Lock className="h-4 w-4 text-muted-foreground" />}
              <div>
                <Label htmlFor="email-reports">Email Reports</Label>
                <p className="text-sm text-muted-foreground">
                  Weekly summary of your subscription ROI
                  {!isPro && <span className="text-amber-500"> (Pro)</span>}
                </p>
              </div>
            </div>
            <ProSwitchGate
              isPro={isPro}
              checked={emailReports}
              onCheckedChange={handleEmailReportsChange}
              email={emailAddress}
            >
              <Switch
                id="email-reports"
                checked={emailReports}
                onCheckedChange={handleEmailReportsChange}
                disabled={!isPro}
              />
            </ProSwitchGate>
          </div>
        </CardContent>
      </Card>

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Manage your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={emailAddress}
              onChange={(e) => handleEmailChange(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {emailReports
                ? "Weekly reports will be sent to this address"
                : "Enter your email to receive reports"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Past Due Warning Banner */}
      {proStatus === "PAST_DUE" && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Your payment is past due. Please update your payment method to continue enjoying Pro features.</span>
            <Button variant="outline" size="sm" onClick={handleManageSubscription} disabled={isPortalLoading}>
              {isPortalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Payment"}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Billing */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Billing</CardTitle>
              <CardDescription>Manage your subscription and payment methods</CardDescription>
            </div>
            <ProStatusBadge status={proStatus} />
          </div>
        </CardHeader>
        <CardContent>
          {isPro ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">SubSense Pro</p>
                  <p className="text-sm text-muted-foreground">$4.99/month</p>
                </div>
                {userProStatus?.stripeCurrentPeriodEnd && (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {proStatus === "CANCELED" ? "Access until" : "Renews on"}
                    </p>
                    <p className="text-sm font-medium">
                      {formatDate(userProStatus.stripeCurrentPeriodEnd)}
                    </p>
                  </div>
                )}
              </div>
              <Separator />
              <Button
                variant="outline"
                className="w-full"
                onClick={handleManageSubscription}
                disabled={isPortalLoading}
              >
                {isPortalLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Opening portal...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Manage Subscription
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-6 text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Unlock advanced features with SubSense Pro
              </p>
              <Button variant="default" onClick={() => setUpgradeModalOpen(true)}>
                <Sparkles className="mr-2 h-4 w-4" />
                Upgrade to Pro
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>Manage your subscription data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Reset All Data</Label>
              <p className="text-sm text-muted-foreground">Clear all subscriptions and reset to default demo data</p>
            </div>
            <Button variant="destructive" onClick={() => setResetDialogOpen(true)} disabled={isResetting}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        open={resetDialogOpen}
        onOpenChange={setResetDialogOpen}
        title="Reset All Data"
        description="This will delete all your subscriptions and reset the app to its default state with sample data. This action cannot be undone."
        confirmLabel="Reset Data"
        onConfirm={handleReset}
        variant="destructive"
      />

      {/* Upgrade Modal */}
      <UpgradeModal
        open={upgradeModalOpen}
        onOpenChange={setUpgradeModalOpen}
        defaultEmail={emailAddress}
      />
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsPageSkeleton />}>
      <SettingsContent />
    </Suspense>
  )
}

function SettingsPageSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-9 w-32 bg-muted animate-pulse rounded" />
        <div className="h-5 w-64 bg-muted animate-pulse rounded mt-1" />
      </div>
      {[...Array(4)].map((_, i) => (
        <div key={i} className="rounded-lg border p-6">
          <div className="h-6 w-32 bg-muted animate-pulse rounded mb-2" />
          <div className="h-4 w-48 bg-muted animate-pulse rounded" />
        </div>
      ))}
    </div>
  )
}

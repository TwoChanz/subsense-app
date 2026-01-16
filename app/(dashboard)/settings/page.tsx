"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { resetSubscriptions } from "@/lib/store"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { toast } from "sonner"
import { useTheme } from "next-themes"
import { Moon, Sun, Monitor, RotateCcw } from "lucide-react"

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [notifications, setNotifications] = useState(true)
  const [emailReports, setEmailReports] = useState(false)

  const handleReset = () => {
    resetSubscriptions()
    setResetDialogOpen(false)
    toast.success("Data reset", {
      description: "All subscriptions have been reset to default.",
    })
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
            <Switch id="notifications" checked={notifications} onCheckedChange={setNotifications} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-reports">Email Reports</Label>
              <p className="text-sm text-muted-foreground">Weekly summary of your subscription ROI</p>
            </div>
            <Switch id="email-reports" checked={emailReports} onCheckedChange={setEmailReports} />
          </div>
        </CardContent>
      </Card>

      {/* Account (Placeholder) */}
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Manage your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" disabled />
            <p className="text-xs text-muted-foreground">Account features coming soon</p>
          </div>
        </CardContent>
      </Card>

      {/* Billing (Placeholder) */}
      <Card>
        <CardHeader>
          <CardTitle>Billing</CardTitle>
          <CardDescription>Manage your subscription and payment methods</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed border-border p-6 text-center">
            <p className="text-sm text-muted-foreground">Billing features will be available in a future update.</p>
            <Button variant="outline" className="mt-4 bg-transparent" disabled>
              Upgrade to Pro
            </Button>
          </div>
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
            <Button variant="destructive" onClick={() => setResetDialogOpen(true)}>
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
    </div>
  )
}

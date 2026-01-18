import type { Subscription, ActionItem, ActionType, CancellationGuide } from "./types"
import { generateId } from "./constants"
import { isActionSnoozed } from "./user-store"

// Generate action items from subscriptions
export function generateActionItems(subscriptions: Subscription[]): ActionItem[] {
  const actions: ActionItem[] = []
  const now = new Date()

  for (const sub of subscriptions) {
    // 1. Cancel recommendations (status = "cut")
    if (sub.status === "cut") {
      actions.push({
        id: `cancel-${sub.id}`,
        subscriptionId: sub.id,
        subscriptionName: sub.name,
        type: "cancel",
        title: `Cancel ${sub.name}`,
        description: `ROI score of ${sub.roiScore}. ${getUsageDescription(sub)}`,
        potentialSavings: sub.monthlyCost,
        priority: sub.monthlyCost > 30 ? "high" : "medium",
        createdAt: new Date(),
      })
    }

    // 2. Review recommendations (status = "review" and low usage)
    if (sub.status === "review" && (sub.usageFrequency === "rare" || sub.usageFrequency === "monthly")) {
      actions.push({
        id: `review-${sub.id}`,
        subscriptionId: sub.id,
        subscriptionName: sub.name,
        type: "review",
        title: `Review ${sub.name}`,
        description: `${sub.usageFrequency === "rare" ? "Rarely" : "Only monthly"} used. Consider if you still need it.`,
        potentialSavings: sub.monthlyCost * 0.5, // Potential downgrade savings
        priority: "medium",
        createdAt: new Date(),
      })
    }

    // 3. Trial ending reminders
    if (sub.billingCycle === "trial" && sub.trialEndDate) {
      const trialEnd = new Date(sub.trialEndDate)
      const daysUntilEnd = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      if (daysUntilEnd > 0 && daysUntilEnd <= 7) {
        actions.push({
          id: `trial-${sub.id}`,
          subscriptionId: sub.id,
          subscriptionName: sub.name,
          type: "trial_ending",
          title: `Trial ending: ${sub.name}`,
          description: `Trial ends in ${daysUntilEnd} day${daysUntilEnd === 1 ? "" : "s"}. Decide if you want to keep it.`,
          dueDate: trialEnd,
          potentialSavings: sub.monthlyCost,
          priority: daysUntilEnd <= 3 ? "high" : "medium",
          createdAt: new Date(),
        })
      } else if (daysUntilEnd <= 0) {
        actions.push({
          id: `trial-expired-${sub.id}`,
          subscriptionId: sub.id,
          subscriptionName: sub.name,
          type: "trial_ending",
          title: `Trial expired: ${sub.name}`,
          description: "Trial has ended. You may be charged if you haven't canceled.",
          dueDate: trialEnd,
          potentialSavings: sub.monthlyCost,
          priority: "high",
          createdAt: new Date(),
        })
      }
    }

    // 4. Upcoming renewal reminders (within 7 days)
    if (sub.renewalDate && sub.billingCycle !== "trial") {
      const renewalDate = new Date(sub.renewalDate)
      const daysUntilRenewal = Math.ceil((renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      if (daysUntilRenewal > 0 && daysUntilRenewal <= 7) {
        // Only add if status is not "good" or cost is significant
        if (sub.status !== "good" || sub.monthlyCost > 20) {
          actions.push({
            id: `renewal-${sub.id}`,
            subscriptionId: sub.id,
            subscriptionName: sub.name,
            type: "renewal_reminder",
            title: `${sub.name} renews soon`,
            description: `Renews in ${daysUntilRenewal} day${daysUntilRenewal === 1 ? "" : "s"} for $${sub.monthlyCost.toFixed(2)}${sub.billingCycle === "annual" ? "/yr" : "/mo"}.`,
            dueDate: renewalDate,
            priority: sub.status === "cut" ? "high" : "low",
            createdAt: new Date(),
          })
        }
      }
    }

    // 5. Downgrade suggestions for expensive subscriptions with alternatives
    if (sub.monthlyCost > 40 && sub.status === "review") {
      const downgradeInfo = getDowngradeInfo(sub.name)
      if (downgradeInfo) {
        actions.push({
          id: `downgrade-${sub.id}`,
          subscriptionId: sub.id,
          subscriptionName: sub.name,
          type: "downgrade",
          title: `Downgrade ${sub.name}`,
          description: downgradeInfo.suggestion,
          potentialSavings: downgradeInfo.savings,
          priority: "medium",
          createdAt: new Date(),
        })
      }
    }
  }

  // Sort by priority and then by potential savings
  const priorityOrder = { high: 0, medium: 1, low: 2 }
  actions.sort((a, b) => {
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
    if (priorityDiff !== 0) return priorityDiff
    return (b.potentialSavings || 0) - (a.potentialSavings || 0)
  })

  // Filter out snoozed actions
  return actions.filter(action => !isActionSnoozed(action.id))
}

// Get usage description based on subscription data
function getUsageDescription(sub: Subscription): string {
  const usageLabels: Record<string, string> = {
    daily: "Used daily",
    weekly: "Used weekly",
    monthly: "Used monthly",
    rare: "Rarely used",
  }
  const importanceLabels: Record<string, string> = {
    high: "marked as essential",
    medium: "moderate importance",
    low: "low importance",
  }
  return `${usageLabels[sub.usageFrequency]}, ${importanceLabels[sub.importance]}.`
}

// Get downgrade suggestions for known services
function getDowngradeInfo(serviceName: string): { suggestion: string; savings: number } | null {
  const downgrades: Record<string, { suggestion: string; savings: number }> = {
    "Adobe Creative Cloud": {
      suggestion: "Downgrade to Photography Plan ($9.99/mo) if you only use Photoshop/Lightroom",
      savings: 45,
    },
    "Microsoft 365": {
      suggestion: "Consider Microsoft 365 Basic ($6/mo) if you don't need desktop apps",
      savings: 7,
    },
    "Spotify": {
      suggestion: "Try Spotify Free with ads, or family plan to split costs",
      savings: 5,
    },
    "Netflix": {
      suggestion: "Downgrade to Standard plan or consider ad-supported tier",
      savings: 7,
    },
    "YouTube Premium": {
      suggestion: "Family plan splits cost among 6 members",
      savings: 8,
    },
    "Dropbox": {
      suggestion: "Use free tier (2GB) or switch to Google Drive (15GB free)",
      savings: 12,
    },
    "Zoom Pro": {
      suggestion: "Free tier allows 40-min meetings. Sufficient for most uses",
      savings: 16,
    },
    "Slack": {
      suggestion: "Free tier keeps 90 days of messages. Often sufficient for small teams",
      savings: 8,
    },
    "Notion": {
      suggestion: "Free personal plan is very generous. Evaluate team needs",
      savings: 8,
    },
    "Canva Pro": {
      suggestion: "Free tier has many templates. Pro mainly adds brand kit features",
      savings: 13,
    },
    "Grammarly": {
      suggestion: "Free version catches most errors. Premium mainly for style/tone",
      savings: 12,
    },
  }

  return downgrades[serviceName] || null
}

// Cancellation guide database
const CANCELLATION_GUIDES: Record<string, CancellationGuide> = {
  "Netflix": {
    serviceName: "Netflix",
    difficulty: "easy",
    estimatedTime: "2 minutes",
    steps: [
      { stepNumber: 1, instruction: "Go to netflix.com/cancelplan", link: "https://netflix.com/cancelplan" },
      { stepNumber: 2, instruction: "Click 'Cancel Membership'" },
      { stepNumber: 3, instruction: "Confirm cancellation" },
    ],
    tips: ["You can keep watching until your billing period ends", "Your profile and history are saved for 10 months if you rejoin"],
    canCancelOnline: true,
    refundPolicy: "No refunds for partial months",
  },
  "Spotify": {
    serviceName: "Spotify",
    difficulty: "easy",
    estimatedTime: "2 minutes",
    steps: [
      { stepNumber: 1, instruction: "Go to your account page", link: "https://www.spotify.com/account" },
      { stepNumber: 2, instruction: "Click 'Your plan'" },
      { stepNumber: 3, instruction: "Click 'Cancel Premium'" },
      { stepNumber: 4, instruction: "Confirm cancellation" },
    ],
    tips: ["Your playlists and saved music remain accessible on the free tier"],
    canCancelOnline: true,
  },
  "Adobe Creative Cloud": {
    serviceName: "Adobe Creative Cloud",
    difficulty: "painful",
    estimatedTime: "10-15 minutes",
    steps: [
      { stepNumber: 1, instruction: "Sign in to your Adobe account", link: "https://account.adobe.com" },
      { stepNumber: 2, instruction: "Go to Plans & Products" },
      { stepNumber: 3, instruction: "Click 'Manage plan' on your subscription" },
      { stepNumber: 4, instruction: "Select 'Cancel your plan'" },
      { stepNumber: 5, instruction: "Complete the cancellation survey" },
      { stepNumber: 6, instruction: "Confirm and pay any early termination fee if applicable" },
    ],
    tips: [
      "Annual plans have early termination fees (50% of remaining months)",
      "Consider switching to Photography Plan first to reduce fees",
      "Download all files before canceling - you lose cloud storage access",
    ],
    canCancelOnline: true,
    refundPolicy: "Early termination fee for annual plans",
  },
  "Amazon Prime": {
    serviceName: "Amazon Prime",
    difficulty: "moderate",
    estimatedTime: "5 minutes",
    steps: [
      { stepNumber: 1, instruction: "Go to Amazon Prime membership settings", link: "https://www.amazon.com/mc" },
      { stepNumber: 2, instruction: "Click 'End Membership'" },
      { stepNumber: 3, instruction: "Choose end date (immediate or end of period)" },
      { stepNumber: 4, instruction: "Confirm cancellation" },
    ],
    tips: [
      "You can get a prorated refund if you haven't used Prime benefits",
      "Consider if the free shipping alone is worth it for your order frequency",
    ],
    canCancelOnline: true,
    refundPolicy: "Prorated refund available if unused",
  },
  "Hulu": {
    serviceName: "Hulu",
    difficulty: "easy",
    estimatedTime: "3 minutes",
    steps: [
      { stepNumber: 1, instruction: "Go to your Hulu account page", link: "https://secure.hulu.com/account" },
      { stepNumber: 2, instruction: "Click 'Cancel' under 'Your Subscription'" },
      { stepNumber: 3, instruction: "Select cancellation reason" },
      { stepNumber: 4, instruction: "Confirm cancellation" },
    ],
    tips: ["You retain access until the end of your billing period"],
    canCancelOnline: true,
  },
  "Disney+": {
    serviceName: "Disney+",
    difficulty: "easy",
    estimatedTime: "2 minutes",
    steps: [
      { stepNumber: 1, instruction: "Go to disneyplus.com/account", link: "https://www.disneyplus.com/account" },
      { stepNumber: 2, instruction: "Click on your subscription" },
      { stepNumber: 3, instruction: "Click 'Cancel Subscription'" },
      { stepNumber: 4, instruction: "Confirm cancellation" },
    ],
    tips: ["Watch list and profiles are saved if you resubscribe"],
    canCancelOnline: true,
  },
  "Coursera Plus": {
    serviceName: "Coursera Plus",
    difficulty: "easy",
    estimatedTime: "3 minutes",
    steps: [
      { stepNumber: 1, instruction: "Go to Coursera settings", link: "https://www.coursera.org/account-settings" },
      { stepNumber: 2, instruction: "Click 'Manage Subscription'" },
      { stepNumber: 3, instruction: "Click 'Cancel Subscription'" },
      { stepNumber: 4, instruction: "Complete survey and confirm" },
    ],
    tips: [
      "Download certificates before canceling",
      "Audit mode lets you continue learning for free (no certificates)",
    ],
    canCancelOnline: true,
    refundPolicy: "7-day refund window for new subscriptions",
  },
  "Zoom Pro": {
    serviceName: "Zoom Pro",
    difficulty: "moderate",
    estimatedTime: "5 minutes",
    steps: [
      { stepNumber: 1, instruction: "Sign in to zoom.us", link: "https://zoom.us/account" },
      { stepNumber: 2, instruction: "Go to Account Management > Billing" },
      { stepNumber: 3, instruction: "Click 'Cancel Subscription'" },
      { stepNumber: 4, instruction: "Follow prompts to confirm" },
    ],
    tips: [
      "Free tier allows 40-minute meetings with up to 100 participants",
      "Consider if longer meetings are truly necessary",
    ],
    canCancelOnline: true,
  },
  "YouTube Premium": {
    serviceName: "YouTube Premium",
    difficulty: "easy",
    estimatedTime: "2 minutes",
    steps: [
      { stepNumber: 1, instruction: "Go to youtube.com/paid_memberships", link: "https://www.youtube.com/paid_memberships" },
      { stepNumber: 2, instruction: "Click 'Manage membership'" },
      { stepNumber: 3, instruction: "Click 'Deactivate'" },
      { stepNumber: 4, instruction: "Select 'Continue to cancel'" },
    ],
    tips: [
      "YouTube Music Premium is included - both will be canceled",
      "Downloaded videos will be removed after cancellation",
      "Consider family plan if sharing with others",
    ],
    canCancelOnline: true,
  },
  "Apple Music": {
    serviceName: "Apple Music",
    difficulty: "easy",
    estimatedTime: "3 minutes",
    steps: [
      { stepNumber: 1, instruction: "Open Settings on your iPhone/iPad, or Music app on Mac" },
      { stepNumber: 2, instruction: "Tap your name > Subscriptions" },
      { stepNumber: 3, instruction: "Select Apple Music" },
      { stepNumber: 4, instruction: "Tap 'Cancel Subscription'" },
    ],
    tips: [
      "Your library and playlists are saved if you resubscribe",
      "Can also cancel via appleid.apple.com",
      "Downloaded music will be removed",
    ],
    canCancelOnline: true,
  },
  "HBO Max": {
    serviceName: "HBO Max",
    difficulty: "easy",
    estimatedTime: "3 minutes",
    steps: [
      { stepNumber: 1, instruction: "Go to max.com and sign in", link: "https://www.max.com" },
      { stepNumber: 2, instruction: "Click your profile icon > Settings" },
      { stepNumber: 3, instruction: "Select 'Subscription'" },
      { stepNumber: 4, instruction: "Click 'Cancel Subscription'" },
    ],
    tips: [
      "If subscribed through a cable provider, cancel through them instead",
      "Access continues until end of billing period",
    ],
    canCancelOnline: true,
  },
  "Paramount+": {
    serviceName: "Paramount+",
    difficulty: "easy",
    estimatedTime: "3 minutes",
    steps: [
      { stepNumber: 1, instruction: "Go to paramountplus.com/account", link: "https://www.paramountplus.com/account" },
      { stepNumber: 2, instruction: "Click 'Cancel Subscription'" },
      { stepNumber: 3, instruction: "Select reason and confirm" },
    ],
    tips: [
      "Check if bundled with other services before canceling",
      "Annual plans may have cancellation restrictions",
    ],
    canCancelOnline: true,
  },
  "Peacock": {
    serviceName: "Peacock",
    difficulty: "easy",
    estimatedTime: "3 minutes",
    steps: [
      { stepNumber: 1, instruction: "Go to peacocktv.com/account", link: "https://www.peacocktv.com/account" },
      { stepNumber: 2, instruction: "Click 'Subscription and Billing'" },
      { stepNumber: 3, instruction: "Select 'Cancel Peacock Premium'" },
      { stepNumber: 4, instruction: "Confirm cancellation" },
    ],
    tips: [
      "Free tier still available with ads after canceling Premium",
      "If subscribed via Xfinity, cancel through Xfinity account",
    ],
    canCancelOnline: true,
  },
  "Microsoft 365": {
    serviceName: "Microsoft 365",
    difficulty: "moderate",
    estimatedTime: "5 minutes",
    steps: [
      { stepNumber: 1, instruction: "Go to account.microsoft.com/services", link: "https://account.microsoft.com/services" },
      { stepNumber: 2, instruction: "Find Microsoft 365 and click 'Manage'" },
      { stepNumber: 3, instruction: "Click 'Cancel' or 'Turn off recurring billing'" },
      { stepNumber: 4, instruction: "Follow prompts to confirm" },
    ],
    tips: [
      "You lose access to premium Office apps but can still use free web versions",
      "OneDrive storage drops to 5GB - download files first",
      "Consider if you only need the free web versions",
    ],
    canCancelOnline: true,
    refundPolicy: "Prorated refund within first 30 days",
  },
  "Dropbox": {
    serviceName: "Dropbox",
    difficulty: "moderate",
    estimatedTime: "5 minutes",
    steps: [
      { stepNumber: 1, instruction: "Go to dropbox.com/account", link: "https://www.dropbox.com/account" },
      { stepNumber: 2, instruction: "Click 'Plan' tab" },
      { stepNumber: 3, instruction: "Click 'Cancel plan' at bottom" },
      { stepNumber: 4, instruction: "Complete survey and confirm" },
    ],
    tips: [
      "You'll downgrade to free 2GB Basic plan",
      "Download all files before canceling if over 2GB",
      "Shared folders may become inaccessible to collaborators",
    ],
    canCancelOnline: true,
  },
  "Google One": {
    serviceName: "Google One",
    difficulty: "easy",
    estimatedTime: "2 minutes",
    steps: [
      { stepNumber: 1, instruction: "Go to one.google.com/settings", link: "https://one.google.com/settings" },
      { stepNumber: 2, instruction: "Click 'Cancel membership'" },
      { stepNumber: 3, instruction: "Confirm cancellation" },
    ],
    tips: [
      "Storage reverts to free 15GB shared across Google services",
      "You won't be able to upload new files if over limit",
      "Existing files won't be deleted but new syncs will fail",
    ],
    canCancelOnline: true,
  },
  "iCloud+": {
    serviceName: "iCloud+",
    difficulty: "easy",
    estimatedTime: "3 minutes",
    steps: [
      { stepNumber: 1, instruction: "On iPhone/iPad: Settings > [Your Name] > iCloud > Manage Storage" },
      { stepNumber: 2, instruction: "Tap 'Change Storage Plan'" },
      { stepNumber: 3, instruction: "Tap 'Downgrade Options'" },
      { stepNumber: 4, instruction: "Select 'Free 5GB' plan" },
    ],
    tips: [
      "Download photos and files before downgrading",
      "Can also manage at icloud.com/settings",
      "Private Relay and Hide My Email features will stop working",
    ],
    canCancelOnline: true,
  },
  "LinkedIn Premium": {
    serviceName: "LinkedIn Premium",
    difficulty: "moderate",
    estimatedTime: "5 minutes",
    steps: [
      { stepNumber: 1, instruction: "Go to linkedin.com/mypreferences/settings", link: "https://www.linkedin.com/mypreferences/settings" },
      { stepNumber: 2, instruction: "Click 'Subscriptions and payments'" },
      { stepNumber: 3, instruction: "Click 'Manage Premium subscription'" },
      { stepNumber: 4, instruction: "Click 'Cancel subscription'" },
    ],
    tips: [
      "InMail credits expire after cancellation",
      "You lose access to 'Who viewed your profile' details",
      "Learning courses will become inaccessible",
    ],
    canCancelOnline: true,
    refundPolicy: "Prorated refund within first 30 days for annual plans",
  },
  "New York Times": {
    serviceName: "New York Times",
    difficulty: "moderate",
    estimatedTime: "5-10 minutes",
    steps: [
      { stepNumber: 1, instruction: "Go to nytimes.com/subscription/manage", link: "https://www.nytimes.com/subscription/manage" },
      { stepNumber: 2, instruction: "Click 'Cancel Subscription'" },
      { stepNumber: 3, instruction: "You may be offered a retention discount - decline if you want to cancel" },
      { stepNumber: 4, instruction: "Confirm cancellation" },
    ],
    tips: [
      "They will try to offer you discounts to stay",
      "Phone cancellation may be required for some older plans",
      "Access continues until end of billing period",
    ],
    canCancelOnline: true,
  },
  "Audible": {
    serviceName: "Audible",
    difficulty: "moderate",
    estimatedTime: "5 minutes",
    steps: [
      { stepNumber: 1, instruction: "Go to audible.com/account", link: "https://www.audible.com/account" },
      { stepNumber: 2, instruction: "Click 'Account Details'" },
      { stepNumber: 3, instruction: "Select 'Cancel membership'" },
      { stepNumber: 4, instruction: "Complete the cancellation flow (they will offer discounts)" },
    ],
    tips: [
      "You keep books you've purchased forever",
      "Unused credits expire 6 months after cancellation",
      "Use remaining credits before canceling",
    ],
    canCancelOnline: true,
    refundPolicy: "365-day return policy on audiobooks",
  },
  "NordVPN": {
    serviceName: "NordVPN",
    difficulty: "easy",
    estimatedTime: "3 minutes",
    steps: [
      { stepNumber: 1, instruction: "Log in to my.nordaccount.com", link: "https://my.nordaccount.com" },
      { stepNumber: 2, instruction: "Go to 'Billing'" },
      { stepNumber: 3, instruction: "Click 'Cancel automatic payments'" },
      { stepNumber: 4, instruction: "Confirm cancellation" },
    ],
    tips: [
      "30-day money-back guarantee for new subscribers",
      "Service continues until end of paid period",
      "Consider pausing instead of full cancellation",
    ],
    canCancelOnline: true,
    refundPolicy: "30-day money-back guarantee",
  },
  "ExpressVPN": {
    serviceName: "ExpressVPN",
    difficulty: "easy",
    estimatedTime: "3 minutes",
    steps: [
      { stepNumber: 1, instruction: "Go to expressvpn.com/subscriptions", link: "https://www.expressvpn.com/subscriptions" },
      { stepNumber: 2, instruction: "Sign in to your account" },
      { stepNumber: 3, instruction: "Click 'Manage subscription settings'" },
      { stepNumber: 4, instruction: "Turn off auto-renewal" },
    ],
    tips: [
      "30-day money-back guarantee available",
      "Contact live chat for refund requests",
    ],
    canCancelOnline: true,
    refundPolicy: "30-day money-back guarantee",
  },
  "Notion": {
    serviceName: "Notion",
    difficulty: "easy",
    estimatedTime: "2 minutes",
    steps: [
      { stepNumber: 1, instruction: "Go to Settings & Members in Notion" },
      { stepNumber: 2, instruction: "Click 'Upgrade' or 'Plans'" },
      { stepNumber: 3, instruction: "Click 'Downgrade' at the bottom" },
      { stepNumber: 4, instruction: "Confirm downgrade to free plan" },
    ],
    tips: [
      "Free plan is very generous for personal use",
      "Team features will be disabled",
      "Export workspace before downgrading if needed",
    ],
    canCancelOnline: true,
  },
  "Canva Pro": {
    serviceName: "Canva Pro",
    difficulty: "easy",
    estimatedTime: "3 minutes",
    steps: [
      { stepNumber: 1, instruction: "Go to canva.com/settings/billing", link: "https://www.canva.com/settings/billing" },
      { stepNumber: 2, instruction: "Click your subscription plan" },
      { stepNumber: 3, instruction: "Click 'Cancel subscription'" },
      { stepNumber: 4, instruction: "Complete survey and confirm" },
    ],
    tips: [
      "You'll lose access to premium templates and features",
      "Download designs using premium elements before canceling",
      "Free tier still has many useful features",
    ],
    canCancelOnline: true,
  },
  "Grammarly Premium": {
    serviceName: "Grammarly Premium",
    difficulty: "easy",
    estimatedTime: "3 minutes",
    steps: [
      { stepNumber: 1, instruction: "Go to account.grammarly.com/subscription", link: "https://account.grammarly.com/subscription" },
      { stepNumber: 2, instruction: "Click 'Cancel Subscription'" },
      { stepNumber: 3, instruction: "Select reason and confirm" },
    ],
    tips: [
      "Free version catches most basic errors",
      "Premium mainly adds style and tone suggestions",
      "Browser extension still works on free tier",
    ],
    canCancelOnline: true,
  },
  "Slack Pro": {
    serviceName: "Slack Pro",
    difficulty: "moderate",
    estimatedTime: "5 minutes",
    steps: [
      { stepNumber: 1, instruction: "Go to your workspace's billing page: [workspace].slack.com/admin/billing" },
      { stepNumber: 2, instruction: "Click 'Change plan'" },
      { stepNumber: 3, instruction: "Select 'Downgrade to Free'" },
      { stepNumber: 4, instruction: "Confirm downgrade" },
    ],
    tips: [
      "Free tier keeps 90 days of message history",
      "Integrations will be limited to 10",
      "Export data before downgrading if needed",
    ],
    canCancelOnline: true,
  },
  "ChatGPT Plus": {
    serviceName: "ChatGPT Plus",
    difficulty: "easy",
    estimatedTime: "2 minutes",
    steps: [
      { stepNumber: 1, instruction: "Go to chat.openai.com", link: "https://chat.openai.com" },
      { stepNumber: 2, instruction: "Click your profile > 'My Plan'" },
      { stepNumber: 3, instruction: "Click 'Manage my subscription'" },
      { stepNumber: 4, instruction: "Click 'Cancel Plan'" },
    ],
    tips: [
      "Free tier still provides access to GPT-3.5",
      "Your conversation history is preserved",
      "Access to GPT-4 and plugins will end",
    ],
    canCancelOnline: true,
  },
  "Peloton": {
    serviceName: "Peloton",
    difficulty: "moderate",
    estimatedTime: "5 minutes",
    steps: [
      { stepNumber: 1, instruction: "Go to members.onepeloton.com", link: "https://members.onepeloton.com" },
      { stepNumber: 2, instruction: "Click your profile > 'Subscription'" },
      { stepNumber: 3, instruction: "Click 'Cancel Subscription'" },
      { stepNumber: 4, instruction: "Complete the cancellation survey" },
    ],
    tips: [
      "Bike/Tread still work with free 'Just Run/Ride' feature",
      "Digital membership is cheaper if you only use the app",
      "Check for seasonal pause options",
    ],
    canCancelOnline: true,
  },
}

// Get cancellation guide for a service
export function getCancellationGuide(serviceName: string): CancellationGuide | null {
  return CANCELLATION_GUIDES[serviceName] || null
}

// Get generic cancellation tips
export function getGenericCancellationTips(): string[] {
  return [
    "Check your email for the original subscription confirmation - it often has cancellation instructions",
    "Look for 'Account', 'Settings', or 'Subscription' in the service's menu",
    "If you subscribed through Apple App Store or Google Play, cancel there instead",
    "Take screenshots of your cancellation confirmation",
    "Set a calendar reminder to verify the charge stops",
    "Check bank statements after the next billing date to confirm",
  ]
}

// Calculate total potential savings from action items
export function calculatePotentialSavings(actions: ActionItem[]): {
  monthly: number
  annual: number
} {
  const monthly = actions.reduce((sum, action) => sum + (action.potentialSavings || 0), 0)
  return {
    monthly,
    annual: monthly * 12,
  }
}

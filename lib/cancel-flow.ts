/**
 * Cancel flow utilities for determining the best cancel link to show.
 */

import type { ConfidenceLevel } from './vendor-confidence'

export type CancelLinkSource = 'user' | 'vendor_billing' | 'vendor_help' | 'none'

export interface CancelLinkResult {
  url: string | null
  source: CancelLinkSource
  showFeedback: boolean
  confidence: ConfidenceLevel | null
  lastVerifiedAt: Date | null
}

export interface SubscriptionWithVendor {
  id: string
  name: string
  cancelUrl?: string | null
  vendor?: {
    id: string
    name: string
    domain: string
    billingUrl?: string | null
    cancelHelpUrl?: string | null
    confidence: string
    lastVerifiedAt?: Date | null
  } | null
}

/**
 * Determines the best cancel link for a subscription.
 *
 * Priority order:
 * 1. User-provided cancelUrl (opens directly, no feedback)
 * 2. Vendor billingUrl (shows feedback prompt)
 * 3. Vendor cancelHelpUrl (shows feedback prompt)
 * 4. None (prompts user to add link or search)
 */
export function getCancelLink(subscription: SubscriptionWithVendor): CancelLinkResult {
  // Priority 1: User-provided cancel URL
  if (subscription.cancelUrl) {
    return {
      url: subscription.cancelUrl,
      source: 'user',
      showFeedback: false, // No feedback for user-provided links
      confidence: null, // N/A for user links
      lastVerifiedAt: null,
    }
  }

  // Priority 2: Vendor billing URL
  if (subscription.vendor?.billingUrl) {
    return {
      url: subscription.vendor.billingUrl,
      source: 'vendor_billing',
      showFeedback: true,
      confidence: subscription.vendor.confidence as ConfidenceLevel,
      lastVerifiedAt: subscription.vendor.lastVerifiedAt || null,
    }
  }

  // Priority 3: Vendor cancel help URL
  if (subscription.vendor?.cancelHelpUrl) {
    return {
      url: subscription.vendor.cancelHelpUrl,
      source: 'vendor_help',
      showFeedback: true,
      confidence: subscription.vendor.confidence as ConfidenceLevel,
      lastVerifiedAt: subscription.vendor.lastVerifiedAt || null,
    }
  }

  // No link available
  return {
    url: null,
    source: 'none',
    showFeedback: false,
    confidence: null,
    lastVerifiedAt: null,
  }
}

/**
 * Generates a Google search URL for "how to cancel [service name]".
 */
export function getSearchCancelUrl(serviceName: string): string {
  const query = encodeURIComponent(`how to cancel ${serviceName} subscription`)
  return `https://www.google.com/search?q=${query}`
}

/**
 * Determines whether we should prompt for feedback after opening a link.
 */
export function shouldPromptFeedback(source: CancelLinkSource): boolean {
  return source === 'vendor_billing' || source === 'vendor_help'
}

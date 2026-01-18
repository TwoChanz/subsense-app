/**
 * Vendor link confidence calculation and display utilities.
 */

export type ConfidenceLevel = 'high' | 'medium' | 'low'

export interface FeedbackStats {
  successCount: number
  failCount: number
  skipCount: number
}

/**
 * Calculates the confidence level for a vendor based on feedback statistics.
 *
 * Thresholds:
 * - high: successRate >= 0.8 AND total meaningful feedback >= 5
 * - medium: successRate >= 0.6 AND total meaningful feedback >= 3
 * - low: otherwise
 */
export function calculateVendorConfidence(stats: FeedbackStats): ConfidenceLevel {
  // Only count success and fail as "meaningful" feedback (skip doesn't indicate quality)
  const meaningfulTotal = stats.successCount + stats.failCount

  // Not enough data - default to low
  if (meaningfulTotal < 3) {
    return 'low'
  }

  const successRate = stats.successCount / meaningfulTotal

  if (successRate >= 0.8 && meaningfulTotal >= 5) {
    return 'high'
  }

  if (successRate >= 0.6) {
    return 'medium'
  }

  return 'low'
}

/**
 * Returns a user-friendly label for a confidence level.
 */
export function getConfidenceLabel(confidence: ConfidenceLevel): string {
  switch (confidence) {
    case 'high':
      return 'Verified'
    case 'medium':
      return 'Suggested'
    case 'low':
      return 'Unverified'
  }
}

/**
 * Returns a description for a confidence level.
 */
export function getConfidenceDescription(confidence: ConfidenceLevel): string {
  switch (confidence) {
    case 'high':
      return 'This link has been verified by multiple users'
    case 'medium':
      return 'This link usually works based on user feedback'
    case 'low':
      return 'This link has not been verified yet'
  }
}

/**
 * Returns the appropriate Tailwind color classes for a confidence level.
 */
export function getConfidenceColors(confidence: ConfidenceLevel): {
  bg: string
  text: string
  border: string
} {
  switch (confidence) {
    case 'high':
      return {
        bg: 'bg-green-500/10',
        text: 'text-green-600 dark:text-green-400',
        border: 'border-green-500/20',
      }
    case 'medium':
      return {
        bg: 'bg-amber-500/10',
        text: 'text-amber-600 dark:text-amber-400',
        border: 'border-amber-500/20',
      }
    case 'low':
      return {
        bg: 'bg-gray-500/10',
        text: 'text-gray-600 dark:text-gray-400',
        border: 'border-gray-500/20',
      }
  }
}

/**
 * URL sanitization utilities for vendor cancel links.
 * Ensures URLs are safe, clean, and HTTPS-only.
 */

// Unsafe query parameter patterns that should be stripped
const UNSAFE_PARAMS = [
  'token',
  'auth',
  'key',
  'secret',
  'password',
  'pwd',
  'session',
  'sid',
  'access_token',
  'refresh_token',
  'api_key',
  'apikey',
  'oauth',
  'code',
  'state',
  'nonce',
]

// URL patterns that should be rejected entirely
const UNSAFE_PATH_PATTERNS = [
  /\/api\//i,           // API endpoints
  /\/oauth/i,           // OAuth endpoints
  /\/callback/i,        // Callback URLs
  /\/auth\//i,          // Auth endpoints
  /\/login\//i,         // Login redirects with params
  /@/,                  // Email addresses in path
  /\/webhook/i,         // Webhook endpoints
]

export interface SanitizeResult {
  success: boolean
  url?: string
  error?: string
}

/**
 * Sanitizes a vendor URL by:
 * - Enforcing HTTPS
 * - Stripping query params and fragments
 * - Rejecting unsafe patterns
 */
export function sanitizeVendorUrl(rawUrl: string): SanitizeResult {
  // Basic validation
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { success: false, error: 'URL is required' }
  }

  const trimmed = rawUrl.trim()
  if (!trimmed) {
    return { success: false, error: 'URL is required' }
  }

  try {
    // Attempt to parse the URL
    let url: URL
    try {
      url = new URL(trimmed)
    } catch {
      // Try prepending https:// if no protocol
      if (!trimmed.includes('://')) {
        url = new URL(`https://${trimmed}`)
      } else {
        return { success: false, error: 'Invalid URL format' }
      }
    }

    // Enforce HTTPS (upgrade HTTP)
    if (url.protocol === 'http:') {
      url.protocol = 'https:'
    } else if (url.protocol !== 'https:') {
      return { success: false, error: 'Only HTTPS URLs are allowed' }
    }

    // Check for unsafe path patterns
    for (const pattern of UNSAFE_PATH_PATTERNS) {
      if (pattern.test(url.pathname)) {
        return { success: false, error: 'URL contains unsafe patterns' }
      }
    }

    // Check for unsafe query parameters
    for (const param of UNSAFE_PARAMS) {
      if (url.searchParams.has(param)) {
        return { success: false, error: 'URL contains authentication tokens' }
      }
    }

    // Strip all query params and fragments for safety
    url.search = ''
    url.hash = ''

    // Normalize the URL
    const sanitized = url.toString()

    // Remove trailing slash for consistency (except for root paths)
    const normalized = sanitized.endsWith('/') && url.pathname !== '/'
      ? sanitized.slice(0, -1)
      : sanitized

    return { success: true, url: normalized }
  } catch {
    return { success: false, error: 'Invalid URL format' }
  }
}

/**
 * Extracts and normalizes the domain from a URL.
 * Returns the domain in lowercase without www prefix.
 */
export function extractDomainFromUrl(rawUrl: string): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return null
  }

  const trimmed = rawUrl.trim()
  if (!trimmed) {
    return null
  }

  try {
    let url: URL
    try {
      url = new URL(trimmed)
    } catch {
      // Try prepending https:// if no protocol
      if (!trimmed.includes('://')) {
        url = new URL(`https://${trimmed}`)
      } else {
        return null
      }
    }

    let domain = url.hostname.toLowerCase()

    // Remove www prefix
    if (domain.startsWith('www.')) {
      domain = domain.slice(4)
    }

    return domain
  } catch {
    return null
  }
}

/**
 * Validates that a URL is well-formed and safe for display.
 * Less strict than sanitizeVendorUrl - allows query params for display purposes.
 */
export function isValidDisplayUrl(rawUrl: string): boolean {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return false
  }

  try {
    const url = new URL(rawUrl)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

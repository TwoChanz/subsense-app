// Settings persistence using localStorage

export interface UserSettings {
  pushNotifications: boolean
  emailReports: boolean
  emailAddress: string
}

const SETTINGS_KEY = "subsense-settings"

const defaultSettings: UserSettings = {
  pushNotifications: true,
  emailReports: false,
  emailAddress: "",
}

export function getSettings(): UserSettings {
  if (typeof window === "undefined") return defaultSettings

  try {
    const stored = localStorage.getItem(SETTINGS_KEY)
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) }
    }
  } catch (e) {
    console.error("Failed to load settings:", e)
  }
  return defaultSettings
}

export function saveSettings(settings: Partial<UserSettings>): UserSettings {
  const current = getSettings()
  const updated = { ...current, ...settings }

  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated))
  } catch (e) {
    console.error("Failed to save settings:", e)
  }

  return updated
}

export function updateSetting<K extends keyof UserSettings>(
  key: K,
  value: UserSettings[K]
): UserSettings {
  return saveSettings({ [key]: value })
}

export function resetSettings(): UserSettings {
  try {
    localStorage.removeItem(SETTINGS_KEY)
  } catch (e) {
    console.error("Failed to reset settings:", e)
  }
  return defaultSettings
}

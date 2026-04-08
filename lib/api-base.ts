/** Production app URL — single source of truth for APK and web sync */
const PRODUCTION_URL = "https://civicpulse-app.vercel.app"

/**
 * Returns API base URL. Always use absolute URLs so fetch works in APK WebView and cross-origin.
 */
export function getApiBase(): string {
  if (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_BASE) {
    return process.env.NEXT_PUBLIC_API_BASE
  }
  if (typeof window !== "undefined") {
    if ((window as any).Capacitor) return PRODUCTION_URL
    // Local dev: use current origin so fetch works (relative URLs can fail in WebView/network)
    return window.location.origin
  }
  return ""
}

export function apiUrl(path: string): string {
  const base = getApiBase()
  const p = path.startsWith("/") ? path : `/${path}`
  return base + p
}

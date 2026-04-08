"use client"

import dynamic from "next/dynamic"
import { useEffect, useState } from "react"

const Analytics = dynamic(
  () => import("@vercel/analytics/next").then((m) => ({ default: m.Analytics })),
  { ssr: false }
)

/** Skip Analytics in Capacitor WebView to avoid client-side exceptions */
export function AnalyticsSafe() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    try {
      const cap = (typeof window !== "undefined" && (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor)
      const isNative = cap?.isNativePlatform?.() ?? false
      setShow(!isNative)
    } catch {
      setShow(true)
    }
  }, [])

  if (!show) return null
  return <Analytics />
}

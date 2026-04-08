"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Shield } from "lucide-react"

export default function SplashScreen() {
  const router = useRouter()
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFadeOut(true), 1600)
    const navTimer = setTimeout(() => router.replace("/welcome"), 2000)
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(navTimer)
    }
  }, [router])

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-primary transition-opacity duration-400 ${fadeOut ? "opacity-0" : "opacity-100"}`}
    >
      <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-700">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-foreground/15 backdrop-blur-sm">
          <Shield className="h-12 w-12 text-primary-foreground" strokeWidth={1.5} />
        </div>
        <div className="flex flex-col items-center gap-1">
          <h1 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-bold tracking-tight text-primary-foreground">
            CivicPulse
          </h1>
          <p className="text-sm text-primary-foreground/70">
            Urban Issue Reporting
          </p>
        </div>
      </div>

      <div className="absolute bottom-16 flex flex-col items-center gap-3">
        <div className="flex gap-1.5">
          <span className="h-2 w-2 animate-pulse rounded-full bg-primary-foreground/60 [animation-delay:0ms]" />
          <span className="h-2 w-2 animate-pulse rounded-full bg-primary-foreground/60 [animation-delay:200ms]" />
          <span className="h-2 w-2 animate-pulse rounded-full bg-primary-foreground/60 [animation-delay:400ms]" />
        </div>
      </div>
    </div>
  )
}

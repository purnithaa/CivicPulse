"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { CitizenHeader } from "@/components/citizen-header"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { HomeHero } from "@/components/home-hero"
import { QuickActions } from "@/components/quick-actions"
import { useAuth } from "@/lib/auth-context"
import { useLanguage } from "@/lib/language-context"
import { OnboardingModal } from "@/components/onboarding-modal"
import { askNotificationPermissionOnce } from "@/lib/push-notifications"

export default function HomePage() {
  const router = useRouter()
  const { isLoggedIn } = useAuth()
  const { t } = useLanguage()

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace("/welcome")
    }
  }, [isLoggedIn, router])

  // Ask for push notification permission (once per session, after 5s)
  useEffect(() => {
    if (isLoggedIn) askNotificationPermissionOnce()
  }, [isLoggedIn])

  // If not logged in, render nothing while redirecting
  if (!isLoggedIn) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <OnboardingModal />
      <CitizenHeader />
      <main className="mx-auto max-w-5xl px-4 pb-24 md:pb-8">
        {/* Swachhata-style hero banner */}
        <HomeHero />

        {/* Quick Report section (title handled inside QuickActions) */}
        <section className="mt-6" aria-label="Quick report">
          <QuickActions />
        </section>

        {/* Link to My Reports */}
        <div className="mt-10 flex justify-center">
          <Link
            href="/my-reports"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            {t("goToMyReports")}
          </Link>
        </div>
      </main>
      <MobileBottomNav />
    </div>
  )
}

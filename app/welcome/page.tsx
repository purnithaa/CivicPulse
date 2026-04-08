"use client"

import { useRouter } from "next/navigation"
import { Shield, Users, Briefcase, Settings, Globe } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { Button } from "@/components/ui/button"

export default function WelcomePage() {
  const router = useRouter()
  const { language, toggleLanguage, t } = useLanguage()

  const roles = [
    {
      key: "citizen" as const,
      titleKey: "citizenLogin" as const,
      descKey: "citizenDesc" as const,
      icon: Users,
      href: "/login?role=citizen",
      color: "bg-primary/10 text-primary",
    },
    {
      key: "staff" as const,
      titleKey: "staffLogin" as const,
      descKey: "staffDesc" as const,
      icon: Briefcase,
      href: "/login?role=staff",
      color: "bg-accent/10 text-accent",
    },
    {
      key: "admin" as const,
      titleKey: "adminLogin" as const,
      descKey: "adminDesc" as const,
      icon: Settings,
      href: "/login?role=admin",
      color: "bg-chart-3/10 text-chart-3",
    },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Language Toggle */}
      <div className="flex justify-end p-4">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleLanguage}
          className="flex items-center gap-2 rounded-full px-4"
        >
          <Globe className="h-4 w-4" />
          <span className="text-sm font-medium">
            {language === "en" ? "தமிழ்" : language === "ta" ? "हिंदी" : "English"}
          </span>
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 pb-12">
        {/* Logo & Branding */}
        <div className="mb-10 flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Shield className="h-9 w-9" strokeWidth={1.5} />
          </div>
          <div className="flex flex-col items-center gap-1 text-center">
            <h1 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-bold tracking-tight text-foreground">
              {t("welcomeTitle")}
            </h1>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground text-balance">
              {t("welcomeTagline")}
            </p>
          </div>
        </div>

        {/* Subtext */}
        <p className="mb-6 text-sm font-medium text-muted-foreground">
          {t("welcomeSubtext")}
        </p>

        {/* Role Cards */}
        <div className="flex w-full max-w-sm flex-col gap-3">
          {roles.map((role) => {
            const Icon = role.icon
            return (
              <button
                key={role.key}
                onClick={() => router.push(role.href)}
                className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary/30 hover:shadow-md active:scale-[0.98]"
              >
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${role.color} transition-transform group-hover:scale-105`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-base font-semibold text-card-foreground">
                    {t(role.titleKey)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {t(role.descKey)}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

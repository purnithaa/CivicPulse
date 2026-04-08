"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, PlusCircle, ClipboardList, User, Map } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { useLanguage } from "@/lib/language-context"

const navItemKeys = [
  { href: "/home", labelKey: "navHome" as const, icon: Home },
  { href: "/map", labelKey: "navMap" as const, icon: Map },
  { href: "/report", labelKey: "navReport" as const, icon: PlusCircle, isCenter: true },
  { href: "/my-reports", labelKey: "navReports" as const, icon: ClipboardList },
  { href: "/profile", labelKey: "navProfile" as const, icon: User },
]

export function MobileBottomNav() {
  const pathname = usePathname()
  const { isLoggedIn } = useAuth()
  const { t } = useLanguage()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md md:hidden">
      <div className="flex items-center justify-around py-2">
        {navItemKeys.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          const target = item.href === "/profile" && !isLoggedIn ? "/login?role=citizen" : item.href
          return (
            <Link
              key={item.href}
              href={target}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {item.isCenter ? (
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full -mt-4 shadow-lg",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-primary/90 text-primary-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
              ) : (
                <Icon className="h-5 w-5" />
              )}
              <span className={cn("font-medium", item.isCenter && "mt-0.5")}>
                {t(item.labelKey)}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

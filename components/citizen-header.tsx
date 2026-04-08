"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import {
  Home,
  PlusCircle,
  ClipboardList,
  Bell,
  Menu,
  X,
  Shield,
  User,
  LogIn,
  Moon,
  Sun,
  Map,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { apiUrl } from "@/lib/api-base"
import { useTheme } from "next-themes"

const citizenNav = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/map", label: "Map", icon: Map },
  { href: "/report", label: "Report Issue", icon: PlusCircle },
  { href: "/my-reports", label: "My Reports", icon: ClipboardList },
]

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
    >
      {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  )
}

export function CitizenHeader() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const { user, isLoggedIn } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function calc() {
      if (!isLoggedIn || !user) {
        if (!cancelled) setUnreadCount(0)
        return
      }
      try {
        const res = await fetch(apiUrl("/api/issues"))
        const data = await res.json()
        if (!Array.isArray(data)) {
          if (!cancelled) setUnreadCount(0)
          return
        }
        const identifier = (user.phone || user.email)?.toLowerCase?.()
        const mine = identifier
          ? data.filter(
              (i: any) =>
                typeof i.reporter_contact === "string" &&
                i.reporter_contact.toLowerCase() === identifier
            )
          : []
        // Count unseen notifications based on localStorage seenIds
        const seenKey = `civicpulse_seen_notifs_${user.email || user.phone}`
        let seenIds = new Set<string>()
        try {
          const raw = localStorage.getItem(seenKey)
          seenIds = raw ? new Set(JSON.parse(raw) as string[]) : new Set()
        } catch {}
        let count = 0
        for (const issue of mine) {
          const id = issue.id
          const status = issue.status
          if (!seenIds.has(`${id}-review`) && ["in-review", "dispatched", "resolved"].includes(status)) count++
          if (!seenIds.has(`${id}-dispatched`) && ["dispatched", "resolved"].includes(status)) count++
          if (!seenIds.has(`${id}-resolved`) && status === "resolved") count++
        }
        if (!cancelled) setUnreadCount(count)
      } catch {
        if (!cancelled) setUnreadCount(0)
      }
    }
    calc()
    return () => {
      cancelled = true
    }
  }, [isLoggedIn, user])

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/home" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
            CivicPulse
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {citizenNav.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  className={cn(
                    "gap-2",
                    isActive && "bg-primary/10 text-primary"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/my-reports" className="relative">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-destructive p-0 text-[10px] text-primary-foreground flex items-center justify-center">
                  {unreadCount}
                </Badge>
              )}
              <span className="sr-only">Notifications</span>
            </Button>
          </Link>

          {/* Profile / Login button */}
          {isLoggedIn && user ? (
            <Link href="/profile">
              <Button variant="ghost" size="icon" className="relative">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  {user.avatarInitials}
                </div>
                <span className="sr-only">Profile</span>
              </Button>
            </Link>
          ) : (
            <Link href="/login?role=citizen">
              <Button variant="outline" size="sm" className="gap-2">
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">Sign In</span>
              </Button>
            </Link>
          )}

          {/* Mobile menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 bg-card p-0">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <div className="flex flex-col gap-1 p-4 pt-12">
                {/* User info in mobile menu */}
                {isLoggedIn && user ? (
                  <div className="mb-4 flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                      {user.avatarInitials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{user.name}</p>
                      <p className="text-xs text-muted-foreground">+91 {user.phone}</p>
                    </div>
                  </div>
                ) : (
                  <Link href="/login?role=citizen" onClick={() => setOpen(false)} className="mb-4">
                    <Button className="w-full gap-2">
                      <LogIn className="h-4 w-4" />
                      Sign In
                    </Button>
                  </Link>
                )}

                {citizenNav.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
                      <Button
                        variant={isActive ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start gap-3",
                          isActive && "bg-primary/10 text-primary"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        {item.label}
                      </Button>
                    </Link>
                  )
                })}

                {isLoggedIn && (
                  <Link href="/profile" onClick={() => setOpen(false)}>
                    <Button
                      variant={pathname === "/profile" ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start gap-3",
                        pathname === "/profile" && "bg-primary/10 text-primary"
                      )}
                    >
                      <User className="h-5 w-5" />
                      Profile
                    </Button>
                  </Link>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

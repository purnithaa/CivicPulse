"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import {
  LayoutDashboard,
  ClipboardList,
  CalendarDays,
  HardHat,
  LogOut,
  Menu,
  Moon,
  Sun,
  User,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useStaffAuth } from "@/lib/staff-auth-context"
import { staffStatusLabels } from "@/lib/mock-data"
import { useTheme } from "next-themes"

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

const sidebarItems = [
  { href: "/staff", label: "Dashboard", icon: LayoutDashboard },
  { href: "/staff/issues", label: "My Issues", icon: ClipboardList },
  { href: "/staff/leave", label: "Leave", icon: CalendarDays },
  { href: "/staff/profile", label: "Profile", icon: User },
]

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    available: "bg-success",
    busy: "bg-warning",
    "off-duty": "bg-muted-foreground",
    "on-leave": "bg-primary",
  }
  return (
    <span
      className={cn("inline-block h-2 w-2 rounded-full", colors[status] || "bg-muted-foreground")}
    />
  )
}

export function StaffSidebar() {
  const pathname = usePathname()
  const { staffUser, logoutStaff } = useStaffAuth()

  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-card lg:block">
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-2 border-b border-border p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
            <HardHat className="h-5 w-5 text-accent-foreground" />
          </div>
          <div>
            <span
              className="text-sm font-bold text-foreground"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Staff Portal
            </span>
            <p className="text-[10px] text-muted-foreground">CivicPulse</p>
          </div>
        </div>

        {/* Staff info */}
        {staffUser && (
          <div className="border-b border-border px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent">
                {staffUser.avatarInitials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {staffUser.name}
                </p>
                <div className="flex items-center gap-1.5">
                  <StatusDot status={staffUser.status} />
                  <span className="text-[10px] text-muted-foreground">
                    {staffStatusLabels[staffUser.status]}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 p-3">
          <div className="flex flex-col gap-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon
              const isActive =
                pathname === item.href ||
                (item.href !== "/staff" && pathname.startsWith(item.href))
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3",
                      isActive && "bg-accent/10 text-accent font-semibold"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              )
            })}
          </div>
        </nav>

        <div className="border-t border-border p-3">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-xs text-muted-foreground">Theme</span>
            <ThemeToggle />
          </div>
          <Link href="/welcome">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-muted-foreground"
              onClick={() => logoutStaff()}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </Link>
        </div>
      </div>
    </aside>
  )
}

export function StaffMobileHeader() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const { staffUser, logoutStaff } = useStaffAuth()

  return (
    <header className="flex items-center justify-between border-b border-border bg-card p-4 lg:hidden">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
          <HardHat className="h-4 w-4 text-accent-foreground" />
        </div>
        <div>
          <span
            className="text-sm font-bold text-foreground"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Staff Portal
          </span>
          {staffUser && (
            <div className="flex items-center gap-1.5">
              <StatusDot status={staffUser.status} />
              <span className="text-[10px] text-muted-foreground">
                {staffStatusLabels[staffUser.status]}
              </span>
            </div>
          )}
        </div>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle staff menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 bg-card p-0">
          <SheetTitle className="sr-only">Staff Navigation Menu</SheetTitle>
          {/* Staff info in sheet */}
          {staffUser && (
            <div className="border-b border-border px-4 py-4 pt-12">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/15 text-sm font-bold text-accent">
                  {staffUser.avatarInitials}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {staffUser.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {staffUser.department}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1 p-4">
            {sidebarItems.map((item) => {
              const Icon = item.icon
              const isActive =
                pathname === item.href ||
                (item.href !== "/staff" && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                >
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3",
                      isActive && "bg-accent/10 text-accent font-semibold"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              )
            })}
            <div className="my-2 h-px bg-border" />
            <Link href="/welcome" onClick={() => { setOpen(false); logoutStaff() }}>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-muted-foreground"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </Link>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  )
}

"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import {
  LayoutDashboard,
  ClipboardList,
  BarChart3,
  Settings,
  Shield,
  ChevronLeft,
  LogOut,
  Menu,
  Users,
  Moon,
  Sun,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { useAdminAuth } from "@/lib/admin-auth-context"
import { useRouter } from "next/navigation"
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
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/issues", label: "All Issues", icon: ClipboardList },
  { href: "/admin/staff", label: "Staff", icon: Users },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const { logoutAdmin } = useAdminAuth()
  const router = useRouter()

  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-card lg:block">
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-2 border-b border-border p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <span
              className="text-sm font-bold text-foreground"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              CivicPulse
            </span>
            <p className="text-[10px] text-muted-foreground">Admin Panel</p>
          </div>
        </div>

        <nav className="flex-1 p-3">
          <div className="flex flex-col gap-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon
              const isActive =
                pathname === item.href ||
                (item.href !== "/admin" && pathname.startsWith(item.href))
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3",
                      isActive && "bg-primary/10 text-primary font-semibold"
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
          <Link href="/home">
            <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground">
              <ChevronLeft className="h-4 w-4" />
              Back to App
            </Button>
          </Link>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground"
            onClick={() => {
              logoutAdmin()
              router.push("/welcome")
            }}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </aside>
  )
}

export function AdminMobileHeader() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header className="flex items-center justify-between border-b border-border bg-card p-4 lg:hidden">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Shield className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-sm font-bold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
          Admin
        </span>
      </div>

      <div className="flex items-center gap-1">
        <ThemeToggle />
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle admin menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 bg-card p-0">
          <SheetTitle className="sr-only">Admin Navigation Menu</SheetTitle>
          <div className="flex flex-col gap-1 p-4 pt-12">
            {sidebarItems.map((item) => {
              const Icon = item.icon
              const isActive =
                pathname === item.href ||
                (item.href !== "/admin" && pathname.startsWith(item.href))
              return (
                <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3",
                      isActive && "bg-primary/10 text-primary font-semibold"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              )
            })}
            <div className="my-2 h-px bg-border" />
            <Link href="/home" onClick={() => setOpen(false)}>
              <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground">
                <ChevronLeft className="h-4 w-4" />
                Back to App
              </Button>
            </Link>
          </div>
        </SheetContent>
      </Sheet>
      </div>
    </header>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { CitizenHeader } from "@/components/citizen-header"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/lib/auth-context"
import { apiUrl } from "@/lib/api-base"
import { toast } from "sonner"
import {
  User,
  Phone,
  Mail,
  Edit2,
  Check,
  X,
  LogOut,
  ClipboardList,
  CheckCircle2,
  Clock,
  Shield,
} from "lucide-react"

export default function ProfilePage() {
  const { user, isLoggedIn, updateProfile, logout } = useAuth()
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState("")
  const [editPhone, setEditPhone] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [totalReports, setTotalReports] = useState(0)
  const [resolvedCount, setResolvedCount] = useState(0)
  const [activeCount, setActiveCount] = useState(0)

  useEffect(() => {
    if (!isLoggedIn || !user) {
      setTotalReports(0)
      setResolvedCount(0)
      setActiveCount(0)
      return
    }

    async function loadActivity() {
      try {
        const res = await fetch(apiUrl("/api/issues"))
        const data = await res.json()
        if (!Array.isArray(data)) {
          setTotalReports(0)
          setResolvedCount(0)
          setActiveCount(0)
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

        const total = mine.length
        const resolved = mine.filter((i: any) => i.status === "resolved").length
        const active = mine.filter((i: any) => i.status !== "resolved").length

        setTotalReports(total)
        setResolvedCount(resolved)
        setActiveCount(active)
      } catch {
        setTotalReports(0)
        setResolvedCount(0)
        setActiveCount(0)
      }
    }

    loadActivity()
  }, [isLoggedIn, user])

  if (!isLoggedIn || !user) {
    return (
      <div className="min-h-screen bg-background">
        <CitizenHeader />
        <main className="mx-auto max-w-3xl px-4 pb-24 md:pb-8">
          <div className="mt-20 flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <User className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2
              className="mt-4 text-xl font-bold text-foreground"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Not Signed In
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in to access your profile and track your reports
            </p>
            <Button onClick={() => router.push("/login?role=citizen")} className="mt-6 gap-2">
              <Shield className="h-4 w-4" />
              Sign In
            </Button>
          </div>
        </main>
        <MobileBottomNav />
      </div>
    )
  }

  const handleSave = () => {
    if (!editName.trim()) return
    const updates: Partial<{ name: string; phone: string; email: string }> = {
      name: editName.trim(),
    }
    if (editPhone.trim()) updates.phone = editPhone.trim()
    if (editEmail.trim()) updates.email = editEmail.trim().toLowerCase()
    updateProfile(updates)
    setEditing(false)
    toast.success("Profile updated successfully")
  }

  const handleLogout = () => {
    logout()
    router.push("/welcome")
  }

  return (
    <div className="min-h-screen bg-background">
      <CitizenHeader />
      <main className="mx-auto max-w-3xl px-4 pb-24 md:pb-8">
        <div className="mt-6">
          <h1
            className="text-2xl font-bold text-foreground"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Profile
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your account details
          </p>
        </div>

        {/* Avatar & Name */}
        <Card className="mt-6 border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <span className="text-xl font-bold">{user.avatarInitials}</span>
              </div>
              <div className="flex-1 min-w-0">
                {editing ? (
                  <div className="flex flex-col gap-2 w-full">
                    <div className="flex items-center gap-2">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-9"
                        placeholder="Full name"
                        autoFocus
                      />
                    </div>
                    <Input
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="h-9"
                      placeholder={`Phone (current: ${user.phone || "—"})`}
                      type="tel"
                    />
                    <Input
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="h-9"
                      placeholder={`Email (current: ${user.email || "—"})`}
                      type="email"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSave} className="gap-1.5 text-xs">
                        <Check className="h-3.5 w-3.5" /> Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditing(false)} className="gap-1.5 text-xs">
                        <X className="h-3.5 w-3.5" /> Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg font-bold text-foreground truncate">
                        {user.name}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {user.phone ? `+91 ${user.phone}` : user.email || "No contact"}
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setEditName(user.name)
                        setEditPhone(user.phone || "")
                        setEditEmail(user.email || "")
                        setEditing(true)
                      }}
                      className="shrink-0 h-7 w-7"
                    >
                      <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="sr-only">Edit profile</span>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details */}
        <Card className="mt-4 border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
              Account Details
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label className="text-xs text-muted-foreground">Full Name</Label>
              <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{user.name}</span>
              </div>
            </div>
            {user.phone && (
              <div className="flex flex-col gap-2">
                <Label className="text-xs text-muted-foreground">Phone Number</Label>
                <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">+91 {user.phone}</span>
                </div>
              </div>
            )}
            {user.email && (
              <div className="flex flex-col gap-2">
                <Label className="text-xs text-muted-foreground">Email Address</Label>
                <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">{user.email}</span>
                </div>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Tap the edit icon above to update your name, phone, or email.
            </p>
          </CardContent>
        </Card>

        {/* Activity Summary */}
        <Card className="mt-4 border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
              Your Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col items-center gap-1 rounded-lg bg-muted/50 p-3">
                <ClipboardList className="h-5 w-5 text-primary" />
                <span className="text-lg font-bold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
                  {totalReports}
                </span>
                <span className="text-[10px] text-muted-foreground">Total Reports</span>
              </div>
              <div className="flex flex-col items-center gap-1 rounded-lg bg-muted/50 p-3">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <span className="text-lg font-bold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
                  {resolvedCount}
                </span>
                <span className="text-[10px] text-muted-foreground">Resolved</span>
              </div>
              <div className="flex flex-col items-center gap-1 rounded-lg bg-muted/50 p-3">
                <Clock className="h-5 w-5 text-warning" />
                <span className="text-lg font-bold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
                  {activeCount}
                </span>
                <span className="text-[10px] text-muted-foreground">Active</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator className="my-6" />

        <Button
          variant="outline"
          onClick={handleLogout}
          className="w-full gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </main>
      <MobileBottomNav />
    </div>
  )
}

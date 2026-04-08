"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { StaffSidebar, StaffMobileHeader } from "@/components/staff-sidebar"
import { useStaffAuth } from "@/lib/staff-auth-context"
import { Loader2, KeyRound, ShieldAlert } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

function ForcePasswordChangeModal({
  onSuccess,
}: {
  onSuccess: () => void
}) {
  const { changeStaffPassword } = useStaffAuth()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("All fields are required")
      return
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters")
      return
    }
    if (newPassword === "Staff@123") {
      setError("Please choose a different password than the default")
      return
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      return
    }
    setLoading(true)
    try {
      const result = await changeStaffPassword(currentPassword, newPassword, confirmPassword)
      if (result.success) {
        toast.success("Password updated successfully")
        onSuccess()
      } else {
        setError(result.error ?? "Failed to update password")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    // Full-screen overlay — not dismissable
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card shadow-2xl">
        <div className="flex flex-col items-center gap-2 border-b border-border px-6 py-5 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
            <ShieldAlert className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <h2
            className="text-lg font-bold text-foreground"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Change Your Password
          </h2>
          <p className="text-sm text-muted-foreground">
            You are using the default password{" "}
            <span className="font-mono font-semibold text-foreground">Staff@123</span>.
            Please set a personal password before continuing.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-6 py-5">
          <div className="flex flex-col gap-1">
            <Label htmlFor="fc-current">Current password</Label>
            <Input
              id="fc-current"
              type="password"
              value={currentPassword}
              onChange={(e) => { setCurrentPassword(e.target.value); setError("") }}
              placeholder="Staff@123"
              autoComplete="current-password"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="fc-new">New password</Label>
            <Input
              id="fc-new"
              type="password"
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); setError("") }}
              placeholder="At least 6 characters"
              autoComplete="new-password"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="fc-confirm">Confirm new password</Label>
            <Input
              id="fc-confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setError("") }}
              placeholder="Re-enter new password"
              autoComplete="new-password"
            />
          </div>

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" disabled={loading} className="w-full gap-2">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <KeyRound className="h-4 w-4" />
                Set new password
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isStaffLoggedIn, isStaffLoading, staffUser } = useStaffAuth()
  const router = useRouter()

  useEffect(() => {
    // Only redirect after hydration is complete
    if (!isStaffLoading && !isStaffLoggedIn) {
      router.replace("/login?role=staff")
    }
  }, [isStaffLoggedIn, isStaffLoading, router])

  // Show spinner while checking session
  if (isStaffLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isStaffLoggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <StaffSidebar />
      <div className="flex flex-1 flex-col">
        <StaffMobileHeader />
        <main className="flex-1 overflow-auto p-4 lg:p-6">{children}</main>
      </div>

      {staffUser?.mustChangePassword && (
        <ForcePasswordChangeModal onSuccess={() => {}} />
      )}
    </div>
  )
}

"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useStaffAuth } from "@/lib/staff-auth-context"
import { Loader2, User, Key, ShieldAlert } from "lucide-react"
import { toast } from "sonner"

export default function StaffProfilePage() {
  const { staffUser, changeStaffPassword } = useStaffAuth()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("All fields required")
      return
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters")
      return
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match")
      return
    }
    setLoading(true)
    try {
      const result = await changeStaffPassword(currentPassword, newPassword, confirmPassword)
      if (result.success) {
        toast.success("Password changed successfully")
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      } else {
        setError(result.error ?? "Failed to change password")
      }
    } finally {
      setLoading(false)
    }
  }

  if (!staffUser) return <div className="animate-pulse h-8 bg-muted rounded w-48" aria-hidden />

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1
          className="text-2xl font-bold text-foreground lg:text-3xl"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Profile
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account and password
        </p>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5" />
            Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div>
              <Label className="text-muted-foreground">Name</Label>
              <p className="font-medium">{staffUser.name}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Employee ID</Label>
              <p className="font-mono font-medium">{staffUser.employeeId}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Department</Label>
              <p className="font-medium">{staffUser.department}</p>
            </div>
            {staffUser.phone && (
              <div>
                <Label className="text-muted-foreground">Phone</Label>
                <p className="font-medium">{staffUser.phone}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {staffUser.mustChangePassword && (
        <div className="mt-6 flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 dark:border-amber-700 dark:bg-amber-900/20">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              Default password in use
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-400">
              You are still using the default password <span className="font-mono font-bold">Staff@123</span>. Please change it below.
            </p>
          </div>
        </div>
      )}

      <Card className="mt-6 border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Key className="h-5 w-5" />
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
            <div>
              <Label htmlFor="current">Current password</Label>
              <Input
                id="current"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="new">New password</Label>
              <Input
                id="new"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="confirm">Confirm new password</Label>
              <Input
                id="confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="mt-1"
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Change password"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

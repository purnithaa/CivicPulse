"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Shield,
  ArrowLeft,
  Loader2,
  Eye,
  EyeOff,
  Globe,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { useStaffAuth } from "@/lib/staff-auth-context"
import { useAdminAuth } from "@/lib/admin-auth-context"
import { useLanguage } from "@/lib/language-context"
import type { TranslationKey } from "@/lib/translations"
import { toast } from "sonner"

type AuthMode = "login" | "signup"
type Role = "citizen" | "staff" | "admin"

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const roleParam = searchParams.get("role") as Role | null

  const { login: citizenLogin, signup: citizenSignup, isLoggedIn } = useAuth()
  const { loginStaff, signupStaff, isStaffLoggedIn } = useStaffAuth()
  const { loginAdmin, isAdminLoggedIn } = useAdminAuth()
  const { language, toggleLanguage, t } = useLanguage()

  const [mode, setMode] = useState<AuthMode>("login")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  // Form fields
  const [fullName, setFullName] = useState("")
  const [emailOrPhone, setEmailOrPhone] = useState("")
  const [phone, setPhone] = useState("")
  const [employeeId, setEmployeeId] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const role: Role = roleParam && ["citizen", "staff", "admin"].includes(roleParam) ? roleParam : "citizen"

  // Redirect if already logged in
  useEffect(() => {
    if (role === "citizen" && isLoggedIn) router.replace("/home")
    if (role === "staff" && isStaffLoggedIn) router.replace("/staff")
    if (role === "admin" && isAdminLoggedIn) router.replace("/admin")
  }, [role, isLoggedIn, isStaffLoggedIn, isAdminLoggedIn, router])

  // Redirect if no valid role
  useEffect(() => {
    if (!roleParam) router.replace("/welcome")
  }, [roleParam, router])

  const resetForm = () => {
    setFullName("")
    setEmailOrPhone("")
    setPhone("")
    setEmployeeId("")
    setPassword("")
    setConfirmPassword("")
    setError("")
    setShowPassword(false)
    setShowConfirmPassword(false)
  }

  const switchMode = (newMode: AuthMode) => {
    resetForm()
    setMode(newMode)
  }

  const validate = (): boolean => {
    if (mode === "signup") {
      if (!fullName.trim()) {
        setError(t("nameRequired"))
        return false
      }
    }

    if (role === "citizen") {
      if (!emailOrPhone.trim()) {
        setError(t("emailOrPhoneRequired"))
        return false
      }
    } else if (role === "staff") {
      if (!employeeId.trim()) {
        setError(t("employeeIdRequired"))
        return false
      }
      if (mode === "login" && (!password || password.length < 6)) {
        setError(t("passwordRequired"))
        return false
      }
      if (mode === "signup" && !phone.trim()) {
        setError(t("phoneRequired"))
        return false
      }
    } else if (role === "admin") {
      if (!emailOrPhone.trim()) {
        setError(t("emailRequired"))
        return false
      }
    }

    if (role !== "staff" || mode === "signup") {
      if (!password) {
        setError(t("passwordRequired"))
        return false
      }
      if (password.length < 6) {
        setError(t("passwordTooShort"))
        return false
      }
    }

    if (mode === "signup") {
      if (!confirmPassword) {
        setError(t("confirmPasswordRequired"))
        return false
      }
      if (password !== confirmPassword) {
        setError(t("passwordMismatch"))
        return false
      }
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!validate()) return

    setLoading(true)

    try {
      if (mode === "signup") {
        let result: { success: boolean; error?: string }

        if (role === "citizen") {
          result = await citizenSignup(fullName, emailOrPhone, password)
        } else {
          result = signupStaff(fullName, employeeId, phone, password)
        }

        if (!result.success) {
          setError(t((result.error || "accountExists") as TranslationKey))
          return
        }

        toast.success(t("signupSuccess"))
        switchMode("login")
        return
      }

      // Login
      let result: { success: boolean; error?: string }

      if (role === "citizen") {
        result = await citizenLogin(emailOrPhone, password)
        if (result.success) {
          toast.success(t("loginSuccess"))
          router.push("/home")
          return
        }
      } else if (role === "staff") {
        const loginResult = await loginStaff(employeeId, password)
        if (loginResult.success) {
          toast.success(t("loginSuccess"))
          router.push("/staff")
          return
        }
        setError(t((loginResult.error || "invalidCredentials") as TranslationKey))
        return
      } else {
        result = loginAdmin(emailOrPhone, password)
        if (result.success) {
          toast.success(t("loginSuccess"))
          router.push("/admin")
          return
        }
      }

      setError(t((result!.error || "invalidCredentials") as TranslationKey))
    } finally {
      setLoading(false)
    }
  }

  // Role-based config
  const roleConfig = {
    citizen: {
      loginTitle: "citizenLoginTitle" as TranslationKey,
      signupTitle: "citizenSignupTitle" as TranslationKey,
      loginDesc: "citizenLoginDesc" as TranslationKey,
      signupDesc: "citizenSignupDesc" as TranslationKey,
      accent: "bg-primary",
    },
    staff: {
      loginTitle: "staffLoginTitle" as TranslationKey,
      signupTitle: "staffSignupTitle" as TranslationKey,
      loginDesc: "staffLoginDesc" as TranslationKey,
      signupDesc: "staffSignupDesc" as TranslationKey,
      accent: "bg-accent",
    },
    admin: {
      loginTitle: "adminLoginTitle" as TranslationKey,
      signupTitle: "adminSignupTitle" as TranslationKey,
      loginDesc: "adminLoginDesc" as TranslationKey,
      signupDesc: "adminSignupDesc" as TranslationKey,
      accent: "bg-chart-3",
    },
  }

  const config = roleConfig[role]

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-4">
        <button
          onClick={() => router.push("/welcome")}
          className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t("backToWelcome")}</span>
        </button>
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
        {/* Logo & Title */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${config.accent} text-primary-foreground`}>
            <Shield className="h-7 w-7" strokeWidth={1.5} />
          </div>
          <div className="flex flex-col items-center gap-1 text-center">
            <h1 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold tracking-tight text-foreground">
              {t(mode === "login" ? config.loginTitle : config.signupTitle)}
            </h1>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground text-balance">
              {t(mode === "login" ? config.loginDesc : config.signupDesc)}
            </p>
          </div>
        </div>

        {/* Auth Card */}
        <Card className="w-full max-w-sm border-border">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Full Name (signup only) */}
              {mode === "signup" && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="fullName" className="text-sm font-medium">
                    {t("fullName")}
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder={t("fullName")}
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value)
                      setError("")
                    }}
                    autoComplete="name"
                  />
                </div>
              )}

              {/* Email/Phone (citizen + admin) */}
              {(role === "citizen" || role === "admin") && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="emailOrPhone" className="text-sm font-medium">
                    {role === "admin" ? t("email") : t("emailOrPhone")}
                  </Label>
                  <Input
                    id="emailOrPhone"
                    type={role === "admin" ? "email" : "text"}
                    placeholder={role === "admin" ? t("email") : t("emailOrPhone")}
                    value={emailOrPhone}
                    onChange={(e) => {
                      setEmailOrPhone(e.target.value)
                      setError("")
                    }}
                    autoComplete={role === "admin" ? "email" : "username"}
                  />
                </div>
              )}

              {/* Employee ID (staff) */}
              {role === "staff" && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="employeeId" className="text-sm font-medium">
                    Employee ID
                  </Label>
                  <Input
                    id="employeeId"
                    type="text"
                    placeholder={t("employeeId")}
                    value={employeeId}
                    onChange={(e) => {
                      setEmployeeId(e.target.value)
                      setError("")
                    }}
                    autoComplete="username"
                  />
                </div>
              )}

              {/* Phone (staff signup only) */}
              {role === "staff" && mode === "signup" && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="phone" className="text-sm font-medium">
                    {t("phone")}
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder={t("phone")}
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value)
                      setError("")
                    }}
                    autoComplete="tel"
                  />
                </div>
              )}

              {/* Password */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  {t("password")}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t("password")}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      setError("")
                    }}
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password (signup or staff set-password) */}
              {mode === "signup" && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">
                    {t("confirmPassword")}
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder={t("confirmPassword")}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value)
                        setError("")
                      }}
                      autoComplete="new-password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full gap-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t(mode === "login" ? "loginButton" : "signupButton")
                )}
              </Button>
            </form>

            {/* Switch Mode — only citizens can sign up; staff and admin cannot */}
            {role === "citizen" && (
              <div className="mt-4 flex items-center justify-center gap-1 text-sm">
                <span className="text-muted-foreground">
                  {mode === "login" ? t("noAccount") : t("hasAccount")}
                </span>
                <button
                  onClick={() => switchMode(mode === "login" ? "signup" : "login")}
                  className="font-medium text-primary transition-colors hover:text-primary/80"
                >
                  {mode === "login" ? t("switchToSignup") : t("switchToLogin")}
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  )
}

"use client"

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react"

export interface AdminUser {
  name: string
  email: string
  avatarInitials: string
}

const ADMIN_CREDENTIALS = [
  { email: "admin@civicpulse.com", password: "Admin@123", name: "Admin" },
]

const SESSION_KEY = "civicpulse_admin_session"

interface AdminAuthContextType {
  adminUser: AdminUser | null
  isAdminLoggedIn: boolean
  isAdminLoading: boolean
  loginAdmin: (email: string, password: string) => { success: boolean; error?: string }
  logoutAdmin: () => void
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null)

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const [isAdminLoading, setIsAdminLoading] = useState(true)

  // Hydrate session from sessionStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") { setIsAdminLoading(false); return }
    try {
      const raw = sessionStorage.getItem(SESSION_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as AdminUser
        if (parsed?.email) setAdminUser(parsed)
      }
    } catch { /* ignore */ }
    setIsAdminLoading(false)
  }, [])

  const loginAdmin = useCallback((email: string, password: string) => {
    const found = ADMIN_CREDENTIALS.find(
      (c) =>
        c.email.toLowerCase() === email.trim().toLowerCase() &&
        c.password === password
    )
    if (!found) return { success: false, error: "invalidCredentials" }

    const u: AdminUser = { name: found.name, email: found.email, avatarInitials: "AD" }
    setAdminUser(u)
    if (typeof window !== "undefined") {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(u))
    }
    return { success: true }
  }, [])

  const logoutAdmin = useCallback(() => {
    setAdminUser(null)
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(SESSION_KEY)
    }
  }, [])

  return (
    <AdminAuthContext.Provider
      value={{ adminUser, isAdminLoggedIn: !!adminUser, isAdminLoading, loginAdmin, logoutAdmin }}
    >
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) throw new Error("useAdminAuth must be used within an AdminAuthProvider")
  return ctx
}

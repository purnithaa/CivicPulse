"use client"

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react"
import type { StaffStatus } from "@/lib/mock-data"
import { apiUrl } from "@/lib/api-base"

export interface StaffUser {
  id: string
  name: string
  employeeId: string
  department: string
  phone: string
  avatarInitials: string
  status: StaffStatus
  activeIssues: number
  resolvedCount: number
  mustChangePassword?: boolean
}

interface StoredStaffUser {
  name: string
  employeeId: string
  phone: string
  password: string
}

const STORAGE_KEY = "civicpulse_staff"
const REGISTRY_KEY = "civicpulse_staff_registry"
const SESSION_KEY = "civicpulse_staff_session"

interface StaffRegistryEntry {
  name: string
  employeeId: string
  phone: string
  department: string
}

function getStaffRegistry(): StaffRegistryEntry[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(REGISTRY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function getStoredStaff(): StoredStaffUser[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveStoredStaff(users: StoredStaffUser[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users))
}

function makeInitials(name: string): string {
  const parts = name.trim().split(" ")
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

export type StaffLoginResult = { success: true } | { success: false; error: string }

interface StaffAuthContextType {
  staffUser: StaffUser | null
  isStaffLoggedIn: boolean
  isStaffLoading: boolean
  loginStaff: (employeeId: string, password: string) => Promise<StaffLoginResult>
  changeStaffPassword: (currentPassword: string, newPassword: string, confirmPassword: string) => Promise<{ success: boolean; error?: string }>
  signupStaff: (name: string, employeeId: string, phone: string, password: string) => { success: boolean; error?: string }
  logoutStaff: () => void
  updateStaffStatus: (status: StaffStatus) => void
  updateStaffStats: (updates: Partial<Pick<StaffUser, "activeIssues" | "resolvedCount">>) => void
}

const StaffAuthContext = createContext<StaffAuthContextType | null>(null)

export function StaffAuthProvider({ children }: { children: ReactNode }) {
  const [staffUser, setStaffUser] = useState<StaffUser | null>(null)
  const [isStaffLoading, setIsStaffLoading] = useState(true)

  // Hydrate session from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") {
      setIsStaffLoading(false)
      return
    }
    try {
      const raw = localStorage.getItem(SESSION_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as StaffUser
        if (parsed?.employeeId) setStaffUser(parsed)
      }
    } catch { /* ignore */ }
    setIsStaffLoading(false)
  }, [])

  // Persist session on every change
  useEffect(() => {
    if (typeof window === "undefined") return
    if (staffUser) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(staffUser))
    } else {
      localStorage.removeItem(SESSION_KEY)
    }
  }, [staffUser])

  const signupStaff = useCallback((name: string, employeeId: string, phone: string, password: string) => {
    const users = getStoredStaff()
    const exists = users.some(
      (u) => u.employeeId.toLowerCase() === employeeId.trim().toLowerCase()
    )
    if (exists) return { success: false, error: "accountExists" }

    const registry = getStaffRegistry()
    const registered = registry.find(
      (r) => r.employeeId.toLowerCase() === employeeId.trim().toLowerCase()
    )
    if (registry.length > 0 && !registered) {
      return { success: false, error: "employeeIdNotRecognized" }
    }

    const newUser: StoredStaffUser = {
      name: registered ? registered.name : name.trim(),
      employeeId: employeeId.trim(),
      phone: registered ? registered.phone : phone.trim(),
      password,
    }
    users.push(newUser)
    saveStoredStaff(users)
    return { success: true }
  }, [])

  const loginStaff = useCallback(async (employeeId: string, password: string): Promise<StaffLoginResult> => {
    try {
      const url = apiUrl("/api/auth/staff")
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", employeeId: employeeId.trim(), password: password || undefined }),
      })
      const data = await res.json().catch(() => ({ error: "networkError" }))

      if (data.error === "networkError" || (data.error && res.status === 0)) {
        return { success: false, error: "networkError" }
      }
      if (data.error) {
        return { success: false, error: data.error }
      }
      if (data.success && data.staff) {
        const s = data.staff
        const user: StaffUser = {
          id: s.id ?? `staff-${s.employee_id}`,
          name: s.name ?? "",
          employeeId: s.employee_id ?? s.employeeId ?? "",
          department: s.department ?? "General",
          phone: s.phone ?? "",
          avatarInitials: makeInitials(s.name ?? ""),
          status: "available" as StaffStatus,
          activeIssues: 0,
          resolvedCount: 0,
          mustChangePassword: data.mustChangePassword ?? false,
        }
        setStaffUser(user)
        return { success: true }
      }
      return { success: false, error: "invalidCredentials" }
    } catch (e) {
      return { success: false, error: "networkError" }
    }
  }, [])

  const changeStaffPassword = useCallback(
    async (currentPassword: string, newPassword: string, confirmPassword: string): Promise<{ success: boolean; error?: string }> => {
      const empId = staffUser?.employeeId
      if (!empId) return { success: false, error: "Not logged in" }
      try {
        const res = await fetch(apiUrl("/api/auth/staff"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "changePassword",
            employeeId: empId,
            currentPassword,
            newPassword,
            confirmPassword,
          }),
        })
        const data = await res.json()
        if (data.error) return { success: false, error: data.error }
        setStaffUser((prev) => prev ? { ...prev, mustChangePassword: false } : prev)
        return { success: true }
      } catch {
        return { success: false, error: "Failed to change password" }
      }
    },
    [staffUser?.employeeId]
  )

  const logoutStaff = useCallback(() => {
    setStaffUser(null)
  }, [])

  const updateStaffStatus = useCallback((status: StaffStatus) => {
    setStaffUser((prev) => {
      if (!prev) return prev
      const next = { ...prev, status }
      fetch(apiUrl("/api/staff"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: prev.employeeId, status }),
      }).catch(() => { /* best-effort sync */ })
      return next
    })
  }, [])

  const updateStaffStats = useCallback(
    (updates: Partial<Pick<StaffUser, "activeIssues" | "resolvedCount">>) => {
      setStaffUser((prev) => prev ? { ...prev, ...updates } : prev)
    },
    []
  )

  return (
    <StaffAuthContext.Provider
      value={{
        staffUser,
        isStaffLoggedIn: !!staffUser,
        isStaffLoading,
        loginStaff,
        changeStaffPassword,
        signupStaff,
        logoutStaff,
        updateStaffStatus,
        updateStaffStats,
      }}
    >
      {children}
    </StaffAuthContext.Provider>
  )
}

export function useStaffAuth() {
  const ctx = useContext(StaffAuthContext)
  if (!ctx)
    throw new Error("useStaffAuth must be used within a StaffAuthProvider")
  return ctx
}

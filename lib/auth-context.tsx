"use client"

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react"
import { apiUrl } from "@/lib/api-base"

export interface CitizenUser {
  name: string
  phone: string
  email: string
  avatarInitials: string
}

interface StoredCitizenUser {
  name: string
  phone: string
  email: string
  password: string
}

interface AuthContextType {
  user: CitizenUser | null
  isLoggedIn: boolean
  login: (emailOrPhone: string, password: string) => Promise<{ success: boolean; error?: string }>
  signup: (name: string, emailOrPhone: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  updateProfile: (updates: Partial<CitizenUser>) => void
}

const STORAGE_KEY = "civicpulse_citizens"
const CURRENT_USER_KEY = "civicpulse_current_citizen"

function getStoredUsers(): StoredCitizenUser[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveStoredUsers(users: StoredCitizenUser[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users))
}

function makeInitials(name: string): string {
  const parts = name.trim().split(" ")
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

function isEmail(value: string): boolean {
  return value.includes("@")
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CitizenUser | null>(null)

  // Hydrate session from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const raw = localStorage.getItem(CURRENT_USER_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as CitizenUser
      if (parsed && (parsed.email || parsed.phone)) setUser(parsed)
    } catch { /* ignore */ }
  }, [])

  const signup = useCallback(async (name: string, emailOrPhone: string, password: string) => {
    const users = getStoredUsers()
    const identifier = emailOrPhone.trim().toLowerCase()

    // 1. Quick local duplicate check (works offline too)
    const existsLocally = users.some(
      (u) => u.email.toLowerCase() === identifier || u.phone === identifier
    )
    if (existsLocally) return { success: false, error: "accountExists" }

    // 2. Check Supabase as the canonical source of truth (awaited — NOT fire-and-forget)
    //    This catches duplicates even when the user cleared their browser data or
    //    tries to register again from a different device.
    try {
      const res = await fetch(apiUrl("/api/auth/citizen"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "signup", name, emailOrPhone, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        // DB table not set up yet — fall through to localStorage-only mode
        if (data.error !== "dbNotReady") {
          // accountExists (409) or any other real error — block the signup
          return { success: false, error: data.error || "accountExists" }
        }
      }
      // If res.ok, Supabase already inserted the record — no need to sync again
    } catch {
      // Network / server unreachable — continue in localStorage-only mode
    }

    // 3. Save locally only after Supabase confirmed it's a brand-new account
    //    (or DB isn't available, in which case localStorage is the only store)
    const newUser: StoredCitizenUser = {
      name: name.trim(),
      email: isEmail(identifier) ? identifier : "",
      phone: isEmail(identifier) ? "" : identifier,
      password,
    }
    users.push(newUser)
    saveStoredUsers(users)

    return { success: true }
  }, [])

  const login = useCallback(async (emailOrPhone: string, password: string) => {
    const identifier = emailOrPhone.trim().toLowerCase()

    // 1. Try localStorage first (fast, offline-capable)
    const users = getStoredUsers()
    const found = users.find(
      (u) =>
        (u.email.toLowerCase() === identifier || u.phone === identifier) &&
        u.password === password
    )

    if (found) {
      const loggedIn: CitizenUser = {
        name: found.name,
        phone: found.phone,
        email: found.email,
        avatarInitials: makeInitials(found.name),
      }
      setUser(loggedIn)
      if (typeof window !== "undefined") {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(loggedIn))
      }
      return { success: true }
    }

    // 2. Try Supabase as fallback (for users on different devices / migrated accounts)
    try {
      const res = await fetch(apiUrl("/api/auth/citizen"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", emailOrPhone, password }),
      })
      const data = await res.json()

      if (res.ok && data.success && data.user) {
        const supaUser = data.user
        const loggedIn: CitizenUser = {
          name: supaUser.name,
          phone: supaUser.phone ?? "",
          email: supaUser.email ?? "",
          avatarInitials: makeInitials(supaUser.name),
        }
        // Save to localStorage so future logins are instant
        const newStored: StoredCitizenUser = {
          name: loggedIn.name,
          email: loggedIn.email,
          phone: loggedIn.phone,
          password,
        }
        const updatedUsers = getStoredUsers()
        if (!updatedUsers.some((u) => u.email === loggedIn.email && u.phone === loggedIn.phone)) {
          updatedUsers.push(newStored)
          saveStoredUsers(updatedUsers)
        }
        setUser(loggedIn)
        if (typeof window !== "undefined") {
          localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(loggedIn))
        }
        return { success: true }
      }

      // If Supabase also fails, return generic error
      if (data.error === "dbNotReady") {
        return { success: false, error: "invalidCredentials" }
      }
      return { success: false, error: data.error || "invalidCredentials" }
    } catch {
      // Network error — can't reach Supabase
      return { success: false, error: "invalidCredentials" }
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    if (typeof window !== "undefined") {
      localStorage.removeItem(CURRENT_USER_KEY)
    }
  }, [])

  const updateProfile = useCallback((updates: Partial<CitizenUser>) => {
    setUser((prev) => {
      if (!prev) return prev
      const updated = { ...prev, ...updates }
      if (updates.name) updated.avatarInitials = makeInitials(updated.name)
      if (typeof window !== "undefined") {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updated))
      }
      return updated
    })
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, login, signup, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider")
  return ctx
}

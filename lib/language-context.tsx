"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import { translations, type Language, type TranslationKey } from "./translations"

const LANGUAGE_STORAGE_KEY = "civicpulse_language"

function loadStoredLanguage(): Language {
  if (typeof window === "undefined") return "en"
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY)
    if (stored === "en" || stored === "ta" || stored === "hi") return stored
  } catch { /* ignore */ }
  return "en"
}

function saveLanguage(lang: Language) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang)
  } catch { /* ignore */ }
}

interface LanguageContextType {
  language: Language
  toggleLanguage: () => void
  setLanguage: (lang: Language) => void
  t: (key: TranslationKey) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en")
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setLanguageState(loadStoredLanguage())
    setHydrated(true)
  }, [])

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang)
    saveLanguage(lang)
  }, [])

  const toggleLanguage = useCallback(() => {
    setLanguageState((prev) => {
      const next = prev === "en" ? "ta" : prev === "ta" ? "hi" : "en"
      saveLanguage(next)
      return next
    })
  }, [])

  const t = useCallback(
    (key: TranslationKey) => {
      if (!hydrated) return typeof key === "string" ? key : ""
      const value = translations[language][key]
      return value !== undefined ? value : (typeof key === "string" ? key : "")
    },
    [language, hydrated]
  )

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}

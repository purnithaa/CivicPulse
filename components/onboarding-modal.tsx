"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Camera,
  MapPin,
  Bell,
  CheckCircle2,
  ArrowRight,
  ChevronLeft,
} from "lucide-react"

const ONBOARDING_KEY = "civicpulse_onboarded"

const steps = [
  {
    icon: Camera,
    iconBg: "bg-primary/15",
    iconColor: "text-primary",
    title: "Snap & Report Issues",
    description:
      "Take a photo of any urban issue — potholes, broken streetlights, overflowing bins — and report it in under a minute. Every report matters!",
    tip: "Tip: Use 'Report Issue' in the menu to get started",
  },
  {
    icon: MapPin,
    iconBg: "bg-accent/15",
    iconColor: "text-accent",
    title: "Pin the Location",
    description:
      "Use GPS to automatically detect your location, or type an address manually. Accurate location helps field staff reach the issue faster.",
    tip: "Tip: Allow location access for faster reporting",
  },
  {
    icon: Bell,
    iconBg: "bg-warning/15",
    iconColor: "text-warning",
    title: "Track Progress & Get Notified",
    description:
      "Follow your report's journey from Submitted → In Review → Dispatched → Resolved. You'll receive notifications at each stage.",
    tip: "Tip: Check 'My Reports' to see all your submissions",
  },
  {
    icon: CheckCircle2,
    iconBg: "bg-success/15",
    iconColor: "text-success",
    title: "You're All Set!",
    description:
      "Together, we can make our city cleaner and safer. Every issue you report helps the municipality prioritize and fix problems faster.",
    tip: "Ready to make a difference? Start reporting!",
  },
]

export function OnboardingModal() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (typeof window === "undefined") return
    const done = localStorage.getItem(ONBOARDING_KEY)
    if (!done) {
      // Small delay so the page renders first
      const timer = setTimeout(() => setOpen(true), 800)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleClose = () => {
    localStorage.setItem(ONBOARDING_KEY, "true")
    setOpen(false)
  }

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep((s) => s + 1)
    } else {
      handleClose()
    }
  }

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1)
  }

  const current = steps[step]
  const Icon = current.icon
  const isLast = step === steps.length - 1

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
      <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="sr-only">Welcome to CivicPulse</DialogTitle>
        </DialogHeader>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 pb-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i === step ? "w-6 bg-primary" : i < step ? "w-2 bg-primary/40" : "w-2 bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Icon */}
        <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${current.iconBg}`}>
          <Icon className={`h-10 w-10 ${current.iconColor}`} />
        </div>

        {/* Content */}
        <div className="text-center px-2">
          <h2
            className="text-xl font-bold text-foreground"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {current.title}
          </h2>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            {current.description}
          </p>
          <p className="mt-3 rounded-lg bg-muted/50 px-3 py-2 text-xs text-primary font-medium">
            {current.tip}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3 pt-2">
          {step > 0 ? (
            <Button variant="outline" size="sm" className="gap-1" onClick={handleBack}>
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={handleClose}
            >
              Skip
            </Button>
          )}
          <Button className="flex-1 gap-2" onClick={handleNext}>
            {isLast ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Get Started
              </>
            ) : (
              <>
                Next
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

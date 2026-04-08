"use client"

import { useState, useRef, useCallback, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { CitizenHeader } from "@/components/citizen-header"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import {
  Camera,
  MapPin,
  Upload,
  X,
  Loader2,
  CheckCircle2,
  ImageIcon,
  Navigation,
} from "lucide-react"
import { departmentMap, type IssueCategory } from "@/lib/mock-data"
import type { TranslationKey } from "@/lib/translations"
import { CategoryIcon } from "@/components/category-icon"
import { useAuth } from "@/lib/auth-context"
import { useLanguage } from "@/lib/language-context"
import { checkRateLimit, formatRemainingTime } from "@/lib/rate-limiter"
import { requestLocationPermission, requestCameraPermission } from "@/lib/permissions"
import { apiUrl } from "@/lib/api-base"
import { Capacitor } from "@capacitor/core"
import { Camera as CapacitorCamera } from "@capacitor/camera"

export default function ReportPage() {
  return (
    <div className="min-h-screen bg-background">
      <CitizenHeader />
      <main className="mx-auto max-w-2xl px-4 pb-24 md:pb-8">
        <Suspense fallback={<div className="mt-10 text-center text-sm text-muted-foreground">Loading...</div>}>
          <ReportForm />
        </Suspense>
      </main>
      <MobileBottomNav />
    </div>
  )
}

function ReportForm() {
  const searchParams = useSearchParams()
  const initialCategory = searchParams.get("category") as IssueCategory | null
  const { user } = useAuth()
  const { t } = useLanguage()

  const [step, setStep] = useState(1)
  const [category, setCategory] = useState<IssueCategory | "">(initialCategory || "")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [priority, setPriority] = useState<string>("medium")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [locating, setLocating] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submittedId, setSubmittedId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10MB")
      return
    }
    setImageFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }, [])

  const handleUploadClick = useCallback(async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        await CapacitorCamera.requestPermissions()
      } catch {
        // Continue - OS may still allow gallery/camera
      }
    } else {
      try {
        await requestCameraPermission()
      } catch {
        // Continue to file picker
      }
    }
    fileInputRef.current?.click()
  }, [])

  const handleTakePhoto = useCallback(async () => {
    if (Capacitor.isNativePlatform()) {
      handleUploadClick()
      return
    }
    requestCameraPermission()
      .then(() => fileInputRef.current?.click())
      .catch(() => {
        toast.error("Camera access is needed to take a photo. Please allow camera permission in your browser or device settings.")
      })
  }, [handleUploadClick])

  const applyPosition = useCallback(async (latitude: number, longitude: number) => {
    const latNum = Number(latitude)
    const lngNum = Number(longitude)
    if (typeof latNum !== "number" || typeof lngNum !== "number" || isNaN(latNum) || isNaN(lngNum)) {
      setLocating(false)
      toast.error("Invalid coordinates. Enter location manually.")
      return
    }
    setLat(latNum)
    setLng(lngNum)
    const fallback = `${latNum.toFixed(5)}, ${lngNum.toFixed(5)}`
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latNum}&lon=${lngNum}&format=json`,
        { headers: { "Accept-Language": "en" }, cache: "force-cache" }
      )
      if (res.status === 429) {
        setLocation(fallback)
        toast.success("GPS coordinates captured (address lookup limited)")
        setLocating(false)
        return
      }
      const text = await res.text()
      let displayName: string | undefined
      try {
        const data = JSON.parse(text)
        displayName = data?.display_name
      } catch {
        displayName = undefined
      }
      setLocation(typeof displayName === "string" && displayName.trim() ? displayName : fallback)
      toast.success("Location detected successfully")
    } catch (_err) {
      setLocation(fallback)
      toast.success("GPS coordinates captured")
    }
    setLocating(false)
  }, [])

  // Use browser geolocation everywhere (web + native). Works reliably and triggers native permission prompt.
  const handleGetLocation = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast.error("GPS is not supported. Enter location manually.")
      return
    }
    setLocating(true)
    toast.info("Allow location access when your device asks.")
    requestLocationPermission()
      .then(async (position) => {
        const coords = position?.coords
        const latitude = coords?.latitude
        const longitude = coords?.longitude
        if (latitude == null || longitude == null) {
          toast.error("Could not get coordinates. Enter location manually.")
          return
        }
        await applyPosition(latitude, longitude)
      })
      .catch((err: GeolocationPositionError & { message?: string }) => {
        if (err.code === 1 || err.message === "User denied" || err.message?.toLowerCase().includes("denied")) {
          toast.error("Location permission denied. Please enable location in your browser or device settings and try again.")
        } else if (err.code === 2) {
          toast.error("Location unavailable. Enter it manually.")
        } else if (err.message === "UNSUPPORTED") {
          toast.error("GPS is not supported. Enter location manually.")
        } else {
          toast.error("Could not detect location. Enter manually.")
        }
      })
      .finally(() => setLocating(false))
  }, [applyPosition])

  const department = category ? departmentMap[category] : null

  const handleSubmit = useCallback(async () => {
    if (!category || !title || !description || !location) {
      toast.error("Please fill all required fields")
      return
    }

    try {
      setSubmitting(true)

      // Rate limiting: max 5 reports per hour per user
      const userId = user?.phone || user?.email || "anonymous"
      const rl = checkRateLimit("report_submit", userId, 5, 60 * 60 * 1000)
      if (!rl.allowed) {
        toast.error(`Too many reports! Please wait ${formatRemainingTime(rl.remainingMs)} before submitting again.`)
        setSubmitting(false)
        return
      }

      // Upload image to Supabase Storage
      let imageUrl: string | null = null
      if (imagePreview) {
        try {
          const fileName = imageFile?.name ?? "photo.jpg"
          const contentType = imageFile?.type ?? (imagePreview.startsWith("data:") ? (imagePreview.match(/^data:([^;]+)/)?.[1] ?? "image/jpeg") : "image/jpeg")
          const uploadRes = await fetch(apiUrl("/api/upload"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              base64: imagePreview,
              fileName,
              contentType,
            }),
          })
          const uploadData = await uploadRes.json()
          if (uploadData.url) imageUrl = uploadData.url
        } catch {
          toast("Photo upload failed — submitting without image", { icon: "⚠️" })
        }
      }

      const res = await fetch(apiUrl("/api/issues"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category,
          location,
          department,
          reporterName: user?.name ?? null,
          reporterContact: user?.phone || user?.email || null,
          lat,
          lng,
          imageUrl,
          priority,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to submit issue")
      }

      const created = await res.json()
      setSubmittedId(created?.id ?? null)
      setSubmitted(true)
      toast.success("Issue reported successfully!")
    } catch (err: any) {
      toast.error(err?.message || "Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }, [category, title, description, location, department, imagePreview, imageFile, lat, lng, priority, user])

  const resetForm = useCallback(() => {
    setStep(1); setCategory(""); setTitle(""); setDescription(""); setLocation("")
    setLat(null); setLng(null); setPriority("medium"); setImageFile(null)
    setImagePreview(null); setSubmitted(false); setSubmittedId(null)
  }, [])

  if (submitted) {
    return <SubmissionSuccess onNewReport={resetForm} issueId={submittedId} />
  }

  return (
    <div className="mt-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
          {t("reportTitle")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
          {t("reportSubtitle")}
        </p>
      </div>

      {/* Progress steps */}
      <div className="mb-8 flex items-center gap-2" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={3}>
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex flex-1 items-center gap-2">
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
              s <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}>
              {s < step ? <CheckCircle2 className="h-4 w-4" /> : s}
            </div>
            {s < 3 && <div className={`h-0.5 flex-1 rounded-full transition-colors ${s < step ? "bg-primary" : "bg-border"}`} />}
          </div>
        ))}
      </div>

      <div className="mb-6 flex justify-between text-xs font-medium text-muted-foreground">
        <span className={step >= 1 ? "text-primary" : ""}>{t("reportStepCategory")}</span>
        <span className={step >= 2 ? "text-primary" : ""}>{t("reportStepDetails")}</span>
        <span className={step >= 3 ? "text-primary" : ""}>{t("reportStepReview")}</span>
      </div>

      {/* Step 1: Category */}
      {step === 1 && (
        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <Label className="text-base font-semibold text-foreground">{t("reportWhatType")}</Label>
            <p className="mt-1 text-sm text-muted-foreground">{t("reportSelectCategory")}</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {(["pothole", "streetlight", "sanitation", "water", "traffic", "vandalism", "other"] as IssueCategory[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCategory(key)}
                  className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-all ${
                    category === key ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-card hover:border-primary/30"
                  }`}
                >
                  <CategoryIcon category={key} size="sm" />
                  <span className="text-sm font-medium text-foreground">{t(`category${key.charAt(0).toUpperCase() + key.slice(1)}` as TranslationKey)}</span>
                </button>
              ))}
            </div>
            {department && (
              <p className="mt-4 rounded-lg bg-primary/5 p-3 text-xs text-primary">
                {t("reportRoutedTo")} <strong>{department}</strong>
              </p>
            )}
            <Button className="mt-6 w-full" size="lg" disabled={!category} onClick={() => setStep(2)}>
              {t("reportContinue")}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Details */}
      {step === 2 && (
        <Card className="border-border bg-card">
          <CardContent className="flex flex-col gap-5 p-6">
            <div>
              <Label htmlFor="title" className="text-sm font-semibold text-foreground">{t("reportIssueTitle")}</Label>
              <Input id="title" placeholder={t("reportBriefTitle")} className="mt-2" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div>
              <Label htmlFor="description" className="text-sm font-semibold text-foreground">{t("reportDescription")}</Label>
              <Textarea id="description" placeholder={t("reportDescriptionPlaceholder")} className="mt-2 min-h-28" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <div>
              <Label className="text-sm font-semibold text-foreground">{t("reportPhoto")}</Label>
              <p className="mt-1 text-xs text-muted-foreground">{t("reportPhotoHint")}</p>
              <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload} />
              {imagePreview ? (
                <div className="relative mt-3 overflow-hidden rounded-xl border border-border">
                  <img src={imagePreview} alt="Issue preview" className="h-48 w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => { setImagePreview(null); setImageFile(null) }}
                    className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-foreground/70 text-background transition-colors hover:bg-foreground"
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Remove photo</span>
                  </button>
                </div>
              ) : (
                <div className="mt-3 flex gap-3">
                  <Button type="button" variant="outline" className="flex-1 gap-2" onClick={handleTakePhoto}>
                    <Camera className="h-4 w-4" /> {t("reportTakePhoto")}
                  </Button>
                  <Button type="button" variant="outline" className="flex-1 gap-2" onClick={handleUploadClick}>
                    <Upload className="h-4 w-4" /> {t("reportUpload")}
                  </Button>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="location" className="text-sm font-semibold text-foreground">{t("reportLocation")}</Label>
              <div className="mt-2 flex gap-2">
                <div className="relative flex-1">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="location"
                    placeholder={t("reportLocationPlaceholder")}
                    className="pl-9"
                    value={location}
                    onChange={(e) => { setLocation(e.target.value); setLat(null); setLng(null) }}
                  />
                </div>
                <Button type="button" variant="outline" size="icon" onClick={handleGetLocation} disabled={locating} className="shrink-0" title="Detect my location">
                  {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
                  <span className="sr-only">Use GPS location</span>
                </Button>
              </div>
              {lat !== null && lng !== null && (
                <p className="mt-1 text-xs text-success">📍 GPS captured: {lat.toFixed(5)}, {lng.toFixed(5)}</p>
              )}
            </div>

            <div>
              <Label htmlFor="priority" className="text-sm font-semibold text-foreground">{t("reportPriority")}</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{t("reportPriorityLow")}</SelectItem>
                  <SelectItem value="medium">{t("reportPriorityMedium")}</SelectItem>
                  <SelectItem value="high">{t("reportPriorityHigh")}</SelectItem>
                  <SelectItem value="critical">{t("reportPriorityCritical")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>{t("reportBack")}</Button>
              <Button className="flex-1" disabled={!title || !description || !location} onClick={() => setStep(3)}>{t("reportContinue")}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <Card className="border-border bg-card">
          <CardContent className="flex flex-col gap-4 p-6">
            <h3 className="text-base font-semibold text-foreground">{t("reportReviewTitle")}</h3>

            {imagePreview && (
              <div className="overflow-hidden rounded-xl border border-border">
                <img src={imagePreview} alt="Issue preview" className="h-40 w-full object-cover" />
              </div>
            )}

            <div className="flex flex-col gap-3 rounded-xl bg-muted/50 p-4">
              <div className="flex items-center gap-3">
                {category && <CategoryIcon category={category} size="sm" />}
                <div>
                  <p className="text-xs text-muted-foreground">{t("reviewCategory")}</p>
                  <p className="text-sm font-medium text-foreground">{category ? t(`category${category.charAt(0).toUpperCase() + category.slice(1)}` as TranslationKey) : ""}</p>
                </div>
              </div>
              <div className="h-px bg-border" />
              <div><p className="text-xs text-muted-foreground">{t("reviewTitle")}</p><p className="text-sm font-medium text-foreground">{title}</p></div>
              <div className="h-px bg-border" />
              <div><p className="text-xs text-muted-foreground">{t("reviewDescription")}</p><p className="text-sm text-foreground leading-relaxed">{description}</p></div>
              <div className="h-px bg-border" />
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">{t("reviewLocation")}</p>
                  <p className="text-sm font-medium text-foreground">{location}</p>
                  {lat !== null && lng !== null && <p className="text-xs text-success">GPS: {lat.toFixed(5)}, {lng.toFixed(5)}</p>}
                </div>
              </div>
              <div className="h-px bg-border" />
              <div className="flex gap-6">
                <div><p className="text-xs text-muted-foreground">{t("reviewDepartment")}</p><p className="text-sm font-medium text-primary">{department}</p></div>
                <div><p className="text-xs text-muted-foreground">{t("reviewPriority")}</p><p className="text-sm font-medium text-foreground capitalize">{priority}</p></div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>{t("reportBack")}</Button>
              <Button className="flex-1 gap-2" onClick={handleSubmit} disabled={submitting}>
                {submitting ? <><Loader2 className="h-4 w-4 animate-spin" />{t("reportSubmitting")}</> : t("reportSubmit")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function SubmissionSuccess({ onNewReport, issueId }: { onNewReport: () => void; issueId: string | null }) {
  const { t } = useLanguage()
  return (
    <div className="mt-16 flex flex-col items-center px-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success/15">
        <CheckCircle2 className="h-10 w-10 text-success" />
      </div>
      <h2 className="mt-6 text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
        {t("reportSubmitted")}
      </h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground leading-relaxed">
        {t("reportReceived")}
      </p>
      {issueId && (
        <p className="mt-2 font-mono text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
          {t("issueIdLabel")}: {issueId.slice(0, 8)}
        </p>
      )}
      <div className="mt-8 flex gap-3">
        <Button variant="outline" onClick={onNewReport} className="gap-2">
          <ImageIcon className="h-4 w-4" /> {t("reportAnother")}
        </Button>
        <Button asChild className="gap-2">
          <a href="/my-reports">{t("goToMyReports")}</a>
        </Button>
      </div>
    </div>
  )
}

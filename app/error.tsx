"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Application error:", error)
  }, [error])

  return (
    <div className="flex min-h-[100vh] flex-col items-center justify-center bg-background px-6 text-center">
      <AlertCircle className="h-12 w-12 text-destructive" />
      <h2 className="mt-4 text-lg font-semibold text-foreground">Something went wrong</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        The app encountered an error. Try again.
      </p>
      {/* Debug info — remove after root cause is identified */}
      <div className="mt-4 max-w-sm rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-left">
        <p className="text-xs font-mono text-destructive break-all">
          {error?.message || "Unknown error"}
        </p>
        {error?.digest && (
          <p className="mt-1 text-xs text-muted-foreground font-mono">digest: {error.digest}</p>
        )}
      </div>
      <Button className="mt-6" onClick={reset}>
        Try again
      </Button>
    </div>
  )
}

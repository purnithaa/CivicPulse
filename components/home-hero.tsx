import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PlusCircle, MapPin } from "lucide-react"

export function HomeHero() {
  return (
    <section className="relative mt-6 overflow-hidden rounded-2xl bg-primary p-6 md:p-10">
      <div className="absolute inset-0 opacity-10">
        <svg
          viewBox="0 0 400 400"
          className="h-full w-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="350" cy="50" r="120" fill="currentColor" className="text-primary-foreground" />
          <circle cx="50" cy="350" r="80" fill="currentColor" className="text-primary-foreground" />
          <rect x="150" y="150" width="100" height="100" rx="20" fill="currentColor" className="text-primary-foreground" />
        </svg>
      </div>
      <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="max-w-md">
          <h1
            className="text-2xl font-bold tracking-tight text-primary-foreground md:text-3xl text-balance"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Keep Your City Clean
          </h1>
          <p className="mt-2 text-sm text-primary-foreground/80 leading-relaxed md:text-base">
            See a garbage dump, broken bin or dirty street? Raise a Swachhata-style complaint in seconds and
            help your ward stay clean and healthy.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/report">
            <Button
              size="lg"
              className="gap-2 bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-semibold"
            >
              <PlusCircle className="h-5 w-5" />
              Report Issue
            </Button>
          </Link>
          <Link href="/my-reports">
            <Button
              size="lg"
              variant="outline"
              className="gap-2 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
            >
              <MapPin className="h-5 w-5" />
              Track
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

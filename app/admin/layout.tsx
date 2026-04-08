"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { AdminSidebar, AdminMobileHeader } from "@/components/admin-sidebar"
import { useAdminAuth } from "@/lib/admin-auth-context"
import { Loader2 } from "lucide-react"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAdminLoggedIn, isAdminLoading } = useAdminAuth()
  const router = useRouter()

  useEffect(() => {
    // Only redirect after hydration is complete
    if (!isAdminLoading && !isAdminLoggedIn) {
      router.replace("/login?role=admin")
    }
  }, [isAdminLoggedIn, isAdminLoading, router])

  // Show spinner while checking session
  if (isAdminLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAdminLoggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <div className="flex flex-1 flex-col">
        <AdminMobileHeader />
        <main className="flex-1 overflow-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}

import type { Metadata, Viewport } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import { AnalyticsSafe } from '@/components/analytics-safe'
import { ClientShell } from '@/components/client-shell'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/lib/auth-context'
import { StaffAuthProvider } from '@/lib/staff-auth-context'
import { AdminAuthProvider } from '@/lib/admin-auth-context'
import { LanguageProvider } from '@/lib/language-context'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
})

export const metadata: Metadata = {
  title: 'CivicPulse - Urban Issue Reporting',
  description: 'Report and track urban issues in your city. Snap a photo, pin the location, and help make your community cleaner and safer.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#3366CC',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans antialiased`} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <ClientShell>
            <LanguageProvider>
              <AuthProvider>
                <StaffAuthProvider>
                  <AdminAuthProvider>
                    {children}
                    <Toaster />
                  </AdminAuthProvider>
                </StaffAuthProvider>
              </AuthProvider>
            </LanguageProvider>
          </ClientShell>
        </ThemeProvider>
        <AnalyticsSafe />
      </body>
    </html>
  )
}

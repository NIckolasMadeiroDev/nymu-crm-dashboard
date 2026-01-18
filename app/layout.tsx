import type { Metadata } from 'next'
import { Space_Grotesk, Roboto } from 'next/font/google'
import './globals.css'
import { AccessibilityPanel } from '@/components/accessibility/AccessibilityPanel'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { ChartMinimizationProvider } from '@/contexts/ChartMinimizationContext'
import { WidgetHeightProvider } from '@/contexts/WidgetHeightContext'
import { Toaster } from 'react-hot-toast'
import AuthGuard from '@/components/auth/AuthGuard'

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
})

const roboto = Roboto({
  variable: '--font-roboto',
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'NYMU CRM Dashboard',
  description: 'Real-time CRM dashboard',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/logos/yellow-logo.png', type: 'image/png', sizes: 'any' },
      { url: '/favicon.png', type: 'image/png', sizes: '32x32' },
    ],
    apple: [
      { url: '/logos/yellow-logo.png', type: 'image/png', sizes: '180x180' },
    ],
    shortcut: [
      { url: '/logos/yellow-logo.png', type: 'image/png' },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light" />
        <meta name="theme-color" content="#FF9D02" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <style dangerouslySetInnerHTML={{
          __html: `
            :root {
              color-scheme: light !important;
              -webkit-tap-highlight-color: rgba(255, 157, 2, 0.2) !important;
            }
            html, body {
              color-scheme: light !important;
              -webkit-text-size-adjust: 100% !important;
              -webkit-font-smoothing: antialiased !important;
            }
            #__next-build-watcher,
            [data-nextjs-dialog-overlay],
            [data-nextjs-toast],
            .__next-error-overlay,
            #vercel-live-feedback-button,
            [id^="vercel-"],
            [class*="vercel-"],
            [data-vercel-speed-insights],
            [data-vercel-analytics] {
              display: none !important;
              visibility: hidden !important;
              opacity: 0 !important;
              pointer-events: none !important;
            }
          `
        }} />
      </head>
      <body className={`${spaceGrotesk.variable} ${roboto.variable} antialiased`}>
        <AuthGuard>
          <LanguageProvider>
            <ChartMinimizationProvider>
              <WidgetHeightProvider>
                {children}
                <AccessibilityPanel />
                <output id="aria-live-region" aria-live="polite" aria-atomic="true" className="sr-only" />
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: 'var(--theme-background)',
                      color: 'var(--theme-foreground)',
                      border: '1px solid var(--grid-color)',
                      borderRadius: '0.5rem',
                      padding: '1rem',
                      fontFamily: 'var(--font-roboto)',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    },
                    success: {
                      style: {
                        background: 'var(--theme-background)',
                        color: 'var(--theme-foreground)',
                        border: '1px solid var(--theme-success)',
                      },
                      iconTheme: {
                        primary: 'var(--theme-success)',
                        secondary: 'var(--theme-background)',
                      },
                    },
                    error: {
                      style: {
                        background: 'var(--theme-background)',
                        color: 'var(--theme-foreground)',
                        border: '1px solid var(--theme-error)',
                      },
                      iconTheme: {
                        primary: 'var(--theme-error)',
                        secondary: 'var(--theme-background)',
                      },
                    },
                  }}
                />
              </WidgetHeightProvider>
            </ChartMinimizationProvider>
          </LanguageProvider>
        </AuthGuard>
      </body>
    </html>
  )
}


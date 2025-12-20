import type { Metadata } from 'next'
import { Space_Grotesk, Roboto } from 'next/font/google'
import './globals.css'
import { AccessibilityPanel } from '@/components/accessibility/AccessibilityPanel'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { ChartMinimizationProvider } from '@/contexts/ChartMinimizationContext'
import { WidgetHeightProvider } from '@/contexts/WidgetHeightContext'
import { Toaster } from 'react-hot-toast'

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
        <meta name="color-scheme" content="light dark" />
      </head>
      <body className={`${spaceGrotesk.variable} ${roboto.variable} antialiased`}>
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
      </body>
    </html>
  )
}


import '@/styles/globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Asistente IA para Actividades Juveniles',
  description: 'Generador inteligente de actividades, dinámicas y programaciones para grupos de jóvenes',
  keywords: ['juventud', 'actividades', 'dinámicas', 'IA', 'educación', 'monitores'],
  authors: [{ name: 'Desarrollador Asistente IA' }],
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head />
      <body className={inter.className}>
        <div className="min-h-screen bg-background font-sans antialiased">
          <div className="relative flex min-h-screen flex-col">
            <main className="flex-1">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  )
}
import '@/styles/globals.css'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Asistente IA para Actividades Juveniles',
    description: 'Generador inteligente de actividades, dinámicas y programaciones para grupos de jóvenes',
    keywords: ['juventud', 'actividades', 'dinámicas', 'IA', 'educación', 'monitores'],
    authors: [{ name: 'Desarrollador Asistente IA' }],
}

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="es" suppressHydrationWarning>
            <head />
            <body className={`${inter.className} h-screen overflow-hidden bg-background font-sans antialiased`}>
                <Providers>
                    <div className="flex h-full flex-col">
                        <main className="flex-1 overflow-hidden">
                            {children}
                        </main>
                    </div>
                </Providers>
            </body>
        </html>
    )
}
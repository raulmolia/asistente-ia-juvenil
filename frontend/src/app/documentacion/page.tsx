"use client"

import Link from "next/link"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { BookOpen, FileText, Github } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"

const ALLOWED_ROLES = new Set(["SUPERADMIN", "ADMINISTRADOR", "DOCUMENTADOR"])

export default function DocumentacionPage() {
    const router = useRouter()
    const { status, isAuthenticated, user } = useAuth()

    const canAccess = Boolean(isAuthenticated && user && ALLOWED_ROLES.has(user.rol ?? ""))

    useEffect(() => {
        if (status === "loading") return
        if (!canAccess) {
            router.replace("/")
        }
    }, [canAccess, router, status])

    if (status === "loading") {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background">
                <BookOpen className="h-8 w-8 animate-pulse text-primary" />
                <p className="text-sm text-muted-foreground">Cargando documentación…</p>
            </div>
        )
    }

    if (!canAccess) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
                <div className="space-y-2">
                    <h1 className="text-xl font-semibold">Acceso restringido</h1>
                    <p className="text-sm text-muted-foreground">
                        Esta sección está disponible para usuarios con rol de documentación o administración.
                    </p>
                </div>
                <Button onClick={() => router.replace("/")}>Volver al panel principal</Button>
            </div>
        )
    }

    return (
        <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-10">
            <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
                    <BookOpen className="h-4 w-4" aria-hidden="true" />
                    Documentación del proyecto
                </div>
                <h1 className="text-3xl font-semibold leading-tight">Centro de recursos y guías</h1>
                <p className="text-sm text-muted-foreground">
                    Accede rápidamente a los documentos esenciales para la gestión de actividades juveniles asistidas por IA.
                </p>
            </div>

            <section className="grid gap-4 md:grid-cols-2">
                <article className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
                    <header className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-primary" aria-hidden="true" />
                        <h2 className="text-lg font-semibold">Documentación interna</h2>
                    </header>
                    <p className="mt-3 text-sm text-muted-foreground">
                        Guías técnicas, estado del proyecto y resúmenes de sesiones.
                    </p>
                    <ul className="mt-4 space-y-2 text-sm">
                        <li>
                            <Link href="/docs/README.md" className="text-primary underline-offset-4 hover:underline">
                                docs/README.md
                            </Link>
                        </li>
                        <li>
                            <Link href="/docs/ESTADO_FINAL.md" className="text-primary underline-offset-4 hover:underline">
                                docs/ESTADO_FINAL.md
                            </Link>
                        </li>
                        <li>
                            <Link href="/docs/RESUMEN_SESION.md" className="text-primary underline-offset-4 hover:underline">
                                docs/RESUMEN_SESION.md
                            </Link>
                        </li>
                    </ul>
                </article>

                <article className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
                    <header className="flex items-center gap-3">
                        <Github className="h-5 w-5 text-primary" aria-hidden="true" />
                        <h2 className="text-lg font-semibold">Repositorio GitHub</h2>
                    </header>
                    <p className="mt-3 text-sm text-muted-foreground">
                        Consulta la última versión del código y la documentación centralizada online.
                    </p>
                    <Button asChild className="mt-4">
                        <Link href="https://github.com/raulmolia/asistente-ia-juvenil/tree/main/docs" target="_blank" rel="noreferrer">
                            Abrir documentación en GitHub
                        </Link>
                    </Button>
                </article>
            </section>

            <section className="rounded-2xl border border-dashed border-border/70 bg-muted/30 p-6 text-sm text-muted-foreground">
                <p>
                    ¿Necesitas añadir nuevas guías o recursos? Sube los archivos a <code className="rounded bg-background px-1">docs/</code> y actualiza este índice.
                </p>
            </section>
        </div>
    )
}

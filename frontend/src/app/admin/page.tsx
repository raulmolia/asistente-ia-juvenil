"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { ShieldCheck, Users, Settings, ClipboardList } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"

const ALLOWED_ROLES = new Set(["SUPERADMIN", "ADMINISTRADOR"])

export default function AdminPage() {
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
                <ShieldCheck className="h-8 w-8 animate-pulse text-primary" />
                <p className="text-sm text-muted-foreground">Verificando permisos…</p>
            </div>
        )
    }

    if (!canAccess) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
                <div className="space-y-2">
                    <h1 className="text-xl font-semibold">No tienes permisos de administrador</h1>
                    <p className="text-sm text-muted-foreground">
                        Solicita acceso a un administrador para gestionar esta sección.
                    </p>
                </div>
                <Button onClick={() => router.replace("/")}>Volver al panel principal</Button>
            </div>
        )
    }

    return (
        <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-6 py-10">
            <header className="space-y-2">
                <div className="flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
                    <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                    Panel de administración
                </div>
                <h1 className="text-3xl font-semibold leading-tight">Herramientas de gestión</h1>
                <p className="text-sm text-muted-foreground">
                    Configura roles, controla sesiones y revisa la actividad del asistente IA para los grupos juveniles.
                </p>
            </header>

            <section className="grid gap-4 md:grid-cols-2">
                <article className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
                    <header className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-primary" aria-hidden="true" />
                        <h2 className="text-lg font-semibold">Usuarios y roles</h2>
                    </header>
                    <p className="mt-3 text-sm text-muted-foreground">
                        Gestiona los perfiles de animadores y responsables. Próximamente podrás asignar permisos avanzados desde aquí.
                    </p>
                    <Button variant="outline" disabled className="mt-4">
                        Disponible en breve
                    </Button>
                </article>

                <article className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
                    <header className="flex items-center gap-3">
                        <Settings className="h-5 w-5 text-primary" aria-hidden="true" />
                        <h2 className="text-lg font-semibold">Configuración del asistente</h2>
                    </header>
                    <p className="mt-3 text-sm text-muted-foreground">
                        Ajusta plantillas, límites de ideas y parámetros de IA. Esta área se conectará próximamente con la configuración avanzada del backend.
                    </p>
                    <Button variant="outline" disabled className="mt-4">
                        Próxima iteración
                    </Button>
                </article>

                <article className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm md:col-span-2">
                    <header className="flex items-center gap-3">
                        <ClipboardList className="h-5 w-5 text-primary" aria-hidden="true" />
                        <h2 className="text-lg font-semibold">Registro de actividad</h2>
                    </header>
                    <p className="mt-3 text-sm text-muted-foreground">
                        Consulta el historial de sesiones, actividades generadas y uso por grupo. Se integrará con los logs del backend y la base de datos.
                    </p>
                    <div className="mt-4 rounded-lg border border-dashed border-border/60 bg-muted/30 p-4 text-xs text-muted-foreground">
                        En la próxima fase conectaremos esta vista con la base de datos MariaDB y los registros vectoriales de ChromaDB.
                    </div>
                </article>
            </section>
        </div>
    )
}

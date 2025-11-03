"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type DragEvent, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import {
    AlertCircle,
    BookOpen,
    CheckCircle2,
    UploadCloud,
    FileText,
    Loader2,
    RefreshCw,
    Tag,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ThemeToggleButton } from "@/components/theme-toggle"
import { useAuth } from "@/hooks/use-auth"
import { buildApiUrl } from "@/lib/utils"
const ALLOWED_ROLES = new Set(["SUPERADMIN", "ADMINISTRADOR", "DOCUMENTADOR"])

type TagOption = {
    id: string
    label: string
}

type DocumentoItem = {
    id: string
    titulo: string
    nombreOriginal: string
    tamanoBytes: number
    tipoMime: string
    etiquetas: string[]
    descripcionGenerada?: string | null
    estadoProcesamiento: string
    fechaCreacion: string
    fechaProcesamiento?: string | null
    mensajeError?: string | null
}

const TAG_COLOR_MAP: Record<string, string> = {
    PROGRAMACIONES: "border-blue-200 bg-blue-100 text-blue-800",
    DINAMICAS: "border-emerald-200 bg-emerald-100 text-emerald-800",
    ORACIONES: "border-violet-200 bg-violet-100 text-violet-800",
    REVISTAS: "border-amber-200 bg-amber-100 text-amber-800",
    CONTENIDO_MIXTO: "border-slate-200 bg-slate-100 text-slate-800",
    OTROS: "border-gray-200 bg-gray-100 text-gray-800",
}

const STATUS_BADGE_MAP: Record<string, { label: string; className: string }> = {
    PENDIENTE: { label: "Pendiente", className: "border-slate-200 bg-slate-100 text-slate-800" },
    PROCESANDO: { label: "Procesando", className: "border-amber-200 bg-amber-100 text-amber-800" },
    COMPLETADO: { label: "Completado", className: "border-emerald-200 bg-emerald-100 text-emerald-800" },
    ERROR: { label: "Error", className: "border-red-200 bg-red-100 text-red-700" },
}

function formatDate(value?: string | null) {
    if (!value) return "—"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "—"
    return new Intl.DateTimeFormat("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date)
}

function formatSize(bytes: number) {
    if (!Number.isFinite(bytes) || bytes <= 0) return "—"
    const units = ["B", "KB", "MB", "GB"]
    const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
    const size = bytes / 1024 ** exponent
    return `${size.toFixed(size >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`
}

export default function DocumentacionPage() {
    const router = useRouter()
    const { status, isAuthenticated, user, token } = useAuth()

    const [tagOptions, setTagOptions] = useState<TagOption[]>([])
    const [selectedTags, setSelectedTags] = useState<string[]>([])
    const [documents, setDocuments] = useState<DocumentoItem[]>([])
    const [loadingDocuments, setLoadingDocuments] = useState(false)
    const [loadingTags, setLoadingTags] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [formTitle, setFormTitle] = useState("")
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [dropping, setDropping] = useState(false)
    const [feedback, setFeedback] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const canAccess = useMemo(
        () => Boolean(isAuthenticated && user && ALLOWED_ROLES.has(user.rol ?? "")),
        [isAuthenticated, user],
    )

    useEffect(() => {
        if (status === "loading") return
        if (!canAccess) {
            router.replace("/")
        }
    }, [canAccess, router, status])

    useEffect(() => {
        if (!feedback) return
        const timer = setTimeout(() => setFeedback(null), 3200)
        return () => clearTimeout(timer)
    }, [feedback])

    const fetchTagOptions = useCallback(async () => {
        if (!token) return
        setLoadingTags(true)
        try {
            const response = await fetch(buildApiUrl("/api/documentos/etiquetas"), {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                cache: "no-store",
            })

            if (!response.ok) {
                throw new Error("No se pudieron cargar las etiquetas")
            }

            const data = await response.json()
            if (Array.isArray(data?.etiquetas)) {
                setTagOptions(data.etiquetas)
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : "No se pudieron cargar las etiquetas"
            setError(message)
        } finally {
            setLoadingTags(false)
        }
    }, [token])

    const fetchDocuments = useCallback(async () => {
        if (!token) return
        setLoadingDocuments(true)
        try {
            const response = await fetch(buildApiUrl("/api/documentos"), {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                cache: "no-store",
            })

            if (!response.ok) {
                throw new Error("No se pudo cargar la biblioteca documental")
            }

            const data = await response.json()
            if (Array.isArray(data?.documentos)) {
                setDocuments(data.documentos)
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : "No se pudo cargar la biblioteca documental"
            setError(message)
        } finally {
            setLoadingDocuments(false)
        }
    }, [token])

    useEffect(() => {
        if (!canAccess || !token) return
        fetchTagOptions()
        fetchDocuments()
    }, [canAccess, fetchDocuments, fetchTagOptions, token])

    const handleTagToggle = (tagId: string) => {
        setSelectedTags((prev) => {
            if (prev.includes(tagId)) {
                return prev.filter((value) => value !== tagId)
            }
            return [...prev, tagId]
        })
    }

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file && file.type === "application/pdf") {
            setSelectedFile(file)
            setError(null)
        } else if (file) {
            setError("Solo se admiten archivos PDF")
            setSelectedFile(null)
        }
    }

    const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault()
        event.stopPropagation()
        if (!dropping) {
            setDropping(true)
        }
    }

    const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault()
        event.stopPropagation()
        setDropping(false)
    }

    const handleDrop = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault()
        event.stopPropagation()
        setDropping(false)

        const file = event.dataTransfer.files?.[0]
        if (file && file.type === "application/pdf") {
            setSelectedFile(file)
            setError(null)
        } else if (file) {
            setError("Solo se admiten archivos PDF")
            setSelectedFile(null)
        }
    }

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (!token) return

        if (!selectedFile) {
            setError("Debes seleccionar un archivo PDF")
            return
        }

        if (selectedTags.length === 0) {
            setError("Selecciona al menos una etiqueta")
            return
        }

        setUploading(true)
        setError(null)

        const formData = new FormData()
        formData.append("archivo", selectedFile)
        formData.append("titulo", formTitle.trim())
        formData.append("etiquetas", JSON.stringify(selectedTags))

        try {
            const response = await fetch(buildApiUrl("/api/documentos"), {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            })

            const body = await response.json().catch(() => ({}))

            if (!response.ok) {
                const message = body?.message || "No se pudo subir el documento"
                throw new Error(message)
            }

            setFeedback("Documento subido correctamente")
            setFormTitle("")
            setSelectedFile(null)
            setSelectedTags([])
            fetchDocuments()
        } catch (err) {
            const message = err instanceof Error ? err.message : "No se pudo subir el documento"
            setError(message)
        } finally {
            setUploading(false)
        }
    }

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
        <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-10">
            <header className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
                        <BookOpen className="h-4 w-4" aria-hidden="true" />
                        Gestión documental
                    </div>
                    <h1 className="text-3xl font-semibold leading-tight">Repositorio de recursos</h1>
                    <p className="max-w-2xl text-sm text-muted-foreground">
                        Sube documentos PDF y etiquétalos para que la IA pueda analizarlos y usarlos como contexto en futuras actividades.
                    </p>
                    {feedback && <p className="text-sm text-primary" role="status">{feedback}</p>}
                    {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
                </div>
                <div className="flex items-center gap-2">
                    <ThemeToggleButton />
                    <Button variant="ghost" asChild>
                        <Link href="/docs/README.md" target="_blank" rel="noreferrer">
                            Ver índice local
                        </Link>
                    </Button>
                </div>
            </header>

            <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
                <form
                    className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm"
                    onSubmit={handleSubmit}
                    noValidate
                >
                    <header className="flex items-center gap-3">
                        <UploadCloud className="h-5 w-5 text-primary" aria-hidden="true" />
                        <h2 className="text-lg font-semibold">Subir archivos</h2>
                    </header>
                    <p className="mt-3 text-sm text-muted-foreground">
                        Arrastra un PDF o haz clic para seleccionarlo. Asigna etiquetas antes de enviarlo. El sistema extraerá el texto, generará una descripción breve y lo añadirá a la base vectorial.
                    </p>

                    <div
                        className={`mt-6 flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${dropping ? "border-primary bg-primary/5" : "border-border/80"
                            }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault()
                                const input = document.getElementById("input-archivo-documentacion") as HTMLInputElement | null
                                input?.click()
                            }
                        }}
                    >
                        <UploadCloud className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
                        <p className="mt-3 text-sm font-medium text-muted-foreground">
                            Arrastra un archivo PDF aquí o haz clic para seleccionar
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">Tamaño máximo 20 MB · Formato PDF</p>
                        <Input
                            id="input-archivo-documentacion"
                            type="file"
                            accept="application/pdf"
                            className="sr-only"
                            onChange={handleFileChange}
                        />
                        {selectedFile && (
                            <div className="mt-4 text-sm text-muted-foreground">
                                <span className="font-medium text-foreground">Archivo seleccionado:</span>{" "}
                                {selectedFile.name} · {formatSize(selectedFile.size)}
                            </div>
                        )}
                    </div>

                    <div className="mt-6 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="titulo-documento">Título del documento</Label>
                            <Input
                                id="titulo-documento"
                                placeholder="Título de referencia"
                                value={formTitle}
                                onChange={(event) => setFormTitle(event.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">Si lo dejas vacío se usará el nombre del archivo.</p>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                <Tag className="h-4 w-4 text-primary" aria-hidden="true" />
                                Etiquetas del documento
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {loadingTags && (
                                    <Badge className="border-slate-200 bg-slate-100 text-slate-700">
                                        <Loader2 className="mr-2 h-3 w-3 animate-spin" aria-hidden="true" />
                                        Cargando etiquetas…
                                    </Badge>
                                )}
                                {tagOptions.map((tag) => {
                                    const active = selectedTags.includes(tag.id)
                                    return (
                                        <Button
                                            key={tag.id}
                                            type="button"
                                            variant={active ? "default" : "outline"}
                                            className={`h-8 px-3 text-xs ${active ? "bg-primary text-primary-foreground" : ""}`}
                                            onClick={() => handleTagToggle(tag.id)}
                                            aria-pressed={active}
                                        >
                                            {tag.label}
                                        </Button>
                                    )
                                })}
                            </div>
                            {selectedTags.length > 0 && (
                                <p className="text-xs text-muted-foreground">
                                    Etiquetas seleccionadas: {selectedTags.length}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <Button type="submit" disabled={uploading}>
                            {uploading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                                    Procesando…
                                </>
                            ) : (
                                "Añadir a la biblioteca"
                            )}
                        </Button>
                    </div>
                </form>

                <section className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
                    <header className="flex items-center justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-primary" aria-hidden="true" />
                                <h2 className="text-lg font-semibold">Biblioteca documental</h2>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Consulta el estado de procesamiento y la descripción generada para cada documento.
                            </p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={fetchDocuments} disabled={loadingDocuments}>
                            {loadingDocuments ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                                    Actualizando…
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
                                    Actualizar
                                </>
                            )}
                        </Button>
                    </header>

                    <div className="mt-5 overflow-x-auto">
                        <table className="min-w-full divide-y divide-border/80 text-sm">
                            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium">Título</th>
                                    <th className="px-4 py-3 text-left font-medium">Descripción generada</th>
                                    <th className="px-4 py-3 text-left font-medium">Etiquetas</th>
                                    <th className="px-4 py-3 text-left font-medium">Estado</th>
                                    <th className="px-4 py-3 text-left font-medium">Subida</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60 text-sm">
                                {documents.length === 0 && !loadingDocuments && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                                            No hay documentos registrados todavía.
                                        </td>
                                    </tr>
                                )}

                                {loadingDocuments && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                                            <Loader2 className="mr-2 inline-block h-4 w-4 animate-spin" aria-hidden="true" />
                                            Cargando biblioteca…
                                        </td>
                                    </tr>
                                )}

                                {documents.map((documento) => {
                                    const estado = STATUS_BADGE_MAP[documento.estadoProcesamiento] || STATUS_BADGE_MAP.PENDIENTE
                                    return (
                                        <tr key={documento.id} className="align-top">
                                            <td className="px-4 py-4">
                                                <div className="font-medium text-foreground">{documento.titulo}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {documento.nombreOriginal} · {formatSize(documento.tamanoBytes)}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                {documento.estadoProcesamiento === "ERROR" && documento.mensajeError ? (
                                                    <div className="flex items-start gap-2 text-sm text-destructive">
                                                        <AlertCircle className="mt-0.5 h-4 w-4" aria-hidden="true" />
                                                        <span>{documento.mensajeError}</span>
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-muted-foreground">
                                                        {documento.descripcionGenerada || "En espera de procesamiento"}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {documento.etiquetas?.map((tag) => (
                                                        <Badge
                                                            key={`${documento.id}-${tag}`}
                                                            className={TAG_COLOR_MAP[tag] || "border-slate-200 bg-slate-100 text-slate-700"}
                                                        >
                                                            {tagOptions.find((option) => option.id === tag)?.label || tag}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <Badge className={estado.className}>{estado.label}</Badge>
                                                {documento.estadoProcesamiento === "COMPLETADO" && (
                                                    <div className="mt-1 flex items-center gap-1 text-xs text-emerald-600">
                                                        <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                                                        {formatDate(documento.fechaProcesamiento)}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-muted-foreground">{formatDate(documento.fechaCreacion)}</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </section>
            </section>

            <section className="rounded-2xl border border-dashed border-border/70 bg-muted/30 p-6 text-sm text-muted-foreground">
                <p>
                    Los documentos subidos se almacenan en el servidor y su contenido se replica en la base vectorial para poder consultarlo desde la IA. Mantén actualizado este espacio con materiales útiles para monitores y animadores.
                </p>
            </section>
        </div>
    )
}

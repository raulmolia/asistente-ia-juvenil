"use client"

import { FormEvent, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { LogOut, Send, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/hooks/use-auth"
import { cn } from "@/lib/utils"

type MessageRole = "usuario" | "asistente"

type ChatMessage = {
    id: string
    role: MessageRole
    content: string
}

function createId() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID()
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const demoMessages: ChatMessage[] = [
    {
        id: "intro-1",
        role: "asistente",
        content: "¡Hola! Soy tu asistente para planificar actividades juveniles. Cuéntame la edad de tu grupo y el tipo de actividad que necesitas y te propondré algo a medida.",
    },
]

function buildSampleResponse(prompt: string): string {
    return [
        "Aquí tienes una propuesta rápida:",
        "1. **Objetivo**: fomentar el trabajo en equipo y la confianza.",
        "2. **Actividad**: dinámica 'Misión cooperación' adaptada a tu grupo.",
        "3. **Materiales**: conos, cuerdas, antifaces y cronómetro.",
        "4. **Duración**: 45 minutos con fases de reflexión y cierre.",
        `Detalle adicional basado en tu petición: ${prompt.slice(0, 160)}${prompt.length > 160 ? "…" : ""}`,
        "Si quieres otra propuesta o una variante, ¡pídemelo!",
    ].join("\n")
}

export default function ChatHomePage() {
    const router = useRouter()
    const { user, status, isAuthenticated, logout } = useAuth()
    const [messages, setMessages] = useState<ChatMessage[]>(demoMessages)
    const [inputValue, setInputValue] = useState("")
    const [isThinking, setIsThinking] = useState(false)
    const scrollRef = useRef<HTMLDivElement | null>(null)

    const initials = useMemo(() => {
        if (!user) return "Tú"
        const parts = [user.nombre, user.apellidos].filter(Boolean)
        if (parts.length === 0 && user.email) {
            return user.email.charAt(0).toUpperCase()
        }
        return parts
            .join(" ")
            .split(" ")
            .map((segment) => segment.charAt(0).toUpperCase())
            .slice(0, 2)
            .join("")
    }, [user])

    useEffect(() => {
        if (status === "unauthenticated") {
            router.replace("/auth/login")
        }
    }, [router, status])

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (!inputValue.trim() || isThinking) {
            return
        }

        const prompt = inputValue.trim()
        setInputValue("")

        const newMessage: ChatMessage = {
            id: createId(),
            role: "usuario",
            content: prompt,
        }

        setMessages((prev) => [...prev, newMessage])
        setIsThinking(true)

        setTimeout(() => {
            const assistantMessage: ChatMessage = {
                id: createId(),
                role: "asistente",
                content: buildSampleResponse(prompt),
            }
            setMessages((prev) => [...prev, assistantMessage])
            setIsThinking(false)
        }, 950)
    }

    const handleLogout = async () => {
        await logout()
        router.replace("/auth/login")
    }

    if (status === "loading") {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="space-y-4 text-center">
                    <Sparkles className="mx-auto h-8 w-8 animate-pulse text-primary" aria-hidden="true" />
                    <p className="text-sm text-muted-foreground">Preparando tu espacio de trabajo...</p>
                </div>
            </div>
        )
    }

    if (!isAuthenticated) {
        return null
    }

    return (
        <div className="flex min-h-screen flex-col bg-gradient-to-b from-background via-background to-muted/40">
            <header className="sticky top-0 border-b border-border/60 bg-background/95 backdrop-blur">
                <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
                            Asistente IA Juvenil
                        </div>
                        <h1 className="text-xl font-semibold leading-tight">Panel de actividades inteligentes</h1>
                        <p className="text-sm text-muted-foreground">
                            Genera dinámicas, oraciones y programaciones adaptadas a cada grupo juvenil.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <p className="text-sm font-medium">{user?.nombre || user?.email}</p>
                            <p className="text-xs uppercase text-muted-foreground tracking-wide">{user?.rol}</p>
                        </div>
                        <Avatar>
                            {user?.avatarUrl ? (
                                <AvatarImage src={user.avatarUrl} alt={user.nombre ?? "Usuario"} />
                            ) : (
                                <AvatarFallback>{initials}</AvatarFallback>
                            )}
                        </Avatar>
                        <Button variant="outline" size="sm" onClick={handleLogout}>
                            <LogOut className="mr-1.5 h-4 w-4" aria-hidden="true" />
                            Salir
                        </Button>
                    </div>
                </div>
            </header>

            <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8">
                <div className="flex flex-1 flex-col rounded-3xl border border-border/70 bg-background/90 shadow-xl">
                    <div
                        ref={scrollRef}
                        className="flex-1 space-y-6 overflow-y-auto px-6 py-8"
                    >
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={cn("flex gap-3", message.role === "usuario" ? "justify-end" : "justify-start")}
                            >
                                {message.role === "asistente" && (
                                    <Avatar className="h-9 w-9">
                                        <AvatarFallback>IA</AvatarFallback>
                                    </Avatar>
                                )}
                                <div
                                    className={cn(
                                        "max-w-[80%] rounded-2xl border px-4 py-3 text-sm leading-relaxed shadow-sm",
                                        message.role === "usuario"
                                            ? "border-primary/10 bg-primary text-primary-foreground"
                                            : "border-border/60 bg-card text-foreground",
                                    )}
                                >
                                    <div className="whitespace-pre-wrap">{message.content}</div>
                                </div>
                                {message.role === "usuario" && (
                                    <Avatar className="h-9 w-9">
                                        <AvatarFallback>{initials}</AvatarFallback>
                                    </Avatar>
                                )}
                            </div>
                        ))}

                        {isThinking && (
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <Avatar className="h-9 w-9">
                                    <AvatarFallback>IA</AvatarFallback>
                                </Avatar>
                                <div className="flex items-center gap-2 rounded-full border border-border/60 bg-card px-3 py-2">
                                    <span className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: "0ms" }} />
                                    <span className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: "120ms" }} />
                                    <span className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: "240ms" }} />
                                    <span className="text-xs font-medium text-muted-foreground">Pensando...</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="border-t border-border/70 bg-background/80 p-6">
                        <div className="space-y-4">
                            <Textarea
                                value={inputValue}
                                onChange={(event) => setInputValue(event.target.value)}
                                placeholder="Describe la actividad que necesitas. Ejemplo: 'Necesito una dinámica de bienvenida para chicos de 12 a 14 años que fomente la confianza'."
                                className="min-h-[140px] resize-none"
                                disabled={isThinking}
                            />
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                    <span className="rounded-full border border-border px-3 py-1">Dinámicas cooperativas</span>
                                    <span className="rounded-full border border-border px-3 py-1">Programaciones trimestrales</span>
                                    <span className="rounded-full border border-border px-3 py-1">Oraciones temáticas</span>
                                </div>
                                <Button type="submit" disabled={isThinking || inputValue.trim().length === 0}>
                                    <Send className="mr-2 h-4 w-4" aria-hidden="true" />
                                    Generar propuesta
                                </Button>
                            </div>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    )
}
"use client"

import Image from "next/image"
import { FormEvent, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
    Archive,
    ChevronsLeft,
    ChevronsRight,
    LogOut,
    MessageSquare,
    MoreHorizontal,
    Send,
    Share2,
    Sparkles,
    Trash2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/hooks/use-auth"
import { cn } from "@/lib/utils"

type MessageRole = "usuario" | "asistente"

type ChatMessage = {
    id: string
    role: MessageRole
    content: string
}

type Chat = {
    id: string
    title: string
    createdAt: Date
    messages: ChatMessage[]
    archived?: boolean
}

function createId() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID()
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

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

const demoMessages: ChatMessage[] = [
    {
        id: createId(),
        role: "asistente",
        content: "¡Hola! Soy tu asistente para planificar actividades juveniles. Cuéntame la edad de tu grupo y el tipo de actividad que necesitas y te propondré algo a medida.",
    },
]

function cloneMessages(messages: ChatMessage[]): ChatMessage[] {
    return messages.map((message) => ({ ...message, id: createId() }))
}

function formatChatTitle(date: Date): string {
    const formattedDate = date.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "2-digit" })
    const formattedTime = date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", hour12: false })
    return `Chat ${formattedDate} - ${formattedTime}h`
}

function createInitialChats(): Chat[] {
    const now = new Date()
    const firstChatDate = new Date(now.getTime() - 1000 * 60 * 5)
    const secondChatDate = new Date(now.getTime() - 1000 * 60 * 120)

    return [
        {
            id: createId(),
            createdAt: firstChatDate,
            title: formatChatTitle(firstChatDate),
            messages: cloneMessages(demoMessages),
        },
        {
            id: createId(),
            createdAt: secondChatDate,
            title: formatChatTitle(secondChatDate),
            messages: [
                {
                    id: createId(),
                    role: "usuario",
                    content: "¿Puedes proponer una dinámica breve para jóvenes de 15 años que fomente la confianza?",
                },
                {
                    id: createId(),
                    role: "asistente",
                    content: buildSampleResponse("Dinámica breve para jóvenes de 15 años que fomente la confianza."),
                },
            ],
        },
    ]
}

export default function ChatHomePage() {
    const router = useRouter()
    const { user, status, isAuthenticated, logout } = useAuth()
    const initialChatsRef = useRef<Chat[]>([])

    if (initialChatsRef.current.length === 0) {
        initialChatsRef.current = createInitialChats()
    }

    const [chats, setChats] = useState<Chat[]>(initialChatsRef.current)
    const [activeChatId, setActiveChatId] = useState<string>(initialChatsRef.current[0]?.id ?? "")
    const [inputValue, setInputValue] = useState("")
    const [isThinking, setIsThinking] = useState(false)
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
    const [shareFeedback, setShareFeedback] = useState<string | null>(null)
    const scrollRef = useRef<HTMLDivElement | null>(null)

    const activeChat = useMemo(() => chats.find((chat) => chat.id === activeChatId) ?? null, [chats, activeChatId])
    const messageCount = activeChat?.messages.length ?? 0

    const initials = useMemo(() => {
        if (!user) return "TÚ"

        const firstNameInitial = user.nombre?.trim().split(/\s+/)[0]?.charAt(0).toUpperCase()
        const firstSurnameInitial = user.apellidos?.trim().split(/\s+/)[0]?.charAt(0).toUpperCase()

        if (firstNameInitial && firstSurnameInitial) {
            return `${firstNameInitial}${firstSurnameInitial}`
        }

        if (firstNameInitial) {
            return firstNameInitial
        }

        if (user.email) {
            return user.email.charAt(0).toUpperCase()
        }

        return "US"
    }, [user])

    useEffect(() => {
        if (status === "unauthenticated") {
            router.replace("/auth/login")
        }
    }, [router, status])

    useEffect(() => {
        if (!activeChatId && chats.length > 0) {
            setActiveChatId(chats[0].id)
        }
    }, [activeChatId, chats])

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messageCount, isThinking, activeChatId])

    useEffect(() => {
        if (!shareFeedback) return

        const timeout = setTimeout(() => setShareFeedback(null), 2800)
        return () => clearTimeout(timeout)
    }, [shareFeedback])

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (!inputValue.trim() || isThinking || !activeChat) {
            return
        }

        const prompt = inputValue.trim()
        setInputValue("")
        const chatId = activeChat.id

        const userMessage: ChatMessage = {
            id: createId(),
            role: "usuario",
            content: prompt,
        }

        setChats((prevChats) =>
            prevChats.map((chat) =>
                chat.id === chatId
                    ? {
                        ...chat,
                        messages: [...chat.messages, userMessage],
                    }
                    : chat,
            ),
        )

        setIsThinking(true)

        setTimeout(() => {
            const assistantMessage: ChatMessage = {
                id: createId(),
                role: "asistente",
                content: buildSampleResponse(prompt),
            }

            setChats((prevChats) =>
                prevChats.map((chat) =>
                    chat.id === chatId
                        ? {
                            ...chat,
                            messages: [...chat.messages, assistantMessage],
                        }
                        : chat,
                ),
            )
            setIsThinking(false)
        }, 950)
    }

    const handleLogout = async () => {
        await logout()
        router.replace("/auth/login")
    }

    const handleSelectChat = (chatId: string) => {
        setActiveChatId(chatId)
    }

    const handleCreateNewChat = () => {
        const createdAt = new Date()
        const newChat: Chat = {
            id: createId(),
            createdAt,
            title: formatChatTitle(createdAt),
            messages: cloneMessages(demoMessages),
        }

        setChats((prevChats) => [newChat, ...prevChats])
        setActiveChatId(newChat.id)
        setIsThinking(false)
        setInputValue("")
    }

    const handleDeleteChat = (chatId: string) => {
        setChats((prevChats) => {
            const updated = prevChats.filter((chat) => chat.id !== chatId)
            if (chatId === activeChatId) {
                setActiveChatId(updated[0]?.id ?? "")
            }
            return updated
        })
    }

    const handleArchiveChat = (chatId: string) => {
        setChats((prevChats) =>
            prevChats.map((chat) =>
                chat.id === chatId
                    ? {
                        ...chat,
                        archived: !chat.archived,
                    }
                    : chat,
            ),
        )
    }

    const handleShareChat = async (chatId: string) => {
        const chat = chats.find((item) => item.id === chatId)
        if (!chat) return

        const transcript = chat.messages
            .map((message) => `${message.role === "usuario" ? "Usuario" : "Asistente"}:\n${message.content}`)
            .join("\n\n")

        try {
            await navigator?.clipboard?.writeText(transcript)
            setShareFeedback("Conversación copiada al portapapeles")
        } catch (error) {
            console.error("No se pudo copiar la conversación", error)
            setShareFeedback("No se pudo copiar la conversación")
        }
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

    const sidebarWidthClass = isSidebarCollapsed ? "w-20" : "w-80"

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <aside
                className={cn(
                    "flex h-screen flex-col border-r border-border/50 bg-muted/40 backdrop-blur transition-all duration-300",
                    sidebarWidthClass,
                )}
            >
                <div className="flex items-center justify-between gap-2 px-4 pt-6">
                    <button
                        type="button"
                        onClick={handleCreateNewChat}
                        className={cn(
                            "group flex items-center gap-3 rounded-xl border border-border/60 bg-background px-3 py-2 text-sm font-medium shadow-sm transition",
                            "hover:border-primary/40 hover:bg-primary/5",
                            isSidebarCollapsed && "mx-auto border-none bg-transparent p-0 shadow-none",
                        )}
                    >
                        <span className="relative inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-white shadow">
                            <Image src="/logo.png" alt="RPJ" width={36} height={36} priority className="object-contain" />
                        </span>
                        {!isSidebarCollapsed && <span>Nuevo chat</span>}
                    </button>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsSidebarCollapsed((prev) => !prev)}
                        className="h-9 w-9"
                        aria-label={isSidebarCollapsed ? "Mostrar menú" : "Ocultar menú"}
                    >
                        {isSidebarCollapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
                    </Button>
                </div>

                {isSidebarCollapsed ? (
                    <div className="flex items-center justify-center py-4 text-muted-foreground">
                        <MessageSquare className="h-4 w-4" aria-hidden="true" />
                    </div>
                ) : (
                    <p className="px-4 pt-6 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Chats</p>
                )}

                <ScrollArea className="flex-1 px-2">
                    <div className="space-y-2 pb-4">
                        {chats.length === 0 && (
                            <div className="rounded-xl border border-dashed border-border/60 bg-background/60 px-3 py-8 text-center text-xs text-muted-foreground">
                                No hay conversaciones todavía. Crea un nuevo chat para empezar.
                            </div>
                        )}

                        {chats.map((chat) => {
                            const isActive = chat.id === activeChatId

                            return (
                                <div
                                    key={chat.id}
                                    className={cn(
                                        "group flex items-center gap-2 rounded-2xl px-2 py-1",
                                        isActive ? "bg-primary/10" : "",
                                    )}
                                >
                                    <Button
                                        variant="ghost"
                                        className={cn(
                                            "flex flex-1 items-center gap-3 rounded-xl px-3 py-3 text-sm",
                                            "transition hover:bg-muted",
                                            isActive && "bg-primary/10 text-primary",
                                            chat.archived && "opacity-70",
                                            isSidebarCollapsed && "justify-center px-2",
                                        )}
                                        onClick={() => handleSelectChat(chat.id)}
                                    >
                                        <MessageSquare className="h-4 w-4" aria-hidden="true" />
                                        {!isSidebarCollapsed && (
                                            <div className="flex flex-1 flex-col items-start">
                                                <span className="text-left font-medium leading-tight">{chat.title}</span>
                                                {chat.archived && (
                                                    <span className="text-xs uppercase tracking-wide text-muted-foreground">Archivado</span>
                                                )}
                                            </div>
                                        )}
                                    </Button>

                                    {!isSidebarCollapsed && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Opciones del chat">
                                                    <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-44">
                                                <DropdownMenuItem
                                                    onSelect={(event) => {
                                                        event.preventDefault()
                                                        handleShareChat(chat.id)
                                                    }}
                                                >
                                                    <Share2 className="mr-2 h-4 w-4" aria-hidden="true" /> Compartir
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onSelect={(event) => {
                                                        event.preventDefault()
                                                        handleArchiveChat(chat.id)
                                                    }}
                                                >
                                                    <Archive className="mr-2 h-4 w-4" aria-hidden="true" />
                                                    {chat.archived ? "Desarchivar" : "Archivar"}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-destructive"
                                                    onSelect={(event) => {
                                                        event.preventDefault()
                                                        handleDeleteChat(chat.id)
                                                    }}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" /> Eliminar
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </ScrollArea>

                <div className="border-t border-border/60 px-4 py-6">
                    <div
                        className={cn(
                            "flex items-center gap-3 rounded-xl border border-transparent px-3 py-2 transition",
                            "hover:border-border/60",
                            isSidebarCollapsed && "flex-col gap-2 px-0 py-0",
                        )}
                    >
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#009846] text-sm font-semibold uppercase text-white">
                            {initials}
                        </div>
                        {!isSidebarCollapsed && (
                            <div className="flex flex-col">
                                <span className="text-sm font-medium leading-tight">{user?.nombre || user?.email}</span>
                                <span className="text-xs uppercase tracking-wide text-muted-foreground">{user?.rol}</span>
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            <main className="flex flex-1 flex-col">
                <header className="flex items-center justify-between border-b border-border/60 bg-background/95 px-8 py-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
                            Asistente IA Juvenil
                        </div>
                        <h1 className="text-xl font-semibold leading-tight">Panel de actividades inteligentes</h1>
                        <p className="text-sm text-muted-foreground">
                            Genera dinámicas, oraciones y programaciones adaptadas a cada grupo juvenil.
                        </p>
                        {shareFeedback && (
                            <p className="text-xs text-primary/80" role="status">
                                {shareFeedback}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <p className="text-sm font-medium">{user?.nombre || user?.email}</p>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">{user?.rol}</p>
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
                </header>

                <section className="flex flex-1 flex-col bg-gradient-to-b from-background via-background to-muted/40 px-8 py-8">
                    <div className="flex h-full flex-col rounded-3xl border border-border/70 bg-background/90 shadow-xl">
                        <div ref={scrollRef} className="flex-1 space-y-6 overflow-y-auto px-8 py-8">
                            {activeChat && activeChat.messages.map((message) => (
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

                            {!activeChat && (
                                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                                    Selecciona o crea un chat para comenzar.
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
                                    disabled={isThinking || !activeChat}
                                />
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                        <span className="rounded-full border border-border px-3 py-1">Dinámicas cooperativas</span>
                                        <span className="rounded-full border border-border px-3 py-1">Programaciones trimestrales</span>
                                        <span className="rounded-full border border-border px-3 py-1">Oraciones temáticas</span>
                                    </div>
                                    <Button type="submit" disabled={isThinking || inputValue.trim().length === 0 || !activeChat}>
                                        <Send className="mr-2 h-4 w-4" aria-hidden="true" />
                                        Generar propuesta
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </div>
                </section>
            </main>
        </div>
    )
}
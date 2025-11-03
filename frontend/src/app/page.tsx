"use client"

import Image from "next/image"
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react"
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
    AlertTriangle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { useAuth } from "@/hooks/use-auth"
import { cn } from "@/lib/utils"
import { ThemeToggleButton } from "@/components/theme-toggle"

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

type ProfileFormState = {
    nombre: string
    apellidos: string
    telefono: string
    organizacion: string
    cargo: string
    experiencia: string
    avatarUrl: string
}

export default function ChatHomePage() {
    const router = useRouter()
    const { user, status, isAuthenticated, logout, updateProfile } = useAuth()
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
    const [isUserDialogOpen, setIsUserDialogOpen] = useState(false)
    const [isArchivedDialogOpen, setIsArchivedDialogOpen] = useState(false)
    const [profileForm, setProfileForm] = useState<ProfileFormState>({
        nombre: "",
        apellidos: "",
        telefono: "",
        organizacion: "",
        cargo: "",
        experiencia: "",
        avatarUrl: "",
    })
    const [profileSaving, setProfileSaving] = useState(false)
    const [profileFeedback, setProfileFeedback] = useState<string | null>(null)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [chatPendingDeletion, setChatPendingDeletion] = useState<Chat | null>(null)
    const scrollRef = useRef<HTMLDivElement | null>(null)

    const activeChat = useMemo(() => chats.find((chat) => chat.id === activeChatId) ?? null, [chats, activeChatId])
    const sidebarChats = useMemo(() => chats.filter((chat) => !chat.archived), [chats])
    const archivedChats = useMemo(() => chats.filter((chat) => chat.archived), [chats])
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

    const userRole = user?.rol ?? ""
    const canAccessDocumentation = ["SUPERADMIN", "ADMINISTRADOR", "DOCUMENTADOR"].includes(userRole)
    const canAccessAdministration = ["SUPERADMIN", "ADMINISTRADOR"].includes(userRole)
    const canShowOptions = canAccessDocumentation || canAccessAdministration

    useEffect(() => {
        if (status === "unauthenticated") {
            router.replace("/auth/login")
        }
    }, [router, status])

    useEffect(() => {
        if (!activeChatId) {
            const firstActiveChat = chats.find((chat) => !chat.archived)
            if (firstActiveChat) {
                setActiveChatId(firstActiveChat.id)
            }
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

    useEffect(() => {
        if (isUserDialogOpen) {
            setProfileForm({
                nombre: user?.nombre ?? "",
                apellidos: user?.apellidos ?? "",
                telefono: user?.telefono ?? "",
                organizacion: user?.organizacion ?? "",
                cargo: user?.cargo ?? "",
                experiencia: typeof user?.experiencia === "number" ? String(user?.experiencia) : "",
                avatarUrl: user?.avatarUrl ?? "",
            })
            setProfileFeedback(null)
        }
    }, [isUserDialogOpen, user])

    useEffect(() => {
        if (!profileFeedback) return

        const timeout = setTimeout(() => setProfileFeedback(null), 3000)
        return () => clearTimeout(timeout)
    }, [profileFeedback])

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

    const handleProfileInputChange = (field: keyof ProfileFormState) => (event: ChangeEvent<HTMLInputElement>) => {
        const { value } = event.target
        setProfileForm((prev) => ({
            ...prev,
            [field]: value,
        }))
    }

    const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setProfileSaving(true)
        setProfileFeedback(null)

        const experienciaParsed = profileForm.experiencia.trim().length > 0
            ? Number.parseInt(profileForm.experiencia, 10)
            : null

        const experienciaValue = experienciaParsed !== null && Number.isNaN(experienciaParsed) ? null : experienciaParsed

        const payload = {
            nombre: profileForm.nombre.trim() || null,
            apellidos: profileForm.apellidos.trim() || null,
            telefono: profileForm.telefono.trim() || null,
            organizacion: profileForm.organizacion.trim() || null,
            cargo: profileForm.cargo.trim() || null,
            avatarUrl: profileForm.avatarUrl.trim() || null,
            experiencia: experienciaValue,
        }

        const result = await updateProfile(payload)
        setProfileSaving(false)

        if (!result.success) {
            setProfileFeedback(result.error ?? "No se pudo guardar el perfil")
            return
        }

        setProfileFeedback("Perfil actualizado correctamente")
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

    const handleRequestDeleteChat = (chat: Chat) => {
        setChatPendingDeletion(chat)
        setIsDeleteDialogOpen(true)
    }

    const handleCancelDeleteChat = () => {
        setIsDeleteDialogOpen(false)
        setChatPendingDeletion(null)
    }

    const handleConfirmDeleteChat = () => {
        if (!chatPendingDeletion) {
            return
        }

        const chatId = chatPendingDeletion.id
        let nextActiveChatId = activeChatId === chatId ? "" : activeChatId

        setChats((prevChats) => {
            const updated = prevChats.filter((chat) => chat.id !== chatId)
            if (chatId === activeChatId) {
                const fallback = updated.find((chat) => !chat.archived)
                nextActiveChatId = fallback?.id ?? ""
            }
            return updated
        })

        if (nextActiveChatId !== activeChatId) {
            setActiveChatId(nextActiveChatId)
        }

        setIsDeleteDialogOpen(false)
        setChatPendingDeletion(null)
    }

    const handleArchiveChat = (chatId: string) => {
        let toggledChat: Chat | null = null
        let nextActiveChatId = activeChatId

        setChats((prevChats) => {
            const updated = prevChats.map((chat) => {
                if (chat.id === chatId) {
                    const updatedChat = {
                        ...chat,
                        archived: !chat.archived,
                    }
                    toggledChat = updatedChat
                    return updatedChat
                }
                return chat
            })

            if (toggledChat) {
                if (toggledChat.archived) {
                    if (nextActiveChatId === chatId) {
                        const fallback = updated.find((chat) => !chat.archived)
                        nextActiveChatId = fallback?.id ?? ""
                    }
                } else {
                    nextActiveChatId = chatId
                }
            }

            return updated
        })

        if (toggledChat && nextActiveChatId !== activeChatId) {
            setActiveChatId(nextActiveChatId)
        }
    }

    const handleRestoreArchivedChat = (chatId: string) => {
        handleArchiveChat(chatId)
        setIsArchivedDialogOpen(false)
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
        <DialogDescription>Los chats archivados se ocultan del panel lateral. Desarchívalos para recuperarlos cuando los necesites.</DialogDescription>
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
                        {sidebarChats.length === 0 && (
                            <div className="rounded-xl border border-dashed border-border/60 bg-background/60 px-3 py-8 text-center text-xs text-muted-foreground">
                                No hay conversaciones todavía. Crea un nuevo chat para empezar.
                            </div>
                        )}

                        {sidebarChats.map((chat) => {
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
                                            isSidebarCollapsed && "justify-center px-2",
                                        )}
                                        onClick={() => handleSelectChat(chat.id)}
                                    >
                                        <MessageSquare className="h-4 w-4" aria-hidden="true" />
                                        {!isSidebarCollapsed && (
                                            <div className="flex flex-1 flex-col items-start">
                                                <span className="text-left font-medium leading-tight">{chat.title}</span>
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
                                                    Archivar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-destructive"
                                                    onSelect={(event) => {
                                                        event.preventDefault()
                                                        handleRequestDeleteChat(chat)
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
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                className={cn(
                                    "flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2 text-left transition",
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
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align={isSidebarCollapsed ? "center" : "end"}
                            side={isSidebarCollapsed ? "top" : "top"}
                            className="w-56"
                        >
                            <DropdownMenuItem onSelect={() => setIsUserDialogOpen(true)}>
                                Usuario
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setIsArchivedDialogOpen(true)}>
                                Chats archivados
                            </DropdownMenuItem>
                            {canShowOptions && (
                                <DropdownMenuSub>
                                    <DropdownMenuSubTrigger>Opciones</DropdownMenuSubTrigger>
                                    <DropdownMenuSubContent className="w-48">
                                        {canAccessDocumentation && (
                                            <DropdownMenuItem onSelect={() => router.push("/documentacion")}>
                                                Documentación
                                            </DropdownMenuItem>
                                        )}
                                        {canAccessAdministration && (
                                            <DropdownMenuItem onSelect={() => router.push("/admin")}>
                                                Administración
                                            </DropdownMenuItem>
                                        )}
                                    </DropdownMenuSubContent>
                                </DropdownMenuSub>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onSelect={() => handleLogout()}
                                className="text-destructive"
                            >
                                Salir
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
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
                        <ThemeToggleButton />
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
            <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Perfil de usuario</DialogTitle>
                        <DialogDescription>Actualiza tus datos personales. Esta información ayuda a personalizar las propuestas del asistente.</DialogDescription>
                    </DialogHeader>
                    <form className="space-y-4" onSubmit={handleProfileSubmit}>
                        <div className="grid gap-2">
                            <Label htmlFor="profile-nombre">Nombre</Label>
                            <Input id="profile-nombre" value={profileForm.nombre} onChange={handleProfileInputChange("nombre")} placeholder="Nombre" autoComplete="given-name" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="profile-apellidos">Apellidos</Label>
                            <Input id="profile-apellidos" value={profileForm.apellidos} onChange={handleProfileInputChange("apellidos")} placeholder="Apellidos" autoComplete="family-name" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="profile-telefono">Teléfono</Label>
                            <Input id="profile-telefono" value={profileForm.telefono} onChange={handleProfileInputChange("telefono")} placeholder="Teléfono de contacto" autoComplete="tel" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="profile-organizacion">Organización</Label>
                            <Input id="profile-organizacion" value={profileForm.organizacion} onChange={handleProfileInputChange("organizacion")} placeholder="Nombre de la organización" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="profile-cargo">Cargo</Label>
                            <Input id="profile-cargo" value={profileForm.cargo} onChange={handleProfileInputChange("cargo")} placeholder="Ej. Coordinador de juventud" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="profile-experiencia">Experiencia (años)</Label>
                            <Input id="profile-experiencia" type="number" min="0" value={profileForm.experiencia} onChange={handleProfileInputChange("experiencia")} placeholder="0" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="profile-avatar">URL de avatar</Label>
                            <Input id="profile-avatar" value={profileForm.avatarUrl} onChange={handleProfileInputChange("avatarUrl")} placeholder="https://..." autoComplete="url" />
                        </div>
                        <p className="text-xs text-muted-foreground">Correo: {user?.email}</p>
                        {profileFeedback && (
                            <p className="text-sm text-primary" role="status">{profileFeedback}</p>
                        )}
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsUserDialogOpen(false)}>
                                Cerrar
                            </Button>
                            <Button type="submit" disabled={profileSaving}>
                                {profileSaving ? "Guardando..." : "Guardar cambios"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            <Dialog open={isArchivedDialogOpen} onOpenChange={setIsArchivedDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Chats archivados</DialogTitle>
                        <DialogDescription>Los chats archivados se ocultan del panel lateral. Desarchívalos para recuperarlos cuando los necesites.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        {archivedChats.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No hay chats archivados por ahora.</p>
                        ) : (
                            archivedChats.map((chat) => (
                                <div key={chat.id} className="rounded-lg border border-border/60 bg-muted/20 px-3 py-3 text-sm">
                                    <div className="font-medium">{chat.title}</div>
                                    <div className="mt-1 text-xs text-muted-foreground">Archivado el {chat.createdAt.toLocaleString("es-ES")}</div>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        <Button size="sm" variant="outline" onClick={() => handleRestoreArchivedChat(chat.id)}>
                                            Abrir
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={() => handleArchiveChat(chat.id)}>
                                            Desarchivar
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="button" onClick={() => setIsArchivedDialogOpen(false)} variant="outline">Cerrar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog
                open={isDeleteDialogOpen}
                onOpenChange={(open) => {
                    setIsDeleteDialogOpen(open)
                    if (!open) {
                        setChatPendingDeletion(null)
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Eliminar chat</DialogTitle>
                        <DialogDescription>Esta acción no se puede deshacer. El historial y las respuestas generadas se perderán definitivamente.</DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/30 px-3 py-3 text-sm">
                        <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden="true" />
                        <p>
                            ¿Seguro que quieres eliminar <span className="font-semibold">{chatPendingDeletion?.title ?? "esta conversación"}</span>?
                        </p>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={handleCancelDeleteChat}>
                            Cancelar
                        </Button>
                        <Button type="button" variant="destructive" onClick={handleConfirmDeleteChat}>
                            Eliminar definitivamente
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
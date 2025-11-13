"use client"

import Image from "next/image"
import { ChangeEvent, FormEvent, KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { LucideIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import {
    Activity,
    Archive,
    BookOpen,
    ChevronsLeft,
    ChevronsRight,
    LogOut,
    ListTodo,
    MessageSquare,
    MoreHorizontal,
    Send,
    Share2,
    Sparkles,
    CalendarClock,
    Trash2,
    AlertTriangle,
    Plus,
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
import { cn, buildApiUrl } from "@/lib/utils"
import { ThemeToggleButton } from "@/components/theme-toggle"

type MessageRole = "usuario" | "asistente"

type ChatMessage = {
    id: string
    role: MessageRole
    content: string
    createdAt?: string
    pending?: boolean
}

type Chat = {
    id: string
    conversationId: string | null
    title: string
    createdAt: Date
    messages: ChatMessage[]
    archived?: boolean
    intent?: string | null
    hasLoaded?: boolean
    isLoading?: boolean
}

type QuickPrompt = {
    label: string
    icon: LucideIcon
    template: string
}

function createId() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID()
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function formatChatTitle(date: Date): string {
    const formattedDate = date.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "2-digit" })
    const formattedTime = date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", hour12: false })
    return `Chat ${formattedDate} - ${formattedTime}h`
}

function createLocalChat(): Chat {
    const createdAt = new Date()
    return {
        id: createId(),
        conversationId: null,
        createdAt,
        title: formatChatTitle(createdAt),
        messages: [],
        hasLoaded: true,
        intent: null,
    }
}

function toFrontendRole(role: string | null | undefined): MessageRole {
    if (role === "assistant") return "asistente"
    return "usuario"
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
    const { user, status, isAuthenticated, token, logout, updateProfile } = useAuth()

    const [chats, setChats] = useState<Chat[]>([])
    const [activeChatId, setActiveChatId] = useState<string>("")
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
    const [loadingConversations, setLoadingConversations] = useState(false)
    const [chatError, setChatError] = useState<string | null>(null)
    const [isDeletingChat, setIsDeletingChat] = useState(false)
    const scrollRef = useRef<HTMLDivElement | null>(null)
    const activeChatIdRef = useRef<string>("")
    const promptTextareaRef = useRef<HTMLTextAreaElement | null>(null)
    const quickPrompts = useMemo<QuickPrompt[]>(
        () => [
            {
                label: "Actividades",
                icon: ListTodo,
                template: "Necesito una actividad para jóvenes de 15 a 17 años centrada en el trabajo en equipo.",
            },
            {
                label: "Dinámicas",
                icon: Activity,
                template: "Propón una dinámica rompehielos para un grupo mixto de 30 adolescentes.",
            },
            {
                label: "Programaciones",
                icon: CalendarClock,
                template: "Diseña una programación trimestral para un grupo juvenil que se reúne los sábados.",
            },
            {
                label: "Oraciones",
                icon: BookOpen,
                template: "Necesito una oración breve para iniciar una reunión de jóvenes de 13 años.",
            },
            {
                label: "Otros",
                icon: Sparkles,
                template: "Ayúdame con un recurso creativo para motivar a un grupo juvenil en un campamento.",
            },
        ],
        [],
    )
    const [selectedQuickPrompts, setSelectedQuickPrompts] = useState<string[]>([])
    const selectedQuickPromptItems = useMemo(() => {
        const labelSet = new Set(selectedQuickPrompts)
        return quickPrompts.filter((prompt) => labelSet.has(prompt.label))
    }, [quickPrompts, selectedQuickPrompts])

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
        if (status === "authenticated" && !loadingConversations && chats.length === 0) {
            const newChat = createLocalChat()
            setChats([newChat])
            setActiveChatId(newChat.id)
        }
    }, [chats.length, loadingConversations, status])

    useEffect(() => {
        activeChatIdRef.current = activeChatId
    }, [activeChatId])

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

    const fetchConversations = useCallback(async () => {
        if (!token) return

        setLoadingConversations(true)
        setChatError(null)

        try {
            const response = await fetch(buildApiUrl("/api/chat"), {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                cache: "no-store",
            })

            if (!response.ok) {
                const message = await response.text()
                throw new Error(message || "No se pudieron cargar las conversaciones")
            }

            const data = await response.json()
            const conversations: Array<any> = Array.isArray(data?.conversations) ? data.conversations : []
            let nextChats: Chat[] = []

            setChats((prevChats) => {
                const unsaved = prevChats.filter((chat) => !chat.conversationId)
                const existingMap = new Map(
                    prevChats
                        .filter((chat) => chat.conversationId)
                        .map((chat) => [chat.conversationId as string, chat]),
                )

                const mapped = conversations.map((conversation) => {
                    const createdAt = conversation.fechaCreacion ? new Date(conversation.fechaCreacion) : new Date()
                    const existing = existingMap.get(conversation.id)

                    if (existing) {
                        return {
                            ...existing,
                            conversationId: conversation.id,
                            title: conversation.titulo ?? existing.title,
                            intent: conversation.intencionPrincipal ?? existing.intent,
                            createdAt,
                        }
                    }

                    return {
                        id: conversation.id,
                        conversationId: conversation.id,
                        title: conversation.titulo ?? formatChatTitle(createdAt),
                        createdAt,
                        messages: [],
                        hasLoaded: false,
                        intent: conversation.intencionPrincipal ?? null,
                    } satisfies Chat
                })

                nextChats = [...unsaved, ...mapped]
                return nextChats
            })

            if (!activeChatIdRef.current && nextChats.length > 0) {
                setActiveChatId(nextChats[0]?.id ?? "")
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : "No se pudieron cargar las conversaciones"
            setChatError(message)
        } finally {
            setLoadingConversations(false)
        }
    }, [token])

    const loadConversationMessages = useCallback(async (conversationId: string) => {
        if (!token || !conversationId) return

        setChats((prevChats) =>
            prevChats.map((chat) =>
                chat.conversationId === conversationId
                    ? { ...chat, isLoading: true }
                    : chat,
            ),
        )

        try {
            const response = await fetch(buildApiUrl(`/api/chat/${conversationId}`), {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                cache: "no-store",
            })

            if (!response.ok) {
                const message = await response.text()
                throw new Error(message || "No se pudo cargar la conversación")
            }

            const data = await response.json()
            const conversation = data?.conversation
            const messages: ChatMessage[] = Array.isArray(data?.messages)
                ? data.messages.map((msg: any) => ({
                    id: msg.id,
                    role: toFrontendRole(msg.role),
                    content: msg.content,
                    createdAt: msg.fechaCreacion,
                }))
                : []

            setChats((prevChats) =>
                prevChats.map((chat) => {
                    if (chat.conversationId !== conversationId) {
                        return chat
                    }

                    return {
                        ...chat,
                        messages: messages.length > 0 ? messages : chat.messages,
                        hasLoaded: true,
                        isLoading: false,
                        intent: conversation?.intencionPrincipal ?? chat.intent ?? null,
                        title: conversation?.titulo ?? chat.title,
                    }
                }),
            )
        } catch (error) {
            const message = error instanceof Error ? error.message : "No se pudo cargar la conversación"
            setChatError(message)
            setChats((prevChats) =>
                prevChats.map((chat) =>
                    chat.conversationId === conversationId
                        ? { ...chat, isLoading: false }
                        : chat,
                ),
            )
        }
    }, [token])

    const submitPrompt = useCallback(async () => {
        if (!inputValue.trim() || isThinking || !activeChat) {
            return
        }

        if (!token) {
            setChatError("No hay sesión activa")
            return
        }

        const prompt = inputValue.trim()
        setInputValue("")
        setChatError(null)

        const chatId = activeChat.id
        const previousConversationId = activeChat.conversationId
        const previousIntent = activeChat.intent

        const userMessage: ChatMessage = {
            id: createId(),
            role: "usuario",
            content: prompt,
            createdAt: new Date().toISOString(),
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

        try {
            const response = await fetch(buildApiUrl("/api/chat"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    conversationId: previousConversationId,
                    message: prompt,
                    intent: previousIntent,
                }),
            })

            const data = await response.json().catch(() => null)

            if (!response.ok || !data?.message?.content) {
                const message = data?.message || data?.error || "No se pudo generar la respuesta"
                throw new Error(typeof message === "string" ? message : "No se pudo generar la respuesta")
            }

            const assistantMessage: ChatMessage = {
                id: createId(),
                role: "asistente",
                content: data.message.content,
                createdAt: new Date().toISOString(),
            }

            setChats((prevChats) =>
                prevChats.map((chat) =>
                    chat.id === chatId
                        ? {
                            ...chat,
                            conversationId: data.conversationId ?? chat.conversationId,
                            intent: data.intent ?? chat.intent ?? null,
                            messages: [...chat.messages, assistantMessage],
                            hasLoaded: true,
                        }
                        : chat,
                ),
            )

            if (!previousConversationId && data.conversationId) {
                fetchConversations()
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : "No se pudo generar la respuesta"
            setChatError(message)
        } finally {
            setIsThinking(false)
        }
    }, [activeChat, fetchConversations, inputValue, isThinking, token])

    const handlePromptKeyDown = useCallback((event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key !== "Enter" || event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) {
            return
        }

        if (event.nativeEvent.isComposing) {
            return
        }

        event.preventDefault()
        void submitPrompt()
    }, [submitPrompt])

    const handleQuickPromptToggle = useCallback((prompt: QuickPrompt) => {
        setSelectedQuickPrompts((prev) => {
            if (prev.includes(prompt.label)) {
                return prev.filter((label) => label !== prompt.label)
            }
            return [...prev, prompt.label]
        })
    }, [])

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        await submitPrompt()
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
        const targetChat = chats.find((chat) => chat.id === chatId)
        if (targetChat?.conversationId && !targetChat.hasLoaded && !targetChat.isLoading) {
            void loadConversationMessages(targetChat.conversationId)
        }
    }

    const handleCreateNewChat = () => {
        const newChat = createLocalChat()

        setChats((prevChats) => [newChat, ...prevChats])
        setActiveChatId(newChat.id)
        setIsThinking(false)
        setInputValue("")
        setChatError(null)
        setSelectedQuickPrompts([])
    }

    const handleRequestDeleteChat = (chat: Chat) => {
        setChatPendingDeletion(chat)
        setIsDeleteDialogOpen(true)
    }

    const handleCancelDeleteChat = () => {
        setIsDeleteDialogOpen(false)
        setChatPendingDeletion(null)
    }

    const handleConfirmDeleteChat = async () => {
        if (!chatPendingDeletion) {
            return
        }

        const { conversationId, id: chatId } = chatPendingDeletion

        if (conversationId && !token) {
            setChatError("No hay sesión activa. Vuelve a iniciar sesión e inténtalo de nuevo.")
            return
        }

        if (conversationId && token) {
            setIsDeletingChat(true)
            try {
                const response = await fetch(buildApiUrl(`/api/chat/${conversationId}`), {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })

                if (!response.ok) {
                    const body = await response.json().catch(() => null)
                    const message = body?.message || body?.error || "No se pudo eliminar el chat"
                    throw new Error(message)
                }
            } catch (error) {
                const message = error instanceof Error ? error.message : "No se pudo eliminar el chat"
                setChatError(message)
                return
            } finally {
                setIsDeletingChat(false)
            }
        }

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

        setChatError(null)
        setIsDeleteDialogOpen(false)
        setChatPendingDeletion(null)
        setIsDeletingChat(false)
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

    useEffect(() => {
        if (status === "authenticated" && token) {
            void fetchConversations()
        }
    }, [fetchConversations, status, token])

    const adjustPromptTextareaHeight = useCallback(() => {
        if (typeof window === "undefined") return
        const textarea = promptTextareaRef.current
        if (!textarea) return

        textarea.style.height = "auto"

        const computed = window.getComputedStyle(textarea)
        const lineHeight = Number.parseFloat(computed.lineHeight || "20") || 20
        const minHeight = Math.max(lineHeight * 1.6, 44)
        const maxHeight = lineHeight * 8
        const nextHeight = Math.min(maxHeight, textarea.scrollHeight)

        textarea.style.height = `${Math.max(nextHeight, minHeight)}px`
        textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden"
    }, [])

    useEffect(() => {
        adjustPromptTextareaHeight()
    }, [adjustPromptTextareaHeight, inputValue, selectedQuickPrompts, messageCount])

    useEffect(() => {
        if (!activeChat?.conversationId) return
        if (activeChat.hasLoaded || activeChat.isLoading) return

        void loadConversationMessages(activeChat.conversationId)
    }, [activeChat?.conversationId, activeChat?.hasLoaded, activeChat?.isLoading, loadConversationMessages])

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
    const hasMessages = Boolean(activeChat && activeChat.messages.length > 0)

    const renderPromptComposer = (variant: "center" | "bottom") => (
        <form
            onSubmit={handleSubmit}
            className={cn(
                "w-full",
                variant === "center" ? "mx-auto max-w-3xl px-4" : "px-8 pb-8 pt-0",
            )}
        >
            <div className="space-y-4">
                {chatError && (
                    <div className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                        <AlertTriangle className="mt-0.5 h-4 w-4" aria-hidden="true" />
                        <span>{chatError}</span>
                    </div>
                )}
                <div
                    className={cn(
                        "flex items-end gap-3 rounded-[32px] border-2 border-black/60 bg-white/95 px-4 py-3 shadow-sm",
                        "dark:border-white/30 dark:bg-white/5",
                    )}
                >
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 rounded-full border border-black bg-black text-white hover:bg-black/80 dark:border-white/40"
                                aria-label="Insertar plantilla"
                            >
                                <Plus className="h-5 w-5" aria-hidden="true" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56">
                            {quickPrompts.map((item) => {
                                const Icon = item.icon
                                const isSelected = selectedQuickPrompts.includes(item.label)
                                return (
                                    <DropdownMenuItem
                                        key={item.label}
                                        className={cn(isSelected && "bg-primary/10 text-primary")}
                                        onSelect={() => handleQuickPromptToggle(item)}
                                    >
                                        <Icon className="mr-2 h-4 w-4 text-primary" aria-hidden="true" />
                                        {item.label}
                                    </DropdownMenuItem>
                                )
                            })}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <div className="flex flex-1 flex-col gap-1">
                        {selectedQuickPromptItems.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2">
                                {selectedQuickPromptItems.map((item) => {
                                    const Icon = item.icon
                                    return (
                                        <button
                                            key={item.label}
                                            type="button"
                                            onClick={() => handleQuickPromptToggle(item)}
                                            className="flex items-center gap-2 rounded-full border border-black/40 bg-white px-3 py-1 text-xs font-medium text-black transition hover:bg-black/5 dark:border-white/30 dark:bg-transparent"
                                        >
                                            <Icon className="h-4 w-4" aria-hidden="true" />
                                            {item.label}
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                        <Textarea
                            ref={promptTextareaRef}
                            value={inputValue}
                            onChange={(event) => setInputValue(event.target.value)}
                            onKeyDown={handlePromptKeyDown}
                            placeholder=""
                            className={cn(
                                "h-auto min-h-0 flex-1 resize-none border-none bg-transparent px-0 py-2 text-sm leading-6 shadow-none",
                                "focus-visible:ring-0 focus-visible:ring-offset-0",
                            )}
                            style={{ overflowY: "hidden" }}
                            disabled={isThinking || !activeChat}
                        />
                    </div>
                    <Button
                        type="submit"
                        size="icon"
                        className="h-10 w-10 rounded-full bg-black text-white hover:bg-black/80 disabled:bg-zinc-400 disabled:text-zinc-100"
                        disabled={isThinking || inputValue.trim().length === 0 || !activeChat}
                        aria-label="Enviar"
                    >
                        <Send className="h-4 w-4" aria-hidden="true" />
                    </Button>
                </div>
            </div>
        </form>
    )

    return (
        <div className="flex h-full overflow-hidden bg-background text-foreground">
            <aside
                className={cn(
                    "flex h-full flex-col overflow-hidden border-r border-border/50 bg-muted/40 backdrop-blur transition-all duration-300",
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
                                        "group relative flex min-w-0 items-center gap-2 rounded-2xl px-2 py-1",
                                        isActive ? "bg-primary/10" : "",
                                    )}
                                >
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className={cn(
                                            "flex w-full items-center gap-3 rounded-xl px-3 py-3 pr-10 text-sm transition hover:bg-muted",
                                            isActive && "bg-primary/10 text-primary",
                                            isSidebarCollapsed && "justify-center pr-3",
                                        )}
                                        onClick={() => handleSelectChat(chat.id)}
                                    >
                                        <MessageSquare className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                                        {!isSidebarCollapsed && (
                                            <span
                                                className="block min-w-0 flex-1 truncate text-left font-medium leading-tight"
                                                title={chat.title}
                                            >
                                                {chat.title}
                                            </span>
                                        )}
                                    </Button>

                                    {!isSidebarCollapsed && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <span className="absolute inset-y-0 right-3 z-10 flex items-center">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 rounded-full text-muted-foreground opacity-0 transition group-hover:opacity-100 focus:opacity-100"
                                                        aria-label="Opciones del chat"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                                                    </Button>
                                                </span>
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

            <main className="flex flex-1 flex-col overflow-hidden">
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

                <section className="flex flex-1 flex-col overflow-hidden bg-gradient-to-b from-background via-background to-muted/40">
                    {!hasMessages ? (
                        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-8">
                            <div className="flex flex-col items-center gap-3 text-center">
                                <div className="relative h-14 w-14 overflow-hidden rounded-full bg-white shadow">
                                    <Image src="/logo.png" alt="RPJ" fill className="object-contain" sizes="56px" />
                                </div>
                                <p className="text-lg font-semibold">¿En qué puedo ayudarte?</p>
                            </div>
                            {renderPromptComposer("center")}
                        </div>
                    ) : (
                        <div className="flex h-full flex-col overflow-hidden">
                            <div ref={scrollRef} className="flex-1 space-y-6 overflow-y-auto px-8 py-8">
                            {activeChat?.isLoading && activeChat.messages.length === 0 && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Sparkles className="h-4 w-4 animate-pulse" aria-hidden="true" />
                                    <span>Cargando conversación…</span>
                                </div>
                            )}

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
                            {renderPromptComposer("bottom")}
                        </div>
                    )}
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
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleConfirmDeleteChat}
                            disabled={isDeletingChat}
                        >
                            {isDeletingChat ? "Eliminando..." : "Eliminar definitivamente"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
"use client"

import React, { createContext, useCallback, useEffect, useMemo, useState } from "react"

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001").replace(/\/$/, "")

type AuthStatus = "loading" | "authenticated" | "unauthenticated"

type AuthUser = {
    id: string
    email: string
    nombre?: string | null
    apellidos?: string | null
    nombreUsuario?: string | null
    rol?: string | null
    avatarUrl?: string | null
    organizacion?: string | null
}

type LoginPayload = {
    email: string
    password: string
}

type LoginResult = {
    success: boolean
    error?: string
}

type AuthContextValue = {
    status: AuthStatus
    user: AuthUser | null
    token: string | null
    isAuthenticated: boolean
    login: (payload: LoginPayload) => Promise<LoginResult>
    logout: () => Promise<void>
    refreshUser: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function getStoredValue<T>(key: string): T | null {
    if (typeof window === "undefined") {
        return null
    }

    try {
        const stored = window.localStorage.getItem(key)
        return stored ? (JSON.parse(stored) as T) : null
    } catch (error) {
        console.warn(`No se pudo leer ${key} desde localStorage`, error)
        return null
    }
}

function setStoredValue<T>(key: string, value: T | null) {
    if (typeof window === "undefined") {
        return
    }

    try {
        if (value === null) {
            window.localStorage.removeItem(key)
        } else {
            window.localStorage.setItem(key, JSON.stringify(value))
        }
    } catch (error) {
        console.warn(`No se pudo escribir ${key} en localStorage`, error)
    }
}

async function fetchProfile(token: string): Promise<AuthUser> {
    const response = await fetch(`${API_URL}/api/auth/me`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
    })

    if (!response.ok) {
        throw new Error("No se pudo obtener el perfil del usuario")
    }

    const data = (await response.json()) as { user: AuthUser }
    return data.user
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [status, setStatus] = useState<AuthStatus>("loading")
    const [user, setUser] = useState<AuthUser | null>(null)
    const [token, setToken] = useState<string | null>(null)

    const isAuthenticated = status === "authenticated" && !!user && !!token

    useEffect(() => {
        let isMounted = true
        const storedToken = getStoredValue<string>("auth_token")
        const storedUser = getStoredValue<AuthUser>("auth_user")

        if (!storedToken) {
            setStatus("unauthenticated")
            return () => {
                isMounted = false
            }
        }

        setToken(storedToken)

        if (storedUser) {
            setUser(storedUser)
            setStatus("authenticated")
        }

        fetchProfile(storedToken)
            .then((profile) => {
                if (!isMounted) return
                setUser(profile)
                setStatus("authenticated")
                setStoredValue("auth_user", profile)
            })
            .catch(() => {
                if (!isMounted) return
                setToken(null)
                setUser(null)
                setStatus("unauthenticated")
                setStoredValue("auth_token", null)
                setStoredValue("auth_user", null)
            })

        return () => {
            isMounted = false
        }
    }, [])

    const refreshUser = useCallback(async () => {
        if (!token) return

        try {
            const profile = await fetchProfile(token)
            setUser(profile)
            setStatus("authenticated")
            setStoredValue("auth_user", profile)
        } catch (error) {
            console.error("No se pudo refrescar el perfil", error)
            setUser(null)
            setToken(null)
            setStatus("unauthenticated")
            setStoredValue("auth_token", null)
            setStoredValue("auth_user", null)
        }
    }, [token])

    const login = useCallback(async ({ email, password }: LoginPayload): Promise<LoginResult> => {
        setStatus("loading")

        try {
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            })

            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({ message: "No se pudo iniciar sesión" }))
                const errorMessage = errorBody?.message || "Credenciales inválidas"
                setStatus("unauthenticated")
                return { success: false, error: errorMessage }
            }

            const data = await response.json()
            const receivedToken = data.token as string
            const receivedUser = data.user as AuthUser

            setToken(receivedToken)
            setUser(receivedUser)
            setStatus("authenticated")

            setStoredValue("auth_token", receivedToken)
            setStoredValue("auth_user", receivedUser)

            return { success: true }
        } catch (error) {
            console.error("Error iniciando sesión", error)
            setStatus("unauthenticated")
            return {
                success: false,
                error: "No se pudo iniciar sesión. Inténtalo de nuevo.",
            }
        }
    }, [])

    const logout = useCallback(async () => {
        const currentToken = token

        setStoredValue("auth_token", null)
        setStoredValue("auth_user", null)
        setUser(null)
        setToken(null)
        setStatus("unauthenticated")

        if (!currentToken) {
            return
        }

        try {
            await fetch(`${API_URL}/api/auth/logout`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${currentToken}`,
                },
            })
        } catch (error) {
            console.warn("Error cerrando sesión en el backend", error)
        }
    }, [token])

    const value = useMemo<AuthContextValue>(() => ({
        status,
        user,
        token,
        isAuthenticated,
        login,
        logout,
        refreshUser,
    }), [isAuthenticated, login, logout, refreshUser, status, token, user])

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

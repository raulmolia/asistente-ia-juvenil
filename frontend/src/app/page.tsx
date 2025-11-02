import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function HomePage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-white px-4">
            <form className="w-full max-w-sm space-y-6 rounded-lg border border-border bg-white p-6 shadow-sm">
                <div className="space-y-2">
                    <Label htmlFor="username">Usuario</Label>
                    <Input
                        id="username"
                        name="username"
                        type="text"
                        autoComplete="username"
                        placeholder="Introduce tu usuario"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <Input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        placeholder="Introduce tu contraseña"
                        required
                    />
                </div>

                <div className="space-y-3">
                    <Button type="submit" className="w-full">
                        Acceder
                    </Button>

                    <Button type="button" variant="link" className="w-full justify-start px-0" asChild>
                        <Link href="/auth/forgot-password">No recuerdo mi contraseña</Link>
                    </Button>
                </div>
            </form>
        </div>
    )
}
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { authService, authErrorMessages } from '~/services/auth.service'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'

export function LoginForm() {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async () => {
        setError(null)
        setLoading(true)

        const result = await authService.signIn(email, password)

        if (result.error) {
            const message = authErrorMessages[result.error.code ?? 'default']
            setError(message)
            setLoading(false)
            return
        }

        navigate('/app')
    }

    return (
        <div className="flex items-center justify-center min-h-screen px-4 bg-background">
            <div className="w-full max-w-sm space-y-6">
                <div className="space-y-1 text-center">
                    <h1 className="text-2xl font-bold text-foreground">Bienvenido</h1>
                    <p className="text-sm text-muted-foreground">Inicia sesión para continuar</p>
                </div>

                <div className="space-y-3">
                    <Input
                        type="email"
                        placeholder="Correo electrónico"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                    />
                    <Input
                        type="password"
                        placeholder="Contraseña"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                    />
                </div>

                {error && (
                    <p className="text-sm text-center text-destructive">{error}</p>
                )}

                <Button
                    onClick={handleSubmit}
                    disabled={loading || !email || !password}
                    className="w-full font-medium"
                >
                    {loading ? 'Entrando...' : 'Iniciar sesión'}
                </Button>

                <p className="text-sm text-center text-muted-foreground">
                    ¿No tienes cuenta?{' '}
                    <a href="/auth/register" className="text-primary hover:underline">
                        Regístrate
                    </a>
                </p>
            </div>
        </div>
    )
}

import { useState } from 'react'
import { useNavigate } from 'react-router'
import { authService } from '~/services/auth.service'
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
            setError('Correo o contraseña incorrectos')
            setLoading(false)
            return
        }

        navigate('/app')
    }

    return (
        <div className="flex items-center justify-center min-h-screen px-4 bg-bg">
            <div className="w-full max-w-sm space-y-6">
                <div className="space-y-1 text-center">
                    <h1 className="text-2xl font-bold text-white">Bienvenido</h1>
                    <p className="text-sm text-muted">Inicia sesión para continuar</p>
                </div>

                <div className="space-y-3">
                    <Input
                        type="email"
                        placeholder="Correo electrónico"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="text-white border-none bg-surface placeholder:text-muted"
                    />
                    <Input
                        type="password"
                        placeholder="Contraseña"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="text-white border-none bg-surface placeholder:text-muted"
                    />
                </div>

                {error && (
                    <p className="text-sm text-center text-danger">{error}</p>
                )}

                <Button
                    onClick={handleSubmit}
                    disabled={loading || !email || !password}
                    className="w-full font-medium text-white bg-primary hover:bg-primary/90"
                >
                    {loading ? 'Entrando...' : 'Iniciar sesión'}
                </Button>

                <p className="text-sm text-center text-muted">
                    ¿No tienes cuenta?{' '}
                    <a href="/auth/register" className="text-secondary hover:underline">
                        Regístrate
                    </a>
                </p>
            </div>
        </div>
    )
}
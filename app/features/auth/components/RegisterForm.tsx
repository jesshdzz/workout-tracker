import { useState } from 'react'
import { useNavigate } from 'react-router'
import { authService, authErrorMessages } from '~/services/auth.service'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'

export function RegisterForm() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirm: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const update = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }))

  const validate = (): string | null => {
    if (!form.username.trim())          return 'El nombre de usuario es requerido'
    if (form.username.length < 3)       return 'El usuario debe tener al menos 3 caracteres'
    if (!form.email.includes('@'))      return 'Correo inválido'
    if (form.password.length < 6)      return 'La contraseña debe tener al menos 6 caracteres'
    if (form.password !== form.confirm) return 'Las contraseñas no coinciden'
    return null
  }

  const handleSubmit = async () => {
    const validationError = validate()
    if (validationError) { setError(validationError); return }

    setError(null)
    setLoading(true)

    const result = await authService.signUp(form.email, form.password, form.username)

    if (result.error) {
      const message = authErrorMessages[result.error.code ?? 'default']
      setError(message)
      setLoading(false)
      return
    }

    navigate('/app')
  }

  const isDisabled = loading || !form.email || !form.password || !form.username

  return (
    <div className="flex items-center justify-center min-h-screen px-4 bg-background">
      <div className="w-full max-w-sm space-y-6">

        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold text-foreground">Crear cuenta</h1>
          <p className="text-sm text-muted-foreground">Empieza a trackear tu progreso</p>
        </div>

        <div className="space-y-3">
          <Input
            placeholder="Nombre de usuario"
            value={form.username}
            onChange={update('username')}
          />
          <Input
            type="email"
            placeholder="Correo electrónico"
            value={form.email}
            onChange={update('email')}
          />
          <Input
            type="password"
            placeholder="Contraseña"
            value={form.password}
            onChange={update('password')}
          />
          <Input
            type="password"
            placeholder="Confirmar contraseña"
            value={form.confirm}
            onChange={update('confirm')}
          />
        </div>

        {error && (
          <p className="text-sm text-center text-destructive">{error}</p>
        )}

        <Button
          onClick={handleSubmit}
          disabled={isDisabled}
          className="w-full font-medium"
        >
          {loading ? 'Creando cuenta...' : 'Registrarse'}
        </Button>

        <p className="text-sm text-center text-muted-foreground">
          ¿Ya tienes cuenta?{' '}
          <a href="/auth/login" className="text-primary hover:underline">
            Inicia sesión
          </a>
        </p>

      </div>
    </div>
  )
}

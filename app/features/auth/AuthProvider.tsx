import { createContext, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import type { User } from '@supabase/supabase-js'
import { authService } from '~/services/auth.service'

type AuthContextType = {
    user: User | null
    loading: boolean
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const navigate = useNavigate()
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Sesión inicial
        authService.getUser().then(({ data }) => {
            setUser(data)
            setLoading(false)
        })

        // Escucha cambios de auth en tiempo real
        const { data: { subscription } } = authService.onAuthStateChange(setUser)
        return () => subscription.unsubscribe()
    }, [])

    const signOut = async () => {
        await authService.signOut()
        setUser(null)
        navigate('/auth/login')
    }

    return (
        <AuthContext.Provider value={{ user, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
    return ctx
}
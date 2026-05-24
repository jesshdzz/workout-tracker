import type { Route } from './+types/auth.login'
import { requireGuest } from '~/lib/auth.server'
import { LoginForm } from '~/features/auth/components/LoginForm'

export async function loader({ request }: Route.LoaderArgs) {
  await requireGuest(request)   // si ya estás logueado te manda a /app
  return {}
}

export default function LoginRoute() {
  return <LoginForm />
}
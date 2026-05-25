import type { Route } from './+types/auth.login'
import { requireGuest } from '~/lib/auth'
import { LoginForm } from '~/features/auth/components/LoginForm'

export async function loader(_: Route.LoaderArgs) {
  await requireGuest()
  return {}
}

export default function LoginRoute() {
  return <LoginForm />
}
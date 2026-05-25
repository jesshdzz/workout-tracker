// app/routes/auth.register.tsx
import type { Route } from './+types/auth.register'
import { requireGuest } from '~/lib/auth'
import { RegisterForm } from '~/features/auth/components/RegisterForm'

export async function clientLoader(_: Route.LoaderArgs) {
  await requireGuest()
  return {}
}

export default function RegisterRoute() {
  return <RegisterForm />
}
import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Gym Tracker" },
    { name: "description", content: "Track your workouts and improve your performance." },
  ];
}

import { Link } from 'react-router'
import { Dumbbell } from 'lucide-react'

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 bg-background">
      <div className="flex flex-col items-center max-w-sm text-center">
        <div className="flex items-center justify-center w-16 h-16 mb-6 rounded-2xl bg-primary/10">
          <Dumbbell size={28} className="text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Workout Tracker
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Registra tus entrenamientos, sigue tu progreso y supera tus marcas.
        </p>
        <div className="flex flex-col w-full gap-3 mt-8">
          <Link
            to="/auth/login"
            className="inline-flex items-center justify-center w-full h-10 px-4 text-sm font-medium text-white transition-colors rounded-xl bg-primary hover:bg-primary/90"
          >
            Iniciar sesión
          </Link>
          <Link
            to="/auth/register"
            className="inline-flex items-center justify-center w-full h-10 px-4 text-sm font-medium transition-colors border rounded-xl text-foreground border-border hover:bg-muted"
          >
            Crear cuenta
          </Link>
        </div>
      </div>
    </div>
  )
}

import { redirect } from 'react-router'
import { createServerSupabase } from '~/lib/supabase.server'
import { formatDate, formatDuration } from '~/core/utils/formatters'
import { Clock, Trophy, CheckCircle2, Dumbbell } from 'lucide-react'
import { Link } from 'react-router'
import type { Database } from '~/core/types/database.types'

type Session = Database['public']['Tables']['sessions']['Row']

export async function loader({ request, params }: { request: Request; params: Record<string, string | undefined> }) {
  const { supabase } = createServerSupabase(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw redirect('/auth/login')

  const { data: session, error } = await supabase
    .from('sessions')
    .select(`
      *,
      routines(id, name),
      sets(
        *,
        exercises(id, name, name_es, slug)
      )
    `)
    .eq('id', params.sessionId ?? '')
    .eq('user_id', user.id)
    .single()

  if (error || !session) {
    throw new Response('Sesión no encontrada', { status: 404 })
  }

  return { session }
}

export default function SessionDetailRoute({ loaderData }: { loaderData: { session: Session & { sets: any[] } } }) {
  const { session } = loaderData
  const sets = (session as any).sets ?? []
  const grouped = groupSetsByExercise(sets)
  const totalSets = sets.length
  const prSets = sets.filter((s: any) => s.is_pr)

  return (
    <div className="px-4 py-6 space-y-4">
      <Link to="/app" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
        ← Volver al dashboard
      </Link>

      <div className="p-4 space-y-3 rounded-2xl bg-card shadow-sm border border-border">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-bold text-foreground">
              {session.name ?? 'Sesión sin nombre'}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatDate(session.date)}
              {session.week_number ? ` · Semana ${session.week_number}` : ''}
            </p>
          </div>
          {session.completed ? (
            <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg bg-accent/10 text-accent border border-accent/20">
              <CheckCircle2 size={12} />
              Completada
            </span>
          ) : (
            <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
              En progreso
            </span>
          )}
        </div>

        {session.duration_s && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock size={14} />
            {formatDuration(session.duration_s)}
          </div>
        )}

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Dumbbell size={14} />
          {totalSets} series · {grouped.size} ejercicios
          {prSets.length > 0 && (
            <span className="flex items-center gap-1 ml-2 text-primary">
              <Trophy size={12} /> {prSets.length} PR
            </span>
          )}
        </div>
      </div>

      {sets.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-card border border-border">
          <p className="text-sm text-muted-foreground">Esta sesión no tiene series registradas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {Array.from(grouped.entries()).map(([exerciseName, exerciseSets]) => {
            const hasPR = exerciseSets.some((s: any) => s.is_pr)
            return (
              <div key={exerciseName} className="overflow-hidden rounded-2xl bg-card shadow-sm border border-border">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                  <p className="text-sm font-medium text-foreground">{exerciseName}</p>
                  {hasPR && <Trophy size={14} className="text-primary" />}
                </div>
                <ul>
                  {exerciseSets.map((s: any, i: number) => (
                    <li key={s.id}>
                      <div className={`px-4 py-3 ${s.is_pr ? 'bg-primary/5' : ''}`}>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">
                            Serie {s.set_number} · {s.set_type === 'warmup' ? 'Calentamiento' : 'Efectiva'}
                          </p>
                          {s.is_pr && (
                            <span className="flex items-center gap-1 text-xs font-medium text-primary">
                              <Trophy size={12} /> PR
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-foreground mt-0.5">
                          {s.weight} {s.weight_unit} × {s.reps} reps
                          {s.rir_perceived != null ? ` · RIR ${s.rir_perceived}` : ''}
                        </p>
                      </div>
                      {i < exerciseSets.length - 1 && <div className="h-px mx-4 bg-border" />}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function groupSetsByExercise(sets: any[]): Map<string, any[]> {
  const map = new Map<string, any[]>()
  for (const s of sets) {
    const name = s.exercises?.name_es ?? s.exercises?.name ?? 'Ejercicio'
    if (!map.has(name)) map.set(name, [])
    map.get(name)!.push(s)
  }
  return map
}

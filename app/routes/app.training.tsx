// app/routes/app.training.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router'
import type { Route } from './+types/app.training'
import { requireAuth } from '~/lib/auth.server'
import { exercisesRepository } from '~/repositories/exercises.repository'
import { useActiveSession } from '~/features/training/hooks/useActiveSession'
import { useSessionStore } from '~/features/training/store/session.store'
import { ExerciseCard } from '~/features/training/components/ExerciseCard'
import { RestTimer } from '~/features/training/components/RestTimer'
// import { SessionSummary } from '~/features/training/components/SessionSummary'
import { Button } from '~/components/ui/button'
import type { Database } from '~/core/types/database.types'

type Exercise = Database['public']['Tables']['exercises']['Row']

export default function TrainingRoute() {

}
import { supabase } from '~/lib/supabase'
import type { Database } from '~/core/types/database.types'
import { setsRepository } from '~/repositories/sets.repository'
import { sessionsRepository } from '~/repositories/sessions.repository'

type SetInsert = Database['public']['Tables']['sets']['Insert']
type SetUpdate = Database['public']['Tables']['sets']['Update']
type SessionUpdate = Database['public']['Tables']['sessions']['Update']

type SyncPayload =
    | { type: 'create_set'; payload: SetInsert & { id: string } }
    | { type: 'update_set'; payload: SetUpdate & { id: string } }
    | { type: 'delete_set'; payload: { id: string } }
    | { type: 'complete_session'; payload: SessionUpdate & { id: string } }
    | { type: 'discard_session'; payload: { id: string } }

export type SyncOperation = SyncPayload & {
    opId: string
    createdAt: number
    retries: number
}

const QUEUE_KEY = 'sync_queue'

function loadQueue(): SyncOperation[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveQueue(queue: SyncOperation[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}

export function enqueue(op: SyncPayload) {
  const queue = loadQueue()
  queue.push({
    ...op,
    opId: crypto.randomUUID(),
    createdAt: Date.now(),
    retries: 0,
  })
  saveQueue(queue)
}

export function getQueue(): SyncOperation[] {
  return loadQueue()
}

export function removeFromQueue(opId: string) {
  const queue = loadQueue().filter(op => op.opId !== opId)
  saveQueue(queue)
}

export function incrementRetry(opId: string) {
  const queue = loadQueue().map(op =>
    op.opId === opId ? { ...op, retries: op.retries + 1 } : op
  )
  saveQueue(queue)
}

async function executeOperation(op: SyncOperation): Promise<boolean> {
  try {
    switch (op.type) {
      case 'create_set': {
        const { data, error } = await setsRepository.create(op.payload)
        return !error
      }
      case 'update_set': {
        const { id, ...updates } = op.payload
        const { data, error } = await setsRepository.update(id, updates)
        return !error
      }
      case 'delete_set': {
        const { error } = await setsRepository.delete(op.payload.id)
        return !error
      }
      case 'complete_session': {
        const { id, ...updates } = op.payload
        const { data, error } = await sessionsRepository.complete(id, updates)
        return !error
      }
      case 'discard_session': {
        const {error} = await sessionsRepository.discardSession(op.payload.id)
        return !error
      }
    }
  } catch { return false }
}

export async function drainQueue(): Promise<void> {
  const queue = loadQueue()
  if (queue.length === 0) return

  for (const op of queue) {
    if (op.retries >= 5) {
      removeFromQueue(op.opId)
      continue
    }
    const success = await executeOperation(op)
    if (success) removeFromQueue(op.opId)
    else incrementRetry(op.opId)
  }
}
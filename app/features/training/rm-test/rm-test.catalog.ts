// app/features/training/rm-test/rm-test.catalog.ts
//
// Catálogo completo de las 2 sesiones de test de RMs — Semana 0.
// Basado en docs/plan_entrenamiento.md §5 "Lista Completa de Ejercicios que Requieren RM".
//
// Sesión 1 — Upper (Día 1 + Día 4 compuestos)
// Sesión 2 — Lower (Día 2 + Día 5)

export type RMTestExercise = {
  slug: string            // Slug del ejercicio en la BD (exercises.slug)
  nameEs: string          // Nombre en español (fallback si no está en BD)
  repRangeMin: number     // Rango sugerido mínimo para el test
  repRangeMax: number     // Rango sugerido máximo para el test
  isCompound: boolean
  safetyNote: string | null   // Nota especial de seguridad/técnica
  bodyweightOnly?: boolean    // Para fondos — usa peso corporal
}

export type RMTestSession = {
  sessionNumber: 1 | 2
  title: string
  subtitle: string
  dayLabel: string
  exercises: RMTestExercise[]
}

// ─────────────────────────────────────────────────────────────────────────────
// SESIÓN 1 — UPPER (Día 1 + Día 4)
// ─────────────────────────────────────────────────────────────────────────────
export const RM_TEST_SESSION_1: RMTestSession = {
  sessionNumber: 1,
  title: 'Test de RMs — Upper',
  subtitle: 'Día 1 (Torso A) + Día 4 (Torso B)',
  dayLabel: 'Sesión 1 de 2',
  exercises: [
    // ── Día 1: Torso A
    {
      slug: 'jalon-al-pecho',
      nameEs: 'Jalón al Pecho en Polea Alta',
      repRangeMin: 6, repRangeMax: 10,
      isCompound: true,
      safetyNote: null,
    },
    {
      slug: 'press-inclinado-mancuernas',
      nameEs: 'Press Inclinado con Mancuernas',
      repRangeMin: 6, repRangeMax: 10,
      isCompound: true,
      safetyNote: 'Banco exactamente a 30°. No más inclinado.',
    },
    {
      slug: 'fondos-paralelas',
      nameEs: 'Fondos en Paralelas',
      repRangeMin: 8, repRangeMax: 15,
      isCompound: true,
      safetyNote: 'Usa peso corporal. El RM se calcula con tu peso + reps completadas.',
      bodyweightOnly: true,
    },
    {
      slug: 'face-pull',
      nameEs: 'Face Pull en Polea',
      repRangeMin: 10, repRangeMax: 15,
      isCompound: false,
      safetyNote: null,
    },
    {
      slug: 'elevaciones-laterales',
      nameEs: 'Elevaciones Laterales',
      repRangeMin: 10, repRangeMax: 15,
      isCompound: false,
      safetyNote: 'Control total. Sin impulso.',
    },

    // ── Día 4: Torso B
    {
      slug: 'jalon-sentado',
      nameEs: 'Jalón Sentado (Remo en Polea Baja)',
      repRangeMin: 6, repRangeMax: 10,
      isCompound: true,
      safetyNote: null,
    },
    {
      slug: 'press-banca-plano',
      nameEs: 'Press de Banca Plano',
      repRangeMin: 6, repRangeMax: 10,
      isCompound: true,
      safetyNote: null,
    },
    {
      slug: 'press-hombros-mancuernas',
      nameEs: 'Press de Hombros con Mancuernas',
      repRangeMin: 6, repRangeMax: 10,
      isCompound: true,
      safetyNote: null,
    },
    {
      slug: 'curl-banco-inclinado',
      nameEs: 'Curl de Bíceps en Banco Inclinado',
      repRangeMin: 8, repRangeMax: 12,
      isCompound: false,
      safetyNote: 'Codos detrás del torso en todo momento. Sin balanceo.',
    },
    {
      slug: 'extension-triceps-polea',
      nameEs: 'Extensión de Tríceps en Polea',
      repRangeMin: 10, repRangeMax: 15,
      isCompound: false,
      safetyNote: null,
    },
    {
      slug: 'curl-inverso-ez',
      nameEs: 'Curl Inverso con Barra EZ',
      repRangeMin: 10, repRangeMax: 15,
      isCompound: false,
      safetyNote: null,
    },
    {
      slug: 'curl-muneca',
      nameEs: 'Curl de Muñeca Sentado',
      repRangeMin: 12, repRangeMax: 20,
      isCompound: false,
      safetyNote: null,
    },
    {
      slug: 'curl-martillo',
      nameEs: 'Curl de Martillo con Supinación',
      repRangeMin: 10, repRangeMax: 15,
      isCompound: false,
      safetyNote: null,
    },
  ],
}

// ─────────────────────────────────────────────────────────────────────────────
// SESIÓN 2 — LOWER (Día 2 + Día 5)
// ─────────────────────────────────────────────────────────────────────────────
export const RM_TEST_SESSION_2: RMTestSession = {
  sessionNumber: 2,
  title: 'Test de RMs — Lower',
  subtitle: 'Día 2 (Pierna A) + Día 5 (Pierna B)',
  dayLabel: 'Sesión 2 de 2',
  exercises: [
    // ── Día 2: Pierna A
    {
      slug: 'hack-squat',
      nameEs: 'Hack Squat o Prensa Inclinada',
      repRangeMin: 8, repRangeMax: 12,
      isCompound: true,
      safetyNote: null,
    },
    {
      slug: 'sentadilla-bulgara',
      nameEs: 'Sentadilla Búlgara con Mancuernas',
      repRangeMin: 8, repRangeMax: 12,
      isCompound: true,
      safetyNote: 'Por pierna. Registra el peso de una mancuerna (×2 para el total).',
    },
    {
      slug: 'extension-cuadriceps',
      nameEs: 'Extensión de Cuádriceps en Máquina',
      repRangeMin: 10, repRangeMax: 15,
      isCompound: false,
      safetyNote: null,
    },
    {
      slug: 'elevacion-talones-pie',
      nameEs: 'Elevación de Talones de Pie — Gastrocnemio',
      repRangeMin: 10, repRangeMax: 15,
      isCompound: false,
      safetyNote: null,
    },

    // ── Día 5: Pierna B
    {
      slug: 'rdl',
      nameEs: 'Peso Muerto Rumano (RDL)',
      repRangeMin: 6, repRangeMax: 10,
      isCompound: true,
      safetyNote: '⚠️ NO al fallo total. Para a RIR 1-2. La espalda recta es obligatoria.',
    },
    {
      slug: 'curl-isquiosurales-sentado',
      nameEs: 'Curl de Isquiosurales Sentado',
      repRangeMin: 8, repRangeMax: 12,
      isCompound: false,
      safetyNote: null,
    },
    {
      slug: 'prensa-pies-altos',
      nameEs: 'Prensa de Piernas — Pies Altos y Separados',
      repRangeMin: 10, repRangeMax: 15,
      isCompound: true,
      safetyNote: null,
    },
    {
      slug: 'elevacion-talones-sentado',
      nameEs: 'Elevación de Talones Sentado — Sóleo',
      repRangeMin: 10, repRangeMax: 15,
      isCompound: false,
      safetyNote: null,
    },
  ],
}

export const RM_TEST_SESSIONS: RMTestSession[] = [RM_TEST_SESSION_1, RM_TEST_SESSION_2]

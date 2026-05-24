export type BlockConfig = {
  block: number
  name: string
  intensityPct: number
  repRange: string
  rir: string
  setsCompound: number
  setsAccessory: number
  isDeload: boolean
}

export const getBlockConfig = (week: number): BlockConfig => {
  if (week <= 4) return {
    block: 1,
    name: 'Acumulación',
    intensityPct: week === 3 ? 0.68 : 0.65,
    repRange: week === 3 ? '10-12' : '12-15',
    rir: week === 4 ? 'RIR 3-4' : 'RIR 2',
    setsCompound: week === 4 ? 1 : week === 3 ? 3 : 2,
    setsAccessory: week === 4 ? 1 : 2,
    isDeload: week === 4,
  }

  if (week <= 8) return {
    block: 2,
    name: 'Intensificación',
    intensityPct: week === 7 ? 0.82 : week === 8 ? 0.65 : 0.78,
    repRange: week === 8 ? '10-12' : week === 7 ? '6-8' : '8-10',
    rir: week === 8 ? 'RIR 3-4' : 'RIR 1',
    setsCompound: week === 8 ? 1 : 2,
    setsAccessory: week === 8 ? 1 : 2,
    isDeload: week === 8,
  }

  if (week <= 12) return {
    block: 3,
    name: 'Realización',
    intensityPct: week === 11 ? 0.92 : week === 12 ? 0.60 : 0.88,
    repRange: week === 12 ? '10-12' : week === 11 ? '3-6' : '5-7',
    rir: week === 12 ? 'RIR 3-4' : week === 11 ? 'RIR 0' : 'RIR 0-1',
    setsCompound: 1,
    setsAccessory: 1,
    isDeload: week === 12,
  }

  return {
    block: 4,
    name: 'Deload + Reset',
    intensityPct: week === 16 ? 0.50 : 0.60,
    repRange: '10-15',
    rir: week === 16 ? 'RIR 4' : 'RIR 3',
    setsCompound: week === 16 ? 1 : week === 15 ? 2 : 1,
    setsAccessory: 1,
    isDeload: true,
  }
}
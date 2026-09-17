import Dexie, { type EntityTable } from 'dexie'
import type { AcneBatch, AcneLesion, AcneStatusHistory, AppSettings, BackupMetadata, DayRecord, Dish, DrinkRecord, MealRecord, PeriodRecord, PhotoRecord } from './types'

export class AcneDatabase extends Dexie {
  appSettings!: EntityTable<AppSettings, 'id'>
  dayRecords!: EntityTable<DayRecord, 'localDate'>
  drinks!: EntityTable<DrinkRecord, 'id'>
  meals!: EntityTable<MealRecord, 'id'>
  dishes!: EntityTable<Dish, 'id'>
  acneBatches!: EntityTable<AcneBatch, 'id'>
  acneLesions!: EntityTable<AcneLesion, 'id'>
  acneStatusHistory!: EntityTable<AcneStatusHistory, 'id'>
  periods!: EntityTable<PeriodRecord, 'id'>
  photos!: EntityTable<PhotoRecord, 'id'>
  backupMetadata!: EntityTable<BackupMetadata, 'id'>

  constructor(name = 'who-provoked-acne') {
    super(name)
    this.version(1).stores({ appSettings: 'id', dayRecords: 'localDate', drinks: '++id,localDate,type', meals: '++id,localDate,meal', dishes: '++id,name,lastEatenDate', acneBatches: 'id,localDate,isBaseline', acneLesions: 'id,batchId,createdDate,currentStatus,isBaseline', acneStatusHistory: '++id,lesionId,localDate', periods: '++id,startDate,endDate', photos: 'id,kind,localDate,ownerId', backupMetadata: '++id,kind,createdAt' })
    this.version(2).stores({ appSettings: 'id', dayRecords: 'localDate', drinks: '++id,localDate,type', meals: '++id,[localDate+meal],localDate,meal', dishes: '++id,name,lastEatenDate', acneBatches: 'id,localDate,isBaseline', acneLesions: 'id,batchId,createdDate,currentStatus,isBaseline', acneStatusHistory: '++id,lesionId,localDate', periods: '++id,startDate,endDate', photos: 'id,kind,localDate,ownerId', backupMetadata: '++id,kind,createdAt' }).upgrade(async tx => {
      const days = await tx.table('dayRecords').toArray()
      for (const day of days) if (!day.updatedAt) await tx.table('dayRecords').update(day.localDate, { updatedAt: day.createdAt ?? Date.now() })
    })
  }
}

export const db = new AcneDatabase()
export const businessTables = ['appSettings','dayRecords','drinks','meals','dishes','acneBatches','acneLesions','acneStatusHistory','periods','photos','backupMetadata'] as const

export async function ensureDay(localDate: string): Promise<DayRecord> {
  const existing = await db.dayRecords.get(localDate)
  if (existing) return existing
  const now = Date.now()
  const day: DayRecord = { localDate, drinkStatus: 'unknown', acneStatus: 'unknown', createdAt: now, updatedAt: now }
  await db.dayRecords.add(day)
  return day
}

export async function clearAllData() {
  await db.transaction('rw', db.tables, async () => { for (const table of db.tables) await table.clear() })
}

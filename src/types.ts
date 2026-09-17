export type Completion = 'unknown' | 'completed'
export type MealStatus = 'unknown' | 'skipped' | 'home' | 'delivery' | 'dineout'
export type AcneLocation = 'chin' | 'jawline' | 'leftCheek' | 'rightCheek' | 'forehead' | 'nose' | 'other'
export type AcneStatus = 'lump' | 'inflamed' | 'pustule' | 'popped' | 'healing' | 'recovered'
export type Severity = 'mild' | 'medium' | 'severe'
export type PhotoKind = 'dish' | 'lesion' | 'skin'

export interface AppSettings { id: 'settings'; onboardingComplete: boolean; periodTracking: boolean; persistAttempted: boolean; standalonePersistAttempted: boolean; createdAt: number }
export interface DayRecord { localDate: string; drinkStatus: Completion; acneStatus: Completion; createdAt: number; updatedAt: number }
export interface DrinkRecord { id?: number; localDate: string; type: 'coffee' | 'milkTea' | 'other'; temperature?: 'iced' | 'hot' | 'room'; milk?: boolean; otherType?: 'cola' | 'soda' | 'juice' | 'other'; name?: string; createdAt: number }
export interface MealRecord { id?: number; localDate: string; meal: 'breakfast' | 'lunch' | 'dinner'; status: MealStatus; heavy: boolean; dishIds: number[]; createdAt: number; updatedAt: number }
export interface Dish { id?: number; name: string; heavy: boolean; photoId?: string; eatCount: number; lastEatenDate?: string; createdAt: number }
export interface AcneBatch { id: string; localDate: string; location: AcneLocation; count: number; initialStatus: Exclude<AcneStatus, 'recovered'>; severity: Severity; isBaseline: boolean; photoId?: string; createdAt: number }
export interface AcneLesion { id: string; batchId: string; createdDate: string; location: AcneLocation; currentStatus: AcneStatus; severity: Severity; isBaseline: boolean; recoveredDate?: string }
export interface AcneStatusHistory { id?: number; lesionId: string; localDate: string; status: AcneStatus; createdAt: number }
export interface PeriodRecord { id?: number; startDate: string; endDate?: string; createdAt: number }
export interface PhotoRecord { id: string; kind: PhotoKind; localDate: string; blob: Blob; mimeType: string; width: number; height: number; createdAt: number; ownerId?: string }
export interface BackupMetadata { id?: number; kind: 'data' | 'complete' | 'restore'; createdAt: number; recordCounts: Record<string, number> }

export interface BackupPayload {
  app: 'who-provoked-acne'; exportVersion: 1; schemaVersion: 2; exportedAt: string;
  data: { appSettings: AppSettings[]; dayRecords: DayRecord[]; drinks: DrinkRecord[]; meals: MealRecord[]; dishes: Dish[]; acneBatches: AcneBatch[]; acneLesions: AcneLesion[]; acneStatusHistory: AcneStatusHistory[]; periods: PeriodRecord[]; photoMetadata: Omit<PhotoRecord, 'blob'>[]; backupMetadata: BackupMetadata[] }
}

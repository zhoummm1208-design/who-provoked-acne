import JSZip from 'jszip'
import { db } from './db'
import type { BackupPayload, PhotoRecord } from './types'

const schemaVersion = 2 as const
export async function createBackupPayload(): Promise<BackupPayload> {
  const [appSettings, dayRecords, drinks, meals, dishes, acneBatches, acneLesions, acneStatusHistory, periods, photos, backupMetadata] = await Promise.all([db.appSettings.toArray(),db.dayRecords.toArray(),db.drinks.toArray(),db.meals.toArray(),db.dishes.toArray(),db.acneBatches.toArray(),db.acneLesions.toArray(),db.acneStatusHistory.toArray(),db.periods.toArray(),db.photos.toArray(),db.backupMetadata.toArray()])
  return { app:'who-provoked-acne', exportVersion:1, schemaVersion, exportedAt:new Date().toISOString(), data:{ appSettings,dayRecords,drinks,meals,dishes,acneBatches,acneLesions,acneStatusHistory,periods,photoMetadata:photos.map(photo=>({id:photo.id,kind:photo.kind,localDate:photo.localDate,mimeType:photo.mimeType,width:photo.width,height:photo.height,createdAt:photo.createdAt,ownerId:photo.ownerId})),backupMetadata } }
}
export async function exportJson() { return new Blob([JSON.stringify(await createBackupPayload(), null, 2)], { type:'application/json' }) }
export async function exportComplete() {
  const zip = new JSZip(), payload = await createBackupPayload(); zip.file('backup.json', JSON.stringify(payload, null, 2))
  for (const photo of await db.photos.toArray()) zip.file(`photos/${photo.id}`, photo.blob)
  return zip.generateAsync({ type:'blob', compression:'DEFLATE', compressionOptions:{level:6} })
}
export function validatePayload(value: unknown): asserts value is BackupPayload {
  if (!value || typeof value !== 'object') throw new Error('备份 JSON 已损坏')
  const p = value as Partial<BackupPayload>
  if (p.app !== 'who-provoked-acne' || p.exportVersion !== 1 || p.schemaVersion !== schemaVersion || !p.data) throw new Error('备份版本或格式不受支持')
  for (const key of ['appSettings','dayRecords','drinks','meals','dishes','acneBatches','acneLesions','acneStatusHistory','periods','photoMetadata','backupMetadata'] as const) if (!Array.isArray(p.data[key])) throw new Error(`备份缺少 ${key}`)
}
export async function parseBackup(file: File): Promise<{payload: BackupPayload; photos: PhotoRecord[]}> {
  if (file.name.toLowerCase().endsWith('.zip')) {
    const zip = await JSZip.loadAsync(file), entry = zip.file('backup.json'); if (!entry) throw new Error('完整备份缺少 backup.json')
    const payload: unknown = JSON.parse(await entry.async('text')); validatePayload(payload)
    const photos: PhotoRecord[] = []
    for (const meta of payload.data.photoMetadata) { const photo = zip.file(`photos/${meta.id}`); if (!photo) throw new Error(`备份缺少照片 ${meta.id}`); photos.push({...meta,blob:await photo.async('blob')}) }
    return {payload,photos}
  }
  const payload: unknown = JSON.parse(await file.text()); validatePayload(payload)
  if (payload.data.photoMetadata.length) throw new Error('JSON 备份不含照片文件；请使用完整 ZIP 恢复照片')
  return {payload,photos:[]}
}
export async function restoreBackup(payload: BackupPayload, photos: PhotoRecord[]) {
  validatePayload(payload)
  await db.transaction('rw', db.tables, async () => {
    for (const table of db.tables) await table.clear()
    const d = payload.data
    await db.appSettings.bulkAdd(d.appSettings); await db.dayRecords.bulkAdd(d.dayRecords); await db.drinks.bulkAdd(d.drinks); await db.meals.bulkAdd(d.meals); await db.dishes.bulkAdd(d.dishes); await db.acneBatches.bulkAdd(d.acneBatches); await db.acneLesions.bulkAdd(d.acneLesions); await db.acneStatusHistory.bulkAdd(d.acneStatusHistory); await db.periods.bulkAdd(d.periods); await db.photos.bulkAdd(photos); await db.backupMetadata.bulkAdd(d.backupMetadata)
  })
  const expected = Object.values(payload.data).reduce((sum, list) => sum + list.length, 0) - payload.data.photoMetadata.length + photos.length
  const actual = (await Promise.all(db.tables.map(t=>t.count()))).reduce((a,b)=>a+b,0)
  if (actual !== expected) throw new Error('恢复后的记录数量校验失败')
  await db.backupMetadata.add({kind:'restore',createdAt:Date.now(),recordCounts:{total:actual}})
}
export async function saveBlob(blob: Blob, filename: string) {
  const file = new File([blob], filename, {type:blob.type})
  if (navigator.share && navigator.canShare?.({files:[file]})) { await navigator.share({files:[file],title:'谁惹痘备份'}); return }
  const url=URL.createObjectURL(blob), a=document.createElement('a'); a.href=url; a.download=filename; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000)
}

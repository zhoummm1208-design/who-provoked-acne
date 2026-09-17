import { beforeEach,describe,expect,it } from 'vitest'
import JSZip from 'jszip'
import { AcneDatabase, getDishesSorted } from './db'
import { createBackupPayload,exportComplete,parseBackup,restoreBackup } from './backup'
import { db } from './db'
beforeEach(async()=>{await db.delete();await db.open()})
describe('备份 round trip',()=>{
  it('新菜品即使没有最近吃过日期也会显示',async()=>{await db.dishes.add({name:'番茄炒蛋',heavy:false,eatCount:0,createdAt:2});await db.dishes.add({name:'旧菜',heavy:false,eatCount:1,lastEatenDate:'2026-09-01',createdAt:1});const dishes=await getDishesSorted();expect(dishes.map(x=>x.name)).toContain('番茄炒蛋');expect(dishes).toHaveLength(2)})
  it('三餐记录可按日期和餐次重新读取已选菜品',async()=>{const dishId=await db.dishes.add({name:'番茄炒蛋',heavy:false,eatCount:1,createdAt:1});await db.meals.add({localDate:'2026-09-17',meal:'lunch',status:'home',heavy:false,dishIds:[dishId],createdAt:1,updatedAt:1});const meal=await db.meals.where('[localDate+meal]').equals(['2026-09-17','lunch']).first();expect(meal?.status).toBe('home');expect(meal?.dishIds).toEqual([dishId])})
  it('JSON 保留结构化数据',async()=>{await db.dayRecords.add({localDate:'2026-09-01',drinkStatus:'completed',acneStatus:'completed',createdAt:1,updatedAt:1});const payload=await createBackupPayload();expect(payload.data.dayRecords[0].localDate).toBe('2026-09-01')})
  it('完整 ZIP 保留照片及关联',async()=>{await db.photos.add({id:'p1',kind:'skin',localDate:'2026-09-01',blob:new Blob(['photo'],{type:'image/webp'}),mimeType:'image/webp',width:1,height:1,createdAt:1,ownerId:'day'});const blob=await exportComplete();const zip=await JSZip.loadAsync(blob);expect(zip.file('photos/p1')).toBeTruthy();const parsed=await parseBackup(new File([blob],'backup.zip'));await restoreBackup(parsed.payload,parsed.photos);expect(await db.photos.count()).toBe(1);expect((await db.photos.get('p1'))?.ownerId).toBe('day')})
  it('schema v1 数据升级后仍存在',async()=>{const legacy=new AcneDatabase('legacy-test');legacy.close();await legacy.delete();await legacy.open();await legacy.dayRecords.add({localDate:'2026-08-01',drinkStatus:'unknown',acneStatus:'unknown',createdAt:1,updatedAt:1});legacy.close();const upgraded=new AcneDatabase('legacy-test');await upgraded.open();expect(await upgraded.dayRecords.count()).toBe(1);upgraded.close();await upgraded.delete()})
})

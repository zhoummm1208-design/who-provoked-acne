import { describe,expect,it } from 'vitest'
import { shiftDate,toLocalDate } from './date'
describe('本地日期',()=>{it('不使用 UTC 截断',()=>{const d=new Date(2026,8,7,0,5);expect(toLocalDate(d)).toBe('2026-09-07')});it('正确跨月',()=>expect(shiftDate('2026-09-30',1)).toBe('2026-10-01'))})

import { describe,expect,it } from 'vitest'
import { completeOutcome,factorState,prePeriodDates,validDayCount,type InsightInput } from './insights'
const base:InsightInput={days:[],drinks:[],meals:[],acne:[],periods:[]}
describe('记录语义与洞察',()=>{
  it('UNKNOWN 不等于 false',()=>expect(factorState('coffee','2026-09-01',base)).toBeNull())
  it('只有三餐、饮品、痘痘均明确才是有效日',()=>{const input={...base,days:[{localDate:'2026-09-01',drinkStatus:'completed' as const,acneStatus:'completed' as const,createdAt:1,updatedAt:1}],meals:(['breakfast','lunch','dinner'] as const).map(meal=>({localDate:'2026-09-01',meal,status:'skipped' as const,heavy:false,dishIds:[],createdAt:1,updatedAt:1}))};expect(validDayCount(input)).toBe(1)})
  it('72小时窗口不完整则排除',()=>{const input={...base,days:[0,1,2].map(i=>({localDate:`2026-09-0${i+1}`,drinkStatus:'completed' as const,acneStatus:'completed' as const,createdAt:1,updatedAt:1}))};expect(completeOutcome('2026-09-01',input)).toBeNull()})
  it('baseline 不计入新增',()=>{const input={...base,days:[0,1,2,3].map(i=>({localDate:`2026-09-0${i+1}`,drinkStatus:'completed' as const,acneStatus:'completed' as const,createdAt:1,updatedAt:1})),acne:[{id:'b',localDate:'2026-09-02',location:'chin' as const,count:3,initialStatus:'inflamed' as const,severity:'medium' as const,isBaseline:true,createdAt:1}]};expect(completeOutcome('2026-09-01',input)?.count).toBe(0)})
  it('经期前7天由下次开始日回溯',()=>{const dates=prePeriodDates([{startDate:'2026-09-10',createdAt:1}]);expect(dates.has('2026-09-03')).toBe(true);expect(dates.has('2026-09-02')).toBe(false)})
})

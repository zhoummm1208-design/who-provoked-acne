import type { AcneBatch, DayRecord, DrinkRecord, MealRecord, PeriodRecord } from './types'
import { shiftDate } from './date'
import { insightConfig } from './insightConfig'

export type Factor = 'milkTea'|'coffee'|'icedCoffee'|'hotCoffee'|'milkCoffee'|'blackCoffee'|'coldDrink'|'heavy'|'delivery'|'dineout'|'home'|'period'|'prePeriod'
export interface InsightInput { days: DayRecord[]; drinks: DrinkRecord[]; meals: MealRecord[]; acne: AcneBatch[]; periods: PeriodRecord[] }
export interface FactorInsight { factor: Factor; exposureCount: number; controlCount: number; exposureOccurrence: number; controlOccurrence: number; exposureAcneCount: number; averageAcneCount: number; mainOffset?: number; mainLocation?: string; level: '数据不足'|'暂未发现明显关联'|'关联较弱'|'可能相关'|'关联较明显' }
export interface CombinationInsight extends Omit<FactorInsight,'factor'> { factor: [Factor,Factor] }

export function validDayCount(input: Pick<InsightInput,'days'|'meals'>) {
  return input.days.filter(day => day.drinkStatus === 'completed' && day.acneStatus === 'completed' && ['breakfast','lunch','dinner'].every(meal => input.meals.some(item => item.localDate === day.localDate && item.meal === meal && item.status !== 'unknown'))).length
}

export function prePeriodDates(periods: PeriodRecord[]) {
  const dates = new Set<string>()
  for (const period of periods) for (let i = 1; i <= 7; i++) dates.add(shiftDate(period.startDate, -i))
  return dates
}

const periodContains = (date: string, periods: PeriodRecord[]) => periods.some(p => p.startDate <= date && (!p.endDate || p.endDate >= date))
export function factorState(factor: Factor, date: string, input: InsightInput): boolean | null {
  const day = input.days.find(d => d.localDate === date)
  const drinks = input.drinks.filter(d => d.localDate === date)
  const meals = input.meals.filter(m => m.localDate === date)
  if (factor === 'period') return periodContains(date, input.periods)
  if (factor === 'prePeriod') return prePeriodDates(input.periods).has(date)
  if (factor === 'heavy' || factor === 'delivery' || factor === 'dineout' || factor === 'home') {
    if (meals.length < 3 || meals.some(m => m.status === 'unknown')) return null
    return meals.some(m => factor === 'heavy' ? m.heavy : m.status === factor)
  }
  if (!day || day.drinkStatus !== 'completed') return null
  return drinks.some(d => {
    if (factor === 'coffee') return d.type === 'coffee'
    if (factor === 'milkTea') return d.type === 'milkTea'
    if (factor === 'icedCoffee') return d.type === 'coffee' && d.temperature === 'iced'
    if (factor === 'hotCoffee') return d.type === 'coffee' && d.temperature === 'hot'
    if (factor === 'milkCoffee') return d.type === 'coffee' && d.milk === true
    if (factor === 'blackCoffee') return d.type === 'coffee' && d.milk === false
    return (d.type === 'coffee' && d.temperature === 'iced') || (d.type === 'other' && d.temperature === 'iced')
  })
}

export function completeOutcome(date: string, input: InsightInput) {
  const window = [0,1,2,3].map(offset => shiftDate(date, offset))
  if (!window.every(d => input.days.find(day => day.localDate === d)?.acneStatus === 'completed')) return null
  const batches = input.acne.filter(a => !a.isBaseline && window.includes(a.localDate))
  const offsets = batches.flatMap(a => Array(a.count).fill(window.indexOf(a.localDate))) as number[]
  return { count: batches.reduce((sum, a) => sum + a.count, 0), offsets, locations: batches.flatMap(a => Array(a.count).fill(a.location) as string[]) }
}

export function calculateInsight(factor: Factor, input: InsightInput): FactorInsight {
  const exposure: ReturnType<typeof completeOutcome>[] = [], control: ReturnType<typeof completeOutcome>[] = []
  for (const day of input.days) {
    const state = factorState(factor, day.localDate, input)
    const outcome = completeOutcome(day.localDate, input)
    if (state == null || outcome == null) continue
    ;(state ? exposure : control).push(outcome)
  }
  const exp = exposure.filter(Boolean) as NonNullable<ReturnType<typeof completeOutcome>>[]
  const ctl = control.filter(Boolean) as NonNullable<ReturnType<typeof completeOutcome>>[]
  const rate = (items: typeof exp) => items.length ? items.filter(x => x.count > 0).length / items.length * 100 : 0
  const diff = rate(exp) - rate(ctl)
  const level = exp.length < insightConfig.minimumWindows || ctl.length < insightConfig.minimumWindows ? '数据不足' : diff >= insightConfig.thresholds.obvious ? '关联较明显' : diff >= insightConfig.thresholds.possible ? '可能相关' : diff >= insightConfig.thresholds.weak ? '关联较弱' : '暂未发现明显关联'
  const offsets = exp.flatMap(x => x.offsets), locations = exp.flatMap(x => x.locations)
  const mode = <T,>(items: T[]) => items.length ? [...new Set(items)].sort((a,b) => items.filter(x=>x===b).length-items.filter(x=>x===a).length)[0] : undefined
  const acneCount = exp.reduce((sum,x)=>sum+x.count,0)
  return { factor, exposureCount: exp.length, controlCount: ctl.length, exposureOccurrence: rate(exp), controlOccurrence: rate(ctl), exposureAcneCount: acneCount, averageAcneCount: exp.length ? acneCount/exp.length : 0, mainOffset: mode(offsets), mainLocation: mode(locations), level }
}

export function calculateCombination(factors: [Factor,Factor], input: InsightInput): CombinationInsight {
  const exposure: NonNullable<ReturnType<typeof completeOutcome>>[] = [], control: NonNullable<ReturnType<typeof completeOutcome>>[] = []
  for (const day of input.days) {
    const states=factors.map(f=>factorState(f,day.localDate,input)), outcome=completeOutcome(day.localDate,input)
    if(states.includes(null)||!outcome) continue
    if(states.every(Boolean)) exposure.push(outcome); else if(states.every(x=>x===false)) control.push(outcome)
  }
  const occurrence=(items:typeof exposure)=>items.length?items.filter(x=>x.count>0).length/items.length*100:0
  const diff=occurrence(exposure)-occurrence(control)
  const level=exposure.length<insightConfig.minimumWindows||control.length<insightConfig.minimumWindows?'数据不足':diff>=insightConfig.thresholds.obvious?'关联较明显':diff>=insightConfig.thresholds.possible?'可能相关':diff>=insightConfig.thresholds.weak?'关联较弱':'暂未发现明显关联'
  const count=exposure.reduce((sum,x)=>sum+x.count,0)
  return {factor:factors,exposureCount:exposure.length,controlCount:control.length,exposureOccurrence:occurrence(exposure),controlOccurrence:occurrence(control),exposureAcneCount:count,averageAcneCount:exposure.length?count/exposure.length:0,level}
}

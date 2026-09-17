import { addDays, format, parseISO, subDays } from 'date-fns'
export const toLocalDate = (date = new Date()) => format(date, 'yyyy-MM-dd')
export const shiftDate = (localDate: string, days: number) => format(addDays(parseISO(localDate), days), 'yyyy-MM-dd')
export const previousDates = (localDate: string, count: number) => Array.from({ length: count }, (_, index) => format(subDays(parseISO(localDate), count - index), 'yyyy-MM-dd'))
export const displayDate = (localDate: string) => new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' }).format(parseISO(localDate))
export const monthKey = (date = new Date()) => format(date, 'yyyy-MM')

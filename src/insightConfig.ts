export const insightConfig = {
  minimumValidDays: 14,
  minimumWindows: 5,
  breakoutCount: 3,
  thresholds: { obvious: 30, possible: 15, weak: 5 }
} as const
// 以上百分点差阈值仅用于个人观察工具的产品启发式分级，不具备医学意义。

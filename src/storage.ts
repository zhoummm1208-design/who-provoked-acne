export interface StorageState { supported: boolean; persisted: boolean | null; usage?: number; quota?: number }
export async function getStorageState(): Promise<StorageState> {
  if (!navigator.storage) return { supported: false, persisted: null }
  const [persisted, estimate] = await Promise.all([navigator.storage.persisted?.() ?? Promise.resolve(false), navigator.storage.estimate?.() ?? Promise.resolve({})])
  return { supported: typeof navigator.storage.persist === 'function', persisted, usage: estimate.usage, quota: estimate.quota }
}
export async function requestPersistentStorage() { return navigator.storage?.persist ? navigator.storage.persist() : false }
export const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || ('standalone' in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
export const formatBytes = (bytes?: number) => bytes == null ? '无法获取' : bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`

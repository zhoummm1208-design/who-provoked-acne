export async function compressPhoto(file: File, maxEdge = 1600, quality = .83): Promise<{ blob: Blob; width: number; height: number }> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale), height = Math.round(bitmap.height * scale)
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height
  const context = canvas.getContext('2d'); if (!context) throw new Error('无法处理照片')
  context.drawImage(bitmap, 0, 0, width, height); bitmap.close()
  const type = 'image/webp'
  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, type, quality))
  if (!blob) throw new Error('照片压缩失败')
  return { blob, width, height }
}

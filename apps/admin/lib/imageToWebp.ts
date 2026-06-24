// Konwertuje obrazek do WebP w przeglądarce (Canvas API) PRZED uploadem do Supabase.
// Cel: mniejszy storage + szybsza strona. Działa w tle — admin wrzuca dowolny format.
//
// - JPG/PNG → WebP (jakość 82%), z ograniczeniem największego wymiaru do 2000px
// - GIF (animacje) i pliki już w WebP → przepuszczane bez zmian
// - Jeśli konwersja się nie powiedzie → zwracamy oryginał (upload nigdy nie pada przez to)

const MAX_DIMENSION = 2000
const WEBP_QUALITY = 0.82

export async function convertToWebp(file: File): Promise<File> {
  // GIF zachowuje animację — nie konwertujemy. WebP już jest docelowym formatem.
  if (file.type === 'image/gif' || file.type === 'image/webp') return file
  if (!file.type.startsWith('image/')) return file

  try {
    const bitmap = await createImageBitmap(file)

    // Skalujemy w dół tylko jeśli przekracza limit (nie powiększamy małych zdjęć).
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
    const width = Math.round(bitmap.width * scale)
    const height = Math.round(bitmap.height * scale)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return file

    ctx.drawImage(bitmap, 0, 0, width, height)
    bitmap.close()

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', WEBP_QUALITY),
    )
    if (!blob) return file

    const newName = file.name.replace(/\.[^.]+$/, '') + '.webp'
    return new File([blob], newName, { type: 'image/webp' })
  } catch {
    return file
  }
}

'use client'

import { useRef } from 'react'
import { Upload, X } from 'lucide-react'
import axios from 'axios'
import { apiClient } from '@/lib/axios'
import { convertToWebp } from '@/lib/imageToWebp'

interface Props {
  images: string[]
  onChange: (images: string[]) => void
}

export function ImageUploadZone({ images, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return

    for (const original of Array.from(files)) {
      try {
        const file = await convertToWebp(original)
        const { data } = await apiClient.post<{ uploadUrl: string; publicUrl: string }>(
          '/upload/presign',
          { filename: file.name, contentType: file.type },
        )
        await axios.put(data.uploadUrl, file, {
          headers: { 'Content-Type': file.type },
        })
        onChange([...images, data.publicUrl])
      } catch {
        // silently ignore individual upload failures
      }
    }
  }

  function removeImage(url: string) {
    onChange(images.filter((i) => i !== url))
  }

  return (
    <div className="space-y-3">
      <div
        className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
      >
        <Upload size={20} className="mx-auto mb-2 text-cream-muted" />
        <p className="text-sm text-cream-muted">Kliknij lub upuść pliki</p>
        <p className="text-xs text-cream-muted/60 mt-1">PNG, JPG, WEBP</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((url) => (
            <div key={url} className="relative group aspect-square rounded-lg overflow-hidden border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(url)}
                className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={10} className="text-white" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

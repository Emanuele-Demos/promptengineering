import type { Attachment } from '../types'
import { useRef } from 'react'
import { FileText, Plus } from 'lucide-react'

export interface PendingAttachment {
  attachment: Attachment
  file: File
}

interface Props {
  items: PendingAttachment[]
  onChange: (items: PendingAttachment[]) => void
  buttonLabel?: string
}

export function AttachmentUploader({ items, onChange, buttonLabel = '+ Allegati' }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const now = new Date().toISOString()
    const nuovi: PendingAttachment[] = files.map((file) => ({
      file,
      attachment: {
        id: crypto.randomUUID(),
        fileName: file.name,
        originalName: file.name,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
        path: URL.createObjectURL(file),
        createdAt: now,
        updatedAt: now,
      },
    }))

    onChange([...items, ...nuovi])
    e.target.value = ''
  }

  const handleDelete = (id: string) => {
    const removed = items.find((item) => item.attachment.id === id)
    if (removed?.attachment.path.startsWith('blob:')) {
      URL.revokeObjectURL(removed.attachment.path)
    }
    onChange(items.filter((item) => item.attachment.id !== id))
  }

  return (
    <div className="space-y-3">
      <input
        type="file"
        ref={fileInputRef}
        multiple
        accept="image/jpeg,image/png,image/webp,application/pdf,.doc,.docx,.xls,.xlsx"
        onChange={handleUpload}
        className="hidden"
      />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:text-indigo-600 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all"
      >
        <Plus className="w-4 h-4" />
        {buttonLabel}
      </button>

      {items.length > 0 && (
        <div className="grid grid-cols-1 gap-2">
          {items.map(({ attachment: file }) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-2.5 border border-slate-200 rounded-lg bg-slate-50"
            >
              <div className="flex items-center gap-2 overflow-hidden min-w-0">
                {file.mimeType.startsWith('image/') ? (
                  <img
                    src={file.path}
                    alt={file.originalName}
                    className="w-10 h-10 object-cover rounded shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 bg-indigo-50 rounded flex items-center justify-center text-indigo-500 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                )}
                <div className="text-xs truncate min-w-0">
                  <p className="font-semibold text-slate-700 truncate">{file.originalName}</p>
                  <p className="text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(file.id)}
                className="text-xs text-red-600 hover:text-red-800 font-medium shrink-0 ml-2"
              >
                Elimina
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

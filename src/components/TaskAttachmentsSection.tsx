import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Download,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Plus,
  Trash2,
} from 'lucide-react'
import type { Attachment } from '../types'
import {
  deleteTaskAttachment,
  getAttachmentDownloadUrl,
  getAttachmentOpenUrl,
  getFileUrl,
  getTaskAttachments,
  uploadTaskAttachments,
} from '../api/tasks.js'
import { ImageLightbox } from './ImageLightbox'

interface TaskAttachmentsSectionProps {
  taskId: string
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith('image/')) return <ImageIcon className="w-5 h-5" />
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
    return <FileSpreadsheet className="w-5 h-5" />
  }
  return <FileText className="w-5 h-5" />
}

export function TaskAttachmentsSection({ taskId }: TaskAttachmentsSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<{ src: string; alt: string } | null>(null)

  const loadAttachments = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = (await getTaskAttachments(taskId)) as Attachment[]
      setAttachments(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore caricamento allegati')
    } finally {
      setLoading(false)
    }
  }, [taskId])

  useEffect(() => {
    loadAttachments()
  }, [loadAttachments])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setUploading(true)
    setError('')
    try {
      const created = (await uploadTaskAttachments(taskId, files)) as Attachment[]
      setAttachments((prev) => [...created, ...prev])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore upload')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleDelete = async (attachment: Attachment) => {
    if (!confirm(`Eliminare "${attachment.originalName}"?`)) return
    try {
      await deleteTaskAttachment(attachment.id)
      setAttachments((prev) => prev.filter((a) => a.id !== attachment.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore eliminazione')
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-slate-700">Allegati</label>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,application/pdf,.doc,.docx,.xls,.xlsx"
        className="hidden"
        onChange={handleUpload}
      />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-slate-200 rounded-xl text-sm font-semibold uppercase tracking-wide text-slate-600 hover:text-indigo-600 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all disabled:opacity-60"
      >
        <Plus className="w-4 h-4" />
        {uploading ? 'Caricamento...' : 'Aggiungi allegato'}
      </button>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Caricamento allegati...</p>
      ) : attachments.length === 0 ? (
        <p className="text-sm text-slate-500">Nessun allegato presente.</p>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {attachments.map((file) => {
            const isImage = file.mimeType.startsWith('image/')
            const fileUrl = getFileUrl(file.path)

            return (
              <div
                key={file.id}
                className="flex items-start gap-3 p-3 border border-slate-200 rounded-xl bg-slate-50"
              >
                {isImage ? (
                  <button
                    type="button"
                    onClick={() => setPreview({ src: fileUrl, alt: file.originalName })}
                    className="w-14 h-14 rounded-lg overflow-hidden border border-slate-200 shrink-0"
                  >
                    <img src={fileUrl} alt={file.originalName} className="w-full h-full object-cover" />
                  </button>
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0">
                    <FileIcon mimeType={file.mimeType} />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate" title={file.originalName}>
                    {file.originalName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatSize(file.size)} · {new Date(file.createdAt).toLocaleDateString('it-IT')}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <a
                      href={getAttachmentDownloadUrl(file.id)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </a>
                    <a
                      href={getAttachmentOpenUrl(file.id)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-800"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Apri
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDelete(file)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Elimina
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {preview && (
        <ImageLightbox src={preview.src} alt={preview.alt} onClose={() => setPreview(null)} />
      )}
    </div>
  )
}

import type { Attachment } from '../types'
import { FileText, Download, Image } from 'lucide-react'

interface AttachmentListProps {
  attachments: Attachment[]
}

export function AttachmentList({ attachments }: AttachmentListProps) {
  if (!attachments || attachments.length === 0) return null

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
        Allegati ({attachments.length})
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {attachments.map((file) => {
          const isImage = file.type.startsWith('image/')

          return (
            <div
              key={file.id}
              className="flex items-center justify-between p-2.5 border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                {isImage ? (
                  <div className="w-10 h-10 rounded overflow-hidden bg-slate-200 border border-slate-100 shrink-0">
                    <img
                      src={file.path}
                      alt={file.fileName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded bg-indigo-50 border border-indigo-100 text-indigo-500 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                )}
                <div className="text-xs truncate min-w-0">
                  <p className="font-semibold text-slate-700 truncate" title={file.fileName}>
                    {file.fileName}
                  </p>
                  <p className="text-slate-500">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>

              <a
                href={file.path}
                download={file.fileName}
                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-white border border-transparent hover:border-slate-200 transition-all shrink-0"
                title="Scarica allegato"
              >
                <Download className="w-4 h-4" />
              </a>
            </div>
          )
        })}
      </div>
    </div>
  )
}

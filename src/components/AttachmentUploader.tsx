import type { Attachment } from "../types"
import React, { useRef } from "react"
import { Download, FileText, Plus } from "lucide-react"

interface Props {
    attachments: Attachment[]
    onChange: (files: Attachment[]) => void
    onUpload?: (files: File[]) => Promise<void>
    onDelete?: (id: string) => void
}

export function AttachmentUploader({ attachments, onChange, onUpload, onDelete }: Props) {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [uploading, setUploading] = React.useState(false)

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        if (files.length === 0) return

        if (onUpload) {
            setUploading(true)
            await onUpload(files)
            setUploading(false)
            e.target.value = ""
            return
        }

        const nuovi: Attachment[] = files.map(file => ({
            id: crypto.randomUUID(),
            fileName: file.name,
            type: file.type,
            size: file.size,
            path: URL.createObjectURL(file),
            file,
        }))
        onChange([...attachments, ...nuovi])
        // Reset output value to allow re-uploading same file if deleted
        e.target.value = ""
    }

    const handleDelete = (id: string) => {
        if (onDelete) {
            onDelete(id)
            return
        }
        onChange(attachments.filter(a => a.id !== id))
    }

    const handleButtonClick = () => {
        fileInputRef.current?.click()
    }

    return (
        <div className="space-y-4">
            <div>
                {/* Hidden input file */}
                <input 
                    type="file" 
                    ref={fileInputRef}
                    multiple 
                    accept="image/*, application/pdf, .doc, .docx, .xls, .xlsx" 
                    onChange={handleUpload}
                    className="hidden"
                />
                
                {/* Beautiful custom button */}
                <button
                    type="button"
                    onClick={handleButtonClick}
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:text-indigo-600 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all cursor-pointer"
                    disabled={uploading}
                >
                    <Plus className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
                    <span>{uploading ? 'Caricamento...' : '+ Aggiungi allegato'}</span>
                </button>
            </div>
            
            {attachments.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    {attachments.map(file => (
                        <div key={file.id} className="flex items-center justify-between p-2.5 border border-slate-200 rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700">
                            <div className="flex items-center space-x-2 overflow-hidden">
                                {file.type.startsWith("image/") ? (
                                    <img src={file.path} alt={file.fileName} className="w-10 h-10 object-cover rounded" />
                                ) : (
                                    <div className="w-10 h-10 bg-indigo-50 rounded flex items-center justify-center text-indigo-500 shrink-0">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                )}
                                <div className="text-xs truncate">
                                    <p className="font-semibold text-slate-700 dark:text-slate-300 truncate">{file.fileName}</p>
                                    <p className="text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 shrink-0">
                                <a
                                    href={file.path}
                                    download={file.fileName}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    Download
                                </a>
                                <button
                                    type="button"
                                    onClick={() => handleDelete(file.id)}
                                    className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium"
                                >
                                    Elimina
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

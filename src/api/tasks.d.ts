export function getFileUrl(path: string): string
export function getAttachmentDownloadUrl(id: string): string
export function getAttachmentOpenUrl(id: string): string
export function syncTaskStatus(taskId: string, status: string): Promise<unknown>
export function upsertTask(task: Record<string, unknown>): Promise<unknown>
export function getTaskNotes(taskId: string): Promise<unknown[]>
export function createTaskNote(taskId: string, content: string): Promise<unknown>
export function updateTaskNote(noteId: string, content: string): Promise<unknown>
export function deleteTaskNote(noteId: string): Promise<unknown>
export function getTaskAttachments(taskId: string): Promise<unknown[]>
export function uploadTaskAttachments(taskId: string, files: File[]): Promise<unknown>
export function deleteTaskAttachment(id: string): Promise<unknown>
export function getTaskOccurrences(taskId: string): Promise<unknown>
export function stopTaskRecurrence(taskId: string, mode: string): Promise<unknown>

declare const API_ORIGIN: string
export { API_ORIGIN }

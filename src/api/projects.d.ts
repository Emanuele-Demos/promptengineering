import type { Project } from '../types'

export function getProjects(search?: string): Promise<Project[]>
export function getProject(id: string): Promise<Project>
export function createProject(input: {
  name: string
  description?: string
}): Promise<Project>
export function updateProject(
  id: string,
  input: { name: string; description?: string }
): Promise<Project>
export function deleteProject(id: string): Promise<{ message: string }>

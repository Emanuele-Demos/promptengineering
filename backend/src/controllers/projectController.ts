import type { Request, Response } from 'express'
import { getAuthenticatedUserId } from '../middleware/userContext'
import { getParam } from '../utils/params'
import * as projectService from '../services/projectService'

export async function getProjects(req: Request, res: Response): Promise<void> {
  const ownerId = getAuthenticatedUserId(req, res)
  const search = typeof req.query.search === 'string' ? req.query.search : undefined
  const projects = await projectService.getProjectsByOwner(ownerId, search)
  res.json(projects)
}

export async function getProject(req: Request, res: Response): Promise<void> {
  const ownerId = getAuthenticatedUserId(req, res)
  const project = await projectService.getProjectById(getParam(req.params.id), ownerId)
  if (!project) {
    res.status(404).json({ message: 'Progetto non trovato' })
    return
  }
  res.json(project)
}

export async function createProject(req: Request, res: Response): Promise<void> {
  const ownerId = getAuthenticatedUserId(req, res)
  const body = req.body as { name?: string; description?: string; ownerId?: string }
  const project = await projectService.createProject({
    name: body.name ?? '',
    description: body.description ?? '',
    ownerId,
  })
  res.status(201).json(project)
}

export async function updateProject(req: Request, res: Response): Promise<void> {
  const ownerId = getAuthenticatedUserId(req, res)
  const id = getParam(req.params.id)
  const body = req.body as { name?: string; description?: string }
  const project = await projectService.updateProject(id, ownerId, {
    name: body.name ?? '',
    description: body.description ?? '',
  })
  res.json(project)
}

export async function deleteProject(req: Request, res: Response): Promise<void> {
  const ownerId = getAuthenticatedUserId(req, res)
  const id = getParam(req.params.id)
  await projectService.deleteProject(id, ownerId)
  res.json({ message: 'Progetto eliminato' })
}

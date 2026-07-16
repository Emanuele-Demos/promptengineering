import type { Request, Response } from 'express'
import * as goalService from '../services/goalService'
import { getAuthenticatedUserId } from '../middleware/userContext'
import { getParam } from '../utils/params'
import { isGoalType } from '../utils/goalPeriod'
import { validateGoalTarget } from '../utils/goalPeriod'

export async function getGoals(req: Request, res: Response): Promise<void> {
  const userId = getAuthenticatedUserId(req, res)
  const goals = await goalService.getGoalsByUserId(userId)
  res.json(goals)
}

export async function getGoalHistory(req: Request, res: Response): Promise<void> {
  const userId = getAuthenticatedUserId(req, res)
  const typeParam = req.query.type
  const type = typeof typeParam === 'string' && isGoalType(typeParam) ? typeParam : undefined
  const history = await goalService.getGoalHistory(userId, type)
  res.json(history)
}

export async function getGoal(req: Request, res: Response): Promise<void> {
  const userId = getAuthenticatedUserId(req, res)
  const goal = await goalService.getGoalById(getParam(req.params.id), userId)
  if (!goal) {
    res.status(404).json({ message: 'Obiettivo non trovato' })
    return
  }
  res.json(goal)
}

export async function createGoal(req: Request, res: Response): Promise<void> {
  const userId = getAuthenticatedUserId(req, res)
  const { type, target } = goalService.parseGoalInput(req.body as Record<string, unknown>)
  const goal = await goalService.upsertGoal(userId, type, target)
  res.status(201).json(goal)
}

export async function updateGoal(req: Request, res: Response): Promise<void> {
  const userId = getAuthenticatedUserId(req, res)
  const body = req.body as Record<string, unknown>
  const target = validateGoalTarget(body.target)
  const goal = await goalService.updateGoal(getParam(req.params.id), userId, target)
  res.json(goal)
}

export async function deleteGoal(req: Request, res: Response): Promise<void> {
  const userId = getAuthenticatedUserId(req, res)
  await goalService.deleteGoal(getParam(req.params.id), userId)
  res.json({ message: 'Obiettivo eliminato' })
}

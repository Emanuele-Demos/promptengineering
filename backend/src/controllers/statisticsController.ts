import type { Request, Response } from 'express'
import { getStatistics } from '../services/statisticsService'
import { getUserId } from '../middleware/userContext'
import { isStatisticsFilter } from '../utils/statisticsPeriod'

export async function getStatisticsHandler(req: Request, res: Response): Promise<void> {
  const userId = getUserId(req)
  const filterParam = req.query.filter
  const filter = typeof filterParam === 'string' && isStatisticsFilter(filterParam) ? filterParam : '7d'
  const from = typeof req.query.from === 'string' ? req.query.from : undefined
  const to = typeof req.query.to === 'string' ? req.query.to : undefined

  const stats = await getStatistics(userId, filter, from, to)
  res.json(stats)
}

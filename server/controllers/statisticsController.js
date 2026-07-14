import { getStatisticsData } from '../services/statisticsService.js'

export async function getStatistics(req, res) {
  try {
    const statistics = await getStatisticsData()
    res.json(statistics)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

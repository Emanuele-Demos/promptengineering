import cron from 'node-cron'
import { processGoalPeriodRollover } from './goalService'

export function startGoalScheduler(): void {
  cron.schedule('5 0 * * *', async () => {
    try {
      const count = await processGoalPeriodRollover()
      if (count > 0) {
        console.log(`🎯 Periodi obiettivo archiviati: ${count}`)
      }
    } catch (error) {
      console.error('Errore scheduler obiettivi:', error)
    }
  })

  cron.schedule('0 * * * *', async () => {
    try {
      await processGoalPeriodRollover()
    } catch (error) {
      console.error('Errore rollover obiettivi:', error)
    }
  })

  console.log('🎯 Scheduler obiettivi avviato')
}

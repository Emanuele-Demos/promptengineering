import cron from 'node-cron'
import { processDueRecurrences } from './recurrenceService'

export function startRecurrenceScheduler(): void {
  cron.schedule('* * * * *', async () => {
    try {
      const count = await processDueRecurrences()
      if (count > 0) {
        console.log(`🔄 Task ricorrenti generati: ${count}`)
      }
    } catch (error) {
      console.error('Errore scheduler ricorrenze:', error)
    }
  })

  console.log('🔁 Scheduler task ricorrenti avviato (ogni minuto)')
}

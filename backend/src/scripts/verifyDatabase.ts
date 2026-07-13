import { closeDatabase } from '../config/database'
import { initializeDatabase } from '../config/initDatabase'
import { getAllMembers } from '../services/memberService'
import { getAllTasks, getTaskById } from '../services/taskService'

async function main() {
  await initializeDatabase()

  const members = await getAllMembers()
  const tasks = await getAllTasks()
  const task = await getTaskById('t2')

  console.log(`\nMembri nel database: ${members.length}`)
  console.log(`Task nel database: ${tasks.length}`)

  if (task) {
    console.log('\nTask completo t2:')
    console.log(JSON.stringify(task, null, 2))
  }

  await closeDatabase()
}

main().catch(async (error) => {
  console.error(error)
  await closeDatabase()
  process.exit(1)
})

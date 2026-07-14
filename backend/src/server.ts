import 'dotenv/config'
import express from 'express'
import projectRoutes from './routes/projectRoutes'

const app = express()
const PORT = 3000

app.use(express.json())

app.get('/', (_req, res) => {
    res.send('Backend TeamFlow avviato correttamente!')
})

app.use('/projects', projectRoutes)

app.listen(PORT, () => {
    console.log(`Server in ascolto sulla porta ${PORT}`)
})
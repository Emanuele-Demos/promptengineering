import express from 'express'

const app = express()
const PORT = 3000

app.use(express.json())

app.get('/', (req, res) => {
    res.send('Backend TeamFlow avviato correttamente!')
})

app.listen(PORT, () => {
    console.log(`Server in ascolto sulla porta ${PORT}`)
})
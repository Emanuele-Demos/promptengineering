import express from 'express'
import cors from 'cors'
import routes from './routes'
import { errorHandler } from './middleware/errorHandler'
import { UPLOAD_ROOT } from './middleware/upload'

const app = express()

app.use(cors())
app.use(express.json())
app.use('/uploads/attachments', express.static(UPLOAD_ROOT))
app.use('/api', routes)
app.use(errorHandler)

export default app

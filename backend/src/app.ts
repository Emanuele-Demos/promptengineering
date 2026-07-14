import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import routes from './routes'
import { errorHandler } from './middleware/errorHandler'
import { UPLOAD_ROOT } from './middleware/upload'

const app = express()

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(cors())
app.use(express.json({ limit: '1mb' }))
app.use('/uploads/attachments', express.static(UPLOAD_ROOT))
app.use('/api', routes)
app.use(errorHandler)

export default app

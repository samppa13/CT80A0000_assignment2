import express from 'express'
import path from 'path'
import router from './routes/index.js'
import { fileURLToPath } from 'node:url'

const app = express()
const PORT = 3000

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

app.use(express.json())
app.use(express.static(path.join(__dirname, '..', 'public')))
app.use('/api', router)

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`)
})

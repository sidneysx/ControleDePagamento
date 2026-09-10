import 'dotenv/config'
import 'express-async-errors'
import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import type { NextFunction, Request, Response } from 'express'
import { authRouter } from './routes/auth.js'
import { fornecedoresRouter } from './routes/fornecedores.js'
import { notasRouter } from './routes/notas.js'
import { regionaisRouter } from './routes/regionais.js'
import { seccionaisRouter } from './routes/seccionais.js'

const app = express()
const port = process.env.PORT ?? 3001

app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173', credentials: true }))
app.use(express.json())
app.use(cookieParser())

app.use('/api/auth', authRouter)
app.use('/api/fornecedores', fornecedoresRouter)
app.use('/api/notas', notasRouter)
app.use('/api/regionais', regionaisRouter)
app.use('/api/seccionais', seccionaisRouter)

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`)
})

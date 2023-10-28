import { defaultErrorHandler } from './middlewares/error.middlewares'
import usersRouter from './routes/users.routes'
import databaseService from './services/database.services'
import express, { Request, Response, NextFunction } from 'express'

const app = express()
const PORT = 3000
databaseService.connect()
app.use(express.json())
// route mac dinh local host
app.get('/', (req, res) => {
  res.send('Hello world')
})

app.use('/users', usersRouter)
// localhost:3000/users/tweets

//midderware app sử dụng 1 error handler Tổng
app.use(defaultErrorHandler)

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`)
})

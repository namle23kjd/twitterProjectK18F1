import express from 'express'
import usersRouter from './routes/users.routes'
import databaseService from './services/database.services'

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

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`)
})

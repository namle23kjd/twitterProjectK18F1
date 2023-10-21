import { Router } from 'express'
import { register } from 'module'
import { loginController, registerController } from '~/controllers/users.controllers'
import { loginValidator, registerValidator } from '~/middlewares/users.middlewares'
const usersRouter = Router()

usersRouter.get('/login', loginValidator, loginController)

usersRouter.post('/register', registerValidator, registerController)

//Chức năng login
export default usersRouter
//Lệnh để public method

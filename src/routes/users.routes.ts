import { Router } from 'express'
import { access } from 'fs'
import { register } from 'module'
import { loginController, logoutController, registerController } from '~/controllers/users.controllers'
import {
  accessTokenValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator
} from '~/middlewares/users.middlewares'
import { warpAsync } from '~/utils/handlers'
const usersRouter = Router()

usersRouter.get('/login', loginValidator, warpAsync(loginController))

usersRouter.post('/register', registerValidator, warpAsync(registerController))

//Chức năng login

//chức năng logout
/* 
Description: đăng xuất
path : /users/logout
method: POST
Header {Authorization: Bearer <access_token>}
body: {refresh_token: string}
 */
usersRouter.post('/logout', accessTokenValidator, refreshTokenValidator, warpAsync(logoutController))
export default usersRouter
//Lệnh để public method

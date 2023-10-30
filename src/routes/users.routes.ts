import { Router } from 'express'
import { access } from 'fs'
import { register } from 'module'
import {
  emailVerifyController,
  loginController,
  logoutController,
  registerController
} from '~/controllers/users.controllers'
import {
  accessTokenValidator,
  emailVerifyTokenValidator,
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

/*
  Verify email
  Khi người dùng đăng kí tring email của họ sẽ có 1 đường link
  Trong link này đã setup sẵn 1 req kèm email_verify_token
  thì verify email là cái route cho request đó
  method: POST
  path: /users/verify-email
  body: {email_verify_token: string}
*/
usersRouter.post('/verify-email', emailVerifyTokenValidator, warpAsync(emailVerifyController))

export default usersRouter
//Lệnh để public method

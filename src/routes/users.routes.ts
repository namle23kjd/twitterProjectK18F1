import { verify } from 'crypto'
import { Router } from 'express'
import { access } from 'fs'
import { get } from 'lodash'
import { register } from 'module'
import {
  emailVerifyController,
  forgorPasswordController,
  getMeController,
  loginController,
  logoutController,
  registerController,
  resendEmailVerifyController,
  resetPasswordController,
  verifyForgotPasswordTokenController
} from '~/controllers/users.controllers'
import {
  accessTokenValidator,
  emailVerifyTokenValidator,
  forgorPasswordValidator,
  loginValidator,
  refreshPasswordValidator,
  refreshTokenValidator,
  registerValidator,
  resetPasswordValidator,
  verifyForgotPasswordTokenValidator
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

/*
  des: resend email verify
  method : POST
  headers : {Authorization: Bearer <access_token>}
*/
usersRouter.post('/resend-email-verify', accessTokenValidator, warpAsync(resendEmailVerifyController))

/*
  des: forgor password
  khi người dùng quên mật khẩu, họ cung cấp email cho mình
  mình sẽ xem có user nào sở hữu email đó ko , nếu có mình sẽ tạo 1 forgotpasswordtoke và gửi vào email của user đps
  method : POST
  path: /users/forgot-password
  body: {email: string}
*/
usersRouter.post('/forgot-password', forgorPasswordValidator, warpAsync(forgorPasswordController))
/*
  des: verify forgot password token
  người dùng sau khi báo forgotpassword, họ nhận dducc 1 email 
  họ click vào link trong email đó , link đó sẽ có 1 request đính
  kèm forgot_password_token và gửi lến server /users/verify-forgot-password-token
  mình sẽ verify cái token này nếu thành công thì mình sẽ cho ngta reset password`
  method: POST
  path: /users/verify-forgot-password-token
  body: {forgot_password_token: string}
*/
usersRouter.post(
  '/verify-forgot-password',
  verifyForgotPasswordTokenValidator,
  warpAsync(verifyForgotPasswordTokenController)
)

/*
  des: reset password
  path: reset-password
  method: POST
  Header: Không cần vì khi ta quên mật khẩu , thì làm sao đăng nhập authen được
  body : {forgot_password_token: string, password: string, confirm_password: string}
*/
usersRouter.post(
  '/reset-password',
  resetPasswordValidator,
  verifyForgotPasswordTokenValidator,
  warpAsync(resetPasswordController)
)

/*
  Tính năng getME
  des: get profile của user
path: '/me'
method: get
Header: {Authorization: Bearer <access_token>}
body: {}
*/
usersRouter.get('/me', accessTokenValidator, warpAsync(getMeController))
export default usersRouter
//Lệnh để public method

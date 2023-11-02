//định nghĩa như request body | param | query

import { JwtPayload } from 'jsonwebtoken'
import { TokenType } from '~/constants/enums'

export interface RegisterReqBody {
  name: string
  email: string
  password: string
  confirm_password: string
  date_of_birth: string
}

export interface LogoutReqBody {
  refresh_token: string
}
export interface TokenPayload extends JwtPayload {
  user_id: string
  token_type: TokenType
}

export interface EmailVerifyReqBody {
  email_verify_token: string
}

export interface ForgotPasswordReqBody {
  emai: string
}
export interface VerifyForgotPasswordTokenReqBody {
  forgot_password_token: string
}
export interface ResetPasswordReqBody {
  forgot_password_token: string
  password: string
  confirm_password: string
}

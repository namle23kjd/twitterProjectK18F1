import User from '~/models/schemas/User.schema'
import databaseService from './database.services'
import { register } from 'module'
import { RegisterReqBody } from '~/models/request/user.request'
import { hashPassword } from '~/utils/crypto'
import { TokenType, UserVerifyStatus } from '~/constants/enums'
import { signToken } from '~/utils/jwt'
import { config } from 'dotenv'
import { ObjectId } from 'mongodb'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import { log } from 'console'
import { USER_MESSAGES } from '~/constants/messages'
config()
class UserService {
  async checkEmailExist(email: string) {
    const user = await databaseService.user.findOne({ email })
    return Boolean(user)
  }
  async register(payload: RegisterReqBody) {
    const user_id = new ObjectId()
    const email_verify_token = await this.signEmailVerifyToken(user_id.toString())

    const result = await databaseService.user.insertOne(
      new User({
        ...payload,
        _id: user_id,
        email_verify_token,
        date_of_birth: new Date(payload.date_of_birth),
        password: hashPassword(payload.password)
      })
    )
    const [access_token, refresh_token] = await this.signAccessTokenRefreshToken(user_id.toString())
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        token: refresh_token,
        user_id: new ObjectId(user_id)
      })
    )
    console.log(email_verify_token)

    return { access_token, refresh_token }
  }

  //Viết hàm nhận vào userID để bỏ vào payload tạo access token
  signAccessToken(user_id: string) {
    return signToken({
      payload: { user_id, token_type: TokenType.AccessToken },
      options: { expiresIn: process.env.ACCESS_TOKEN_EXPIRE_IN },
      privateKey: process.env.JWT_SECRET_ACCESS_TOKEN as string
    })
  }
  private signAccessTokenRefreshToken(user_id: string) {
    return Promise.all([this.signAccessToken(user_id), this.signRefershToken(user_id)])
  }

  //Viết hàm nhận vào userID để bỏ vào payload tạo refresh token

  signRefershToken(user_id: string) {
    return signToken({
      payload: { user_id, token_type: TokenType.AccessToken },
      options: { expiresIn: process.env.REFRESH_TOKEN_EXPIRE_IN },
      privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string
    })
  }
  signEmailVerifyToken(user_id: string) {
    return signToken({
      payload: { user_id, token_type: TokenType.EmailVerificationToken },
      options: { expiresIn: process.env.EMAIL_VERIFY_TOKEN_EXPIRE_IN },
      privateKey: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string
    })
  }
  signForgotPassWordToken(user_id: string) {
    return signToken({
      payload: { user_id, token_type: TokenType.ForgotPasswordToken },
      options: { expiresIn: process.env.FORGOT_PASSWORD_TOKEN_EXPIRE_IN },
      privateKey: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string
    })
  }
  async login(user_id: string) {
    const [access_token, refresh_token] = await this.signAccessTokenRefreshToken(user_id)
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        token: refresh_token,
        user_id: new ObjectId(user_id)
      })
    )
    return { access_token, refresh_token }
    //dùng cái user_id tạo access và refresh token
    //return cái access token và refresh token cho controller
    //controller sẽ trả về cho client
  }

  async logout(refresh_token: string) {
    // dùng refresh token tìm và xóa
    await databaseService.refreshTokens.deleteOne({ token: refresh_token })
    return {
      message: USER_MESSAGES.USER_MESSAGES_LOGOUT_SUCCESS
    }
  }
  async verifyEmail(user_id: string) {
    //Tạo access_token và refresh_token gửi cho client và lưu refresh_token vào database
    //Đồng thời tìm user và update lại email_verify_token thành '', verify: 1, update_at
    const [token] = await Promise.all([
      this.signAccessTokenRefreshToken(user_id),
      databaseService.user.updateOne(
        { _id: new ObjectId(user_id) }, //Tìm user thông qua user_id
        [
          {
            $set: {
              email_verify_token: '',
              verify: UserVerifyStatus.Verified, //1
              updated_at: '$$NOW'
            }
          }
        ]
      )
    ])
    //destructuring token
    const [access_token, refresh_token] = token
    //lưu refresh_token vào database
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        token: refresh_token,
        user_id: new ObjectId(user_id)
      })
    )
    return { access_token, refresh_token }
  }

  async resendEmailVerify(user_id: string) {
    //tạo email_verify_token mới
    const email_verify_token = await this.signEmailVerifyToken(user_id)
    //update lại email_verify_token mới vào database
    await databaseService.user.updateOne({ _id: new ObjectId(user_id) }, [
      {
        $set: {
          email_verify_token,
          updated_at: '$$NOW'
        }
      }
    ])
    //giả lập gửi email cái email_verify_token này cho user
    console.log(email_verify_token)
    return {
      message: USER_MESSAGES.RESEND_EMAIL_VERIFY_SUCCESS
    }
  }
  async forgotPassword(user_id: string) {
    //tạo forgot_password_token
    const forgot_password_token = await this.signForgotPassWordToken(user_id)
    //update lại user bằng forgot_password_token mới và update_at vào database
    await databaseService.user.updateOne({ _id: new ObjectId(user_id) }, [
      {
        $set: {
          forgot_password_token,
          updated_at: '$$NOW'
        }
      }
    ])

    //gửi mail cho user đps
    console.log('forgot_password_token: ', forgot_password_token)

    //Thông báo gửi thành công
    return {
      message: USER_MESSAGES.CHECK_EMAIL_TO_RESET_PASSWORD
    }
  }
  async resetPassword({ user_id, password }: { user_id: string; password: string }) {
    //TÌm user thông qua user_id và thông qua đó cập nhật lại password và forgot_password_token
    //tất nhiên là lưu password đã hash rồi
    //Ta ko cần phải kiểm tra user có tồn tại không, vì ForgotPasswordTokenValidator đã làm rồi
    databaseService.user.updateOne({ _id: new ObjectId(user_id) }, [
      {
        $set: {
          password: hashPassword(password),
          forgot_password_token: '',
          update_at: '$$NOW'
        }
      }
    ])
    //Nếu ở đây người ra muốn đổi mk xong rồi tự động đăng nhập luôn thì trả về access_token , refresh_token
    //Ở đây mình chỉ cho ngta đổi mk thôi , Nên trả về message
    return {
      message: USER_MESSAGES.RESET_PASSWORD_SUCCESS
    }
  }
  async getMe(user_id: string) {
    //Tìm user thông qua user_id
    const user = await databaseService.user.findOne(
      { _id: new ObjectId(user_id) },
      {
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0,
          refresh_tokens: 0
        }
      }
    )
    //Nếu ko có user thì trả về lỗi
    return {
      message: USER_MESSAGES.GET_ME_SUCCESS,
      result: user
    }
  }
}

const userService = new UserService()
export default userService

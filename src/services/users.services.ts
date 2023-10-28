import User from '~/models/schemas/User.schema'
import databaseService from './database.services'
import { register } from 'module'
import { RegisterReqBody } from '~/models/request/user.request'
import { hashPassword } from '~/utils/crypto'
import { TokenType } from '~/constants/enums'
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
    const result = await databaseService.user.insertOne(
      new User({
        ...payload,
        date_of_birth: new Date(payload.date_of_birth),
        password: hashPassword(payload.password)
      })
    )
    //lấy user_id từ user mới tạo
    const user_id = result.insertedId.toString()
    const [Access_token, Refresh_token] = await this.signAccessTokenRefreshToken(user_id)
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        token: Refresh_token,
        user_id: new ObjectId(user_id)
      })
    )
    return [Access_token, Refresh_token]
  }

  //Viết hàm nhận vào userID để bỏ vào payload tạo access token
  signAccessToken(user_id: string) {
    return signToken({
      payload: { user_id, token_type: TokenType.AccessToken },
      options: { expiresIn: process.env.ACCESS_TOKEN_EXPIRE_IN }
    })
  }
  private signAccessTokenRefreshToken(user_id: string) {
    return Promise.all([this.signAccessToken(user_id), this.signRefershToken(user_id)])
  }

  //Viết hàm nhận vào userID để bỏ vào payload tạo refresh token

  signRefershToken(user_id: string) {
    return signToken({
      payload: { user_id, token_type: TokenType.AccessToken },
      options: { expiresIn: process.env.REFRESH_TOKEN_EXPIRE_IN }
    })
  }
  async login(user_id: string) {
    const [Access_token, Refresh_token] = await this.signAccessTokenRefreshToken(user_id)
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        token: Refresh_token,
        user_id: new ObjectId(user_id)
      })
    )
    return [Access_token, Refresh_token]
    //dùng cái user_id tạo access và refresh token
    //return cái access token và refresh token cho controller
    //controller sẽ trả về cho client
  }
  async logout(Refresh_token: string) {
    await databaseService.refreshTokens.deleteOne({ token: Refresh_token })
    return {
      message: USER_MESSAGES.USER_MESSAGES_LOGOUT_SUCCESS
    }
  }
}

const userService = new UserService()
export default userService

import { NextFunction, Request, Response } from 'express'
import { constrainedMemory } from 'process'
import { EmailVerifyReqBody, LogoutReqBody, RegisterReqBody, TokenPayload } from '~/models/request/user.request'
import User from '~/models/schemas/User.schema'
import databaseService from '~/services/database.services'
import userService from '~/services/users.services'
import { ParamsDictionary } from 'express-serve-static-core'
import { ObjectId } from 'mongodb'
import { USER_MESSAGES } from '~/constants/messages'
import HTTP_STATUS from '~/constants/httpStatus'
User
databaseService
constrainedMemory
export const loginController = async (req: Request, res: Response) => {
  //Vào req a lấy user ra, và laauys _id của user đó
  const user = req.user as User
  const user_id = user._id as ObjectId
  const result = await userService.login(user_id.toString())
  //Nếu không bug gì thành công luôn
  return res.json({
    message: USER_MESSAGES.LOGIN_SUCCESS,
    result
  })
  //DÙng cái user_id đó để tạo access và refreshtoken
}

export const registerController = async (
  req: Request<ParamsDictionary, any, RegisterReqBody>,
  res: Response,
  next: NextFunction
) => {
  //Tạo 1 user mới và bỏ vào collection users trong database

  const result = await userService.register(req.body)
  return res.status(201).json({
    message: USER_MESSAGES.REGISTER_SUCCESS,
    result
  })
}
//Khi mình next thì nó chuyển xuống error handler và chỉ xử lý lỗi ở đó thôi

export const logoutController = async (req: Request<ParamsDictionary, any, LogoutReqBody>, res: Response) => {
  //Lấy refresh token từ req.body
  const refresh_token = req.body.refresh_token
  //goi hàm logout, hàm nhận vào refresh token tìm và xóa
  const result = await userService.logout(refresh_token)
  res.json(result)
}

export const emailVerifyController = async (req: Request<ParamsDictionary, any, EmailVerifyReqBody>, res: Response) => {
  //Khi mà req vào đc đây nghĩa là emai_verify_token đã valid
  //Đồng thời trong req đã có decoded_email_verify_token
  const { user_id } = req.decoded_email_verify_token as TokenPayload
  const user = await databaseService.user.findOne({ _id: new ObjectId(user_id) })
  if (user === null) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: USER_MESSAGES.USER_NOT_FOUND
    })
  }
  //Nếu có user đó thì mình sẽ ktr xem user đó có lưu email_verify_token hay ko
  if (user.email_verify_token === '') {
    return res.json({
      message: USER_MESSAGES.EMAIL_ALREADY_VERIFIED_BEFORE
    })
  }
  //Nếu xuống được đây nghĩa là user này chưa là có , và chưa verify
  //verifyEmail(user_id) là : tìm user đó bằng user_id và update lại email_verify_token thành ''
  // và verify thành :1
  const result = await userService.verifyEmail(user_id)
  return res.json({
    message: USER_MESSAGES.EMAIL_VERIFY_SUCCESS,
    result
  })
}

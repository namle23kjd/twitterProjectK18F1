import { Request, Response } from 'express'
import { constrainedMemory } from 'process'
import { RegisterReqBody } from '~/models/request/user.request'
import User from '~/models/schemas/User.schema'
import databaseService from '~/services/database.services'
import userService from '~/services/users.services'
import { ParamsDictionary } from 'express-serve-static-core'

export const loginController = (req: Request, res: Response) => {
  const { email, password } = req.body
  if (email === 'test@gmail.com' && password === '123456') {
    res.json({
      data: [
        { fname: 'Điệp', yob: 1999 },
        { fname: 'Hùng', yob: 2003 },
        { fname: 'Phú', yob: 2004 }
      ]
    })
  } else {
    res.status(400).json({
      message: 'login failed'
    })
  }
}

export const registerController = async (req: Request<ParamsDictionary, any, RegisterReqBody>, res: Response) => {
  const { email, password, name, date_of_birth } = req.body
  //Tạo 1 user mới và bỏ vào collection users trong database
  try {
    const result = await userService.register(req.body)
    return res.status(201).json({
      message: 'Register successfully',
      result
    })
  } catch (error) {
    return res.status(500).json({
      message: 'Register failed',
      error
    })
  }
}

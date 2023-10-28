import { error } from 'console'
import { NextFunction, Request, Response } from 'express'
import { omit } from 'lodash'
import HTTP_STATUS from '~/constants/httpStatus'
import { ErrorWithStatus } from '~/models/Errors'

export const defaultErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  //nơi tập kết lỗi từ mọi nới về hệ thống về
  console.log('Lỗi nè  ' + err.message)
  if (err instanceof ErrorWithStatus) {
    res.status(err.status).json(omit(err, ['status']))
  }
  //Còn nếu code mà chạy xuống đây thì error sẽ là 1 lỗi mặc định
  //err{message , stack,name}
  Object.getOwnPropertyNames(err).forEach((key) => {
    Object.defineProperty(err, key, { enumerable: true })
  })
  //Ném lỗi đó cho ng dùng
  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    message: err.message,
    errorInfor: omit(err, ['stack'])
  })
}

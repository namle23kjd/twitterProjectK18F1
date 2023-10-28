import { Request, Response, NextFunction } from 'express'
import { validationResult, ValidationChain } from 'express-validator'
import { RunnableValidationChains } from 'express-validator/src/middlewares/schema'
import HTTP_STATUS from '~/constants/httpStatus'
import { EntityError, ErrorWithStatus } from '~/models/Errors'

export const validate = (validation: RunnableValidationChains<ValidationChain>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await validation.run(req)

    const errors = validationResult(req)

    if (errors.isEmpty()) {
      return next()
    }

    const errorObjects = errors.mapped()
    const entityError = new EntityError({ errors: {} })

    for (const key in errorObjects) {
      //Đi qua từng lỗi và lấy msg
      const { msg } = errorObjects[key]
      //Nếu lỗi này đb do mình tọa ra khcas 422 thì mìh next cho defaultErrorHandler xử lý
      if (msg instanceof ErrorWithStatus && msg.status !== HTTP_STATUS.UNPROCESSABLE_ENTITY) {
        return next(msg)
      }
      //Nếu k phải lỗi đặc biệt thì chắc chắn là lỗi 422
      //thì minh lưu vào entityError
      entityError.errors[key] = msg
    }
    //sau khi duyệt xong thì ném cho defaultErrorHandler xử lý
    next(entityError)
  }
}

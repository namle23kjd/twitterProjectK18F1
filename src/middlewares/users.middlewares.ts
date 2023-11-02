// 1 ai đó truy cập vào /login
// Client sẽ gửi cho mình usernam và password
// Client sẽ tạo 1 request gửi server
// Thì username vs password sẽ nằm ở req.body
import { verify } from 'crypto'
import e, { Request, Response, NextFunction } from 'express'
import { ParamSchema, checkSchema } from 'express-validator'
import { JsonWebTokenError } from 'jsonwebtoken'
import { capitalize, has } from 'lodash'
import { ObjectId } from 'mongodb'
import HTTP_STATUS from '~/constants/httpStatus'
import { USER_MESSAGES } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import { TokenPayload } from '~/models/request/user.request'
import User from '~/models/schemas/User.schema'
import databaseService from '~/services/database.services'
import userService from '~/services/users.services'
import { hashPassword } from '~/utils/crypto'
import { verifyToken } from '~/utils/jwt'
import { validate } from '~/utils/validation'
//Viết 1 middleware xử lý validator của req body
//Khi đăng nhập thì em sẽ đưa cho a gồm mail và password
const passwordSchema: ParamSchema = {
  notEmpty: {
    errorMessage: USER_MESSAGES.PASSWORD_IS_REQUIRED
  },
  isString: {
    errorMessage: USER_MESSAGES.PASSWORD_MUST_BE_A_STRING
  },
  isLength: {
    options: {
      min: 8,
      max: 50
    },
    errorMessage: USER_MESSAGES.PASSWORD_LENGTH_MUST_BE_FROM_8_TO_50
  },
  isStrongPassword: {
    options: {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1
      // returnScore: false
      // false : chỉ return true nếu password mạnh, false nếu k
      // true : return về chất lượng password(trên thang điểm 10)
    },
    errorMessage: USER_MESSAGES.PASSWORD_MUST_BE_STRONG
  }
}
const confirmPasswordSchema: ParamSchema = {
  notEmpty: {
    errorMessage: USER_MESSAGES.CONFIRM_PASSWORD_IS_REQUIRED
  },
  isString: {
    errorMessage: USER_MESSAGES.CONFIRM_PASSWORD_MUST_BE_A_STRING
  },
  isLength: {
    options: {
      min: 8,
      max: 50
    },
    errorMessage: USER_MESSAGES.CONFIRM_PASSWORD_LENGTH_MUST_BE_FROM_8_TO_50
  },
  isStrongPassword: {
    options: {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1
    },
    errorMessage: USER_MESSAGES.CONFIRM_PASSWORD_MUST_BE_STRONG
  },
  custom: {
    options: (value, { req }) => {
      if (value !== req.body.password) {
        throw new Error(USER_MESSAGES.CONFIRM_PASSWORD_MUST_BE_THE_SAME_AS_PASSWORD)
      }
      return true
    }
  }
}

export const forgorPasswordValidator = validate(
  checkSchema({
    email: {
      notEmpty: {
        errorMessage: USER_MESSAGES.EMAIL_IS_REQUIRED
      },
      isEmail: {
        errorMessage: USER_MESSAGES.EMAIL_IS_INVALID
      },
      trim: true,
      custom: {
        options: async (value, { req }) => {
          //tìm user có email này
          const user = await databaseService.user.findOne({ email: value })
          //Nếu ko có thì sao gửi , trả ra res lun
          if (user === null) {
            throw new Error(USER_MESSAGES.USER_NOT_FOUND)
          }
          //Nếu có user thì lưu lại vào req
          req.user = user
          return true
        }
      }
    }
  })
)
const forgotPasswordTokenSchema: ParamSchema = {
  trim: true,
  custom: {
    options: async (value, { req }) => {
      //nếu k truyền lên forgot_password_token thì ta sẽ throw error
      if (!value) {
        throw new ErrorWithStatus({
          message: USER_MESSAGES.FORGOT_PASSWORD_TOKEN_IS_REQUIRED,
          status: HTTP_STATUS.UNAUTHORIZED //401
        })
      }
      //nếu có thì decode nó để lấy đc thông tin của người dùng
      try {
        const decoded_forgot_password_token = await verifyToken({
          token: value,
          secretOrPublickey: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string
        })
        ;(req as Request).decoded_forgot_password_token = decoded_forgot_password_token
        //dùng user_id trong decoded_forgot_password_token để tìm user trong database
        //sẽ nhanh hơn là dùng forgot_password_token(value) để tìm user trong database
        const { user_id } = decoded_forgot_password_token
        const user = await databaseService.user.findOne({
          _id: new ObjectId(user_id)
        })
        //nếu k tìm đc user thì throw error
        if (user === null) {
          throw new ErrorWithStatus({
            message: USER_MESSAGES.USER_NOT_FOUND,
            status: HTTP_STATUS.UNAUTHORIZED //401
          })
        }
        //nếu forgot_password_token đã được sử dụng rồi thì throw error
        //forgot_password_token truyền lên khác với forgot_password_token trong database
        //nghĩa là người dùng đã sử dụng forgot_password_token này rồi
        if (user.forgot_password_token !== value) {
          throw new ErrorWithStatus({
            message: USER_MESSAGES.INVALID_FORGOT_PASSWORD_TOKEN,
            status: HTTP_STATUS.UNAUTHORIZED //401
          })
        }
      } catch (error) {
        if (error instanceof JsonWebTokenError) {
          throw new ErrorWithStatus({
            message: capitalize((error as JsonWebTokenError).message),
            status: HTTP_STATUS.UNAUTHORIZED //401
          })
        }
        throw error
      }
      return true
    }
  }
}
export const loginValidator = validate(
  checkSchema(
    {
      email: {
        notEmpty: {
          errorMessage: USER_MESSAGES.EMAIL_IS_REQUIRED
        },
        isEmail: {
          errorMessage: USER_MESSAGES.EMAIL_IS_INVALID
        },
        trim: true,
        custom: {
          options: async (value, { req }) => {
            const user = await databaseService.user.findOne({
              email: value,
              password: hashPassword(req.body.password)
            })
            if (user === null) {
              throw new Error(USER_MESSAGES.EMAIL_OR_PASSWORD_IS_INCORRECT)
            }
            req.user = user
            return true
          }
        }
      },
      password: {
        notEmpty: {
          errorMessage: USER_MESSAGES.PASSWORD_IS_REQUIRED
        },
        isString: {
          errorMessage: USER_MESSAGES.PASSWORD_MUST_BE_A_STRING
        },
        isLength: {
          options: {
            min: 8,
            max: 50
          },
          errorMessage: USER_MESSAGES.PASSWORD_LENGTH_MUST_BE_FROM_8_TO_50
        },
        isStrongPassword: {
          options: {
            minLength: 9,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1
          }
        },
        errorMessage: USER_MESSAGES.PASSWORD_MUST_BE_STRONG
      }
    },
    ['body']
  )
)

/*
body{
    name,
    email,
    passworf,
    confirm_password,
    date_of_birth,
}
 */
export const registerValidator = validate(
  checkSchema(
    {
      name: {
        notEmpty: {
          errorMessage: USER_MESSAGES.NAME_IS_REQUIRED
        },
        isString: {
          errorMessage: USER_MESSAGES.NAME_MUST_BE_A_STRING
        },
        trim: true
      },
      email: {
        notEmpty: {
          errorMessage: USER_MESSAGES.EMAIL_IS_REQUIRED
        },
        isEmail: {
          errorMessage: USER_MESSAGES.EMAIL_IS_INVALID
        },
        trim: true,
        custom: {
          options: async (value, { req }) => {
            const isExist = await userService.checkEmailExist(value)
            if (isExist) {
              throw new Error(USER_MESSAGES.EMAIL_ALREADY_EXISTS)
            }
            return true
          }
        }
      },
      password: passwordSchema,
      confirm_password: confirmPasswordSchema,
      date_of_birth: {
        isISO8601: {
          options: {
            strict: true,
            strictSeparator: true
          }
        }
      }
    },
    ['body']
  )
)

export const accessTokenValidator = validate(
  checkSchema(
    {
      Authorization: {
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            const access_token = value.split(' ')[1]
            if (!access_token) {
              throw new ErrorWithStatus({
                message: USER_MESSAGES.ACCESS_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED // 401
              })
            }
            // 1. verify access_token này xem có phải của server tạo ra không?
            try {
              const decoded_authorization = await verifyToken({
                token: access_token,
                secretOrPublickey: process.env.JWT_SECRET_ACCESS_TOKEN as string
              })
              req.decoded_authorization = decoded_authorization
            } catch (error) {
              throw new ErrorWithStatus({
                message: capitalize((error as JsonWebTokenError).message),
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
            return true
          }
        }
      }
    },
    ['headers']
  )
)

export const refreshTokenValidator = validate(
  checkSchema(
    {
      refresh_token: {
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            // 1. verify refresh_token này xem có phải của server tạo ra không?
            try {
              const decoded_refresh_token = await verifyToken({
                token: value,
                secretOrPublickey: process.env.JWT_SECRET_REFRESH_TOKEN as string
              })
              const refresh_token = await databaseService.refreshTokens.findOne({ token: value })
              if (refresh_token === null) {
                throw new ErrorWithStatus({
                  message: USER_MESSAGES.USED_REFRESH_TOKEN_OR_NOT_EXIST,
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              }
              req.decoded_refresh_token = decoded_refresh_token
              ;(req as Request).decoded_refresh_token = decoded_refresh_token
            } catch (error) {
              // nếu lỗi phát sinh trong quá trình verify thì mình tạo thành lỗi có status
              if (error instanceof JsonWebTokenError) {
                throw new ErrorWithStatus({
                  message: USER_MESSAGES.REFRESH_TOKEN_IS_INVALID,
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              }
              // nếu lỗi k phải dạng JsonWebTokenError
              throw error
            }
            return true
          }
        }
      }
    },
    ['body']
  )
)

export const emailVerifyTokenValidator = validate(
  checkSchema(
    {
      email_verify_token: {
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            //Nếu cái email_verify_token ko gửi lên thì response lỗi
            if (!value) {
              throw new ErrorWithStatus({
                message: USER_MESSAGES.EMAIL_VERIFY_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
            try {
              const decoded_email_verify_token = await verifyToken({
                token: value,
                secretOrPublickey: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string
              })
              ;(req as Request).decoded_email_verify_token = decoded_email_verify_token
            } catch (error) {
              // nếu lỗi phát sinh trong quá trình verify thì mình tạo thành lỗi có status
              if (error instanceof JsonWebTokenError) {
                throw new ErrorWithStatus({
                  message: USER_MESSAGES.REFRESH_TOKEN_IS_INVALID,
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              }
              // nếu lỗi k phải dạng JsonWebTokenError
              throw error
            }
            return true
          }
        }
      }
    },
    ['body']
  )
)

export const resetPasswordValidator = validate(checkSchema({}, ['body']))

export const verifyForgotPasswordTokenValidator = validate(
  checkSchema(
    {
      forgot_password_token: {
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            //Nếu forgot_password_token ko gửi lên thì response lỗi
            if (!value) {
              throw new ErrorWithStatus({
                message: USER_MESSAGES.FORGOT_PASSWORD_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
            try {
              const decoded_forgot_password_token = await verifyToken({
                token: value,
                secretOrPublickey: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string
              })
              ;(req as Request).decoded_forgot_password_token = decoded_forgot_password_token
              const { user_id } = decoded_forgot_password_token as TokenPayload
              const user = await databaseService.user.findOne({ _id: new ObjectId(user_id) })
              if (user === null) {
                throw new ErrorWithStatus({
                  message: USER_MESSAGES.USER_NOT_FOUND,
                  status: HTTP_STATUS.NOT_FOUND
                })
              }
              if (user.forgot_password_token !== value) {
                throw new ErrorWithStatus({
                  message: USER_MESSAGES.FORGOT_PASSWORD_TOKEN_IS_INVALID,
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              }
            } catch (error) {
              // nếu lỗi phát sinh trong quá trình verify thì mình tạo thành lỗi có status
              if (error instanceof JsonWebTokenError) {
                throw new ErrorWithStatus({
                  message: USER_MESSAGES.REFRESH_TOKEN_IS_INVALID,
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              }
              //Nếu có thì xem thử có forgot giống thằng client truyền lên ko
              throw error
            }
            return true
          }
        }
      }
    },
    ['body']
  )
)

export const refreshPasswordValidator = validate(
  checkSchema(
    {
      password: passwordSchema,
      confirm_password: confirmPasswordSchema,
      forgot_password_token: forgotPasswordTokenSchema
    },
    ['body']
  )
)

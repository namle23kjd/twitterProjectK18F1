// 1 ai đó truy cập vào /login
// Client sẽ gửi cho mình usernam và password
// Client sẽ tạo 1 request gửi server
// Thì username vs password sẽ nằm ở req.body
import { verify } from 'crypto'
import e, { Request, Response, NextFunction } from 'express'
import { checkSchema } from 'express-validator'
import { JsonWebTokenError } from 'jsonwebtoken'
import { capitalize, has } from 'lodash'
import HTTP_STATUS from '~/constants/httpStatus'
import { USER_MESSAGES } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import User from '~/models/schemas/User.schema'
import databaseService from '~/services/database.services'
import userService from '~/services/users.services'
import { hashPassword } from '~/utils/crypto'
import { verifyToken } from '~/utils/jwt'
import { validate } from '~/utils/validation'
//Viết 1 middleware xử lý validator của req body
//Khi đăng nhập thì em sẽ đưa cho a gồm mail và password
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
      },
      confirm_password: {
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
              throw new Error('confirm_password must match password')
            }
            return true
          }
        }
      },
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
        notEmpty: {
          errorMessage: USER_MESSAGES.ACCESS_TOKEN_IS_REQUIRED
        },
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
              const decoded_authorization = await verifyToken({ token: access_token })
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
// export const refreshTokenValidator = validate(
//   checkSchema(
//     {
//       refresh_token: {
//         trim: true,
//         notEmpty: {
//           errorMessage: USER_MESSAGES.REFRESH_TOKEN_IS_REQUIRED
//         },
//         custom: {
//           options: async (value: string, { req }) => {
//             // 1. verify refresh_token này xem có phải của server tạo ra không?
//             try {
//               const decoded_refresh_token = await verifyToken({ token: value })
//               const refresh_token = await databaseService.refreshTokens.findOne({ token: value })
//               if (refresh_token === null) {
//                 throw new ErrorWithStatus({
//                   message: USER_MESSAGES.USED_REFRESH_TOKEN_OR_NOT_EXIST,
//                   status: HTTP_STATUS.UNAUTHORIZED
//                 })
//               }
//               req.decoded_refresh_token = decoded_refresh_token
//             } catch (error) {
//               //Nếu lỗi phát sinh trong quá trình verify thì mình tạo thành lỗi có status
//               if (error instanceof ErrorWithStatus) {
//                 throw new ErrorWithStatus({
//                   message: USER_MESSAGES.REFRESH_TOKEN_IS_INVALID,
//                   status: HTTP_STATUS.UNAUTHORIZED
//                 })
//               }
//               throw error
//             }
//             return true
//           }
//         }
//       }
//     },
//     ['body']
//   )
export const refreshTokenValidator = validate(
  checkSchema(
    {
      refresh_token: {
        trim: true,
        notEmpty: {
          errorMessage: USER_MESSAGES.REFRESH_TOKEN_IS_REQUIRED
        },
        custom: {
          options: async (value: string, { req }) => {
            // 1. verify refresh_token này xem có phải của server tạo ra không?
            try {
              const decoded_refresh_token = await verifyToken({ token: value })
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

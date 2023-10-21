// 1 ai đó truy cập vào /login
// Client sẽ gửi cho mình usernam và password
// Client sẽ tạo 1 request gửi server
// Thì username vs password sẽ nằm ở req.body
import { Request, Response, NextFunction } from 'express'
import { checkSchema } from 'express-validator'
import userService from '~/services/users.services'
import { validate } from '~/utils/validation'
//Viết 1 middleware xử lý validator của req body
export const loginValidator = (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body
  //Sau khi lấy đc req từ server thì chúng ta phân rã ra để cho thể check
  if (!email || !password) {
    return res.status(400).json({
      message: ' Missing email or password '
    })
  }
  next()
}

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
  checkSchema({
    name: {
      notEmpty: true,
      isString: true,
      trim: true
    },
    email: {
      notEmpty: true,
      isEmail: true,
      trim: true,
      custom: {
        options: async (value, { req }) => {
          const isExist = await userService.checkEmailExist(value)
          if (isExist) {
            throw new Error('Email already exist')
          }
          return true
        }
      }
    },
    password: {
      notEmpty: true,
      isString: true,
      isLength: {
        options: {
          min: 8,
          max: 50
        }
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
      errorMessage:
        'confirn_password mus be at least 8 characters long and contain at least 1 lowercase letter, 1 uppercase letter, 1 number, and 1 symbol'
    },
    confirm_password: {
      notEmpty: true,
      isString: true,
      isLength: {
        options: {
          min: 8,
          max: 50
        }
      },
      isStrongPassword: {
        options: {
          minLength: 8,
          minLowercase: 1,
          minUppercase: 1,
          minNumbers: 1,
          minSymbols: 1
        }
      },
      errorMessage:
        'confirm_password mus be at least 8 characters long and contain at least 1 lowercase letter, 1 uppercase letter, 1 number, and 1 symbol',
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
  })
)

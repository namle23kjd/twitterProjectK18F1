import jwt from 'jsonwebtoken'
import { config } from 'dotenv'
import { resolve } from 'path'
import { TokenPayload } from '~/models/request/user.request'

export const signToken = ({
  payload,
  privateKey,
  options = { algorithm: 'HS256' }
}: {
  payload: string | object | Buffer
  privateKey: string
  options?: jwt.SignOptions
}) => {
  return new Promise<string>((resolve, reject) => {
    jwt.sign(payload, privateKey, options, (err, token) => {
      if (err) reject(err)
      resolve(token as string)
    })
  })
}

//Hàm ktr token có phải của mình tạo ra hay ko
// nếu có thì trả ra payload
export const verifyToken = ({ token, secretOrPublickey }: { token: string; secretOrPublickey: string }) => {
  return new Promise<TokenPayload>((resolve, reject) => {
    jwt.verify(token, secretOrPublickey as string, (error, decoded) => {
      if (error) reject(error)
      resolve(decoded as TokenPayload)
    })
  })
}
//Server thì luôn luôn resolve với ng
//hàm dùng để tao ra 1 token

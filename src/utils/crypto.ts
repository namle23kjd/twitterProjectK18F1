import { createHash } from 'crypto'
import { config } from 'dotenv'

//Viết 1 cái hàm nhận vào 1 chuỗi và mã hóa theo chuẩn SHA256
function sha256(content: string) {
  return createHash('sha256').update(content).digest('hex')
}

//Viết 1 hàm nhận vào password và mã hóa password đó
export function hashPassword(password: string) {
  return sha256(password + (process.env.PASSWORD_SECRET as string))
}

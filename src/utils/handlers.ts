import { RequestHandler, Request, Response, NextFunction } from 'express'

export const warpAsync = (func: RequestHandler) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await func(req, res, next)
    } catch (error) {
      next(error)
    }
  }
}
//Vì khi mà dùng 1 hàm async thì bản chất nó là 1 promise nên nó có thể chấm catch

import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('[Error Handler]', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Đã có lỗi xảy ra từ máy chủ';

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

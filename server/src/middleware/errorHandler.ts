import { Request, Response, NextFunction } from "express";

interface AppError extends Error {
  status?: number;
  statusCode?: number;
}

const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error(err);

  res.status(err.status ?? err.statusCode ?? 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
};

export default errorHandler;

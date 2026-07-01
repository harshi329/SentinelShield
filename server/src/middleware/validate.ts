import { Request, Response, NextFunction } from "express";
import { ZodTypeAny, ZodError } from "zod";

const validate =
  (schema: ZodTypeAny) =>
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        params: req.params,
        query: req.query,
      });

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Zod v4 uses .errors; v3 used .issues — support both
        const issues =
          (error as ZodError & { errors?: unknown[] }).errors ??
          error.issues;

        res.status(400).json({
          success: false,
          message: "Validation Failed",
          errors: issues,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: "Something went wrong",
      });
    }
  };

export default validate;

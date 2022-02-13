import { Request, Response } from "express"
import { validationResult } from "express-validator"

/**
 * Wrapper for the validationResult method from
 * express-validator. Returns validation errors unless
 * no errors are present. Then moves to next
 */
const validate = (req: Request, res: Response, next: any) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  const extractedErrors: {[x: string]: any}[] = [];
  errors.array().map(err => extractedErrors.push({ [err.param]: err.msg }));

  return res.status(422).json({
    errors: extractedErrors,
  });
}

export { validate };
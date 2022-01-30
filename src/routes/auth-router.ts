import express, { Request, Response } from 'express';

import * as authValidator from '../validation/auth-validator';
import * as authController from '../controllers/auth-controller';
import { validate } from '../validation/validate';

const authRouter = express.Router();

// POST logs into the site
authRouter.post('/login',
    authValidator.validateLogin(), validate,
    async(req: Request, res: Response, next: any) => {
        try { await authController.login(req, res, next) }
        catch(error) { next(error); }
    }
);

// PUT logs out of the site
authRouter.put('/logout',
    async (req: Request, res: Response, next) => {
        try { await authController.logout(req, res, next); }
        catch(error) { next(error); }
    }
);

// POST requests a new access and refresh token, with
// refresh token cookie
authRouter.post('/refresh',
    async (req: Request, res: Response, next: any) => {
        try { await authController.refreshAccessToken(req, res, next); }
        catch(error) { next(error); }
    }
);

export { authRouter };
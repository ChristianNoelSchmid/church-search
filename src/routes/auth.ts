import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';

import { refreshAccessToken, login, logout } from '../controllers/auth-controller';

const authRouter = express.Router();

// POST logs into the site
authRouter.post('/login',

    body('email').isEmail(),
    body('password').isString(),

    async(req: Request, res: Response, next) => {
        const errors = validationResult(req);
        if(errors) {
            return res.status(400).json(errors);
        }
        return await login(req, res, next);
    }
);

// PUT logs out of the site
authRouter.put('/logout',
    async (req: Request, res: Response, next) => {
        await logout(req, res, next);
    }
);
// POST requests a new access and refresh token, with
// refresh token cookie
authRouter.post('/refresh',
    async (req: Request, res: Response, next: any) => {
        await refreshAccessToken(req, res, next);
    }
);

export { authRouter };
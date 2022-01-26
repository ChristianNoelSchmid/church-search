import express from "express";

import { Request, Response } from 'express';

import * as userController from "../controllers/user-controller";
import * as userValidator from "../validation/user-validator";
import { validate } from "../validation/validate";

const userRouter = express.Router();

// GET Read a user account
userRouter.get('/:userId',
    userValidator.validateGetUser(), validate,
    async (req: Request, res: Response, next: any) => {
        return await userController.getUser(req, res, next);
    }
);

// POST Create an Individual User account
userRouter.post('/create/indiv',
    userValidator.validateRegisterIndividual(), validate, 
    async (req: Request, res: Response, next: any) => {
        return await userController.createIndivUser(req, res, next);
    }
);

// GET Confirm a User email address
userRouter.get('/confirm-email/:emailRoute', 
    async (req: Request, res: Response, next) => {
        return await userController.confirmEmail(req, res, next)
    }
);

// POST Create a Church User account
userRouter.post('/create/church', 
    userValidator.validateRegisterChurch(), validate, 
    async (req: Request, res: Response, next: any) => {
        return await userController.createChurchUser(req, res, next);
    }
);

// PUT Update an Individual User account
userRouter.put('/update/indiv',
    async (req: Request, res: Response, next) => {
        await userController.updateIndivUser(req, res, next);
    }
);

// PUT Update a Church User account
userRouter.put('/update/church', 
    async (req: Request, res: Response, next) => {
        await userController.updateChurchUser(req, res, next);
    }
);

// PUT Update a User email
userRouter.put('/update/email',
    userValidator.validateUpdateEmail(), validate,
    async(req: Request, res: Response, next: any) => {
        await userController.updateUserEmail(req, res, next);
    }
);

export { userRouter };
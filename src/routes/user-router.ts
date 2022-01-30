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
        try { await userController.getUser(req, res, next); } 
        catch(error) { next(error); }
    }
);

// POST Create an Individual User account
userRouter.post('/create/indiv',
    userValidator.validateRegisterIndividual(), validate, 
    async (req: Request, res: Response, next: any) => {
        try { await userController.createIndivUser(req, res, next); } 
        catch(error) { next(error); }
    }
);

// GET Confirm a User email address
userRouter.get('/confirm-email/:emailRoute', 
    async (req: Request, res: Response, next) => {
        try { await userController.confirmEmail(req, res, next); }
        catch(error) { next(error); }
    }
);

// POST Create a Church User account
userRouter.post('/create/church', 
    userValidator.validateRegisterChurch(), validate, 
    async (req: Request, res: Response, next: any) => {
        try { await userController.createChurchUser(req, res, next); }
        catch(error) { next(error); }
    }
);

// PUT Update an Individual User account
userRouter.put('/update/user',
    async (req: Request, res: Response, next) => {
        try { await userController.updateUser(req, res, next); }
        catch(error) { next(error); }
    }
);

// PUT Update a User email
userRouter.put('/update/email',
    userValidator.validateUpdateEmail(), validate,
    async(req: Request, res: Response, next: any) => {
        try { await userController.updateUserEmail(req, res, next); }
        catch(error) { next(error); }
    }
);

userRouter.put('/update/password',
    userValidator.validateUpdatePassword(), validate,
    async(req: Request, res: Response, next: any) => {
        try { await userController.updateUserPassword(req, res, next); }
        catch(error) { next(error); }
    }
);

export { userRouter };
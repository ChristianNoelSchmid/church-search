import express from "express";

import { body, validationResult } from 'express-validator';
import { createChurchUser, createIndivUser, updateChurchUser, updateIndivUser } from "../controllers/user_controller";
import { Request, Response } from 'express';

const userRouter = express.Router();

userRouter.post('/create/indiv',

    body('user.email').isEmail(),
    body('user.password').isLength({ min: 8 }),
    body('indiv.firstName').isString(),
    body('indiv.lastName').isString(),

    async (req: Request, res: Response, next) => {

        // Validate the incoming data
        const errors = validationResult(req);
        if(!errors.isEmpty()) {
            res.status(400).json({ errors: errors });
        }

        createIndivUser(req, res, next);
    }
);

userRouter.post('/create/church',
    
    body('user.email').isEmail(),
    body('user.password').isLength({ min: 8 }),
    body('church.name').isString(),
    body('church.address').isString(),

    async (req: Request, res: Response, next) => {

        // Validate the incoming data
        const errors = validationResult(req);
        if(!errors.isEmpty()) {
            res.status(400).json({ errors: errors });
        }

        createChurchUser(req, res, next);
    }
);

userRouter.put('/update/indiv',

    body('user.id').isString(), // TODO - add authorization
    body('user.email').isEmail(),
    body('indiv.firstName').isString(),
    body('indiv.lastName').isString(),

    async (req: Request, res: Response, next) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()) {
            res.status(400).json({ errors: errors });
        }

        updateIndivUser(req.body.user.id, req, res, next);
    }

);

userRouter.post('/update/church',
    
    body('user.id').isString(), // TODO - add authorization
    body('user.email').isEmail(),
    body('church.name').isString(),
    body('church.address').isString(),

    async (req: Request, res: Response, next) => {
        // Validate the incoming data
        const errors = validationResult(req);
        if(!errors.isEmpty()) {
            res.status(400).json({ errors: errors });
        }

        updateChurchUser(req.body.user.id, req, res, next);
    }

);
export { userRouter };
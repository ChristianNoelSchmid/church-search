import express from "express";

import { body, validationResult } from 'express-validator';
import { Request, Response } from 'express';

import { createChurchUser, createIndivUser, getUser, updateChurchUser, updateIndivUser } from "../controllers/user-controller";

const userRouter = express.Router();

// GET Read a user account
userRouter.get('/:userId',

    async (req: Request, res: Response, next) => {
        return await getUser(req, res, next);
    }

);

// POST Create an Individual User account
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

// POST Create a Church User account
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

// PUT Update an Individual User account
userRouter.put('/update/indiv',

    body('user.email').isEmail(),
    body('indiv.firstName').isString(),
    body('indiv.lastName').isString(),

    async (req: Request, res: Response, next) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()) {
            res.status(400).json({ errors: errors });
        }

        updateIndivUser(req, res, next);
    }

);

// PUT Update a Church User account
userRouter.put('/update/church',
    
    body('user.email').isEmail(),
    body('church.name').isString(),
    body('church.address').isString(),

    async (req: Request, res: Response, next) => {
        // Validate the incoming data
        const errors = validationResult(req);
        if(!errors.isEmpty()) {
            res.status(400).json({ errors: errors });
        }

        updateChurchUser(req, res, next);
    }

);

export { userRouter };
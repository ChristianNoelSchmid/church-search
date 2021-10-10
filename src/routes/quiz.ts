import express, { Request, Response } from "express";
import { body, validationResult } from "express-validator";

import { getQuiz, createQuiz } from "../controllers/quiz-controller";

const quizRouter = express.Router();

quizRouter.get("/", async (_req, res: Response, next: any) => {
    return await getQuiz(res, next);
});

quizRouter.post("/create", 

    body('answers').isArray(),

    async (req: Request, res: Response, next: any) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()) {
            return res.status(400).json(errors);
        }

        return await createQuiz(req, res, next);
    }
);

export { quizRouter, };
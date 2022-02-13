import express, { Request, Response } from "express";

import * as quizValidator from "../validation/quiz-validator";
import * as quizController from "../controllers/quiz-controller";
import { validate } from "../validation/validate";

const quizRouter = express.Router();

// GET current quiz
quizRouter.get("/", async (_req, res: Response, next: any) =>
    await quizController.getQuiz(res, next)
);

// POST add an Answer from a unique User
quizRouter.post("/add-answer", 
    quizValidator.validateAddAnswer(), validate,
    async (req: Request, res: Response, next: any) =>
        await quizController.addAnswer(req, res, next)
);

export { quizRouter, };
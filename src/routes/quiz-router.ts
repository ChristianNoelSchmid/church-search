import express, { Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { off } from "process";

import { getQuiz, addAnswer, getQuizTemplate } from "../controllers/quiz-controller";

const quizRouter = express.Router();

quizRouter.get("/", async (_req, res: Response, next: any) => {
    return await getQuiz(res, next);
});

quizRouter.post("/add-answer", 

    body('answer').custom(async answer => {
        if(!answer.choice || !(answer.choice instanceof Number) || answer.choice != Math.floor(answer.choice)) {
            return Promise.reject("Property `choice` must be  given as a whole number.");
        }
        if(!answer.questionId || !(answer.questionId instanceof String)) {
            return Promise.reject("Property `questionId` must be given as a string.");
        } 

        return true;
    }),

    async (req: Request, res: Response, next: any) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()) {
            return res.status(400).json(errors);
        }

        return await addAnswer(req, res, next);
    }
);




export { quizRouter, };
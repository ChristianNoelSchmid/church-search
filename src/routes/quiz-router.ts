import express, { Request, Response } from "express";
import { body, validationResult } from "express-validator";

import { getQuiz, createQuiz, getQuizTemplate } from "../controllers/quiz-controller";

const quizRouter = express.Router();

quizRouter.get("/", async (_req, res: Response, next: any) => {
    return await getQuiz(res, next);
});

quizRouter.post("/create", 

    body('answers').custom(async answers => {
        if(!Array.isArray(answers)) {
            return Promise.reject("Answers must be given as an array.");
        }
        const template = await getQuizTemplate();
        if(answers.length != template.questions.split(":").length)
            return Promise.reject("Answer count does not match length of template.");

        const answerInts = answers.map(answer => Number.parseInt(answer));
        if(answerInts.some(answerInt => Number.isNaN(answerInt) || answerInt < 1 || answerInt > 5)) {
            return Promise.reject("One or more answers invalid.");
        }

        return true;
    }),

    async (req: Request, res: Response, next: any) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()) {
            return res.status(400).json(errors);
        }

        return await createQuiz(req, res, next);
    }
);




export { quizRouter, };
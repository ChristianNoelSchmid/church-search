import { Request, Response } from 'express';

import { Question } from '@prisma/client';
import { prisma } from '../client';
import { requireAuthorization } from '../middleware/auth';

// #region Exported Functions

// Retrieves the current series of answers from the current template
const getQuiz = async (res: Response, next: any) => {
    try {
        // Get the current QuizTemplate, throwing an Error if it is not defined
        const questions = await getQuizTemplate();
        return res.status(200).json({ questions });
    } catch(error) { return next(error); }
}

const getAnswers = async (req: Request, res: Response, next: any) => {
    try {
        if(!req.userId)
            return res.status(401).send("Unauthorized: please login.");

        const answers = (await prisma.answer.findMany({
            where: { userId: req.userId }
        }));

        return res.status(200).json({ answers });
    } catch(error) { return next(error); }
}

const addAnswer = async (req: Request, res: Response, next: any) => {
    const answer = req.body.answer;

    const questions = await getQuizTemplate();
    const updateQuestionIndex = questions.findIndex(q => q.id == answer.questionId);

    // If the answer is for a question that either doesn't exist, or
    // isn't being used in the current quiz template, return bad request.
    if(updateQuestionIndex == -1) {
        return Promise.reject("Question ID is not current, or no longer exists.");
    }
    
    try {
        // If a user is logged in, add / update their answer in the database
        if(req.userId) {  
            await prisma.answer.upsert({
                where: { id: {
                    userId: req.userId, 
                    questionId: answer.questionId
                } }, 
                update: { 
                    choice: answer.choice,
                },
                create: {
                    userId: req.userId,
                    questionId: answer.questionId,
                    choice: answer.choice,
                }
            });
        // Otherwise append the answer to the cookie
        } else {
            let answerString = req.cookies.quiz;
            if(!answerString) answerString = ":".repeat(questions.length - 1);

            const answers = answerString.split(":");
            answers.splice(updateQuestionIndex, 1, answer.choice);

            res.cookie('quiz', answers.join(':'));
            return res.status(200);
        }

        return next();
    } catch(error) { return next(error); }
}

const getQuizTemplate = async (): Promise<Question[]> => {
    // Get the template Id from env
    const templateIdStr = process.env.QUIZ_TEMPLATE;
    if(templateIdStr == null) {
        throw new QuizTemplateNotDefinedError();
    }

    // Parse the Id into an integer
    const templateId = Number.parseInt(templateIdStr);
    if(isNaN(templateId)) {
        throw new QuizTemplateNotDefinedError();
    }

    // Return the template
    const qtt = (await prisma.quizTemplate.findFirst({
        where: { id: templateId },
        include: { qToTemp: {
            include: { question: true }
        } },
    }))?.qToTemp;

    qtt?.sort((q1, q2) => q1.qIndex - q2.qIndex);
    const questions = qtt?.map(q => q.question);

    if(!questions)
        throw new QuizTemplateNotDefinedError();

    return questions;
}
// #endregion

class QuizTemplateNotDefinedError extends Error { }

export {
    getQuiz,
    getQuizTemplate,
    addAnswer
};
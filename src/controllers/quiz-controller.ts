import { Request, Response } from 'express';

import { Question } from '@prisma/client';
import { prisma } from '../client';

// #region Exported Functions
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
    try {
        const answer = req.body.answer;

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
        } else {
            let answers: string[] = req.cookies['quiz'].split(':');
            answers.splice(answer.)
        }

        return next();
    } catch(error) { return next(error); }
}

const createQuiz = async (req: Request, res: Response, next: any) => { 
    try { 
        // Get the current QuizTemplate, throwing an Error if it is not defined
        const questions = await getQuizTemplate();        

        // Ensure the number of answers given match the number
        // of questions from the template
        const answers: number[] = req.body.answers;
    
        // If a user is logged in, insert the quiz into the database
        // connected to the user's Id.
        if(req.userId) {
            const newQuiz = await prisma.quiz.create({
                data: {
                    answers: answers.join(':'),
                    templateId: template.id,
                    userId: req.userId,
                }
            });

            return res.status(200).json(newQuiz);

        // If not, assign the quiz to a cookie
        } else {
            const quizCookie = answers.join(':');
            res.cookie('quiz', quizCookie);

            return res.status(200).json({ answers: quizCookie });
        }
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
    createQuiz,  
    getQuizTemplate
};
import { Request, Response } from 'express';

import { QuizTemplate } from '@prisma/client';
import { prisma } from '../client';

// #region Exported Functions
const getQuiz = async (res: Response, next: any) => {
    try {
        // Get the current QuizTemplate, throwing an Error if it is not defined
        const template = await _getQuizTemplate();
        return res.status(200).json({ questions: template.questions });
    } catch(error) { return next(error); }
}

const createQuiz = async (req: Request, res: Response, next: any) => { 
    try { 
        // Get the current QuizTemplate, throwing an Error if it is not defined
        const template = await _getQuizTemplate();        

        // Ensure the number of answers given match the number
        // of questions from the template
        const answers: number[] = req.body.answers;
        const questions = template.questions.split(':');
    
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
// #endregion

// #region Internal Functions
const _getQuizTemplate = async (): Promise<QuizTemplate> => {
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
    const template = await prisma.quizTemplate.findFirst({
        where: { id: templateId },
    });

    if(template == null)
        throw new QuizTemplateNotDefinedError();

    return template;
}
// #endregion Internal Functions

class QuizTemplateNotDefinedError extends Error { }

export {
    getQuiz,
    createQuiz,  
    _getQuizTemplate
};
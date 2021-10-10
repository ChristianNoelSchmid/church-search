import { Request, Response } from 'express';
import { prisma } from '../client';

const getQuiz = async (res: Response, next: any) => {
    try {
        // Get the current QuizTemplate, throwing an Error if it is not defined
        const template = await _getQuizTemplate();
        if(!template) throw new QuizTemplateNotDefinedError();

        return res.status(200).json({ questions: template.questions });  
    } catch(error) { return next(error); }
}

const createQuiz = async (req: Request, res: Response, next: any) => { 
    try { 
        // Get the current QuizTemplate, throwing an Error if it is not defined
        const template = await _getQuizTemplate();        
        if(!template) throw new QuizTemplateNotDefinedError();

        // Ensure the number of answers given match the number
        // of questions from the template
        const answers: number[] = req.body.answers;
        const questions = template.questions.split(':');
    
        if(answers.length != questions.length) {
            return res.status(400).json({ msg: "Did not have correct number of answers." });
        }
        if(answers.some(answer => answer < 1 || answer > 5)) {
            return res.status(400).json({ msg: "One or more of your answers is invalid." })
        }

        if(req.userId) {
            const newQuiz = await prisma.quiz.create({
                data: {
                    answers: answers.join(':'),
                    templateId: template.id,
                    userId: req.userId,
                }
            });

            return res.status(200).json(newQuiz);
        } else {
            const quizCookie = answers.join(':');
            res.cookie('quiz', quizCookie);

            return res.status(200).json({ answers: quizCookie });
        }
    } catch(error) { return next(error); }
}

const _getQuizTemplate = async () => {
    // Get the template Id from env
    const templateIdStr = process.env.QUIZ_TEMPLATE;
    if(templateIdStr == null) {
        return null;
    }

    // Parse the Id into an integer
    const templateId = Number.parseInt(templateIdStr);
    if(isNaN(templateId)) {
        return null;
    }

    // Return the template
    const template = await prisma.quizTemplate.findFirst({
        where: { id: templateId },
    });

    return template;
}

class QuizTemplateNotDefinedError extends Error { }

export {
    getQuiz,
    createQuiz,  
};
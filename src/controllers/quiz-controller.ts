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
    
        if(answers.length != questions.length) {
            return res.status(400).json({ msg: "Did not have correct number of answers." });
        }
        if(answers.some(answer => answer < 1 || answer > 5) || answers.some(answer => !Number.isInteger(answer))) {
            return res.status(400).json({ msg: "One or more of your answers is invalid." })
        }

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

const pairQuizzes = async(req: Request, res: Response, next: any) => {
    try { 
        const quiz = await _getUserQuiz(req, res);
        if(quiz == null) return; 
        
        // TODO - limit by geographical location - add Google Geocoding API
        const churchUsers = (await prisma.user.findMany({
            where: { 
                userType: "Church",
                NOT: { quiz: null, },
            },
            include: { 
                church: true, 
                quiz: true 
            },
        })).map(user => { return {
            id: user.id,
            name: user.church!.name,
            scores: user.quiz!.answers.split(':')
                .map(score => Number.parseInt(score))
        }});

        const churchUserScores = churchUsers.map(user => { return {
            id: user.id,
            name: user.name,
            scores: user.scores,
            match: _getMatchPercentage(quiz, user.scores)
        }});

        churchUserScores.sort(user => user.match);
        return res.status(200).json({ churchUserScores });

    } catch (error) { 
        if(error instanceof UserSignedInAsChurchError)
            return res.status(400).json({ msg: "This service cannot be used with church profiles." });
        if(error instanceof QuizDoesNotExistError)
            return res.status(404).json({ msg: "Please take the quiz or sign in." });
        if(error instanceof MalformedQuizError) 
            return res.status(400).json({ msg: "There was a problem parsing the quiz." });
        return next(error); 
    }
};
// #endregion

// #region Private Functions

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

const _getUserQuiz = async (req: Request, res: Response): Promise<number[]> => {

    const quizTemplate = await _getQuizTemplate();
    let quizValues: string[];
    if(req.userId) {
        const user = req.user!;
        const tempQuiz = await prisma.quiz.findFirst({
            where: { userId: req.userId }
        });

        if(user.userType == "Church") throw new UserSignedInAsChurchError();        
        if(tempQuiz == null) throw new QuizDoesNotExistError();

        quizValues = tempQuiz.answers.split(':');
    } else {
        if(req.cookies.quiz == null) throw new QuizDoesNotExistError();
        quizValues = req.cookies.quiz!.split(':');
    }

    const quiz = quizValues.map(val => Number.parseInt(val));
    if(quiz.some(val => Number.isNaN(val))) throw new MalformedQuizError();
    if(quiz.length != quizTemplate.questions.split(':').length) throw new MalformedQuizError();

    return quiz;
}

const _getMatchPercentage = (indivScores: number[], churchScores: number[]) => {
    return indivScores.map((u, i) => [u, churchScores[i]]  )
        .map(scores => 100 * (Math.abs(scores[0] - scores[1])) / 5)
        .reduce((a, b) => a + b) / indivScores.length;
}
// #endregion Private Functions

// #region Errors
class QuizTemplateNotDefinedError extends Error { }
class UserSignedInAsChurchError extends Error { }
class QuizDoesNotExistError extends Error { }
class MalformedQuizError extends Error { }
// #endregion Errors

export {
    getQuiz,
    createQuiz,  
    pairQuizzes,
};
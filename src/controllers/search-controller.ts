import { Request, Response } from 'express';
import { prisma } from '../client';

import { getQuizTemplate } from './quiz-controller';

// #region Exported Functions
/**
 * Searches all users, individual and church
 */
const searchUsers = async (req: Request, res: Response, next: any) => {
    try {
        const { searchParams } = req.body;
        const users = await prisma.user.findMany({
            where: { } // Query 
        });
    }   catch(error) { next(error); }
}

/**
 * Searches churches in the region using the individual's quiz
 * @returns The list of churchs' with their names, quiz scores, and match percentage
 */
const searchChurches = async(req: Request, res: Response, next: any) => {
    try { 
        const quiz = await _getUserQuiz(req, res);
        if(quiz == null) return; 
        
        // TODO - limit by geographical location - add Google Geocoding API
        const churchUsers = (await prisma.user.findMany({
            where: { 
                userType: "Church",
                NOT: { answers: undefined, },
            },
            include: { 
                church: true, 
                answers: true 
            },
        })).map(user => { return {
            id: user.id,
            name: user.church!.name,
            scores: user.answers.split(':')
                .map(score => Number.parseInt(score))
        }});

        const churchUserScores = churchUsers.map(user => { return {
            id: user.id,
            name: user.name,
            scores: user.scores,
            match: _getMatchValue(quiz, user.scores)
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
// #endregion Exported Functions

// #region Private Functions
const _getUserQuiz = async (req: Request, res: Response): Promise<number[]> => {

    const quizTemplate = await getQuizTemplate();
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
    if(quiz.some(val => Number.isNaN(val) || val < 0 || val > 5)) throw new MalformedQuizError();
    if(quiz.length != quizTemplate.questions.split(':').length) throw new MalformedQuizError();

    return quiz;
}

const _getMatchValue = (indivScores: number[], churchScores: number[]) => {
    return indivScores.map((u, i) => [u, churchScores[i]]  )
        .map(scores => 100 * (Math.abs(scores[0] - scores[1])) / 5)
        .reduce((a, b) => a + b) / indivScores.length;
}
// #endregion Private Functions

// #region Errors
class UserSignedInAsChurchError extends Error { }
class QuizDoesNotExistError extends Error { }
class MalformedQuizError extends Error { }
// #endregion Errors

export {
    searchUsers,
    searchChurches,
}
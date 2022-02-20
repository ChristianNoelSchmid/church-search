import { Answer, Church, Question, User, UserType } from '@prisma/client';
import { Request, Response } from 'express';
import { prisma } from '../client';
import { ChurchUserScores, ChurchWithAnswers } from '../models';

import * as quizService from '../services/quiz-service';

// #region Exported Functions
/**
 * Searches churches in the region using the individual's quiz
 * @returns The list of churchs' with their names, quiz scores, and match percentage
 */
const searchChurches = async(req: Request, res: Response, next: any) => {
    try { 
        const questions = await quizService.getQuizQuestions();
        const answers = await quizService.loadUserAnswers();
 
        // TODO - limit by geographical location - add Google Geocoding API
        const churchUsers = (await prisma.user.findMany({
            where: { 
                userType: UserType.Church,
                NOT: { answers: undefined, },
            },
            include: { 
                church: true, 
                answers: {
                    where: { questionId: { 
                        in: questions.map(q => q.id)
                    } },
                    include: { question: true },
                }
            },
        }));

        const churchUserScores = churchUsers.map(churchUser => { 
            return {
                church: churchUser.church,
                match: _getMatchValue(answers, churchUser)
            } as ChurchUserScores;
        });

        churchUserScores.sort(score => score.match);
        res.status(200).json(churchUserScores);

    } catch (error) { 
        if(error instanceof UserSignedInAsChurchError)
            res.status(400).send("This service cannot be used with church profiles.");
        else if(error instanceof QuizDoesNotExistError)
            res.status(404).send("Please take the quiz or sign in.");
        else if(error instanceof MalformedQuizError) 
            res.status(400).send("There was a problem parsing the quiz.");
        else next(error); 
    }
};
// #endregion Exported Functions

// #region Private Functions
const _getMatchValue = (indivAnswers: Answer[], churchWithAnswers: ChurchWithAnswers): number => {
    // The total match value (0%-100%)
    let total = 0;
    let answerCount = 0;

    indivAnswers.forEach(answer => {
        // Retrieve the matching Church Answer
        const churchAnswer = churchWithAnswers.answers
            .find(answer => answer.questionId = answer.questionId);

        // If the Church has answered the given Question,
        // add 100 divided by the ratio between the two Answers
        if(churchAnswer != null) {
            const difference = Math.abs(churchAnswer.choice - answer.choice);
            const ratio = churchAnswer.question.choices.length / (difference + 1);
            // Plus one to avoid division by 0

            total += 100 * ratio; 
            answerCount += 1;
        }
    });
    // Finally, divide by the number of Answers considered
    total /= answerCount;
    return total;
}
// #endregion Private Functions

// #region Errors
class UserSignedInAsChurchError extends Error { }
class QuizDoesNotExistError extends Error { }
class MalformedQuizError extends Error { }
// #endregion Errors

export {
    searchChurches,
}
import { Request, Response } from 'express';
import { prisma } from '../client';
import * as quizService from '../services/quiz-service'

// #region Exported Functions
// Retrieves the current series of answers from the current template
const getQuiz = async (res: Response, next: any) => {
    try {
        // Get the current QuizTemplate, throwing an Error if it is not defined
        const questions = await quizService.getQuizQuestions();
        return res.status(200).json({ questions });
    } catch(error) { return next(error); }
}

/**
 * Retrieves an authorized User's answers.
 */
const getAnswers = async (req: Request, res: Response) => {
    const questions = await quizService.getQuizQuestions();
    if(req.userId) {
        const answers = (await prisma.answer.findMany({
            where: { 
                userId: req.userId,
                questionId: { in: questions.map(q => q.id) } 
            },
            include: { question: true },
        }));

        return res.status(200).json({ answers });
    } else if(req.cookies.quiz) {
        return res.status(200).json({ answers: req.cookies.quiz.split(":") });
    } else {
        return res.status(200).json({ anwers: Array(questions.length).fill(undefined) })
    }
}

const addAnswer = async (req: Request, res: Response, next: any) => {
    const answerData = req.body.answer;

    const questions = await quizService.getQuizQuestions();
    const updateQuestionIndex = questions.findIndex(q => q.id == answerData.questionId);

    // If the answer is for a question that either doesn't exist, or
    // isn't being used in the current quiz template, return bad request.
    if(updateQuestionIndex == -1) {
        return Promise.reject("Question ID is not current, or does not / no longer exists.");
    }
    
    // If a user is logged in, add / update their answer in the database
    if(req.userId) {  
        await prisma.answer.upsert({
            where: { id: {
                userId: req.userId, 
                questionId: answerData.questionId
            } }, 
            update: { 
                choice: answerData.choice,
            },
            create: {
                userId: req.userId,
                questionId: answerData.questionId,
                choice: answerData.choice,
            }
        });
        return res.status(200).send("Answer updated");
    // Otherwise append the answer to the cookie
    } else {
        let answers: string[] = req.cookies.quiz?.split(':');
        if(!answers) answers = [];

        for(let i = 0; i < answers.length; ++i) {
            if(Number.parseInt(answers[i].split(';')[0]) == answerData)
                answers.splice(i, 1);
        }
        
        answers.push(`${answerData.questionId};${answerData.choice}`);

        res.cookie('quiz', answers.join(':'));
        return res.status(200).send("Answer updated");
    }
}
// #endregion Exported Functions

export {
    getQuiz,
    getAnswers,
    addAnswer,
};
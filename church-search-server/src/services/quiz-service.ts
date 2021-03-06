import { Answer, Question, QuestionToTemplate, QuizTemplate } from "@prisma/client";
import express from "express";
import { prisma } from "../client";

const getQuizQuestions = async (): Promise<Question[]> => {
    // Get the template Id from env
    const templateIdStr = process.env.QUIZ_TEMPLATE;
    if(templateIdStr == null) {
        throw new QuizTemplateNotChosenError();
    }

    // Parse the Id into an integer
    const templateId = Number.parseInt(templateIdStr);
    if(isNaN(templateId)) {
        throw new QuizTemplateNotChosenError();
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
        throw new QuizTemplateNotChosenError();

    return questions;
}
const loadUserAnswers = async (): Promise<Answer[]> => {
    const req = express.request;
    const questions = await getQuizQuestions();
    if(req.userId) {
        const answers = (await prisma.answer.findMany({
            where: { 
                userId: req.userId,
                questionId: { in: questions.map(q => q.id) } 
            },
            include: { question: true },
        }));
        return answers;

    } else if(req.cookies.quiz) {
        const answerText = req.cookies.quiz.split(":");
        const answers: Answer[] = [];
        answerText.forEach((answer: string) => {
            const [questionId, choice] = [
                Number.parseInt(answer.split(';')[0]),
                Number.parseInt(answer.split(';')[1])
            ];

            answers.push({ questionId, choice } as Answer);
        });
        return answers;
    } 
    else return [];
}

class QuizTemplateNotChosenError extends Error { }

export {
    getQuizQuestions,
    loadUserAnswers,
};
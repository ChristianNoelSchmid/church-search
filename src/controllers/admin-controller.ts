import { Question, QuestionToTemplate, QuizTemplate, Role } from "@prisma/client";
import { Request, Response } from "express";
import { prisma } from "../client";
import { requireAuthorization } from "../middleware/auth";

type QuizTemplateWithQuestions = QuizTemplate & { qToTemp: QuestionToTemplate[] }

// #region Public Functions
const createQuizTemplate = async (req: Request, res: Response, next: any) => {
    requireAuthorization(Role.Admin, async () => {
        const template = await _generateQuizTemplate();
        return res.status(201).json({ quizTemplate: template });
    });
}

const duplicateQuizTemplate = async (req: Request, res: Response, next: any) => {
    requireAuthorization(Role.Admin, async () => {
        const template = await _generateQuizTemplate(req.body.templateId);
        return res.status(201).json({ quizTemplate: template });
    });
}

const addQuestionToTemplate = async (req: Request, res: Response, next: any) => {
    requireAuthorization(Role.Admin, async () => {
        const question = await _associateQuestionToTemplate(
            req.body.questionId,  req.body.qIndex
        );
        res.status(200).send("Added");
    });
};

const createNewQuestion = async (req: Request, res: Response, next: any) => {
    requireAuthorization(Role.Admin, async () => {
        const question = await _createQuestion(
            req.body.templateId, req.body.text, 
            req.body.choices.join(":")
        );
        res.status(201).json({ question });
    });
};
// #endregion

// #region Private Functions
// Generates a new Quiz Template, either from a provided template or from scratch
const _generateQuizTemplate = async (toDuplicate: QuizTemplateWithQuestions | undefined = undefined): Promise<QuizTemplateWithQuestions> => {
    const templateId = (await prisma.quizTemplate.create({ 
        data: {}, 
    })).id;
    if(toDuplicate) {
        for(let i = 0; i < toDuplicate.qToTemp.length; ++i) {
            await prisma.questionToTemplate.create({
                data: {
                    qIndex: toDuplicate.qToTemp[i].qIndex,
                    templateId: templateId,
                    questionId: toDuplicate.qToTemp[i].questionId,
                }
            });
        }
    }

    return (await prisma.quizTemplate.findFirst({
        where: { id: templateId },
        include: { qToTemp: true },
    }))!;
}
const _associateQuestionToTemplate = async (questionId: number, templateId: number, qIndex: number | undefined = undefined) => {
    const template = await prisma.quizTemplate.findFirst({
        where: { id: templateId },
        include: { qToTemp: true },
    });
    if(template == null) throw new QuizTemplateDoesNotExistError();
    if(!qIndex || qIndex < 0 || qIndex > template.qToTemp.length) 
        qIndex = template.qToTemp.length;

    await prisma.questionToTemplate.upsert({
        where: { id: { questionId, templateId, } },
        create: { qIndex, questionId, templateId, },
        update: { qIndex  },
    });
}
const _createQuestion = async (templateId: number, text: string, choices: string): Promise<Question> => {
    const template = await prisma.quizTemplate.findFirst({
        where: { id: templateId },
        include: { qToTemp: true },
    });
    if(template == null) throw new QuizTemplateDoesNotExistError(); 

    const question = await prisma.question.create({
        data: { text, choices }
    });

    await prisma.questionToTemplate.create({
        data: { templateId, questionId: question.id, qIndex: template.qToTemp.length }
    });

    return question;
}
const _duplicateQuestion = async (questionId: number, templateTo: number) => {

    const template = prisma.quizTemplate.findFirst({ 
        where: { id: templateTo },
        include: { qToTemp: true },
    });
    if(template == null) throw new QuizTemplateDoesNotExistError(); 

    const qToT = prisma.questionToTemplate.findFirst({
        where: { questionId, templateId: templateTo }
    });

    if(qToT != null) throw new QuestionAlreadyDefinedOnTemplateError();
    const question = await prisma.questionToTemplate.create({
        data: {
            questionId,
            templateId: templateTo,
            qIndex: template.qToTemp.length
        }
    });
}
// #endregion Private Functions

class QuizTemplateDoesNotExistError extends Error { }
class QuestionAlreadyDefinedOnTemplateError extends Error { }

export {
    createQuizTemplate,
    duplicateQuizTemplate,
    addQuestionToTemplate,
    createNewQuestion,
} 
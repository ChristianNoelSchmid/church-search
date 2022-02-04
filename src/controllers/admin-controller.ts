import { Question, QuestionToTemplate, QuizTemplate, Role } from "@prisma/client";
import { Request, Response } from "express";
import { prisma } from "../client";
import { requireAuthorization } from "../middleware/auth";

type QuizTemplateWithQuestions = QuizTemplate & { qToTemp: QuestionToTemplate[] }

// #region Public Functions
/**
 * Creates a new QuizTemplate, from scratch
 */
const createQuizTemplate = async (req: Request, res: Response) => {
    requireAuthorization(Role.Admin, async () => {
        const template = await _generateQuizTemplate();
        return res.status(201).json({ quizTemplate: template });
    });
}

/**
 * Duplicates a new QuizTemplate from a previous one,
 * copying the questions in the duplicated QuizTemplate as
 * references. Does not duplicate the Questions
 */
const duplicateQuizTemplate = async (req: Request, res: Response) => {
    requireAuthorization(Role.Admin, async () => {
        const template = await _generateQuizTemplate(req.body.templateId);
        return res.status(201).json({ quizTemplate: template });
    });
}

/**
 * Creates a new Question, associated with a QuestionTemplate
 */
const createNewQuestion = async (req: Request, res: Response) => {
    requireAuthorization(Role.Admin, async () => {
        const question = await _createQuestion(
            req.body.text, req.body.choices.join(":"),
            req.body.templateId
        );
        res.status(201).json({ question });
    });
};

/**
 * Duplicates a Question by value, creating a unique reference
 * with the same data.
 */
const duplicateQuestion = async (req: Request, res: Response) => {
    requireAuthorization(Role.Admin, async () => {
        const question = await _duplicateQuestion(
            req.body.questionId, req.body.templateId
        );
        res.status(201).json({ question });
    });
}

/**
 * Associates a Question with a QuizTemplate by reference. Does
 * not duplicate the Question. If the question is already included in the
 * QuizTemplate, changes the order by qIndex
 */
const associateQuestionToTemplate = async (req: Request, res: Response) => {
    requireAuthorization(Role.Admin, async () => {
        const question = await _associateQuestionToTemplate(
            req.body.questionId,  req.body.templateId, req.body.qIndex
        );
        res.status(200).json({ question });
    });
};

const editQuestion = async (req: Request, res: Response) => {
    requireAuthorization(Role.Admin, async () => {
        const question = await prisma.question.update({
            where: { id: req.body.questionId, },
            data: {
                choices: req.body.choices.join(":"),
                text: req.body.text,
            },
        });

        return res.status(200).json({ question });
    });
}

const deleteQuizTemplate = async (req: Request, res: Response) => {
    requireAuthorization(Role.Admin, async () => {
        await _deleteQuizTemplate(req.body.templateId, req.body.deleteReferences ?? false);
        res.status(200).send("Deleted");
    });
}

const deleteQuestion = async (req: Request, res: Response) => {
    requireAuthorization(Role.Admin, async () => {
        await _deleteQuestion(req.body.questionId);
        res.status(200).send("Deleted");
    });
}

const removeQuestionFromTemplate = async (req: Request, res: Response) => {
    requireAuthorization(Role.Admin, async () => {
        await _removeQuestionFromTemplate(req.body.templateId, req.body.questionId);
        res.status(200).send("Deleted");
    });
}
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

// Creates a relationship between a QuizTemplate and Question (using QuestionToTemplate).
// If relationship already exists, updates qIndex. Otherwise, creates new relationship with qIndex
const _associateQuestionToTemplate = async (questionId: number, templateId: number, qIndex: number | undefined = undefined) => {
    // First find the QuizTemplate, throwing an error if it doesn't exist
    const template = await prisma.quizTemplate.findFirst({
        where: { id: templateId },
        include: { qToTemp: { orderBy: { qIndex: "asc" } } },
    });
    if(template == null) throw new QuizTemplateDoesNotExistError();

    // If qIndex isn't defined, set it to the length of items in the template
    // (to be adjusted below)
    if(!qIndex) qIndex = template.qToTemp.length;

    // Ensure qIndex is between 0..template.qToTemp length if the Question is not
    // yet in the list (aka, adding a new Question to the template), and
    // 0..template.qToTemp length - 1 if it is.
    if(template.qToTemp.some(qtt => qtt.questionId == questionId)) {
        qIndex = Math.min(qIndex, template.qToTemp.length - 1);
    } else {
        qIndex = Math.min(qIndex, template.qToTemp.length);
    }
    qIndex = Math.max(qIndex, 0);

    // Determine if the Question is already associated with the given QuizTemplate
    let qtt = template.qToTemp.find(qtt => qtt.questionId == questionId);

    // If the Question already exists in the template shift all questions
    // to the right of the moved Question left by 1
    if(qtt) {
        _updateUpperQIndices(qtt, template);
    }
    // Shift every QuestionToTemplate that has qIndex >= new Question's qIndex up 1
    for(let i = qIndex; i < template.qToTemp.length; ++i) {
        await prisma.questionToTemplate.update({
            where: { id: { 
                questionId: template.qToTemp[i].questionId,
                templateId: template.qToTemp[i].templateId 
            } },
            data: {
                qIndex: i + 1
            },
        });
    }

    await prisma.questionToTemplate.upsert({
        where:  { id: { questionId, templateId, } },
        create: { qIndex, questionId, templateId, },
        update: { qIndex  },
    });
}

const _createQuestion = async (text: string, choices: string, templateId: number | undefined = undefined): Promise<Question> => {
    const template = await prisma.quizTemplate.findFirst({
        where: { id: templateId },
        include: { qToTemp: true },
    });
    if(template == null) throw new QuizTemplateDoesNotExistError(); 

    const question = await prisma.question.create({
        data: { text, choices }
    });

    if(templateId) {
        await prisma.questionToTemplate.create({
            data: { templateId, questionId: question.id, qIndex: template.qToTemp.length }
        });
    }

    return question;
}

const _duplicateQuestion = async (questionId: number, templateId: number | undefined) => {
    // Find the Question to duplicate
    const questionToDuplicate = await prisma.question.findFirst({
        where: { id: questionId },
        include: { qToTemp: true },
    });

    // Throw error if it doesn't exist, or if templateId is defined
    // and the Question is already associated with the QuizTemplate
    if(!questionToDuplicate) {
        throw new QuestionDoesNotExistError();
    } else if(questionToDuplicate.qToTemp.some(qtt => qtt.templateId == templateId)) {
        throw new QuestionAlreadyDefinedOnTemplateError();
    } 

    // Duplicate the Question
    const newQuestion = await prisma.question.create({
        data: {
            text: questionToDuplicate.text,
            choices: questionToDuplicate.choices
        }
    });

    // If there is a templateId given, associate the Question
    // to the QuizTemplate
    if(templateId) {
        _associateQuestionToTemplate(newQuestion.id, templateId);
    }
}

const _deleteQuizTemplate = async (id: number, deleteReferences: boolean) => {
    const template = await prisma.quizTemplate.delete({
        where: { id },
        include: { qToTemp: deleteReferences },
    });

    if(template != null && deleteReferences) {
        template.qToTemp.forEach(async qtt => await _deleteQuestion(qtt.questionId));
    }
}

const _deleteQuestion = async (questionId: number) => {
    const removedQuestion = await prisma.question.delete({
        where: { id: questionId, },
        include: { qToTemp: { 
            include: { template: 
                { include: { qToTemp: true }, },
            },
        }, }
    });

    if(removedQuestion != null) {
        removedQuestion.qToTemp.forEach(qtt => {
            _updateUpperQIndices(qtt, qtt.template);
        })
    }
}

const _removeQuestionFromTemplate = async (templateId: number, questionId: number) => {
    const removedQtt = await prisma.questionToTemplate.delete({
        where: { id: { templateId, questionId } },
        include: { template: { include: { qToTemp: true } } },
    });

    if(removedQtt != null) {
        await _updateUpperQIndices(removedQtt, removedQtt.template);
    }
}

// Shifts all qIndices of the given quiz template that come after the removed
// qIndex left, thereby fixing the gap between indices. 
const _updateUpperQIndices = async (removedQtt: QuestionToTemplate, template: QuizTemplateWithQuestions) => {
    for(let i = removedQtt.qIndex + 1; i < template.qToTemp.length; ++i) {
        const qtt = template.qToTemp[i];
        await prisma.questionToTemplate.update({
            where: { id: { questionId: qtt.questionId, templateId: qtt.templateId } },
            data: { qIndex: qtt.qIndex - 1 },
        });
    }
}
// #endregion Private Functions

class QuizTemplateDoesNotExistError extends Error { }
class QuestionAlreadyDefinedOnTemplateError extends Error { }
class QuestionDoesNotExistError extends Error { }

export {
    createQuizTemplate,
    duplicateQuizTemplate,
    associateQuestionToTemplate,
    createNewQuestion,
    duplicateQuestion,
    editQuestion,
    deleteQuizTemplate,
    deleteQuestion,
    removeQuestionFromTemplate,
} 